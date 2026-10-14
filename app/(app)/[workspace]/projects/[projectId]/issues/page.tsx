import { CircleDot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IssuesView } from "@/components/issues/issues-view";
import { getIssuesPage } from "@/server/queries/issues";

export const metadata: Metadata = { title: "Tâches · Orbit" };

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string }>;
}) {
  const { workspace, projectId } = await params;
  const { meta, issues, canEdit, currentUserId } = await getIssuesPage(workspace, projectId);

  return (
    <IssuesView
      workspaceSlug={workspace}
      meta={meta}
      canEdit={canEdit}
      currentUserId={currentUserId}
      initialIssues={issues}
      breadcrumb={
        <>
          <Link href={`/${workspace}/projects`} className="text-text-muted hover:text-text">
            {meta.name}
          </Link>
          <span className="text-text-dim">/</span>
          <CircleDot className="text-text-muted size-4" />
          <span>Tâches</span>
        </>
      }
    />
  );
}
