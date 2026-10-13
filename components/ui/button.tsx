import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border text-sm font-medium whitespace-nowrap transition-colors select-none focus-visible:border-border-strong disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border-accent bg-accent text-accent-fg hover:opacity-90",
        secondary: "border-border bg-surface-2 text-text hover:bg-surface-3",
        ghost: "border-transparent text-text-muted hover:bg-surface-2 hover:text-text",
        danger: "border-danger bg-transparent text-danger hover:bg-surface-2",
      },
      size: {
        sm: "h-7 px-2 text-xs",
        md: "h-8 px-3",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
