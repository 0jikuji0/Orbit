import type { NotificationType } from "@prisma/client";
import { mentionedUserIds, type RichNode } from "./rich-text";

export type NotificationDraft = { userId: string; type: NotificationType };

const unique = (ids: string[]) => [...new Set(ids)];

/** Nouvelles personnes assignées, sauf l'auteur du changement. */
export function assignmentRecipients(before: string[], after: string[], actorId: string): string[] {
  return unique(after.filter((id) => !before.includes(id) && id !== actorId));
}

/**
 * Personnes mentionnées dans `after` mais pas déjà dans `before` (on ne renotifie pas à chaque
 * enregistrement de la description), limitées aux membres du projet et sans l'auteur.
 */
export function mentionRecipients(
  before: RichNode | null | undefined,
  after: RichNode | null | undefined,
  actorId: string,
  projectMemberIds: string[],
): string[] {
  const already = new Set(mentionedUserIds(before));
  return mentionedUserIds(after).filter(
    (id) => !already.has(id) && id !== actorId && projectMemberIds.includes(id),
  );
}

/** Nouveau commentaire : mentionnés (type MENTIONED), puis assignés et créateur (type COMMENTED). */
export function commentNotifications(input: {
  actorId: string;
  body: RichNode;
  assigneeIds: string[];
  creatorId: string;
  projectMemberIds: string[];
}): NotificationDraft[] {
  const mentioned = mentionRecipients(null, input.body, input.actorId, input.projectMemberIds);
  const watchers = unique([...input.assigneeIds, input.creatorId]).filter(
    (id) => id !== input.actorId && !mentioned.includes(id) && input.projectMemberIds.includes(id),
  );
  return [
    ...mentioned.map((userId) => ({ userId, type: "MENTIONED" as const })),
    ...watchers.map((userId) => ({ userId, type: "COMMENTED" as const })),
  ];
}

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  ASSIGNED: "vous a assigné",
  MENTIONED: "vous a mentionné dans",
  COMMENTED: "a commenté",
};
