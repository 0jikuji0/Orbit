import type { WorkspaceRole } from "@prisma/client";
import { hasWorkspaceRole } from "./roles";

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
