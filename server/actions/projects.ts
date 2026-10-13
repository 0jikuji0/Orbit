"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { DEFAULT_STATES } from "@/lib/default-states";
import { PermissionError, requireProject, requireWorkspace } from "@/lib/permissions";
import { canCreateProject } from "@/lib/roles";
import {
  createProjectSchema,
  projectRefSchema,
  updateProjectSchema,
} from "@/lib/validators/project";

function identifierTaken(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createProject(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, ...data } = createProjectSchema.parse(input);
    const { user, workspace, role } = await requireWorkspace(workspaceSlug);
    if (!canCreateProject(role)) throw new PermissionError();

    try {
      const project = await db.project.create({
        data: {
          ...data,
          workspaceId: workspace.id,
          members: { create: { userId: user.id, role: "ADMIN" } },
          states: { create: DEFAULT_STATES.map((s, position) => ({ ...s, position })) },
        },
      });
      revalidatePath(`/${workspaceSlug}`, "layout");
      return { id: project.id };
    } catch (error) {
      if (identifierTaken(error))
        throw new UserError(`L'identifiant ${data.identifier} est déjà utilisé`);
      throw error;
    }
  });
}

export async function updateProject(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, ...data } = updateProjectSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    try {
      await db.project.update({ where: { id: project.id }, data });
    } catch (error) {
      if (identifierTaken(error))
        throw new UserError(`L'identifiant ${data.identifier} est déjà utilisé`);
      throw error;
    }
    revalidatePath(`/${workspaceSlug}`, "layout");
  });
}

/** Suppression douce : le projet et ses tâches restent en base. */
export async function archiveProject(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId } = projectRefSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    await db.project.update({ where: { id: project.id }, data: { archivedAt: new Date() } });
    revalidatePath(`/${workspaceSlug}`, "layout");
  });
}
