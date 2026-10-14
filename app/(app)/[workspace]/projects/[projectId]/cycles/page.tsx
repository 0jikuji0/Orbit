import type { Metadata } from "next";
import { CycleList } from "@/components/organization/cycle-list";
import { listCycles } from "@/server/queries/organization";

export const metadata: Metadata = { title: "Cycles · Orbit" };

export default async function CyclesPage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string }>;
}) {
  const { workspace, projectId } = await params;
  const { project, cycles, canEdit, canDelete } = await listCycles(workspace, projectId);
  return (
    <CycleList
      workspaceSlug={workspace}
      projectId={project.id}
      projectName={project.name}
      cycles={cycles}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
