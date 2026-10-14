"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { IssueDetailDTO } from "@/lib/issues/detail-types";
import type { ProjectMeta } from "@/lib/issues/types";
import { IssueDetail, issueHref } from "./detail/issue-detail";
import { IssuesProvider } from "./issues-context";

/** Page complète d'une tâche. */
export function IssuePage({
  workspaceSlug,
  meta,
  canEdit,
  currentUserId,
  detail,
}: {
  workspaceSlug: string;
  meta: ProjectMeta;
  canEdit: boolean;
  currentUserId: string;
  detail: IssueDetailDTO;
}) {
  const router = useRouter();
  const context = useMemo(
    () => ({
      workspaceSlug,
      meta,
      canEdit,
      currentUserId,
      openCreate: () => {},
      openIssue: () => {},
    }),
    [workspaceSlug, meta, canEdit, currentUserId],
  );
  return (
    <IssuesProvider value={context}>
      <IssueDetail
        issueId={detail.id}
        initialData={detail}
        variant="page"
        onOpenIssue={({ sequenceId }) => router.push(issueHref(workspaceSlug, meta.id, sequenceId))}
      />
    </IssuesProvider>
  );
}
