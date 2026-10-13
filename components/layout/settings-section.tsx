import type { ReactNode } from "react";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-border border-b py-6">
      <h2 className="text-base font-medium">{title}</h2>
      {description && <p className="text-text-muted mt-1 text-sm">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
