import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const tokenPath = `${repositoryRoot}/src/styles/tokens-snyk-2026.css`;
const brandGradient =
  "linear-gradient(90deg, #2B0250 0%, #6F00DD 6%, #FF00FF 30%, #F3552E 66%, #FE9104 100%)";
const allowedHexColors = new Set([
  "#000000",
  "#030328",
  "#2B0250",
  "#6F00DD",
  "#F3552E",
  "#FE9104",
  "#FF00FF",
  "#FFFFFF",
]);
const semanticTokens = [
  "--theme-paper",
  "--theme-paper-raised",
  "--theme-paper-muted",
  "--theme-ink",
  "--theme-ink-soft",
  "--theme-ink-faint",
  "--theme-rule",
  "--theme-rule-strong",
  "--theme-purple",
  "--theme-purple-dark",
  "--theme-purple-soft",
  "--theme-matched",
  "--theme-matched-soft",
  "--theme-unmatched",
  "--theme-unmatched-soft",
  "--theme-warning",
  "--theme-warning-soft",
  "--theme-inverse-text",
  "--theme-evidence-surface",
  "--theme-evidence-text",
  "--theme-evidence-muted",
  "--theme-evidence-rule",
  "--theme-evidence-hover",
  "--theme-evidence-accent",
  "--theme-evidence-matched",
  "--theme-evidence-unmatched",
  "--theme-heatmap-0",
  "--theme-heatmap-1",
  "--theme-heatmap-2",
  "--theme-heatmap-3",
  "--theme-heatmap-4",
  "--theme-heatmap-text-strong",
  "--theme-series-1",
  "--theme-series-2",
  "--theme-series-3",
  "--theme-series-4",
  "--theme-series-5",
  "--theme-series-6",
  "--theme-series-fallback",
  "--font-sans",
  "--font-mono",
  "--focus-ring",
] as const;

function selectorBody(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`));
  expect(match, `Missing selector ${selector}`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("Snyk 2026 design contract", () => {
  it("loads the isolated token layer after Classic tokens", async () => {
    const [globalCss, tokenCss] = await Promise.all([
      readFile(`${repositoryRoot}/src/styles/global.css`, "utf8"),
      readFile(tokenPath, "utf8"),
    ]);

    expect(globalCss.indexOf('@import "./tokens.css";')).toBeGreaterThanOrEqual(0);
    expect(globalCss.indexOf('@import "./tokens-snyk-2026.css";')).toBeGreaterThan(
      globalCss.indexOf('@import "./tokens.css";'),
    );
    expect(tokenCss).toContain('@import "@fontsource-variable/geist";');
    expect(tokenCss).toContain('@import "@fontsource-variable/geist-mono";');
    expect(tokenCss).not.toContain(":root");
  });

  it.each([
    'html[data-design-theme="snyk-2026"][data-theme="light"]',
    'html[data-design-theme="snyk-2026"][data-theme="dark"]',
    'html[data-design-theme="snyk-2026"]:not([data-theme])',
  ])("maps every semantic token for %s", async (selector) => {
    const source = await readFile(tokenPath, "utf8");
    const body = selectorBody(source, selector);

    for (const token of semanticTokens) {
      expect(body, `${selector} does not map ${token}`).toMatch(
        new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`),
      );
    }
  });

  it("uses only the locked palette, white alpha, and sanctioned gradient", async () => {
    const source = await readFile(tokenPath, "utf8");
    const compactSource = source.replace(/\s+/g, " ");
    const hexColors = source.match(/#[\da-f]{6}/gi) ?? [];
    const rgbaColors = source.match(/rgba\([^)]+\)/gi) ?? [];
    const gradients = compactSource.match(/linear-gradient\([^)]+\)/gi) ?? [];

    expect(
      hexColors.filter(
        (color) => !allowedHexColors.has(color.toUpperCase()),
      ),
    ).toEqual([]);
    expect(rgbaColors.length).toBeGreaterThan(0);
    for (const color of rgbaColors) {
      expect(color).toMatch(
        /^rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(?:0(?:\.\d+)?|1(?:\.0+)?)\s*\)$/i,
      );
    }
    expect(gradients).toEqual([brandGradient]);
    expect(source).not.toMatch(
      /color-mix|radial-gradient|mask-image|mask-composite|background-clip|text-fill-color|backdrop-filter/i,
    );
  });

  it("declares local font packages and byte-identical approved assets", async () => {
    const packageJson = JSON.parse(
      await readFile(`${repositoryRoot}/package.json`, "utf8"),
    ) as { dependencies?: Record<string, string> };
    expect(packageJson.dependencies).toMatchObject({
      "@fontsource-variable/geist": expect.any(String),
      "@fontsource-variable/geist-mono": expect.any(String),
    });

    const assets = [
      {
        filename: "logo-snyk-white.png",
        checksum:
          "f1cb84a4c98337403f7b2598eeeda0547735e0ffd9842d8211eb582eb3d8dd61",
        dimensions: "1276 × 659",
        source:
          "/Users/lirantal/.cursor/skills/apply-brand-guidelines/assets/logo-snyk-white.png",
      },
      {
        filename: "BRC_Fabric_Gradient.png",
        checksum:
          "2416ded175f378f9b4a69b233022084d0430a99a7124ee9a7b0590f182c42259",
        dimensions: "5667 × 3316",
        source:
          "/Users/lirantal/.cursor/skills/apply-brand-guidelines/assets/BRC_Fabric_Gradient.png",
      },
      {
        filename: "BRC_Fabric_NoGradient.png",
        checksum:
          "84ab4f561189a7e3e92e58b7332c98d31fccdf481aa4d15894fa44f7b0c52385",
        dimensions: "5733 × 3355",
        source:
          "/Users/lirantal/.cursor/skills/apply-brand-guidelines/assets/BRC_Fabric_NoGradient.png",
      },
    ];
    const provenance = await readFile(
      `${repositoryRoot}/public/brand/snyk-2026/PROVENANCE.md`,
      "utf8",
    );

    for (const asset of assets) {
      const contents = await readFile(
        `${repositoryRoot}/public/brand/snyk-2026/${asset.filename}`,
      );
      expect(createHash("sha256").update(contents).digest("hex")).toBe(
        asset.checksum,
      );
      expect(provenance).toContain(asset.source);
      expect(provenance).toContain(asset.dimensions);
      expect(provenance).toContain(asset.checksum);
    }
  });
});
