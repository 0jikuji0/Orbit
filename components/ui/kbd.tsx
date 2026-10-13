import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "border-border bg-surface-2 text-text-muted inline-flex h-5 min-w-5 items-center justify-center border px-1 font-mono text-xs",
        className,
      )}
      {...props}
    />
  );
}
