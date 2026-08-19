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

  for (const metric of ["5.67×", "49.7%", "13.7%"]) {
    await expect(
      page.locator(".evidence-band .metric").filter({ hasText: metric }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("heading", {
      name: "Same code. Same prompt. Different findings.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Across five identical runs, 84.8% of reference-matched findings recurred every time. Nearly half of unmatched reports appeared only once—evidence to inspect, not dismiss.",
    ),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Explore the results" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "An AI review is a measurement—not a verdict.",
    }),
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
  await expect(
    page.getByRole("navigation", { name: "Publication links" }).getByRole("link", {
      name: "Benchmark Harness",
    }),
  ).toHaveAttribute("href", "https://github.com/snyk-labs/snyk-vulnbench");
  const citation = page.locator("[data-bibtex-citation]");
  await expect(citation).toContainText("@misc{tal2026snykvulnbenchjs10,");
  await expect(citation).toContainText(
    "author = {Tal, Liran and Kloos, Johannes and Rudich, Arsenii and Thoemmes, Stephen and Nair, Manoj}",
  );
  await expect(
    page.getByRole("button", { name: "Copy BibTeX" }),
  ).toBeVisible();
}

test("communicates the JS 1.0 question and evidence", async ({ page }) => {
  await page.goto("/");
  await expectHomepageEvidence(page);
});

test("copies the homepage BibTeX citation", async ({ page }) => {
  await page.goto("/");
  const origin = new URL(page.url()).origin;
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin,
  });

  const renderedCitation = await page
    .locator("[data-bibtex-citation] code")
    .textContent();
  if (!renderedCitation) throw new Error("Rendered BibTeX citation is required");

  await page.getByRole("button", { name: "Copy BibTeX" }).click();
  await expect(page.locator("[data-citation-status]")).toHaveText("Copied");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(renderedCitation);
});

test("offers manual copy guidance without the Clipboard API", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Copy BibTeX" }).click();
  await expect(page.locator("[data-citation-status]")).toHaveText(
    "Select and copy the BibTeX entry manually.",
  );
});

test("preserves the complete research story without JavaScript", async ({
  baseURL,
  browser,
}) => {
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();

  await page.goto("/");
  await expectHomepageEvidence(page);
  await expect(page.locator("[data-bibtex-citation]")).toContainText(
    "@misc{tal2026snykvulnbenchjs10,",
  );

  await context.close();
});
