import { z } from "zod";
import { isDocEmpty, richDocSchema } from "@/lib/rich-text";

const body = richDocSchema.refine((doc) => !isDocEmpty(doc), "Le commentaire est vide");
const issueRef = { workspaceSlug: z.string(), projectId: z.string(), issueId: z.string() };

export const createCommentSchema = z.object({ ...issueRef, bodyJson: body });
export const updateCommentSchema = z.object({ ...issueRef, commentId: z.string(), bodyJson: body });
export const deleteCommentSchema = z.object({ ...issueRef, commentId: z.string() });
