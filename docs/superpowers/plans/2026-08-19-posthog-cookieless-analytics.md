# PostHog Cookieless Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostHog EU Cloud page-view analytics that uses no browser storage, collects no behavioral events, and publishes an accessible VulnBench privacy disclosure.

**Architecture:** A typed configuration module owns the public PostHog token, EU ingestion host, cookieless safeguards, and URL/referrer redaction. A small Astro component initializes `posthog-js` once from the shared layout and sends a single sanitized document page-view event. A static privacy route and footer links disclose the constrained processing and point to Snyk’s canonical policies.

**Tech Stack:** Astro 7, TypeScript 6, `posthog-js`, Vitest 4, Playwright, Axe.

## Global Constraints

- Run all package, build, test, and wizard commands from the repository root.
- Run `npx -y @posthog/wizard@latest` as requested; retain only the audited `posthog-js` dependency and the implementation specified below.
- Use EU Cloud only: `https://eu.i.posthog.com`.
- Keep PostHog Cookieless server hash mode enabled and client-IP capture discarded in the PostHog project dashboard.
- Use `cookieless_mode: "always"`, `persistence: "memory"`, and `person_profiles: "never"`.
- Send one `$pageview` per rendered document. Never call `identify`, `alias`, people APIs, group APIs, or custom capture APIs.
- Disable autocapture, heatmaps, Web Vitals autocapture, feature flags, replay, surveys, exception capture, automatic page views, and page-leave capture.
- Never send query strings, fragments, referrers, or explorer state to PostHog.
- Preserve static architecture, no-JavaScript content, WCAG 2.2 AA, both design themes, and the 200 KB compressed narrative-JavaScript budget.
- The project token is a public write-only client token. Do not use it in a server endpoint, environment secret, or public documentation.
- Do not commit, push, amend, or create a pull request unless the user explicitly requests it.

---

## File Structure

- `package.json` and `package-lock.json` — add the audited official browser SDK.
- `src/config/posthog.ts` — single source of truth for the EU Cloud token, restrictive SDK options, and URL redaction.
- `src/config/posthog.test.ts` — unit contract for restrictive options and URL sanitization.
- `src/components/site/PostHogAnalytics.astro` — browser-only SDK initialization and one manual page-view capture.
- `src/layouts/BaseLayout.astro` — renders the analytics component once in every document.
- `src/pages/privacy.astro` — static disclosure of the precise analytics behavior and links to Snyk policies.
- `src/components/site/SiteFooter.astro` — direct links to the local privacy page and Snyk terms.
- `tests/e2e/privacy.spec.ts` — browser coverage of disclosure, links, sanitized capture, and no-JavaScript behavior.
- `tests/e2e/accessibility.spec.ts` — includes `/privacy` in the existing Axe route matrix.
- `docs/CONVENTIONS.md` — records the durable privacy-minimization rule and verification boundary.

### Task 1: Install and lock the audited PostHog browser SDK

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: the `posthog-js` package import used by `src/components/site/PostHogAnalytics.astro`.

- [ ] **Step 1: Record the pre-wizard working tree**

Run:

```sh
git status --short
```

Expected: only the already-approved design and implementation-plan documents are modified or untracked; no unrelated file is changed.

- [ ] **Step 2: Run the requested PostHog wizard**

Run:

```sh
npx -y @posthog/wizard@latest
```

Select the JavaScript web SDK and the EU Cloud project. Supply the public project token only to the wizard prompt. Do not select autocapture, heatmaps, Web Vitals, replay, surveys, feature flags, error tracking, or consent-banner generation.

- [ ] **Step 3: Inspect and constrain wizard output**

Run:

```sh
git diff -- package.json package-lock.json src
```

Expected: `posthog-js` is the only runtime package retained. Remove any wizard-generated initialization, generated consent UI, source-map upload configuration, or framework-specific files; Task 2 supplies the reviewed integration.

- [ ] **Step 4: Verify the resolved dependency**

Run:

```sh
npm ls posthog-js && npm audit --omit=dev
```

Expected: `posthog-js` resolves once with no high- or critical-severity production dependency vulnerability. If the audit reports one, stop and report it rather than integrating the package.

### Task 2: Define and test the cookieless analytics contract

**Files:**
- Create: `src/config/posthog.ts`
- Create: `src/config/posthog.test.ts`

