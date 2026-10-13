import type { Priority, StateGroup } from "@prisma/client";

/** Données factices de la phase 0 — remplacées par la BDD en phase 1/2. */
export type MockUser = { id: string; name: string };
export type MockState = { id: string; name: string; color: string; group: StateGroup };
export type MockIssue = {
  id: string;
  sequenceId: number;
  title: string;
  stateId: string;
  priority: Priority;
  assigneeIds: string[];
  labels: { name: string; color: string }[];
  dueDate?: string;
};

export const mockWorkspaces = [
  { slug: "demo", name: "Démo" },
  { slug: "perso", name: "Perso" },
];

export const mockProjects = [
  { id: "orb", identifier: "ORB", name: "Orbit" },
  { id: "web", identifier: "WEB", name: "Site web" },
];

export const mockUsers: MockUser[] = [
  { id: "u1", name: "Alice Martin" },
  { id: "u2", name: "Bob Durand" },
];

export const mockStates: MockState[] = [
  { id: "s0", name: "Backlog", color: "#71717a", group: "BACKLOG" },
  { id: "s1", name: "À faire", color: "#a1a1aa", group: "UNSTARTED" },
  { id: "s2", name: "En cours", color: "#f59e0b", group: "STARTED" },
  { id: "s3", name: "Terminé", color: "#22c55e", group: "COMPLETED" },
  { id: "s4", name: "Annulé", color: "#ef4444", group: "CANCELLED" },
];

const bug = { name: "bug", color: "#ef4444" };
const feature = { name: "feature", color: "#4c8dff" };
const design = { name: "design", color: "#a855f7" };

export const mockIssues: MockIssue[] = [
  {
    id: "i1",
    sequenceId: 1,
    title: "Mettre en place l'authentification",
    stateId: "s3",
    priority: "HIGH",
    assigneeIds: ["u1"],
    labels: [feature],
  },
  {
    id: "i2",
    sequenceId: 2,
    title: "Créer le design system",
    stateId: "s3",
    priority: "MEDIUM",
    assigneeIds: ["u2"],
    labels: [design],
  },
  {
    id: "i3",
    sequenceId: 3,
    title: "Vue Kanban avec drag & drop",
    stateId: "s2",
    priority: "URGENT",
    assigneeIds: ["u1", "u2"],
    labels: [feature],
    dueDate: "2026-10-20",
  },
  {
    id: "i4",
    sequenceId: 4,
    title: "Vue Liste groupée par état",
    stateId: "s2",
    priority: "HIGH",
    assigneeIds: ["u2"],
    labels: [feature],
  },
  {
    id: "i5",
    sequenceId: 5,
    title: "Filtres par priorité et assigné",
    stateId: "s1",
    priority: "MEDIUM",
    assigneeIds: [],
    labels: [feature],
    dueDate: "2026-10-28",
  },
  {
    id: "i6",
    sequenceId: 6,
    title: "Corriger le scroll du panneau latéral",
    stateId: "s1",
    priority: "LOW",
    assigneeIds: ["u1"],
    labels: [bug],
  },
  {
    id: "i7",
    sequenceId: 7,
    title: "Notifications in-app",
    stateId: "s0",
    priority: "NONE",
    assigneeIds: [],
    labels: [],
  },
  {
    id: "i8",
    sequenceId: 8,
    title: "Import CSV",
    stateId: "s4",
    priority: "LOW",
    assigneeIds: [],
    labels: [design],
  },
];
