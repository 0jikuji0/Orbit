"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { IssueGroup } from "@/lib/issues/view";
import { NONE } from "@/lib/issues/view";
import { UserRound } from "lucide-react";
import { PriorityIcon } from "./priority-icon";
import { StateDot } from "./state-dot";

export function GroupIcon({ group }: { group: IssueGroup }) {
  if (group.color) return <StateDot color={group.color} />;
  if (group.priority) return <PriorityIcon priority={group.priority} />;
  if (group.avatar)
    return <Avatar name={group.avatar.name} src={group.avatar.avatarUrl} size="xs" />;
  if (group.key === NONE) return <UserRound className="text-text-dim size-4" />;
  return null;
}

export function AddInGroupButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="text-text-dim hover:bg-surface-3 hover:text-text flex size-6 cursor-pointer items-center justify-center"
    >
      <Plus className="size-4" />
    </button>
  );
}

export function GroupTitle({ group, children }: { group: IssueGroup; children?: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
      <GroupIcon group={group} />
      <span className="truncate">{group.label}</span>
      <span className="text-text-dim font-mono text-xs font-normal">{group.issues.length}</span>
      {children}
    </span>
  );
}
