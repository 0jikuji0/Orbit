"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { savedFiltersSchema, toSavedView } from "@/lib/issues/saved-view";
import { EMPTY_FILTERS, LAYOUTS } from "@/lib/issues/view";
import { PermissionError, requireProject } from "@/lib/permissions";

const projectRef = { workspaceSlug: z.string(), projectId: z.string() };

const createSavedViewSchema = z.object({
  ...projectRef,
  name: z.string().trim().min(1, "Nom requis").max(60, "60 caractères maximum"),
  layout: z.enum(LAYOUTS),
  // Validation stricte à l'enregistrement (la lecture, elle, reste tolérante).
  view: savedFiltersSchema,
});

const deleteSavedViewSchema = z.object({ ...projectRef, viewId: z.string() });

export async function createSavedView(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, name, layout, view } = createSavedViewSchema.parse(input);
    const { user, project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    const saved = toSavedView({
      layout,
      groupBy: view.groupBy,
      filters: { ...EMPTY_FILTERS, ...view.filters },
    });
    const created = await db.savedView.create({
      data: { projectId: project.id, name, createdById: user.id, ...saved },
    });
    revalidatePath(`/${workspaceSlug}/projects/${projectId}/views`);
    return { id: created.id };
  });
}

/** Le créateur de la vue ou un admin du projet peut la supprimer. */
export async function deleteSavedView(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, viewId } = deleteSavedViewSchema.parse(input);
    const { user, project, role } = await requireProject(workspaceSlug, projectId, "MEMBER");
    const view = await db.savedView.findFirst({ where: { id: viewId, projectId: project.id } });
    if (!view) throw new UserError("Vue introuvable");
    if (view.createdById !== user.id && role !== "ADMIN") throw new PermissionError();
    await db.savedView.delete({ where: { id: view.id } });
    revalidatePath(`/${workspaceSlug}/projects/${projectId}/views`);
  });
}
