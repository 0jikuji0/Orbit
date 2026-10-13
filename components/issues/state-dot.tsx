import { cn } from "@/lib/utils";

/** Pastille d'état : seule exception autorisée au radius 0 (cercle 8px). */
export function StateDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}
