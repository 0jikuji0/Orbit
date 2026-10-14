import { CircleDot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IssuePage } from "@/components/issues/issue-page";
import { Topbar } from "@/components/layout/topbar";
import { getIssuePage } from "@/server/queries/issues";

type Params = Promise<{ workspace: string; projectId: string; sequenceId: string }>;

export const metadata: Metadata = { title: "Tâche · Orbit" };

export default async function IssueFullPage({ params }: { params: Params }) {
  const { workspace, projectId, sequenceId } = await params;
  const seq = Number(sequenceId);
  if (!Number.isInteger(seq) || seq < 1) notFound();
  const { meta, detail, canEdit, currentUserId } = await getIssuePage(workspace, projectId, seq);
  if (!detail) notFound();

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <Link href={`/${workspace}/projects`} className="text-text-muted hover:text-text">
              {meta.name}
            </Link>
            <span className="text-text-dim">/</span>
            <Link
              href={`/${workspace}/projects/${projectId}/issues`}
              className="text-text-muted hover:text-text flex items-center gap-1.5"
            >
              <CircleDot className="size-4" />
              Tâches
            </Link>
            <span className="text-text-dim">/</span>
            <span className="font-mono text-xs">
              {meta.identifier}-{detail.sequenceId}
            </span>
          </>
        }
      />
      <IssuePage
        workspaceSlug={workspace}
        meta={meta}
        canEdit={canEdit}
        currentUserId={currentUserId}
        detail={detail}
      />
    </>
  );
}
