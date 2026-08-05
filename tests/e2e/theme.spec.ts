import { expect, test, type Page } from "@playwright/test";

const LIGHT_THEME_COLOR = "#f7f4ed";
const DARK_THEME_COLOR = "#211e24";
const THEME_KEY = "vulnbench-theme";

async function prepareTheme(
  page: Page,
  colorScheme: "light" | "dark",
  storedPreference: string | null = null,
) {
  await page.emulateMedia({ colorScheme });
  await page.addInitScript(
    ({ preference }) => {
      localStorage.clear();
      if (preference !== null) {
        localStorage.setItem("vulnbench-theme", preference);
      }
    },
    { preference: storedPreference },
  );
}

async function expectTheme(
  page: Page,
  theme: "light" | "dark",
  themeColor: string,
) {
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page.locator("html")).toHaveAttribute("style", /color-scheme/);
  expect(
    await page.locator("html").evaluate((element) => element.style.colorScheme),
  ).toBe(theme);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    themeColor,
  );
}

function themeToggle(page: Page, name: "light" | "dark") {
  return page.getByRole("button", {
    name: `Switch to ${name} theme`,
    exact: true,
  });
}

test("initializes the light theme from a light system preference", async ({
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

test("initializes the dark theme from a dark system preference", async ({
  page,
}) => {
  await prepareTheme(page, "dark");
  await page.goto("/");

  await expectTheme(page, "dark", DARK_THEME_COLOR);
  await expect(themeToggle(page, "light")).toBeVisible();
  await expect(themeToggle(page, "light")).toHaveAttribute("data-theme", "dark");
  await expect(themeToggle(page, "light")).not.toHaveAttribute("aria-pressed");
});

test("applies dark semantic surfaces to evidence and analytical views", async ({
  page,
}) => {
  await prepareTheme(page, "dark");
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

test("uses a valid saved preference instead of the system preference", async ({
  page,
}) => {
  await prepareTheme(page, "dark", "light");
  await page.goto("/");

  await expectTheme(page, "light", LIGHT_THEME_COLOR);
});

test("ignores an invalid saved preference", async ({ page }) => {
  await prepareTheme(page, "dark", "sepia");
  await page.goto("/");

  await expectTheme(page, "dark", DARK_THEME_COLOR);
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

  await themeToggle(page, "light").focus();
  await page.keyboard.press("Enter");

  await expectTheme(page, "light", LIGHT_THEME_COLOR);
  await expect(themeToggle(page, "dark")).toBeFocused();
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

test("follows live system changes until the visitor chooses explicitly", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), THEME_KEY);
  await page.reload();
  await expectTheme(page, "light", LIGHT_THEME_COLOR);

  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(page, "dark", DARK_THEME_COLOR);

  await themeToggle(page, "light").click();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expectTheme(page, "light", LIGHT_THEME_COLOR);
});

test("synchronizes valid cross-tab choices and returns to the system theme for invalid or removed preferences", async ({
  context,
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), THEME_KEY);
  await page.reload();

  const otherPage = await context.newPage();
  await otherPage.emulateMedia({ colorScheme: "light" });
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

test("returns to the system theme when another tab clears storage", async ({
  context,
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: THEME_KEY, value: "dark" },
  );
  await page.reload();
  await expectTheme(page, "dark", DARK_THEME_COLOR);

  const otherPage = await context.newPage();
  await otherPage.emulateMedia({ colorScheme: "light" });
  await otherPage.goto("/");
  await otherPage.evaluate(() => localStorage.clear());

  await expectTheme(page, "light", LIGHT_THEME_COLOR);
  await expect(themeToggle(page, "dark")).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({
    colorScheme: "dark",
    javaScriptEnabled: false,
  });

  test("renders the dark CSS fallback with usable content and a hidden theme control", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    await expect(page.locator("html")).toHaveCSS(
      "background-color",
      "rgb(33, 30, 36)",
    );
    await expect(page.locator("html")).toHaveCSS(
      "color",
      "rgb(245, 240, 232)",
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
