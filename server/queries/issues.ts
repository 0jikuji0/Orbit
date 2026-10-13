import "server-only";
import { db } from "@/lib/db";
import { requireProject } from "@/lib/permissions";
import { hasProjectRole } from "@/lib/roles";
import { loadIssueDTOs, loadProjectMeta } from "@/server/issues/dto";

export async function getIssuesPage(workspaceSlug: string, projectId: string) {
  const { project, role } = await requireProject(workspaceSlug, projectId);
  const [meta, issues] = await Promise.all([loadProjectMeta(project), loadIssueDTOs(project.id)]);
  return { meta, issues, canEdit: hasProjectRole(role, "MEMBER") };
}
/** Lecture seule en phase 1 : création / édition des tâches en phase 2. */
export async function getProjectIssues(workspaceSlug: string, projectId: string) {
  const { project } = await requireProject(workspaceSlug, projectId);
  const [states, issues] = await Promise.all([
    db.state.findMany({ where: { projectId: project.id }, orderBy: { position: "asc" } }),
    db.issue.findMany({
      where: { projectId: project.id, archivedAt: null },
      orderBy: { sortOrder: "asc" },
      include: {
        assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        labels: { include: { label: { select: { id: true, name: true, color: true } } } },
      },
    }),
  ]);
  return { project, states, issues };
}

export type ProjectIssues = Awaited<ReturnType<typeof getProjectIssues>>;
