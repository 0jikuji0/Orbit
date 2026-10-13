import "server-only";
import { db } from "@/lib/db";
import { accessibleProjectsWhere, requireUser, requireWorkspace } from "@/lib/permissions";

export async function listMyWorkspaces() {
  const user = await requireUser();
  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => m.workspace);
}

/** Données du cadre de l'application : workspace courant, workspaces de l'utilisateur, projets visibles. */
export async function getWorkspaceShell(slug: string) {
  const { user, workspace, role } = await requireWorkspace(slug);
  const [workspaces, projects] = await Promise.all([
    listMyWorkspaces(),
    db.project.findMany({
      where: accessibleProjectsWhere(workspace.id, user.id, role),
      select: { id: true, identifier: true, name: true, icon: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { user, workspace, role, workspaces, projects };
}
