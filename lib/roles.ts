import type { ProjectRole, WorkspaceRole } from "@prisma/client";

/** Rôles et règles d'accès purs (sans BDD), utilisables côté client comme côté serveur. */

export const WORKSPACE_ROLES = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "GUEST",
] as const satisfies readonly WorkspaceRole[];
export const PROJECT_ROLES = [
  "ADMIN",
  "MEMBER",
  "VIEWER",
] as const satisfies readonly ProjectRole[];

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Admin",
  MEMBER: "Membre",
  GUEST: "Invité",
};

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Membre",
  VIEWER: "Lecteur",
};

const WORKSPACE_RANK: Record<WorkspaceRole, number> = { GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };
const PROJECT_RANK: Record<ProjectRole, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2 };

export function hasWorkspaceRole(role: WorkspaceRole, min: WorkspaceRole): boolean {
  return WORKSPACE_RANK[role] >= WORKSPACE_RANK[min];
}

export function hasProjectRole(role: ProjectRole, min: ProjectRole): boolean {
  return PROJECT_RANK[role] >= PROJECT_RANK[min];
}

/**
 * Rôle effectif d'un utilisateur dans un projet :
 * - propriétaires et admins du workspace sont admins de tous les projets ;
 * - un invité (GUEST) n'a jamais plus qu'un accès en lecture, et seulement s'il est membre du projet ;
 * - sinon, le rôle de membre du projet (ou aucun accès).
 */
export function effectiveProjectRole(
  workspaceRole: WorkspaceRole,
  projectRole: ProjectRole | null,
): ProjectRole | null {
  if (hasWorkspaceRole(workspaceRole, "ADMIN")) return "ADMIN";
  if (!projectRole) return null;
  if (workspaceRole === "GUEST") return "VIEWER";
  return projectRole;
}

/** Créer un projet : tout membre du workspace sauf les invités. */
export function canCreateProject(workspaceRole: WorkspaceRole): boolean {
  return hasWorkspaceRole(workspaceRole, "MEMBER");
}

/**
 * Un acteur peut-il attribuer `nextRole` (ou retirer, si `nextRole` est null) à un membre
 * qui a actuellement `targetRole` ? Seuls admins et propriétaires gèrent les membres ;
 * seul un propriétaire peut toucher à un propriétaire ou en nommer un.
 */
export function canManageWorkspaceMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
  nextRole: WorkspaceRole | null,
): boolean {
  if (!hasWorkspaceRole(actorRole, "ADMIN")) return false;
  if (targetRole === "OWNER" || nextRole === "OWNER") return actorRole === "OWNER";
  return true;
}

/** Rôles qu'un acteur peut donner via un lien d'invitation. */
export function invitableRoles(actorRole: WorkspaceRole): WorkspaceRole[] {
  if (!hasWorkspaceRole(actorRole, "ADMIN")) return [];
  return actorRole === "OWNER" ? ["ADMIN", "MEMBER", "GUEST"] : ["MEMBER", "GUEST"];
}
