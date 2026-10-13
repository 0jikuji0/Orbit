import { FolderKanban } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectIcon } from "@/components/projects/project-icon";
import { listProjects } from "@/server/queries/projects";

export const metadata: Metadata = { title: "Projets · Orbit" };

export default async function ProjectsPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: slug } = await params;
  const { projects, canCreate } = await listProjects(slug);

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <FolderKanban className="text-text-muted size-4" />
            <span>Projets</span>
          </>
        }
        actions={canCreate && <CreateProjectDialog workspaceSlug={slug} />}
      />
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <FolderKanban className="text-text-dim size-8" />
            <p className="text-text-muted text-sm">Aucun projet pour l&apos;instant.</p>
            {canCreate && (
              <p className="text-text-dim text-xs">
                Créez-en un avec le bouton « Nouveau projet ».
              </p>
            )}
          </div>
        ) : (
          projects.map((p) => (
            <Link
              key={p.id}
              href={`/${slug}/projects/${p.id}/issues`}
              className="border-border hover:bg-surface-2 flex h-12 items-center gap-3 border-b px-4"
            >
              <ProjectIcon icon={p.icon} />
              <span className="font-medium">{p.name}</span>
              <span className="text-text-dim font-mono text-xs">{p.identifier}</span>
              <span className="text-text-muted min-w-0 flex-1 truncate">{p.description}</span>
              <span className="text-text-dim text-xs">
                {p._count.issues} tâche{p._count.issues > 1 ? "s" : ""} · {p._count.members} membre
                {p._count.members > 1 ? "s" : ""}
              </span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
