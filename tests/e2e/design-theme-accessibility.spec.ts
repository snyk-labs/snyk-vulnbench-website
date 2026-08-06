import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { prepareTheme } from "./support/theme";

const publicRoutes = [
  "/",
  "/releases",
  "/releases/js-1.0",
  "/releases/js-1.0/explore",
  "/releases/js-1.0/explore?v=1&view=repeatability&mode=percentage",
  "/releases/js-1.0/explore?v=1&view=coverage&metric=unmatched",
  "/releases/js-1.0/explore?v=1&view=efficiency&resource=duration",
  "/releases/js-1.0/explore?v=1&view=findings&status=unmatched&recurrence=5",
  "/releases/js-1.0/cases",
  "/releases/js-1.0/cases/js-project-copperline-find-vulns",
  "/releases/js-1.0/cases/js-project-goldleaf-find-vulns",
  "/releases/js-1.0/cases/js-project-ironclad-find-vulns",
  "/releases/js-1.0/cases/js-project-nightowl-find-vulns",
  "/releases/js-1.0/cases/js-project-purplehaze-find-vulns",
  "/releases/js-1.0/cases/js-project-riverbend-find-vulns",
  "/releases/js-1.0/cases/js-project-shadowfox-find-vulns",
  "/releases/js-1.0/cases/js-project-silvergate-find-vulns",
  "/releases/js-1.0/cases/js-project-skylark-find-vulns",
  "/releases/js-1.0/cases/js-project-tigerteam-find-vulns",
  "/releases/js-1.0/methodology",
  "/releases/js-1.0/data",
  "/methodology",
  "/data",
  "/about",
] as const;

for (const colorMode of ["light", "dark"] as const) {
  for (const path of publicRoutes) {
    test(`${path} has no detectable branded WCAG A, AA, or 2.2 AA violations in ${colorMode} mode`, async ({
      page,
    }) => {
      await prepareTheme(page, colorMode, colorMode);
      await page.goto(path);

      await expect(page.locator("html")).toHaveAttribute(
        "data-design-theme",
        "snyk-2026",
      );
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        colorMode,
      );

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
