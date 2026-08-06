import { describe, expect, it } from "vitest";
import { renderDefaultSocialCard } from "./share-card";

const assets = {
  geistFontUrl: "/_astro/geist-latin-wght-normal.test.woff2",
  geistMonoFontUrl: "/_astro/geist-mono-latin-wght-normal.test.woff2",
  wordmarkUrl: "/brand/snyk-2026/logo-snyk-white.png",
};

describe("light Snyk 2026 default social card", () => {
  it("renders a white 1200x630 chart-led analytical composition", () => {
    const svg = renderDefaultSocialCard(assets);

    expect(svg).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"',
    );
    expect(svg).toContain('data-light-social-card=""');
    expect(svg).toContain('data-social-background=""');
    expect(svg).toContain('fill="#FFFFFF"');
    expect(svg).toContain("AGREEMENT VS REPEATED-RUN VARIANCE");
    expect(svg).toContain("F1 standard deviation (percentage points)");
    expect(svg).toContain("Snyk-reference F1 (%)");
    expect(svg).toContain('data-point-name="Claude Opus 4.6 Medium"');
    expect(svg).toContain('data-point-name="Claude Sonnet 4.6 High"');
    expect(svg).toContain("Best model Snyk-reference F1: 75.4%");
    expect(svg).toContain("Reference agreement is not universal accuracy.");
  });
});
