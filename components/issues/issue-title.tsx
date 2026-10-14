"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { issueTitleSchema } from "@/lib/validators/issue";

/** Titre affiché, ou champ d'édition en ligne quand `editing` est vrai. */
export function IssueTitle({
  title,
  editing,
  onSubmit,
  onCancel,
  className,
}: {
  title: string;
  editing: boolean;
  onSubmit: (title: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(title);
  if (!editing) return <span className={cn("min-w-0 truncate", className)}>{title}</span>;

  const commit = () => {
    const parsed = issueTitleSchema.safeParse(value);
    if (parsed.success && parsed.data !== title) onSubmit(parsed.data);
    else onCancel();
  };

  return (
    <input
      autoFocus
      aria-label="Titre"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation(); // ne pas déclencher le glisser-déposer clavier du kanban
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setValue(title);
          onCancel();
        }
      }}
      className={cn(
        "border-border-strong bg-surface-2 text-text min-w-0 flex-1 border px-1 text-sm outline-none",
        className,
      )}
    />
  );
}
