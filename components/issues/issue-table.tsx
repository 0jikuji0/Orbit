"use client";

import { ArrowDown, ArrowUp, Columns3, Maximize2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownLabel,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { sortIssues, type SortDir, type SortKey } from "@/lib/issues/sort";
import type { IssueDTO } from "@/lib/issues/types";
import { cn } from "@/lib/utils";
import { IssueKey } from "./issue-list";
import { IssueTitle } from "./issue-title";
import { useIssuesContext } from "./issues-context";
import {
  AssigneesPicker,
  CyclePicker,
  DatePicker,
  LabelsPicker,
  ModulePicker,
  PriorityPicker,
  StatePicker,
} from "./properties";
import { useUpdateIssue } from "./use-issues";

type Patch = Parameters<ReturnType<typeof useUpdateIssue>["mutate"]>[0]["patch"];

type Column = {
  id: string;
  label: string;
  width: string;
  sort?: SortKey;
  /** Colonne toujours affichée */
  fixed?: boolean;
  render: (issue: IssueDTO, set: (patch: Patch) => void) => ReactNode;
};

const updatedFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

const COLUMNS: Column[] = [
  {
    id: "key",
    label: "Clé",
    width: "w-24",
    sort: "key",
    fixed: true,
    render: (i) => (
      <span className="px-2">
        <IssueKey issue={i} />
      </span>
    ),
  },
  {
    id: "state",
    label: "État",
    width: "w-36",
    sort: "state",
    render: (i, set) => (
      <StatePicker variant="cell" value={i.stateId} onChange={(stateId) => set({ stateId })} />
    ),
  },
  {
    id: "priority",
    label: "Priorité",
    width: "w-32",
    sort: "priority",
    render: (i, set) => (
      <PriorityPicker
        variant="cell"
        value={i.priority}
        onChange={(priority) => set({ priority })}
      />
    ),
  },
  {
    id: "assignees",
    label: "Assignés",
    width: "w-44",
    sort: "assignees",
    render: (i, set) => (
      <AssigneesPicker
        variant="cell"
        value={i.assigneeIds}
        onChange={(assigneeIds) => set({ assigneeIds })}
      />
    ),
  },
  {
    id: "labels",
    label: "Labels",
    width: "w-44",
    render: (i, set) => (
      <LabelsPicker variant="cell" value={i.labelIds} onChange={(labelIds) => set({ labelIds })} />
    ),
  },
  {
    id: "startDate",
    label: "Début",
    width: "w-32",
    sort: "startDate",
    render: (i, set) => (
      <DatePicker
        variant="cell"
        label="Début"
        value={i.startDate}
        onChange={(startDate) => set({ startDate })}
      />
    ),
  },
  {
    id: "dueDate",
    label: "Échéance",
    width: "w-32",
    sort: "dueDate",
    render: (i, set) => (
      <DatePicker
        variant="cell"
        label="Échéance"
        value={i.dueDate}
        onChange={(dueDate) => set({ dueDate })}
        highlightOverdue
      />
    ),
  },
  {
    id: "cycle",
    label: "Cycle",
    width: "w-36",
    render: (i, set) => (
      <CyclePicker variant="cell" value={i.cycleId} onChange={(cycleId) => set({ cycleId })} />
    ),
  },
  {
    id: "module",
    label: "Module",
    width: "w-36",
    render: (i, set) => (
      <ModulePicker variant="cell" value={i.moduleId} onChange={(moduleId) => set({ moduleId })} />
    ),
  },
  {
    id: "updatedAt",
    label: "Modifiée",
    width: "w-28",
    sort: "updatedAt",
    render: (i) => (
      <span className="text-text-dim px-2 font-mono text-xs">
        {updatedFormat.format(i.updatedAt)}
      </span>
    ),
  },
];

const HIDDEN_BY_DEFAULT = new Set(["startDate", "cycle", "module"]);

function Row({ issue, columns }: { issue: IssueDTO; columns: Column[] }) {
  const { openIssue, canEdit } = useIssuesContext();
  const update = useUpdateIssue();
  const [renaming, setRenaming] = useState(false);
  const set = (patch: Patch) => update.mutate({ issueId: issue.id, patch });
  return (
    <tr
      data-testid="table-row"
      className={cn(
        "group border-border hover:bg-surface-2 h-9 border-b",
        issue.id.startsWith("temp-") && "opacity-60",
      )}
    >
      {columns.slice(0, 1).map((c) => (
        <td key={c.id} className="border-border border-r">
          {c.render(issue, set)}
        </td>
      ))}
      <td className="border-border min-w-72 border-r px-2">
        <div className="flex items-center gap-2">
          <span
            className="min-w-0 flex-1"
            onDoubleClick={() => canEdit && setRenaming(true)}
            title={canEdit ? "Double-cliquer pour renommer" : undefined}
          >
            <IssueTitle
              title={issue.title}
              editing={renaming}
              onSubmit={(title) => {
                setRenaming(false);
                set({ title });
              }}
              onCancel={() => setRenaming(false)}
              className="block"
            />
          </span>
          <button
            type="button"
            aria-label={`Ouvrir ${issue.title}`}
            onClick={() => openIssue(issue.id)}
            className="text-text-dim hover:bg-surface-3 hover:text-text flex size-6 shrink-0 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </td>
      {columns.slice(1).map((c) => (
        <td key={c.id} className={cn("border-border border-r", c.width)}>
          {c.render(issue, set)}
        </td>
      ))}
    </tr>
  );
}

export function IssueTable({ issues }: { issues: IssueDTO[] }) {
  const { meta } = useIssuesContext();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "key", dir: "desc" });
  const [hidden, setHidden] = useState<Set<string>>(HIDDEN_BY_DEFAULT);
  const sorted = useMemo(() => sortIssues(issues, sort.key, sort.dir, meta), [issues, sort, meta]);
  const columns = COLUMNS.filter((c) => c.fixed || !hidden.has(c.id));

  const header = (c: Pick<Column, "label" | "sort" | "width"> & { id: string }) => {
    const active = c.sort && sort.key === c.sort;
    const Arrow = sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <th
        key={c.id}
        scope="col"
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
        className={cn(
          "border-border bg-surface text-text-dim h-9 border-r border-b px-2 text-left text-xs font-medium",
          c.width,
        )}
      >
        {c.sort ? (
          <button
            type="button"
            onClick={() =>
              setSort((s) => ({
                key: c.sort!,
                dir: s.key === c.sort && s.dir === "asc" ? "desc" : "asc",
              }))
            }
            className="hover:text-text flex cursor-pointer items-center gap-1"
          >
            {c.label}
            {active && <Arrow className="size-3" />}
          </button>
        ) : (
          c.label
        )}
      </th>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex h-10 shrink-0 items-center justify-end border-b px-4">
        <Dropdown>
          <DropdownTrigger asChild>
            <Button size="sm" variant="ghost">
              <Columns3 />
              Colonnes
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end" className="w-48">
            <DropdownLabel>Colonnes affichées</DropdownLabel>
            {COLUMNS.filter((c) => !c.fixed).map((c) => (
              <DropdownCheckboxItem
                key={c.id}
                checked={!hidden.has(c.id)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() =>
                  setHidden((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })
                }
              >
                {c.label}
              </DropdownCheckboxItem>
            ))}
          </DropdownContent>
        </Dropdown>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {header(columns[0]!)}
              {header({ id: "title", label: "Titre", sort: "title", width: "min-w-72" })}
              {columns.slice(1).map(header)}
            </tr>
          </thead>
          <tbody>
            {sorted.map((issue) => (
              <Row key={issue.id} issue={issue} columns={columns} />
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="text-text-dim p-8 text-center text-sm">Aucune tâche.</p>
        )}
      </div>
    </div>
  );
}
