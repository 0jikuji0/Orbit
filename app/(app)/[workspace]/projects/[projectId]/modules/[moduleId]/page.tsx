import { Boxes } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScopedIssues } from "@/components/organization/scoped-issues";
import { MODULE_STATUS_LABELS } from "@/lib/validators/organization";
import { getIssuesPage } from "@/server/queries/issues";

export const metadata: Metadata = { title: "Module · Orbit" };

export default async function ModulePage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string; moduleId: string }>;
}) {
  const { workspace, projectId, moduleId } = await params;
  const { meta, issues, canEdit, currentUserId } = await getIssuesPage(workspace, projectId);
  const mod = meta.modules.find((m) => m.id === moduleId);
  if (!mod) notFound();

  return (
    <ScopedIssues
      workspaceSlug={workspace}
      meta={meta}
      canEdit={canEdit}
      currentUserId={currentUserId}
      initialIssues={issues}
      scope={{ moduleId }}
      details={[MODULE_STATUS_LABELS[mod.status]]}
      breadcrumb={
        <>
          <span className="text-text-muted">{meta.name}</span>
          <span className="text-text-dim">/</span>
          <Link
            href={`/${workspace}/projects/${projectId}/modules`}
            className="text-text-muted hover:text-text flex items-center gap-1.5"
          >
            <Boxes className="size-4" />
            Modules
          </Link>
          <span className="text-text-dim">/</span>
          <span>{mod.name}</span>
        </>
      }
    />
  );
}
