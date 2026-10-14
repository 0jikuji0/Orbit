"use client";

import type { ViewLayout } from "@prisma/client";
import { Calendar, Columns3, Layers, List, Table, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { fromSavedView, savedViewHref } from "@/lib/issues/saved-view";
import { GROUP_BY_LABELS } from "@/lib/issues/view";
import { deleteSavedView } from "@/server/actions/saved-views";

const LAYOUT_ICONS: Record<ViewLayout, typeof List> = {
  LIST: List,
  KANBAN: Columns3,
  CALENDAR: Calendar,
  TABLE: Table,
};

type View = {
  id: string;
  name: string;
  layout: ViewLayout;
  filtersJson: unknown;
  createdBy: string;
  canDelete: boolean;
};

export function SavedViewList({
  workspaceSlug,
  projectId,
  projectName,
  views,
}: {
  workspaceSlug: string;
  projectId: string;
  projectName: string;
  views: View[];
}) {
  const router = useRouter();
  const base = `/${workspaceSlug}/projects/${projectId}/issues`;
  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <span className="text-text-muted">{projectName}</span>
            <span className="text-text-dim">/</span>
            <Layers className="text-text-muted size-4" />
            <span>Vues</span>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {views.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Layers className="text-text-dim size-8" />
            <p className="text-text-muted text-sm">Aucune vue enregistrée.</p>
            <p className="text-text-dim text-xs">
              Dans la liste des tâches, réglez filtres et affichage, puis cliquez sur l&apos;icône «
              Enregistrer la vue ».
            </p>
          </div>
        )}
        {views.map((v) => {
          const Icon = LAYOUT_ICONS[v.layout];
          const state = fromSavedView(v.layout, v.filtersJson);
          const count = Object.values(state.filters).reduce((n, f) => n + f.length, 0);
          return (
            <div
              key={v.id}
              className="group border-border hover:bg-surface-2 flex h-12 items-center gap-3 border-b px-4"
            >
              <Icon className="text-text-dim size-4 shrink-0" />
              <Link
                href={savedViewHref(base, v.layout, v.filtersJson)}
                className="min-w-0 flex-1 truncate font-medium hover:underline"
              >
                {v.name}
              </Link>
              <Badge>Par {GROUP_BY_LABELS[state.groupBy].toLowerCase()}</Badge>
              <Badge>
                {count} filtre{count > 1 ? "s" : ""}
              </Badge>
              <span className="text-text-dim w-32 truncate text-xs">par {v.createdBy}</span>
              {v.canDelete && (
                <Tooltip content="Supprimer la vue">
                  <button
                    type="button"
                    aria-label={`Supprimer ${v.name}`}
                    onClick={async () => {
                      const result = await deleteSavedView({
                        workspaceSlug,
                        projectId,
                        viewId: v.id,
                      });
                      if (result.ok) router.refresh();
                    }}
                    className="text-text-dim hover:bg-surface-3 hover:text-danger flex size-6 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