**Interfaces:**
- Produces: `posthogProjectToken: string`, `posthogOptions: Partial<PostHogConfig>`, and `sanitizeAnalyticsUrl(url: string): string | null`.
- Consumed by: `src/components/site/PostHogAnalytics.astro`.

- [ ] **Step 1: Write the failing unit contract**

Create `src/config/posthog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  posthogOptions,
  sanitizeAnalyticsUrl,
} from "./posthog";

describe("PostHog privacy contract", () => {
  it("uses EU cookieless page-view-only settings", () => {
    expect(posthogOptions).toMatchObject({
      api_host: "https://eu.i.posthog.com",
      cookieless_mode: "always",
      persistence: "memory",
      person_profiles: "never",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_performance: false,
      capture_exceptions: false,
      disable_session_recording: true,
      disable_surveys: true,
      advanced_disable_flags: true,
    });
  });

  it("removes query strings and fragments from analytics URLs", () => {
    expect(
      sanitizeAnalyticsUrl(
        "https://vulnbench.com/releases/js-1.0/explore?v=1&view=findings#detail",
      ),
    ).toBe("https://vulnbench.com/releases/js-1.0/explore");
    expect(sanitizeAnalyticsUrl("not a URL")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```sh
npm run test:unit -- src/config/posthog.test.ts
```

Expected: FAIL because `./posthog` does not exist.

- [ ] **Step 3: Implement the restrictive typed configuration**

Create `src/config/posthog.ts`:

```ts
import type { PostHogConfig } from "posthog-js";

export const posthogProjectToken =
  "phc_uk6CX56oMAvZ9i3aaRgwq2Fqz7Js9uHUbFt33ZPQhhvL";

export function sanitizeAnalyticsUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
}

export const posthogOptions = {
  api_host: "https://eu.i.posthog.com",
  defaults: "2026-05-30",
  cookieless_mode: "always",
  persistence: "memory",
  person_profiles: "never",
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,
  capture_performance: false,
  capture_exceptions: false,
  disable_session_recording: true,
  disable_surveys: true,
  advanced_disable_flags: true,
  property_denylist: ["$referrer", "$referring_domain"],
} satisfies Partial<PostHogConfig>;
```

- [ ] **Step 4: Verify the unit contract passes**

Run:

```sh
npm run test:unit -- src/config/posthog.test.ts
```

Expected: PASS with two tests.

### Task 3: Initialize PostHog once and emit only a sanitized page view

**Files:**
- Create: `src/components/site/PostHogAnalytics.astro`
- Modify: `src/layouts/BaseLayout.astro:1-162`
- Modify: `src/config/posthog.ts`
- Modify: `src/config/posthog.test.ts`

**Interfaces:**
- Consumes: `posthogProjectToken`, `posthogOptions`, and `sanitizeAnalyticsUrl`.
- Produces: exactly one `$pageview` request per JavaScript-enabled document load with a URL limited to origin and pathname.

- [ ] **Step 1: Extend the failing unit contract for event filtering**

Update the existing import in `src/config/posthog.test.ts` to:

```ts
import type { CaptureResult } from "posthog-js";
import {
  posthogOptions,
  sanitizeAnalyticsUrl,
  sanitizePostHogEvent,
} from "./posthog";
```

Append this test inside the existing `describe("PostHog privacy contract", ...)`
block:

```ts
  it("drops non-pageview events and redacts pageview URL and referrer", () => {
  expect(
    sanitizePostHogEvent({
      event: "$autocapture",
      properties: {},
    } as CaptureResult),
  ).toBeNull();

  expect(
    sanitizePostHogEvent({
      event: "$pageview",
      properties: {
        $current_url: "https://vulnbench.com/?email=reader@example.com#top",
        $referrer: "https://example.test/?token=secret",
        $referring_domain: "example.test",
      },
    } as CaptureResult),
  ).toEqual({
    event: "$pageview",
    properties: {
      $current_url: "https://vulnbench.com/",
    },
  });
  });
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```sh
npm run test:unit -- src/config/posthog.test.ts
```

Expected: FAIL because `sanitizePostHogEvent` is not exported.

- [ ] **Step 3: Add the event sanitizer**

Change the type-only import in `src/config/posthog.ts` to:

```ts
import type { CaptureResult, PostHogConfig } from "posthog-js";
```

