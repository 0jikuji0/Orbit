"use client";

import { Check, ChevronRight, Link2, Maximize2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { IssueDetailDTO } from "@/lib/issues/detail-types";
import type { IssuePatch } from "@/lib/issues/view";
import { cn } from "@/lib/utils";
import { issueTitleSchema } from "@/lib/validators/issue";
import { IssueKey } from "../issue-list";
import { useIssuesContext } from "../issues-context";
import { useUpdateIssue } from "../use-issues";
import { useIssueDetail } from "../use-issue-detail";
import { Attachments } from "./attachments";
import { IssueDescription } from "./description";
import { PropertiesPanel } from "./properties-panel";
import { SubIssues } from "./sub-issues";
import { Timeline } from "./timeline";

export function issueHref(workspaceSlug: string, projectId: string, sequenceId: number) {
  return `/${workspaceSlug}/projects/${projectId}/issues/${sequenceId}`;
}

function TitleField({ title, onSave }: { title: string; onSave: (title: string) => void }) {
  const { canEdit } = useIssuesContext();
  const [value, setValue] = useState(title);
  useEffect(() => setValue(title), [title]);
  const commit = () => {
    const parsed = issueTitleSchema.safeParse(value);
    if (parsed.success && parsed.data !== title) onSave(parsed.data);
    else setValue(title);
  };
  return (
    <textarea
      aria-label="Titre"
      value={value}
      readOnly={!canEdit}
      rows={1}
      onChange={(e) => setValue(e.target.value.replace(/\n/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") setValue(title);
      }}
      className="text-text field-sizing-content w-full resize-none bg-transparent text-lg font-medium outline-none"
    />
  );
}

function CopyLink({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip content={copied ? "Lien copié" : "Copier le lien"}>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Copier le lien"
        onClick={async () => {
          await navigator.clipboard.writeText(`${window.location.origin}${href}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check /> : <Link2 />}
      </Button>
    </Tooltip>
  );
}

type IssueDetailProps = {
  issueId: string;
  initialData?: IssueDetailDTO;
  variant: "peek" | "page";
  onClose?: () => void;
  /** Ouvre une autre tâche (parent, sous-tâche). */
  onOpenIssue: (issue: { id: string; sequenceId: number }) => void;
};

export function IssueDetail({
  issueId,
  initialData,
  variant,
  onClose,
  onOpenIssue,
}: IssueDetailProps) {
  const { workspaceSlug, meta, currentUserId } = useIssuesContext();
  const { data: issue, isError } = useIssueDetail(issueId, initialData);
  const update = useUpdateIssue();
  const set = (patch: IssuePatch) => update.mutate({ issueId, patch });

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-text-muted text-sm">Cette tâche n&apos;existe plus ou a été archivée.</p>
        {onClose && (
          <Button size="sm" onClick={onClose}>
            Fermer
          </Button>
        )}
      </div>
    );
  }
  if (!issue) return <div className="text-text-dim p-6 text-sm">Chargement…</div>;

  const href = issueHref(workspaceSlug, meta.id, issue.sequenceId);
  const isPage = variant === "page";

  const header = (
    <div className="border-border flex h-12 shrink-0 items-center gap-2 border-b px-4 text-sm">
      {issue.parent && (
        <>
          <button
            type="button"
            onClick={() => onOpenIssue(issue.parent!)}
            className="text-text-muted hover:text-text flex min-w-0 cursor-pointer items-center gap-1.5"
          >
            <span className="font-mono text-xs">
              {meta.identifier}-{issue.parent.sequenceId}
            </span>
            <span className="max-w-40 truncate">{issue.parent.title}</span>
          </button>
          <ChevronRight className="text-text-dim size-3.5 shrink-0" />
        </>
      )}
      <IssueKey issue={issue} />
      <span className="ml-auto flex items-center gap-1">
        <CopyLink href={href} />
        {!isPage && (
          <Tooltip content="Ouvrir en pleine page">
            <Button size="icon-sm" variant="ghost" aria-label="Ouvrir en pleine page" asChild>
              <Link href={href}>
                <Maximize2 />
              </Link>
            </Button>
          </Tooltip>
        )}
        {onClose && (
          <Tooltip content="Fermer (Échap)">
            <Button size="icon-sm" variant="ghost" aria-label="Fermer" onClick={onClose}>
              <X />
            </Button>
          </Tooltip>
        )}
      </span>
    </div>
  );

  const main = (
    <div className="flex flex-col gap-6">
      <TitleField title={issue.title} onSave={(title) => set({ title })} />
      {!isPage && <PropertiesPanel issue={issue} onChange={set} />}
      <IssueDescription
        key={issue.id}
        initial={issue.descriptionJson}
        onSave={(descriptionJson) => set({ descriptionJson })}
      />
      <SubIssues parent={issue} items={issue.children} onOpen={onOpenIssue} />
      <Attachments issueId={issue.id} items={issue.attachments} />
      <Timeline issueId={issue.id} currentUserId={currentUserId} />
    </div>
  );

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col", isPage && "bg-bg")}
      data-testid="issue-detail"
    >
      {header}
      {isPage ? (
        <div className="flex min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-8 py-6">{main}</div>
          </div>
          <aside className="border-border bg-surface w-80 shrink-0 overflow-y-auto border-l p-4">
            <h3 className="text-text-muted mb-2 text-xs font-medium">Propriétés</h3>
            <PropertiesPanel issue={issue} onChange={set} />
            <p className="text-text-dim mt-4 text-xs">Créée par {issue.createdBy.name}</p>
          </aside>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">{main}</div>
      )}
    </div>
  );
}
