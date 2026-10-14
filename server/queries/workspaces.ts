import "server-only";
import { db } from "@/lib/db";
import { accessibleProjectsWhere, requireUser, requireWorkspace } from "@/lib/permissions";
import { canManageWorkspaceMember, hasWorkspaceRole, invitableRoles } from "@/lib/roles";
import { countUnread } from "./inbox";

export async function listMyWorkspaces() {
  const user = await requireUser();
  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => m.workspace);
}

/** Données du cadre de l'application : workspace courant, workspaces de l'utilisateur, projets visibles. */
export async function getWorkspaceShell(slug: string) {
  const { user, workspace, role } = await requireWorkspace(slug);
  const [workspaces, projects, unreadCount] = await Promise.all([
    listMyWorkspaces(),
    db.project.findMany({
      where: accessibleProjectsWhere(workspace.id, user.id, role),
      select: { id: true, identifier: true, name: true, icon: true },
      orderBy: { createdAt: "asc" },
    }),
    countUnread(slug),
  ]);
  return { user, workspace, role, workspaces, projects, unreadCount };
}

export async function getWorkspaceSettings(slug: string) {
  const { user, workspace, role } = await requireWorkspace(slug);
  const isAdmin = hasWorkspaceRole(role, "ADMIN");
  const [members, invites] = await Promise.all([
    db.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    }),
    isAdmin
      ? db.workspaceInvite.findMany({
          where: { workspaceId: workspace.id, revokedAt: null, expiresAt: { gt: new Date() } },
          include: { createdBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  return {
    user,
    workspace,
    role,
    isAdmin,
    invitableRoles: invitableRoles(role),
    members: members.map((m) => ({
      ...m.user,
      role: m.role,
      // Rôles que l'utilisateur courant peut attribuer à ce membre (vide = non modifiable).
      assignableRoles: (["OWNER", "ADMIN", "MEMBER", "GUEST"] as const).filter(
        (r) => r === m.role || canManageWorkspaceMember(role, m.role, r),
      ),
      removable: m.userId !== user.id && canManageWorkspaceMember(role, m.role, null),
    })),
    invites: invites.map((i) => ({
      id: i.id,
      token: i.token,
      role: i.role,
      expiresAt: i.expiresAt,
      createdBy: i.createdBy.name,
    })),
  };
}

/** Informations publiques d'une invitation, pour la page d'acceptation. */
export async function getInvite(token: string) {
  const user = await requireUser();
  const invite = await db.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          name: true,
          slug: true,
          members: { where: { userId: user.id }, select: { role: true } },
        },
      },
    },
  });
  if (!invite) return null;
  return {
    workspaceName: invite.workspace.name,
    workspaceSlug: invite.workspace.slug,
    role: invite.role,
    valid: !invite.revokedAt && invite.expiresAt > new Date(),
    alreadyMember: invite.workspace.members.length > 0,
  };
}
