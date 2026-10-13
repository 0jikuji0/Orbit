"use client";

import { Check } from "lucide-react";
import { DropdownMenu as DropdownPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { floatingClassName, menuItemClassName } from "./styles";

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;
export const DropdownGroup = DropdownPrimitive.Group;

export function DropdownContent({
  className,
  sideOffset = 4,
  align = "start",
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(floatingClassName, className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownItem({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Item>) {
  return <DropdownPrimitive.Item className={cn(menuItemClassName, className)} {...props} />;
}

export function DropdownCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownPrimitive.CheckboxItem>) {
  return (
    <DropdownPrimitive.CheckboxItem className={cn(menuItemClassName, "pr-7", className)} {...props}>
      {children}
      <DropdownPrimitive.ItemIndicator className="absolute right-2">
        <Check />
      </DropdownPrimitive.ItemIndicator>
    </DropdownPrimitive.CheckboxItem>
  );
}

export function DropdownLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn("text-text-dim px-2 py-1 text-xs", className)}
      {...props}
    />
  );
}

export function DropdownSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}
