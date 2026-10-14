"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { countUnread, inboxWhere } from "@/server/queries/inbox";

const markReadSchema = z.object({
  workspaceSlug: z.string(),
  /** Absent : tout marquer comme lu. */
  ids: z.array(z.string()).max(200).optional(),
});

export async function markNotificationsRead(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, ids } = markReadSchema.parse(input);
    const where = await inboxWhere(workspaceSlug);
    await db.notification.updateMany({
      where: { ...where, readAt: null, ...(ids && { id: { in: ids } }) },
      data: { readAt: new Date() },
    });
    revalidatePath(`/${workspaceSlug}`, "layout");
  });
}

export async function fetchUnreadCount(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug } = z.object({ workspaceSlug: z.string() }).parse(input);
    return countUnread(workspaceSlug);
  });
}
