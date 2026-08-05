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
  it("selects the official Snyk identity without changing the Classic wordmark", async () => {
    const [designTheme, header, logo, classicWordmark] = await Promise.all([
      source("src/config/design-theme.ts"),
      source("src/components/site/SiteHeader.astro"),
      source("src/components/site/SnykLogo.astro"),
      source("src/components/site/Wordmark.astro"),
    ]);

    expect(designTheme).toContain(
      'export const isSnyk2026Design = designTheme === "snyk-2026";',
    );
    expect(header).toContain('import SnykLogo from "./SnykLogo.astro";');
    expect(header).toContain('import Wordmark from "./Wordmark.astro";');
    expect(header).toMatch(
      /isSnyk2026Design\s*\?\s*<SnykLogo\s*\/>\s*:\s*<Wordmark\s*\/>/,
    );
    expect(classicWordmark).toContain('aria-label="VulnBench home"');

    expect(logo.match(/<a\b/g)).toHaveLength(1);
    expect(logo).toContain('href="/"');
    expect(logo).toContain('aria-label="Snyk home"');
    expect(logo).toContain(
      'src="/brand/snyk-2026/logo-snyk-white.png"',
    );
    expect(logo).toContain('alt=""');
    expect(logo).toContain('width="1276"');
    expect(logo).toContain('height="659"');
    expect(logo).toContain("--snyk-wordmark-height:");
    expect(logo).toContain("padding: var(--snyk-wordmark-height)");
    expect(logo).toContain("height: var(--snyk-wordmark-height)");
    expect(logo).toContain("width: auto");
    expect(logo).not.toMatch(
      /filter|box-shadow|transform|rotate|background\s*:|border\s*:/i,
    );
  });

  it("uses one mode-aware, unmodified bottom-right fabric corner", async () => {
    const [fabric, hero] = await Promise.all([
      source("src/components/site/BrandFabric.astro"),
      source("src/components/home/Hero.astro"),
    ]);

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
    expect(hero).not.toMatch(
      /radial-gradient|mask-image|mask-composite|background-clip|text-fill-color|backdrop-filter|box-shadow|hero-glow|cta-glow|::before|::after/i,
    );
  });
});
