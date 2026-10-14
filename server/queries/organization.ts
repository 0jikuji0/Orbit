import "server-only";
import type { StateGroup } from "@prisma/client";
import { db } from "@/lib/db";
import { progress } from "@/lib/issues/cycles";
import { requireProject } from "@/lib/permissions";
import { hasProjectRole } from "@/lib/roles";

async function stateGroups(projectId: string) {
  const states = await db.state.findMany({
    where: { projectId },
    select: { id: true, group: true },
  });
  return new Map<string, StateGroup>(states.map((s) => [s.id, s.group]));
}

const activeIssues = { where: { archivedAt: null }, select: { stateId: true } } as const;

export async function listCycles(workspaceSlug: string, projectId: string) {
  const { project, role } = await requireProject(workspaceSlug, projectId);
  const [groups, cycles] = await Promise.all([
    stateGroups(project.id),
    db.cycle.findMany({
      where: { projectId: project.id },
      orderBy: { startDate: "desc" },
      include: { issues: activeIssues },
    }),
  ]);
  return {
    project,
    canEdit: hasProjectRole(role, "MEMBER"),
    canDelete: role === "ADMIN",
    cycles: cycles.map(({ issues, ...c }) => ({ ...c, progress: progress(issues, groups) })),
  };
}

export async function listModules(workspaceSlug: string, projectId: string) {
  const { project, role } = await requireProject(workspaceSlug, projectId);
  const [groups, modules, members] = await Promise.all([
    stateGroups(project.id),
    db.module.findMany({
      where: { projectId: project.id },
      orderBy: { name: "asc" },
      include: {
        issues: activeIssues,
        lead: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    db.projectMember.findMany({
      where: { projectId: project.id },
      select: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);
  return {
    project,
    canEdit: hasProjectRole(role, "MEMBER"),
    canDelete: role === "ADMIN",
    members: members.map((m) => m.user),
    modules: modules.map(({ issues, ...m }) => ({ ...m, progress: progress(issues, groups) })),
  };
}
