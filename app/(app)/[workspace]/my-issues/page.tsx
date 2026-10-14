import type { Metadata } from "next";
import { MyIssuesList } from "@/components/my-issues/my-issues-list";
import { listMyIssues } from "@/server/queries/my-issues";

export const metadata: Metadata = { title: "Mes tâches · Orbit" };

export default async function MyIssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { workspace } = await params;
  const tab = (await searchParams).tab === "created" ? "created" : "assigned";
  const items = await listMyIssues(workspace, tab);
  return <MyIssuesList workspaceSlug={workspace} tab={tab} items={items} />;
}
