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
  const { user, project, workspace, role, workspaceRole } = await requireProject(
    workspaceSlug,
    projectId,
  );
  const [members, workspaceMembers] = await Promise.all([
    db.projectMember.findMany({
      where: { projectId: project.id },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    db.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);
  const memberIds = new Set(members.map((m) => m.userId));
  const candidates = workspaceMembers
    .filter((m) => !memberIds.has(m.userId))
    .map((m) => ({ ...m.user, workspaceRole: m.role }));

  return {
    user,
    project,
    role,
    workspaceRole,
    canEdit: role === "ADMIN",
    members: members.map((m) => ({ ...m.user, role: m.role })),
    candidates,
  };
}
