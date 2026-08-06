# Restore the Classic VulnBench Trace in Snyk 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Snyk 2026 header trace and branded favicon use the exact
Classic lavender-and-purple VulnBench identity in every visitor color mode.

**Architecture:** Keep the existing build-selected Snyk favicon path so
design-theme asset resolution remains unchanged. Add an explicit Classic trace
override inside the shared wordmark's existing Snyk audit block, replace the
branded favicon contents with the existing Classic SVG identity, and extend the
mechanical audit with a source-scoped exception for those two identity assets.
The Snyk header text and all other branded surfaces remain unchanged.

**Tech Stack:** Astro, SVG, CSS, TypeScript, Vitest, Docker container
`vulnbench-dev`.

## Global Constraints

- Snyk 2026 remains the default build-selected design; Classic remains an
  explicit `VULNBENCH_DESIGN_THEME=classic` override.
- Light remains the default color mode; saved Light or Dark choices remain
  explicit overrides.
- The deployment remains fully static with no runtime theme or favicon API.
- The Classic favicon geometry and colors are the source of truth:
  `#e8e1ff` surface, `#4b2be3` border and dots, five dots, `28 × 28` view box.
- The owner-approved Snyk palette exception applies only to
  `src/components/site/Wordmark.astro`'s branded trace block and
  `public/brand/snyk-2026/favicon.svg`; generic branded audit fixtures and all
  other Snyk sources must continue rejecting `#e8e1ff` and `#4b2be3`.
- Do not alter the vendored `snyk-vulnbench-js-1.0/` source.
- All npm, Astro, Vitest, build, and verification commands run inside
  `node:24-trixie-slim` container `vulnbench-dev`.
- Do not commit or push unless the user explicitly requests it.

---

### Task 1: Add failing identity-contract assertions

**Files:**
- Modify: `src/components/site/branded-shell-contract.test.ts:42-66,111-131`
- Modify: `src/config/brand-static-assets.test.ts:11-55`
- Modify: `tests/scripts/check-snyk-brand.test.ts`

**Interfaces:**
- Consumes: the existing `Wordmark.astro`, Classic `public/favicon.svg`,
  branded `public/brand/snyk-2026/favicon.svg`, and
  `designThemeAssets["snyk-2026"].favicon`.
- Produces: regression assertions requiring the Snyk trace to match the
  Classic identity without changing the asset-selection contract.

- [ ] **Step 1: Require the exact Classic trace colors in the branded wordmark**

In `src/components/site/branded-shell-contract.test.ts`, keep the existing
five-dot and accessible-label assertions, but require the Snyk trace override to
use the approved Classic colors:

```ts
expect(wordmark).toContain(
  ':global(html[data-design-theme="snyk-2026"]) .trace',
);
expect(wordmark).toContain("border-color: #4b2be3;");
expect(wordmark).toContain("background: #e8e1ff;");
expect(wordmark).toContain(
  ':global(html[data-design-theme="snyk-2026"]) .wordmark-trace-dot',
);
expect(wordmark).toContain("background: #4b2be3;");
```

- [ ] **Step 2: Change branded favicon expectations to the Classic identity**

In the same test file, replace the Snyk palette expectations for
`public/brand/snyk-2026/favicon.svg` with the Classic colors and geometry:

```ts
expect(favicon).toContain(
  '<rect x="1" y="1" width="26" height="26" rx="3.5" fill="#e8e1ff" stroke="#4b2be3" stroke-width="1.5"/>',
);
expect(favicon).toContain('<g fill="#4b2be3">');
expect(favicon).not.toContain('fill="#030328"');
expect(favicon).not.toContain('fill="#2B0250"');
expect(favicon).not.toContain('stroke="#6F00DD"');
```

Retain the existing title, five-circle, no-path, and favicon asset-path
assertions.

- [ ] **Step 3: Make the static-asset test compare the branded favicon with Classic**

In `src/config/brand-static-assets.test.ts`, read both favicon files and assert
that the Snyk 2026 favicon is byte-for-byte equal to the Classic favicon:

```ts
const classicFaviconPath = resolve(process.cwd(), "public/favicon.svg");
const brandedFavicon = readFileSync(faviconPath, "utf8");
const classicFavicon = readFileSync(classicFaviconPath, "utf8");

expect(brandedFavicon).toBe(classicFavicon);
```

Keep the existing `designThemeAssets["snyk-2026"].favicon` path assertion.
Remove the now-obsolete locked Snyk palette and circle-geometry assertions from
this test because exact equality with the Classic source is stronger and
prevents the two files from drifting.

- [ ] **Step 4: Add a failing source-scoped brand-audit exception test**

In `tests/scripts/check-snyk-brand.test.ts`, add a test that calls
`auditText` with a new `allowClassicTraceColors: true` option and a
`fileName` for the approved Wordmark source. It must accept these exact
declarations:

