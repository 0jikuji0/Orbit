import { describe, expect, it } from "vitest";
import { dayKey, monthGrid } from "@/lib/issues/calendar";

describe("monthGrid", () => {
  it("octobre 2026 : commence le lundi 28 septembre, 5 semaines", () => {
    const days = monthGrid(2026, 9);
    expect(days).toHaveLength(35);
    expect(dayKey(days[0]!)).toBe("2026-09-28");
    expect(dayKey(days[34]!)).toBe("2026-11-01");
  });

  it("février 2027 (commence un lundi) : 4 semaines pile", () => {
    const days = monthGrid(2027, 1);
    expect(days).toHaveLength(28);
    expect(dayKey(days[0]!)).toBe("2027-02-01");
  });

  it("chaque ligne commence un lundi", () => {
    const days = monthGrid(2026, 4);
    for (let i = 0; i < days.length; i += 7) expect(days[i]!.getUTCDay()).toBe(1);
  });
});
