"use client";

import type { NotificationType } from "@prisma/client";
import { CheckCheck, Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/issues/activity-format";
import { NOTIFICATION_LABELS } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { markNotificationsRead } from "@/server/actions/inbox";

type Item = {
  id: string;
  type: NotificationType;
  createdAt: Date;
  read: boolean;
  actor: { name: string; avatarUrl: string | null } | null;
  issue: { key: string; title: string; href: string };
};

export function InboxList({
  workspaceSlug,
  items,
  unreadOnly,
  unreadCount,
}: {
  workspaceSlug: string;
  items: Item[];
  unreadOnly: boolean;
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const base = `/${workspaceSlug}/inbox`;

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <Inbox className="text-text-muted size-4" />
            <span>Inbox</span>
            {unreadCount > 0 && (
              <span className="text-accent font-mono text-xs">{unreadCount}</span>
            )}
          </>
        }
        actions={
          <>
            <div role="tablist" aria-label="Filtre" className="border-border flex border">
              {[
                { label: "Non lues", href: base, active: unreadOnly },
                { label: "Toutes", href: `${base}?all=1`, active: !unreadOnly },
              ].map((tab) => (
                <Link
                  key={tab.label}
                  role="tab"
                  aria-selected={tab.active}
                  href={tab.href}
                  className={cn(
                    "text-text-muted hover:bg-surface-2 flex h-7 items-center px-3 text-xs",
                    tab.active && "bg-surface-3 text-text",
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <Button
              size="sm"
              disabled={pending || unreadCount === 0}
              onClick={() =>
                startTransition(async () => {
                  await markNotificationsRead({ workspaceSlug });
                  router.refresh();
                })
              }
            >
              <CheckCheck />
              Tout marquer comme lu
            </Button>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Inbox className="text-text-dim size-8" />
            <p className="text-text-muted text-sm">
              {unreadOnly ? "Rien de nouveau. Vous êtes à jour." : "Aucune notification."}
            </p>
          </div>
        )}
        {items.map((n) => (
          <Link
            key={n.id}
            href={n.issue.href}
            data-testid="notification"
            onClick={() => {
              if (!n.read) void markNotificationsRead({ workspaceSlug, ids: [n.id] });
            }}
            className={cn(
              "border-border hover:bg-surface-2 flex h-12 items-center gap-3 border-b px-4",
              n.read && "text-text-muted",
            )}
          >
            <span
              aria-label={n.read ? undefined : "Non lue"}
              className={cn("size-1.5 shrink-0", !n.read && "bg-accent")}
            />
            <Avatar name={n.actor?.name ?? "?"} src={n.actor?.avatarUrl} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm">
              <span className={cn(!n.read && "text-text font-medium")}>
                {n.actor?.name ?? "Quelqu'un"}
              </span>{" "}
              {NOTIFICATION_LABELS[n.type]}{" "}
              <span className="text-text-dim font-mono text-xs">{n.issue.key}</span> {n.issue.title}
            </span>
            <span className="text-text-dim shrink-0 text-xs">{timeAgo(n.createdAt)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
