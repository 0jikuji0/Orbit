import { describe, expect, it } from "vitest";
import { computeAnalytics } from "@/lib/issues/analytics";

const states = [
  { id: "todo", name: "À faire", color: "#aaa", position: 0, group: "UNSTARTED" as const },
  { id: "done", name: "Terminé", color: "#0f0", position: 2, group: "COMPLETED" as const },
  { id: "doing", name: "En cours", color: "#f90", position: 1, group: "STARTED" as const },
  { id: "drop", name: "Annulé", color: "#f00", position: 3, group: "CANCELLED" as const },
];
const members = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];
const today = new Date(2026, 9, 14);
const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const issues = [
  { stateId: "todo", priority: "HIGH" as const, assigneeIds: ["a"], dueDate: d("2026-10-10") },
  {
    stateId: "doing",
    priority: "HIGH" as const,
    assigneeIds: ["a", "b"],
    dueDate: d("2026-10-20"),
  },
  { stateId: "done", priority: "LOW" as const, assigneeIds: ["b"], dueDate: d("2026-10-01") },
  { stateId: "drop", priority: "URGENT" as const, assigneeIds: [], dueDate: null },
  { stateId: "todo", priority: "NONE" as const, assigneeIds: [], dueDate: null },
];

describe("computeAnalytics", () => {
  const a = computeAnalytics(issues, states, members, today);

  it("indicateurs : total, ouvertes, % terminé, en retard (ouvertes seulement)", () => {
    expect(a).toMatchObject({ total: 5, open: 3, completedPercent: 20, overdue: 1 });
  });

  it("par état, dans l'ordre des positions", () => {
    expect(a.byState.map((b) => [b.label, b.count])).toEqual([
      ["À faire", 2],
      ["En cours", 1],
      ["Terminé", 1],
      ["Annulé", 1],
    ]);
  });

  it("par priorité, tâches ouvertes seulement", () => {
    expect(a.byPriority.map((b) => [b.key, b.count])).toEqual([
      ["URGENT", 0],
      ["HIGH", 2],
      ["MEDIUM", 0],
      ["LOW", 0],
      ["NONE", 1],
    ]);
  });

  it("par assigné, du plus chargé au moins chargé, puis « non assigné »", () => {
    expect(a.byAssignee.map((b) => [b.label, b.count])).toEqual([
      ["Alice", 2],
      ["Bob", 1],
      ["Non assigné", 1],
    ]);
  });

  it("projet vide", () => {
    expect(computeAnalytics([], states, members, today)).toMatchObject({
      total: 0,
      completedPercent: 0,
    });
  });
});
