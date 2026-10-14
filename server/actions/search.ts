"use server";

import { z } from "zod";
import { runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { accessibleProjectsWhere, requireWorkspace } from "@/lib/permissions";
import { searchIssues } from "@/server/search";

const searchSchema = z.object({
  workspaceSlug: z.string(),
  query: z.string().trim().max(100),
});

/** Recherche de la palette : clé exacte (« ORB-12 », « 12 ») puis plein texte (titres + descriptions). */
export async function quickSearchIssues(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, query } = searchSchema.parse(input);
    if (!query) return [];
    const { user, workspace, role } = await requireWorkspace(workspaceSlug);
    const key = /^(?:([a-z][a-z0-9]{1,4})-)?(\d+)$/i.exec(query);

    const byKey = key
      ? await db.issue.findMany({
          where: {
            archivedAt: null,
            sequenceId: Number(key[2]),
            project: {
              ...accessibleProjectsWhere(workspace.id, user.id, role),
              ...(key[1] && { identifier: key[1].toUpperCase() }),
            },
          },
          take: 5,
          select: {
            id: true,
            sequenceId: true,
            title: true,
            project: { select: { id: true, identifier: true } },
            state: { select: { color: true } },
          },
        })
      : [];
    const byText = await searchIssues(
      { workspaceId: workspace.id, userId: user.id, role },
      query,
      15,
    );

    const hits = [
      ...byKey.map((i) => ({
        id: i.id,
        key: `${i.project.identifier}-${i.sequenceId}`,
        title: i.title,
        projectId: i.project.id,
        sequenceId: i.sequenceId,
        stateColor: i.state.color,
      })),
      ...byText.map((h) => ({
        id: h.id,
        key: `${h.identifier}-${h.sequenceId}`,
        title: h.title,
        projectId: h.projectId,
        sequenceId: h.sequenceId,
        stateColor: h.stateColor,
      })),
    ];
    return hits.filter((h, i) => hits.findIndex((o) => o.id === h.id) === i);
  });
}
