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
