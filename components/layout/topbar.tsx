import type { ReactNode } from "react";

export function Topbar({ breadcrumb, actions }: { breadcrumb: ReactNode; actions?: ReactNode }) {
  return (
    <header className="border-border flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">{breadcrumb}</div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
