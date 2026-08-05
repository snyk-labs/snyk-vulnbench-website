import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/releases",
  "/releases/js-1.0",
  "/releases/js-1.0/explore",
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