```ts
const approvedTrace = `
  .trace { border-color: #4b2be3; background: #e8e1ff; }
  .wordmark-trace-dot { background: #4b2be3; }
`;

expect(
  auditText(approvedTrace, {
    fileName: "src/components/site/Wordmark.astro",
    allowClassicTraceColors: true,
  }),
).toEqual([]);
expect(auditText(approvedTrace, { fileName: "fixture.css" })).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ rule: "off-palette" }),
  ]),
);
```

The test must also assert the same option is accepted for the branded favicon
source, while an unrelated `allowClassicTraceColors: true` fixture is not
treated as an approved source. The implementation should expose the option
only through the audit pipeline used by the two configured source targets.

- [ ] **Step 5: Run the focused tests and verify the failure is intentional**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npx vitest run src/components/site/branded-shell-contract.test.ts src/config/brand-static-assets.test.ts'
```

Expected result: FAIL because the Wordmark does not yet contain the approved
Classic trace declarations, the branded favicon is not yet equal to
`public/favicon.svg`, and the audit does not yet recognize the new scoped
exception option.

### Task 2: Restore the Classic trace implementation

**Files:**
- Modify: `src/components/site/Wordmark.astro:65-79`
- Modify: `public/brand/snyk-2026/favicon.svg:1-10`
- Modify: `scripts/check-snyk-brand.mjs`
- Modify: `src/components/site/branded-shell-contract.test.ts:120-132`

**Interfaces:**
- Consumes: the shared Classic trace CSS and `public/favicon.svg`.
- Produces: Snyk 2026 output with the same trace treatment as Classic while
  preserving build-time Snyk favicon selection.

- [ ] **Step 1: Replace the Snyk trace colors with the approved Classic values**

Keep the existing Snyk audit block in `Wordmark.astro`, including the white
Snyk wordmark text, but change only its trace declarations to:

```css
:global(html[data-design-theme="snyk-2026"]) .trace {
  border-color: #4b2be3;
  background: #e8e1ff;
}

:global(html[data-design-theme="snyk-2026"]) .wordmark-trace-dot {
  background: #4b2be3;
}
```

The resulting trace must continue to render the existing markup:

```astro
<span class="trace" aria-hidden="true">
  <i class="wordmark-trace-dot"></i>
  <i class="wordmark-trace-dot"></i>
  <i class="wordmark-trace-dot"></i>
  <i class="wordmark-trace-dot"></i>
  <i class="wordmark-trace-dot"></i>
</span>
```

- [ ] **Step 2: Copy the exact Classic favicon into the Snyk asset path**

Make `public/brand/snyk-2026/favicon.svg` byte-for-byte identical to
`public/favicon.svg`. The resulting file must retain the Classic `28 × 28`
view box, lavender `#e8e1ff` fill, purple `#4b2be3` stroke/dots, and five
circles.

Because byte-for-byte equality is the contract, remove the branded-shell test's
branded-only `<title>` expectation; the Classic source has no title element.
Keep the five-circle, no-path, exact-geometry, and exact-color assertions.

- [ ] **Step 3: Implement the source-scoped audit exception**

In `scripts/check-snyk-brand.mjs`:

1. Add `CLASSIC_TRACE_HEX` containing only `4B2BE3` and `E8E1FF`.
2. Add an `allowClassicTraceColors` boolean option to the color-audit
   functions and `auditText`, defaulting to `false`.
3. Permit those two hex colors only when that option is true; keep every other
   palette check unchanged.
4. Guard the option with an internal approved-source set containing only
   `src/components/site/Wordmark.astro` and
   `public/brand/snyk-2026/favicon.svg`, so passing the option for any other
   file still rejects the colors.
5. Carry the option through `auditComposition` fragments.
6. Mark only the `Wordmark.astro` target and
   `public/brand/snyk-2026/favicon.svg` target with
   `allowClassicTraceColors: true` in `SOURCE_COMPOSITIONS`.
7. Do not broaden `ALLOWED_HEX` or make the option default to true.

- [ ] **Step 4: Run the focused tests and verify the implementation passes**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npx vitest run src/components/site/branded-shell-contract.test.ts src/config/brand-static-assets.test.ts'
```

Expected result: PASS with both identity-contract test files green.

### Task 3: Run diagnostics and proportional verification

**Files:**
- Verify: `docs/superpowers/specs/2026-08-06-classic-trace-in-snyk-design.md`
- Verify: `docs/superpowers/plans/2026-08-06-classic-trace-in-snyk.md`
- Verify: all files modified in Tasks 1 and 2

**Interfaces:**
- Consumes: the restored Classic identity and existing Classic/Snyk build
  contracts.
- Produces: evidence that the focused change does not regress type checking,
  static generation, accessibility, or either design-theme gate.

- [ ] **Step 1: Run Astro and TypeScript diagnostics**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npm run check'
```

Expected result: PASS with no Astro or TypeScript diagnostics.

- [ ] **Step 2: Run the unit suite**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npm run test:unit'
```

Expected result: PASS, including release contracts, explorer behavior, source
integrity, updated identity tests, and the source-scoped brand-audit tests.

- [ ] **Step 3: Run both design-theme verification gates**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npm run verify:snyk-2026'
docker exec vulnbench-dev sh -lc 'npm run verify:classic'
```

Expected result: both gates pass. The Snyk gate must continue selecting
`/brand/snyk-2026/favicon.svg` and allow the Classic trace exception only in its
two approved identity sources, while the Classic gate must continue selecting
`/favicon.svg`.

- [ ] **Step 4: Inspect the final diff and report verification**

Run:

```sh
git diff --check
git status --short
```

Expected result: no whitespace errors; only the focused spec, plan, audit tests,
identity tests, audit script, wordmark, and branded favicon are changed. Do not
commit or push because the user did not request repository delivery.
