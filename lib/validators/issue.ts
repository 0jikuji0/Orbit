import { z } from "zod";
import { PRIORITIES } from "@/lib/issues/priority";

/** Date sans heure : accepte un `Date` ou « AAAA-MM-JJ », stockée à minuit UTC. */
const dateOnly = z
  .union([z.date(), z.iso.date()])
  .transform((d) => {
    const iso = typeof d === "string" ? d : d.toISOString().slice(0, 10);
    return new Date(`${iso}T00:00:00.000Z`);
  })
  .nullable();

const ids = z.array(z.string().min(1)).max(50);

export const issueTitleSchema = z
  .string()
  .trim()
  .min(1, "Titre requis")
  .max(255, "255 caractères maximum");

const projectRef = { workspaceSlug: z.string(), projectId: z.string() };

function datesInOrder(v: { startDate?: Date | null; dueDate?: Date | null }) {
  return !v.startDate || !v.dueDate || v.startDate <= v.dueDate;
}
const DATE_ORDER_ERROR = {
  message: "L'échéance doit être après la date de début",
  path: ["dueDate"],
};

export const createIssueSchema = z
  .object({
    ...projectRef,
    title: issueTitleSchema,
    stateId: z.string().optional(),
    priority: z.enum(PRIORITIES).default("NONE"),
    assigneeIds: ids.default([]),
    labelIds: ids.default([]),
    startDate: dateOnly.optional(),
    dueDate: dateOnly.optional(),
  })
  .refine(datesInOrder, DATE_ORDER_ERROR);

export const issuePatchSchema = z
  .object({
    title: issueTitleSchema,
    stateId: z.string(),
    priority: z.enum(PRIORITIES),
    assigneeIds: ids,
    labelIds: ids,
    startDate: dateOnly,
    dueDate: dateOnly,
    sortOrder: z.number().finite(),
  })
  .partial();

export const updateIssueSchema = z.object({
  ...projectRef,
  issueId: z.string(),
  patch: issuePatchSchema,
});

export const issueRefSchema = z.object({ ...projectRef, issueId: z.string() });
export const projectIssuesSchema = z.object(projectRef);

export type CreateIssueInput = z.input<typeof createIssueSchema>;
export type IssuePatchInput = z.input<typeof issuePatchSchema>;
