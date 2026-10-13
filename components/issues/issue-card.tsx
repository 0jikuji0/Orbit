"use client";

import { useState } from "react";
import type { IssueDTO } from "@/lib/issues/types";
import type { GroupBy } from "@/lib/issues/view";
import { cn } from "@/lib/utils";
import { IssueActions } from "./issue-actions";
import { IssueKey } from "./issue-list";
import { IssueTitle } from "./issue-title";
import {
  AssigneesPicker,
  DatePicker,
  LabelsPicker,
  PriorityPicker,
  StatePicker,
} from "./properties";
import { useUpdateIssue } from "./use-issues";

export function IssueCard({
  issue,
  groupBy,
  dragging = false,
  overlay = false,
}: {
  issue: IssueDTO;
  groupBy: GroupBy;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const update = useUpdateIssue();
  const [renaming, setRenaming] = useState(false);
  const set = (patch: Parameters<typeof update.mutate>[0]["patch"]) =>
    update.mutate({ issueId: issue.id, patch });

  return (
    <div
      data-testid="issue-card"
      className={cn(
        "group border-border bg-surface-2 hover:border-border-strong flex flex-col gap-2 border p-2.5",
        dragging && "opacity-30",
        overlay && "border-border-strong bg-surface-3 cursor-grabbing",
        issue.id.startsWith("temp-") && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <IssueKey issue={issue} />
        {!overlay && !issue.id.startsWith("temp-") && (
          <span className="opacity-0 group-hover:opacity-100 focus-within:opacity-100">
            <IssueActions issueId={issue.id} onRename={() => setRenaming(true)} />
          </span>
        )}
      </div>
      <IssueTitle
        title={issue.title}
        editing={renaming}
        onSubmit={(title) => {
          setRenaming(false);
          set({ title });
        }}
        onCancel={() => setRenaming(false)}
        className="line-clamp-2 text-sm whitespace-normal"
      />
      <div className="-ml-1 flex flex-wrap items-center gap-1">
        {groupBy !== "priority" && (
          <PriorityPicker value={issue.priority} onChange={(priority) => set({ priority })} />
        )}
        {groupBy !== "state" && (
          <StatePicker value={issue.stateId} onChange={(stateId) => set({ stateId })} />
        )}
        <AssigneesPicker
          value={issue.assigneeIds}
          onChange={(assigneeIds) => set({ assigneeIds })}
        />
        <DatePicker
          label="Échéance"
          value={issue.dueDate}
          onChange={(dueDate) => set({ dueDate })}
          highlightOverdue
        />
        <LabelsPicker value={issue.labelIds} onChange={(labelIds) => set({ labelIds })} />
      </div>
    </div>
  );
}
