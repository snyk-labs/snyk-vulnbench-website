import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();

async function source(relativePath: string) {
  return readFile(`${repositoryRoot}/${relativePath}`, "utf8");
}

function selectorBody(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`));
  expect(match, `Missing selector ${selector}`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("build-selected branded shell contract", () => {
  it("maps Snyk Light to a white analytical canvas with restrained locked-color semantics", async () => {
    const tokens = await source("src/styles/tokens-snyk-2026.css");

    expect(tokens).toContain("--theme-paper: #FFFFFF;");
    expect(tokens).toContain("--theme-paper-raised: #FFFFFF;");
    expect(tokens).toContain("--theme-paper-muted: rgba(111, 0, 221, 0.04);");
    expect(tokens).toContain("--theme-ink: #030328;");
    expect(tokens).toContain("--theme-ink-soft: rgba(3, 3, 40, 0.72);");
    expect(tokens).toContain("--theme-rule: rgba(3, 3, 40, 0.12);");
    expect(tokens).toContain("--theme-matched: #6F00DD;");
    expect(tokens).toContain("--theme-matched-soft: rgba(111, 0, 221, 0.08);");
    expect(tokens).toContain("--theme-unmatched: #F3552E;");
    expect(tokens).toContain("--theme-unmatched-soft: rgba(243, 85, 46, 0.08);");
    expect(tokens).toContain("--theme-warning: #FE9104;");
    expect(tokens).toContain("--theme-warning-soft: rgba(254, 145, 4, 0.12);");
    expect(tokens).toContain("--theme-evidence-surface: #FFFFFF;");
    expect(tokens).toContain("--theme-evidence-text: #030328;");
    expect(tokens).toContain("--theme-heatmap-4: rgba(111, 0, 221, 0.24);");
    expect(tokens).toContain("--theme-series-6: #030328;");
    expect(tokens).toContain(
      "--brand-gradient: linear-gradient(90deg, #2B0250 0%, #6F00DD 6%, #FF00FF 30%, #F3552E 66%, #FE9104 100%);",
    );
  });

  it("uses the neutral VulnBench identity in the compact header for both designs", async () => {
    const [header, wordmark] = await Promise.all([
      source("src/components/site/SiteHeader.astro"),
      source("src/components/site/Wordmark.astro"),
    ]);
    const headerInner = selectorBody(header, ".header-inner");

    expect(header).toContain('import Wordmark from "./Wordmark.astro";');
    expect(header.match(/<Wordmark\s*\/>/g)).toHaveLength(1);
    expect(header).not.toContain('import SnykLogo from "./SnykLogo.astro";');
    expect(header).not.toContain("isSnyk2026Design");
    expect(headerInner).toContain("min-height: 4.25rem;");
    expect(header).not.toMatch(
      /html\[data-design-theme="snyk-2026"\][\s\S]*?\.header-inner\s*\{[^}]*flex-wrap:/,
    );

    expect(wordmark).toContain('aria-label="VulnBench home"');
    expect(wordmark.match(/<i><\/i>/g)).toHaveLength(5);
    expect(wordmark).toContain(
      ':global(html[data-design-theme="snyk-2026"]) .wordmark',
    );
    expect(wordmark).toContain("font-weight: var(--font-weight-control, 700);");
  });

  it("keeps the official Snyk logo in a separate branded footer attribution", async () => {
    const [designTheme, footer, logo] = await Promise.all([
      source("src/config/design-theme.ts"),
      source("src/components/site/SiteFooter.astro"),
      source("src/components/site/SnykLogo.astro"),
    ]);

    expect(designTheme).toContain(
      'export const isSnyk2026Design = designTheme === "snyk-2026";',
    );
    expect(designTheme).toContain(
      'favicon: "/brand/snyk-2026/favicon.svg"',
    );
    expect(footer).toContain(
      'import { isSnyk2026Design } from "../../config/design-theme";',
    );
    expect(footer).toContain('import SnykLogo from "./SnykLogo.astro";');
    expect(footer).toMatch(/isSnyk2026Design\s*&&\s*\([\s\S]*?<SnykLogo\s*\/>/);
    expect(footer).toContain('class="snyk-attribution"');
    expect(footer).toContain("A Snyk benchmark initiative");

    expect(logo.match(/<a\b/g)).toHaveLength(1);
    expect(logo).toContain('href="https://snyk.io/"');
    expect(logo).toContain('aria-label="Snyk home"');
    expect(logo).toContain(
      'src="/brand/snyk-2026/logo-snyk-white.png"',
    );
    expect(logo).toContain('alt=""');
    expect(logo).toContain('width="1276"');
    expect(logo).toContain('height="659"');
    expect(logo).toContain("--snyk-wordmark-width: 7.5rem");
    expect(logo).toContain("--snyk-wordmark-width: 8.75rem");
    expect(logo).toContain(
      "--snyk-wordmark-clear-space: calc(var(--snyk-wordmark-width) * 659 / 1276)",
    );
    expect(logo).toContain("padding: var(--snyk-wordmark-clear-space)");
    expect(logo).toContain("width: var(--snyk-wordmark-width)");
    expect(logo).toContain("height: auto");
    expect(logo).not.toMatch(
      /filter|box-shadow|transform|rotate|background\s*:|border\s*:/i,
    );
  });

  it("uses the five-dot VulnBench trace for the branded favicon", async () => {
    const favicon = await source("public/brand/snyk-2026/favicon.svg");

    expect(favicon).toContain("<title>VulnBench finding trace</title>");
    expect(favicon.match(/<circle\b/g)).toHaveLength(5);
    expect(favicon).not.toContain("<path");
    expect(favicon).toContain('fill="#030328"');
    expect(favicon).toContain('stroke="#6F00DD"');
    const lockedPalette = new Set([
      "#030328",
      "#2B0250",
      "#6F00DD",
      "#FF00FF",
      "#F3552E",
      "#FE9104",
      "#FFFFFF",
    ]);
    for (const color of favicon.match(/#[0-9A-Fa-f]{6}/g) ?? []) {
      expect(lockedPalette.has(color.toUpperCase())).toBe(true);
    }
  });

  it("uses one mode-aware, unmodified bottom-right fabric corner", async () => {
    const [fabric, hero] = await Promise.all([
      source("src/components/site/BrandFabric.astro"),
      source("src/components/home/Hero.astro"),
    ]);
    const defaultFabric = selectorBody(fabric, ".brand-fabric");
    const lightFabric = fabric.match(
      /\[data-theme="light"\]\)[\s\S]*?\.brand-fabric\s*\{([^}]+)\}/,
    )?.[1];
    const darkFabric = fabric.match(
      /\[data-theme="dark"\]\)[\s\S]*?\.brand-fabric\s*\{([^}]+)\}/,
    )?.[1];
    const noJavaScriptDarkFabric = fabric.match(
      /:not\(\[data-theme\]\)\)[\s\S]*?\.brand-fabric\s*\{([^}]+)\}/,
    )?.[1];

    expect(fabric.match(/class="brand-fabric"/g)).toHaveLength(1);
    expect(fabric).toContain('aria-hidden="true"');
    expect(fabric).toContain(
      'url("/brand/snyk-2026/BRC_Fabric_NoGradient.png")',
    );
    expect(fabric).toContain(
      'url("/brand/snyk-2026/BRC_Fabric_Gradient.png")',
    );
    expect(fabric).toContain('[data-theme="light"]');
    expect(fabric).toContain('[data-theme="dark"]');
    expect(fabric).toContain(":not([data-theme])");
    expect(fabric).toContain("background-size: contain");
    expect(fabric).toContain("background-position: right bottom");
    expect(fabric).toMatch(/right:\s*0/);
    expect(fabric).toMatch(/bottom:\s*0/);
    expect(defaultFabric).toContain("opacity: 0.16;");
    expect(lightFabric).toContain("opacity: 0.16;");
    expect(darkFabric).toContain("opacity: 1;");
    expect(noJavaScriptDarkFabric).toContain("opacity: 1;");
    expect(fabric).not.toMatch(
      /mask|::before|::after|transform|rotate|background-size:\s*100%\s+100%/i,
    );

    expect(hero).toContain(
      "isSnyk2026Design && <BrandFabric />",
    );
    expect(hero.match(/<BrandFabric\s*\/>/g)).toHaveLength(1);
  });

  it("uses opaque branded header and footer surfaces while retaining Classic rules", async () => {
    const [header, footer] = await Promise.all([
      source("src/components/site/SiteHeader.astro"),
      source("src/components/site/SiteFooter.astro"),
    ]);

    expect(header).toContain(
      "background: color-mix(in srgb, var(--paper) 94%, transparent);",
    );
    expect(footer).toContain("background: var(--paper-muted);");

    const brandedHeader = selectorBody(
      header,
      ':global(html[data-design-theme="snyk-2026"]) .site-header',
    );
    const brandedFooter = selectorBody(
      footer,
      ':global(html[data-design-theme="snyk-2026"]) .site-footer',
    );

    expect(brandedHeader).toContain("background: #030328;");
    expect(brandedHeader).toContain(
      "border-bottom-color: rgba(255, 255, 255, 0.12);",
    );
    expect(brandedFooter).toContain("background: #030328;");
    expect(brandedFooter).toContain(
      "border-top-color: rgba(255, 255, 255, 0.4);",
    );
    expect(brandedFooter).toContain("color: #FFFFFF;");
    expect(brandedHeader).not.toMatch(/color-mix|transparent|backdrop-filter/i);
    expect(brandedFooter).not.toMatch(/color-mix|transparent|backdrop-filter/i);
    expect(footer).not.toContain("BrandFabric");
  });

  it("adds only root-scoped branded hero composition and preserves evidence semantics", async () => {
    const hero = await source("src/components/home/Hero.astro");

    for (const content of [
      "{currentRelease.name}",
      "{currentRelease.researchQuestion}",
      "A repeatability and Snyk-reference agreement study",
      "{currentRelease.links.explore}",
      "{currentRelease.links.paper}",
      "{currentRelease.links.methodology}",
      "{currentRelease.links.data}",
      "<EvidenceStrip evidence={currentRelease.evidence} />",
      "<slot />",
    ]) {
      expect(hero).toContain(content);
    }

    const brandedHero = selectorBody(
      hero,
      ':global(html[data-design-theme="snyk-2026"]) .hero',
    );
    const brandedHeading = selectorBody(
      hero,
      ':global(html[data-design-theme="snyk-2026"]) .hero h1',
    );
    const brandedPanel = selectorBody(
      hero,
      ':global(html[data-design-theme="snyk-2026"]) .hero-visual',
    );

    expect(brandedHero).toContain("position: relative;");
    expect(brandedHero).toContain("isolation: isolate;");
    expect(brandedHeading).toMatch(/font-size:\s*clamp\(/);
    expect(brandedHeading).toContain("font-weight: 700;");
    expect(brandedHeading).toMatch(/line-height:\s*0\.\d+;/);
    expect(brandedHeading).toContain("overflow-wrap: break-word;");
    expect(brandedPanel).toContain("background: #030328;");
    expect(brandedPanel).toContain("border-top:");
    expect(brandedPanel).toContain("border-right:");
    expect(brandedPanel).toContain("border-bottom:");
    expect(brandedPanel).toContain("border-left:");
    expect(hero).toContain('class="brand-gradient-accent"');
    expect(hero).toContain("background: var(--brand-gradient);");
    expect(hero).not.toMatch(
      /radial-gradient|mask-image|mask-composite|background-clip|text-fill-color|backdrop-filter|box-shadow|hero-glow|cta-glow|::before|::after/i,
    );
  });

  it("keeps Snyk Light narrative and explorer copy on white surfaces", async () => {
    const [global, hero, pageHero, explorer] = await Promise.all([
      source("src/styles/global.css"),
      source("src/components/home/Hero.astro"),
      source("src/components/site/PageHero.astro"),
      source("src/components/explorer/ExplorerApp.tsx"),
    ]);

    expect(global).toMatch(
      /\[data-theme="light"\][^}]*\.section\s*\{[^}]*background:\s*#FFFFFF/,
    );
    expect(hero).toMatch(
      /\[data-theme="light"\][^}]*\.hero-copy\s*\{[^}]*background:\s*#FFFFFF/,
    );
    expect(pageHero).toMatch(
      /\[data-theme="light"\][^}]*\.page-hero__copy\s*\{[^}]*background:\s*#FFFFFF/,
    );
    expect(explorer).toMatch(
      /\[data-theme="light"\][^}]*\.explorer-app,[^}]*\.explorer-canvas\s*\{[^}]*background:\s*#FFFFFF/,
    );
    expect(pageHero).toContain('class="brand-gradient-accent"');
  });
});
