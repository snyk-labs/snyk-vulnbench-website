import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { designThemeAssets } from "./design-theme";

const faviconPath = resolve(
  process.cwd(),
  "public/brand/snyk-2026/favicon.svg",
);

describe("Snyk 2026 static identity assets", () => {
  it("publishes the framed VulnBench finding trace in the locked palette", () => {
    const svg = readFileSync(faviconPath, "utf8");
    const colors = [...svg.matchAll(/#[0-9a-f]{6}/gi)].map(([color]) =>
      color.toUpperCase(),
    );
    const circles = [...svg.matchAll(
      /<circle cx="(\d+)" cy="(\d+)" r="(\d+)" fill="([^"]+)"\/>/g,
    )].map(([, cx, cy, radius, fill]) => ({ cx, cy, radius, fill }));
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

    expect(designThemeAssets["snyk-2026"].favicon).toBe(
      "/brand/snyk-2026/favicon.svg",
    );
    expect(svg).toContain("<svg");
    expect(svg).toContain("<title>VulnBench finding trace</title>");
    expect(svg).toContain(
      '<rect x="1" y="1" width="30" height="30" rx="5" fill="#030328"/>',
    );
    expect(svg).toContain(
      '<rect x="5" y="5" width="22" height="22" rx="3" fill="#2B0250" stroke="#6F00DD" stroke-width="2"/>',
    );
    expect(circles).toEqual([
      { cx: "10", cy: "10", radius: "2", fill: "#FFFFFF" },
      { cx: "16", cy: "16", radius: "2", fill: "#FFFFFF" },
      { cx: "22", cy: "16", radius: "2", fill: "#FFFFFF" },
      { cx: "10", cy: "22", radius: "2", fill: "#FFFFFF" },
      { cx: "22", cy: "22", radius: "2", fill: "#FFFFFF" },
    ]);
    expect(svg).not.toMatch(/Snyk|wordmark|logo-snyk/i);
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.every((color) => lockedPalette.has(color))).toBe(true);
    expect(new Set(colors)).toEqual(
      new Set(["#030328", "#2B0250", "#6F00DD", "#FFFFFF"]),
    );
  });
});
