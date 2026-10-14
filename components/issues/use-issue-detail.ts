"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IssueDetailDTO } from "@/lib/issues/detail-types";
import type { RichNode } from "@/lib/rich-text";
import {
  createComment,
  deleteAttachment,
  deleteComment,
  fetchIssueDetail,
  fetchTimeline,
  updateComment,
} from "@/server/actions/issue-detail";
import { useIssuesContext } from "./issues-context";
import { issueDetailKey, timelineKey, unwrap } from "./use-issues";

export function useIssueDetail(issueId: string, initialData?: IssueDetailDTO) {
  const { workspaceSlug, meta } = useIssuesContext();
  return useQuery({
    queryKey: issueDetailKey(issueId),
    queryFn: () => unwrap(fetchIssueDetail({ workspaceSlug, projectId: meta.id, issueId })),
    initialData,
  });
}

export function useTimeline(issueId: string) {
  const { workspaceSlug, meta } = useIssuesContext();
  return useQuery({
    queryKey: timelineKey(issueId),
    queryFn: () => unwrap(fetchTimeline({ workspaceSlug, projectId: meta.id, issueId })),
  });
}

/** Mutation liée à une tâche ; rafraîchit son détail et son historique ensuite. */
function useIssueMutation<TVars>(
  issueId: string,
  fn: (ref: IssueRef, vars: TVars) => Promise<unknown>,
) {
  const { workspaceSlug, meta } = useIssuesContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: TVars) => fn({ workspaceSlug, projectId: meta.id, issueId }, vars),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: timelineKey(issueId) }),
        queryClient.invalidateQueries({ queryKey: issueDetailKey(issueId) }),
      ]),
  });
}

type IssueRef = { workspaceSlug: string; projectId: string; issueId: string };

export function useCreateComment(issueId: string) {
  return useIssueMutation(issueId, (ref, bodyJson: RichNode) =>
    unwrap(createComment({ ...ref, bodyJson })),
  );
}

export function useUpdateComment(issueId: string) {
  return useIssueMutation(issueId, (ref, vars: { commentId: string; bodyJson: RichNode }) =>
    unwrap(updateComment({ ...ref, ...vars })),
  );
}

export function useDeleteComment(issueId: string) {
  return useIssueMutation(issueId, (ref, commentId: string) =>
    unwrap(deleteComment({ ...ref, commentId })),
  );
}

export function useDeleteAttachment(issueId: string) {
  return useIssueMutation(issueId, (ref, attachmentId: string) =>
    unwrap(deleteAttachment({ ...ref, attachmentId })),
  );
}

export function useUploadAttachments(issueId: string) {
  return useIssueMutation(issueId, async (ref, files: File[]) => {
    for (const file of files) {
      const body = new FormData();
      body.set("file", file);
      body.set("workspaceSlug", ref.workspaceSlug);
      body.set("projectId", ref.projectId);
      body.set("issueId", ref.issueId);
      const response = await fetch("/api/uploads", { method: "POST", body });
      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(`${file.name} : ${error ?? "envoi impossible"}`);
      }
    }
  });
}
