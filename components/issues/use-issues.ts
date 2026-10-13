"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ActionResult } from "@/lib/action";
import type { IssueDTO } from "@/lib/issues/types";
import type { IssuePatch } from "@/lib/issues/view";
import { archiveIssue, createIssue, fetchIssues, updateIssue } from "@/server/actions/issues";
import { useIssuesContext } from "./issues-context";

export const issuesKey = (projectId: string) => ["issues", projectId] as const;

async function unwrap<T>(promise: Promise<ActionResult<T>>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export function useIssues(initialData: IssueDTO[]) {
  const { workspaceSlug, meta } = useIssuesContext();
  return useQuery({
    queryKey: issuesKey(meta.id),
    queryFn: () => unwrap(fetchIssues({ workspaceSlug, projectId: meta.id })),
    initialData,
  });
}

/** Mutation optimiste : le cache est modifié tout de suite, puis restauré en cas d'erreur. */
function useOptimisticMutation<TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  apply: (issues: IssueDTO[], vars: TVars) => IssueDTO[],
  onSuccessApply?: (issues: IssueDTO[], data: TData, vars: TVars) => IssueDTO[],
) {
  const { meta } = useIssuesContext();
  const queryClient = useQueryClient();
  const key = issuesKey(meta.id);

  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IssueDTO[]>(key);
      queryClient.setQueryData<IssueDTO[]>(key, (old = []) => apply(old, vars));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (data, vars) => {
      if (onSuccessApply) {
        queryClient.setQueryData<IssueDTO[]>(key, (old = []) => onSuccessApply(old, data, vars));
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateIssue() {
  const { workspaceSlug, meta } = useIssuesContext();
  return useOptimisticMutation(
    ({ issueId, patch }: { issueId: string; patch: IssuePatch }) =>
      unwrap(updateIssue({ workspaceSlug, projectId: meta.id, issueId, patch })),
    (issues, { issueId, patch }) =>
      issues.map((i) => (i.id === issueId ? { ...i, ...patch, updatedAt: new Date() } : i)),
    (issues, updated) => issues.map((i) => (i.id === updated.id ? updated : i)),
  );
}

export type NewIssue = Pick<
  IssueDTO,
  "title" | "stateId" | "priority" | "assigneeIds" | "labelIds" | "startDate" | "dueDate"
>;

export function useCreateIssue() {
  const { workspaceSlug, meta } = useIssuesContext();
  return useOptimisticMutation(
    (vars: NewIssue & { tempId: string }) => {
      const { tempId: _tempId, ...data } = vars;
      return unwrap(createIssue({ workspaceSlug, projectId: meta.id, ...data }));
    },
    (issues, vars) => {
      const now = new Date();
      const lastInState = issues
        .filter((i) => i.stateId === vars.stateId)
        .reduce((max, i) => Math.max(max, i.sortOrder), 0);
      const { tempId, ...data } = vars;
      return [
        ...issues,
        {
          ...data,
          id: tempId,
          sequenceId: 0,
          sortOrder: lastInState + 1000,
          createdAt: now,
          updatedAt: now,
        },
      ];
    },
    (issues, created, vars) => issues.map((i) => (i.id === vars.tempId ? created : i)),
  );
}

export function useArchiveIssue() {
  const { workspaceSlug, meta } = useIssuesContext();
  return useOptimisticMutation(
    (issueId: string) => unwrap(archiveIssue({ workspaceSlug, projectId: meta.id, issueId })),
    (issues, issueId) => issues.filter((i) => i.id !== issueId),
  );
}
