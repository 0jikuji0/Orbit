import { z } from "zod";
import { PROJECT_ICONS } from "@/lib/project-icons";
import { PROJECT_ROLES } from "@/lib/roles";

export const projectIdentifierSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z][A-Z0-9]{1,4}$/,
    "2 à 5 caractères : lettres majuscules et chiffres, commence par une lettre",
  );

const projectFields = {
  name: z.string().trim().min(1, "Nom requis").max(80, "80 caractères maximum"),
  identifier: projectIdentifierSchema,
  description: z
    .string()
    .trim()
    .max(500, "500 caractères maximum")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  icon: z.enum(PROJECT_ICONS),
};

export const projectFormSchema = z.object(projectFields);

export const createProjectSchema = z.object({ workspaceSlug: z.string(), ...projectFields });

export const updateProjectSchema = z.object({
  workspaceSlug: z.string(),
  projectId: z.string(),
  ...projectFields,
});

export const projectRefSchema = z.object({ workspaceSlug: z.string(), projectId: z.string() });

export const projectRoleSchema = z.enum(PROJECT_ROLES);

export type ProjectFormInput = z.input<typeof projectFormSchema>;

/** « Site web » → « SW », « Orbit » → « ORB » */
export function suggestIdentifier(name: string): string {
  if (!name.trim()) return "";
  const words = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .map((w) => w.replace(/^[0-9]+/, "")) // un identifiant commence par une lettre
    .filter(Boolean);
  const first = words[0];
  if (!first) return "PRJ";
  const candidate = words.length > 1 ? words.map((w) => w[0]).join("") : first.slice(0, 3);
  return candidate.length >= 2 ? candidate.slice(0, 5) : words.join("").slice(0, 3).padEnd(2, "X");
}
