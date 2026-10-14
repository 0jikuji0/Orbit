import { describe, expect, it } from "vitest";
import { goToTarget } from "@/lib/shortcuts";

describe("goToTarget", () => {
  const ws = "/demo";
  const project = "/demo/projects/p1";
  it.each([
    ["p", project, "/demo/projects"],
    ["S", null, "/demo/settings"],
    ["i", project, "/demo/projects/p1/issues"],
    ["c", project, "/demo/projects/p1/cycles"],
    ["m", project, "/demo/projects/p1/modules"],
    ["v", project, "/demo/projects/p1/views"],
  ])("G %s → %s", (key, base, expected) => {
    expect(goToTarget(key, ws, base)).toBe(expected);
  });
  it("les raccourcis de projet ne font rien hors d'un projet", () => {
    expect(goToTarget("i", ws, null)).toBeNull();
    expect(goToTarget("x", ws, project)).toBeNull();
  });
});
