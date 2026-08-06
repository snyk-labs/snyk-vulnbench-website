import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  expectTheme,
  prepareTheme,
  THEME_KEY,
  themeToggle,
} from "./support/theme";

const LIGHT_THEME_COLOR = "#f7f4ed";
const DARK_THEME_COLOR = "#211e24";

test("defaults to the light theme with a light system preference", async ({
  page,
}) => {
  await prepareTheme(page, "light");
  await page.goto("/");

  await expectTheme(page, "light", LIGHT_THEME_COLOR);
  await expect(themeToggle(page, "dark")).toBeVisible();
  await expect(themeToggle(page, "dark")).toHaveAttribute(
    "title",
    "Switch to dark theme",
  );
  await expect(themeToggle(page, "dark")).toHaveAttribute("data-theme", "light");
  await expect(themeToggle(page, "dark")).not.toHaveAttribute("aria-pressed");
});

test("defaults to the light theme with a dark system preference", async ({
  page,
}) => {
  await prepareTheme(page, "dark");
  await page.goto("/");

  await expectTheme(page, "light", LIGHT_THEME_COLOR);
  await expect(themeToggle(page, "dark")).toBeVisible();
  await expect(themeToggle(page, "dark")).toHaveAttribute("data-theme", "light");
  await expect(themeToggle(page, "dark")).not.toHaveAttribute("aria-pressed");
});

test("keeps the Light default accessible with a dark system preference", async ({
  page,
}) => {
  await prepareTheme(page, "dark");
  await page.goto("/");

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("applies dark semantic surfaces to evidence and analytical views", async ({
  page,
}) => {
  await prepareTheme(page, "dark", "dark");
  await page.goto("/");

  const evidenceBand = page.locator(".evidence-band");
  await expect(evidenceBand).toHaveCSS("background-color", "rgb(23, 20, 27)");
  await expect(evidenceBand).toHaveCSS("color", "rgb(245, 240, 232)");

  await page.goto("/releases/js-1.0/");
  await expect(page.locator(".evidence-scatter__plot").first()).toHaveCSS(
    "background-color",
    "rgb(41, 37, 45)",
  );
  await expect(page.locator(".coverage-band-4").first()).toHaveCSS(
    "background-color",
    "rgb(59, 112, 105)",
  );
  await expect(page.locator(".coverage-band-4").first()).toHaveCSS(
    "color",
    "rgb(245, 240, 232)",
  );
});

test("keeps Classic coverage cells on a continuous heatmap", async ({ page }) => {
  await prepareTheme(page, "light");
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
      return { pair };
    });

  expect(presentation.pair).toBeDefined();
  expect(presentation.pair?.[0].background).not.toBe(
    presentation.pair?.[1].background,
  );
  await expect(
    page.getByRole("table", { name: "Vulnerability class coverage matrix" }),
  ).toBeVisible();
});

for (const {
  systemTheme,
  savedTheme,
  expectedColor,
} of [
  {
    systemTheme: "dark",
    savedTheme: "light",
    expectedColor: LIGHT_THEME_COLOR,
  },
  {
    systemTheme: "light",
    savedTheme: "dark",
    expectedColor: DARK_THEME_COLOR,
  },
] as const) {
  test(`uses a saved ${savedTheme} preference instead of system ${systemTheme}`, async ({
    page,
  }) => {
    await prepareTheme(page, systemTheme, savedTheme);
    await page.goto("/");

    await expectTheme(page, savedTheme, expectedColor);
  });
}

test("ignores an invalid saved preference", async ({ page }) => {
  await prepareTheme(page, "dark", "sepia");
  await page.goto("/");

  await expectTheme(page, "light", LIGHT_THEME_COLOR);
});

