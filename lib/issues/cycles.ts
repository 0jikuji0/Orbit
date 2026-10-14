import type { StateGroup } from "@prisma/client";

export type CycleStatus = "upcoming" | "current" | "completed";

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  upcoming: "À venir",
  current: "En cours",
  completed: "Terminé",
};

/** Dates « jour » stockées à minuit UTC ; un cycle inclut son jour de fin. */
export function cycleStatus(start: Date, end: Date, today: Date = new Date()): CycleStatus {
  const day = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (day < start.getTime()) return "upcoming";
  if (day > end.getTime()) return "completed";
  return "current";
}

/** Progression = part des tâches dans un état du groupe « Terminé ». */
export function progress(
  issues: { stateId: string }[],
  stateGroups: ReadonlyMap<string, StateGroup>,
): { done: number; total: number; percent: number } {
  const total = issues.length;
  const done = issues.filter((i) => stateGroups.get(i.stateId) === "COMPLETED").length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** Jours restants avant la fin (0 le dernier jour, négatif si dépassé). */
export function daysLeft(end: Date, today: Date = new Date()): number {
  const day = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end.getTime() - day) / 86_400_000);
}
