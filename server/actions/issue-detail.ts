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
import { storage } from "@/lib/storage";
import { z } from "zod";
import { loadIssueDetail, loadTimeline } from "@/server/issues/detail";
import { notify } from "@/server/notify";
import { commentNotifications, mentionRecipients } from "@/lib/notifications";

const deleteAttachmentSchema = issueRefSchema.extend({ attachmentId: z.string() });

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
    const { user, project } = await requireIssue(workspaceSlug, projectId, issueId, "MEMBER");
    const [issue, members] = await Promise.all([
      db.issue.findUniqueOrThrow({
        where: { id: issueId },
        select: { createdById: true, assignees: { select: { userId: true } } },
      }),
      projectMemberIds(project.id),
    ]);
    await db.$transaction(async (tx) => {
      await tx.comment.create({
        data: { issueId, authorId: user.id, bodyJson: bodyJson as object },
      });
      await notify(
        tx,
        issueId,
        user.id,
        commentNotifications({
          actorId: user.id,
          body: bodyJson,
          assigneeIds: issue.assignees.map((a) => a.userId),
          creatorId: issue.createdById,
          projectMemberIds: members,
        }),
      );
    });
  });
}

async function projectMemberIds(projectId: string) {
  const members = await db.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
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
    const { user, project } = await requireIssue(workspaceSlug, projectId, issueId, "MEMBER");
    const comment = await findComment(issueId, commentId);
    if (comment.authorId !== user.id) throw new PermissionError();
    const mentioned = mentionRecipients(
      comment.bodyJson as RichNode,
      bodyJson,
      user.id,
      await projectMemberIds(project.id),
    );
    await db.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: { bodyJson: bodyJson as object, editedAt: new Date() },
      });
      await notify(
        tx,
        issueId,
        user.id,
        mentioned.map((userId) => ({ userId, type: "MENTIONED" as const })),
      );
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

// ─── Pièces jointes (l'envoi passe par POST /api/uploads) ────────────────

export async function deleteAttachment(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, issueId, attachmentId } = deleteAttachmentSchema.parse(input);
    const { user } = await requireIssue(workspaceSlug, projectId, issueId, "MEMBER");
    const attachment = await db.attachment.findFirst({ where: { id: attachmentId, issueId } });
    if (!attachment) throw new UserError("Pièce jointe introuvable");
    await db.$transaction([
      db.attachment.delete({ where: { id: attachment.id } }),
      db.activity.create({
        data: { issueId, actorId: user.id, field: "attachment", oldValue: attachment.filename },
      }),
    ]);
    await storage.delete(attachment.path);
  });
}
