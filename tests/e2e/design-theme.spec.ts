import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { auditText } from "../../scripts/check-snyk-brand.mjs";
import {
  expectTheme,
  prepareTheme,
  THEME_KEY,
  themeToggle,
} from "./support/theme";

const BRAND_THEME_COLORS = {
  light: "#FFFFFF",
  dark: "#030328",
} as const;
const MIDNIGHT = "rgb(3, 3, 40)";
const WHITE = "rgb(255, 255, 255)";
const PURPLE = "rgb(111, 0, 221)";
const HOT_PINK = "rgb(255, 0, 255)";
const ORANGE_RED = "rgb(243, 85, 46)";
const AMBER = "rgb(254, 145, 4)";
const STRONG_RULE = "rgba(3, 3, 40, 0.48)";
const DARK_RAISED = "rgba(255, 255, 255, 0.08)";
const DARK_MUTED = "rgba(255, 255, 255, 0.04)";
const DARK_PRIMARY = "rgba(255, 255, 255, 0.78)";
const DARK_BODY = "rgba(255, 255, 255, 0.65)";
const DARK_TERTIARY = "rgba(255, 255, 255, 0.5)";
const DARK_STRONG_RULE = "rgba(255, 255, 255, 0.4)";
const BRAND_GRADIENT =
  "linear-gradient(90deg, rgb(43, 2, 80) 0%, rgb(111, 0, 221) 6%, rgb(255, 0, 255) 30%, rgb(243, 85, 46) 66%, rgb(254, 145, 4) 100%)";

function relativeLuminance(red: number, green: number, blue: number) {
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

function contrastOnWhite(color: string) {
  const channels = color.match(/[\d.]+/gu)?.map(Number) ?? [];
  const [red, green, blue, alpha = 1] = channels;
  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Unable to parse color ${color}`);
  }
  const composite = [red, green, blue].map((channel) =>
    Math.round(channel * alpha + 255 * (1 - alpha)),
  );
  const foreground = relativeLuminance(
    composite[0] ?? 0,
    composite[1] ?? 0,
    composite[2] ?? 0,
  );
  return (1.05) / (foreground + 0.05);
}

function rgbaChannels(color: string) {
  const channels = color.match(/[\d.]+/gu)?.map(Number) ?? [];
  const [red, green, blue, alpha = 1] = channels;
  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Unable to parse color ${color}`);
  }
  return { alpha, blue, green, red };
}

function compositeColor(foreground: string, background: string) {
  const front = rgbaChannels(foreground);
  const back = rgbaChannels(background);
  return [front.red, front.green, front.blue].map((channel, index) => {
    const backChannel = [back.red, back.green, back.blue][index] ?? 0;
    return Math.round(channel * front.alpha + backChannel * (1 - front.alpha));
  }) as [number, number, number];
}

function contrastBetween(foreground: string, background: string) {
  const backdrop = compositeColor(background, MIDNIGHT);
  const front = rgbaChannels(foreground);
  const rendered = [front.red, front.green, front.blue].map((channel, index) =>
    Math.round(channel * front.alpha + (backdrop[index] ?? 0) * (1 - front.alpha)),
  ) as [number, number, number];
  const foregroundLuminance = relativeLuminance(...rendered);
  const backgroundLuminance = relativeLuminance(...backdrop);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

async function expectOneVisibleBrandGradient(
  page: import("@playwright/test").Page,
) {
  const matches = await page.evaluate((gradient) => {
    return [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.backgroundImage === gradient &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => ({
        className: element.className,
        gradient: getComputedStyle(element).backgroundImage,
      }));
  }, BRAND_GRADIENT);

  expect(matches).toEqual([
    expect.objectContaining({
      className: expect.stringContaining("brand-gradient-accent"),
      gradient: BRAND_GRADIENT,
    }),
  ]);
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test.describe("Snyk 2026 color mode contract", () => {
  for (const systemColorMode of ["light", "dark"] as const) {
    test(`defaults branded mode to Light with system ${systemColorMode}`, async ({
      page,
    }) => {
      await prepareTheme(page, systemColorMode);
      await page.goto("/");

      await expect(page.locator("html")).toHaveAttribute(
        "data-design-theme",
        "snyk-2026",
      );
      await expectTheme(page, "light", BRAND_THEME_COLORS.light);
      await expect(themeToggle(page, "dark")).toBeVisible();
    });
  }

  test("keeps the Light toggle icon visible when hovered", async ({ page }) => {
    await prepareTheme(page, "light");
    await page.goto("/");

    const toggle = themeToggle(page, "dark");
    await toggle.hover();

    await expect(toggle).toHaveCSS("background-color", WHITE);
    await expect(toggle).toHaveCSS("color", MIDNIGHT);
    await expect(toggle.locator(".moon-icon")).toBeVisible();
  });

  test("gives a saved mode precedence and persists a new explicit choice", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: THEME_KEY, value: "light" },
    );
    await page.reload();
    await expectTheme(page, "light", BRAND_THEME_COLORS.light);

    await themeToggle(page, "dark").click();
    await expectTheme(page, "dark", BRAND_THEME_COLORS.dark);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe(
      "dark",
    );

    await page.reload();
    await expectTheme(page, "dark", BRAND_THEME_COLORS.dark);
  });
});

