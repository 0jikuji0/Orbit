"use client";

import { Calendar, Columns3, List, Plus, Table } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import type { IssueDTO, ProjectMeta } from "@/lib/issues/types";
import { filterIssues, groupIssues, type Layout } from "@/lib/issues/view";
import { cn } from "@/lib/utils";
import { CreateIssueDialog } from "./create-issue-dialog";
import { IssueKanban } from "./issue-kanban";
import { IssueList } from "./issue-list";
import { ActiveFilters, DisplayMenu, FiltersMenu } from "./issues-filters";
import { IssuesProvider, useIssuesContext, type NewIssueDefaults } from "./issues-context";
import { useIssues } from "./use-issues";
import { useView } from "./use-view";

const LAYOUTS: { id: Layout; label: string; icon: typeof List; available: boolean }[] = [
  { id: "list", label: "Liste", icon: List, available: true },
  { id: "kanban", label: "Kanban", icon: Columns3, available: true },
  { id: "calendar", label: "Calendrier — bientôt (phase 4)", icon: Calendar, available: false },
  { id: "table", label: "Tableau — bientôt (phase 4)", icon: Table, available: false },
];

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

type IssuesViewProps = {
  workspaceSlug: string;
  meta: ProjectMeta;
  canEdit: boolean;
  initialIssues: IssueDTO[];
  breadcrumb: ReactNode;
};

export function IssuesView({
  workspaceSlug,
  meta,
  canEdit,
  initialIssues,
  breadcrumb,
}: IssuesViewProps) {
  const [createDefaults, setCreateDefaults] = useState<NewIssueDefaults | null>(null);
  const openCreate = useCallback(
    (defaults: NewIssueDefaults = {}) => canEdit && setCreateDefaults(defaults),
    [canEdit],
  );
  const context = useMemo(
    () => ({ workspaceSlug, meta, canEdit, openCreate }),
    [workspaceSlug, meta, canEdit, openCreate],
  );

  return (
    <IssuesProvider value={context}>
      <IssuesBody initialIssues={initialIssues} breadcrumb={breadcrumb} />
      <CreateIssueDialog defaults={createDefaults} onClose={() => setCreateDefaults(null)} />
    </IssuesProvider>
  );
}

function IssuesBody({
  initialIssues,
  breadcrumb,
}: {
  initialIssues: IssueDTO[];
  breadcrumb: ReactNode;
}) {
  const { data: issues } = useIssues(initialIssues);
  const [view, setView] = useView();
  const { meta, canEdit, openCreate } = useIssuesContext();

  // Raccourci « C » : nouvelle tâche
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "c" || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target))
        return;
      if (document.querySelector("[role=dialog],[role=menu]")) return;
      e.preventDefault();
      openCreate();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCreate]);

  const groups = useMemo(
    () => groupIssues(filterIssues(issues, view.filters), view.groupBy, meta),
    [issues, view.filters, view.groupBy, meta],
  );
  const layout = view.layout === "kanban" ? "kanban" : "list";

  return (
    <>
      <Topbar
        breadcrumb={breadcrumb}
        actions={
          <>
            <div role="tablist" aria-label="Disposition" className="border-border flex border">
              {LAYOUTS.map(({ id, label, icon: Icon, available }) => (
                <Tooltip key={id} content={label}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={layout === id}
                    aria-label={label}
                    aria-disabled={!available}
                    onClick={() => available && setView({ layout: id })}
                    className={cn(
                      "text-text-dim flex size-7 items-center justify-center",
                      available
                        ? "hover:bg-surface-2 hover:text-text cursor-pointer"
                        : "cursor-not-allowed opacity-40",
                      layout === id && "bg-surface-3 text-text",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                </Tooltip>
              ))}
            </div>
            <FiltersMenu filters={view.filters} onChange={(filters) => setView({ filters })} />
            <DisplayMenu groupBy={view.groupBy} onChange={(groupBy) => setView({ groupBy })} />
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => openCreate()}>
                <Plus />
                Nouvelle
                <Kbd className="border-accent-fg/30 text-accent-fg ml-1 h-4 min-w-4 bg-transparent">
                  C
                </Kbd>
              </Button>
            )}
          </>
        }
      />
      <ActiveFilters filters={view.filters} onChange={(filters) => setView({ filters })} />
      {layout === "kanban" ? (
        <IssueKanban groups={groups} groupBy={view.groupBy} />
      ) : (
        <IssueList groups={groups} groupBy={view.groupBy} />
      )}
    </>
  );
}
