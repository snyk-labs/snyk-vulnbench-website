import { readFile } from "node:fs/promises";
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
const ORANGE_RED = "rgb(243, 85, 46)";
const AMBER = "rgb(254, 145, 4)";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test.describe("Snyk 2026 color mode contract", () => {
  for (const colorMode of ["light", "dark"] as const) {
    test(`initializes branded ${colorMode} mode from the system preference`, async ({
      page,
    }) => {
      await prepareTheme(page, colorMode);
      await page.goto("/");

      await expect(page.locator("html")).toHaveAttribute(
        "data-design-theme",
        "snyk-2026",
      );
      await expectTheme(page, colorMode, BRAND_THEME_COLORS[colorMode]);
      await expect(
        themeToggle(page, colorMode === "light" ? "dark" : "light"),
      ).toBeVisible();
    });
  }

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

  await page.goto("/releases/js-1.0/explore");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });
  await expect(page.locator(".explorer-tabs button").first()).toHaveCSS(
    "font-weight",
    "500",
  );
});

for (const colorMode of ["light", "dark"] as const) {
  test(`shows one official logo and the ${colorMode} fabric asset`, async ({
    page,
  }) => {
    await prepareTheme(page, colorMode, colorMode);
    await page.goto("/");

    const logo = page.getByRole("link", { name: "Snyk home" });
    await expect(logo).toBeVisible();
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
  await expect(page.locator(".hero-copy")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".hero-copy")).toHaveCSS(
    "color",
    MIDNIGHT,
  );
  await expect(page.locator(".section").first()).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
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
  await expectNoHorizontalOverflow(page);

  await page.goto("/releases/js-1.0");
  await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
  await expect(page.locator(".page-hero__copy")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".page-hero__copy")).toHaveCSS("color", MIDNIGHT);
  await expect(page.locator(".section").first()).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );

  await page.goto("/releases/js-1.0/explore?v=1&view=coverage&metric=unmatched");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });

  await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
  await expect(page.locator(".page-hero__copy")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".explorer-app")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".explorer-canvas")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".explorer-app")).toHaveCSS("color", MIDNIGHT);
  await expect(page.locator(".explorer-note").first()).toHaveCSS(
    "border-left-color",
    AMBER,
  );
  await expectNoHorizontalOverflow(page);
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
  expect(
    presentation.samples.every(({ background }) =>
      /^rgba?\(111, 0, 221(?:, 0\.\d+)?\)$/u.test(background),
    ),
  ).toBe(true);
  await expect(
    page.getByRole("table", { name: "Vulnerability class coverage matrix" }),
  ).toBeVisible();
});

for (const { width, minimum } of [
  { width: 320, minimum: 120 },
  { width: 1440, minimum: 140 },
]) {
  test(`keeps the Snyk wordmark size and clear space at ${width}px`, async ({
    page,
  }) => {
    await prepareTheme(page, "light", "light");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const geometry = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>(".snyk-logo");
      const image = link?.querySelector("img");
      const header = link?.closest<HTMLElement>(".site-header");
      const controls = header?.querySelector<HTMLElement>(".header-actions");
      if (!link || !image || !header || !controls) {
        throw new Error("Branded header geometry is incomplete");
      }
      const linkRect = link.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      const separated =
        linkRect.right <= controlsRect.left ||
        controlsRect.right <= linkRect.left ||
        linkRect.bottom <= controlsRect.top ||
        controlsRect.bottom <= linkRect.top;
      return {
        imageWidth: imageRect.width,
        imageHeight: imageRect.height,
        clearTop: imageRect.top - linkRect.top,
        clearLeft: imageRect.left - linkRect.left,
        clearBottom: linkRect.bottom - imageRect.bottom,
        clearRight: linkRect.right - imageRect.right,
        containedTop: linkRect.top - headerRect.top,
        containedLeft: linkRect.left - headerRect.left,
        containedBottom: headerRect.bottom - linkRect.bottom,
        containedRight: headerRect.right - linkRect.right,
        controlsVisible:
          controlsRect.width > 0 &&
          controlsRect.height > 0 &&
          controlsRect.left >= headerRect.left &&
          controlsRect.right <= headerRect.right,
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
    expect(geometry.controlsVisible).toBe(true);
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
    "https://vulnbench.com/brand/snyk-2026/social.svg",
  );

  for (const path of [
    "/brand/snyk-2026/favicon.svg",
    "/brand/snyk-2026/social.svg",
    "/brand/snyk-2026/logo-snyk-white.png",
    "/brand/snyk-2026/BRC_Fabric_NoGradient.png",
    "/brand/snyk-2026/BRC_Fabric_Gradient.png",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test("exports a self-contained branded chart SVG", async ({ page }) => {
  await prepareTheme(page, "dark", "dark");
  await page.goto("/releases/js-1.0/explore");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });

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

  expect(svg).toContain("#6F00DD");
  expect(svg).toContain("Geist Variable");
  expect(svg).toContain("Geist Mono Variable");
  expect(svg).not.toContain("var(--");
  expect(
    auditText(svg, {
      fileName: download.suggestedFilename(),
      checkOverflowGuard: false,
    }),
  ).toEqual([]);
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
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".hero-copy")).toHaveCSS(
      "color",
      MIDNIGHT,
    );
    await expect(page.locator(".section").first()).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
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
    await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
    await expect(page.locator(".page-hero__copy")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".page-hero__copy")).toHaveCSS(
      "color",
      MIDNIGHT,
    );
    await expect(page.locator(".explorer-app")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".explorer-canvas")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
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

test.describe("Snyk 2026 without JavaScript", () => {
  test.use({
    colorScheme: "dark",
    javaScriptEnabled: false,
  });

  test("uses the system-dark fallback with complete usable content", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute(
      "data-design-theme",
      "snyk-2026",
    );
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    await expect(page.locator("html")).toHaveCSS(
      "background-color",
      "rgb(3, 3, 40)",
    );
    await expect(page.locator("html")).toHaveCSS("background-image", "none");
    await expect(page.locator(".hero-copy")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".hero-copy")).toHaveCSS("padding", "0px");
    await expect(page.locator(".section").first()).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
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
    await expect(page.locator("html")).toHaveCSS(
      "background-color",
      MIDNIGHT,
    );
    await expect(page.locator("html")).toHaveCSS("background-image", "none");
    await expect(page.locator(".page-hero__copy")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".page-hero__copy")).toHaveCSS("padding", "0px");
    await expect(page.locator(".explorer-app")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".explorer-canvas")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".explorer-header")).toHaveCSS(
      "background-color",
      MIDNIGHT,
    );
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
