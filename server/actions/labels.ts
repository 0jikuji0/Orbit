"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { requireProject } from "@/lib/permissions";
import { deleteLabelSchema, labelSchema, updateLabelSchema } from "@/lib/validators/state";

function revalidate(workspaceSlug: string, projectId: string) {
  revalidatePath(`/${workspaceSlug}/projects/${projectId}`, "layout");
}

function nameTaken(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new UserError("Un label porte déjà ce nom");
  }
  throw error;
}

async function findLabel(projectId: string, labelId: string) {
  const label = await db.label.findFirst({ where: { id: labelId, projectId } });
  if (!label) throw new UserError("Label introuvable");
  return label;
}

export async function createLabel(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, ...data } = labelSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    await db.label.create({ data: { ...data, projectId: project.id } }).catch(nameTaken);
    revalidate(workspaceSlug, projectId);
  });
}

export async function updateLabel(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, labelId, ...data } = updateLabelSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    await findLabel(project.id, labelId);
    await db.label.update({ where: { id: labelId }, data }).catch(nameTaken);
    revalidate(workspaceSlug, projectId);
  });
}

/** Le label est retiré de toutes les tâches qui le portent. */
export async function deleteLabel(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, labelId } = deleteLabelSchema.parse(input);
    const { user, project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    const label = await findLabel(project.id, labelId);
    const tagged = await db.issueLabel.findMany({ where: { labelId }, select: { issueId: true } });
    await db.$transaction([
      db.activity.createMany({
        data: tagged.map(({ issueId }) => ({
          issueId,
          actorId: user.id,
          field: "labels",
          oldValue: label.name,
          newValue: null,
        })),
      }),
      db.label.delete({ where: { id: labelId } }),
    ]);
    revalidate(workspaceSlug, projectId);
  });
}
