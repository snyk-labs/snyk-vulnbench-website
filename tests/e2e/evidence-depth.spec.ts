import { expect, test } from "@playwright/test";

const explorerIsland =
  'astro-island[component-export="ExplorerApp"]:not([ssr])';

test("serves the normalized finding evidence contract", async ({ request }) => {
  const response = await request.get("/data/js-1.0/finding-evidence.json");
  expect(response.status()).toBe(200);
  const evidence = await response.json();

  expect(evidence.projects).toHaveLength(10);
  expect(
    evidence.findings.filter(
      (finding: { status: string }) => finding.status === "matched",
    ),
  ).toHaveLength(158);
  expect(
    evidence.findings.filter(
      (finding: { status: string }) => finding.status === "unmatched",
    ),
  ).toHaveLength(161);
});

test("filters and selects normalized findings with reproducible URL state", async ({
  page,
}) => {
  await page.goto(
    "/releases/js-1.0/explore?v=1&view=findings&status=unmatched&recurrence=5",
  );
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  await expect(
    page.getByRole("heading", { name: "Normalized finding signatures" }),
  ).toBeVisible();
  await expect(page.getByText("22 signatures match", { exact: false })).toBeVisible();
  const table = page.getByRole("table", {
    name: "Normalized finding signatures",
  });
  await expect(table.getByRole("row")).toHaveCount(23);
  await table.getByRole("button", { name: "Project" }).click();
  await expect(page).toHaveURL(/sort=project-asc/);

  await table.getByRole("button", { name: "Inspect" }).first().click();
  await expect(page).toHaveURL(/finding=[a-f0-9]{20}/);
  await expect(page.locator(".finding-detail h3")).toBeVisible();
  await page.getByRole("button", { name: "Filter to this evidence" }).click();
  await expect(page).toHaveURL(/configs=/);
  await expect(page).toHaveURL(/projects=/);
  await expect(page).toHaveURL(/classes=/);
});

test("renders project evidence and source context", async ({ page }) => {
  await page.goto(
    "/releases/js-1.0/cases/js-project-nightowl-find-vulns",
  );

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "JS Todo App (SQLite 4): Find Vulnerabilities",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /reference findings/,
    }),
  ).toContainText("path-traversal");
  await expect(
    page.getByRole("table", {
      name: /recurrence by configuration/,
    }),
  ).toContainText("Claude Opus 4.6 High");
  await expect(
    page.getByRole("table", {
      name: /matched normalized signatures/,
    }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /unmatched normalized signatures/,
    }),
  ).toBeVisible();
  await expect(page.locator("pre").first()).toContainText("express");
  await expect(
    page.getByRole("link", { name: "Return to explorer evidence" }),
  ).toHaveAttribute(
    "href",
    /view=findings&projects=js-project-nightowl-find-vulns/,
  );
});

test("links all ten projects from the cases catalog", async ({ page }) => {
  await page.goto("/releases/js-1.0/cases");

  const links = page.locator(
    '.project-catalog a[href^="/releases/js-1.0/cases/js-project-"]',
  );
  await expect(links).toHaveCount(10);
});

test("project matrix links preserve and narrow explorer context", async ({
  page,
}) => {
  await page.goto("/releases/js-1.0/explore?v=1&view=coverage");
  await page.locator(explorerIsland).waitFor({ state: "attached" });

  const nightowl = page
    .getByRole("table", { name: "Project and configuration metric matrix" })
    .getByRole("row", { name: /JS Todo App \(SQLite 4\)/ });
  const href = await nightowl.getByRole("link").nth(1).getAttribute("href");
  expect(href).not.toBeNull();
  const url = new URL(href!, "http://localhost");
  const returnPath = url.searchParams.get("return");
  expect(returnPath).toContain(
    "projects=js-project-nightowl-find-vulns",
  );
  expect(returnPath).toMatch(/configs=[^&]+/);
});

for (const view of ["summary", "repeatability", "coverage", "efficiency"]) {
  test(`publishes the ${view} share card`, async ({ request }) => {
    const response = await request.get(`/social/js-1.0/${view}.svg`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    const svg = await response.text();
    expect(svg).toContain("Dataset 1.0.0");
    expect(svg).toContain("Source:");
    expect(svg).toMatch(
      /unique normalized signatures|vulnerability classes|USD\/session/,
    );
  });
}

test("publishes explicit correction status", async ({ page }) => {
  await page.goto("/releases/js-1.0/data#corrections");

  await expect(
    page.getByRole("heading", { name: "No corrections published" }),
  ).toBeVisible();
  await expect(page.locator("#corrections")).toContainText("Dataset 1.0.0");
});
