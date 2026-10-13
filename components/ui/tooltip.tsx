"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: ComponentProps<typeof TooltipPrimitive.Content>["side"];
  className?: string;
};

/** Infobulle simple : <Tooltip content="…"><button/></Tooltip> */
export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={4}
          className={cn(
            "border-border bg-surface-3 text-text z-50 border px-2 py-1 text-xs",
            className,
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