test("switches theme with a mouse click and persists the explicit choice", async ({
  page,
}) => {
  await prepareTheme(page, "light");
  await page.goto("/");

  await themeToggle(page, "dark").click();

  await expectTheme(page, "dark", DARK_THEME_COLOR);
  await expect(themeToggle(page, "light")).toHaveAttribute("data-theme", "dark");
  await expect(themeToggle(page, "light")).not.toHaveAttribute("aria-pressed");
  expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe(
    "dark",
  );
});

test("switches theme with keyboard button activation", async ({ page }) => {
  await prepareTheme(page, "dark");
  await page.goto("/");

  await themeToggle(page, "dark").focus();
  await page.keyboard.press("Enter");

  await expectTheme(page, "dark", DARK_THEME_COLOR);
  await expect(themeToggle(page, "light")).toBeFocused();
});

test("restores an explicit choice after reload and navigation", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), THEME_KEY);
  await page.reload();

  await themeToggle(page, "dark").click();
  await expectTheme(page, "dark", DARK_THEME_COLOR);

  await page.reload();
  await expectTheme(page, "dark", DARK_THEME_COLOR);
  await expect(themeToggle(page, "light")).toBeVisible();

  await page.goto("/releases");
  await expectTheme(page, "dark", DARK_THEME_COLOR);
  await expect(themeToggle(page, "light")).toBeVisible();
});

test("ignores live system changes before and after an explicit choice", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), THEME_KEY);
  await page.reload();
  await expectTheme(page, "light", LIGHT_THEME_COLOR);

  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(page, "light", LIGHT_THEME_COLOR);

  await themeToggle(page, "dark").click();
  await expectTheme(page, "dark", DARK_THEME_COLOR);
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(page, "dark", DARK_THEME_COLOR);
});

test("synchronizes valid cross-tab choices and returns to Light for invalid or removed preferences", async ({
  context,
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), THEME_KEY);
  await page.reload();

  const otherPage = await context.newPage();
  await otherPage.emulateMedia({ colorScheme: "dark" });
  await otherPage.goto("/");

  await otherPage.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: THEME_KEY, value: "dark" },
  );
  await expectTheme(page, "dark", DARK_THEME_COLOR);
  await expect(themeToggle(page, "light")).toBeVisible();

  await otherPage.evaluate((key) => localStorage.setItem(key, "sepia"), THEME_KEY);
  await expectTheme(page, "light", LIGHT_THEME_COLOR);

  await otherPage.evaluate((key) => localStorage.removeItem(key), THEME_KEY);
  await expectTheme(page, "light", LIGHT_THEME_COLOR);
  await expect(themeToggle(page, "dark")).toBeVisible();
});

test("returns to Light when another tab clears storage", async ({
  context,
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: THEME_KEY, value: "dark" },
  );
  await page.reload();
  await expectTheme(page, "dark", DARK_THEME_COLOR);

  const otherPage = await context.newPage();
  await otherPage.emulateMedia({ colorScheme: "dark" });
  await otherPage.goto("/");
  await otherPage.evaluate(() => localStorage.clear());

  await expectTheme(page, "light", LIGHT_THEME_COLOR);
  await expect(themeToggle(page, "dark")).toBeVisible();
});

for (const systemColorMode of ["light", "dark"] as const) {
  test.describe(`without JavaScript in system ${systemColorMode}`, () => {
    test.use({
      colorScheme: systemColorMode,
      javaScriptEnabled: false,
    });

    test("renders the Light CSS fallback with usable content and a hidden theme control", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(page.locator("html")).not.toHaveAttribute("data-theme");
      await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
      await expect(page.locator("html")).toHaveCSS(
        "background-color",
        "rgb(247, 244, 237)",
      );
      await expect(page.locator("html")).toHaveCSS(
        "color",
        "rgb(23, 20, 31)",
      );
      await expect(page.locator("[data-theme-toggle]")).toBeHidden();
      await expect(page.locator("main")).toBeVisible();
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Can LLMs find the same bugs twice?",
        }),
      ).toBeVisible();
    });
  });
}
