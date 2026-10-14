import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { accessibleProjectsWhere, requireWorkspace } from "@/lib/permissions";

/** Notifications de l'utilisateur, limitées aux tâches qu'il peut encore voir dans cet espace. */
export async function inboxWhere(workspaceSlug: string): Promise<Prisma.NotificationWhereInput> {
  const { user, workspace, role } = await requireWorkspace(workspaceSlug);
  return {
    userId: user.id,
    issue: { archivedAt: null, project: accessibleProjectsWhere(workspace.id, user.id, role) },
  };
}

export async function countUnread(workspaceSlug: string) {
  return db.notification.count({ where: { ...(await inboxWhere(workspaceSlug)), readAt: null } });
}

export async function listInbox(workspaceSlug: string, unreadOnly: boolean) {
  const where = await inboxWhere(workspaceSlug);
  const notifications = await db.notification.findMany({
    where: { ...where, ...(unreadOnly && { readAt: null }) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: { select: { name: true, avatarUrl: true } },
      issue: {
        select: {
          sequenceId: true,
          title: true,
          project: { select: { id: true, identifier: true } },
        },
      },
    },
  });
  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    createdAt: n.createdAt,
    read: n.readAt !== null,
    actor: n.actor,
    issue: {
      key: `${n.issue.project.identifier}-${n.issue.sequenceId}`,
      title: n.issue.title,
      href: `/${workspaceSlug}/projects/${n.issue.project.id}/issues/${n.issue.sequenceId}`,
    },
  }));
}
