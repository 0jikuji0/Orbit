"use server";

import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import type { RichNode } from "@/lib/rich-text";
import { PermissionError, requireProject } from "@/lib/permissions";
import { hasProjectRole } from "@/lib/roles";
import { issueRefSchema } from "@/lib/validators/issue";
import {
  createCommentSchema,
  deleteCommentSchema,
  updateCommentSchema,
} from "@/lib/validators/comment";
import { loadIssueDetail, loadTimeline } from "@/server/issues/detail";

async function requireIssue(
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  min: "VIEWER" | "MEMBER" = "VIEWER",
) {
  const access = await requireProject(workspaceSlug, projectId, min);
  const issue = await db.issue.findFirst({
    where: { id: issueId, projectId: access.project.id, archivedAt: null },
    select: { id: true },
  });
  if (!issue) throw new UserError("Tâche introuvable");
  return access;
}

export async function fetchIssueDetail(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, issueId } = issueRefSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId);
    const detail = await loadIssueDetail(project.id, { id: issueId });
    if (!detail) throw new UserError("Tâche introuvable");
    return detail;
  });
}

export async function fetchTimeline(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, issueId } = issueRefSchema.parse(input);
    await requireIssue(workspaceSlug, projectId, issueId);
    return loadTimeline(issueId);
  });
}

// ─── Commentaires ────────────────────────────────────────────────────────

export async function createComment(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, issueId, bodyJson } = createCommentSchema.parse(input);
    const { user } = await requireIssue(workspaceSlug, projectId, issueId, "MEMBER");
    await db.comment.create({
      data: { issueId, authorId: user.id, bodyJson: bodyJson as object },
    });
  });
}

async function findComment(issueId: string, commentId: string) {
  const comment = await db.comment.findFirst({ where: { id: commentId, issueId } });
  if (!comment) throw new UserError("Commentaire introuvable");
  return comment;
}

/** Seul l'auteur modifie son commentaire. */
export async function updateComment(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, issueId, commentId, bodyJson } =
      updateCommentSchema.parse(input);
    const { user } = await requireIssue(workspaceSlug, projectId, issueId, "MEMBER");
    const comment = await findComment(issueId, commentId);
    if (comment.authorId !== user.id) throw new PermissionError();
    await db.comment.update({
      where: { id: commentId },
      data: { bodyJson: bodyJson as RichNode as object, editedAt: new Date() },
    });
  });
}

/** L'auteur ou un admin du projet peut supprimer un commentaire. */
export async function deleteComment(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, issueId, commentId } = deleteCommentSchema.parse(input);
    const { user, role } = await requireIssue(workspaceSlug, projectId, issueId, "MEMBER");
    const comment = await findComment(issueId, commentId);
    if (comment.authorId !== user.id && !hasProjectRole(role, "ADMIN")) {
      throw new PermissionError();
    }
    await db.comment.delete({ where: { id: commentId } });
  });
}
