import { expect, test } from "@playwright/test";

test("keeps the synthetic release out of the public catalog", async ({
  page,
}) => {
  await page.goto("/releases");

  await expect(
    page
      .locator("main")
      .getByRole("link", { name: "Snyk VulnBench JS 1.0", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Synthetic 2\.0/)).not.toBeVisible();
  expect(await page.locator('a[href*="synthetic-2.0"]').count()).toBe(0);
});

for (const path of [
  "/releases/synthetic-2.0",
  "/releases/synthetic-2.0/explore",
  "/releases/synthetic-2.0/methodology",
  "/releases/synthetic-2.0/data",
  "/__fixtures__/synthetic-2.0/summary.json",
  "/__fixtures__/synthetic-2.0/adjudications.csv",
]) {
  test(`${path} is not publicly generated`, async ({ request }) => {
    expect((await request.get(path)).status()).toBe(404);
  });
}

test("preserves existing JS 1.0 routes and explorer state", async ({ page }) => {
  await page.goto(
    "/releases/js-1.0/explore?v=1&view=findings&projects=js-project-nightowl-find-vulns&status=unmatched&recurrence=5",
  );
  await page
    .locator('astro-island[component-export="ExplorerApp"]:not([ssr])')
    .waitFor({ state: "attached" });

  await expect(
    page.getByRole("tab", { name: "Findings", selected: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/signatures match the active/i),
  ).toBeVisible();
  await expect(page).toHaveURL(/projects=js-project-nightowl-find-vulns/);
});
