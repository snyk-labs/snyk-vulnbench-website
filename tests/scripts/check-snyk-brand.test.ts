import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditComposition,
  auditGeneratedMetadata,
  auditText,
  extractSnykAuditBlocks,
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

  it("accepts locked modern RGB forms and semantic color controls", () => {
    const source = `
      <style>
        .brand {
          color: rgb(111 0 221);
          border-color: rgb(255 255 255 / 65%);
          outline-color: currentColor;
          background-color: transparent;
          text-decoration-color: inherit;
          fill: none;
        }
      </style>
    `;

    expect(auditText(source, { fileName: "fixture.html" })).toEqual([]);
  });

  it.each([
    "rgb(111 0 221)",
    "rgb(111 0 221 / 1)",
    "rgb(111 0 221 / 100%)",
    "rgba(111 0 221)",
    "rgba(111 0 221 / 1)",
    "rgba(111, 0, 221, 1)",
    "rgba(111 0 221 / 100%)",
  ])("accepts fully opaque locked RGB equivalent %s", (color) => {
    expect(
      auditText(`.brand { color: ${color}; }`, {
        fileName: "fixture.css",
      }),
    ).toEqual([]);
  });

  it.each([
    "rgba(255 255 255 / 0.65)",
    "rgba(255 255 255 / .6500)",
    "rgba(255 255 255 / 65%)",
    "rgba(255 255 255 / 65.000%)",
  ])("accepts exact approved white alpha %s", (color) => {
    expect(
      auditText(`.brand { color: ${color}; }`, {
        fileName: "fixture.css",
      }),
    ).toEqual([]);
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
    ["space-separated rgb", ".card { color: rgb(12 34 56); }", "off-palette"],
    [
      "fractional near-palette rgb",
      ".card { color: rgb(111.4 0 221); }",
      "off-palette",
    ],
    [
      "rounded percentage rgb",
      ".card { color: rgb(43.5% 0% 86.6667%); }",
      "off-palette",
    ],
    [
      "space-separated rgba slash alpha",
      ".card { color: rgba(12 34 56 / 50%); }",
      "off-palette",
    ],
    [
      "rgb slash alpha",
      ".card { color: rgb(12 34 56 / .5); }",
      "off-palette",
    ],
    [
      "near-opaque brand alpha",
      ".card { color: rgba(111 0 221 / .99999); }",
      "off-palette",
    ],
    [
      "invalid brand alpha",
      ".card { color: rgba(111 0 221 / 1.1); }",
      "off-palette",
    ],
    [
      "invalid brand percentage alpha",
      ".card { color: rgba(111 0 221 / 101%); }",
      "off-palette",
    ],
    [
      "near approved white decimal alpha",
      ".card { color: rgba(255 255 255 / 0.65005); }",
      "off-palette",
    ],
    [
      "near approved white percentage alpha",
      ".card { color: rgba(255 255 255 / 65.005%); }",
      "off-palette",
    ],
    ["HSL", ".card { color: hsl(10 90% 50%); }", "off-palette"],
    ["HWB", ".card { color: hwb(10 20% 30%); }", "off-palette"],
    ["Lab", ".card { color: lab(50% 10 20); }", "off-palette"],
    ["LCH", ".card { color: lch(50% 20 30); }", "off-palette"],
    ["OKLab", ".card { color: oklab(50% 0.1 0.2); }", "off-palette"],
    ["OKLCH", ".card { color: oklch(50% 0.2 30); }", "off-palette"],
    [
      "color function",
      ".card { color: color(display-p3 1 0.2 0.3); }",
      "off-palette",
    ],
    [
      "device CMYK",
      ".card { color: device-cmyk(0 1 1 0); }",
      "off-palette",
    ],
    ["named CSS color", ".card { color: rebeccapurple; }", "off-palette"],
    ["CSS system color", ".card { color: CanvasText; }", "off-palette"],
    ["named SVG color", '<path fill="cornflowerblue"/>', "off-palette"],
    [
      "named custom-property color",
      ":root { --theme-accent: tomato; }",
      "off-palette",
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

  it.each([
    ["font custom property", ".card { --font-sans: Arial, sans-serif; }"],
    ["font shorthand", ".card { font: 700 1rem/1.2 Arial, sans-serif; }"],
    [
      "inline font shorthand",
      '<text style="font: 700 16px Arial, sans-serif">Label</text>',
    ],
  ])("rejects off-brand fonts through %s", (_label, source) => {
    expect(findingRules(source)).toContain("off-brand-font");
  });

  it("resolves arbitrary custom-property chains in color declarations", () => {
    const direct = findingRules("--tone: red; color: var(--tone);");
    const recursive = findingRules(
      "--source: tomato; --tone: var(--source); color: var(--tone);",
    );

    expect(direct).toContain("off-palette");
    expect(recursive).toContain("off-palette");
  });

  it("resolves a locked custom color without treating its name as a color", () => {
    expect(
      auditText("--purple: #6F00DD; color: var(--purple);", {
        fileName: "fixture.css",
      }),
    ).toEqual([]);
    expect(
      auditText("--purple: #6F00DD; --tone: var(--purple); color: var(--tone);", {
        fileName: "fixture.css",
      }),
    ).toEqual([]);
  });

  it("accepts a valid custom-property fallback", () => {
    expect(
      auditText("color: var(--missing, #6F00DD);", {
        fileName: "fixture.css",
      }),
    ).toEqual([]);
  });

  it("reports unresolved and cyclic custom colors", () => {
    expect(findingRules("color: var(--missing);")).toContain(
      "unresolved-custom-property",
    );
    expect(
      findingRules(
        "--first: var(--second); --second: var(--first); color: var(--first);",
      ),
    ).toContain("custom-property-cycle");
  });

  it("resolves arbitrary custom-property chains in font declarations", () => {
    expect(
      findingRules("--typeface: Arial; font-family: var(--typeface);"),
    ).toContain("off-brand-font");
    expect(
      findingRules(
        "--source: Arial; --typeface: var(--source); font: 700 1rem var(--typeface);",
      ),
    ).toContain("off-brand-font");
  });

  it("accepts a recursively resolved Geist custom font", () => {
    expect(
      auditText(
        '--source: "Geist"; --typeface: var(--source); font-family: var(--typeface);',
        { fileName: "fixture.css" },
      ),
    ).toEqual([]);
  });

  it("audits color storage in every arbitrary custom property", () => {
    expect(findingRules("--tone: red;")).toContain("off-palette");
    expect(
      findingRules(
        "--tone: red; filter: drop-shadow(0 0 1px var(--tone));",
      ),
    ).toContain("off-palette");
    expect(
      findingRules(
        "--source: tomato; --tone: var(--source); filter: drop-shadow(0 0 1px var(--tone));",
      ),
    ).toContain("off-palette");
  });

  it("accepts locked custom storage without inspecting variable names", () => {
    expect(
      auditText(
        "--red: #6F00DD; filter: drop-shadow(0 0 1px var(--red));",
        { fileName: "fixture.css" },
      ),
    ).toEqual([]);
  });

  it.each([
    '--label: "red"; content: var(--label);',
    '--label: "#123456"; content: var(--label);',
    '--image: url("/assets/red.png"); background-image: var(--image);',
    '--copy: "var(--missing)"; content: var(--copy);',
  ])("ignores quoted non-style custom-property content", (source) => {
    expect(auditText(source, { fileName: "fixture.css" })).toEqual([]);
  });

  it("rejects more than one sanctioned gradient in one composition", () => {
    const gradient =
      "linear-gradient(90deg, #2B0250 0%, #6F00DD 6%, #FF00FF 30%, #F3552E 66%, #FE9104 100%)";
    const source = `<style>.a { background: ${gradient}; } .b { border-image: ${gradient}; }</style>`;

    expect(findingRules(source)).toContain("gradient-count");
  });

  it("rejects two valid source fragments in one page composition", () => {
    const gradient =
      "linear-gradient(90deg, #2B0250 0%, #6F00DD 6%, #FF00FF 30%, #F3552E 66%, #FE9104 100%)";
    const fragments = [
      { fileName: "tokens.css", source: `.page { background: ${gradient}; }` },
      { fileName: "hero.astro", source: `.hero { border-image: ${gradient}; }` },
    ];

    expect(
      fragments.flatMap(({ fileName, source }) =>
        auditText(source, { fileName }),
      ),
    ).toEqual([]);
    expect(
      auditComposition(fragments, { fileName: "homepage composition" }).map(
        (finding) => finding.rule,
      ),
    ).toContain("gradient-count");
  });

  it("audits only explicit Snyk blocks in mixed shared sources", () => {
    const source = `
      .classic {
        color: #123456;
        font-family: Arial, sans-serif;
        background: radial-gradient(circle, red, blue);
      }
      /* snyk-2026-audit:start */
      .brand { color: #654321; }
      /* snyk-2026-audit:end */
    `;
    const branded = extractSnykAuditBlocks(source, "mixed.astro");
    const findings = auditText(branded, { fileName: "mixed.astro" });

    expect(branded).not.toContain("#123456");
    expect(branded).not.toContain("Arial");
    expect(findings.map((entry) => entry.message).join("\n")).toContain(
      "#654321",
    );
    expect(findings).toHaveLength(1);
  });

  it("fails deterministically when an auditable mixed source has no markers", () => {
    expect(() =>
      extractSnykAuditBlocks(".classic { color: #123456; }", "mixed.astro"),
    ).toThrow(/missing snyk-2026 audit blocks/i);
  });

  it.each([
    ':global(html[data-design-theme="snyk-2026"]) .escaped { color: #FFFFFF; }',
    ":global(html[data-design-theme=snyk-2026]) .escaped { color: #FFFFFF; }",
    "{isSnyk2026Design && <BrandFabric />}",
    "{isSnyk2026Design}",
    'if (designTheme === "snyk-2026") return renderBrand();',
    'if ("snyk-2026" === designTheme) return renderBrand();',
    'switch (designTheme) { case "snyk-2026": return renderBrand(); }',
  ])("rejects branded constructs outside marked source blocks", (escaped) => {
    const source = `
      /* snyk-2026-audit:start */
      .brand { color: #FFFFFF; }
      /* snyk-2026-audit:end */
      ${escaped}
    `;

    expect(() => extractSnykAuditBlocks(source, "mixed.astro")).toThrow(
      /snyk-branded construct outside marked audit blocks/i,
    );
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
    expect(packageJson.scripts["verify:classic"]).toBe(
      "VULNBENCH_DESIGN_THEME=classic node scripts/verify-classic.mjs",
    );
    expect(packageJson.scripts["verify:snyk-2026"]).toBe(
      "npm run check && npm run test:unit && npm run build:snyk-2026 && npm run check:releases && npm run check:budget && npm run check:brand && npm run test:e2e:snyk-2026",
    );
    expect(packageJson.scripts.verify).toBe(
      "npm run verify:classic && npm run verify:snyk-2026",
    );
  });

  it("audits every generated project case in both branded modes", async () => {
    const source = await readFile(
      resolve(process.cwd(), "tests/e2e/design-theme-accessibility.spec.ts"),
      "utf8",
    );
    for (const project of [
      "copperline",
      "goldleaf",
      "ironclad",
      "nightowl",
      "purplehaze",
      "riverbend",
      "shadowfox",
      "silvergate",
      "skylark",
      "tigerteam",
    ]) {
      expect(source).toContain(
        `/releases/js-1.0/cases/js-project-${project}-find-vulns`,
      );
    }
    expect(source).toContain('["light", "dark"]');
  });

  it("runs the shared audit over downloaded chart SVG output", async () => {
    const source = await readFile(
      resolve(process.cwd(), "tests/e2e/design-theme.spec.ts"),
      "utf8",
    );

    expect(source).toContain(
      'import { auditText } from "../../scripts/check-snyk-brand.mjs";',
    );
    expect(source).toMatch(/auditText\(svg,\s*\{/u);
  });
});
