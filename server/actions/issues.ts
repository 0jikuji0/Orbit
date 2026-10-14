"use server";

import { Prisma, type Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { runAction, UserError } from "@/lib/action";
import { db } from "@/lib/db";
import { wouldCreateCycle } from "@/lib/issues/hierarchy";
import { nextSequenceId } from "@/lib/issues/numbering";
import { sortOrderBetween } from "@/lib/issues/sort-order";
import { requireProject } from "@/lib/permissions";
import {
  createIssueSchema,
  issueRefSchema,
  projectIssuesSchema,
  updateIssueSchema,
} from "@/lib/validators/issue";
import { issueDTOInclude, loadIssueDTOs, toIssueDTO } from "@/server/issues/dto";

// ─── Vérifications d'appartenance au projet (anti-IDOR) ─────────────────

async function projectRefs(projectId: string) {
  const [states, labels, members, cycles, modules] = await Promise.all([
    db.state.findMany({ where: { projectId }, orderBy: { position: "asc" } }),
    db.label.findMany({ where: { projectId } }),
    db.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true } } },
    }),
    db.cycle.findMany({ where: { projectId }, select: { id: true, name: true } }),
    db.module.findMany({ where: { projectId }, select: { id: true, name: true } }),
  ]);
  return { states, labels, members: members.map((m) => m.user), cycles, modules };
}

type Refs = Awaited<ReturnType<typeof projectRefs>>;

function assertRefs(
  refs: Refs,
  data: {
    stateId?: string;
    labelIds?: string[];
    assigneeIds?: string[];
    cycleId?: string | null;
    moduleId?: string | null;
  },
) {
  if (data.cycleId && !refs.cycles.some((c) => c.id === data.cycleId)) {
    throw new UserError("Cycle inconnu dans ce projet");
  }
  if (data.moduleId && !refs.modules.some((m) => m.id === data.moduleId)) {
    throw new UserError("Module inconnu dans ce projet");
  }
  if (data.stateId && !refs.states.some((s) => s.id === data.stateId)) {
    throw new UserError("État inconnu dans ce projet");
  }
  if (data.labelIds?.some((id) => !refs.labels.some((l) => l.id === id))) {
    throw new UserError("Label inconnu dans ce projet");
  }
  if (data.assigneeIds?.some((id) => !refs.members.some((m) => m.id === id))) {
    throw new UserError("Seuls les membres du projet peuvent être assignés");
  }
}

/** Le parent doit être une tâche active du même projet, sans créer de boucle. */
async function assertParent(projectId: string, parentId: string, issueId?: string) {
  const issues = await db.issue.findMany({
    where: { projectId, archivedAt: null },
    select: { id: true, parentId: true, sequenceId: true },
  });
  const parent = issues.find((i) => i.id === parentId);
  if (!parent) throw new UserError("Tâche parente introuvable dans ce projet");
  if (
    issueId &&
    wouldCreateCycle(issueId, parentId, new Map(issues.map((i) => [i.id, i.parentId])))
  ) {
    throw new UserError("Une tâche ne peut pas être sa propre sous-tâche");
  }
  return parent;
}

/** Entrées d'historique regroupées : modifications successives du même champ par la même personne. */
const COALESCE_MS = 10 * 60 * 1000;
const COALESCED_FIELDS = new Set(["description"]);

// ─── Historique ──────────────────────────────────────────────────────────

const dateText = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const namesText = (ids: string[], items: { id: string; name: string }[]) =>
  ids.length
    ? ids
        .map((id) => items.find((i) => i.id === id)?.name ?? "?")
        .sort((a, b) => a.localeCompare(b, "fr"))
        .join(", ")
    : null;
const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/** Les pages serveur du projet (cycles, modules, page complète…) affichent des compteurs à jour. */
function revalidateProject(workspaceSlug: string, projectId: string) {
  revalidatePath(`/${workspaceSlug}/projects/${projectId}`, "layout");
}

// ─── Actions ─────────────────────────────────────────────────────────────

