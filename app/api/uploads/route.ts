import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, PermissionError, requireProject } from "@/lib/permissions";
import { storage } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, sanitizeFilename } from "@/lib/uploads";

const fieldsSchema = z.object({
  workspaceSlug: z.string(),
  projectId: z.string(),
  issueId: z.string(),
});

const error = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/** Ajoute une pièce jointe à une tâche (multipart : file, workspaceSlug, projectId, issueId). */
export async function POST(request: Request) {
  if (!(await getSession())) return error("Non connecté", 401);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024)
    return error("Fichier trop volumineux (20 Mo max.)", 413);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const fields = fieldsSchema.safeParse(Object.fromEntries(form ?? []));
  if (!(file instanceof File) || !fields.success) return error("Requête invalide", 400);
  if (file.size === 0) return error("Fichier vide", 400);
  if (file.size > MAX_UPLOAD_BYTES) return error("Fichier trop volumineux (20 Mo max.)", 413);

  const { workspaceSlug, projectId, issueId } = fields.data;
  try {
    const { user, project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    const issue = await db.issue.findFirst({
      where: { id: issueId, projectId: project.id, archivedAt: null },
      select: { id: true },
    });
    if (!issue) return error("Tâche introuvable", 404);

    const filename = sanitizeFilename(file.name);
    const key = `${project.id}/${randomUUID()}`;
    await storage.put(key, file.stream());
    try {
      const attachment = await db.attachment.create({
        data: {
          issueId,
          filename,
          mime: file.type || "application/octet-stream",
          size: file.size,
          path: key,
          uploadedById: user.id,
        },
      });
      await db.activity.create({
        data: { issueId, actorId: user.id, field: "attachment", newValue: filename },
      });
      return NextResponse.json({ id: attachment.id }, { status: 201 });
    } catch (e) {
      await storage.delete(key);
      throw e;
    }
  } catch (e) {
    if (e instanceof PermissionError) return error(e.message, 403);
    throw e;
  }
}
