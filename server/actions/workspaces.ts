"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { requireUser, requireWorkspace } from "@/lib/permissions";
import { createWorkspaceSchema, updateWorkspaceSchema } from "@/lib/validators/workspace";

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createWorkspace(input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    const data = createWorkspaceSchema.parse(input);
    try {
      const workspace = await db.workspace.create({
        data: { ...data, members: { create: { userId: user.id, role: "OWNER" } } },
      });
      return { slug: workspace.slug };
    } catch (error) {
      if (isUniqueViolation(error)) throw new UserError("Cette adresse est déjà utilisée");
      throw error;
    }
  });
}

export async function updateWorkspace(input: unknown) {
  return runAction(async () => {
    const { slug, name } = updateWorkspaceSchema.parse(input);
    const { workspace } = await requireWorkspace(slug, "ADMIN");
    await db.workspace.update({ where: { id: workspace.id }, data: { name } });
    revalidatePath(`/${slug}`, "layout");
  });
}
