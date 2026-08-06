import { expect, test } from "@playwright/test";

const explorerIsland =
  'astro-island[component-export="ExplorerApp"]:not([ssr])';

async function openMobileFilters(page: import("@playwright/test").Page) {
  const button = page.getByRole("button", { name: /Filters \(/ });
  if (await button.isVisible()) {
    await button.click();
    return true;
  }
  return false;
}

test("renders the published explorer default with static evidence", async ({
  page,
}) => {
  await page.goto("/releases/js-1.0/explore");

  await expect(
    page.getByRole("heading", { level: 1, name: /Test the published conclusions/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "JS 1.0 explorer" })).toBeVisible();
  await expect(page.getByText("300 represented runs")).toBeVisible();
  await expect(
    page.getByRole("table", { name: /Published configuration scorecard/ }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Summary", selected: true })).toBeVisible();
});

test("shows share confirmation as a compact lower-right toast", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/releases/js-1.0/explore");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  await page.getByRole("button", { name: "Copy share link" }).click();

  const toast = page.locator(".explorer-app__share-status");
  await expect(toast).toBeVisible();
  const geometry = await toast.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      position: style.position,
      width: rect.width,
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.bottom,
    };
  });
  expect(geometry.position).toBe("fixed");
  expect(geometry.width).toBeLessThan(400);
  expect(geometry.right).toBeGreaterThan(15);
  expect(geometry.right).toBeLessThan(40);
  expect(geometry.bottom).toBeGreaterThan(15);
  expect(geometry.bottom).toBeLessThan(40);
  await expect(toast).toBeHidden({ timeout: 5000 });
});

test("restores URL state and updates it after filtering", async ({ page }) => {
  await page.goto(
    "/releases/js-1.0/explore?v=1&view=efficiency&ref=0&resource=tokens",
  );
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  await expect(
    page.getByRole("tab", { name: "Efficiency", selected: true }),
  ).toBeVisible();
  await expect(page.getByText("250 represented runs")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /agreement versus average total tokens/i,
    }),
  ).toBeVisible();

  const mobileSheetOpen = await openMobileFilters(page);
  await page.getByRole("checkbox", {
    name: "Include Snyk deterministic reference",
  }).check();
  if (mobileSheetOpen) {
    await page.getByRole("button", { name: "Close filters" }).click();
  }
  await expect(page.getByText("300 represented runs")).toBeVisible();
  await expect(page).toHaveURL(/v=1&view=efficiency&resource=tokens/);
  await expect(page).not.toHaveURL(/ref=0/);
});

test("supports arrow-key navigation across explorer tabs", async ({ page }) => {
  await page.goto("/releases/js-1.0/explore");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  const summary = page.getByRole("tab", { name: "Summary" });
  await summary.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Repeatability", selected: true }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Findings", selected: true }),
  ).toBeFocused();
});

test("caps the canvas and adapts from three to two to one column", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/releases/js-1.0/explore");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  const layout = page.locator(".explorer-app__layout");
  const wide = await layout.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const canvas = element.querySelector(".explorer-canvas");
    const guide = element.querySelector(".explorer-guide");
    return {
      left: rect.left,
      right: window.innerWidth - rect.right,
      width: rect.width,
      canvasWidth: canvas?.getBoundingClientRect().width ?? 0,
      guideDisplay: guide ? getComputedStyle(guide).display : "missing",
    };
  });
  expect(wide.width).toBeLessThanOrEqual(1568);
  expect(wide.canvasWidth).toBeLessThanOrEqual(992);
  expect(Math.abs(wide.left - wide.right)).toBeLessThanOrEqual(2);
  expect(wide.guideDisplay).not.toBe("none");

  const guide = page.getByRole("complementary", { name: "View guide" });
  await expect(guide).toContainText("How to read this view");
  await page.getByRole("tab", { name: "Efficiency" }).click();
  await expect(guide).toContainText(
    "Upper-left combines higher agreement with lower resource use",
  );

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(guide).toBeHidden();
  expect(
    await page.locator(".explorer-canvas").evaluate(
      (element) => element.getBoundingClientRect().width,
    ),
  ).toBeLessThanOrEqual(992);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(guide).toBeHidden();
  const mobile = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(mobile.body).toBeLessThanOrEqual(mobile.viewport);
});

