import type { Metadata } from "next";
import { SavedViewList } from "@/components/organization/saved-view-list";
import { listSavedViews } from "@/server/queries/organization";

export const metadata: Metadata = { title: "Vues · Orbit" };

export default async function ViewsPage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string }>;
}) {
  const { workspace, projectId } = await params;
  const { project, views } = await listSavedViews(workspace, projectId);
  return (
    <SavedViewList
      workspaceSlug={workspace}
      projectId={project.id}
      projectName={project.name}
      views={views}
    />
  );
}
