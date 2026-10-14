import type { StateGroup } from "@prisma/client";
import { z } from "zod";

export const STATE_GROUPS = [
  "BACKLOG",
  "UNSTARTED",
  "STARTED",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly StateGroup[];

export const STATE_GROUP_LABELS: Record<StateGroup, string> = {
  BACKLOG: "Backlog",
  UNSTARTED: "Non commencé",
  STARTED: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide");
const name = z.string().trim().min(1, "Nom requis").max(40, "40 caractères maximum");
const projectRef = { workspaceSlug: z.string(), projectId: z.string() };

export const createStateSchema = z.object({
  ...projectRef,
  name,
  color: colorSchema,
  group: z.enum(STATE_GROUPS),
});

export const updateStateSchema = createStateSchema.extend({ stateId: z.string() });

export const moveStateSchema = z.object({
  ...projectRef,
  stateId: z.string(),
  direction: z.enum(["up", "down"]),
});

export const deleteStateSchema = z.object({
  ...projectRef,
  stateId: z.string(),
  /** État qui reçoit les tâches de l'état supprimé. */
  replacementId: z.string().optional(),
});

export const labelSchema = z.object({ ...projectRef, name, color: colorSchema });
export const updateLabelSchema = labelSchema.extend({ labelId: z.string() });
export const deleteLabelSchema = z.object({ ...projectRef, labelId: z.string() });
