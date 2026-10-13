import { z } from "zod";
import { projectRoleSchema } from "./project";
import { workspaceRoleSchema } from "./workspace";

export const addProjectMemberSchema = z.object({
  workspaceSlug: z.string(),
  projectId: z.string(),
  userId: z.string(),
  role: projectRoleSchema,
});

export const updateProjectMemberSchema = addProjectMemberSchema;

export const removeProjectMemberSchema = z.object({
  workspaceSlug: z.string(),
  projectId: z.string(),
  userId: z.string(),
});

export const updateWorkspaceMemberSchema = z.object({
  workspaceSlug: z.string(),
  userId: z.string(),
  role: workspaceRoleSchema,
});

export const removeWorkspaceMemberSchema = z.object({
  workspaceSlug: z.string(),
  userId: z.string(),
});

export const createInviteSchema = z.object({
  workspaceSlug: z.string(),
  role: workspaceRoleSchema,
});

export const revokeInviteSchema = z.object({
  workspaceSlug: z.string(),
  inviteId: z.string(),
});

export const acceptInviteSchema = z.object({ token: z.string().min(1) });
