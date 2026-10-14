import { z } from "zod";

/** Document Tiptap (JSON ProseMirror). */
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

const MAX_DOC_BYTES = 200_000;

const nodeSchema: z.ZodType<RichNode> = z.lazy(() =>
  z.looseObject({
    type: z.string(),
    text: z.string().optional(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(nodeSchema).optional(),
    marks: z
      .array(
        z.looseObject({ type: z.string(), attrs: z.record(z.string(), z.unknown()).optional() }),
      )
      .optional(),
  }),
);

export const richDocSchema = nodeSchema.refine(
  (doc) => doc.type === "doc" && JSON.stringify(doc).length <= MAX_DOC_BYTES,
  "Document invalide ou trop volumineux",
);

/** Texte brut d'un document (recherche, aperçus, détection de document vide). */
export function docText(node: RichNode | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "mention") return `@${String(node.attrs?.label ?? "")}`;
  const inner = (node.content ?? []).map(docText);
  const block = ["paragraph", "heading", "codeBlock", "listItem", "taskItem", "blockquote"];
  return block.includes(node.type) ? `${inner.join("")}\n` : inner.join("");
}

export function isDocEmpty(node: RichNode | null | undefined): boolean {
  return docText(node).trim() === "";
}

/** Identifiants des utilisateurs mentionnés (`@nom`). */
export function mentionedUserIds(node: RichNode | null | undefined): string[] {
  if (!node) return [];
  const own = node.type === "mention" && typeof node.attrs?.id === "string" ? [node.attrs.id] : [];
  return [...new Set([...own, ...(node.content ?? []).flatMap(mentionedUserIds)])];
}
