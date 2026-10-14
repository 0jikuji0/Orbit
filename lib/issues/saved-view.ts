import type { ViewLayout } from "@prisma/client";
import { z } from "zod";
import { PRIORITIES } from "./priority";
import { EMPTY_FILTERS, GROUP_BYS, serializeViewParams, type Layout, type ViewState } from "./view";

const LAYOUT_TO_DB: Record<Layout, ViewLayout> = {
  list: "LIST",
  kanban: "KANBAN",
  calendar: "CALENDAR",
  table: "TABLE",
};
const DB_TO_LAYOUT = Object.fromEntries(
  Object.entries(LAYOUT_TO_DB).map(([k, v]) => [v, k]),
) as Record<ViewLayout, Layout>;

const ids = z.array(z.string()).max(100).catch([]);

/** Contenu de `SavedView.filtersJson` ; tolérant : une valeur invalide est ignorée. */
export const savedFiltersSchema = z.object({
  groupBy: z.enum(GROUP_BYS).catch("state"),
  filters: z
    .object({
      state: ids,
      priority: z.array(z.enum(PRIORITIES)).catch([]),
      assignee: ids,
      label: ids,
      cycle: ids,
      module: ids,
    })
    .partial()
    .catch({}),
});

export type SavedFilters = z.infer<typeof savedFiltersSchema>;

export function toSavedView(view: Pick<ViewState, "layout" | "groupBy" | "filters">) {
  return {
    layout: LAYOUT_TO_DB[view.layout],
    filtersJson: { groupBy: view.groupBy, filters: view.filters } satisfies SavedFilters,
  };
}

export function fromSavedView(layout: ViewLayout, json: unknown): ViewState {
  const parsed = savedFiltersSchema.safeParse(json);
  const data = parsed.success ? parsed.data : { groupBy: "state" as const, filters: {} };
  return {
    layout: DB_TO_LAYOUT[layout] ?? "list",
    groupBy: data.groupBy,
    filters: { ...EMPTY_FILTERS, ...data.filters },
    peek: null,
  };
}

/** Lien vers la liste des tâches avec la vue appliquée. */
export function savedViewHref(base: string, layout: ViewLayout, json: unknown) {
  const query = serializeViewParams(fromSavedView(layout, json)).toString();
  return query ? `${base}?${query}` : base;
}
