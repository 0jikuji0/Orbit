import type { StateGroup } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { cycleStatus, daysLeft, progress } from "@/lib/issues/cycles";
import { cycleFields } from "@/lib/validators/organization";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const today = new Date(2026, 9, 14, 15, 30); // 14 oct. 2026, heure locale

describe("cycleStatus", () => {
  it("à venir / en cours / terminé, jour de fin inclus", () => {
    expect(cycleStatus(d("2026-10-20"), d("2026-11-02"), today)).toBe("upcoming");
    expect(cycleStatus(d("2026-10-01"), d("2026-10-14"), today)).toBe("current");
    expect(cycleStatus(d("2026-10-14"), d("2026-10-28"), today)).toBe("current");
    expect(cycleStatus(d("2026-09-01"), d("2026-10-13"), today)).toBe("completed");
  });
});

describe("daysLeft", () => {
  it("compte les jours jusqu'à la fin", () => {
    expect(daysLeft(d("2026-10-14"), today)).toBe(0);
    expect(daysLeft(d("2026-10-20"), today)).toBe(6);
    expect(daysLeft(d("2026-10-10"), today)).toBe(-4);
  });
});

describe("progress", () => {
  const groups = new Map<string, StateGroup>([
    ["todo", "UNSTARTED"],
    ["doing", "STARTED"],
    ["done", "COMPLETED"],
    ["cancel", "CANCELLED"],
  ]);
  it("part des tâches terminées", () => {
    const issues = ["done", "done", "doing", "todo"].map((stateId) => ({ stateId }));
    expect(progress(issues, groups)).toEqual({ done: 2, total: 4, percent: 50 });
  });
  it("cycle vide → 0 %", () => {
    expect(progress([], groups)).toEqual({ done: 0, total: 0, percent: 0 });
  });
  it("les tâches annulées ne comptent pas comme terminées", () => {
    expect(progress([{ stateId: "cancel" }, { stateId: "done" }], groups).percent).toBe(50);
  });
});

describe("cycleFields", () => {
  it("refuse une fin avant le début", () => {
    expect(
      cycleFields.safeParse({ name: "S1", startDate: "2026-10-10", endDate: "2026-10-01" }).success,
    ).toBe(false);
    expect(
      cycleFields.safeParse({ name: "S1", startDate: "2026-10-01", endDate: "2026-10-01" }).success,
    ).toBe(true);
  });
});
