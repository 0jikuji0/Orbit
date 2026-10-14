import type { Priority } from "@prisma/client";
import { PRIORITIES, PRIORITY_LABELS } from "./priority";
import type { RichNode } from "@/lib/rich-text";
import type { IssueDTO, ProjectMeta } from "./types";

export const NONE = "none";

export const LAYOUTS = ["list", "kanban", "calendar", "table"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const GROUP_BYS = ["state", "priority", "assignee"] as const;
export type GroupBy = (typeof GROUP_BYS)[number];

export const GROUP_BY_LABELS: Record<GroupBy, string> = {
  state: "État",
  priority: "Priorité",
  assignee: "Assigné",
};

export type IssueFilters = {
  state: string[];
  priority: Priority[];
  /** ids d'utilisateurs, ou `NONE` pour « non assigné » */
  assignee: string[];
  label: string[];
};

export type ViewState = { layout: Layout; groupBy: GroupBy; filters: IssueFilters };

export const EMPTY_FILTERS: IssueFilters = { state: [], priority: [], assignee: [], label: [] };

export function hasActiveFilters(filters: IssueFilters) {
  return Object.values(filters).some((v) => v.length > 0);
}

/** ET entre les champs, OU entre les valeurs d'un même champ. */
export function filterIssues(issues: IssueDTO[], filters: IssueFilters): IssueDTO[] {
  return issues.filter((issue) => {
    if (filters.state.length && !filters.state.includes(issue.stateId)) return false;
    if (filters.priority.length && !filters.priority.includes(issue.priority)) return false;
    if (filters.assignee.length) {
      const match =
        (filters.assignee.includes(NONE) && issue.assigneeIds.length === 0) ||
        issue.assigneeIds.some((id) => filters.assignee.includes(id));
      if (!match) return false;
    }
    if (filters.label.length && !issue.labelIds.some((id) => filters.label.includes(id))) {
      return false;
    }
    return true;
  });
}

export type IssueGroup = {
  key: string;
  label: string;
  /** couleur de donnée (état) */
  color?: string;
  priority?: Priority;
  avatar?: { name: string; avatarUrl: string | null };
  issues: IssueDTO[];
};

const bySortOrder = (a: IssueDTO, b: IssueDTO) => a.sortOrder - b.sortOrder;

/**
 * Regroupe les tâches. Tous les groupes possibles sont renvoyés (même vides) dans l'ordre d'affichage.
 * En regroupement par assigné, une tâche à plusieurs assignés apparaît dans chacun de leurs groupes.
 */
export function groupIssues(issues: IssueDTO[], groupBy: GroupBy, meta: ProjectMeta): IssueGroup[] {
  const sorted = [...issues].sort(bySortOrder);
  switch (groupBy) {
    case "state":
      return [...meta.states]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({
          key: s.id,
          label: s.name,
          color: s.color,
          issues: sorted.filter((i) => i.stateId === s.id),
        }));
    case "priority":
      return PRIORITIES.map((p) => ({
        key: p,
        label: PRIORITY_LABELS[p],
        priority: p,
        issues: sorted.filter((i) => i.priority === p),
      }));
    case "assignee":
      return [
        ...[...meta.members]
          .sort((a, b) => a.name.localeCompare(b.name, "fr"))
          .map((m) => ({
            key: m.id,
            label: m.name,
            avatar: { name: m.name, avatarUrl: m.avatarUrl },
            issues: sorted.filter((i) => i.assigneeIds.includes(m.id)),
          })),
        {
          key: NONE,
          label: "Non assigné",
          issues: sorted.filter((i) => i.assigneeIds.length === 0),
        },
      ];
  }
}

export type IssuePatch = Partial<
  Pick<
    IssueDTO,
    | "title"
    | "stateId"
    | "priority"
    | "assigneeIds"
    | "labelIds"
    | "startDate"
    | "dueDate"
    | "sortOrder"
  >
>;

/** Modification à appliquer quand une tâche passe du groupe `from` au groupe `to`. */
export function groupMovePatch(
  issue: IssueDTO,
  groupBy: GroupBy,
  from: string,
  to: string,
): IssuePatch {
  if (from === to) return {};
  switch (groupBy) {
    case "state":
      return { stateId: to };
    case "priority":
      return { priority: to as Priority };
    case "assignee": {
      const kept = issue.assigneeIds.filter((id) => id !== from);
      return { assigneeIds: to === NONE ? kept : [...new Set([...kept, to])] };
    }
  }
}

// ─── Sérialisation dans l'URL ──────────────────────────────────────────

const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);

export function parseViewParams(params: URLSearchParams): ViewState {
  const layout = params.get("layout");
  const group = params.get("group");
  return {
    layout: LAYOUTS.includes(layout as Layout) ? (layout as Layout) : "list",
    groupBy: GROUP_BYS.includes(group as GroupBy) ? (group as GroupBy) : "state",
    filters: {
      state: list(params.get("state")),
      priority: list(params.get("priority")).filter((p): p is Priority =>
        PRIORITIES.includes(p as Priority),
      ),
      assignee: list(params.get("assignee")),
      label: list(params.get("label")),
    },
  };
}

export function serializeViewParams(view: ViewState): URLSearchParams {
  const params = new URLSearchParams();
  if (view.layout !== "list") params.set("layout", view.layout);
  if (view.groupBy !== "state") params.set("group", view.groupBy);
  for (const [key, values] of Object.entries(view.filters)) {
    if (values.length) params.set(key, values.join(","));
  }
  return params;
}

/** Valeurs pré-remplies d'une nouvelle tâche créée depuis un groupe. */
export function defaultsForGroup(groupBy: GroupBy, key: string) {
  switch (groupBy) {
    case "state":
      return { stateId: key };
    case "priority":
      return { priority: key as Priority };
    case "assignee":
      return key === NONE ? {} : { assigneeIds: [key] };
  }
}
