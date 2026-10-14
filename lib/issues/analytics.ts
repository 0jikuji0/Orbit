import type { Priority, StateGroup } from "@prisma/client";
import { PRIORITIES, PRIORITY_LABELS } from "./priority";

type Issue = { stateId: string; priority: Priority; assigneeIds: string[]; dueDate: Date | null };
type State = { id: string; name: string; color: string; position: number; group: StateGroup };
type Member = { id: string; name: string };

export type Bucket = {
  key: string;
  label: string;
  count: number;
  color?: string;
  priority?: Priority;
};

export type ProjectAnalytics = {
  total: number;
  open: number;
  completedPercent: number;
  overdue: number;
  byState: Bucket[];
  byPriority: Bucket[];
  byAssignee: Bucket[];
};

const CLOSED: StateGroup[] = ["COMPLETED", "CANCELLED"];

/** Statistiques d'un projet : effectifs par état, priorité et assigné, plus quelques indicateurs. */
export function computeAnalytics(
  issues: Issue[],
  states: State[],
  members: Member[],
  today: Date,
): ProjectAnalytics {
  const groupOf = new Map(states.map((s) => [s.id, s.group]));
  const isClosed = (i: Issue) => CLOSED.includes(groupOf.get(i.stateId) ?? "BACKLOG");
  const completed = issues.filter((i) => groupOf.get(i.stateId) === "COMPLETED").length;
  const day = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const byAssignee: Bucket[] = members
    .map((m) => ({
      key: m.id,
      label: m.name,
      count: issues.filter((i) => !isClosed(i) && i.assigneeIds.includes(m.id)).length,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
  const unassigned = issues.filter((i) => !isClosed(i) && i.assigneeIds.length === 0).length;

  return {
    total: issues.length,
    open: issues.filter((i) => !isClosed(i)).length,
    completedPercent: issues.length ? Math.round((completed / issues.length) * 100) : 0,
    overdue: issues.filter((i) => !isClosed(i) && i.dueDate && i.dueDate.getTime() < day).length,
    byState: [...states]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        key: s.id,
        label: s.name,
        color: s.color,
        count: issues.filter((i) => i.stateId === s.id).length,
      })),
    // Seules les tâches ouvertes comptent pour la charge (priorité, assignés).
    byPriority: PRIORITIES.map((p) => ({
      key: p,
      label: PRIORITY_LABELS[p],
      priority: p,
      count: issues.filter((i) => !isClosed(i) && i.priority === p).length,
    })),
    byAssignee: [...byAssignee, { key: "none", label: "Non assigné", count: unassigned }],
  };
}
