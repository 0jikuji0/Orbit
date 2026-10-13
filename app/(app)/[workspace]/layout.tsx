import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getWorkspaceShell } from "@/server/queries/workspaces";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const { user, workspace, workspaces, projects } = await getWorkspaceShell(slug);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar
          workspace={workspace}
          workspaces={workspaces}
          projects={projects}
          user={{ name: user.name, email: user.email, image: user.image }}
        />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </TooltipProvider>
  );
}
