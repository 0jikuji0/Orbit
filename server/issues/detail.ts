import "server-only";
import { db } from "@/lib/db";
import type { IssueDetailDTO, TimelineEntry } from "@/lib/issues/detail-types";
import type { RichNode } from "@/lib/rich-text";
import { issueDTOInclude, toIssueDTO } from "./dto";

/** À n'appeler qu'après `requireProject`. */
export async function loadIssueDetail(
  projectId: string,
  where: { id: string } | { sequenceId: number },
): Promise<IssueDetailDTO | null> {
  const issue = await db.issue.findFirst({
    where: { ...where, projectId, archivedAt: null },
    include: {
      ...issueDTOInclude,
      createdBy: { select: { id: true, name: true } },
      parent: { select: { id: true, sequenceId: true, title: true, archivedAt: true } },
      children: {
        where: { archivedAt: null },
        include: issueDTOInclude,
        orderBy: { sequenceId: "asc" },
      },
      attachments: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!issue) return null;
  const { parent } = issue;
  return {
    ...toIssueDTO(issue),
    descriptionJson: (issue.descriptionJson as RichNode | null) ?? null,
    createdBy: issue.createdBy,
    parent:
      parent && !parent.archivedAt
        ? { id: parent.id, sequenceId: parent.sequenceId, title: parent.title }
        : null,
    children: issue.children.map(toIssueDTO),
    attachments: issue.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      mime: a.mime,
      size: a.size,
      uploadedBy: a.uploadedBy.name,
    })),
  };
}

const person = { select: { id: true, name: true, avatarUrl: true } } as const;

/** Historique et commentaires, du plus ancien au plus récent. */
export async function loadTimeline(issueId: string): Promise<TimelineEntry[]> {
  const [activities, comments] = await Promise.all([
    db.activity.findMany({ where: { issueId }, include: { actor: person } }),
    db.comment.findMany({ where: { issueId }, include: { author: person } }),
  ]);
  return [
    ...activities.map((a) => ({
      kind: "activity" as const,
      id: a.id,
      createdAt: a.createdAt,
      actor: a.actor,
      field: a.field,
      oldValue: a.oldValue,
      newValue: a.newValue,
    })),
    ...comments.map((c) => ({
      kind: "comment" as const,
      id: c.id,
      createdAt: c.createdAt,
      editedAt: c.editedAt,
      author: c.author,
      bodyJson: c.bodyJson as RichNode,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
