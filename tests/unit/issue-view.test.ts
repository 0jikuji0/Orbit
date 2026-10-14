import { describe, expect, it } from "vitest";
import type { IssueDTO, ProjectMeta } from "@/lib/issues/types";
import {
  EMPTY_FILTERS,
  NONE,
  filterIssues,
  groupIssues,
  groupMovePatch,
  parseViewParams,
  serializeViewParams,
} from "@/lib/issues/view";

const date = new Date("2026-01-01");
function issue(id: string, over: Partial<IssueDTO> = {}): IssueDTO {
  return {
    id,
    sequenceId: Number(id.replace(/\D/g, "")) || 1,
    title: id,
    stateId: "todo",
    priority: "NONE",
    sortOrder: 1000,
    startDate: null,
    dueDate: null,
    assigneeIds: [],
    labelIds: [],
    parentId: null,
    cycleId: null,
    moduleId: null,
    createdAt: date,
    updatedAt: date,
    ...over,
  };
}

const meta: ProjectMeta = {
  id: "p",
  identifier: "ORB",
  name: "Orbit",
  states: [
    { id: "done", name: "Terminé", color: "#0f0", position: 1, group: "COMPLETED" },
    { id: "todo", name: "À faire", color: "#aaa", position: 0, group: "UNSTARTED" },
  ],
  labels: [],
  members: [
    { id: "bob", name: "Bob", avatarUrl: null },
    { id: "alice", name: "Alice", avatarUrl: null },
  ],
  cycles: [],
  modules: [],
};

const issues = [
  issue("i1", { stateId: "todo", priority: "HIGH", assigneeIds: ["alice"], labelIds: ["bug"] }),
  issue("i2", { stateId: "done", priority: "LOW", assigneeIds: ["bob", "alice"] }),
  issue("i3", { stateId: "todo", priority: "HIGH", labelIds: ["feat"] }),
];

describe("filterIssues", () => {
  const ids = (f: Partial<typeof EMPTY_FILTERS>) =>
    filterIssues(issues, { ...EMPTY_FILTERS, ...f }).map((i) => i.id);

  it("sans filtre → tout", () => {
    expect(ids({})).toEqual(["i1", "i2", "i3"]);
  });
  it("filtre par état et priorité (ET entre champs)", () => {
    expect(ids({ state: ["todo"], priority: ["HIGH"] })).toEqual(["i1", "i3"]);
    expect(ids({ state: ["done"], priority: ["HIGH"] })).toEqual([]);
  });
  it("OU entre valeurs d'un même champ", () => {
    expect(ids({ priority: ["HIGH", "LOW"] })).toEqual(["i1", "i2", "i3"]);
  });
  it("filtre par assigné, y compris « non assigné »", () => {
    expect(ids({ assignee: ["bob"] })).toEqual(["i2"]);
    expect(ids({ assignee: [NONE] })).toEqual(["i3"]);
    expect(ids({ assignee: [NONE, "bob"] })).toEqual(["i2", "i3"]);
  });
  it("filtre par cycle, y compris « sans cycle »", () => {
    const withCycle = [issue("a", { cycleId: "s1" }), issue("b", { cycleId: null })];
    const run = (cycle: string[]) =>
      filterIssues(withCycle, { ...EMPTY_FILTERS, cycle }).map((i) => i.id);
    expect(run(["s1"])).toEqual(["a"]);
    expect(run([NONE])).toEqual(["b"]);
    expect(run([])).toEqual(["a", "b"]);
  });
  it("filtre par label", () => {
    expect(ids({ label: ["bug", "feat"] })).toEqual(["i1", "i3"]);
  });
});

describe("groupIssues", () => {
  it("par état, dans l'ordre des positions, groupes vides inclus", () => {
    const groups = groupIssues(issues, "state", meta);
    expect(groups.map((g) => [g.key, g.issues.map((i) => i.id)])).toEqual([
      ["todo", ["i1", "i3"]],
      ["done", ["i2"]],
    ]);
  });
  it("par priorité, de urgente à aucune", () => {
    const groups = groupIssues(issues, "priority", meta);
    expect(groups.map((g) => g.key)).toEqual(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]);
    expect(groups[1]?.issues.map((i) => i.id)).toEqual(["i1", "i3"]);
  });
  it("par assigné : par nom, puis « non assigné » ; une tâche peut apparaître deux fois", () => {
    const groups = groupIssues(issues, "assignee", meta);
    expect(groups.map((g) => [g.key, g.issues.map((i) => i.id)])).toEqual([
      ["alice", ["i1", "i2"]],
      ["bob", ["i2"]],
      [NONE, ["i3"]],
    ]);
  });
  it("trie chaque groupe par sortOrder", () => {
    const groups = groupIssues(
      [issue("a", { sortOrder: 3 }), issue("b", { sortOrder: 1 }), issue("c", { sortOrder: 2 })],
      "state",
      meta,
    );
    expect(groups[0]?.issues.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
});

describe("groupMovePatch", () => {
  const i2 = issues[1]!;
  it("change l'état ou la priorité", () => {
    expect(groupMovePatch(i2, "state", "done", "todo")).toEqual({ stateId: "todo" });
    expect(groupMovePatch(i2, "priority", "LOW", "URGENT")).toEqual({ priority: "URGENT" });
  });
  it("remplace l'assigné du groupe d'origine par celui du groupe cible", () => {
    expect(groupMovePatch(i2, "assignee", "bob", NONE)).toEqual({ assigneeIds: ["alice"] });
    expect(groupMovePatch(issues[2]!, "assignee", NONE, "bob")).toEqual({ assigneeIds: ["bob"] });
    expect(groupMovePatch(i2, "assignee", "bob", "alice")).toEqual({ assigneeIds: ["alice"] });
  });
  it("ne change rien dans le même groupe", () => {
    expect(groupMovePatch(i2, "state", "done", "done")).toEqual({});
  });
});

describe("paramètres d'URL", () => {
  it("aller-retour", () => {
    const view = {
      layout: "kanban" as const,
      groupBy: "priority" as const,
      filters: { ...EMPTY_FILTERS, priority: ["HIGH" as const], assignee: [NONE, "bob"] },
      peek: "issue-1",
    };
    expect(parseViewParams(serializeViewParams(view))).toEqual(view);
  });
  it("valeurs par défaut et valeurs invalides ignorées", () => {
    const view = parseViewParams(new URLSearchParams("layout=foo&group=bar&priority=HIGH,NOPE"));
    expect(view.layout).toBe("list");
    expect(view.groupBy).toBe("state");
    expect(view.filters.priority).toEqual(["HIGH"]);
  });
  it("vue par défaut → URL vide", () => {
    expect(
      serializeViewParams({
        layout: "list",
        groupBy: "state",
        filters: EMPTY_FILTERS,
        peek: null,
      }).toString(),
    ).toBe("");
  });
});
