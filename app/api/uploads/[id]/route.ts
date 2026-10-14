import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireProject } from "@/lib/permissions";
import { storage } from "@/lib/storage";
import { isInlineMime } from "@/lib/uploads";

/** Téléchargement d'une pièce jointe, réservé aux personnes ayant accès au projet. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return new NextResponse("Non connecté", { status: 401 });
  const { id } = await params;

  const attachment = await db.attachment.findUnique({
    where: { id },
    include: {
      issue: {
        select: {
          archivedAt: true,
          project: { select: { id: true, workspace: { select: { slug: true } } } },
        },
      },
    },
  });
  if (!attachment || attachment.issue.archivedAt) return new NextResponse(null, { status: 404 });
  // 404 si l'utilisateur n'a pas accès au projet.
  await requireProject(attachment.issue.project.workspace.slug, attachment.issue.project.id);

  const file = await storage.get(attachment.path);
  if (!file) return new NextResponse(null, { status: 404 });

  const inline = isInlineMime(attachment.mime);
  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": inline ? attachment.mime : "application/octet-stream",
      "Content-Length": String(file.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
