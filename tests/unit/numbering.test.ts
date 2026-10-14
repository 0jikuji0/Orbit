import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { nextSequenceId } from "@/lib/issues/numbering";

/** Test d'intégration : nécessite la base de dev (`pnpm db:up`). */
describe("nextSequenceId", () => {
  let workspaceId: string;
  let projectId: string;
  let stateId: string;
  let userId: string;

  beforeAll(async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const user = await db.user.create({ data: { email: `num-${suffix}@test.local`, name: "Num" } });
    const ws = await db.workspace.create({ data: { name: "Num", slug: `num-${suffix}` } });
    const project = await db.project.create({
      data: {
        workspaceId: ws.id,
        name: "Num",
        identifier: "NUM",
        states: { create: { name: "À faire", color: "#aaa", position: 0, group: "UNSTARTED" } },
      },
      include: { states: true },
    });
    workspaceId = ws.id;
    projectId = project.id;
    stateId = project.states[0]!.id;
    userId = user.id;
  });

  afterAll(async () => {
    await db.workspace.delete({ where: { id: workspaceId } });
    await db.user.delete({ where: { id: userId } });
    await db.$disconnect();
  });

  it("attribue des numéros consécutifs et uniques, même en concurrence", async () => {
    const created = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        db.$transaction(async (tx) => {
          const sequenceId = await nextSequenceId(tx, projectId);
          return tx.issue.create({
            data: { projectId, sequenceId, title: `T${i}`, stateId, createdById: userId },
          });
        }),
      ),
    );
    const numbers = created.map((i) => i.sequenceId).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));

    const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project.issueCounter).toBe(25);
  });
});
