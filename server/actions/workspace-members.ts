"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { PermissionError, requireUser, requireWorkspace } from "@/lib/permissions";
import { canManageWorkspaceMember, invitableRoles } from "@/lib/roles";
import {
  acceptInviteSchema,
  createInviteSchema,
  removeWorkspaceMemberSchema,
  revokeInviteSchema,
  updateWorkspaceMemberSchema,
} from "@/lib/validators/member";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function findMember(workspaceId: string, userId: string) {
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new UserError("Membre introuvable");
  return member;
}

async function assertAnotherOwner(workspaceId: string, userId: string) {
  const owners = await db.workspaceMember.count({
    where: { workspaceId, role: "OWNER", userId: { not: userId } },
  });
  if (owners === 0) throw new UserError("L'espace doit garder au moins un propriétaire");
}

export async function updateWorkspaceMember(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, userId, role } = updateWorkspaceMemberSchema.parse(input);
    const { workspace, role: actorRole } = await requireWorkspace(workspaceSlug, "ADMIN");
    const target = await findMember(workspace.id, userId);
    if (!canManageWorkspaceMember(actorRole, target.role, role)) throw new PermissionError();
    if (target.role === "OWNER" && role !== "OWNER") await assertAnotherOwner(workspace.id, userId);

    await db.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
      data: { role },
    });
    revalidatePath(`/${workspaceSlug}`, "layout");
  });
}

/** Retire un membre (ou soi-même : « quitter l'espace ») et ses accès aux projets de l'espace. */
export async function removeWorkspaceMember(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, userId } = removeWorkspaceMemberSchema.parse(input);
    const { user, workspace, role: actorRole } = await requireWorkspace(workspaceSlug);
    const target = await findMember(workspace.id, userId);
    const isSelf = userId === user.id;
    if (!isSelf && !canManageWorkspaceMember(actorRole, target.role, null)) {
      throw new PermissionError();
    }
    if (target.role === "OWNER") await assertAnotherOwner(workspace.id, userId);

    await db.$transaction([
      db.projectMember.deleteMany({ where: { userId, project: { workspaceId: workspace.id } } }),
      db.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
      }),
    ]);
    revalidatePath(`/${workspaceSlug}`, "layout");
    return { left: isSelf };
  });
}

export async function createInvite(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, role } = createInviteSchema.parse(input);
    const { user, workspace, role: actorRole } = await requireWorkspace(workspaceSlug, "ADMIN");
    if (!invitableRoles(actorRole).includes(role)) throw new PermissionError();

    const invite = await db.workspaceInvite.create({
      data: {
        workspaceId: workspace.id,
        role,
        token: randomBytes(24).toString("base64url"),
        createdById: user.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
    revalidatePath(`/${workspaceSlug}/settings`);
    return { token: invite.token };
  });
}

export async function revokeInvite(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, inviteId } = revokeInviteSchema.parse(input);
    const { workspace } = await requireWorkspace(workspaceSlug, "ADMIN");
    await db.workspaceInvite.updateMany({
      where: { id: inviteId, workspaceId: workspace.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    revalidatePath(`/${workspaceSlug}/settings`);
  });
}

/** Rejoint l'espace via un lien valide. Un membre existant garde son rôle actuel. */
export async function acceptInvite(input: unknown) {
  return runAction(async () => {
    const { token } = acceptInviteSchema.parse(input);
    const user = await requireUser();
    const invite = await db.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: { select: { slug: true } } },
    });
    if (!invite || invite.revokedAt || invite.expiresAt < new Date()) {
      throw new UserError("Ce lien d'invitation n'est plus valide");
    }
    await db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
      create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
      update: {},
    });
    return { slug: invite.workspace.slug };
  });
}
