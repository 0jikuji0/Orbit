import { PrismaClient, type Priority } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { DEFAULT_STATES } from "../lib/default-states";

const db = new PrismaClient();

const DEMO_PASSWORD = "orbit-demo";

const DEMO_USERS = [
  { email: "alice@orbit.local", name: "Alice Martin" },
  { email: "bob@orbit.local", name: "Bob Durand" },
];

const DEMO_ISSUES: ReadonlyArray<{ title: string; state: number; priority: Priority }> = [
  { title: "Mettre en place l'authentification", state: 3, priority: "HIGH" },
  { title: "Créer le design system", state: 3, priority: "MEDIUM" },
  { title: "Vue Kanban avec drag & drop", state: 2, priority: "URGENT" },
  { title: "Vue Liste groupée par état", state: 2, priority: "HIGH" },
  { title: "Filtres par priorité et assigné", state: 1, priority: "MEDIUM" },
  { title: "Palette de commandes Cmd+K", state: 1, priority: "LOW" },
  { title: "Notifications in-app", state: 0, priority: "NONE" },
  { title: "Import CSV", state: 4, priority: "LOW" },
];

async function main() {
  await db.workspace.deleteMany({ where: { slug: "demo" } });
  await db.user.deleteMany({ where: { email: { in: DEMO_USERS.map((u) => u.email) } } });

  const password = await hashPassword(DEMO_PASSWORD);
  const [alice, bob] = await Promise.all(
    DEMO_USERS.map((u) =>
      db.user.create({
        data: { ...u, emailVerified: true },
      }),
    ),
  );
  if (!alice || !bob) throw new Error("Seed incohérent");
  await db.account.createMany({
    data: [alice, bob].map((u) => ({
      userId: u.id,
      accountId: u.id,
      providerId: "credential",
      password,
    })),
  });

  const workspace = await db.workspace.create({
    data: {
      name: "Démo",
      slug: "demo",
      members: {
        create: [
          { userId: alice.id, role: "OWNER" },
          { userId: bob.id, role: "MEMBER" },
        ],
      },
    },
  });

  const project = await db.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Orbit",
      identifier: "ORB",
      description: "Le projet Orbit lui-même.",
      icon: "orbit",
      issueCounter: DEMO_ISSUES.length,
      members: {
        create: [
          { userId: alice.id, role: "ADMIN" },
          { userId: bob.id, role: "MEMBER" },
        ],
      },
      states: { create: DEFAULT_STATES.map((s, position) => ({ ...s, position })) },
      labels: {
        create: [
          { name: "bug", color: "#ef4444" },
          { name: "feature", color: "#4c8dff" },
          { name: "design", color: "#a855f7" },
        ],
      },
    },
    include: { states: { orderBy: { position: "asc" } }, labels: true },
  });

  for (const [i, issue] of DEMO_ISSUES.entries()) {
    const state = project.states[issue.state];
    const label = project.labels[i % project.labels.length];
    if (!state || !label) throw new Error("Seed incohérent");
    await db.issue.create({
      data: {
        projectId: project.id,
        sequenceId: i + 1,
        title: issue.title,
        stateId: state.id,
        priority: issue.priority,
        sortOrder: (i + 1) * 1000,
        createdById: alice.id,
        assignees: { create: [{ userId: i % 2 === 0 ? alice.id : bob.id }] },
        labels: { create: [{ labelId: label.id }] },
      },
    });
  }

  console.log(
    `Seed OK : workspace "${workspace.slug}", projet ${project.identifier}, ${DEMO_ISSUES.length} tâches.\n` +
      `Connexion : ${DEMO_USERS.map((u) => u.email).join(" / ")} — mot de passe « ${DEMO_PASSWORD} »`,
  );
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
