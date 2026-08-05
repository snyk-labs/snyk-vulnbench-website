import { describe, expect, it } from "vitest";
import {
  renderDefaultSocialCard,
  renderReleaseShareCard,
  type ReleaseShareCard,
} from "./share-card";

const brandAssets = {
  geistFontUrl: "/_astro/geist-latin-wght-normal.test.woff2",
  geistMonoFontUrl: "/_astro/geist-mono-latin-wght-normal.test.woff2",
  wordmarkUrl: "/brand/snyk-2026/logo-snyk-white.png",
} as const;

const summaryCard: ReleaseShareCard = {
  eyebrow: "JS 1.0 · Summary",
  title: "Can LLMs find the same bugs twice?",
  finding: "134 of 158 reference-matched signatures appeared in all five runs.",
  metric: "Reference-matched recurrence",
  value: "134 of 158",
  unit: "unique normalized signatures",
  source: "published-evidence.json",
  caveat: "Reference agreement is not universal accuracy.",
};

const classicSummarySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">Can LLMs find the same bugs twice?</title>
  <desc id="description">134 of 158 reference-matched signatures appeared in all five runs.</desc>
  <rect width="1200" height="630" fill="#f7f4ed"/>
  <rect x="0" width="28" height="630" fill="#4b2be3"/>
  <text x="80" y="92" fill="#4b2be3" font-family="monospace" font-size="24" font-weight="700">JS 1.0 · SUMMARY</text>
  <text x="80" y="190" fill="#17141f" font-family="Arial, sans-serif" font-size="58" font-weight="700">Can LLMs find the same bugs twice?</text>
  <rect x="80" y="252" width="1040" height="2" fill="#aaa1b0"/>
  <text x="80" y="315" fill="#17141f" font-family="Arial, sans-serif" font-size="34" font-weight="700">134 of 158 reference-matched signatures appeared in all five runs.</text>
  <text x="80" y="365" fill="#625d68" font-family="monospace" font-size="17">REFERENCE-MATCHED RECURRENCE</text>
  <text x="80" y="400" fill="#4b2be3" font-family="Arial, sans-serif" font-size="28" font-weight="700">134 of 158 · unique normalized signatures</text>
  <rect x="80" y="430" width="1040" height="92" fill="#eee9df" stroke="#aaa1b0"/>
  <text x="108" y="468" fill="#625d68" font-family="monospace" font-size="18">KEEP IN MIND</text>
  <text x="108" y="498" fill="#17141f" font-family="Arial, sans-serif" font-size="22">Reference agreement is not universal accuracy.</text>
  <text x="80" y="560" fill="#625d68" font-family="monospace" font-size="16">Source: published-evidence.json</text>
  <text x="80" y="592" fill="#625d68" font-family="monospace" font-size="18">Dataset 1.0.0 · Snyk VulnBench JS 1.0 · vulnbench.com</text>
</svg>`;

describe("social share-card renderers", () => {
  it("preserves the complete Classic SVG output byte for byte", () => {
    expect(
      renderReleaseShareCard(summaryCard, { designTheme: "classic" }),
    ).toBe(classicSummarySvg);
  });

  it("renders a canonical branded release card with isolated copy", () => {
    const svg = renderReleaseShareCard(summaryCard, {
      designTheme: "snyk-2026",
      assets: brandAssets,
    });

    expect(svg.match(/<linearGradient\b/g)).toHaveLength(1);
    expect(svg).toContain(
      '<rect data-brand-background="" width="1200" height="630" fill="url(#brand-gradient)"/>',
    );
    expect(svg).toContain(
      '<rect data-copy-region="" width="1000" height="630" fill="#030328"/>',
    );
    expect(svg).toContain(
      'href="/brand/snyk-2026/logo-snyk-white.png"',
    );
    expect(svg).toContain(
      'src: url("/_astro/geist-latin-wght-normal.test.woff2") format("woff2")',
    );
    expect(svg).toContain(
      'src: url("/_astro/geist-mono-latin-wght-normal.test.woff2") format("woff2")',
    );
    expect(svg).toContain('font-family="Geist"');
    expect(svg).toContain('font-family="Geist Mono"');
    expect(svg).toContain(summaryCard.title);
    expect(svg).toContain(summaryCard.finding);
    expect(svg).toContain(summaryCard.metric.toUpperCase());
    expect(svg).toContain(summaryCard.value);
    expect(svg).toContain(summaryCard.unit);
    expect(svg).toContain(`Source: ${summaryCard.source}`);
    expect(svg).toContain(summaryCard.caveat);
    expect(svg).toContain("Dataset 1.0.0");
    expect(svg).toContain("Snyk VulnBench JS 1.0");
    expect(svg).not.toMatch(
      /Arial|Inter|monospace|#f7f4ed|#4b2be3|#17141f|#aaa1b0|#625d68|#eee9df/i,
    );
    expect(svg).not.toMatch(/mask|radialGradient|background-clip/i);
    expect(svg).not.toMatch(/<text\b[^>]*\bfill="url\(/i);

    const textFills = [...svg.matchAll(/<text\b[^>]*\bfill="([^"]+)"/g)].map(
      ([, fill]) => fill,
    );
    expect(textFills.length).toBeGreaterThan(0);
    expect(new Set(textFills)).toEqual(new Set(["#FFFFFF"]));
  });

  it("renders the branded default social image with study provenance", () => {
    const svg = renderDefaultSocialCard(brandAssets);

    expect(svg).toContain("Snyk VulnBench JS 1.0");
    expect(svg).toContain("Can LLMs find the same bugs twice?");
    expect(svg).toContain(
      "A repeatability and Snyk-reference agreement study",
    );
    expect(svg).toContain("300 scans");
    expect(svg).toContain("10 projects");
    expect(svg).toContain("6 configurations");
    expect(svg).toContain("5 repetitions");
    expect(svg).toContain("Dataset 1.0.0");
    expect(svg).toContain("Source: published benchmark evidence");
    expect(svg).toContain("Reference agreement is not universal accuracy.");
    expect(svg.match(/<linearGradient\b/g)).toHaveLength(1);
    expect(svg).toContain('fill="#030328"');
    expect(svg).toContain('fill="#FFFFFF"');
  });
});
