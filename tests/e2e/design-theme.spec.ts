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
  light: "#2B0250",
  dark: "#030328",
} as const;
const MIDNIGHT = "rgb(3, 3, 40)";

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

test("uses local Geist typography without third-party font requests", async ({
  page,
}) => {
  const thirdPartyRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.hostname !== "127.0.0.1") {
      thirdPartyRequests.push(request.url());
    }
  });

  await prepareTheme(page, "dark");
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const typography = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    eyebrow: getComputedStyle(
      document.querySelector(".eyebrow") as HTMLElement,
    ).fontFamily,
    metric: getComputedStyle(
      document.querySelector(".metric") as HTMLElement,
    ).fontFamily,
  }));

  expect(typography.body).toMatch(/^"Geist Variable"/);
  expect(typography.eyebrow).toMatch(/^"Geist Mono Variable"/);
  expect(typography.metric).toMatch(/^"Geist Mono Variable"/);
  expect(thirdPartyRequests).toEqual([]);
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

test("keeps Family B copy on opaque Midnight while exposing one page gradient", async ({
  page,
}) => {
  await prepareTheme(page, "light", "light");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await expect(page.locator("html")).toHaveCSS(
    "background-image",
    /linear-gradient\(90deg,/,
  );
  await expect(page.locator(".hero")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".hero-copy")).toHaveCSS(
    "background-color",
    MIDNIGHT,
  );
  await expect(page.locator(".section").first()).toHaveCSS(
    "background-color",
    MIDNIGHT,
  );
  await expectNoHorizontalOverflow(page);

  await page.goto("/releases/js-1.0/explore?v=1&view=coverage&metric=unmatched");
  await page
    .locator('astro-island[component-export="ExplorerApp"]')
    .waitFor({ state: "attached" });

  await expect(page.locator(".page-hero")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".page-hero__copy")).toHaveCSS(
    "background-color",
    MIDNIGHT,
  );
  await expect(page.locator(".explorer-app")).toHaveCSS(
    "background-color",
    MIDNIGHT,
  );
  await expect(page.locator(".explorer-canvas")).toHaveCSS(
    "background-color",
    MIDNIGHT,
  );
  await expectNoHorizontalOverflow(page);
});

for (const { width, minimum } of [
  { width: 320, minimum: 120 },
  { width: 1440, minimum: 140 },
]) {
  test(`keeps the Snyk wordmark at least ${minimum}px wide at ${width}px`, async ({
    page,
  }) => {
    await prepareTheme(page, "light", "light");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const wordmark = page.getByRole("link", { name: "Snyk home" }).locator("img");
    const box = await wordmark.boundingBox();

    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThanOrEqual(minimum);
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

  test("keeps complete copy and analysis on Midnight over Family B", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.locator("html")).toHaveCSS(
      "background-image",
      /linear-gradient\(90deg,/,
    );
    await expect(page.locator(".hero-copy")).toHaveCSS(
      "background-color",
      MIDNIGHT,
    );
    await expect(page.locator(".section").first()).toHaveCSS(
      "background-color",
      MIDNIGHT,
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
      "background-image",
      /linear-gradient\(90deg,/,
    );
    await expect(page.locator(".page-hero__copy")).toHaveCSS(
      "background-color",
      MIDNIGHT,
    );
    await expect(page.locator(".explorer-app")).toHaveCSS(
      "background-color",
      MIDNIGHT,
    );
    await expect(page.locator(".explorer-canvas")).toHaveCSS(
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
  });
});