test("keeps branded Light default and explicit Dark accessible", async ({
  page,
}) => {
  await prepareTheme(page, "dark");
  await page.goto("/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await themeToggle(page, "dark").click();
  await expectTheme(page, "dark", BRAND_THEME_COLORS.dark);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("uses the approved local Geist hierarchy without third-party font requests", async ({
  page,
}) => {
  const thirdPartyRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.hostname !== "127.0.0.1") {
      thirdPartyRequests.push(request.url());
    }
  });

  await prepareTheme(page, "light", "light");
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const typography = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    bodyWeight: getComputedStyle(document.body).fontWeight,
    eyebrow: getComputedStyle(
      document.querySelector(".eyebrow") as HTMLElement,
    ).fontFamily,
    eyebrowWeight: getComputedStyle(
      document.querySelector(".eyebrow") as HTMLElement,
    ).fontWeight,
    h1Weight: getComputedStyle(document.querySelector("h1") as HTMLElement)
      .fontWeight,
    h2Weight: getComputedStyle(document.querySelector("h2") as HTMLElement)
      .fontWeight,
    metric: getComputedStyle(
      document.querySelector(".metric") as HTMLElement,
    ).fontFamily,
    navWeight: getComputedStyle(
      document.querySelector(".desktop-nav a") as HTMLElement,
    ).fontWeight,
    buttonWeight: getComputedStyle(
      document.querySelector(".button") as HTMLElement,
    ).fontWeight,
  }));

  expect(typography.body).toMatch(/^"Geist Variable"/);
  expect(typography.bodyWeight).toBe("400");
  expect(typography.eyebrow).toMatch(/^"Geist Mono Variable"/);
  expect(typography.eyebrowWeight).toBe("500");
  expect(typography.h1Weight).toBe("700");
  expect(typography.h2Weight).toBe("500");
  expect(typography.metric).toMatch(/^"Geist Mono Variable"/);
  expect(typography.navWeight).toBe("500");
  expect(typography.buttonWeight).toBe("500");
  expect(thirdPartyRequests).toEqual([]);

  await page.goto("/releases/js-1.0");
  await expect(page.locator("article h3").first()).toHaveCSS("font-weight", "500");
  await expect(page.locator(".release-meta dd:not(.metric)").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".release-meta-panel nav")).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".case-tag").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".evidence-scatter__plot .chart-title").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".evidence-scatter__legend button").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/releases/js-1.0/explore");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });
  await expect(page.locator(".explorer-tabs button").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".explorer-guide dd").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".explorer-guide nav a").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".explorer-header dd").first()).toHaveCSS(
    "font-weight",
    "700",
  );
  await expect(page.locator(".evidence-scatter__exports button").first()).toHaveCSS(
    "font-weight",
    "500",
  );
});

