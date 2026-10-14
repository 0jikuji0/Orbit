"use server";

import { revalidatePath } from "next/cache";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { requireProject } from "@/lib/permissions";
import {
  createStateSchema,
  deleteStateSchema,
  moveStateSchema,
  updateStateSchema,
} from "@/lib/validators/state";

function revalidate(workspaceSlug: string, projectId: string) {
  revalidatePath(`/${workspaceSlug}/projects/${projectId}`, "layout");
}

async function findState(projectId: string, stateId: string) {
  const state = await db.state.findFirst({ where: { id: stateId, projectId } });
  if (!state) throw new UserError("État introuvable");
  return state;
}

export async function createState(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, ...data } = createStateSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    const last = await db.state.findFirst({
      where: { projectId: project.id },
      orderBy: { position: "desc" },
    });
    await db.state.create({
      data: { ...data, projectId: project.id, position: (last?.position ?? -1) + 1 },
    });
    revalidate(workspaceSlug, projectId);
  });
}

export async function updateState(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, stateId, ...data } = updateStateSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    await findState(project.id, stateId);
    await db.state.update({ where: { id: stateId }, data });
    revalidate(workspaceSlug, projectId);
  });
}

export async function moveState(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, stateId, direction } = moveStateSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    const states = await db.state.findMany({
      where: { projectId: project.id },
      orderBy: { position: "asc" },
    });
    const index = states.findIndex((s) => s.id === stateId);
    const swapWith = states[direction === "up" ? index - 1 : index + 1];
    const current = states[index];
    if (!current || !swapWith) return;
    await db.$transaction([
      db.state.update({ where: { id: current.id }, data: { position: swapWith.position } }),
      db.state.update({ where: { id: swapWith.id }, data: { position: current.position } }),
    ]);
    revalidate(workspaceSlug, projectId);
  });
}

/** Supprime un état ; ses tâches (y compris archivées) passent dans l'état de remplacement. */
export async function deleteState(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, stateId, replacementId } = deleteStateSchema.parse(input);
    const { user, project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    const state = await findState(project.id, stateId);
    const count = await db.state.count({ where: { projectId: project.id } });
    if (count <= 1) throw new UserError("Un projet doit garder au moins un état");

    const issues = await db.issue.findMany({ where: { stateId }, select: { id: true } });
    if (issues.length) {
      if (!replacementId || replacementId === stateId) {
        throw new UserError("Choisissez l'état qui recevra les tâches");
      }
      const replacement = await findState(project.id, replacementId);
      await db.$transaction([
        db.issue.updateMany({ where: { stateId }, data: { stateId: replacement.id } }),
        db.activity.createMany({
          data: issues.map((i) => ({
            issueId: i.id,
            actorId: user.id,
            field: "state",
            oldValue: state.name,
            newValue: replacement.name,
          })),
        }),
        db.state.delete({ where: { id: stateId } }),
      ]);
    } else {
      await db.state.delete({ where: { id: stateId } });
    }
    revalidate(workspaceSlug, projectId);
  });
}
