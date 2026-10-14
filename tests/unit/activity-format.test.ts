import { describe, expect, it } from "vitest";
import { describeActivity, timeAgo } from "@/lib/issues/activity-format";

describe("describeActivity", () => {
  it.each([
    ["created", null, null, "a créé la tâche"],
    ["title", "Ancien", "Nouveau", "a renommé la tâche en « Nouveau »"],
    ["state", "À faire", "En cours", "a changé l'état : À faire → En cours"],
    ["priority", "NONE", "HIGH", "a changé la priorité : Aucune → Haute"],
    ["assignees", null, "Alice", "a défini les assignés : Alice"],
    ["labels", "bug", null, "a retiré les labels (bug)"],
    ["dueDate", null, "2026-10-20", "a défini l'échéance : 20 octobre 2026"],
    ["description", null, null, "a modifié la description"],
    ["parent", null, "ORB-3", "a rattaché la tâche à ORB-3"],
    ["parent", "ORB-3", null, "a détaché la tâche de ORB-3"],
    ["attachment", null, "plan.pdf", "a ajouté la pièce jointe plan.pdf"],
    ["attachment", "plan.pdf", null, "a supprimé la pièce jointe plan.pdf"],
  ])("%s %s → %s", (field, oldValue, newValue, expected) => {
    expect(describeActivity(field, oldValue, newValue)).toBe(expected);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  it.each([
    [new Date("2026-10-14T11:59:50Z"), "à l'instant"],
    [new Date("2026-10-14T11:55:00Z"), "il y a 5 minutes"],
    [new Date("2026-10-14T09:00:00Z"), "il y a 3 heures"],
    [new Date("2026-10-13T12:00:00Z"), "hier"],
  ])("%s → %s", (when, expected) => {
    expect(timeAgo(when, now)).toBe(expected);
  });
});
