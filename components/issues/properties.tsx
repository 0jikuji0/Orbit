"use client";

import type { Priority } from "@prisma/client";
import { CalendarDays, CircleDashed, Tag, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { fieldClassName } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/issues/priority";
import { cn } from "@/lib/utils";
import { useIssuesContext } from "./issues-context";
import { PriorityIcon } from "./priority-icon";
import { StateDot } from "./state-dot";

/**
 * Sélecteurs de propriétés d'une tâche.
 * - `compact` : déclencheur minimal (lignes de liste, cartes kanban)
 * - `full` : bouton avec libellé (modale de création, panneau de détail)
 */
type Variant = "compact" | "full";

const compactTrigger =
  "inline-flex h-6 min-w-6 shrink-0 cursor-pointer items-center justify-center gap-1 px-1 text-xs text-text-muted outline-none hover:bg-surface-3 disabled:cursor-default disabled:hover:bg-transparent";
const fullTrigger =
  "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 border border-border bg-surface-2 px-2 text-xs text-text outline-none hover:bg-surface-3 disabled:cursor-default";

function Trigger({
  variant,
  label,
  children,
  className,
}: {
  variant: Variant;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const { canEdit } = useIssuesContext();
  const button = (
    <DropdownTrigger
      disabled={!canEdit}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(variant === "compact" ? compactTrigger : fullTrigger, className)}
    >
      {children}
    </DropdownTrigger>
  );
  return variant === "compact" ? <Tooltip content={label}>{button}</Tooltip> : button;
}

// ─── État ───────────────────────────────────────────────────────────────

export function StatePicker({
  value,
  onChange,
  variant = "compact",
}: {
  value: string;
  onChange: (stateId: string) => void;
  variant?: Variant;
}) {
  const { meta } = useIssuesContext();
  const current = meta.states.find((s) => s.id === value);
  return (
    <Dropdown>
      <Trigger variant={variant} label={`État : ${current?.name ?? "?"}`}>
        {current ? <StateDot color={current.color} /> : <CircleDashed className="size-3.5" />}
        {variant === "full" && (current?.name ?? "État")}
      </Trigger>
      <DropdownContent onClick={(e) => e.stopPropagation()}>
        {meta.states.map((s) => (
          <DropdownItem key={s.id} onSelect={() => onChange(s.id)}>
            <StateDot color={s.color} />
            {s.name}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

// ─── Priorité ───────────────────────────────────────────────────────────

export function PriorityPicker({
  value,
  onChange,
  variant = "compact",
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
  variant?: Variant;
}) {
  return (
    <Dropdown>
      <Trigger variant={variant} label={`Priorité : ${PRIORITY_LABELS[value]}`}>
        <PriorityIcon priority={value} />
        {variant === "full" && PRIORITY_LABELS[value]}
      </Trigger>
      <DropdownContent onClick={(e) => e.stopPropagation()}>
        {PRIORITIES.map((p) => (
          <DropdownItem key={p} onSelect={() => onChange(p)}>
            <PriorityIcon priority={p} />
            {PRIORITY_LABELS[p]}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

// ─── Assignés ───────────────────────────────────────────────────────────

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function AssigneesPicker({
  value,
  onChange,
  variant = "compact",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  variant?: Variant;
}) {
  const { meta } = useIssuesContext();
  const selected = meta.members.filter((m) => value.includes(m.id));
  const label = selected.length ? selected.map((m) => m.name).join(", ") : "Non assigné";
  return (
    <Dropdown>
      <Trigger variant={variant} label={`Assignés : ${label}`}>
        {selected.length ? (
          <span className="flex -space-x-1">
            {selected.slice(0, 3).map((m) => (
              <Avatar key={m.id} name={m.name} src={m.avatarUrl} size="sm" />
            ))}
          </span>
        ) : (
          <UserRound className="size-3.5" />
        )}
        {variant === "full" && (selected.length ? label : "Assignés")}
      </Trigger>
      <DropdownContent className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownLabel>Membres du projet</DropdownLabel>
        {meta.members.map((m) => (
          <DropdownCheckboxItem
            key={m.id}
            checked={value.includes(m.id)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => onChange(toggle(value, m.id))}
          >
            <Avatar name={m.name} src={m.avatarUrl} size="xs" />
            <span className="truncate">{m.name}</span>
          </DropdownCheckboxItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

// ─── Labels ─────────────────────────────────────────────────────────────

export function LabelsPicker({
  value,
  onChange,
  variant = "compact",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  variant?: Variant;
}) {
  const { meta } = useIssuesContext();
  const selected = meta.labels.filter((l) => value.includes(l.id));
  return (
    <Dropdown>
      <Trigger
        variant={variant}
        label={selected.length ? `Labels : ${selected.map((l) => l.name).join(", ")}` : "Labels"}
        className={
          selected.length && variant === "compact" ? "px-0 hover:bg-transparent" : undefined
        }
      >
        {selected.length ? (
          <span className="flex items-center gap-1">
            {selected.map((l) => (
              <Badge key={l.id} color={l.color} className="hover:bg-surface-3">
                {l.name}
              </Badge>
            ))}
          </span>
        ) : (
          <>
            <Tag className="size-3.5" />
            {variant === "full" && "Labels"}
          </>
        )}
      </Trigger>
      <DropdownContent className="w-56" onClick={(e) => e.stopPropagation()}>
        {meta.labels.length === 0 && (
          <DropdownLabel>Aucun label. Créez-en dans les réglages du projet.</DropdownLabel>
        )}
        {meta.labels.map((l) => (
          <DropdownCheckboxItem
            key={l.id}
            checked={value.includes(l.id)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => onChange(toggle(value, l.id))}
          >
            <span aria-hidden className="size-2 shrink-0" style={{ backgroundColor: l.color }} />
            <span className="truncate">{l.name}</span>
          </DropdownCheckboxItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

// ─── Dates ──────────────────────────────────────────────────────────────

const shortDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const toInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const fromInput = (v: string) => (v ? new Date(`${v}T00:00:00.000Z`) : null);

function isOverdue(date: Date) {
  const today = new Date();
  return date.getTime() < Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
}

export function DatePicker({
  value,
  onChange,
  label,
  variant = "compact",
  highlightOverdue = false,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label: string;
  variant?: Variant;
  highlightOverdue?: boolean;
}) {
  const { canEdit } = useIssuesContext();
  if (variant === "compact" && !value && !canEdit) return null;
  return (
    <Popover>
      <PopoverTrigger
        disabled={!canEdit}
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className={cn(
          variant === "compact" ? compactTrigger : fullTrigger,
          "font-mono",
          highlightOverdue && value && isOverdue(value) && "text-danger",
        )}
      >
        <CalendarDays className="size-3.5" />
        {value
          ? shortDate.format(value)
          : variant === "full" && <span className="font-sans">{label}</span>}
      </PopoverTrigger>
      <PopoverContent
        className="flex w-auto min-w-0 items-center gap-2 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="date"
          aria-label={label}
          defaultValue={toInput(value)}
          onChange={(e) => onChange(fromInput(e.target.value))}
          className={cn(fieldClassName, "w-40 font-mono")}
        />
        {value && (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Effacer la date"
            onClick={() => onChange(null)}
          >
            <X />
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