test("pins configurations, selects a baseline, and persists comparison state", async ({
  page,
}) => {
  await page.goto("/releases/js-1.0/explore");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  await page.getByRole("button", { name: "Pin Claude Opus 4.6 Medium" }).click();
  await page.getByRole("button", { name: "Pin Claude Opus 4.7 Max" }).click();
  const mobileCompare = page.getByRole("button", { name: "Compare (2)" });
  if (await mobileCompare.isVisible()) await mobileCompare.click();

  const comparison = page.locator(
    '[aria-label="Configuration comparison"]',
  );
  await expect(comparison.getByText("2 pinned")).toBeVisible();
  await comparison
    .getByRole("radio", { name: "Use Claude Opus 4.7 Max as baseline" })
    .check();
  await expect(page).toHaveURL(/pins=opus-4-6-medium%2Copus-4-7-max/);
  await expect(page).toHaveURL(/baseline=opus-4-7-max/);
});

test("switches every guided view and its metric controls", async ({ page }) => {
  await page.goto("/releases/js-1.0/explore");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  await page.getByRole("tab", { name: "Repeatability" }).click();
  await expect(page.getByRole("heading", { name: "Finding recurrence" })).toBeVisible();
  let mobileSheetOpen = await openMobileFilters(page);
  await page.getByLabel("Value mode").selectOption("percentage");
  if (mobileSheetOpen) {
    await page.getByRole("button", { name: "Close filters" }).click();
  }
  await expect(page.getByRole("table", { name: "Finding recurrence distribution" })).toContainText(
    "84.8%",
  );

  await page.getByRole("tab", { name: "Coverage" }).click();
  await expect(
    page.getByRole("heading", { name: "Reference recall by vulnerability class" }),
  ).toBeVisible();
  const coverageTable = page.getByRole("table", {
    name: "Vulnerability class coverage matrix",
  });
  const pathTraversalColumn = await coverageTable
    .getByRole("columnheader")
    .allTextContents()
    .then((headers) => headers.findIndex((header) => header.includes("Path traversal")));
  await expect(
    coverageTable
      .getByRole("row", { name: /Claude Opus 4\.6 Medium/ })
      .locator("th, td")
      .nth(pathTraversalColumn)
      .locator("strong"),
  ).toHaveText("50%");
  mobileSheetOpen = await openMobileFilters(page);
  await page.getByLabel("Active metric").selectOption("unmatched");
  if (mobileSheetOpen) {
    await page.getByRole("button", { name: "Close filters" }).click();
  }
  await expect(
    page.getByRole("heading", {
      name: "Average unmatched reports by vulnerability class",
    }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Efficiency" }).click();
  mobileSheetOpen = await openMobileFilters(page);
  await page.getByLabel("Efficiency resource").selectOption("duration");
  if (mobileSheetOpen) {
    await page.getByRole("button", { name: "Close filters" }).click();
  }
  await expect(
    page.getByRole("heading", {
      name: /agreement versus average duration/i,
    }),
  ).toBeVisible();
});

test("clears filters that are unsupported by release-wide repeatability", async ({
  page,
}) => {
  await page.goto(
    "/releases/js-1.0/explore?v=1&view=repeatability&projects=js-project-nightowl-find-vulns&configs=opus-4-6-high",
  );
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  await expect(page.getByText("250 represented runs")).toBeVisible();
  const mobileSheetOpen = await openMobileFilters(page);
  await expect(
    page.getByText(/Repeatability signatures are published release-wide/),
  ).toBeVisible();
  if (mobileSheetOpen) {
    await page.getByRole("button", { name: "Close filters" }).click();
  }
  await expect(page).not.toHaveURL(/projects=/);
  await expect(page).not.toHaveURL(/configs=/);
});

test("names restrictive filters and recovers from an empty selection", async ({
  page,
}) => {
  await page.goto("/releases/js-1.0/explore");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  const mobileSheetOpen = await openMobileFilters(page);

  for (const name of [
    "Claude Opus 4.6 High",
    "Claude Opus 4.6 Medium",
    "Claude Opus 4.7 Max",
    "Claude Sonnet 4.6 High",
    "Claude Sonnet 4.6 Medium",
  ]) {
    await page.getByRole("checkbox", { name }).uncheck();
  }
  await page
    .getByRole("checkbox", {
      name: "Include Snyk deterministic reference",
    })
    .uncheck();
  if (mobileSheetOpen) {
    await page.getByRole("button", { name: "Close filters" }).click();
  }

  await expect(
    page.getByRole("heading", { name: "No measurements match this view" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset all filters" }).click();
  await expect(page.getByText("300 represented runs")).toBeVisible();
});

test("explains an unavailable efficiency metric without crashing", async ({
  page,
}) => {
  await page.goto(
    "/releases/js-1.0/explore?v=1&view=efficiency&configs=snyk-code&resource=cost",
  );
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  await expect(
    page.getByRole("heading", { name: "Resource metric unavailable" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show model configurations" }).click();
  await expect(
    page.getByRole("heading", {
      name: /agreement versus estimated model-session cost/i,
    }),
  ).toBeVisible();
});

test("reports invalid state and resets to the published default", async ({
  page,
}) => {
  await page.goto(
    "/releases/js-1.0/explore?v=99&view=unknown&configs=retired-model",
  );
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  await expect(
    page.getByText(/Ignored invalid explorer parameters/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(
    page.getByText(/Ignored invalid explorer parameters/),
  ).not.toBeVisible();
  await expect(page.getByText("300 represented runs")).toBeVisible();
  await expect(page).toHaveURL(/\?v=1$/);
});

test("downloads filtered CSV and chart SVG", async ({ page }) => {
  await page.goto("/releases/js-1.0/explore");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  const csvDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export filtered CSV" }).click();
  expect((await csvDownload).suggestedFilename()).toBe(
    "snyk-vulnbench-js-1.0-summary.csv",
  );

  const svgDownload = page.waitForEvent("download");
  await page
    .getByRole("img", { name: "Agreement versus repeated-run variance" })
    .locator("..")
    .getByRole("button", { name: "Export SVG" })
    .click();
  expect((await svgDownload).suggestedFilename()).toBe(
    "js-1.0-agreement-variance.svg",
  );
});

test("opens mobile filter and comparison sheets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/releases/js-1.0/explore");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  const filterTrigger = page.getByRole("button", { name: "Filters (0)" });
  await filterTrigger.click();
  await expect(filterTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('[aria-label="Explorer filters"]')).toHaveClass(
    /is-open/,
  );
  await expect(
    page.locator(".explorer-canvas"),
  ).toHaveJSProperty("inert", true);
  await page.keyboard.press("Shift+Tab");
  expect(
    await page
      .locator('[aria-label="Explorer filters"]')
      .evaluate((dialog) => dialog.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(filterTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(filterTrigger).toBeFocused();

  const compareTrigger = page.getByRole("button", { name: "Compare (0)" });
  await compareTrigger.click();
  await expect(
    page.locator('[aria-label="Configuration comparison"]'),
  ).toHaveClass(/is-open/);
});

test("preserves the default explorer evidence without JavaScript", async ({
  baseURL,
  browser,
}) => {
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto("/releases/js-1.0/explore");

  await expect(page.getByRole("heading", { name: "JS 1.0 explorer" })).toBeVisible();
  await expect(page.getByText("300 represented runs")).toBeVisible();
  await expect(
    page.getByRole("table", { name: /Published configuration scorecard/ }),
  ).toBeVisible();

  await context.close();
});
