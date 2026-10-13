"use client";

import { Calendar, Columns3, ListFilter, List, Plus, SlidersHorizontal, Table } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const LAYOUTS = [
  { id: "list", label: "Liste", icon: List },
  { id: "kanban", label: "Kanban", icon: Columns3 },
  { id: "calendar", label: "Calendrier", icon: Calendar },
  { id: "table", label: "Tableau", icon: Table },
] as const;

type LayoutId = (typeof LAYOUTS)[number]["id"];

export function Topbar({ breadcrumb }: { breadcrumb: ReactNode }) {
  const [layout, setLayout] = useState<LayoutId>("list");

  return (
    <header className="border-border flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">{breadcrumb}</div>

      <div className="ml-auto flex items-center gap-2">
        <div role="tablist" aria-label="Disposition" className="border-border flex border">
          {LAYOUTS.map(({ id, label, icon: Icon }) => (
            <Tooltip key={id} content={label}>
              <button
                type="button"
                role="tab"
                aria-selected={layout === id}
                aria-label={label}
                onClick={() => setLayout(id)}
                className={cn(
                  "text-text-dim hover:bg-surface-2 hover:text-text flex size-7 cursor-pointer items-center justify-center",
                  layout === id && "bg-surface-3 text-text",
                )}
              >
                <Icon className="size-4" />
              </button>
            </Tooltip>
          ))}
        </div>
        <Button size="sm">
          <ListFilter />
          Filtres
        </Button>
        <Button size="sm">
          <SlidersHorizontal />
          Affichage
        </Button>
        <Button size="sm" variant="primary">
          <Plus />
          Nouvelle
          <Kbd className="border-accent-fg/30 text-accent-fg ml-1 h-4 min-w-4 bg-transparent">
            C
          </Kbd>
        </Button>
      </div>
    </header>
  );
}
