import type { Priority } from "@prisma/client";

export const PRIORITIES = [
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NONE",
] as const satisfies readonly Priority[];

export const PRIORITY_LABELS: Record<Priority, string> = {
  URGENT: "Urgente",
  HIGH: "Haute",
  MEDIUM: "Moyenne",
  LOW: "Basse",
  NONE: "Aucune",
};
