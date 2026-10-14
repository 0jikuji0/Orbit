import type { ModuleStatus } from "@prisma/client";
import { z } from "zod";

const day = z.iso.date().transform((d) => new Date(`${d}T00:00:00.000Z`));
const projectRef = { workspaceSlug: z.string(), projectId: z.string() };
const name = z.string().trim().min(1, "Nom requis").max(80, "80 caractères maximum");

export const cycleFields = z
  .object({ name, startDate: day, endDate: day })
  .refine((c) => c.startDate <= c.endDate, {
    message: "La fin doit être après le début",
    path: ["endDate"],
  });

export const createCycleSchema = z.object({ ...projectRef, cycle: cycleFields });
export const updateCycleSchema = z.object({
  ...projectRef,
  cycleId: z.string(),
  cycle: cycleFields,
});
export const deleteCycleSchema = z.object({ ...projectRef, cycleId: z.string() });

export const MODULE_STATUSES = [
  "BACKLOG",
  "PLANNED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly ModuleStatus[];

export const MODULE_STATUS_LABELS: Record<ModuleStatus, string> = {
  BACKLOG: "Backlog",
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  PAUSED: "En pause",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export const moduleFields = z.object({
  name,
  description: z
    .string()
    .trim()
    .max(500, "500 caractères maximum")
    .transform((v) => v || null)
    .nullable(),
  leadId: z.string().nullable(),
  status: z.enum(MODULE_STATUSES),
});

export const createModuleSchema = z.object({ ...projectRef, module: moduleFields });
export const updateModuleSchema = z.object({
  ...projectRef,
  moduleId: z.string(),
  module: moduleFields,
});
export const deleteModuleSchema = z.object({ ...projectRef, moduleId: z.string() });
