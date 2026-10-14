"use client";

import { ListFilter, SlidersHorizontal, UserRound, X, Boxes, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownLabel,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/issues/priority";
import {
  EMPTY_FILTERS,
  GROUP_BYS,
  GROUP_BY_LABELS,
  NONE,
  hasActiveFilters,
  type GroupBy,
  type IssueFilters,
} from "@/lib/issues/view";
import { useIssuesContext } from "./issues-context";
import { PriorityIcon } from "./priority-icon";
import { StateDot } from "./state-dot";

type Option = { value: string; label: string; icon: ReactNode };

function useFilterOptions(): Record<keyof IssueFilters, { title: string; options: Option[] }> {
  const { meta } = useIssuesContext();
  return {
    state: {
      title: "État",
      options: meta.states.map((s) => ({
        value: s.id,
        label: s.name,
        icon: <StateDot color={s.color} />,
      })),
    },
    priority: {
      title: "Priorité",
      options: PRIORITIES.map((p) => ({
        value: p,
        label: PRIORITY_LABELS[p],
        icon: <PriorityIcon priority={p} />,
      })),
    },
    assignee: {
      title: "Assigné",
      options: [
        ...meta.members.map((m) => ({
          value: m.id,
          label: m.name,
          icon: <Avatar name={m.name} src={m.avatarUrl} size="xs" />,
        })),
        { value: NONE, label: "Non assigné", icon: <UserRound /> },
      ],
    },
    cycle: {
      title: "Cycle",
      options: [
        ...meta.cycles.map((c) => ({ value: c.id, label: c.name, icon: <RefreshCcw /> })),
        { value: NONE, label: "Sans cycle", icon: <X /> },
      ],
    },
    module: {
      title: "Module",
      options: [
        ...meta.modules.map((m) => ({ value: m.id, label: m.name, icon: <Boxes /> })),
        { value: NONE, label: "Sans module", icon: <X /> },
      ],
    },
    label: {
      title: "Label",
      options: meta.labels.map((l) => ({
        value: l.id,
        label: l.name,
        icon: <span aria-hidden className="size-2 shrink-0" style={{ backgroundColor: l.color }} />,
      })),
    },
  };
}

const toggle = <T extends string>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function FiltersMenu({
  filters,
  onChange,
}: {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
}) {
  const groups = useFilterOptions();
  const count = Object.values(filters).reduce((n, v) => n + v.length, 0);
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button size="sm">
          <ListFilter />
          Filtres
          {count > 0 && <span className="text-accent font-mono text-xs">{count}</span>}
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-48">
        {(Object.keys(groups) as (keyof IssueFilters)[]).map((field) => (
          <DropdownSub key={field}>
            <DropdownSubTrigger>
              {groups[field].title}
              {filters[field].length > 0 && (
                <span className="text-accent font-mono text-xs">{filters[field].length}</span>
              )}
            </DropdownSubTrigger>
            <DropdownSubContent className="max-h-80 w-56 overflow-y-auto">
              {groups[field].options.length === 0 && <DropdownLabel>Aucune valeur</DropdownLabel>}
              {groups[field].options.map((o) => (
                <DropdownCheckboxItem
                  key={o.value}
                  checked={(filters[field] as string[]).includes(o.value)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() =>
                    onChange({ ...filters, [field]: toggle(filters[field] as string[], o.value) })
                  }
                >
                  {o.icon}
                  <span className="truncate">{o.label}</span>
                </DropdownCheckboxItem>
              ))}
            </DropdownSubContent>
          </DropdownSub>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

export function DisplayMenu({
  groupBy,
  onChange,
}: {
  groupBy: GroupBy;
  onChange: (groupBy: GroupBy) => void;
}) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button size="sm">
          <SlidersHorizontal />
          Affichage
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-48">
        <DropdownLabel>Regrouper par</DropdownLabel>
        <DropdownRadioGroup value={groupBy} onValueChange={(v) => onChange(v as GroupBy)}>
          {GROUP_BYS.map((g) => (
            <DropdownRadioItem key={g} value={g}>
              {GROUP_BY_LABELS[g]}
            </DropdownRadioItem>
          ))}
        </DropdownRadioGroup>
      </DropdownContent>
    </Dropdown>
  );
}

/** Rappel des filtres actifs, sous la barre du haut. */
export function ActiveFilters({
  filters,
  onChange,
}: {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
}) {
  const groups = useFilterOptions();
  if (!hasActiveFilters(filters)) return null;
  return (
    <div className="border-border flex min-h-10 flex-wrap items-center gap-2 border-b px-4 py-1.5">
      {(Object.keys(groups) as (keyof IssueFilters)[])
        .filter((field) => filters[field].length > 0)
        .map((field) => (
          <span
            key={field}
            className="border-border flex h-6 items-center gap-1.5 border pl-2 text-xs"
          >
            <span className="text-text-dim">{groups[field].title} :</span>
            {groups[field].options
              .filter((o) => (filters[field] as string[]).includes(o.value))
              .map((o) => o.label)
              .join(", ")}
            <button
              type="button"
              aria-label={`Retirer le filtre ${groups[field].title}`}
              onClick={() => onChange({ ...filters, [field]: [] })}
              className="text-text-dim hover:bg-surface-2 hover:text-text flex size-6 cursor-pointer items-center justify-center"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      <Button size="sm" variant="ghost" onClick={() => onChange(EMPTY_FILTERS)}>
        Tout effacer
      </Button>
    </div>
  );
}
