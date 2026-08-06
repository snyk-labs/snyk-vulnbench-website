import { expect, type Page } from "@playwright/test";

export const THEME_KEY = "vulnbench-theme";

export async function prepareTheme(
  page: Page,
  systemColorScheme: "light" | "dark",
  storedPreference: string | null = null,
) {
  await page.emulateMedia({ colorScheme: systemColorScheme });
  await page.addInitScript(
    ({ preference, storageKey }) => {
      localStorage.clear();
      if (preference !== null) {
        localStorage.setItem(storageKey, preference);
      }
    },
    { preference: storedPreference, storageKey: THEME_KEY },
  );
}

export async function expectTheme(
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

export function themeToggle(page: Page, name: "light" | "dark") {
  return page.getByRole("button", {
    name: `Switch to ${name} theme`,
    exact: true,
  });
}
