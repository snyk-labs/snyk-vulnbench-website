import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/releases",
  "/releases/js-1.0",
  "/releases/js-1.0/explore",
  "/releases/js-1.0/methodology",
  "/releases/js-1.0/data",
  "/methodology",
  "/data",
  "/about",
];

for (const path of routes) {
  test(`${path} renders a titled main region`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/\S+/);
    await expect(page.locator("main h1")).toHaveCount(1);
  });
}

test("all internal primary navigation destinations resolve", async ({
  page,
}) => {
  await page.goto("/");

  const links = await page
    .getByRole("navigation", { name: "Primary" })
    .first()
    .getByRole("link")
    .evaluateAll((elements) =>
      elements
        .map((element) => (element as HTMLAnchorElement).href)
        .filter((href) => href.startsWith(window.location.origin)),
    );

  for (const href of links) {
    const response = await page.request.get(href);
    expect(response.status(), href).toBe(200);
  }
});

test("serves immutable JS 1.0 source downloads as static assets", async ({
  request,
}) => {
  const results = await request.get("/data/js-1.0/benchmark-results.jsonl");
  expect(results.status()).toBe(200);
  expect(results.headers()["content-type"]).toContain(
    "application/x-ndjson",
  );
  expect((await results.text()).split("\n").length).toBeGreaterThan(250);

  const manifest = await request.get("/data/js-1.0/chart-manifest.json");
  expect(manifest.status()).toBe(200);
  expect(manifest.headers()["content-type"]).toContain("application/json");
});
