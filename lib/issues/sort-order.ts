export const SORT_ORDER_START = 65535;
export const SORT_ORDER_STEP = 1000;

/**
 * Position d'une tâche insérée entre `before` (au-dessus) et `after` (en dessous).
 * Les positions sont des flottants : on prend le milieu, sans renuméroter les voisines.
 */
export function sortOrderBetween(before?: number | null, after?: number | null): number {
  const hasBefore = before !== undefined && before !== null;
  const hasAfter = after !== undefined && after !== null;
  if (hasBefore && hasAfter) return (before + after) / 2;
  if (hasBefore) return before + SORT_ORDER_STEP;
  if (hasAfter) return after - SORT_ORDER_STEP;
  return SORT_ORDER_START;
}
