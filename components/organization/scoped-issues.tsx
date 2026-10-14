"use client";

import type { StateGroup } from "@prisma/client";
import type { ReactNode } from "react";
import { IssuesView, type IssueScope } from "@/components/issues/issues-view";
import { Badge } from "@/components/ui/badge";
import { progress } from "@/lib/issues/cycles";
import type { IssueDTO, ProjectMeta } from "@/lib/issues/types";
import { ProgressSummary } from "./progress-bar";

/** Tâches d'un cycle ou d'un module, avec un bandeau de progression mis à jour en direct. */
export function ScopedIssues({
  workspaceSlug,
  meta,
  canEdit,
  currentUserId,
  initialIssues,
  breadcrumb,
  scope,
  details,
}: {
  workspaceSlug: string;
  meta: ProjectMeta;
  canEdit: boolean;
  currentUserId: string;
  initialIssues: IssueDTO[];
  breadcrumb: ReactNode;
  scope: IssueScope;
  details: string[];
}) {
  const groups = new Map<string, StateGroup>(meta.states.map((s) => [s.id, s.group]));
  return (
    <IssuesView
      workspaceSlug={workspaceSlug}
      meta={meta}
      canEdit={canEdit}
      currentUserId={currentUserId}
      initialIssues={initialIssues}
      breadcrumb={breadcrumb}
      scope={scope}
      banner={(issues) => (
        <div className="border-border text-text-muted flex h-10 shrink-0 items-center gap-3 border-b px-4 text-xs">
          {details.map((d) => (
            <Badge key={d}>{d}</Badge>
          ))}
          <span className="ml-auto">Progression</span>
          <ProgressSummary {...progress(issues, groups)} />
        </div>
      )}
    />
  );
}
