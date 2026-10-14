import { cn } from "@/lib/utils";

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percent} % terminé`}
      className={cn("bg-surface-3 h-1.5 w-full", className)}
    >
      <div className="bg-success h-full" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function ProgressSummary({
  done,
  total,
  percent,
}: {
  done: number;
  total: number;
  percent: number;
}) {
  return (
    <div className="flex w-48 shrink-0 items-center gap-2">
      <ProgressBar percent={percent} />
      <span className="text-text-dim w-20 shrink-0 text-right font-mono text-xs">
        {done}/{total} · {percent}%
      </span>
    </div>
  );
}
