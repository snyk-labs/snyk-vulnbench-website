import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { prepareTheme } from "./support/theme";

const contentRoot = resolve(process.cwd(), "src/data/releases/content/2.0");
const readContent = (path: string) => readFileSync(resolve(contentRoot, path), "utf8");
const readJson = <T>(path: string) => JSON.parse(readContent(path)) as T;

const disclosure = readJson<{ short: string; long: string }>("copy/disclosure.json");
const figures = readJson<{
  figures: { paper_figure: number; caption: string; alt: string }[];
}>("figures.json").figures;

const v20Routes = [
  "/releases/2.0",
  "/releases/2.0/explore",
  "/releases/2.0/methodology",
  "/releases/2.0/data",
  "/data/2.0/",
];

async function expectBodySizedDisclosure(page: Page, text: string) {
  const block = page.locator("[data-disclosure]").filter({ hasText: text }).first();
  await expect(block).toBeVisible();
  const [disclosureSize, bodySize] = await Promise.all([
    block.locator("p").evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize)),
  ]);
  expect(disclosureSize).toBeGreaterThanOrEqual(bodySize);
  const opacity = await block.evaluate((element) => Number(getComputedStyle(element).opacity));
  expect(opacity).toBe(1);
}

for (const path of v20Routes) {
  test(`${path} renders a titled main region`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toHaveCount(1);
  });
}

test("the 2.0 release page is current and carries the disclosure and differs block", async ({
  page,
}) => {
  await page.goto("/releases/2.0");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "What do AI security agents find that SAST does not, and what do they miss that SAST catches?",
    }),
  ).toBeVisible();
  await expect(page.locator(".release-meta").first()).toContainText("Current");
  await expectBodySizedDisclosure(page, disclosure.long);
  await expect(page.getByRole("heading", { name: "Two releases, two questions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Snyk publication" })).toHaveCount(0);

  const sectionOrder = await page
    .locator("section[id]")
    .evaluateAll((sections) => sections.map((section) => section.id));
  const findingSections = ["complementarity", "policy", "efficiency", "robustness"].map((id) =>
    sectionOrder.indexOf(id),
  );
  expect(findingSections.every((index) => index >= 0)).toBe(true);
  expect(findingSections).toEqual([...findingSections].sort((a, b) => a - b));
});

test("2.0 figures carry the paper caption and alt text and follow the colour theme", async ({
  page,
}) => {
  await page.goto("/releases/2.0");
  for (const { paper_figure, caption, alt } of figures.filter(({ paper_figure }) => paper_figure !== 13)) {
    const figure = page.locator(`#figure-${paper_figure}`);
    await expect(figure.locator("figcaption")).toContainText(`Figure ${paper_figure}.`);
    await expect(figure.locator("figcaption")).toContainText(caption);
    await expect(figure.getByRole("img", { name: alt })).toBeVisible();
    await expect(figure.getByRole("img", { name: alt })).toHaveAttribute(
      "src",
      /\/figures\/2\.0\/svg\/light\//u,
    );
  }

  await prepareTheme(page, "light", "dark");
  await page.goto("/releases/2.0");
  await expect(page.locator("#figure-1").getByRole("img")).toHaveAttribute(
    "src",
    /\/figures\/2\.0\/svg\/dark\//u,
  );
});

test("the 2.0 methodology page lists both releases' context and the disclosure", async ({
  page,
}) => {
  await page.goto("/releases/2.0/methodology");
  await expectBodySizedDisclosure(page, disclosure.long);
  await expect(page.getByRole("heading", { name: "What the protocol cannot establish" })).toBeVisible();
  await expect(page.locator("#metrics dt")).toHaveCount(9);
  await expect(page.getByRole("table", { name: /Reference vulnerabilities by language family/u })).toBeVisible();
});

