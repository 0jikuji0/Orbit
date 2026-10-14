"use client";

import { Plus, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CYCLE_STATUS_LABELS, cycleStatus, daysLeft, type CycleStatus } from "@/lib/issues/cycles";
import { cn } from "@/lib/utils";
import { deleteCycle } from "@/server/actions/organization";
import { CycleDialog, type Cycle } from "./cycle-dialog";
import { ProgressSummary } from "./progress-bar";
import { RowMenu } from "./row-menu";

type CycleRow = Cycle & { progress: { done: number; total: number; percent: number } };

const range = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const STATUS_ORDER: CycleStatus[] = ["current", "upcoming", "completed"];

export function CycleList({
  workspaceSlug,
  projectId,
  projectName,
  cycles,
  canEdit,
  canDelete,
}: {
  workspaceSlug: string;
  projectId: string;
  projectName: string;
  cycles: CycleRow[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ cycle?: Cycle } | null>(null);
  const base = `/${workspaceSlug}/projects/${projectId}/cycles`;

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <span className="text-text-muted">{projectName}</span>
            <span className="text-text-dim">/</span>
            <RefreshCcw className="text-text-muted size-4" />
            <span>Cycles</span>
          </>
        }
        actions={
          canEdit && (
            <Button size="sm" variant="primary" onClick={() => setDialog({})}>
              <Plus />
              Nouveau cycle
            </Button>
          )
        }
      />
      <div className="flex-1 overflow-y-auto">
        {cycles.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <RefreshCcw className="text-text-dim size-8" />
            <p className="text-text-muted text-sm">
              Aucun cycle. Un cycle regroupe les tâches d&apos;un sprint.
            </p>
          </div>
        )}
        {STATUS_ORDER.map((status) => {
          const rows = cycles.filter((c) => cycleStatus(c.startDate, c.endDate) === status);
          if (!rows.length) return null;
          return (
            <section key={status} aria-label={CYCLE_STATUS_LABELS[status]}>
              <h2 className="border-border bg-surface text-text-muted sticky top-0 flex h-9 items-center border-b px-4 text-xs font-medium">
                {CYCLE_STATUS_LABELS[status]}
              </h2>
              {rows.map((c) => {
                const left = daysLeft(c.endDate);
                return (
                  <Link
                    key={c.id}
                    href={`${base}/${c.id}`}
                    className="border-border hover:bg-surface-2 flex h-12 items-center gap-4 border-b px-4"
                  >
                    <RefreshCcw className="text-text-dim size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                    <span className="text-text-dim font-mono text-xs">
                      {range.format(c.startDate)} → {range.format(c.endDate)}
                    </span>
                    {status === "current" && (
                      <Badge className={cn(left <= 2 && "border-warning text-warning")}>
                        {left === 0 ? "Dernier jour" : `${left} j restants`}
                      </Badge>
                    )}
                    <ProgressSummary {...c.progress} />
                    <RowMenu
                      label={c.name}
                      onEdit={canEdit ? () => setDialog({ cycle: c }) : undefined}
                      onDelete={
                        canDelete
                          ? async () => {
                              const result = await deleteCycle({
                                workspaceSlug,
                                projectId,
                                cycleId: c.id,
                              });
                              if (result.ok) router.refresh();
                            }
                          : undefined
                      }
                    />
                  </Link>
                );
              })}
            </section>
          );
        })}
      </div>
      <CycleDialog
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        cycle={dialog?.cycle}
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
