import "server-only";
import { db } from "@/lib/db";
import { accessibleProjectsWhere, requireWorkspace } from "@/lib/permissions";

export type MyIssuesTab = "assigned" | "created";

/** Tâches actives de l'utilisateur dans tous les projets visibles de l'espace. */
export async function listMyIssues(workspaceSlug: string, tab: MyIssuesTab) {
  const { user, workspace, role } = await requireWorkspace(workspaceSlug);
  const issues = await db.issue.findMany({
    where: {
      archivedAt: null,
      project: accessibleProjectsWhere(workspace.id, user.id, role),
      ...(tab === "assigned"
        ? { assignees: { some: { userId: user.id } } }
        : { createdById: user.id }),
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
    take: 500,
    select: {
      id: true,
      sequenceId: true,
      title: true,
      priority: true,
      dueDate: true,
      state: { select: { name: true, color: true, group: true } },
      project: { select: { id: true, identifier: true, name: true } },
    },
  });
  return issues.map((i) => ({
    ...i,
    key: `${i.project.identifier}-${i.sequenceId}`,
    href: `/${workspaceSlug}/projects/${i.project.id}/issues/${i.sequenceId}`,
  }));
}
