import { Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SettingsSection } from "@/components/layout/settings-section";
import { Topbar } from "@/components/layout/topbar";
import { ArchiveProjectButton } from "@/components/projects/archive-project-button";
import { ProjectMembers } from "@/components/projects/project-members";
import { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { StatesSettings } from "@/components/projects/states-settings";
import { getProjectSettings } from "@/server/queries/projects";

export const metadata: Metadata = { title: "Réglages du projet · Orbit" };

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string }>;
}) {
  const { workspace, projectId } = await params;
  const { user, project, canEdit, members, candidates, states } = await getProjectSettings(
    workspace,
    projectId,
  );

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <Link
              href={`/${workspace}/projects/${project.id}/issues`}
              className="text-text-muted hover:text-text"
            >
              {project.name}
            </Link>
            <span className="text-text-dim">/</span>
            <Settings className="text-text-muted size-4" />
            <span>Réglages</span>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6">
          <SettingsSection
            title="Général"
            description={!canEdit && "Seuls les administrateurs du projet peuvent le modifier."}
          >
            <ProjectSettingsForm workspaceSlug={workspace} project={project} canEdit={canEdit} />
          </SettingsSection>
          <SettingsSection
            title="États"
            description="Les colonnes du kanban. Le groupe sert aux statistiques et à la progression des cycles."
          >
            <StatesSettings
              workspaceSlug={workspace}
              projectId={project.id}
              states={states}
              canEdit={canEdit}
            />
          </SettingsSection>
          <SettingsSection
            title="Membres"
            description="Les propriétaires et admins de l'espace ont accès à tous les projets."
          >
            <ProjectMembers
              workspaceSlug={workspace}
              projectId={project.id}
              currentUserId={user.id}
              canEdit={canEdit}
              members={members}
              candidates={candidates}
            />
          </SettingsSection>
          {canEdit && (
            <SettingsSection
              title="Zone sensible"
              description="L'archivage masque le projet pour tous ses membres."
            >
              <ArchiveProjectButton
                workspaceSlug={workspace}
                projectId={project.id}
                projectName={project.name}
              />
            </SettingsSection>
          )}
        </div>
      </div>
    </>
  );
}
