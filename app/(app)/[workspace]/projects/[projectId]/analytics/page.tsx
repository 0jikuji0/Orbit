import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { getProjectAnalytics } from "@/server/queries/organization";

export const metadata: Metadata = { title: "Statistiques · Orbit" };

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string }>;
}) {
  const { workspace, projectId } = await params;
  const { project, analytics } = await getProjectAnalytics(workspace, projectId);
  return <AnalyticsView projectName={project.name} analytics={analytics} />;
}
