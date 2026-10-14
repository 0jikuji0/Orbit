import { describe, expect, it } from "vitest";
import { fromSavedView, savedViewHref, toSavedView } from "@/lib/issues/saved-view";
import { EMPTY_FILTERS } from "@/lib/issues/view";

describe("vues sauvegardées", () => {
  const view = {
    layout: "kanban" as const,
    groupBy: "priority" as const,
    filters: { ...EMPTY_FILTERS, priority: ["HIGH" as const], assignee: ["u1"] },
  };

  it("aller-retour vers la base", () => {
    const saved = toSavedView(view);
    expect(saved.layout).toBe("KANBAN");
    expect(fromSavedView(saved.layout, saved.filtersJson)).toEqual({ ...view, peek: null });
  });

  it("ignore les données invalides sans planter", () => {
    const v = fromSavedView("TABLE", {
      groupBy: "nope",
      filters: { priority: ["???"], state: "x" },
    });
    expect(v).toEqual({ layout: "table", groupBy: "state", filters: EMPTY_FILTERS, peek: null });
    expect(fromSavedView("LIST", null).filters).toEqual(EMPTY_FILTERS);
  });

  it("construit le lien vers la liste filtrée", () => {
    const saved = toSavedView(view);
    expect(savedViewHref("/demo/projects/p/issues", saved.layout, saved.filtersJson)).toBe(
      "/demo/projects/p/issues?layout=kanban&group=priority&priority=HIGH&assignee=u1",
    );
  });
});
