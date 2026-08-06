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
    expect(svg).toContain('data-footer-background=""');
    expect(svg).toContain('width="1200" height="98" fill="#000000"');
    expect(svg).toContain(
      'href="/brand/snyk-2026/logo-snyk-white.png" x="70" y="559" width="108" height="43"',
    );
    expect(svg).toContain('fill="#FFFFFF"');
    expect(svg).toContain("AGREEMENT VS REPEATED-RUN VARIANCE");
    expect(svg).toContain("F1 standard deviation (percentage points)");
    expect(svg).toContain("Snyk-reference F1 (%)");
    expect(svg).toContain('data-point-name="Claude Opus 4.6 Medium"');
    expect(svg).toContain('data-point-name="Claude Sonnet 4.6 High"');
    expect(svg).toContain("49.7%");
    expect(svg).toContain("unmatched findings");
    expect(svg).toContain("only one of five runs");
    expect(svg).toContain("80 of 161");
    expect(svg).not.toContain("134 of 158");
    expect(svg).toContain("Reference agreement is not universal accuracy.");
  });
});
