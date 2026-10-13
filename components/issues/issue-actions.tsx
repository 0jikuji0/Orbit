"use client";

import { Archive, MoreHorizontal, Pencil } from "lucide-react";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { useIssuesContext } from "./issues-context";
import { useArchiveIssue } from "./use-issues";

export function IssueActions({ issueId, onRename }: { issueId: string; onRename: () => void }) {
  const { canEdit } = useIssuesContext();
  const archive = useArchiveIssue();
  if (!canEdit) return null;
  return (
    <Dropdown>
      <DropdownTrigger
        aria-label="Actions"
        onClick={(e) => e.stopPropagation()}
        className="text-text-dim hover:bg-surface-3 hover:text-text flex size-6 shrink-0 cursor-pointer items-center justify-center outline-none"
      >
        <MoreHorizontal className="size-4" />
      </DropdownTrigger>
      <DropdownContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownItem onSelect={onRename}>
          <Pencil />
          Renommer
        </DropdownItem>
        <DropdownItem onSelect={() => archive.mutate(issueId)}>
          <Archive />
          Archiver
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
