import { describe, expect, it } from "vitest";
import { sortIssues } from "@/lib/issues/sort";
import type { IssueDTO, ProjectMeta } from "@/lib/issues/types";

const date = new Date("2026-01-01");
const issue = (id: string, over: Partial<IssueDTO>): IssueDTO => ({
  id,
  sequenceId: 1,
  title: id,
  stateId: "todo",
  priority: "NONE",
  sortOrder: 0,
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
});

const meta: ProjectMeta = {
  id: "p",
  identifier: "ORB",
  name: "Orbit",
  states: [
    { id: "todo", name: "À faire", color: "#aaa", position: 0, group: "UNSTARTED" },
    { id: "done", name: "Terminé", color: "#0f0", position: 1, group: "COMPLETED" },
  ],
  labels: [],
  members: [
    { id: "z", name: "Zoé", avatarUrl: null },
    { id: "a", name: "Adam", avatarUrl: null },
  ],
  cycles: [],
  modules: [],
};

const ids = (list: IssueDTO[]) => list.map((i) => i.id);

describe("sortIssues", () => {
  const list = [
    issue("i1", {
      sequenceId: 3,
      priority: "LOW",
      stateId: "done",
      assigneeIds: ["z"],
      dueDate: new Date("2026-03-01"),
    }),
    issue("i2", { sequenceId: 1, priority: "URGENT", stateId: "todo", assigneeIds: ["a"] }),
    issue("i3", {
      sequenceId: 2,
      priority: "HIGH",
      stateId: "done",
      dueDate: new Date("2026-02-01"),
    }),
  ];

  it("par numéro", () => {
    expect(ids(sortIssues(list, "key", "asc", meta))).toEqual(["i2", "i3", "i1"]);
    expect(ids(sortIssues(list, "key", "desc", meta))).toEqual(["i1", "i3", "i2"]);
  });
  it("par priorité : urgente d'abord en ordre croissant", () => {
    expect(ids(sortIssues(list, "priority", "asc", meta))).toEqual(["i2", "i3", "i1"]);
  });
  it("par état : selon la position des états, tri stable", () => {
    expect(ids(sortIssues(list, "state", "asc", meta))).toEqual(["i2", "i1", "i3"]);
  });
  it("par assigné : par nom, non assignés à la fin", () => {
    expect(ids(sortIssues(list, "assignees", "asc", meta))).toEqual(["i2", "i1", "i3"]);
    expect(ids(sortIssues(list, "assignees", "desc", meta))).toEqual(["i1", "i2", "i3"]);
  });
  it("par échéance : sans échéance toujours à la fin", () => {
    expect(ids(sortIssues(list, "dueDate", "asc", meta))).toEqual(["i3", "i1", "i2"]);
    expect(ids(sortIssues(list, "dueDate", "desc", meta))).toEqual(["i1", "i3", "i2"]);
  });
});