for (const colorMode of ["light", "dark"] as const) {
  test(`keeps VulnBench primary and the official logo in the ${colorMode} footer`, async ({
    page,
  }) => {
    await prepareTheme(page, colorMode, colorMode);
    await page.goto("/");

    const header = page.locator(".site-header");
    await expect(
      header.getByRole("link", { name: "VulnBench home" }),
    ).toBeVisible();
    await expect(
      header.getByRole("link", { name: "Snyk home" }),
    ).toHaveCount(0);

    const logo = page
      .locator(".site-footer")
      .getByRole("link", { name: "Snyk home" });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "https://snyk.io/");
    await expect(logo.locator("img")).toHaveAttribute(
      "src",
      "/brand/snyk-2026/logo-snyk-white.png",
    );
    await expect(logo.locator("img")).toHaveCount(1);

    const fabric = page.locator(".brand-fabric");
    await expect(fabric).toHaveCount(1);
    await expect(fabric).toBeVisible();
    await expect(fabric).toHaveCSS(
      "background-image",
      new RegExp(
        colorMode === "light"
          ? "BRC_Fabric_NoGradient\\.png"
          : "BRC_Fabric_Gradient\\.png",
      ),
    );
  });
}

test("uses a conventional Light canvas with one contained gradient accent", async ({
  page,
}) => {
  await prepareTheme(page, "light", "light");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await expect(page.locator("html")).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator("html")).toHaveCSS("background-image", "none");
  await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
  await expect(page.locator(".brand-gradient-accent")).toHaveCSS(
    "background-image",
    /linear-gradient\(90deg,\s*rgb\(43, 2, 80\) 0%,\s*rgb\(111, 0, 221\) 6%,\s*rgb\(255, 0, 255\) 30%,\s*rgb\(243, 85, 46\) 66%,\s*rgb\(254, 145, 4\) 100%\)/,
  );
  await expect(page.locator(".brand-gradient-accent")).toHaveCSS(
    "height",
    "4.79688px",
  );
  await expect(page.locator(".hero-copy")).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator(".hero-copy")).toHaveCSS(
    "color",
    MIDNIGHT,
  );
  await expect(page.locator(".section").first()).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator(".evidence-band")).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator(".evidence-band")).toHaveCSS("color", MIDNIGHT);
  await expect(page.locator(".brand-fabric")).toHaveCSS("opacity", "0.16");
  await expect(page.locator(".recurrence-plot")).toHaveCSS(
    "background-color",
    MIDNIGHT,
  );
  await expect(page.locator(".recurrence-plot__bar--matchedAllFive")).toHaveCSS(
    "color",
    PURPLE,
  );
  await expect(page.locator(".recurrence-plot__bar--unmatchedAllFive")).toHaveCSS(
    "color",
    ORANGE_RED,
  );
  await expect(page.locator(".recurrence-chart__inspect").first()).toHaveCSS(
    "color",
    HOT_PINK,
  );
  await expectNoHorizontalOverflow(page);

  await page.goto("/releases/js-1.0");
  await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
  await expect(page.locator(".page-hero__copy")).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator(".page-hero__copy")).toHaveCSS("color", MIDNIGHT);
  await expect(page.locator(".section").first()).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator(".recurrence-chart__inspect").first()).toHaveCSS(
    "color",
    PURPLE,
  );

  await page.goto("/releases/js-1.0/explore?v=1&view=coverage&metric=unmatched");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });

  await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
  await expect(page.locator(".page-hero__copy")).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator(".explorer-app")).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator(".explorer-canvas")).toHaveCSS(
    "background-color",
    WHITE,
  );
  await expect(page.locator(".explorer-app")).toHaveCSS("color", MIDNIGHT);
  await expect(page.locator(".explorer-note").first()).toHaveCSS(
    "border-left-color",
    AMBER,
  );
  await expectNoHorizontalOverflow(page);
});

