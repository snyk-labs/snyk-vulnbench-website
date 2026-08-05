import { expect, test } from "@playwright/test";

test("renders an accessible initiative shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeAttached();
  await expect(page.locator("main")).toHaveCount(1);
  await expect(
    page
      .getByRole("contentinfo")
      .getByText("A Snyk benchmark initiative"),
  ).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
});

test("exposes the sparse global navigation at every breakpoint", async ({
  page,
}) => {
  await page.goto("/");

  const menu = page
    .getByRole("banner")
    .locator("summary")
    .filter({ hasText: /^Menu$/ });
  if (await menu.isVisible()) {
    await menu.click();
  }

  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation).toBeVisible();

  for (const label of [
    "Overview",
    "Releases",
    "Explore",
    "Methodology",
    "Data",
    "GitHub",
  ]) {
    await expect(
      navigation.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  }
});

test("keeps the header actions usable without horizontal overflow at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const headerActions = page.locator(".header-actions");
  const menu = headerActions
    .locator("summary")
    .filter({ hasText: /^Menu$/ });
  const toggle = headerActions.getByRole("button", {
    name: /^Switch to (light|dark) theme$/,
  });

  await expect(menu).toBeVisible();
  await expect(toggle).toBeVisible();
  await expect(page.locator(".desktop-nav")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
