import { expect, test } from "@playwright/test";

test("publishes the cookieless analytics disclosure and Snyk policy links", async ({
  page,
}) => {
  await page.goto("/privacy");

  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy" }),
  ).toBeVisible();
  await expect(page.getByText("PostHog EU Cloud")).toBeVisible();
  await expect(
    page.getByText("does not use analytics cookies or browser storage"),
  ).toBeVisible();
  await expect(
    page.getByText("The PostHog project is configured to discard client IP data"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Snyk Privacy Notice" }),
  ).toHaveAttribute("href", "https://snyk.io/policies/privacy/");
  await expect(
    page.getByRole("link", { name: "Snyk Terms of Service" }),
  ).toHaveAttribute("href", "https://snyk.io/policies/terms-of-service/");
});

test("links privacy and terms from the global footer", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute(
    "href",
    "/privacy",
  );
  await expect(
    footer.getByRole("link", { name: "Terms of service" }),
  ).toHaveAttribute("href", "https://snyk.io/policies/terms-of-service/");
});

test("sends only a sanitized PostHog page view", async ({ page }) => {
  const requests: string[] = [];
  await page.route("https://eu.i.posthog.com/**", async (route) => {
    requests.push(route.request().postData() ?? "");
    await route.fulfill({ status: 200, body: "{}" });
  });

  await page.goto("/releases/js-1.0/explore?v=1&view=findings#record");
  await expect.poll(() => requests.length).toBeGreaterThan(0);

  const payload = requests.join("\n");
  expect(payload).toContain("$pageview");
  expect(payload).toContain("/releases/js-1.0/explore");
  expect(payload).not.toContain("view=findings");
  expect(payload).not.toContain("#record");
  expect(payload).not.toContain("$referrer");
  expect(payload).not.toContain("$referring_domain");
});

test("does not load PostHog when JavaScript is unavailable", async ({
  baseURL,
  browser,
}) => {
  if (!baseURL) throw new Error("Playwright baseURL is required");

  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  const posthogRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("posthog.com")) {
      posthogRequests.push(request.url());
    }
  });

  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy" }),
  ).toBeVisible();
  expect(posthogRequests).toEqual([]);
  await context.close();
});
