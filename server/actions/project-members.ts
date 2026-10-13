"use server";

import { revalidatePath } from "next/cache";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { requireProject } from "@/lib/permissions";
import {
  addProjectMemberSchema,
  removeProjectMemberSchema,
  updateProjectMemberSchema,
} from "@/lib/validators/member";

function settingsPath(workspaceSlug: string, projectId: string) {
  return `/${workspaceSlug}/projects/${projectId}/settings`;
}

/** Il doit toujours rester au moins un admin explicite dans le projet. */
async function assertNotLastAdmin(projectId: string, userId: string) {
  const admins = await db.projectMember.findMany({
    where: { projectId, role: "ADMIN" },
    select: { userId: true },
  });
  if (admins.length === 1 && admins[0]?.userId === userId) {
    throw new UserError("Le projet doit garder au moins un administrateur");
  }
}

export async function addProjectMember(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, userId, role } = addProjectMemberSchema.parse(input);
    const { project, workspace } = await requireProject(workspaceSlug, projectId, "ADMIN");

    const wsMember = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });
    if (!wsMember) throw new UserError("Cette personne n'est pas membre de l'espace de travail");
    if (wsMember.role === "GUEST" && role !== "VIEWER") {
      throw new UserError("Un invité ne peut être que lecteur");
    }

    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      create: { projectId: project.id, userId, role },
      update: { role },
    });
    revalidatePath(settingsPath(workspaceSlug, projectId));
  });
}

export async function updateProjectMember(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, userId, role } = updateProjectMemberSchema.parse(input);
    const { project, workspace } = await requireProject(workspaceSlug, projectId, "ADMIN");

    const wsMember = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });
    if (wsMember?.role === "GUEST" && role !== "VIEWER") {
      throw new UserError("Un invité ne peut être que lecteur");
    }
    if (role !== "ADMIN") await assertNotLastAdmin(project.id, userId);

    await db.projectMember.update({
      where: { projectId_userId: { projectId: project.id, userId } },
      data: { role },
    });
    revalidatePath(settingsPath(workspaceSlug, projectId));
  });
}

export async function removeProjectMember(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, userId } = removeProjectMemberSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    await assertNotLastAdmin(project.id, userId);
    await db.projectMember.deleteMany({ where: { projectId: project.id, userId } });
    revalidatePath(settingsPath(workspaceSlug, projectId));
  });
}
