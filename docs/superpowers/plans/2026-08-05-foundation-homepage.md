# VulnBench Foundation and Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a polished, accessible, statically generated VulnBench website foundation and initiative homepage backed by validated JS 1.0 release evidence.

**Architecture:** Astro owns static routing, layouts, metadata, and narrative rendering. Strict TypeScript modules validate immutable release manifests and expose small view models to pages; React is reserved for lightweight interactive analytical islands. The archived JS 1.0 repository remains an immutable source snapshot, while generated website assets use a separate typed contract.

**Tech Stack:** Astro, TypeScript strict mode, React islands, MDX, Zod, Vitest, Playwright, npm in `node:24-trixie-slim`.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-04-vulnbench-website-design.md`.
- Frame JS 1.0 as a repeatability and Snyk-reference agreement study, never universal accuracy.
- Use static generation only: no runtime API, database, accounts, or server session state.
- Meet WCAG 2.2 AA and preserve useful static content when JavaScript fails.
- Keep narrative-page JavaScript below 200 KB compressed; do not load the future full explorer on the homepage.
- Use warm-neutral surfaces, deep ink text, official Snyk purple accents, no gradients, glass effects, decorative shadows, or hacker imagery.
- Preserve `snyk-vulnbench-js-1.0/` as an immutable snapshot of upstream commit `7c944ea438a31ea4cbd6803f1bb9560d01f932e5`.
- Do not commit changes unless the user explicitly asks.

## File Map

- `snyk-vulnbench-js-1.0/` — immutable upstream source snapshot and provenance.
- `package.json`, `package-lock.json`, `astro.config.ts`, `tsconfig.json`, `vitest.config.ts` — project and verification configuration.
- `src/data/releases/` — release schema, JS 1.0 manifest, selectors, and contract tests.
- `src/layouts/BaseLayout.astro` — common document metadata and page shell.
- `src/components/site/` — navigation, footer, wordmark, release status, and reusable links.
- `src/components/home/` — homepage-only narrative and evidence components.
- `src/components/charts/RecurrenceContrast.tsx` — small homepage analytical island with accessible exact values.
- `src/styles/` — tokens, reset, typography, layout, focus, and responsive behavior.
- `src/pages/` — initiative and release routes with static content.
- `tests/e2e/` — route, accessibility, keyboard, and responsive smoke coverage.

---

### Task 1: Import the immutable JS 1.0 source snapshot

**Files:**
- Create: `snyk-vulnbench-js-1.0/**`
- Create: `snyk-vulnbench-js-1.0/UPSTREAM-PROVENANCE.md`
- Create: `scripts/verify-source-import.mjs`
- Test: `tests/source-import.test.ts`

**Interfaces:**
- Consumes: GitHub repository `snyk-labs/snyk-vulnbench-js-1.0` at commit `7c944ea438a31ea4cbd6803f1bb9560d01f932e5`.
- Produces: `verifySourceImport(rootDir): Promise<{ fileCount: number; nestedGit: boolean }>` and a local immutable source tree.

- [ ] **Step 1: Add a failing source-import contract test**

```ts
import { describe, expect, it } from "vitest";
import { verifySourceImport } from "../scripts/verify-source-import.mjs";

describe("JS 1.0 source snapshot", () => {
  it("contains the exact declared upstream source without nested Git metadata", async () => {
    const result = await verifySourceImport(process.cwd());
    expect(result.nestedGit).toBe(false);
    expect(result.importedCommit).toBe(
      "7c944ea438a31ea4cbd6803f1bb9560d01f932e5",
    );
    expect(result.upstreamTree).toBe(
      "e1490c821be5be869b91e482eb037e3f2672f432",
    );
    expect(result.requiredFiles).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because the snapshot is absent**

Run in the development container: `npm exec vitest run tests/source-import.test.ts`

Expected: FAIL because `snyk-vulnbench-js-1.0/UPSTREAM-PROVENANCE.md` does not exist.

- [ ] **Step 3: Download and unpack the exact upstream commit**

```bash
archive="$(mktemp)"
staging="$(mktemp -d)"
gh api "repos/snyk-labs/snyk-vulnbench-js-1.0/tarball/7c944ea438a31ea4cbd6803f1bb9560d01f932e5" > "$archive"
tar -xzf "$archive" -C "$staging" --strip-components=1
mkdir "snyk-vulnbench-js-1.0"
cp -R "$staging"/. "snyk-vulnbench-js-1.0/"
rm -rf "$archive" "$staging"
```

- [ ] **Step 4: Record provenance and implement verification**

`UPSTREAM-PROVENANCE.md` must record the source URL, commit SHA, tree SHA, commit timestamp `2026-06-09T06:39:46Z`, and import date `2026-08-05`.

`verify-source-import.mjs` must reject nested `.git` directories and assert the required benchmark JSONL, ten fixture `findings.json` files, chart manifest, article notes, generated HTML, and Apache 2.0 license exist.

- [ ] **Step 5: Re-run the source-import test**

Run in the development container: `npm exec vitest run tests/source-import.test.ts`

Expected: PASS with zero missing required files and no nested Git metadata.

### Task 2: Scaffold the static Astro application and test harness

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `astro.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/env.d.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces scripts: `dev`, `build`, `preview`, `check`, `test`, `test:unit`, and `test:e2e`.

- [ ] **Step 1: Initialize Astro without replacing repository documentation**

Run in the development container: `npm create astro@latest -- . --template minimal --typescript strict --install false --git false`

Keep the existing `README.md`, `LICENSE`, `docs/`, and imported source directory.

- [ ] **Step 2: Install runtime integrations and validation**

Run in the development container: `npm install @astrojs/mdx @astrojs/react @astrojs/sitemap @astrojs/partytown @vitejs/plugin-react astro react react-dom zod`

- [ ] **Step 3: Install verification dependencies**

Run in the development container: `npm install --save-dev @astrojs/check @playwright/test @testing-library/jest-dom @testing-library/react @types/node @types/react @types/react-dom jsdom typescript vitest`

- [ ] **Step 4: Configure static output and strict checks**

```ts
// astro.config.ts
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://vulnbench.com",
  output: "static",
  integrations: [mdx(), react(), sitemap()],
});
```

`tsconfig.json` extends `astro/tsconfigs/strictest`. Vitest uses the `jsdom` environment for component tests and includes `src/**/*.test.ts?(x)` plus `tests/**/*.test.ts?(x)`.

- [ ] **Step 5: Verify the empty application baseline**

Run in the development container: `npm run check && npm run test:unit && npm run build`

Expected: all commands exit 0 and `dist/index.html` is generated.

### Task 3: Define and validate the release contract

**Files:**
- Create: `src/data/releases/schema.ts`
- Create: `src/data/releases/js-1.0.ts`
- Create: `src/data/releases/index.ts`
- Create: `src/data/releases/headline.ts`
- Test: `src/data/releases/releases.test.ts`
- Test: `src/data/releases/headline.test.ts`

**Interfaces:**
- Produces: `Release`, `releaseSchema`, `releases`, `currentRelease`, and `getHeadlineEvidence(releaseId)`.
- `getHeadlineEvidence("js-1.0")` returns recurrence counts with exact numerators, denominators, labels, units, source, and dataset version.

- [ ] **Step 1: Write failing release-schema and headline tests**

```ts
import { expect, it } from "vitest";
import { currentRelease } from "./index";
import { getHeadlineEvidence } from "./headline";

