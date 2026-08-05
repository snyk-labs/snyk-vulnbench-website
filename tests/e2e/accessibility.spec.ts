import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/releases",
  "/releases/js-1.0",
  "/releases/js-1.0/explore",
  "/releases/js-1.0/explore?v=1&view=repeatability&mode=percentage",
  "/releases/js-1.0/explore?v=1&view=coverage&metric=unmatched",
  "/releases/js-1.0/explore?v=1&view=efficiency&resource=duration",
  "/releases/js-1.0/explore?v=1&view=findings&status=unmatched&recurrence=5",
  "/releases/js-1.0/cases",
  "/releases/js-1.0/cases/js-project-nightowl-find-vulns",
  "/releases/js-1.0/methodology",
  "/releases/js-1.0/data",
  "/methodology",
  "/data",
  "/about",
];

for (const path of routes) {
  test(`${path} has no detectable WCAG A or AA violations`, async ({
    page,
  }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test("honors reduced motion and keeps content within a narrow viewport", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");

  const scrollBehavior = await page.locator("html").evaluate(
    (element) => getComputedStyle(element).scrollBehavior,
  );
  expect(scrollBehavior).toBe("auto");

  const viewport = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(viewport.body).toBeLessThanOrEqual(viewport.viewport);
});

test("keeps dense evidence operable at narrow widths", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/releases/js-1.0");

  await page
    .locator(
      'astro-island[component-export="ConfigurationScorecard"]:not([ssr])',
    )
    .waitFor({ state: "attached" });
  const scoreSort = page.getByRole("button", {
    name: "Sort by Snyk-reference F1",
  });
  await scoreSort.focus();
  await page.keyboard.press("Enter");
  await expect(scoreSort).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("table", { name: /Published configuration scorecard/ })
      .getByRole("columnheader", { name: "Sort by Snyk-reference F1" }),
  ).toHaveAttribute("aria-sort", "descending");

  const scorecardScroll = page.locator(".configuration-scorecard__scroll");
  const scorecardWidths = await scorecardScroll.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(scorecardWidths.scroll).toBeGreaterThan(scorecardWidths.client);

  const viewport = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(viewport.body).toBeLessThanOrEqual(viewport.viewport);
});
