import type { Metadata } from "next";
import { SearchResults } from "@/components/search/search-results";
import { requireWorkspace } from "@/lib/permissions";
import { searchIssues } from "@/server/search";

export const metadata: Metadata = { title: "Recherche · Orbit" };

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { workspace: slug } = await params;
  const query = ((await searchParams).q ?? "").slice(0, 100);
  const { user, workspace, role } = await requireWorkspace(slug);
  const hits = await searchIssues({ workspaceId: workspace.id, userId: user.id, role }, query, 50);
  return <SearchResults workspaceSlug={slug} query={query} hits={hits} />;
}
