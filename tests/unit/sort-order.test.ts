import { describe, expect, it } from "vitest";
import { SORT_ORDER_START, SORT_ORDER_STEP, sortOrderBetween } from "@/lib/issues/sort-order";

describe("sortOrderBetween", () => {
  it("colonne vide → position de départ", () => {
    expect(sortOrderBetween()).toBe(SORT_ORDER_START);
  });
  it("entre deux tâches → milieu", () => {
    expect(sortOrderBetween(1000, 2000)).toBe(1500);
  });
  it("en fin de colonne → après la dernière", () => {
    expect(sortOrderBetween(3000, null)).toBe(3000 + SORT_ORDER_STEP);
  });
  it("en tête de colonne → avant la première", () => {
    expect(sortOrderBetween(null, 3000)).toBe(3000 - SORT_ORDER_STEP);
  });
  it("reste strictement ordonné après de nombreuses insertions au même endroit", () => {
    let low = 1000;
    const high = 2000;
    for (let i = 0; i < 40; i++) {
      const mid = sortOrderBetween(low, high);
      expect(mid).toBeGreaterThan(low);
      expect(mid).toBeLessThan(high);
      low = mid;
    }
  });
});
