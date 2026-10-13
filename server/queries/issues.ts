import "server-only";
import { requireProject } from "@/lib/permissions";
import { hasProjectRole } from "@/lib/roles";
import { loadIssueDTOs, loadProjectMeta } from "@/server/issues/dto";

export async function getIssuesPage(workspaceSlug: string, projectId: string) {
  const { project, role } = await requireProject(workspaceSlug, projectId);
  const [meta, issues] = await Promise.all([loadProjectMeta(project), loadIssueDTOs(project.id)]);
  return { meta, issues, canEdit: hasProjectRole(role, "MEMBER") };
}
