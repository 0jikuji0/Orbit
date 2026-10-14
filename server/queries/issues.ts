import "server-only";
import { requireProject } from "@/lib/permissions";
import { hasProjectRole } from "@/lib/roles";
import { loadIssueDetail } from "@/server/issues/detail";
import { loadIssueDTOs, loadProjectMeta } from "@/server/issues/dto";

export async function getIssuesPage(workspaceSlug: string, projectId: string) {
  const { user, project, role } = await requireProject(workspaceSlug, projectId);
  const [meta, issues] = await Promise.all([loadProjectMeta(project), loadIssueDTOs(project.id)]);
  return { meta, issues, canEdit: hasProjectRole(role, "MEMBER"), currentUserId: user.id };
}

/** Page complète d'une tâche : `/…/issues/42` pour ORB-42. */
export async function getIssuePage(workspaceSlug: string, projectId: string, sequenceId: number) {
  const { user, project, role } = await requireProject(workspaceSlug, projectId);
  const [meta, detail] = await Promise.all([
    loadProjectMeta(project),
    loadIssueDetail(project.id, { sequenceId }),
  ]);
  return { meta, detail, canEdit: hasProjectRole(role, "MEMBER"), currentUserId: user.id };
}
