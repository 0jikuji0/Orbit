import { CircleDot } from "lucide-react";
import Link from "next/link";
import { IssueList } from "@/components/issues/issue-list";
import { Topbar } from "@/components/layout/topbar";
import { getProjectIssues } from "@/server/queries/issues";

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ workspace: string; projectId: string }>;
}) {
  const { workspace, projectId } = await params;
  const { project, states, issues } = await getProjectIssues(workspace, projectId);

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <Link href={`/${workspace}/projects`} className="text-text-muted hover:text-text">
              {project.name}
            </Link>
            <span className="text-text-dim">/</span>
            <CircleDot className="text-text-muted size-4" />
            <span>Tâches</span>
          </>
        }
      />
      <IssueList identifier={project.identifier} states={states} issues={issues} />
    </>
  );
}
