"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-bg/80 fixed inset-0 z-50" />
      <DialogPrimitive.Content
        className={cn(
          "border-border bg-surface text-text fixed top-[15%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Fermer"
          className="text-text-dim hover:bg-surface-2 hover:text-text absolute top-3 right-3 flex size-6 cursor-pointer items-center justify-center"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("border-border border-b px-4 py-3 pr-10", className)} {...props} />;
}

export function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("border-border flex justify-end gap-2 border-t px-4 py-3", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-base font-medium", className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-text-muted mt-1 text-sm", className)}
      {...props}
    />
  );
}
