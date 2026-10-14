"use client";

import { Calendar, Columns3, List, Plus, Table } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import type { IssueDTO, ProjectMeta } from "@/lib/issues/types";
import { filterIssues, groupIssues, type Layout, type ViewState } from "@/lib/issues/view";
import { NEW_ISSUE_EVENT, isTypingTarget } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { CreateIssueDialog } from "./create-issue-dialog";
import { IssueDetail } from "./detail/issue-detail";
import { IssueCalendar } from "./issue-calendar";
import { IssueKanban } from "./issue-kanban";
import { IssueList } from "./issue-list";
import { IssueTable } from "./issue-table";
import { SaveViewDialog } from "./save-view-dialog";
import { ActiveFilters, DisplayMenu, FiltersMenu } from "./issues-filters";
import { IssuesProvider, useIssuesContext, type NewIssueDefaults } from "./issues-context";
import { useIssues } from "./use-issues";
import { useView } from "./use-view";

const LAYOUTS: { id: Layout; label: string; icon: typeof List; available: boolean }[] = [
  { id: "list", label: "Liste", icon: List, available: true },
  { id: "kanban", label: "Kanban", icon: Columns3, available: true },
  { id: "calendar", label: "Calendrier", icon: Calendar, available: true },
  { id: "table", label: "Tableau", icon: Table, available: true },
];

type IssuesViewProps = {
  workspaceSlug: string;
  meta: ProjectMeta;
  canEdit: boolean;
  currentUserId: string;
  initialIssues: IssueDTO[];
  breadcrumb: ReactNode;
  /** Limite la vue à un cycle ou un module ; les nouvelles tâches y sont rattachées. */
  scope?: IssueScope;
  /** Bandeau sous la barre du haut (ex. progression d'un cycle). */
  banner?: (issues: IssueDTO[]) => ReactNode;
};

export type IssueScope = { cycleId?: string; moduleId?: string };

const inScope = (scope: IssueScope | undefined) => (issue: IssueDTO) =>
  (!scope?.cycleId || issue.cycleId === scope.cycleId) &&
  (!scope?.moduleId || issue.moduleId === scope.moduleId);

export function IssuesView({
  workspaceSlug,
  meta,
  canEdit,
  currentUserId,
  initialIssues,
  breadcrumb,
  scope,
  banner,
}: IssuesViewProps) {
  const [view, setView] = useView();
  const [createDefaults, setCreateDefaults] = useState<NewIssueDefaults | null>(null);
  const openCreate = useCallback(
    (defaults: NewIssueDefaults = {}) => canEdit && setCreateDefaults({ ...scope, ...defaults }),
    [canEdit, scope],
  );
  const openIssue = useCallback((peek: string) => setView({ peek }), [setView]);
  const context = useMemo(
    () => ({ workspaceSlug, meta, canEdit, currentUserId, openCreate, openIssue }),
    [workspaceSlug, meta, canEdit, currentUserId, openCreate, openIssue],
  );

  return (
    <IssuesProvider value={context}>
      <IssuesBody
        initialIssues={initialIssues}
        breadcrumb={breadcrumb}
        view={view}
        setView={setView}
        scope={scope}
        banner={banner}
      />
      <CreateIssueDialog defaults={createDefaults} onClose={() => setCreateDefaults(null)} />
    </IssuesProvider>
  );
}

function IssuesBody({
  initialIssues,
  breadcrumb,
  view,
  setView,
  scope,
  banner,
}: {
  initialIssues: IssueDTO[];
  breadcrumb: ReactNode;
  view: ViewState;
  setView: (next: Partial<ViewState>) => void;
  scope?: IssueScope;
  banner?: (issues: IssueDTO[]) => ReactNode;
}) {
  const { data: issues } = useIssues(initialIssues);
  const { meta, canEdit, openCreate } = useIssuesContext();

  // Raccourci « C » et palette de commandes : « Nouvelle tâche »
  useEffect(() => {
    // Annule l'événement pour signaler à la palette que la création est prise en charge ici.
    const onNew = (e: Event) => {
      e.preventDefault();
      openCreate();
    };
    window.addEventListener(NEW_ISSUE_EVENT, onNew);
    return () => window.removeEventListener(NEW_ISSUE_EVENT, onNew);
  }, [openCreate]);
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openCreate();
    setView({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois à l'arrivée sur la page
  }, []);

  // Échap : fermer le panneau latéral (si aucun menu ni modale n'est ouvert).
  useEffect(() => {
    if (!view.peek) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || isTypingTarget(e.target)) return;
      if (document.querySelector("[role=dialog],[role=menu],[role=listbox]")) return;
      setView({ peek: null });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view.peek, setView]);

  const scoped = useMemo(() => issues.filter(inScope(scope)), [issues, scope]);
  const groups = useMemo(
    () => groupIssues(filterIssues(scoped, view.filters), view.groupBy, meta),
    [scoped, view.filters, view.groupBy, meta],
  );
  const layout = view.layout;
  const filtered = useMemo(() => filterIssues(scoped, view.filters), [scoped, view.filters]);

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
            {canEdit && <SaveViewDialog view={view} />}
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
      {banner?.(scoped)}
      <ActiveFilters filters={view.filters} onChange={(filters) => setView({ filters })} />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {layout === "kanban" && <IssueKanban groups={groups} groupBy={view.groupBy} />}
          {layout === "list" && <IssueList groups={groups} groupBy={view.groupBy} />}
          {layout === "calendar" && <IssueCalendar issues={filtered} />}
          {layout === "table" && <IssueTable issues={filtered} />}
        </div>
        {view.peek && (
          <aside
            aria-label="Détail de la tâche"
            className="border-border bg-surface flex w-[480px] shrink-0 flex-col border-l"
          >
            <IssueDetail
              key={view.peek}
              issueId={view.peek}
              variant="peek"
              onClose={() => setView({ peek: null })}
              onOpenIssue={({ id }) => setView({ peek: id })}
            />
          </aside>
        )}
      </div>
    </>
  );
}
