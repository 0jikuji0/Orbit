import { describe, expect, it } from "vitest";
import { projectIdentifierSchema, suggestIdentifier } from "@/lib/validators/project";

describe("suggestIdentifier", () => {
  it.each([
    ["Orbit", "ORB"],
    ["Site web", "SW"],
    ["Application mobile iOS", "AMI"],
    ["Équipe", "EQU"],
    ["A", "AX"],
    ["", ""],
  ])("%s → %s", (name, expected) => {
    expect(suggestIdentifier(name)).toBe(expected);
  });

  it("produit toujours un identifiant valide pour un nom non vide", () => {
    for (const name of ["x", "2026 roadmap", "Un très long nom de projet ici", "été"]) {
      expect(projectIdentifierSchema.safeParse(suggestIdentifier(name)).success).toBe(true);
    }
  });
});

describe("projectIdentifierSchema", () => {
  it("met en majuscules", () => {
    expect(projectIdentifierSchema.parse("orb")).toBe("ORB");
  });

  it.each(["O", "ORBITX", "1AB", "OR-B", "OR B"])("refuse %s", (id) => {
    expect(projectIdentifierSchema.safeParse(id).success).toBe(false);
  });
});
