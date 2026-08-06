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
  "--font-weight-h1",
  "--font-weight-heading",
  "--font-weight-control",
  "--font-weight-control-strong",
  "--font-weight-label",
  "--font-weight-label-strong",
  "--font-weight-emphasis",
  "--font-weight-metric",
  "--font-weight-metric-compact",
  "--focus-ring",
] as const;

function selectorBody(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`));
  expect(match, `Missing selector ${selector}`).not.toBeNull();
  return match?.[1] ?? "";
}

function declarationValue(body: string, property: string) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`${escapedProperty}\\s*:\\s*([^;]+)`));
  const value = match?.[1];
  if (!value) throw new Error(`Missing declaration ${property}`);
  return value.trim();
}

function relativeLuminance([red, green, blue]: [number, number, number]) {
  const linearize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  };
  return (
    linearize(red) * 0.2126 +
    linearize(green) * 0.7152 +
    linearize(blue) * 0.0722
  );
}

function contrastRatio(
  foreground: [number, number, number],
  background: [number, number, number],
) {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  return (lighter + 0.05) / (darker + 0.05);
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

  it("uses only the locked palette, locked-color alpha, and sanctioned gradient", async () => {
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
        /^rgba\(\s*(?:3\s*,\s*3\s*,\s*40|111\s*,\s*0\s*,\s*221|243\s*,\s*85\s*,\s*46|254\s*,\s*145\s*,\s*4|255\s*,\s*255\s*,\s*255)\s*,\s*(?:0(?:\.\d+)?|1(?:\.0+)?)\s*\)$/i,
      );
    }
    expect(gradients).toEqual([brandGradient]);
    expect(source).not.toMatch(
      /color-mix|radial-gradient|mask-image|mask-composite|background-clip|text-fill-color|backdrop-filter/i,
    );
  });

  it("uses a white Light canvas with Midnight copy and compliant boundaries", async () => {
    const source = await readFile(tokenPath, "utf8");
    const light = selectorBody(
      source,
      'html[data-design-theme="snyk-2026"][data-theme="light"]',
    );

    expect(declarationValue(light, "background")).toBe("#FFFFFF");
    expect(declarationValue(light, "--theme-paper")).toBe("#FFFFFF");
    expect(declarationValue(light, "--theme-paper-raised")).toBe("#FFFFFF");
    expect(declarationValue(light, "--theme-paper-muted")).toBe(
      "rgba(111, 0, 221, 0.04)",
    );
    expect(declarationValue(light, "--theme-ink")).toBe("#030328");
    expect(declarationValue(light, "--theme-rule-strong")).toBe(
      "rgba(3, 3, 40, 0.48)",
    );

    for (const selector of [
      'html[data-design-theme="snyk-2026"][data-theme="dark"]',
      'html[data-design-theme="snyk-2026"]:not([data-theme])',
    ]) {
      const value = declarationValue(
        selectorBody(source, selector),
        "--theme-rule-strong",
      );
      const match = value.match(
        /^rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*\)$/,
      );
      expect(match, `${selector} must use white alpha`).not.toBeNull();
      const alpha = Number(match?.[1]);
      const midnight: [number, number, number] = [3, 3, 40];
      const composited = midnight.map((channel) =>
        Math.round(channel + (255 - channel) * alpha),
      ) as [number, number, number];
      expect(contrastRatio(composited, midnight)).toBeGreaterThanOrEqual(3);
    }
  });

  it("maps explicit and system Dark to the same neutral editorial tokens", async () => {
    const source = await readFile(tokenPath, "utf8");
    const explicitDark = selectorBody(
      source,
      'html[data-design-theme="snyk-2026"][data-theme="dark"]',
    );
    const systemDark = selectorBody(
      source,
      'html[data-design-theme="snyk-2026"]:not([data-theme])',
    );
    const expected = {
      "--theme-paper": "#030328",
      "--theme-paper-raised": "rgba(255, 255, 255, 0.08)",
      "--theme-paper-muted": "rgba(255, 255, 255, 0.04)",
      "--theme-ink": "rgba(255, 255, 255, 0.78)",
      "--theme-ink-soft": "rgba(255, 255, 255, 0.65)",
      "--theme-ink-faint": "rgba(255, 255, 255, 0.5)",
      "--theme-rule": "rgba(255, 255, 255, 0.12)",
      "--theme-rule-strong": "rgba(255, 255, 255, 0.4)",
      "--theme-purple": "#6F00DD",
      "--theme-purple-dark": "rgba(255, 255, 255, 0.78)",
      "--theme-purple-soft": "rgba(111, 0, 221, 0.18)",
      "--theme-matched": "#6F00DD",
      "--theme-matched-soft": "rgba(111, 0, 221, 0.18)",
      "--theme-unmatched": "#F3552E",
      "--theme-unmatched-soft": "rgba(243, 85, 46, 0.12)",
      "--theme-warning": "#FE9104",
      "--theme-warning-soft": "rgba(254, 145, 4, 0.12)",
      "--theme-evidence-surface": "rgba(255, 255, 255, 0.08)",
      "--theme-evidence-text": "rgba(255, 255, 255, 0.78)",
      "--theme-evidence-muted": "rgba(255, 255, 255, 0.65)",
      "--theme-evidence-hover": "rgba(255, 255, 255, 0.12)",
      "--theme-evidence-accent": "#6F00DD",
      "--theme-evidence-matched": "#6F00DD",
      "--theme-evidence-unmatched": "#F3552E",
      "--focus-ring": "0 0 0 3px #030328, 0 0 0 6px #6F00DD",
    } as const;

    for (const [token, value] of Object.entries(expected)) {
      expect(declarationValue(explicitDark, token), token).toBe(value);
      expect(declarationValue(systemDark, token), token).toBe(value);
    }

    for (const token of semanticTokens) {
      expect(declarationValue(systemDark, token), token).toBe(
        declarationValue(explicitDark, token),
      );
    }
  });

  it("keeps Hot Pink rare and Dark Purple out of broad Dark surfaces", async () => {
    const source = await readFile(tokenPath, "utf8");

    for (const selector of [
      'html[data-design-theme="snyk-2026"][data-theme="dark"]',
      'html[data-design-theme="snyk-2026"]:not([data-theme])',
    ]) {
      const body = selectorBody(source, selector);
      expect(body.match(/#FF00FF/g)).toHaveLength(1);
      expect(declarationValue(body, "--theme-series-5")).toBe("#FF00FF");
      for (const token of [
        "--theme-paper-raised",
        "--theme-paper-muted",
        "--theme-purple-soft",
        "--theme-matched-soft",
        "--theme-unmatched-soft",
        "--theme-warning-soft",
        "--theme-evidence-surface",
        "--theme-evidence-hover",
      ]) {
        expect(declarationValue(body, token), token).not.toBe("#2B0250");
      }
    }
  });

  it("preserves Classic weight defaults and maps the Snyk hierarchy", async () => {
    const [classic, snyk] = await Promise.all([
      readFile(`${repositoryRoot}/src/styles/tokens.css`, "utf8"),
      readFile(tokenPath, "utf8"),
    ]);

    expect(classic).toContain("--font-weight-h1: 720;");
    expect(classic).toContain("--font-weight-heading: 720;");
    expect(classic).toContain("--font-weight-control: 700;");
    expect(classic).toContain("--font-weight-control-strong: 750;");
    expect(classic).toContain("--font-weight-label: 700;");
    expect(classic).toContain("--font-weight-label-strong: 750;");
    expect(classic).toContain("--font-weight-emphasis: 650;");
    expect(classic).toContain("--font-weight-metric: 750;");
    expect(classic).toContain("--font-weight-metric-compact: 700;");

    const light = selectorBody(
      snyk,
      'html[data-design-theme="snyk-2026"][data-theme="light"]',
    );
    expect(declarationValue(light, "--font-weight-h1")).toBe("700");
    expect(declarationValue(light, "--font-weight-heading")).toBe("500");
    expect(declarationValue(light, "--font-weight-control")).toBe("500");
    expect(declarationValue(light, "--font-weight-control-strong")).toBe("500");
    expect(declarationValue(light, "--font-weight-label")).toBe("500");
    expect(declarationValue(light, "--font-weight-label-strong")).toBe("500");
    expect(declarationValue(light, "--font-weight-emphasis")).toBe("500");
    expect(declarationValue(light, "--font-weight-metric")).toBe("700");
    expect(declarationValue(light, "--font-weight-metric-compact")).toBe("700");
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