it("exposes JS 1.0 as the current repeatability release", () => {
  expect(currentRelease.slug).toBe("js-1.0");
  expect(currentRelease.studyType).toBe(
    "Repeatability and Snyk-reference agreement",
  );
  expect(currentRelease.evidence.scans).toBe(300);
});

it("reconstructs the three published recurrence values", () => {
  expect(getHeadlineEvidence("js-1.0")).toMatchObject({
    matchedAllFive: { numerator: 134, denominator: 158 },
    unmatchedOnce: { numerator: 80, denominator: 161 },
    unmatchedAllFive: { numerator: 22, denominator: 161 },
  });
});
```

- [ ] **Step 2: Run the focused tests and confirm missing modules fail**

Run in the development container: `npm exec vitest run src/data/releases/releases.test.ts src/data/releases/headline.test.ts`

Expected: FAIL because the release modules do not exist.

- [ ] **Step 3: Implement the Zod release schema**

The schema must validate stable ID and slug, status, dates, dataset version, study type, research question, evidence counts, publication URLs, available views, metric definitions, caveats, headline findings, and cross-release compatibility.

Use URL validation for external resources and positive integer validation for evidence counts and recurrence denominators.

- [ ] **Step 4: Add the JS 1.0 manifest and selectors**

Use:

```ts
{
  id: "snyk-vulnbench-js-1.0",
  slug: "js-1.0",
  name: "Snyk VulnBench JS 1.0",
  status: "current",
  publishedAt: "2026-06-11",
  datasetVersion: "1.0.0",
  researchQuestion: "Can LLMs find the same bugs twice?",
  studyType: "Repeatability and Snyk-reference agreement",
  evidence: { scans: 300, projects: 10, configurations: 6, repetitions: 5 }
}
```

Include the arXiv paper, Snyk publication, upstream GitHub repository, local methodology route, and local data route.

- [ ] **Step 5: Re-run release contract tests**

Run in the development container: `npm exec vitest run src/data/releases`

Expected: PASS, including schema rejection tests for duplicate IDs, missing units, and non-finite values.

### Task 4: Build the visual system and global site shell

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/site/Wordmark.astro`
- Create: `src/components/site/SiteHeader.astro`
- Create: `src/components/site/SiteFooter.astro`
- Create: `src/components/site/ReleaseBadge.astro`
- Test: `tests/e2e/site-shell.spec.ts`

