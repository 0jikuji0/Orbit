import { describe, expect, it } from "vitest";
import { formatBytes, isInlineMime, sanitizeFilename } from "@/lib/uploads";

describe("sanitizeFilename", () => {
  it.each([
    ["rapport.pdf", "rapport.pdf"],
    ["../../etc/passwd", "passwd"],
    ["C:\\Users\\moi\\photo.png", "photo.png"],
    ['bad"name\u0000.txt', "badname.txt"],
    ["", "fichier"],
  ])("%s → %s", (input, expected) => {
    expect(sanitizeFilename(input)).toBe(expected);
  });

  it("limite la longueur", () => {
    expect(sanitizeFilename("a".repeat(300))).toHaveLength(200);
  });
});

describe("isInlineMime", () => {
  it("n'affiche jamais SVG ni HTML dans le navigateur", () => {
    expect(isInlineMime("image/png")).toBe(true);
    expect(isInlineMime("image/svg+xml")).toBe(false);
    expect(isInlineMime("text/html")).toBe(false);
  });
});

describe("formatBytes", () => {
  it.each([
    [512, "512 o"],
    [2048, "2 Ko"],
    [5 * 1024 * 1024, "5.0 Mo"],
  ])("%d → %s", (n, expected) => {
    expect(formatBytes(n)).toBe(expected);
  });
});
