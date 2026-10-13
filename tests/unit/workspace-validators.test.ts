import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";
import { workspaceSlugSchema } from "@/lib/validators/workspace";

describe("slugify", () => {
  it.each([
    ["Équipe Produit !", "equipe-produit"],
    ["  Mon   Espace  ", "mon-espace"],
    ["ACME_2026", "acme-2026"],
    ["---", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("tronque sans laisser de tiret final", () => {
    expect(slugify("a".repeat(47) + " b")).toBe("a".repeat(47));
  });
});

describe("workspaceSlugSchema", () => {
  it("accepte un slug valide", () => {
    expect(workspaceSlugSchema.safeParse("mon-equipe").success).toBe(true);
  });

  it.each(["a", "Mon-Equipe", "mon--equipe", "-mon", "mon equipe", "login", "api"])(
    "refuse %s",
    (slug) => {
      expect(workspaceSlugSchema.safeParse(slug).success).toBe(false);
    },
  );
});
