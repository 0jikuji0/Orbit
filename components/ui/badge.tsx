import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = ComponentProps<"span"> & {
  /** Couleur de donnée (label, état) affichée en pastille carrée. */
  color?: string;
};

export function Badge({ className, color, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "border-border text-text-muted inline-flex h-5 items-center gap-1.5 border px-1.5 text-xs whitespace-nowrap",
        className,
      )}
      {...props}
    >
      {color && <span aria-hidden className="size-2 shrink-0" style={{ backgroundColor: color }} />}
      {children}
    </span>
  );
}