Add this function above `posthogOptions`:

```ts
export function sanitizePostHogEvent(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event || event.event !== "$pageview") {
    return null;
  }

  const currentUrl = sanitizeAnalyticsUrl(
    typeof event.properties.$current_url === "string"
      ? event.properties.$current_url
      : "",
  );

  if (!currentUrl) {
    return null;
  }

  return {
    ...event,
    properties: {
      $current_url: currentUrl,
    },
  };
}
```

Add `before_send: sanitizePostHogEvent` to `posthogOptions`.

- [ ] **Step 4: Add the shared browser-only analytics component**

Create `src/components/site/PostHogAnalytics.astro`:

```astro
<script>
  import posthog from "posthog-js";
  import {
    posthogOptions,
    posthogProjectToken,
    sanitizeAnalyticsUrl,
  } from "../../config/posthog";

  posthog.init(posthogProjectToken, posthogOptions);

  const currentUrl = sanitizeAnalyticsUrl(window.location.href);
  if (currentUrl) {
    posthog.capture("$pageview", { $current_url: currentUrl });
  }
</script>
```

Modify `src/layouts/BaseLayout.astro`:

```astro
---
import PostHogAnalytics from "../components/site/PostHogAnalytics.astro";
import SiteFooter from "../components/site/SiteFooter.astro";
```

Render it as the final element of `<head>`, after `<slot name="head" />`:

```astro
    <slot name="head" />
    <PostHogAnalytics />
```

- [ ] **Step 5: Verify focused unit and type checks pass**

Run:

```sh
npm run test:unit -- src/config/posthog.test.ts && npm run check
```

Expected: PASS with three PostHog unit tests and zero Astro/TypeScript errors.

### Task 4: Publish the privacy disclosure and legal links

**Files:**
- Create: `src/pages/privacy.astro`
- Modify: `src/components/site/SiteFooter.astro:53-56`
- Create: `tests/e2e/privacy.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts:4-20`

**Interfaces:**
- Produces: a crawlable `/privacy` route and accessible footer links named “Privacy” and “Terms of service”.

- [ ] **Step 1: Write failing browser tests**

Create `tests/e2e/privacy.spec.ts`:

```ts
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
```

Add `"/privacy"` to the `routes` array in `tests/e2e/accessibility.spec.ts`.

- [ ] **Step 2: Run the privacy test to verify it fails**

Run:

```sh
npm run test:e2e -- tests/e2e/privacy.spec.ts
```

Expected: FAIL with a 404 response for `/privacy`.

- [ ] **Step 3: Add the static privacy route**

Create `src/pages/privacy.astro`:

```astro
---
import PageHero from "../components/site/PageHero.astro";
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout
  title="Privacy"
  description="How Snyk VulnBench uses privacy-minimized, cookieless analytics."
>
  <PageHero
    eyebrow="Privacy"
    title="Privacy"
    description="Snyk VulnBench measures aggregate page visits without analytics cookies, browser storage, visitor identification, or behavioral tracking."
  />

  <section class="section">
    <div class="container prose reading-width">
      <h2>Analytics</h2>
      <p>
        We use PostHog EU Cloud to measure aggregate page visits and understand
        which public research pages are useful. PostHog does not use analytics
        cookies or browser storage on this website.
      </p>
      <p>
        We discard client IP data, do not identify visitors or create person
        profiles, and do not collect clicks, form interactions, heatmaps, Web
        Vitals, session replay, surveys, feature-flag evaluations, exceptions,
        or page-leave events.
      </p>
      <p>
        Analytics receives only the page origin and path. Query strings,
        fragments, and referrer URLs are removed before page-view data is sent.
      </p>

      <h2>Policies and requests</h2>
      <p>
        Read the <a href="https://snyk.io/policies/privacy/">Snyk Privacy Notice</a>
        and <a href="https://snyk.io/policies/terms-of-service/">Snyk Terms of Service</a>
        for privacy rights, contact details, and governing terms.
      </p>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 4: Add footer legal links**

Replace the current legal links in `src/components/site/SiteFooter.astro` with:

```astro
  <div class="legal container">
    <p>© 2026 Snyk Limited. Research artifacts are provided under Apache 2.0.</p>
    <div class="legal-links">
      <a href="/about">About VulnBench</a>
      <a href="/privacy">Privacy</a>
      <a href="https://snyk.io/policies/terms-of-service/">Terms of service</a>
    </div>
  </div>
