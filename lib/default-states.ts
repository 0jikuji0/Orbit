import type { StateGroup } from "@prisma/client";

/** États créés automatiquement avec chaque projet. Les couleurs sont des données (modifiables par projet). */
export const DEFAULT_STATES: ReadonlyArray<{ name: string; color: string; group: StateGroup }> = [
  { name: "Backlog", color: "#71717a", group: "BACKLOG" },
  { name: "À faire", color: "#a1a1aa", group: "UNSTARTED" },
  { name: "En cours", color: "#f59e0b", group: "STARTED" },
  { name: "Terminé", color: "#22c55e", group: "COMPLETED" },
  { name: "Annulé", color: "#ef4444", group: "CANCELLED" },
];
