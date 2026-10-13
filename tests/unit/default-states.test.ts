import { describe, expect, it } from "vitest";
import { DEFAULT_STATES } from "@/lib/default-states";

describe("DEFAULT_STATES", () => {
  it("contient les 5 états par défaut, un par groupe", () => {
    expect(DEFAULT_STATES.map((s) => s.name)).toEqual([
      "Backlog",
      "À faire",
      "En cours",
      "Terminé",
      "Annulé",
    ]);
    expect(new Set(DEFAULT_STATES.map((s) => s.group)).size).toBe(5);
  });
});
