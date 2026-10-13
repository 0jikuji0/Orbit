import { z } from "zod";
import { WORKSPACE_ROLES } from "@/lib/roles";

/** Segments d'URL de premier niveau utilisés par l'application. */
export const RESERVED_SLUGS = new Set([
  "_next",
  "admin",
  "api",
  "app",
  "auth",
  "health",
  "invite",
  "login",
  "logout",
  "new",
  "onboarding",
  "register",
  "settings",
  "static",
]);

export const workspaceSlugSchema = z
  .string()
  .trim()
  .min(2, "2 caractères minimum")
  .max(48, "48 caractères maximum")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lettres minuscules, chiffres et tirets uniquement")
  .refine((slug) => !RESERVED_SLUGS.has(slug), "Cette adresse est réservée");

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Nom requis")
  .max(64, "64 caractères maximum");

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  slug: workspaceSlugSchema,
});

export const updateWorkspaceSchema = z.object({
  slug: z.string(),
  name: workspaceNameSchema,
});

export const workspaceRoleSchema = z.enum(WORKSPACE_ROLES);

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
