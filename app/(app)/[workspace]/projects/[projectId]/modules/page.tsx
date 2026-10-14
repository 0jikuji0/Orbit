import type { Metadata } from "next";
import { ModuleList } from "@/components/organization/module-list";
import { listModules } from "@/server/queries/organization";

export const metadata: Metadata = { title: "Modules · Orbit" };

export default async function ModulesPage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string }>;
}) {
  const { workspace, projectId } = await params;
  const { project, modules, members, canEdit, canDelete } = await listModules(workspace, projectId);
  return (
    <ModuleList
      workspaceSlug={workspace}
      projectId={project.id}
      projectName={project.name}
      modules={modules}
      members={members}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