test("uses neutral Warm Ink layers and restrained semantic color in explicit Dark", async ({
  page,
}) => {
  await prepareTheme(page, "dark", "dark");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  const tokens = await page.locator("html").evaluate((element) => {
    const style = getComputedStyle(element);
    return Object.fromEntries(
      [
        "--paper",
        "--paper-raised",
        "--paper-muted",
        "--ink",
        "--ink-soft",
        "--ink-faint",
        "--rule-strong",
        "--matched",
        "--theme-matched-text",
        "--unmatched",
        "--warning",
        "--evidence-hover",
        "--theme-export-surface",
        "--theme-export-text",
      ].map((token) => [token, style.getPropertyValue(token).trim()]),
    );
  });
  expect(tokens).toEqual({
    "--paper": "#030328",
    "--paper-raised": DARK_RAISED,
    "--paper-muted": DARK_MUTED,
    "--ink": DARK_PRIMARY,
    "--ink-soft": DARK_BODY,
    "--ink-faint": DARK_TERTIARY,
    "--rule-strong": DARK_STRONG_RULE,
    "--matched": "#6F00DD",
    "--theme-matched-text": DARK_PRIMARY,
    "--unmatched": "#F3552E",
    "--warning": "#FE9104",
    "--evidence-hover": "rgba(255, 255, 255, 0.12)",
    "--theme-export-surface": "#030328",
    "--theme-export-text": "#FFFFFF",
  });
  await expect(page.locator(".hero h1")).toHaveCSS("color", WHITE);
  await expect(page.locator("body")).toHaveCSS("font-weight", "400");
  await expect(page.locator(".hero-visual h2")).toHaveCSS("font-weight", "500");
  await expect(page.locator(".button").first()).toHaveCSS("font-weight", "500");
  await expect(page.locator(".hero .lede")).toHaveCSS("color", DARK_BODY);
  await expect(page.locator(".hero-visual")).toHaveCSS(
    "background-color",
    DARK_RAISED,
  );
  await expect(page.locator(".hero-visual h2")).toHaveCSS(
    "color",
    DARK_PRIMARY,
  );
  await expect(page.locator(".publication")).toHaveCSS(
    "background-color",
    DARK_RAISED,
  );
  await expect(page.locator(".brand-fabric")).toHaveCSS("opacity", "0.16");
  await expect(page.locator(".brand-gradient-accent")).toHaveCSS("height", "1px");
  const primaryButton = page.locator(".button").first();
  await primaryButton.focus();
  await expect(primaryButton).toBeFocused();
  await expect(primaryButton).toHaveCSS(
    "box-shadow",
    "rgb(111, 0, 221) 0px 0px 0px 3px, rgb(255, 255, 255) 0px 0px 0px 6px",
  );
  expect(contrastBetween(WHITE, MIDNIGHT)).toBeGreaterThanOrEqual(3);
  expect(contrastBetween(WHITE, DARK_RAISED)).toBeGreaterThanOrEqual(3);
  const evidenceColors = await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>(".evidence-band");
    const matched = document.querySelector<HTMLElement>(
      ".evidence-band .observation.matched .metric",
    );
    const unmatched = document.querySelector<HTMLElement>(
      ".evidence-band .observation.unmatched .metric",
    );
    if (!surface || !matched || !unmatched) {
      throw new Error("Homepage evidence colors are incomplete");
    }
    return {
      background: getComputedStyle(surface).backgroundColor,
      matched: getComputedStyle(matched).color,
      unmatched: getComputedStyle(unmatched).color,
    };
  });
  expect(evidenceColors).toEqual({
    background: DARK_RAISED,
    matched: DARK_PRIMARY,
    unmatched: ORANGE_RED,
  });
  expect(
    contrastBetween(evidenceColors.matched, evidenceColors.background),
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    contrastBetween(evidenceColors.unmatched, evidenceColors.background),
  ).toBeGreaterThanOrEqual(4.5);
  await expect(
    page.locator(".recurrence-plot__bar--matchedAllFive"),
  ).toHaveCSS("color", PURPLE);
  const inspectColor = await page
    .locator(".recurrence-chart__inspect")
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  expect(inspectColor).toBe(DARK_PRIMARY);
  expect(inspectColor).not.toBe(HOT_PINK);
  expect(contrastBetween(inspectColor, MIDNIGHT)).toBeGreaterThanOrEqual(4.5);
  await expect(
    page.getByRole("img", {
      name: "Finding recurrence contrast. Reference-matched findings were more likely to recur in all five runs than unmatched findings.",
    }),
  ).toBeVisible();
  await expectOneVisibleBrandGradient(page);

  await page.goto("/releases/js-1.0");
  await expect(page.locator(".page-hero h1")).toHaveCSS("color", WHITE);
  await expect(page.locator(".page-hero .lede")).toHaveCSS("color", DARK_BODY);
  await expect(page.locator(".page-hero aside")).toHaveCSS(
    "background-color",
    DARK_MUTED,
  );
  await expect(page.locator(".efficiency")).toHaveCSS(
    "background-color",
    DARK_RAISED,
  );
  await expect(page.locator(".release-meta dt").first()).toHaveCSS(
    "color",
    DARK_TERTIARY,
  );
  await expect(page.locator(".release-meta dt").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".release-meta dd:not(.metric)").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".evidence-scatter__plot").first()).toHaveCSS(
    "background-color",
    DARK_RAISED,
  );
  await expect(
    page.locator(".evidence-scatter__legend button").nth(1),
  ).toHaveCSS("background-color", DARK_RAISED);
  await expect(
    page.locator(".evidence-scatter__legend button").first(),
  ).toHaveCSS("font-weight", "500");
  await expect(page.locator(".evidence-scatter th").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await page
    .locator(".evidence-scatter__legend button")
    .nth(1)
    .hover();
  await expect(
    page.locator(".evidence-scatter__legend button").nth(1),
  ).toHaveCSS("background-color", "rgba(255, 255, 255, 0.12)");
  await expectOneVisibleBrandGradient(page);

  await page.goto("/releases/js-1.0/explore?v=1&view=coverage&metric=unmatched");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });
  await expect(page.locator(".explorer-header")).toHaveCSS(
    "background-color",
    DARK_RAISED,
  );
  await expect(page.locator(".explorer-tabs")).toHaveCSS(
    "background-color",
    DARK_MUTED,
  );
  await expect(page.locator(".filter-rail")).toHaveCSS(
    "background-color",
    DARK_MUTED,
  );
  await expect(page.locator(".explorer-guide")).toHaveCSS(
    "background-color",
    DARK_MUTED,
  );
  await expect(page.locator(".explorer-guide section").first()).toHaveCSS(
    "background-color",
    DARK_RAISED,
  );
  await expect(page.locator(".explorer-guide dt").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".explorer-guide dd").first()).toHaveCSS(
    "font-weight",
    "500",
  );
  await expect(page.locator(".explorer-note").first()).toHaveCSS(
    "border-left-color",
    AMBER,
  );
  await expect(page.locator(".coverage-cell").first()).not.toHaveCSS(
    "background-color",
    "rgb(43, 2, 80)",
  );
  await expectOneVisibleBrandGradient(page);
  await expectNoHorizontalOverflow(page);
});

