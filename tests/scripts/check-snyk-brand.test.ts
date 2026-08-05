import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditGeneratedMetadata,
  auditText,
} from "../../scripts/check-snyk-brand.mjs";

const findingRules = (source: string) =>
  auditText(source, { fileName: "fixture.html" }).map(
    (finding) => finding.rule,
  );

describe("Snyk 2026 mechanical brand audit", () => {
  it("accepts the locked palette, approved white alpha, and sanctioned gradient", () => {
    const source = `
      <style>
        html, body { overflow-x: hidden; }
        h1 {
          color: #FFFFFF;
          background: linear-gradient(90deg, #2B0250 0%, #6F00DD 6%, #FF00FF 30%, #F3552E 66%, #FE9104 100%);
          border-color: rgba(255, 255, 255, 0.12);
          font-family: "Geist", sans-serif;
          font-size: clamp(2.5rem, 6vw, 5rem);
        }
        .metric { color: #030328; font-family: "Geist Mono", monospace; }
      </style>
    `;

    expect(auditText(source, { fileName: "fixture.html" })).toEqual([]);
  });

  it.each([
    ["off-palette hex", ".card { color: #123456; }", "off-palette"],
    ["off-palette rgb", ".card { color: rgb(12, 34, 56); }", "off-palette"],
    [
      "off-palette alpha",
      ".card { color: rgba(111, 0, 221, 0.4); }",
      "off-palette",
    ],
    [
      "unapproved white hex alpha",
      ".card { color: #FFFFFF80; }",
      "off-palette",
    ],
    [
      "background-clip text",
      ".word { background-clip: text; }",
      "forbidden-css",
    ],
    [
      "transparent text fill",
      ".word { -webkit-text-fill-color: transparent; }",
      "forbidden-css",
    ],
    ["mask image", ".fabric { mask-image: url(fade.png); }", "forbidden-css"],
    [
      "mask composite",
      ".card::before { mask-composite: exclude; }",
      "forbidden-css",
    ],
    ["glow helper", '<div class="hero-glow"></div>', "glow-helper"],
    [
      "fixed display pixels",
      ".hero h1 { font-size: 48px; }",
      "fixed-display-px",
    ],
    [
      "missing overflow guard",
      ".hero h1 { font-size: clamp(2rem, 5vw, 4rem); }",
      "missing-overflow-guard",
    ],
    [
      "unauthorized linear gradient",
      ".card { background: linear-gradient(90deg, #6F00DD, #FF00FF); }",
      "unauthorized-gradient",
    ],
    [
      "radial gradient",
      ".card { background: radial-gradient(circle, #6F00DD, #030328); }",
      "unauthorized-gradient",
    ],
  ])("rejects %s", (_label, source, rule) => {
    expect(findingRules(source)).toContain(rule);
  });

  it.each([
    "Inter",
    "Aeonik",
    "DM Sans",
    "Roboto",
    "Montserrat",
    "Arial",
    "Helvetica",
  ])("rejects the off-brand %s font in declarations", (font) => {
    expect(
      findingRules(`.card { font-family: "${font}", sans-serif; }`),
    ).toContain("off-brand-font");
  });

  it("rejects more than one sanctioned gradient in one composition", () => {
    const gradient =
      "linear-gradient(90deg, #2B0250 0%, #6F00DD 6%, #FF00FF 30%, #F3552E 66%, #FE9104 100%)";
    const source = `<style>.a { background: ${gradient}; } .b { border-image: ${gradient}; }</style>`;

    expect(findingRules(source)).toContain("gradient-count");
  });

  it("accepts the exact sanctioned SVG gradient", () => {
    const source = `
      <svg>
        <defs>
          <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#2B0250"/>
            <stop offset="6%" stop-color="#6F00DD"/>
            <stop offset="30%" stop-color="#FF00FF"/>
            <stop offset="66%" stop-color="#F3552E"/>
            <stop offset="100%" stop-color="#FE9104"/>
          </linearGradient>
        </defs>
        <text fill="#FFFFFF" font-family="Geist">VulnBench</text>
      </svg>
    `;

    expect(auditText(source, { fileName: "card.svg" })).toEqual([]);
  });

  it("rejects generated HTML that references Classic identity assets", () => {
    const findings = auditGeneratedMetadata(
      `<html data-design-theme="classic">
        <link rel="icon" href="/favicon.svg">
        <meta property="og:image" content="https://vulnbench.com/social/vulnbench-default.svg">
      </html>`,
      "dist/index.html",
    );

    expect(findings.map((finding) => finding.rule)).toEqual([
      "design-theme-output",
      "branded-favicon",
      "branded-social-image",
    ]);
  });

  it("accepts generated branded metadata references", () => {
    const findings = auditGeneratedMetadata(
      `<html data-design-theme="snyk-2026">
        <link rel="icon" href="/brand/snyk-2026/favicon.svg">
        <meta property="og:image" content="https://vulnbench.com/brand/snyk-2026/social.svg">
      </html>`,
      "dist/index.html",
    );

    expect(findings).toEqual([]);
  });
});

describe("Task 5 package gates", () => {
  it("defines separate complete Classic and Snyk 2026 verification gates", async () => {
    const packageJson = JSON.parse(
      await readFile(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["build:snyk-2026"]).toBe(
      "VULNBENCH_DESIGN_THEME=snyk-2026 astro build",
    );
    expect(packageJson.scripts["test:e2e:snyk-2026"]).toBe(
      "playwright test --config=playwright.snyk-2026.config.ts",
    );
    expect(packageJson.scripts["check:brand"]).toBe(
      "node scripts/check-snyk-brand.mjs",
    );
    expect(packageJson.scripts["verify:classic"]).toContain("npm run test:e2e");
    expect(packageJson.scripts["verify:snyk-2026"]).toContain(
      "npm run test:e2e:snyk-2026",
    );
    expect(packageJson.scripts.verify).toBe(
      "npm run verify:classic && npm run verify:snyk-2026",
    );
  });
});
