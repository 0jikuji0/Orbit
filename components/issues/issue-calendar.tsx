"use client";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { dayKey, monthGrid, todayUTC } from "@/lib/issues/calendar";
import type { IssueDTO } from "@/lib/issues/types";
import { cn } from "@/lib/utils";
import { useIssuesContext } from "./issues-context";
import { PriorityIcon } from "./priority-icon";
import { StateDot } from "./state-dot";
import { useUpdateIssue } from "./use-issues";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const monthLabel = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function Chip({ issue }: { issue: IssueDTO }) {
  const { meta, canEdit, openIssue } = useIssuesContext();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
    disabled: !canEdit,
  });
  const state = meta.states.find((s) => s.id === issue.stateId);
  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid="calendar-issue"
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      onClick={() => openIssue(issue.id)}
      className={cn(
        "border-border bg-surface-2 hover:border-border-strong flex h-6 w-full cursor-pointer items-center gap-1.5 border px-1.5 text-left text-xs",
        isDragging && "border-border-strong bg-surface-3 relative z-20",
      )}
    >
      {state && <StateDot color={state.color} />}
      <PriorityIcon priority={issue.priority} className="size-3" />
      <span className="text-text-dim shrink-0 font-mono">
        {meta.identifier}-{issue.sequenceId || "…"}
      </span>
      <span className="truncate">{issue.title}</span>
    </button>
  );
}

function Day({ day, month, issues }: { day: Date; month: number; issues: IssueDTO[] }) {
  const { canEdit, openCreate } = useIssuesContext();
  const key = dayKey(day);
  const { setNodeRef, isOver } = useDroppable({ id: key });
  const isToday = key === dayKey(todayUTC());
  const outside = day.getUTCMonth() !== month;
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={key}
      className={cn(
        "group border-border flex min-h-28 flex-col gap-1 border-r border-b p-1",
        outside && "bg-bg",
        isOver && "bg-surface-2",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-text-dim px-1 font-mono text-xs",
            outside && "opacity-50",
            isToday && "bg-accent text-accent-fg",
          )}
        >
          {day.getUTCDate()}
        </span>
        {canEdit && (
          <button
            type="button"
            aria-label={`Nouvelle tâche le ${key}`}
            onClick={() => openCreate({ dueDate: day })}
            className="text-text-dim hover:bg-surface-3 hover:text-text flex size-5 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      {issues.map((issue) => (
        <Chip key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

export function IssueCalendar({ issues }: { issues: IssueDTO[] }) {
  const update = useUpdateIssue();
  const [cursor, setCursor] = useState(() => {
    const t = todayUTC();
    return { year: t.getUTCFullYear(), month: t.getUTCMonth() };
  });
  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const byDay = useMemo(() => {
    const map = new Map<string, IssueDTO[]>();
    for (const issue of issues) {
      if (!issue.dueDate) continue;
      const key = dayKey(issue.dueDate);
      map.set(key, [...(map.get(key) ?? []), issue]);
    }
    return map;
  }, [issues]);
  const undated = issues.filter((i) => !i.dueDate).length;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const issue = issues.find((i) => i.id === active.id);
    const target = String(over.id);
    if (!issue || (issue.dueDate && dayKey(issue.dueDate) === target)) return;
    const dueDate = new Date(`${target}T00:00:00.000Z`);
    // Ne pas laisser l'échéance passer avant la date de début.
    const startDate = issue.startDate && issue.startDate > dueDate ? dueDate : undefined;
    update.mutate({ issueId: issue.id, patch: { dueDate, ...(startDate && { startDate }) } });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex h-11 shrink-0 items-center gap-2 border-b px-4">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Mois précédent"
          onClick={() => shift(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Mois suivant" onClick={() => shift(1)}>
          <ChevronRight />
        </Button>
        <h2 className="text-sm font-medium capitalize" aria-live="polite">
          {monthLabel.format(new Date(Date.UTC(cursor.year, cursor.month, 1)))}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const t = todayUTC();
            setCursor({ year: t.getUTCFullYear(), month: t.getUTCMonth() });
          }}
        >
          Aujourd&apos;hui
        </Button>
        <span className="text-text-dim ml-auto text-xs">
          {undated} tâche{undated > 1 ? "s" : ""} sans échéance
        </span>
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div role="region" aria-label="Calendrier des échéances" className="flex-1 overflow-y-auto">
          <div role="row" className="border-border bg-surface grid grid-cols-7 border-b">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                role="columnheader"
                className="border-border text-text-dim border-r px-2 py-1 text-xs"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => (
              <Day
                key={dayKey(day)}
                day={day}
                month={cursor.month}
                issues={byDay.get(dayKey(day)) ?? []}
              />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
