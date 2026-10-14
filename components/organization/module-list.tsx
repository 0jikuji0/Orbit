"use client";

import type { ModuleStatus } from "@prisma/client";
import { Boxes, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODULE_STATUS_LABELS } from "@/lib/validators/organization";
import { deleteModule } from "@/server/actions/organization";
import { ModuleDialog, type Module } from "./module-dialog";
import { ProgressSummary } from "./progress-bar";
import { RowMenu } from "./row-menu";

type ModuleRow = Module & {
  lead: { id: string; name: string; avatarUrl: string | null } | null;
  progress: { done: number; total: number; percent: number };
};

export function ModuleList({
  workspaceSlug,
  projectId,
  projectName,
  modules,
  members,
  canEdit,
  canDelete,
}: {
  workspaceSlug: string;
  projectId: string;
  projectName: string;
  modules: ModuleRow[];
  members: { id: string; name: string }[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ module?: Module } | null>(null);
  const base = `/${workspaceSlug}/projects/${projectId}/modules`;

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <span className="text-text-muted">{projectName}</span>
            <span className="text-text-dim">/</span>
            <Boxes className="text-text-muted size-4" />
            <span>Modules</span>
          </>
        }
        actions={
          canEdit && (
            <Button size="sm" variant="primary" onClick={() => setDialog({})}>
              <Plus />
              Nouveau module
            </Button>
          )
        }
      />
      <div className="flex-1 overflow-y-auto">
        {modules.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Boxes className="text-text-dim size-8" />
            <p className="text-text-muted text-sm">
              Aucun module. Un module regroupe les tâches d&apos;une fonctionnalité.
            </p>
          </div>
        )}
        {modules.map((m) => (
          <Link
            key={m.id}
            href={`${base}/${m.id}`}
            className="border-border hover:bg-surface-2 flex h-12 items-center gap-4 border-b px-4"
          >
            <Boxes className="text-text-dim size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium">{m.name}</span>
              {m.description && <span className="text-text-dim ml-3">{m.description}</span>}
            </span>
            <Badge>{MODULE_STATUS_LABELS[m.status as ModuleStatus]}</Badge>
            {m.lead ? (
              <Avatar name={m.lead.name} src={m.lead.avatarUrl} size="sm" />
            ) : (
              <span className="w-5" />
            )}
            <ProgressSummary {...m.progress} />
            <RowMenu
              label={m.name}
              onEdit={canEdit ? () => setDialog({ module: m }) : undefined}
              onDelete={
                canDelete
                  ? async () => {
                      const result = await deleteModule({
                        workspaceSlug,
                        projectId,
                        moduleId: m.id,
                      });
                      if (result.ok) router.refresh();
                    }
                  : undefined
              }
            />
          </Link>
        ))}
      </div>
      {dialog && (
        <ModuleDialog
          key={dialog.module?.id ?? "new"}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          members={members}
          module={dialog.module}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </>
  );
}
