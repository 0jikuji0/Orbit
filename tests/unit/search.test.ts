import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { buildTsQuery, splitHighlights, HIGHLIGHT_END, HIGHLIGHT_START } from "@/lib/search";
import { searchIssues } from "@/server/search";

describe("buildTsQuery", () => {
  it.each([
    ["colonnes", "colonnes:*"],
    ["  drag & drop  ", "drag:* & drop:*"],
    ["déplaçable!", "déplaçable:*"],
    ["a:* | !b", "a:* & b:*"],
    ["(((", null],
    ["", null],
  ])("%s → %s", (input, expected) => {
    expect(buildTsQuery(input)).toBe(expected);
  });
});

describe("splitHighlights", () => {
  it("sépare les passages surlignés", () => {
    const s = `Les ${HIGHLIGHT_START}colonnes${HIGHLIGHT_END} bougent`;
    expect(splitHighlights(s)).toEqual([
      { text: "Les ", hit: false },
      { text: "colonnes", hit: true },
      { text: " bougent", hit: false },
    ]);
  });
  it("tolère un marqueur non fermé et une chaîne vide", () => {
    expect(splitHighlights(`x ${HIGHLIGHT_START}y`)).toEqual([
      { text: `x ${HIGHLIGHT_START}y`, hit: false },
    ]);
    expect(splitHighlights("")).toEqual([]);
  });
});

/** Test d'intégration : nécessite la base de dev migrée (`pnpm db:migrate`). */
describe("searchIssues", () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  let workspaceId: string;
  let otherWorkspaceId: string;
  let userId: string;

  const doc = (text: string) => ({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });

  beforeAll(async () => {
    const user = await db.user.create({
      data: { email: `search-${suffix}@test.local`, name: "S" },
    });
    userId = user.id;
    const makeProject = async (slug: string, identifier: string) => {
      const ws = await db.workspace.create({ data: { name: slug, slug: `${slug}-${suffix}` } });
      const project = await db.project.create({
        data: {
          workspaceId: ws.id,
          name: identifier,
          identifier,
          states: { create: { name: "À faire", color: "#aaa", position: 0, group: "UNSTARTED" } },
        },
        include: { states: true },
      });
      return { ws, project, stateId: project.states[0]!.id };
    };
    const a = await makeProject("srch", "SRC");
    const b = await makeProject("other", "OTH");
    workspaceId = a.ws.id;
    otherWorkspaceId = b.ws.id;
    await db.issue.createMany({
      data: [
        {
          projectId: a.project.id,
          sequenceId: 1,
          title: "Tableau kanban",
          stateId: a.stateId,
          createdById: userId,
          descriptionJson: doc("Les colonnes déplaçables au clavier"),
        },
        {
          projectId: a.project.id,
          sequenceId: 2,
          title: "Export PDF",
          stateId: a.stateId,
          createdById: userId,
        },
        {
          projectId: a.project.id,
          sequenceId: 3,
          title: "Colonnes archivées",
          stateId: a.stateId,
          createdById: userId,
          archivedAt: new Date(),
        },
        {
          projectId: b.project.id,
          sequenceId: 1,
          title: "Colonnes ailleurs",
          stateId: b.stateId,
          createdById: userId,
        },
      ],
    });
  });

  afterAll(async () => {
    await db.workspace.deleteMany({ where: { id: { in: [workspaceId, otherWorkspaceId] } } });
    await db.user.delete({ where: { id: userId } });
  });

  const run = (q: string) => searchIssues({ workspaceId, userId, role: "OWNER" }, q);

  it("trouve un mot de la description, sans accent et par préfixe", async () => {
    const hits = await run("deplacab");
    expect(hits.map((h) => h.title)).toEqual(["Tableau kanban"]);
    expect(hits[0]!.snippet).toContain(`${HIGHLIGHT_START}déplaçables${HIGHLIGHT_END}`);
  });

  it("cherche aussi dans les titres", async () => {
    expect((await run("export")).map((h) => h.title)).toEqual(["Export PDF"]);
  });

  it("ignore les tâches archivées et les autres espaces", async () => {
    expect((await run("colonnes")).map((h) => h.title)).toEqual(["Tableau kanban"]);
  });

  it("une saisie sans mot ne renvoie rien", async () => {
    expect(await run("&&&")).toEqual([]);
  });
});
