import { PRIORITIES } from "./priority";
import type { IssueDTO, ProjectMeta } from "./types";

export const SORT_KEYS = [
  "key",
  "title",
  "state",
  "priority",
  "assignees",
  "startDate",
  "dueDate",
  "updatedAt",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

type Value = string | number | null;

function valueOf(issue: IssueDTO, key: SortKey, meta: ProjectMeta): Value {
  switch (key) {
    case "key":
      return issue.sequenceId;
    case "title":
      return issue.title.toLocaleLowerCase("fr");
    case "state":
      return meta.states.find((s) => s.id === issue.stateId)?.position ?? null;
    case "priority":
      return PRIORITIES.indexOf(issue.priority); // urgente d'abord
    case "assignees": {
      const names = issue.assigneeIds
        .map((id) => meta.members.find((m) => m.id === id)?.name)
        .filter((n): n is string => !!n)
        .sort((a, b) => a.localeCompare(b, "fr"));
      return names[0]?.toLocaleLowerCase("fr") ?? null;
    }
    case "startDate":
      return issue.startDate?.getTime() ?? null;
    case "dueDate":
      return issue.dueDate?.getTime() ?? null;
    case "updatedAt":
      return issue.updatedAt.getTime();
  }
}

/** Tri stable ; les valeurs vides vont toujours en dernier, quel que soit le sens. */
export function sortIssues(
  issues: IssueDTO[],
  key: SortKey,
  dir: SortDir,
  meta: ProjectMeta,
): IssueDTO[] {
  const sign = dir === "asc" ? 1 : -1;
  return issues
    .map((issue, index) => ({ issue, index, value: valueOf(issue, key, meta) }))
    .sort((a, b) => {
      if (a.value === null && b.value === null) return a.index - b.index;
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      const cmp =
        typeof a.value === "string" && typeof b.value === "string"
          ? a.value.localeCompare(b.value, "fr")
          : (a.value as number) - (b.value as number);
      return cmp * sign || a.index - b.index;
    })
    .map((x) => x.issue);
}