test("renders exactly one visible exact Brand Gradient accent per Light page", async ({
  page,
}) => {
  await prepareTheme(page, "light", "light");

  for (const path of [
    "/",
    "/releases/js-1.0",
    "/releases/js-1.0/explore?v=1&view=coverage&metric=unmatched",
  ]) {
    await page.goto(path);
    await expectOneVisibleBrandGradient(page);
  }
});

test("keeps representative Light control boundaries above 3:1", async ({
  page,
}) => {
  await prepareTheme(page, "light", "light");
  await page.goto("/releases/js-1.0");

  const token = await page.locator("html").evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--rule-strong").trim(),
  );
  expect(token).toBe(STRONG_RULE);
  expect(contrastOnWhite(token)).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".evidence-scatter__plot").first()).toHaveCSS(
    "border-top-color",
    STRONG_RULE,
  );

  await page.goto("/releases/js-1.0/explore?v=1&view=coverage");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });
  await expect(page.locator(".explorer-table-scroll").first()).toHaveCSS(
    "border-top-color",
    STRONG_RULE,
  );
});

test("locks Snyk 2026 Light coverage cells to visible discrete Purple-alpha bands", async ({
  page,
}) => {
  await prepareTheme(page, "light", "light");
  await page.goto("/releases/js-1.0/explore?v=1&view=coverage&metric=recall");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });

  const coverageCells = page.locator("td.coverage-cell");
  await coverageCells.first().waitFor();
  const presentation = await coverageCells.evaluateAll((cells) => {
      const samples = cells.map((cell) => {
        const element = cell as HTMLElement;
        const band = [...element.classList].find((name) =>
          name.startsWith("coverage-cell--heatmap-"),
        );
        return {
          background: getComputedStyle(element).backgroundColor,
          band,
          mix: element.style.getPropertyValue("--coverage-heatmap-mix"),
          text: element.querySelector("strong")?.textContent?.trim() ?? "",
        };
      });
      const pair = samples.flatMap((left, index) =>
        samples
          .slice(index + 1)
          .filter(
            (right) =>
              left.band &&
              left.band === right.band &&
              left.mix &&
              right.mix &&
              left.mix !== right.mix,
          )
          .map((right) => [left, right] as const),
      )[0];
      return { pair, samples };
    });

  expect(presentation.pair).toBeDefined();
  expect(presentation.pair?.[0].background).toBe(
    presentation.pair?.[1].background,
  );
  const exactBands = await page.evaluate(() => {
    return [0, 1, 2, 3, 4].map((band) => {
      const sample = document.createElement("div");
      sample.className = `coverage-cell--heatmap-${band}`;
      document.body.append(sample);
      const style = getComputedStyle(sample);
      const result = {
        background: style.backgroundColor,
        color: style.color,
      };
      sample.remove();
      return result;
    });
  });
  expect(exactBands).toEqual([
    { background: "rgba(111, 0, 221, 0.04)", color: MIDNIGHT },
    { background: "rgba(111, 0, 221, 0.08)", color: MIDNIGHT },
    { background: "rgba(111, 0, 221, 0.12)", color: MIDNIGHT },
    { background: "rgba(111, 0, 221, 0.18)", color: MIDNIGHT },
    { background: "rgba(111, 0, 221, 0.24)", color: MIDNIGHT },
  ]);
  await expect(
    page.getByRole("table", { name: "Vulnerability class coverage matrix" }),
  ).toBeVisible();
});

