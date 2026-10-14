import type { Metadata } from "next";
import { InboxList } from "@/components/inbox/inbox-list";
import { countUnread, listInbox } from "@/server/queries/inbox";

export const metadata: Metadata = { title: "Inbox · Orbit" };

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ all?: string }>;
}) {
  const { workspace } = await params;
  const unreadOnly = (await searchParams).all !== "1";
  const [items, unreadCount] = await Promise.all([
    listInbox(workspace, unreadOnly),
    countUnread(workspace),
  ]);
  return (
    <InboxList
      workspaceSlug={workspace}
      items={items}
      unreadOnly={unreadOnly}
      unreadCount={unreadCount}
    />
  );
}
