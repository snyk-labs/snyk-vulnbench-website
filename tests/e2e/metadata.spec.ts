import { expect, test } from "@playwright/test";

test("publishes canonical social metadata", async ({ page, request }) => {
  await page.goto("/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://vulnbench.com/",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Snyk VulnBench",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /https:\/\/vulnbench\.com\/social\/vulnbench-default\.svg/,
  );

  const socialImage = await request.get("/social/vulnbench-default.svg");
  expect(socialImage.status()).toBe(200);
  expect(socialImage.headers()["content-type"]).toContain("image/svg+xml");
});

test("publishes scholarly article, dataset, and citation metadata", async ({
  page,
}) => {
  await page.goto("/releases/js-1.0");

  await expect(page.locator('meta[name="citation_title"]')).toHaveAttribute(
    "content",
    "Snyk VulnBench JS 1.0: Can LLMs Find the Same Bugs Twice?",
  );
  await expect(page.locator('meta[name="citation_author"]')).toHaveCount(5);

  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const graph = structuredData.map((entry) => JSON.parse(entry)).flat();

  expect(graph.some((entry) => entry["@type"] === "ScholarlyArticle")).toBe(
    true,
  );
  expect(graph.some((entry) => entry["@type"] === "Dataset")).toBe(true);
});

test("publishes crawl policy", async ({ request }) => {
  const robots = await request.get("/robots.txt");

  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(
    "Sitemap: https://vulnbench.com/sitemap-index.xml",
  );
});
