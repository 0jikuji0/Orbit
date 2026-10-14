"use client";

import type { Priority, StateGroup } from "@prisma/client";
import { UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { StateDot } from "@/components/issues/state-dot";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { todayUTC } from "@/lib/issues/calendar";
import { cn } from "@/lib/utils";
import { STATE_GROUPS, STATE_GROUP_LABELS } from "@/lib/validators/state";

type Item = {
  id: string;
  key: string;
  href: string;
  title: string;
  priority: Priority;
  dueDate: Date | null;
  state: { name: string; color: string; group: StateGroup };
  project: { name: string };
};

const CLOSED: StateGroup[] = ["COMPLETED", "CANCELLED"];
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function MyIssuesList({
  workspaceSlug,
  tab,
  items,
}: {
  workspaceSlug: string;
  tab: "assigned" | "created";
  items: Item[];
}) {
  const [showClosed, setShowClosed] = useState(false);
  const base = `/${workspaceSlug}/my-issues`;
  const today = todayUTC().getTime();
  const groups = STATE_GROUPS.filter((g) => showClosed || !CLOSED.includes(g))
    .map((group) => ({ group, items: items.filter((i) => i.state.group === group) }))
    .filter((g) => g.items.length > 0);
  const closedCount = items.filter((i) => CLOSED.includes(i.state.group)).length;

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <UserCheck className="text-text-muted size-4" />
            <span>Mes tâches</span>
          </>
        }
        actions={
          <>
            <div role="tablist" aria-label="Mes tâches" className="border-border flex border">
              {[
                { id: "assigned", label: "Assignées", href: base },
                { id: "created", label: "Créées par moi", href: `${base}?tab=created` },
              ].map((t) => (
                <Link
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  href={t.href}
                  className={cn(
                    "text-text-muted hover:bg-surface-2 flex h-7 items-center px-3 text-xs",
                    tab === t.id && "bg-surface-3 text-text",
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <label className="text-text-muted flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(e) => setShowClosed(e.target.checked)}
                className="accent-accent"
              />
              Terminées et annulées ({closedCount})
            </label>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <UserCheck className="text-text-dim size-8" />
            <p className="text-text-muted text-sm">Aucune tâche en cours.</p>
          </div>
        )}
        {groups.map(({ group, items: rows }) => (
          <section key={group} aria-label={STATE_GROUP_LABELS[group]}>
            <h2 className="border-border bg-surface sticky top-0 flex h-9 items-center gap-2 border-b px-4 text-sm font-medium">
              {STATE_GROUP_LABELS[group]}
              <span className="text-text-dim font-mono text-xs font-normal">{rows.length}</span>
            </h2>
            {rows.map((i) => (
              <Link
                key={i.id}
                href={i.href}
                data-testid="my-issue"
                className="border-border hover:bg-surface-2 flex h-9 items-center gap-3 border-b px-4"
              >
                <PriorityIcon priority={i.priority} />
                <span className="text-text-dim w-16 shrink-0 font-mono text-xs">{i.key}</span>
                <span className="text-text-muted flex w-28 shrink-0 items-center gap-1.5 truncate text-xs">
                  <StateDot color={i.state.color} />
                  {i.state.name}
                </span>
                <span className="min-w-0 flex-1 truncate">{i.title}</span>
                <Badge>{i.project.name}</Badge>
                {i.dueDate && (
                  <span
                    className={cn(
                      "text-text-dim w-16 shrink-0 text-right font-mono text-xs",
                      i.dueDate.getTime() < today &&
                        !CLOSED.includes(i.state.group) &&
                        "text-danger",
                    )}
                  >
                    {dateFormat.format(i.dueDate)}
                  </span>
                )}
              </Link>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
