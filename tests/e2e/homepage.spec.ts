import { expect, test } from "@playwright/test";

async function expectHomepageEvidence(page: import("@playwright/test").Page) {
  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Can LLMs find the same bugs twice?",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("A repeatability and Snyk-reference agreement study"),
  ).toBeVisible();

  const scope = page.locator('dl[aria-label="Benchmark scope"]');
  for (const [value, label] of [
    ["300", "scans"],
    ["10", "projects"],
    ["6", "configurations"],
    ["5", "repetitions"],
  ] as const) {
    await expect(scope.getByText(value, { exact: true })).toBeVisible();
    await expect(scope.getByText(label, { exact: true })).toBeVisible();
  }

  for (const text of ["134 of 158", "80 of 161", "22 of 161"]) {
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  }

  await expect(
    page.getByRole("link", { name: "Explore the results" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What the data show" }),
  ).toBeVisible();
  const findingTargets = await page
    .locator(".findings .text-link")
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href")),
    );
  expect(findingTargets).toEqual([
    "/releases/js-1.0#repeatability",
    "/releases/js-1.0#coverage",
    "/releases/js-1.0#efficiency",
  ]);
  await expect(
    page.getByRole("heading", { name: "How VulnBench measures behavior" }),
  ).toBeVisible();
  await expect(page.locator("[data-anatomy-step]")).toHaveCount(6);

  for (const label of ["Read the paper", "View methodology", "Download data"]) {
    await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
  }
}

test("communicates the JS 1.0 question and evidence", async ({ page }) => {
  await page.goto("/");
  await expectHomepageEvidence(page);
});

test("preserves the complete research story without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4321/");
  await expectHomepageEvidence(page);

  await context.close();
});
