"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ProjectIssues } from "@/server/queries/issues";
import { PriorityIcon } from "./priority-icon";
import { StateDot } from "./state-dot";

type Issue = ProjectIssues["issues"][number];

type IssueListProps = {
  identifier: string;
  states: ProjectIssues["states"];
  issues: Issue[];
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function IssueRow({ issue, identifier }: { issue: Issue; identifier: string }) {
  return (
    <div className="border-border hover:bg-surface-2 flex h-9 items-center gap-3 border-b px-4">
      <PriorityIcon priority={issue.priority} />
      <span className="text-text-dim w-16 shrink-0 font-mono text-xs">
        {identifier}-{issue.sequenceId}
      </span>
      <span className="min-w-0 flex-1 truncate">{issue.title}</span>
      <div className="flex shrink-0 items-center gap-2">
        {issue.labels.map(({ label }) => (
          <Badge key={label.id} color={label.color}>
            {label.name}
          </Badge>
        ))}
        {issue.dueDate && (
          <span className="text-text-dim font-mono text-xs">
            {dateFormat.format(issue.dueDate)}
          </span>
        )}
        <div className="flex -space-x-1">
          {issue.assignees.map(({ user }) => (
            <Avatar key={user.id} name={user.name} src={user.avatarUrl} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function IssueList({ identifier, states, issues }: IssueListProps) {
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
            </header>
            {isOpen &&
              group.map((issue) => (
                <IssueRow key={issue.id} issue={issue} identifier={identifier} />
              ))}
          </section>
        );
      })}
    </div>
  );
}
