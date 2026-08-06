import { expect, test } from "@playwright/test";
import { prepareTheme } from "./support/theme";

test.describe("Snyk 2026 mobile shell", () => {
  test.use({ viewport: { width: 320, height: 900 } });

  for (const colorMode of ["light", "dark"] as const) {
    test(`fits the homepage at 320px in ${colorMode} mode`, async ({ page }) => {
      await prepareTheme(page, colorMode, colorMode);
      await page.goto("/");

      await expect(page.locator("html")).toHaveAttribute(
        "data-design-theme",
        "snyk-2026",
      );
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        colorMode,
      );
      await expect(page.getByRole("link", { name: "Snyk home" })).toBeVisible();
      await expect(page.locator(".header-actions")).toBeVisible();
      await expect(page.locator(".hero")).toBeVisible();

      const heading = page.getByRole("heading", {
        level: 1,
        name: "Can LLMs find the same bugs twice?",
      });
      await expect(heading).toBeVisible();
      await expect(heading).toHaveCSS("font-weight", "700");

      if (colorMode === "light") {
        await expect(page.locator("html")).toHaveCSS(
          "background-color",
          "rgb(255, 255, 255)",
        );
        await expect(page.locator("html")).toHaveCSS("background-image", "none");
        await expect(page.locator(".hero-copy")).toHaveCSS(
          "color",
          "rgb(3, 3, 40)",
        );
        await expect(page.locator(".brand-gradient-accent")).toHaveCount(1);
        await expect(page.locator(".brand-fabric")).toHaveCSS("opacity", "0.16");
        await expect(page.locator(".eyebrow").first()).toHaveCSS(
          "font-weight",
          "500",
        );
        await expect(page.locator(".button").first()).toHaveCSS(
          "font-weight",
          "500",
        );
      }

      const layout = await page.evaluate(() => {
        const h1 = document.querySelector("main h1");
        if (!(h1 instanceof HTMLElement)) {
          throw new Error("Homepage H1 not found");
        }
        const hero = h1.closest(".hero");
        if (!(hero instanceof HTMLElement)) {
          throw new Error("Homepage hero not found");
        }

        const rect = h1.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();
        const style = getComputedStyle(h1);
        return {
          bodyScrollWidth: document.body.scrollWidth,
          documentClientWidth: document.documentElement.clientWidth,
          headingLeft: rect.left,
          headingRight: rect.right,
          headingTop: rect.top,
          headingScrollWidth: h1.scrollWidth,
          headingScrollHeight: h1.scrollHeight,
          headingOverflowX: style.overflowX,
          headingOverflowY: style.overflowY,
          heroRight: heroRect.right,
          heroTop: heroRect.top,
          heroBottom: heroRect.bottom,
        };
      });

      expect(layout.bodyScrollWidth).toBeLessThanOrEqual(
        layout.documentClientWidth,
      );
      expect(layout.headingLeft).toBeGreaterThanOrEqual(0);
      expect(layout.headingRight).toBeLessThanOrEqual(
        layout.documentClientWidth,
      );
      expect(layout.headingLeft + layout.headingScrollWidth).toBeLessThanOrEqual(
        layout.heroRight,
      );
      expect(layout.headingTop).toBeGreaterThanOrEqual(layout.heroTop);
      expect(
        layout.headingTop + layout.headingScrollHeight,
      ).toBeLessThanOrEqual(layout.heroBottom);
      expect(layout.headingOverflowX).toBe("visible");
      expect(layout.headingOverflowY).toBe("visible");
    });
  }
});
