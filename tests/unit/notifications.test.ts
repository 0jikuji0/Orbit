import { describe, expect, it } from "vitest";
import { assignmentRecipients, commentNotifications, mentionRecipients } from "@/lib/notifications";
import type { RichNode } from "@/lib/rich-text";

const doc = (...ids: string[]): RichNode => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: ids.map((id) => ({ type: "mention", attrs: { id, label: id } })),
    },
  ],
});
const members = ["alice", "bob", "carol", "dave"];

describe("assignmentRecipients", () => {
  it("notifie les nouveaux assignés, jamais soi-même", () => {
    expect(assignmentRecipients(["bob"], ["bob", "carol", "alice"], "alice")).toEqual(["carol"]);
    expect(assignmentRecipients(["bob"], [], "alice")).toEqual([]);
  });
});

describe("mentionRecipients", () => {
  it("ne notifie que les nouvelles mentions", () => {
    expect(mentionRecipients(doc("bob"), doc("bob", "carol"), "alice", members)).toEqual(["carol"]);
  });
  it("ignore l'auteur et les non-membres du projet", () => {
    expect(mentionRecipients(null, doc("alice", "eve", "bob"), "alice", members)).toEqual(["bob"]);
  });
});

describe("commentNotifications", () => {
  it("mentionnés en MENTIONED, assignés et créateur en COMMENTED, sans doublon ni auteur", () => {
    expect(
      commentNotifications({
        actorId: "alice",
        body: doc("bob"),
        assigneeIds: ["bob", "carol", "alice"],
        creatorId: "dave",
        projectMemberIds: members,
      }),
    ).toEqual([
      { userId: "bob", type: "MENTIONED" },
      { userId: "carol", type: "COMMENTED" },
      { userId: "dave", type: "COMMENTED" },
    ]);
  });
  it("n'avertit pas un créateur qui n'est plus membre du projet", () => {
    expect(
      commentNotifications({
        actorId: "alice",
        body: doc(),
        assigneeIds: [],
        creatorId: "eve",
        projectMemberIds: members,
      }),
    ).toEqual([]);
  });
});
