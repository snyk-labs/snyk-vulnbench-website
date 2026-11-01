import { expect, test, type Page } from "@playwright/test";
import { firstOf, heroDisclosure, readV20Copy, v20Home as home } from "./support/v20-copy";

const findings = readV20Copy<{ title: string }[]>("findings.json");

async function expectHomepageEvidence(page: Page) {
  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: home.h1 })).toBeVisible();
  await expect(page.getByText(home.subtitle, { exact: true })).toBeVisible();
  const disclosure = page.locator(".hero [data-disclosure]");
  await expect(disclosure).toHaveText(heroDisclosure);
  await expect(disclosure).not.toContainText(home.eyebrow);

  const heroVisual = page.locator(".hero-visual");
  await expect(
    heroVisual.getByRole("heading", { name: home.headline_evidence.h2 }),
  ).toBeVisible();
  await expect(heroVisual.locator("#figure-1 img").first()).toBeVisible();
  for (const callout of home.headline_evidence.callouts) {
    await expect(heroVisual.getByText(callout, { exact: true })).toBeVisible();
  }
  await expect(
    heroVisual.getByText(home.headline_evidence.for_appsec, { exact: true }),
  ).toBeVisible();

  const scope = page.locator('dl[aria-label="Benchmark scope"]').first();
  for (const { value, label } of home.stats) {
    await expect(scope.getByText(value, { exact: true })).toBeVisible();
    await expect(scope.getByText(label, { exact: true })).toBeVisible();
  }

  await expect(page.getByRole("link", { name: firstOf(home.buttons) }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: home.findings_intro.h2 }),
  ).toBeVisible();
  for (const { title } of findings) {
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();
  }
  const findingTargets = await page
    .locator(".findings .text-link")
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href")),
    );
  expect(findingTargets).toEqual([
    "/releases/2.0/explore?view=complementarity",
    "/releases/2.0/explore?view=harness-policy",
    "/releases/2.0/explore?view=efficiency",
    "/releases/2.0#robustness",
  ]);

  await expect(page.getByRole("heading", { name: home.principles.h2 })).toBeVisible();
  for (const label of home.buttons.slice(1)) {
    await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
  }
  await expect(
    page.getByRole("navigation", { name: "Publication links" }).getByRole("link", {
      name: "View GitHub",
    }),
  ).toHaveAttribute("href", "https://github.com/snyk-labs/snyk-vulnbench");

  const citations = page.locator("[data-bibtex-citation]");
  await expect(citations).toHaveCount(2);
  await expect(citations.nth(0)).toContainText("@misc{tal2026snykvulnbench20,");
  await expect(citations.nth(1)).toContainText("@misc{tal2026snykvulnbenchjs10,");
  await expect(citations.nth(1)).toContainText(
    "author = {Tal, Liran and Kloos, Johannes and Rudich, Arsenii and Thoemmes, Stephen and Nair, Manoj}",
  );
  await expect(page.getByRole("button", { name: "Copy BibTeX" })).toHaveCount(2);
}

const currentCitation = (page: Page) =>
  page.getByRole("article", { name: "Snyk VulnBench 2.0 citation" });

test("communicates the 2.0 question and evidence", async ({ page }) => {
  await page.goto("/");
  await expectHomepageEvidence(page);
});

test("copies the homepage BibTeX citation", async ({ page }) => {
  await page.goto("/");
  const origin = new URL(page.url()).origin;
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin,
  });

  const citation = currentCitation(page);
  const renderedCitation = await citation.locator("[data-bibtex-citation] code").textContent();
  if (!renderedCitation) throw new Error("Rendered BibTeX citation is required");

  await citation.getByRole("button", { name: "Copy BibTeX" }).click();
  await expect(citation.locator("[data-citation-status]")).toHaveText("Copied");
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

  const citation = currentCitation(page);
  await citation.getByRole("button", { name: "Copy BibTeX" }).click();
  await expect(citation.locator("[data-citation-status]")).toHaveText(
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

  await context.close();
});
