import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const fieldClassName =
  "h-8 w-full border border-border bg-surface-2 px-2.5 text-sm text-text outline-none placeholder:text-text-dim focus-visible:border-border-strong focus-visible:outline-1 focus-visible:outline-accent disabled:opacity-50 aria-invalid:border-danger";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(fieldClassName, className)} {...props} />;
}
