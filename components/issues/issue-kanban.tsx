"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import type { IssueDTO } from "@/lib/issues/types";
import { sortOrderBetween } from "@/lib/issues/sort-order";
import { defaultsForGroup, groupMovePatch, type GroupBy, type IssueGroup } from "@/lib/issues/view";
import { cn } from "@/lib/utils";
import { AddInGroupButton, GroupTitle } from "./group-header";
import { IssueCard } from "./issue-card";
import { useIssuesContext } from "./issues-context";
import { useUpdateIssue } from "./use-issues";

/**
 * Une même tâche peut figurer dans plusieurs colonnes (regroupement par assigné) :
 * l'identifiant de glisser-déposer est donc « colonne:tâche ».
 */
type Columns = Record<string, string[]>;
const SEP = "::";
const dndId = (column: string, issueId: string) => `${column}${SEP}${issueId}`;
const issueIdOf = (id: string) => id.slice(id.indexOf(SEP) + SEP.length);
const COLUMN_PREFIX = "column::";

function toColumns(groups: IssueGroup[]): Columns {
  return Object.fromEntries(groups.map((g) => [g.key, g.issues.map((i) => dndId(g.key, i.id))]));
}

function SortableCard({ id, issue, groupBy }: { id: string; issue: IssueDTO; groupBy: GroupBy }) {
  const { canEdit } = useIssuesContext();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !canEdit || issue.id.startsWith("temp-"),
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="carte déplaçable"
    >
      <IssueCard issue={issue} groupBy={groupBy} dragging={isDragging} />
    </div>
  );
}

function Column({
  group,
  ids,
  issuesById,
  groupBy,
}: {
  group: IssueGroup;
  ids: string[];
  issuesById: Map<string, IssueDTO>;
  groupBy: GroupBy;
}) {
  const { canEdit, openCreate } = useIssuesContext();
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${group.key}` });
  return (
    <section
      aria-label={group.label}
      data-testid="kanban-column"
      className="border-border bg-surface flex w-72 shrink-0 flex-col border"
    >
      <header className="border-border flex h-10 shrink-0 items-center gap-2 border-b px-3">
        <GroupTitle group={{ ...group, issues: ids.map((id) => issuesById.get(issueIdOf(id))!) }} />
        {canEdit && (
          <span className="ml-auto">
            <AddInGroupButton
              label={`Nouvelle tâche dans ${group.label}`}
              onClick={() => openCreate(defaultsForGroup(groupBy, group.key))}
            />
          </span>
        )}
      </header>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn("flex flex-1 flex-col gap-2 overflow-y-auto p-2", isOver && "bg-surface-2")}
        >
          {ids.map((id) => {
            const issue = issuesById.get(issueIdOf(id));
            return issue ? <SortableCard key={id} id={id} issue={issue} groupBy={groupBy} /> : null;
          })}
        </div>
      </SortableContext>
    </section>
  );
}

export function IssueKanban({ groups, groupBy }: { groups: IssueGroup[]; groupBy: GroupBy }) {
  const update = useUpdateIssue();
  const issuesById = useMemo(
    () => new Map(groups.flatMap((g) => g.issues).map((i) => [i.id, i])),
    [groups],
  );
  // Colonnes « en cours de glissement » ; sinon on affiche celles calculées depuis les données.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [active, setActive] = useState<{ id: string; from: string } | null>(null);
  const columns = dragColumns ?? toColumns(groups);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findColumn = (id: string, cols: Columns) =>
    id.startsWith(COLUMN_PREFIX)
      ? id.slice(COLUMN_PREFIX.length)
      : Object.keys(cols).find((key) => cols[key]?.includes(id));

  function onDragStart({ active }: DragStartEvent) {
    const id = String(active.id);
    const cols = toColumns(groups);
    setDragColumns(cols);
    setActive({ id, from: findColumn(id, cols)! });
  }

  // Passage d'une colonne à l'autre pendant le glissement.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || !dragColumns) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = findColumn(activeId, dragColumns);
    const to = findColumn(overId, dragColumns);
    if (!from || !to || from === to) return;

    setDragColumns((cols) => {
      if (!cols) return cols;
      const source = cols[from]!.filter((id) => id !== activeId);
      const target = [...cols[to]!];
      const overIndex = target.indexOf(overId);
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, activeId);
      return { ...cols, [from]: source, [to]: target };
    });
  }

  function onDragEnd({ active: dragged, over }: DragEndEvent) {
    const cols = dragColumns;
    const start = active;
    setActive(null);
    setDragColumns(null);
    if (!over || !cols || !start) return;

    const activeId = String(dragged.id);
    const to = findColumn(activeId, cols);
    if (!to) return;
    let ordered = cols[to]!;
    const overIndex = ordered.indexOf(String(over.id));
    const activeIndex = ordered.indexOf(activeId);
    if (overIndex >= 0 && overIndex !== activeIndex) {
      ordered = arrayMove(ordered, activeIndex, overIndex);
    }

    const index = ordered.indexOf(activeId);
    const issue = issuesById.get(issueIdOf(activeId));
    if (!issue) return;
    const neighbour = (i: number) => {
      const id = ordered[i];
      return id ? issuesById.get(issueIdOf(id))?.sortOrder : undefined;
    };
    const patch = {
      ...groupMovePatch(issue, groupBy, start.from, to),
      sortOrder: sortOrderBetween(neighbour(index - 1), neighbour(index + 1)),
    };
    const moved = start.from !== to || index !== toColumns(groups)[to]!.indexOf(activeId);
    if (moved) update.mutate({ issueId: issue.id, patch });
  }

  const activeIssue = active ? issuesById.get(issueIdOf(active.id)) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActive(null);
        setDragColumns(null);
      }}
    >
      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {groups.map((group) => (
          <Column
            key={group.key}
            group={group}
            ids={columns[group.key] ?? []}
            issuesById={issuesById}
            groupBy={groupBy}
          />
        ))}
      </div>
      <DragOverlay>
        {activeIssue && <IssueCard issue={activeIssue} groupBy={groupBy} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
