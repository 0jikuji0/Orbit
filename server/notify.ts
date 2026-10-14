import "server-only";
import type { Prisma } from "@prisma/client";
import type { db } from "@/lib/db";
import type { NotificationDraft } from "@/lib/notifications";

type Client = Prisma.TransactionClient | typeof db;

/** Enregistre des notifications (une par destinataire et par type). */
export async function notify(
  client: Client,
  issueId: string,
  actorId: string,
  drafts: NotificationDraft[],
) {
  const seen = new Set<string>();
  const data = drafts
    .filter((d) => {
      const key = `${d.userId}:${d.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((d) => ({ ...d, issueId, actorId }));
  if (data.length) await client.notification.createMany({ data });
}
