"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { IssueDTO } from "@/lib/issues/types";
import { defaultsForGroup, type GroupBy, type IssueGroup } from "@/lib/issues/view";
import { cn } from "@/lib/utils";
import { AddInGroupButton, GroupTitle } from "./group-header";
import { IssueActions } from "./issue-actions";
import { IssueTitle } from "./issue-title";
import { useIssuesContext } from "./issues-context";
import {
  AssigneesPicker,
  DatePicker,
  LabelsPicker,
  PriorityPicker,
  StatePicker,
} from "./properties";
import { useUpdateIssue } from "./use-issues";

export function IssueKey({ issue }: { issue: IssueDTO }) {
  const { meta } = useIssuesContext();
  return (
    <span className="text-text-dim shrink-0 font-mono text-xs">
      {meta.identifier}-{issue.sequenceId || "…"}
    </span>
  );
}

function IssueRow({ issue }: { issue: IssueDTO }) {
  const { openIssue } = useIssuesContext();
  const update = useUpdateIssue();
  const [renaming, setRenaming] = useState(false);
  const set = (patch: Parameters<typeof update.mutate>[0]["patch"]) =>
    update.mutate({ issueId: issue.id, patch });
  const pending = issue.id.startsWith("temp-");

  return (
    <div
      data-testid="issue-row"
      onClick={() => !pending && !renaming && openIssue(issue.id)}
      className={cn(
        "group border-border hover:bg-surface-2 flex h-9 cursor-pointer items-center gap-2 border-b px-4",
        pending && "opacity-60",
      )}
    >
      <PriorityPicker value={issue.priority} onChange={(priority) => set({ priority })} />
      <span className="w-16 shrink-0">
        <IssueKey issue={issue} />
      </span>
      <StatePicker value={issue.stateId} onChange={(stateId) => set({ stateId })} />
      <IssueTitle
        title={issue.title}
        editing={renaming}
        onSubmit={(title) => {
          setRenaming(false);
          set({ title });
        }}
        onCancel={() => setRenaming(false)}
        className="flex-1"
      />
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <LabelsPicker value={issue.labelIds} onChange={(labelIds) => set({ labelIds })} />
        <DatePicker
          label="Échéance"
          value={issue.dueDate}
          onChange={(dueDate) => set({ dueDate })}
          highlightOverdue
        />
        <AssigneesPicker
          value={issue.assigneeIds}
          onChange={(assigneeIds) => set({ assigneeIds })}
        />
        {!pending && <IssueActions issueId={issue.id} onRename={() => setRenaming(true)} />}
      </div>
    </div>
  );
}

export function IssueList({ groups, groupBy }: { groups: IssueGroup[]; groupBy: GroupBy }) {
  const { canEdit, openCreate } = useIssuesContext();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex-1 overflow-y-auto">
      {groups.map((group) => {
        const isOpen = !collapsed.has(group.key);
        return (
          <section key={group.key} aria-label={group.label}>
            <header className="border-border bg-surface sticky top-0 z-10 flex h-9 items-center gap-2 border-b px-4">
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={isOpen}
                className="flex min-w-0 cursor-pointer items-center gap-2"
              >
                {isOpen ? (
                  <ChevronDown className="text-text-dim size-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="text-text-dim size-3.5 shrink-0" />
                )}
                <GroupTitle group={group} />
              </button>
              {canEdit && (
                <span className="ml-auto">
                  <AddInGroupButton
                    label={`Nouvelle tâche dans ${group.label}`}
                    onClick={() => openCreate(defaultsForGroup(groupBy, group.key))}
                  />
                </span>
              )}
            </header>
            {isOpen && group.issues.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
          </section>
        );
      })}
    </div>
  );
}
