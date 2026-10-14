"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type MentionItem = { id: string; name: string; avatarUrl: string | null };

export type MentionListHandle = { onKeyDown: (event: KeyboardEvent) => boolean };

type Props = {
  items: MentionItem[];
  command: (attrs: { id: string; label: string }) => void;
};

/** Liste des personnes proposées après « @ » ; navigable au clavier. */
export const MentionList = forwardRef<MentionListHandle, Props>(function MentionList(
  { items, command },
  ref,
) {
  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [items]);

  const pick = (index: number) => {
    const item = items[index];
    if (item) command({ id: item.id, label: item.name });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (event.key === "ArrowDown") {
        setSelected((i) => (i + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((i) => (i - 1 + items.length) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        pick(selected);
        return true;
      }
      return false;
    },
  }));

  return (
    <div
      role="listbox"
      aria-label="Mentionner"
      className="border-border bg-surface w-56 border p-1 text-sm"
    >
      {items.length === 0 ? (
        <div className="text-text-dim px-2 py-1 text-xs">Personne trouvée</div>
      ) : (
        items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === selected}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(index)}
            className={cn(
              "flex h-7 w-full cursor-pointer items-center gap-2 px-2 text-left",
              index === selected && "bg-surface-2",
            )}
          >
            <Avatar name={item.name} src={item.avatarUrl} size="xs" />
            <span className="truncate">{item.name}</span>
          </button>
        ))
      )}
    </div>
  );
});
