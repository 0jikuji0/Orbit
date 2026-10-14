import { describe, expect, it } from "vitest";
import { wouldCreateCycle } from "@/lib/issues/hierarchy";
import { docText, isDocEmpty, mentionedUserIds, richDocSchema } from "@/lib/rich-text";

const doc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Titre" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Bonjour " },
        { type: "mention", attrs: { id: "u1", label: "Alice" } },
        { type: "text", text: " et " },
        { type: "mention", attrs: { id: "u2", label: "Bob" } },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [{ type: "paragraph", content: [{ type: "text", text: "fait" }] }],
        },
      ],
    },
    { type: "paragraph", content: [{ type: "mention", attrs: { id: "u1", label: "Alice" } }] },
  ],
};

describe("richDocSchema", () => {
  it("accepte un document Tiptap", () => {
    expect(richDocSchema.safeParse(doc).success).toBe(true);
  });
  it("refuse ce qui n'est pas un document", () => {
    expect(richDocSchema.safeParse({ type: "paragraph" }).success).toBe(false);
    expect(richDocSchema.safeParse("texte").success).toBe(false);
  });
  it("refuse un document trop volumineux", () => {
    const big = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(250_000) }] }],
    };
    expect(richDocSchema.safeParse(big).success).toBe(false);
  });
});

describe("docText / isDocEmpty / mentionedUserIds", () => {
  it("extrait le texte brut, mentions comprises", () => {
    expect(docText(doc)).toContain("Titre\n");
    expect(docText(doc)).toContain("Bonjour @Alice et @Bob\n");
    expect(docText(doc)).toContain("fait");
  });
  it("détecte un document vide", () => {
    expect(isDocEmpty({ type: "doc", content: [{ type: "paragraph" }] })).toBe(true);
    expect(isDocEmpty(null)).toBe(true);
    expect(isDocEmpty(doc)).toBe(false);
  });
  it("liste les mentions sans doublon", () => {
    expect(mentionedUserIds(doc)).toEqual(["u1", "u2"]);
  });
});

describe("wouldCreateCycle", () => {
  // a ← b ← c  (c a pour parent b, b a pour parent a)
  const parentOf = new Map<string, string | null>([
    ["a", null],
    ["b", "a"],
    ["c", "b"],
    ["d", null],
  ]);
  it("autorise un rattachement sans boucle", () => {
    expect(wouldCreateCycle("d", "c", parentOf)).toBe(false);
    expect(wouldCreateCycle("c", "a", parentOf)).toBe(false);
  });
  it("refuse de rattacher une tâche à elle-même ou à un descendant", () => {
    expect(wouldCreateCycle("a", "a", parentOf)).toBe(true);
    expect(wouldCreateCycle("a", "c", parentOf)).toBe(true);
    expect(wouldCreateCycle("b", "c", parentOf)).toBe(true);
  });
});
