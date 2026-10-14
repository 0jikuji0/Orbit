"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchUnreadCount } from "@/server/actions/inbox";

const POLL_MS = 60_000;

/** Compteur de notifications non lues, rafraîchi chaque minute et à chaque navigation. */
export function UnreadBadge({
  workspaceSlug,
  initial,
}: {
  workspaceSlug: string;
  initial: number;
}) {
  const [count, setCount] = useState(initial);
  const pathname = usePathname();
  useEffect(() => setCount(initial), [initial]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const result = await fetchUnreadCount({ workspaceSlug });
      if (!cancelled && result.ok) setCount(result.data);
    };
    void refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [workspaceSlug, pathname]);

  if (!count) return null;
  return (
    <span
      data-testid="unread-badge"
      aria-label={`${count} non lue${count > 1 ? "s" : ""}`}
      className="bg-accent text-accent-fg ml-auto px-1.5 font-mono text-xs"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
