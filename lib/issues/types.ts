import type { Priority, StateGroup } from "@prisma/client";

/** Tâche telle que manipulée côté client (listes, kanban, cache TanStack Query). */
export type IssueDTO = {
  id: string;
  sequenceId: number;
  title: string;
  stateId: string;
  priority: Priority;
  sortOrder: number;
  startDate: Date | null;
  dueDate: Date | null;
  assigneeIds: string[];
  labelIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type StateDTO = {
  id: string;
  name: string;
  color: string;
  position: number;
  group: StateGroup;
};
export type LabelDTO = { id: string; name: string; color: string };
export type MemberDTO = { id: string; name: string; avatarUrl: string | null };

export type ProjectMeta = {
  id: string;
  identifier: string;
  name: string;
  states: StateDTO[];
  labels: LabelDTO[];
  members: MemberDTO[];
};
