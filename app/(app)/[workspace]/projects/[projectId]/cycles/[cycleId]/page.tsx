import { RefreshCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScopedIssues } from "@/components/organization/scoped-issues";
import { CYCLE_STATUS_LABELS, cycleStatus } from "@/lib/issues/cycles";
import { getIssuesPage } from "@/server/queries/issues";

export const metadata: Metadata = { title: "Cycle · Orbit" };

const range = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });

export default async function CyclePage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string; cycleId: string }>;
}) {
  const { workspace, projectId, cycleId } = await params;
  const { meta, issues, canEdit, currentUserId } = await getIssuesPage(workspace, projectId);
  const cycle = meta.cycles.find((c) => c.id === cycleId);
  if (!cycle) notFound();

  return (
    <ScopedIssues
      workspaceSlug={workspace}
      meta={meta}
      canEdit={canEdit}
      currentUserId={currentUserId}
      initialIssues={issues}
      scope={{ cycleId }}
      details={[
        CYCLE_STATUS_LABELS[cycleStatus(cycle.startDate, cycle.endDate)],
        `${range.format(cycle.startDate)} → ${range.format(cycle.endDate)}`,
      ]}
      breadcrumb={
        <>
          <span className="text-text-muted">{meta.name}</span>
          <span className="text-text-dim">/</span>
          <Link
            href={`/${workspace}/projects/${projectId}/cycles`}
            className="text-text-muted hover:text-text flex items-center gap-1.5"
          >
            <RefreshCcw className="size-4" />
            Cycles
          </Link>
          <span className="text-text-dim">/</span>
          <span>{cycle.name}</span>
        </>
      }
    />
  );
}
