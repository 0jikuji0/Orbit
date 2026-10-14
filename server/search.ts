import type { WorkspaceRole } from "@prisma/client";
import { db } from "@/lib/db";
import { accessibleProjectsWhere } from "@/lib/project-access";
import { HIGHLIGHT_END, HIGHLIGHT_START, buildTsQuery } from "@/lib/search";

export type SearchHit = {
  id: string;
  sequenceId: number;
  title: string;
  projectId: string;
  identifier: string;
  stateColor: string;
  snippet: string;
};

/**
 * Recherche plein texte (titre + description) dans les projets visibles par l'utilisateur.
 * À n'appeler qu'après `requireWorkspace`.
 */
export async function searchIssues(
  access: { workspaceId: string; userId: string; role: WorkspaceRole },
  input: string,
  limit = 30,
): Promise<SearchHit[]> {
  const tsquery = buildTsQuery(input);
  if (!tsquery) return [];
  const projects = await db.project.findMany({
    where: accessibleProjectsWhere(access.workspaceId, access.userId, access.role),
    select: { id: true },
  });
  if (!projects.length) return [];

  const options = `StartSel="${HIGHLIGHT_START}", StopSel="${HIGHLIGHT_END}", MaxWords=24, MinWords=8, MaxFragments=1`;
  return db.$queryRaw<SearchHit[]>`
    SELECT i.id, i."sequenceId", i.title, p.id AS "projectId", p.identifier, s.color AS "stateColor",
           ts_headline('orbit_search', orbit_doc_text(i."descriptionJson"), q, ${options}) AS snippet
    FROM "Issue" i
    JOIN "Project" p ON p.id = i."projectId"
    JOIN "State" s ON s.id = i."stateId",
         to_tsquery('orbit_search', ${tsquery}) q
    WHERE i."archivedAt" IS NULL
      AND p.id = ANY(${projects.map((p) => p.id)})
      AND i.search @@ q
    ORDER BY ts_rank(i.search, q) DESC, i."updatedAt" DESC
    LIMIT ${limit}
  `;
}
