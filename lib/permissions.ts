import "server-only";
import type { ProjectRole, WorkspaceRole } from "@prisma/client";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { db } from "./db";
import { effectiveProjectRole, hasProjectRole, hasWorkspaceRole } from "./roles";

/**
 * Point d'entrée unique des contrôles d'accès : toute lecture ou écriture en BDD
 * liée à un workspace ou un projet commence par l'un de ces `require*`.
 *
 * - Ressource inexistante OU non accessible → 404 (on ne révèle pas son existence).
 * - Ressource visible mais rôle insuffisant → `PermissionError`.
 */

export class PermissionError extends Error {
  constructor(message = "Action non autorisée") {
    super(message);
    this.name = "PermissionError";
  }
}

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
});

const loadWorkspaceMembership = cache(async (slug: string, userId: string) =>
  db.workspaceMember.findFirst({
    where: { userId, workspace: { slug } },
    include: { workspace: true },
  }),
);

export async function requireWorkspace(slug: string, min: WorkspaceRole = "GUEST") {
  const user = await requireUser();
  const membership = await loadWorkspaceMembership(slug, user.id);
  if (!membership) notFound();
  if (!hasWorkspaceRole(membership.role, min)) throw new PermissionError();
  return { user, workspace: membership.workspace, role: membership.role };
}

const loadProjectAccess = cache(async (projectId: string, userId: string) =>
  db.project.findFirst({
    where: { id: projectId, archivedAt: null },
    include: {
      workspace: { include: { members: { where: { userId } } } },
      members: { where: { userId } },
    },
  }),
);

export async function requireProject(projectId: string, min: ProjectRole = "VIEWER") {
  const user = await requireUser();
  const found = await loadProjectAccess(projectId, user.id);
  const workspaceRole = found?.workspace.members[0]?.role;
  if (!found || !workspaceRole) notFound();

  const role = effectiveProjectRole(workspaceRole, found.members[0]?.role ?? null);
  if (!role) notFound();
  if (!hasProjectRole(role, min)) throw new PermissionError();

  const { workspace, members: _members, ...project } = found;
  const { members: _wsMembers, ...ws } = workspace;
  return { user, project, workspace: ws, role, workspaceRole };
}

/** Filtre Prisma des projets visibles par un utilisateur dans un workspace. */
export function accessibleProjectsWhere(
  workspaceId: string,
  userId: string,
  workspaceRole: WorkspaceRole,
) {
  return {
    workspaceId,
    archivedAt: null,
    ...(hasWorkspaceRole(workspaceRole, "ADMIN") ? {} : { members: { some: { userId } } }),
  };
}
