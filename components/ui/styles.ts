/** Classes partagées par les surfaces flottantes (menus, popovers, select). */
export const floatingClassName =
  "z-50 min-w-40 overflow-hidden border border-border bg-surface p-1 text-sm text-text";

export const menuItemClassName =
  "relative flex h-7 cursor-pointer items-center gap-2 px-2 outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-text-muted";
