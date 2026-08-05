import { expect, test, type Page } from "@playwright/test";

async function expectCompletedPhaseOne(page: Page) {
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Can LLMs find the same bugs twice?",
    }),
  ).toBeVisible();

  const scorecard = page.getByRole("table", {
    name: /Published configuration scorecard/,
  });
  await expect(scorecard).toBeVisible();
  await expect(scorecard.getByRole("row")).toHaveCount(7);
  for (const configuration of [
    "Snyk Code SAST",
    "Claude Opus 4.6 Medium",
    "Claude Opus 4.6 High",
    "Claude Opus 4.7 Max",
    "Claude Sonnet 4.6 Medium",
    "Claude Sonnet 4.6 High",
  ]) {
    await expect(scorecard.getByText(configuration, { exact: true })).toBeVisible();
  }

  await expect(
    page.getByRole("img", {
      name: "Agreement versus repeated-run variance",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: "Agreement versus repeated-run variance exact values",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Cost versus Snyk-reference F1" }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: "Cost versus Snyk-reference F1 exact values",
    }),
  ).toBeVisible();

  const coverage = page.getByRole("table", {
    name: "Reference recall by vulnerability class and configuration",
  });
  await expect(coverage).toBeVisible();
  await expect(coverage.getByRole("columnheader")).toHaveCount(18);

  const largerFixture = page.getByRole("table", {
    name: "Larger multi-file fixture scores",
  });
  await expect(largerFixture).toBeVisible();
  await expect(largerFixture).toContainText("40.0%");

  for (const text of [
    "25 of 25 model runs reported the SQL-shaped decoy",
    "25 of 25 model runs reported the likely SQL injection gap",
    "15 of 15 path-traversal opportunities",
    "10 of 15 resource-limit opportunities",
  ]) {
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  }

  await expect(
    page.getByRole("heading", { name: "Practical implications for security teams" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Snyk Code defines the reference set/i).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/scorer matches by vulnerability type/i).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/fixtures are small JavaScript and Express projects/i).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/Normalization choices affect recurrence percentages/i).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/Cost values reflect small fixtures/i).first(),
  ).toBeVisible();

  for (const name of [
    "Explore results",
    "Methodology",
    "Data",
    "GitHub",
    "Snyk publication",
    "Cite this release",
  ]) {
    await expect(page.getByRole("link", { name, exact: true }).last()).toBeVisible();
  }
}

test("publishes the complete Phase 1 evidence narrative", async ({ page }) => {
  await page.goto("/releases/js-1.0");
  await expectCompletedPhaseOne(page);
});

test("preserves the Phase 1 evidence narrative without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4321/releases/js-1.0");
  await expectCompletedPhaseOne(page);

  await context.close();
});
