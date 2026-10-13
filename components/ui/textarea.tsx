import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { fieldClassName } from "./input";

export function Textarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea rows={rows} className={cn(fieldClassName, "h-auto py-2", className)} {...props} />
  );
}