export async function fetchIssues(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId } = projectIssuesSchema.parse(input);
    const { project } = await requireProject(workspaceSlug, projectId);
    return loadIssueDTOs(project.id);
  });
}

export async function createIssue(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, ...data } = createIssueSchema.parse(input);
    const { user, project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    const refs = await projectRefs(project.id);
    assertRefs(refs, data);

    if (data.parentId) await assertParent(project.id, data.parentId);

    const defaultState = refs.states.find((s) => s.group === "UNSTARTED") ?? refs.states[0];
    const stateId = data.stateId ?? defaultState?.id;
    if (!stateId) throw new UserError("Le projet n'a aucun état");

    const issue = await db.$transaction(async (tx) => {
      const sequenceId = await nextSequenceId(tx, project.id);
      const last = await tx.issue.findFirst({
        where: { projectId: project.id, stateId, archivedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      return tx.issue.create({
        data: {
          projectId: project.id,
          sequenceId,
          title: data.title,
          stateId,
          priority: data.priority,
          startDate: data.startDate ?? null,
          dueDate: data.dueDate ?? null,
          parentId: data.parentId ?? null,
          cycleId: data.cycleId ?? null,
          moduleId: data.moduleId ?? null,
          sortOrder: sortOrderBetween(last?.sortOrder, null),
          createdById: user.id,
          assignees: { create: data.assigneeIds.map((userId) => ({ userId })) },
          labels: { create: data.labelIds.map((labelId) => ({ labelId })) },
          activities: { create: { actorId: user.id, field: "created" } },
        },
        include: issueDTOInclude,
      });
    });
    revalidateProject(workspaceSlug, projectId);
    return toIssueDTO(issue);
  });
}

export async function updateIssue(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, issueId, patch } = updateIssueSchema.parse(input);
    const { user, project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    const current = await db.issue.findFirst({
      where: { id: issueId, projectId: project.id, archivedAt: null },
      include: issueDTOInclude,
    });
    if (!current) throw new UserError("Tâche introuvable");
    const refs = await projectRefs(project.id);
    assertRefs(refs, patch);

    const startDate = patch.startDate !== undefined ? patch.startDate : current.startDate;
    const dueDate = patch.dueDate !== undefined ? patch.dueDate : current.dueDate;
    if (startDate && dueDate && startDate > dueDate) {
      throw new UserError("L'échéance doit être après la date de début");
    }

    const before = toIssueDTO(current);
    const activities: Prisma.ActivityCreateManyInput[] = [];
    const log = (field: string, oldValue: string | null, newValue: string | null) =>
      activities.push({ issueId, actorId: user.id, field, oldValue, newValue });
    const stateName = (id: string) => refs.states.find((s) => s.id === id)?.name ?? null;

    const data: Prisma.IssueUncheckedUpdateInput = {};
    if (patch.title !== undefined && patch.title !== before.title) {
      data.title = patch.title;
      log("title", before.title, patch.title);
    }
    if (patch.stateId !== undefined && patch.stateId !== before.stateId) {
      data.stateId = patch.stateId;
      log("state", stateName(before.stateId), stateName(patch.stateId));
    }
    if (patch.priority !== undefined && patch.priority !== before.priority) {
      data.priority = patch.priority as Priority;
      log("priority", before.priority, patch.priority);
    }
    if (patch.startDate !== undefined && dateText(patch.startDate) !== dateText(before.startDate)) {
      data.startDate = patch.startDate;
      log("startDate", dateText(before.startDate), dateText(patch.startDate));
    }
    if (patch.dueDate !== undefined && dateText(patch.dueDate) !== dateText(before.dueDate)) {
      data.dueDate = patch.dueDate;
      log("dueDate", dateText(before.dueDate), dateText(patch.dueDate));
    }
    if (patch.descriptionJson !== undefined) {
      data.descriptionJson = patch.descriptionJson
        ? (patch.descriptionJson as Prisma.InputJsonValue)
        : Prisma.DbNull;
      log("description", null, null);
    }
    if (patch.parentId !== undefined && patch.parentId !== current.parentId) {
      const key = (seq: number) => `${project.identifier}-${seq}`;
      const oldParent = current.parentId
        ? await db.issue.findUnique({
            where: { id: current.parentId },
            select: { sequenceId: true },
          })
        : null;
      const newParent = patch.parentId
        ? await assertParent(project.id, patch.parentId, issueId)
        : null;
      data.parentId = patch.parentId;
      log(
        "parent",
        oldParent ? key(oldParent.sequenceId) : null,
        newParent ? key(newParent.sequenceId) : null,
      );
    }
    const nameOf = (items: { id: string; name: string }[], id: string | null) =>
      (id && items.find((i) => i.id === id)?.name) || null;
    if (patch.cycleId !== undefined && patch.cycleId !== current.cycleId) {
      data.cycleId = patch.cycleId;
      log("cycle", nameOf(refs.cycles, current.cycleId), nameOf(refs.cycles, patch.cycleId));
    }
    if (patch.moduleId !== undefined && patch.moduleId !== current.moduleId) {
      data.moduleId = patch.moduleId;
      log("module", nameOf(refs.modules, current.moduleId), nameOf(refs.modules, patch.moduleId));
    }
    // La position n'est pas un champ métier : pas d'entrée d'historique.
    if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder;

    const assigneesChanged =
      patch.assigneeIds !== undefined && !sameSet(patch.assigneeIds, before.assigneeIds);
    const labelsChanged = patch.labelIds !== undefined && !sameSet(patch.labelIds, before.labelIds);
    if (assigneesChanged) {
      log(
        "assignees",
        namesText(before.assigneeIds, refs.members),
        namesText(patch.assigneeIds!, refs.members),
      );
    }
    if (labelsChanged) {
      log(
        "labels",
        namesText(before.labelIds, refs.labels),
        namesText(patch.labelIds!, refs.labels),
      );
    }

    const updated = await db.$transaction(async (tx) => {
      if (assigneesChanged) {
        await tx.issueAssignee.deleteMany({ where: { issueId } });
        await tx.issueAssignee.createMany({
          data: patch.assigneeIds!.map((userId) => ({ issueId, userId })),
        });
      }
      if (labelsChanged) {
        await tx.issueLabel.deleteMany({ where: { issueId } });
        await tx.issueLabel.createMany({
          data: patch.labelIds!.map((labelId) => ({ issueId, labelId })),
        });
      }
      for (const activity of activities) {
        if (COALESCED_FIELDS.has(activity.field)) {
          const recent = await tx.activity.findFirst({
            where: {
              issueId,
              actorId: user.id,
              field: activity.field,
              createdAt: { gt: new Date(Date.now() - COALESCE_MS) },
            },
            orderBy: { createdAt: "desc" },
          });
          if (recent) {
            await tx.activity.update({ where: { id: recent.id }, data: { createdAt: new Date() } });
            continue;
          }
        }
        await tx.activity.create({ data: activity });
      }
      return tx.issue.update({
        where: { id: issueId },
        // Toucher updatedAt même si seules les relations ont changé.
        data: { ...data, updatedAt: new Date() },
        include: issueDTOInclude,
      });
    });
    revalidateProject(workspaceSlug, projectId);
    return toIssueDTO(updated);
  });
}

/** Suppression douce. */
export async function archiveIssue(input: unknown) {
  return runAction(async () => {
    const { workspaceSlug, projectId, issueId } = issueRefSchema.parse(input);
    const { user, project } = await requireProject(workspaceSlug, projectId, "MEMBER");
    const { count } = await db.issue.updateMany({
      where: { id: issueId, projectId: project.id, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    if (!count) throw new UserError("Tâche introuvable");
    await db.activity.create({ data: { issueId, actorId: user.id, field: "archived" } });
    revalidateProject(workspaceSlug, projectId);
  });
}