**Interfaces:**
- `BaseLayout` accepts `{ title, description, canonicalPath, image?, article? }`.
- The shell exposes skip navigation, one `main` landmark, sparse global navigation, citation-ready metadata, and a responsive menu that works without client JavaScript.

- [ ] **Step 1: Write a failing shell route test**

```ts
import { expect, test } from "@playwright/test";

test("renders the initiative shell with keyboard-visible navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeAttached();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});
```

- [ ] **Step 2: Run the focused test and confirm shell semantics are missing**

Run in the development container: `npm run test:e2e -- tests/e2e/site-shell.spec.ts`

Expected: FAIL because the site shell is not implemented.

- [ ] **Step 3: Implement design tokens and the base document**

Define warm paper, deep ink, muted ink, Snyk purple, matched teal, unmatched rust, warning amber, structural rules, spacing, type scale, tabular numerals, focus ring, content widths, and responsive breakpoints as CSS custom properties.

Use system sans and monospace stacks to avoid a render-blocking font dependency. Respect `prefers-reduced-motion`.

- [ ] **Step 4: Implement responsive header and footer**

Primary links: Overview, Releases, Explore, Methodology, Data, and GitHub. Point Explore at `/releases/js-1.0/explore`; this route initially redirects to the release overview's evidence section until the Phase 2 explorer exists.

The footer must expose the current release, paper, methodology, data, GitHub, Apache 2.0 notice, and the explicit statement “A Snyk benchmark initiative.”

- [ ] **Step 5: Re-run the shell test**

Run in the development container: `npm run test:e2e -- tests/e2e/site-shell.spec.ts`

Expected: PASS on desktop and mobile Playwright projects.

