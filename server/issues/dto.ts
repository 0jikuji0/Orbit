import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { IssueDTO } from "@/lib/issues/types";

export const issueDTOInclude = {
  assignees: { select: { userId: true } },
  labels: { select: { labelId: true } },
} satisfies Prisma.IssueInclude;

type IssueWithRelations = Prisma.IssueGetPayload<{ include: typeof issueDTOInclude }>;

export function toIssueDTO(issue: IssueWithRelations): IssueDTO {
  return {
    id: issue.id,
    sequenceId: issue.sequenceId,
    title: issue.title,
    stateId: issue.stateId,
    priority: issue.priority,
    sortOrder: issue.sortOrder,
    startDate: issue.startDate,
    dueDate: issue.dueDate,
    assigneeIds: issue.assignees.map((a) => a.userId),
    labelIds: issue.labels.map((l) => l.labelId),
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}

/** À n'appeler qu'après `requireProject`. */
export async function loadIssueDTOs(projectId: string) {
  const issues = await db.issue.findMany({
    where: { projectId, archivedAt: null },
    orderBy: { sortOrder: "asc" },
    include: issueDTOInclude,
  });
  return issues.map(toIssueDTO);
}

/** États, labels et membres d'un projet. À n'appeler qu'après `requireProject`. */
export async function loadProjectMeta(project: { id: string; identifier: string; name: string }) {
  const [states, labels, members] = await Promise.all([
    db.state.findMany({
      where: { projectId: project.id },
      orderBy: { position: "asc" },
      select: { id: true, name: true, color: true, position: true, group: true },
    }),
    db.label.findMany({
      where: { projectId: project.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    db.projectMember.findMany({
      where: { projectId: project.id },
      select: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);
  return {
    id: project.id,
    identifier: project.identifier,
    name: project.name,
    states,
    labels,
    members: members.map((m) => m.user),
  };
}
