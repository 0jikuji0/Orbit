import { BarChart3 } from "lucide-react";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { StateDot } from "@/components/issues/state-dot";
import { Topbar } from "@/components/layout/topbar";
import { Tooltip } from "@/components/ui/tooltip";
import type { Bucket, ProjectAnalytics } from "@/lib/issues/analytics";
import { cn } from "@/lib/utils";

const PRIORITY_BAR: Record<string, string> = {
  URGENT: "bg-prio-urgent",
  HIGH: "bg-prio-high",
  MEDIUM: "bg-prio-medium",
  LOW: "bg-prio-low",
  NONE: "bg-prio-none",
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-1 border p-4">
      <span className="text-text-dim text-xs">{label}</span>
      <span className={cn("text-text font-mono text-2xl", tone === "danger" && "text-danger")}>
        {value}
      </span>
    </div>
  );
}

/** Barres horizontales : une catégorie par ligne, valeur écrite en clair (aucune information par la couleur seule). */
function BarList({
  title,
  caption,
  buckets,
}: {
  title: string;
  caption: string;
  buckets: Bucket[];
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((n, b) => n + b.count, 0);
  return (
    <section aria-label={title} className="border-border bg-surface flex flex-col border">
      <header className="border-border border-b px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-text-dim text-xs">{caption}</p>
      </header>
      <table className="w-full text-sm">
        <caption className="sr-only">{title}</caption>
        <tbody>
          {buckets.map((b) => {
            const percent = total ? Math.round((b.count / total) * 100) : 0;
            return (
              <Tooltip
                key={b.key}
                content={`${b.label} : ${b.count} tâche${b.count > 1 ? "s" : ""} (${percent} %)`}
              >
                <tr className="hover:bg-surface-2 h-9" data-testid="analytics-row">
                  <th scope="row" className="text-text-muted w-40 px-4 text-left font-normal">
                    <span className="flex items-center gap-2">
                      {b.color && <StateDot color={b.color} />}
                      {b.priority && <PriorityIcon priority={b.priority} />}
                      <span className="truncate">{b.label}</span>
                    </span>
                  </th>
                  <td className="px-2">
                    <div className="h-3 w-full">
                      <div
                        className={cn(
                          "h-full",
                          b.priority ? PRIORITY_BAR[b.priority] : !b.color && "bg-accent",
                        )}
                        style={{
                          width: `${(b.count / max) * 100}%`,
                          ...(b.color && { backgroundColor: b.color }),
                        }}
                      />
                    </div>
                  </td>
                  <td className="text-text w-16 px-4 text-right font-mono text-xs">{b.count}</td>
                </tr>
              </Tooltip>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function AnalyticsView({
  projectName,
  analytics,
}: {
  projectName: string;
  analytics: ProjectAnalytics;
}) {
  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <span className="text-text-muted">{projectName}</span>
            <span className="text-text-dim">/</span>
            <BarChart3 className="text-text-muted size-4" />
            <span>Statistiques</span>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Tâches" value={String(analytics.total)} />
            <Stat label="Ouvertes" value={String(analytics.open)} />
            <Stat label="Terminées" value={`${analytics.completedPercent} %`} />
            <Stat
              label="En retard"
              value={String(analytics.overdue)}
              tone={analytics.overdue ? "danger" : undefined}
            />
          </div>
          <BarList
            title="Par état"
            caption="Toutes les tâches actives"
            buckets={analytics.byState}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <BarList
              title="Par priorité"
              caption="Tâches ouvertes"
              buckets={analytics.byPriority}
            />
            <BarList
              title="Par assigné"
              caption="Tâches ouvertes (une tâche compte pour chaque assigné)"
              buckets={analytics.byAssignee}
            />
          </div>
        </div>
      </div>
    </>
  );
}
