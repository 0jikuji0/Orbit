import { describe, expect, it } from "vitest";
import { initials } from "@/components/ui/avatar";

describe("initials", () => {
  it.each([
    ["Alice Martin", "AM"],
    ["alice", "A"],
    ["Jean Pierre Durand", "JD"],
    ["  ", ""],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