```

Add this style inside the component’s existing `<style>` block:

```css
  .legal-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
```

- [ ] **Step 5: Verify privacy, Axe, and route coverage**

Run:

```sh
npm run test:e2e -- tests/e2e/privacy.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/routes.spec.ts
```

Expected: PASS across desktop and mobile Chromium projects with no Axe violations.

### Task 5: Prove network and no-JavaScript privacy behavior, then document the rule

**Files:**
- Modify: `tests/e2e/privacy.spec.ts`
- Modify: `docs/CONVENTIONS.md`

**Interfaces:**
- Verifies: JavaScript-enabled pages request PostHog only with a sanitized page view; JavaScript-disabled pages do not request PostHog.

- [ ] **Step 1: Add network and no-JavaScript privacy regression tests**

Append to `tests/e2e/privacy.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused privacy regression tests**

Run:

```sh
npm run test:e2e -- tests/e2e/privacy.spec.ts
```

Expected: PASS. The intercepted request body is available to Playwright before
network transmission and is checked for the sanitized page-view contract.

- [ ] **Step 3: Confirm the network assertions pass without weakening transport security**

Do not add a compression override solely for testing. The Playwright route
intercepts the request before it leaves the test browser and exposes its
uncompressed request body through `request.postData()`.

- [ ] **Step 4: Record the durable convention**

Append this subsection to `docs/CONVENTIONS.md`:

```md
## Cookieless analytics

When analytics is approved for a public VulnBench release, it must default to
PostHog EU Cloud cookieless page-view measurement. Keep Cookieless server hash
mode and IP discard enabled in PostHog, use no browser persistence or person
profiles, and disable behavioral collection such as autocapture, heatmaps,
performance capture, replay, surveys, feature flags, exceptions, and page
leaves. Send only origin-plus-path page views; remove query strings, fragments,
and referrers. Publish the static privacy disclosure and verify both sanitized
network payloads and the absence of PostHog requests with JavaScript disabled.
```

- [ ] **Step 5: Run the focused privacy verification**

Run:

```sh
npm run test:unit -- src/config/posthog.test.ts && npm run test:e2e -- tests/e2e/privacy.spec.ts
```

Expected: PASS. The intercepted payload contains `$pageview` and the route path only; the no-JavaScript browser makes no request to a `posthog.com` host.

### Task 6: Run complete regression and release checks

**Files:**
- Verify only: all files changed by Tasks 1–5.

**Interfaces:**
- Verifies: theme-specific output, accessibility, source integrity, static build, and narrative JavaScript budget remain valid.

- [ ] **Step 1: Run the default static build and budget check**

Run:

```sh
npm run build && npm run check:budget
```

Expected: build succeeds and every narrative page remains at or below `204800` compressed JavaScript bytes.

- [ ] **Step 2: Run the complete required verification gate**

Run:

```sh
npm run verify
```

Expected: Classic and Snyk 2026 verification gates pass, including unit tests, builds, accessibility tests, source integrity, release isolation, and the branded audit.

- [ ] **Step 3: Perform manual PostHog Live Events validation**

Open the deployed site in a new browser profile and visit:

```text
https://vulnbench.com/releases/js-1.0/explore?v=1&view=findings#record
```

Expected: PostHog EU Cloud Live Events receives one `$pageview` whose
`$current_url` is `https://vulnbench.com/releases/js-1.0/explore`; it contains
no query string, fragment, referrer, person profile, autocapture, heatmap, Web
Vitals, replay, survey, exception, feature-flag, or page-leave event.

## Plan Self-Review

- Spec coverage: Tasks 1–3 cover the requested wizard, EU Cloud, cookieless
  initialization, page-view-only scope, disabled features, no profiles, and URL
  minimization. Task 4 supplies the static privacy disclosure and Snyk policy
  links. Task 5 verifies no-JavaScript and network behavior. Task 6 covers the
  required build, budget, and full regression gates.
- Placeholder scan: no TBD/TODO language or undefined file paths remain.
- Type consistency: `posthogProjectToken`, `posthogOptions`,
  `sanitizeAnalyticsUrl`, and `sanitizePostHogEvent` are defined in Task 2/3
  before their use in components and tests.