test("2.0 pages carry scholarly citation metadata", async ({ page }) => {
  for (const path of ["/releases/2.0", "/releases/2.0/methodology"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="citation_arxiv_id"]')).toHaveAttribute(
      "content",
      "2610.38617",
    );
    await expect(page.locator('meta[name="citation_pdf_url"]')).toHaveAttribute(
      "content",
      "https://arxiv.org/pdf/2610.38617",
    );
    await expect(page.locator('meta[name="citation_publication_date"]')).toHaveAttribute(
      "content",
      "2026-10-28",
    );
    await expect(page.locator('meta[name="citation_author"]')).toHaveCount(5);
  }
});

test("the 2.0 data page links public repository paths and static tables", async ({
  page,
  request,
}) => {
  await page.goto("/releases/2.0/data");
  await expect(
    page.getByRole("link", { name: "Main dataset" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/snyk-labs/snyk-vulnbench/tree/main/publications/vulnbench-v2/20260907-vulnbench-v2-deepsec-150-574753a2",
  );
  await expect(page.locator("#corrections")).toBeVisible();

  const csv = await request.get("/data/2.0/headline.csv");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toBe(readContent("tables/headline.csv"));
  const meta = await request.get("/data/2.0/headline.meta.json");
  expect(meta.status()).toBe(200);
  const metaText = await meta.text();
  expect(metaText).not.toMatch(/source_claims|\bC-[A-Z0-9]+-\d+/u);
});

test("the 2.0 explorer selects a view from the URL and keeps every view without JavaScript", async ({
  browser,
  page,
}) => {
  await page.goto("/releases/2.0/explore?view=efficiency");
  await expect(page.locator("#view-efficiency")).toBeVisible();
  await expect(page.locator("#view-complementarity")).toBeHidden();
  await expect(page.getByRole("link", { name: "Efficiency" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  const context = await browser.newContext({ javaScriptEnabled: false });
  const noScript = await context.newPage();
  await noScript.goto("/releases/2.0/explore?view=efficiency");
  for (const view of ["summary", "complementarity", "harness-policy", "efficiency", "findings"]) {
    await expect(noScript.locator(`#view-${view}`)).toBeVisible();
  }
  await context.close();
});

test("the homepage presents 2.0 as current with the short disclosure and both releases", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".release-line")).toContainText("Snyk VulnBench 2.0");
  await expectBodySizedDisclosure(page, disclosure.short);
  const history = page.locator(".release-note");
  await expect(history).toContainText("Snyk VulnBench 2.0");
  await expect(history).toContainText("Snyk VulnBench JS 1.0");
  const text = await history.innerText();
  expect(text.indexOf("Snyk VulnBench 2.0")).toBeLessThan(text.indexOf("Snyk VulnBench JS 1.0"));
});

test("catalogues and citation list 2.0 first and keep JS 1.0 as superseded", async ({ page }) => {
  for (const path of ["/releases", "/data"]) {
    await page.goto(path);
    const headings = await page.locator("main li h2, main li h3").allInnerTexts();
    expect(headings.slice(0, 2)).toEqual(["Snyk VulnBench 2.0", "Snyk VulnBench JS 1.0"]);
    await expect(page.locator("main")).toContainText("Superseded");
  }

  await page.goto("/about");
  const citation = page.locator("#citation");
  const bibtex = await citation.locator("pre code").allInnerTexts();
  expect(bibtex).toHaveLength(2);
  expect(bibtex[0]).toContain("tal2026snykvulnbench20");
  expect(bibtex[1]).toContain("tal2026snykvulnbenchjs10");
  await expectBodySizedDisclosure(page, disclosure.long);
  await expect(page.locator(".team-release")).toHaveCount(2);

  await page.goto("/methodology");
  await expect(page.getByRole("link", { name: /2\.0 methodology/u })).toHaveAttribute(
    "href",
    "/releases/2.0/methodology",
  );
  await expect(page.getByRole("link", { name: /JS 1\.0 methodology/u })).toHaveAttribute(
    "href",
    "/releases/js-1.0/methodology",
  );
});

test("2.0 pages fit a 360 px phone without horizontal page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/", ...v20Routes, "/about"]) {
    await page.goto(path);
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fits, path).toBe(true);
  }
});