for (const { width, minimum } of [
  { width: 320, minimum: 120 },
  { width: 1440, minimum: 140 },
]) {
  test(`keeps the footer Snyk wordmark clear and separate at ${width}px`, async ({
    page,
  }) => {
    await prepareTheme(page, "light", "light");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const geometry = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>(
        ".site-footer .snyk-logo",
      );
      const image = link?.querySelector("img");
      const attribution = link?.closest<HTMLElement>(".snyk-attribution");
      const initiativeText =
        attribution?.querySelector<HTMLElement>(".eyebrow");
      if (!link || !image || !attribution || !initiativeText) {
        throw new Error("Branded footer attribution geometry is incomplete");
      }
      const linkRect = link.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const attributionRect = attribution.getBoundingClientRect();
      const initiativeRect = initiativeText.getBoundingClientRect();
      const separated =
        linkRect.right <= initiativeRect.left ||
        initiativeRect.right <= linkRect.left ||
        linkRect.bottom <= initiativeRect.top ||
        initiativeRect.bottom <= linkRect.top;
      return {
        imageWidth: imageRect.width,
        imageHeight: imageRect.height,
        clearTop: imageRect.top - linkRect.top,
        clearLeft: imageRect.left - linkRect.left,
        clearBottom: linkRect.bottom - imageRect.bottom,
        clearRight: linkRect.right - imageRect.right,
        containedTop: linkRect.top - attributionRect.top,
        containedLeft: linkRect.left - attributionRect.left,
        containedBottom: attributionRect.bottom - linkRect.bottom,
        containedRight: attributionRect.right - linkRect.right,
        initiativeVisible:
          initiativeRect.width > 0 && initiativeRect.height > 0,
        separated,
      };
    });

    expect(geometry.imageWidth).toBeGreaterThanOrEqual(minimum);
    for (const clearance of [
      geometry.clearTop,
      geometry.clearLeft,
      geometry.clearBottom,
      geometry.clearRight,
    ]) {
      expect(clearance).toBeGreaterThanOrEqual(geometry.imageHeight - 0.5);
    }
    for (const containment of [
      geometry.containedTop,
      geometry.containedLeft,
      geometry.containedBottom,
      geometry.containedRight,
    ]) {
      expect(containment).toBeGreaterThanOrEqual(-0.5);
    }
    expect(geometry.initiativeVisible).toBe(true);
    expect(geometry.separated).toBe(true);
    await expectNoHorizontalOverflow(page);
  });
}

