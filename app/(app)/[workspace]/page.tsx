import { redirect } from "next/navigation";
import { getWorkspaceShell } from "@/server/queries/workspaces";

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const { projects } = await getWorkspaceShell(slug);
  const first = projects[0];
  redirect(first ? `/${slug}/projects/${first.id}/issues` : `/${slug}/projects`);
}
