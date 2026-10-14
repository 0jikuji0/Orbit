"use server";

import { z } from "zod";
import { runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { accessibleProjectsWhere, requireWorkspace } from "@/lib/permissions";

const searchSchema = z.object({
  workspaceSlug: z.string(),
  query: z.string().trim().max(100),
});

/**
 * Recherche rapide pour la palette : par clé (« ORB-12 », « 12 ») ou par titre.
 * La recherche plein texte (titres + descriptions) arrive en phase 5.
 */
export async function quickSearchIssues(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, query } = searchSchema.parse(input);
    if (!query) return [];
    const { user, workspace, role } = await requireWorkspace(workspaceSlug);
    const key = /^(?:([a-z][a-z0-9]{1,4})-)?(\d+)$/i.exec(query);

    const issues = await db.issue.findMany({
      where: {
        archivedAt: null,
        project: accessibleProjectsWhere(workspace.id, user.id, role),
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          ...(key
            ? [
                {
                  sequenceId: Number(key[2]),
                  ...(key[1] && { project: { identifier: key[1].toUpperCase() } }),
                },
              ]
            : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        sequenceId: true,
        title: true,
        project: { select: { id: true, identifier: true } },
        state: { select: { color: true } },
      },
    });
    return issues.map((i) => ({
      id: i.id,
      key: `${i.project.identifier}-${i.sequenceId}`,
      title: i.title,
      projectId: i.project.id,
      sequenceId: i.sequenceId,
      stateColor: i.state.color,
    }));
  });
}