test("publishes branded favicon and default social metadata assets", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/brand/snyk-2026/favicon.svg",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://vulnbench.com/brand/snyk-2026/social.png",
  );
  await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute(
    "content",
    "image/png",
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
    "content",
    "630",
  );

  const faviconResponse = await request.get(
    "/brand/snyk-2026/favicon.svg",
  );
  expect(faviconResponse.status()).toBe(200);
  const favicon = await faviconResponse.text();
  expect(favicon.match(/<circle\b/g)).toHaveLength(5);
  expect(favicon).not.toContain("<path");

  for (const path of [
    "/brand/snyk-2026/social.svg",
    "/brand/snyk-2026/social.png",
    "/brand/snyk-2026/logo-snyk-white.png",
    "/brand/snyk-2026/BRC_Fabric_NoGradient.png",
    "/brand/snyk-2026/BRC_Fabric_Gradient.png",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test("exports self-contained audited chart SVGs in explicit Light and Dark", async ({
  context,
  page,
}) => {
  await prepareTheme(page, "light", "light");
  await page.goto("/releases/js-1.0/explore");
  await page
    .locator('astro-island[component-export="ExplorerApp"]:not([ssr])')
    .waitFor({ state: "attached" });

  for (const mode of ["light", "dark"] as const) {
    if (mode === "dark") {
      await themeToggle(page, "dark").click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    }

    const svgDownload = page.waitForEvent("download");
    await page
      .getByRole("img", { name: "Agreement versus repeated-run variance" })
      .locator("..")
      .getByRole("button", { name: "Export SVG" })
      .click();
    const download = await svgDownload;
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const svg = await readFile(downloadPath as string, "utf8");
    const background = svg.match(
      /<rect data-export-background="" width="100%" height="100%" fill="([^"]+)"/u,
    )?.[1];

    expect(background).toBe(mode === "light" ? "#FFFFFF" : "#030328");
    expect(svg).toContain("#6F00DD");
    expect(svg).toContain(mode === "light" ? MIDNIGHT : "#FFFFFF");
    expect(svg).toContain("Geist Variable");
    expect(svg).toContain("Geist Mono Variable");
    expect(svg).not.toContain("var(--");
    expect(svg).not.toMatch(/(?:fill|stroke)-opacity="0\./u);
    const exportedTextTags = svg.match(/<text\b[^>]*>/gu) ?? [];
    expect(exportedTextTags.length).toBeGreaterThan(0);
    expect(exportedTextTags.filter((tag) => tag.includes("rgba("))).toEqual([]);
    expect(
      auditText(svg, {
        fileName: `${mode}-${download.suggestedFilename()}`,
        checkOverflowGuard: false,
      }),
    ).toEqual([]);

    const renderPage = await context.newPage();
    await renderPage.setContent(svg);
    const readback = await renderPage.evaluate(() => {
      const backgroundRect = document.querySelector<SVGElement>(
        "[data-export-background]",
      );
      const text = document.querySelector<SVGTextElement>("text");
      const marker = document.querySelector<SVGTextElement>(
        "[data-configuration]",
      );
      if (!backgroundRect || !text || !marker) {
        throw new Error("Rendered export is incomplete");
      }
      return {
        background: getComputedStyle(backgroundRect).fill,
        markerOpacity: getComputedStyle(marker).fillOpacity,
        text: getComputedStyle(text).fill,
        textOpacity: getComputedStyle(text).fillOpacity,
      };
    });
    expect(readback.background).toBe(mode === "light" ? WHITE : MIDNIGHT);
    expect(readback.markerOpacity).toBe("1");
    expect(readback.textOpacity).toBe("1");
    expect(
      mode === "light"
        ? contrastOnWhite(readback.text)
        : contrastBetween(readback.text, MIDNIGHT),
    ).toBeGreaterThanOrEqual(4.5);
    await renderPage.close();
  }
});

test("keeps representative explorer layouts usable without page overflow", async ({
  page,
}) => {
  await prepareTheme(page, "dark", "dark");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    "/releases/js-1.0/explore?v=1&view=coverage&metric=unmatched",
  );
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });

  await expect(page.locator(".filter-rail")).toBeVisible();
  await expect(page.locator(".explorer-guide")).toBeVisible();
  expect(
    await page.locator(".explorer-app__layout").evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean)
        .length,
    ),
  ).toBe(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".explorer-mobile-bar")).toBeVisible();
  await expect(page.locator(".explorer-guide")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test.describe("Snyk 2026 without JavaScript in system Light", () => {
  test.use({
    colorScheme: "light",
    javaScriptEnabled: false,
  });

  test("keeps complete copy and analysis on the white analytical canvas", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.locator("html")).toHaveCSS("background-color", WHITE);
    await expect(page.locator("html")).toHaveCSS("background-image", "none");
    await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
    await expect(page.locator(".hero-copy")).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(page.locator(".hero-copy")).toHaveCSS(
      "color",
      MIDNIGHT,
    );
    await expect(page.locator(".section").first()).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(page.locator(".brand-fabric")).toHaveCSS("opacity", "0.16");
    await expect(page.locator("[data-theme-toggle]")).toBeHidden();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Can LLMs find the same bugs twice?",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore the results" }),
    ).toBeVisible();
    await expect(page.locator(".evidence-strip")).toContainText("300");
    await expect(page.locator(".evidence-strip")).toContainText("scans");
    await expectNoHorizontalOverflow(page);

    await page.goto("/releases/js-1.0/explore");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.locator("html")).toHaveCSS("background-color", WHITE);
    await expect(page.locator("html")).toHaveCSS("background-image", "none");
    await expect(page.locator(".brand-gradient-accent")).toBeVisible();
    await expect(page.locator(".brand-gradient-accent")).toHaveCSS(
      "height",
      "4.79688px",
    );
    await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
    await expect(page.locator(".page-hero__copy")).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(page.locator(".page-hero__copy")).toHaveCSS(
      "color",
      MIDNIGHT,
    );
    await expect(page.locator(".explorer-app")).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(page.locator(".explorer-canvas")).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Test the published conclusions against the evidence",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "JS 1.0 explorer" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Configuration summary" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("Snyk 2026 without JavaScript in system Dark", () => {
  test.use({
    colorScheme: "dark",
    javaScriptEnabled: false,
  });

  test("keeps complete copy and analysis on the white analytical canvas", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute(
      "data-design-theme",
      "snyk-2026",
    );
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(page.locator("html")).toHaveCSS("background-color", WHITE);
    await expect(page.locator("html")).toHaveCSS("background-image", "none");
    await expect(page.locator(".brand-gradient-accent")).toBeVisible();
    await expect(page.locator(".brand-gradient-accent")).toHaveCSS(
      "height",
      "4.79688px",
    );
    await expect(page.locator(".brand-fabric")).toHaveCSS("opacity", "0.16");
    await expect(page.locator(".brand-fabric")).toHaveCSS(
      "background-image",
      /BRC_Fabric_NoGradient\.png/,
    );
    await expect(page.locator(".hero h1")).toHaveCSS("color", MIDNIGHT);
    await expect(page.locator(".hero-visual")).toHaveCSS(
      "background-color",
      MIDNIGHT,
    );
    await expect(page.locator(".hero-copy")).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(page.locator(".hero-copy")).toHaveCSS("color", MIDNIGHT);
    await expect(page.locator(".section").first()).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(page.locator(".publication")).toHaveCSS(
      "background-color",
      "rgba(111, 0, 221, 0.08)",
    );
    const inspectColor = await page
      .locator(".recurrence-chart__inspect")
      .first()
      .evaluate((element) => getComputedStyle(element).color);
    expect(inspectColor).toBe(HOT_PINK);
    await expect(page.locator("[data-theme-toggle]")).toBeHidden();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Can LLMs find the same bugs twice?",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore the results" }),
    ).toBeVisible();
    const noJsPrimaryControl = page.getByRole("link", {
      name: "Explore the results",
    });
    await noJsPrimaryControl.focus();
    await expect(noJsPrimaryControl).toBeFocused();
    await expect(noJsPrimaryControl).toHaveCSS(
      "box-shadow",
      "rgb(255, 255, 255) 0px 0px 0px 3px, rgb(111, 0, 221) 0px 0px 0px 6px",
    );
    await expect(page.locator(".evidence-strip")).toContainText("300");
    await expect(page.locator(".evidence-strip")).toContainText("scans");
    await expectNoHorizontalOverflow(page);

    await page.goto("/releases/js-1.0");

    await expect(page.locator(".efficiency")).toHaveCSS(
      "background-color",
      WHITE,
    );

    await page.goto("/releases/js-1.0/explore");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.locator("html")).toHaveCSS("background-color", WHITE);
    await expect(page.locator("html")).toHaveCSS("background-image", "none");
    await expect(page.locator(".page-hero__copy")).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(page.locator(".page-hero__copy")).toHaveCSS("color", MIDNIGHT);
    await expect(page.locator(".explorer-app")).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expect(page.locator(".explorer-canvas")).toHaveCSS(
      "background-color",
      WHITE,
    );
    await expectOneVisibleBrandGradient(page);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Test the published conclusions against the evidence",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Configuration summary" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