### Task 5: Build the evidence-led initiative homepage

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/components/home/Hero.astro`
- Create: `src/components/home/EvidenceStrip.astro`
- Create: `src/components/home/LatestEvidence.astro`
- Create: `src/components/home/KeyFindings.astro`
- Create: `src/components/home/BenchmarkAnatomy.astro`
- Create: `src/components/home/ResearchPrinciples.astro`
- Create: `src/components/home/PublicationBlock.astro`
- Create: `src/components/charts/RecurrenceContrast.tsx`
- Test: `src/components/charts/RecurrenceContrast.test.tsx`
- Test: `tests/e2e/homepage.spec.ts`

**Interfaces:**
- `RecurrenceContrast` consumes `HeadlineEvidence` and renders focusable exact-value marks plus an equivalent table.
- Every evidence link includes a deterministic future explorer query string, such as `/releases/js-1.0/explore?view=repeatability&status=matched&recurrence=5`.

- [ ] **Step 1: Write failing chart and homepage-content tests**

```tsx
it("gives pointer and keyboard users the same recurrence values", () => {
  render(<RecurrenceContrast evidence={headlineEvidence} />);
  expect(screen.getByRole("img", { name: /finding recurrence/i })).toBeVisible();
  expect(screen.getByRole("table", { name: /exact recurrence values/i }))
    .toHaveTextContent("134 of 158");
  expect(screen.getByText("Dataset 1.0.0")).toBeVisible();
});
```

The Playwright test must assert the exact research question, study-type label, four evidence counts, primary CTA, three headline recurrence values, three key findings, six benchmark steps, methodology/data/publication links, and one `h1`.

- [ ] **Step 2: Run tests and confirm they fail because homepage components are absent**

Run in the development container: `npm exec vitest run src/components/charts/RecurrenceContrast.test.tsx && npm run test:e2e -- tests/e2e/homepage.spec.ts`

Expected: FAIL on missing chart and homepage content.

- [ ] **Step 3: Implement the hero and evidence strip**

Lead with “Can LLMs find the same bugs twice?” and label the release as “A repeatability and Snyk-reference agreement study.” Keep the first viewport compact enough to show the 300 scans / 10 projects / 6 configurations / 5 repetitions evidence strip.

The primary action is “Explore the results”; secondary actions are “Read the paper”, “View methodology”, and “Download data”.

- [ ] **Step 4: Implement the recurrence contrast island**

Render three restrained horizontal measures:

- 134/158 reference-matched findings appeared in all five runs.
- 80/161 unmatched findings appeared in only one run.
- 22/161 unmatched findings appeared in all five runs.

Use color and line/marker shape together. Exact values must be available on focus and in the always-present table. Hydrate with `client:visible`; the pre-rendered HTML must remain meaningful without JavaScript.

- [ ] **Step 5: Implement the narrative sections**

Add latest evidence, three linked key findings, six-step benchmark anatomy, current release timeline entry, research principles, explicit limitations, authors (Liran Tal, Johannes Kloos, Arsenii Rudich, Stephen Thoemmes, Manoj Nair), preferred citation, and publication links.

- [ ] **Step 6: Re-run homepage tests**

Run in the development container: `npm exec vitest run src/components/charts/RecurrenceContrast.test.tsx && npm run test:e2e -- tests/e2e/homepage.spec.ts`

Expected: PASS with JavaScript enabled and with `javaScriptEnabled: false`.

### Task 6: Add complete static navigation destinations

**Files:**
- Create: `src/pages/releases/index.astro`
- Create: `src/pages/releases/js-1.0/index.astro`
- Create: `src/pages/releases/js-1.0/explore.astro`
- Create: `src/pages/releases/js-1.0/methodology.astro`
- Create: `src/pages/releases/js-1.0/data.astro`
- Create: `src/pages/methodology.astro`
- Create: `src/pages/data.astro`
- Create: `src/pages/about.astro`
- Test: `tests/e2e/routes.spec.ts`

**Interfaces:**
- Every global navigation URL resolves to static HTML.
- `/releases/js-1.0/explore` preserves query parameters and presents a Phase 1 evidence summary plus a clear link back to the release narrative; it must not pretend the Phase 2 workbench exists.

- [ ] **Step 1: Write a failing route inventory test**

```ts
for (const path of [
  "/",
  "/releases",
  "/releases/js-1.0",
  "/releases/js-1.0/explore",
  "/releases/js-1.0/methodology",
  "/releases/js-1.0/data",
  "/methodology",
  "/data",
  "/about",
]) {
  test(`${path} renders a titled main region`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/\S+/);
    await expect(page.locator("main h1")).toHaveCount(1);
  });
}
```

- [ ] **Step 2: Run the route inventory and confirm missing routes fail**

Run in the development container: `npm run test:e2e -- tests/e2e/routes.spec.ts`

Expected: FAIL with 404 responses for routes not yet implemented.

- [ ] **Step 3: Implement concise, honest Phase 1 destinations**

Populate pages from the validated release manifest. The release overview must cover the research question, benchmark design, central repeatability result, complementarity, efficiency caveat, practical implications, limitations, and publication actions.

The data page must identify dataset version `1.0.0`, source provenance, JSONL source, fixture reference files, and downloadable static assets. The methodology page must state matching and reference-set caveats adjacent to metric definitions.

- [ ] **Step 4: Re-run route tests**

Run in the development container: `npm run test:e2e -- tests/e2e/routes.spec.ts`

Expected: PASS with no dead internal navigation destinations.

### Task 7: Verify accessibility, metadata, performance, and build output

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/metadata.spec.ts`
- Create: `scripts/check-build-budget.mjs`
- Modify: `package.json`

**Interfaces:**
- `npm run verify` runs type checks, unit tests, static build, route tests, and the narrative JavaScript budget.

- [ ] **Step 1: Add failing acceptance tests**

Test keyboard order, landmarks, reduced-motion media query, 200% viewport reflow, canonical URL, Open Graph fields, citation metadata, `ScholarlyArticle` JSON-LD, `Dataset` JSON-LD, sitemap, robots file, and a narrative-page compressed JavaScript budget below 200 KB.

- [ ] **Step 2: Run acceptance tests and confirm missing metadata or scripts fail**

Run in the development container: `npm run build && npm run test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/metadata.spec.ts`

Expected: FAIL until structured metadata, robots output, and budget script exist.

- [ ] **Step 3: Implement acceptance metadata and budget checks**

Add JSON-LD and citation meta from the validated release manifest. The budget script must total compressed JavaScript referenced by `dist/index.html` and fail above `204800` bytes.

- [ ] **Step 4: Run the complete verification suite**

Run in the development container: `npm run verify`

Expected: type checks pass, all unit and browser tests pass, static build succeeds, all internal routes resolve, and narrative JavaScript stays within budget.

- [ ] **Step 5: Run security checks for changed application code and dependencies**

Run the repository's Snyk code and dependency scans after the local build is green. Resolve new actionable findings introduced by this slice or report any definitive authentication blocker.

