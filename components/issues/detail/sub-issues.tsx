"use client";

import { Plus, Unlink } from "lucide-react";
import { useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import type { IssueDTO } from "@/lib/issues/types";
import { issueTitleSchema } from "@/lib/validators/issue";
import { IssueKey } from "../issue-list";
import { useIssuesContext } from "../issues-context";
import { PriorityPicker, StatePicker } from "../properties";
import { useCreateIssue, useUpdateIssue } from "../use-issues";

export function SubIssues({
  parent,
  items,
  onOpen,
}: {
  parent: IssueDTO;
  items: IssueDTO[];
  onOpen: (issue: { id: string; sequenceId: number }) => void;
}) {
  const { meta, canEdit } = useIssuesContext();
  const create = useCreateIssue();
  const update = useUpdateIssue();
  const [title, setTitle] = useState("");
  const done = items.filter((i) => {
    const group = meta.states.find((s) => s.id === i.stateId)?.group;
    return group === "COMPLETED" || group === "CANCELLED";
  }).length;

  function add() {
    const parsed = issueTitleSchema.safeParse(title);
    if (!parsed.success) return;
    const defaultState = meta.states.find((s) => s.group === "UNSTARTED") ?? meta.states[0];
    create.mutate({
      tempId: `temp-${crypto.randomUUID()}`,
      title: parsed.data,
      stateId: defaultState?.id ?? parent.stateId,
      priority: "NONE",
      assigneeIds: [],
      labelIds: [],
      startDate: null,
      dueDate: null,
      parentId: parent.id,
      cycleId: parent.cycleId,
      moduleId: parent.moduleId,
    });
    setTitle("");
  }

  return (
    <section aria-label="Sous-tâches" className="flex flex-col gap-2">
      <h3 className="text-text-muted flex items-center gap-2 text-xs font-medium">
        Sous-tâches
        {items.length > 0 && (
          <span className="text-text-dim font-mono">
            {done}/{items.length}
          </span>
        )}
      </h3>
      {items.length > 0 && (
        <div className="border-border border">
          {items.map((child) => (
            <div
              key={child.id}
              className="group border-border hover:bg-surface-2 flex h-9 items-center gap-2 border-b px-2 last:border-b-0"
            >
              <PriorityPicker
                value={child.priority}
                onChange={(priority) => update.mutate({ issueId: child.id, patch: { priority } })}
              />
              <StatePicker
                value={child.stateId}
                onChange={(stateId) => update.mutate({ issueId: child.id, patch: { stateId } })}
              />
              <span className="w-16 shrink-0">
                <IssueKey issue={child} />
              </span>
              <button
                type="button"
                onClick={() => onOpen(child)}
                className="min-w-0 flex-1 cursor-pointer truncate text-left hover:underline"
              >
                {child.title}
              </button>
              {canEdit && (
                <Tooltip content="Détacher">
                  <button
                    type="button"
                    aria-label={`Détacher ${child.title}`}
                    onClick={() => update.mutate({ issueId: child.id, patch: { parentId: null } })}
                    className="text-text-dim hover:bg-surface-3 hover:text-text flex size-6 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Unlink className="size-3.5" />
                  </button>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      )}
      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="border-border focus-within:border-border-strong flex h-8 items-center gap-2 border border-dashed px-2"
        >
          <Plus className="text-text-dim size-4 shrink-0" />
          <input
            aria-label="Nouvelle sous-tâche"
            placeholder="Ajouter une sous-tâche…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="placeholder:text-text-dim min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </form>
      )}
    </section>
  );
}
