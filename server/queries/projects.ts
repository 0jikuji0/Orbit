import "server-only";
import { db } from "@/lib/db";
import { accessibleProjectsWhere, requireProject, requireWorkspace } from "@/lib/permissions";
import { canCreateProject } from "@/lib/roles";

export async function listProjects(workspaceSlug: string) {
  const { user, workspace, role } = await requireWorkspace(workspaceSlug);
  const projects = await db.project.findMany({
    where: accessibleProjectsWhere(workspace.id, user.id, role),
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { members: true, issues: { where: { archivedAt: null } } } },
    },
  });
  return { workspace, projects, canCreate: canCreateProject(role) };
}

export async function getProjectSettings(workspaceSlug: string, projectId: string) {
  const { user, project, role, workspaceRole } = await requireProject(workspaceSlug, projectId);
  return { user, project, role, workspaceRole, canEdit: role === "ADMIN" };
}
