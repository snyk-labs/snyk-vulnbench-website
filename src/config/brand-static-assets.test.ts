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
    const classicFaviconPath = resolve(process.cwd(), "public/favicon.svg");
    const brandedFavicon = readFileSync(faviconPath, "utf8");
    const classicFavicon = readFileSync(classicFaviconPath, "utf8");

    expect(designThemeAssets["snyk-2026"].favicon).toBe(
      "/brand/snyk-2026/favicon.svg",
    );
    expect(brandedFavicon).toBe(classicFavicon);
  });
});
