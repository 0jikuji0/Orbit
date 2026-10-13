"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { MockIssue, MockState, MockUser } from "@/lib/mock-data";
import { PriorityIcon } from "./priority-icon";
import { StateDot } from "./state-dot";

type IssueListProps = {
  identifier: string;
  states: MockState[];
  issues: MockIssue[];
  users: MockUser[];
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

function IssueRow({
  issue,
  identifier,
  users,
}: {
  issue: MockIssue;
  identifier: string;
  users: MockUser[];
}) {
  const assignees = users.filter((u) => issue.assigneeIds.includes(u.id));
  return (
    <div className="border-border hover:bg-surface-2 flex h-9 cursor-pointer items-center gap-3 border-b px-4">
      <PriorityIcon priority={issue.priority} />
      <span className="text-text-dim w-14 shrink-0 font-mono text-xs">
        {identifier}-{issue.sequenceId}
      </span>
      <span className="min-w-0 flex-1 truncate">{issue.title}</span>
      <div className="flex shrink-0 items-center gap-2">
        {issue.labels.map((l) => (
          <Badge key={l.name} color={l.color}>
            {l.name}
          </Badge>
        ))}
        {issue.dueDate && (
          <span className="text-text-dim font-mono text-xs">
            {dateFormat.format(new Date(issue.dueDate))}
          </span>
        )}
        <div className="flex -space-x-1">
          {assignees.map((u) => (
            <Avatar key={u.id} name={u.name} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function IssueList({ identifier, states, issues, users }: IssueListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex-1 overflow-y-auto">
      {states.map((state) => {
        const group = issues.filter((i) => i.stateId === state.id);
        const isOpen = !collapsed.has(state.id);
        return (
          <section key={state.id}>
            <header className="border-border bg-surface sticky top-0 z-10 flex h-9 items-center gap-2 border-b px-4">
              <button
                type="button"
                onClick={() => toggle(state.id)}
                aria-expanded={isOpen}
                className="flex cursor-pointer items-center gap-2 text-sm font-medium"
              >
                {isOpen ? (
                  <ChevronDown className="text-text-dim size-3.5" />
                ) : (
                  <ChevronRight className="text-text-dim size-3.5" />
                )}
                <StateDot color={state.color} />
                {state.name}
                <span className="text-text-dim font-mono text-xs">{group.length}</span>
              </button>
              <button
                type="button"
                aria-label={`Nouvelle tâche dans ${state.name}`}
                className="text-text-dim hover:bg-surface-2 hover:text-text ml-auto flex size-6 cursor-pointer items-center justify-center"
              >
                <Plus className="size-4" />
              </button>
            </header>
            {isOpen &&
              group.map((issue) => (
                <IssueRow key={issue.id} issue={issue} identifier={identifier} users={users} />
              ))}
          </section>
        );
      })}
    </div>
  );
}
