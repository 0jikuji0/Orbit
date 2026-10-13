import { CircleDot } from "lucide-react";
import { notFound } from "next/navigation";
import { IssueList } from "@/components/issues/issue-list";
import { Topbar } from "@/components/layout/topbar";
import { mockIssues, mockProjects, mockStates, mockUsers } from "@/lib/mock-data";

export default async function IssuesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = mockProjects.find((p) => p.id === projectId);
  if (!project) notFound();

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <span className="text-text-muted">{project.name}</span>
            <span className="text-text-dim">/</span>
            <CircleDot className="text-text-muted size-4" />
            <span>Tâches</span>
          </>
        }
      />
      <IssueList
        identifier={project.identifier}
        states={mockStates}
        issues={mockIssues}
        users={mockUsers}
      />
    </>
  );
}
