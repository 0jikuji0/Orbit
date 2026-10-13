import { redirect } from "next/navigation";
import { mockProjects } from "@/lib/mock-data";

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const first = mockProjects[0];
  redirect(first ? `/${workspace}/projects/${first.id}/issues` : `/${workspace}/my-issues`);
}
