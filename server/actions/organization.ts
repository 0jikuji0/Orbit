"use server";

import { revalidatePath } from "next/cache";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { requireProject } from "@/lib/permissions";
import {
  createCycleSchema,
  createModuleSchema,
  deleteCycleSchema,
  deleteModuleSchema,
  updateCycleSchema,
  updateModuleSchema,
} from "@/lib/validators/organization";

/**
 * Cycles et modules : les membres créent et modifient, les admins suppriment.
 * Supprimer un cycle / module ne supprime pas ses tâches (elles en sont simplement détachées).
 */

function revalidate(workspaceSlug: string, projectId: string) {
  revalidatePath(`/${workspaceSlug}/projects/${projectId}`, "layout");
}

async function assertLead(projectId: string, leadId: string | null) {
  if (!leadId) return;
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: leadId } },
  });
  if (!member) throw new UserError("Le responsable doit être membre du projet");
}

export async function createCycle(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, cycle } = createCycleSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    const created = await db.cycle.create({ data: { ...cycle, projectId: project.id } });
    revalidate(workspaceSlug, projectId);
    return { id: created.id };
  });
}

export async function updateCycle(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, cycleId, cycle } = updateCycleSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    const { count } = await db.cycle.updateMany({
      where: { id: cycleId, projectId: project.id },
      data: cycle,
    });
    if (!count) throw new UserError("Cycle introuvable");
    revalidate(workspaceSlug, projectId);
  });
}

export async function deleteCycle(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, cycleId } = deleteCycleSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    const { count } = await db.cycle.deleteMany({ where: { id: cycleId, projectId: project.id } });
    if (!count) throw new UserError("Cycle introuvable");
    revalidate(workspaceSlug, projectId);
  });
}

export async function createModule(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, module } = createModuleSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    await assertLead(project.id, module.leadId);
    const created = await db.module.create({ data: { ...module, projectId: project.id } });
    revalidate(workspaceSlug, projectId);
    return { id: created.id };
  });
}

export async function updateModule(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, moduleId, module } = updateModuleSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    await assertLead(project.id, module.leadId);
    const { count } = await db.module.updateMany({
      where: { id: moduleId, projectId: project.id },
      data: module,
    });
    if (!count) throw new UserError("Module introuvable");
    revalidate(workspaceSlug, projectId);
  });
}

export async function deleteModule(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, moduleId } = deleteModuleSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId, "ADMIN");
    const { count } = await db.module.deleteMany({
      where: { id: moduleId, projectId: project.id },
    });
    if (!count) throw new UserError("Module introuvable");
    revalidate(workspaceSlug, projectId);
  });
}
