import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const faviconPath = resolve(
  process.cwd(),
  "public/brand/snyk-2026/favicon.svg",
);

describe("Snyk 2026 static identity assets", () => {
  it("publishes an unboxed VulnBench initiative favicon in the locked palette", () => {
    const svg = readFileSync(faviconPath, "utf8");
    const colors = [...svg.matchAll(/#[0-9a-f]{6}/gi)].map(([color]) =>
      color.toUpperCase(),
    );
    const lockedPalette = new Set([
      "#030328",
      "#2B0250",
      "#6F00DD",
      "#FF00FF",
      "#F3552E",
      "#FE9104",
      "#FFFFFF",
      "#000000",
    ]);

    expect(svg).toContain("<svg");
    expect(svg).toContain("<title>Snyk VulnBench</title>");
    expect(svg).not.toContain("<rect");
    expect(svg).not.toMatch(/wordmark|logo-snyk/i);
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.every((color) => lockedPalette.has(color))).toBe(true);
  });
});
