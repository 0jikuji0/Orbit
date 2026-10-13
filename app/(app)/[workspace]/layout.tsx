import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { mockProjects, mockWorkspaces } from "@/lib/mock-data";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const workspace = mockWorkspaces.find((w) => w.slug === slug);
  if (!workspace) notFound();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar workspace={workspace} workspaces={mockWorkspaces} projects={mockProjects} />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </TooltipProvider>
  );
}
