# Phase 1 Evidence Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the publishable JS 1.0 Phase 1 research narrative with a validated configuration scorecard, featured evidence charts, vulnerability/project behavior, and representative cases.

**Architecture:** Build-time TypeScript loaders read and validate the immutable upstream chart manifests, then expose one release-specific `PublishedEvidence` view model. Astro renders the editorial narrative and static evidence; React islands are limited to sortable tables and focusable charts that retain equivalent server-rendered tables.

**Tech Stack:** Astro 7, strict TypeScript 6, React 19 islands, Zod 4, Vitest, Playwright, Axe, npm inside `node:24-trixie-slim`.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-04-vulnbench-website-design.md`.
- This plan completes Phase 1 only; do not implement Phase 2 filters, comparison pins, URL-state restoration, or exports.
- Frame JS 1.0 as a repeatability and Snyk-reference agreement study, never universal accuracy.
- Use “Snyk-reference F1,” “reference agreement,” “reference-matched finding,” and “unmatched finding.”
- Do not relabel unmatched findings as false positives or reference-matched findings as independently adjudicated true positives.
- Read evidence from `snyk-vulnbench-js-1.0/`; never edit or regenerate upstream snapshot files.
- Static generation only: no runtime API, database, accounts, or server session state.
- Every chart must include exact values, units, source, release, dataset version, aggregation, sample size, interpretation, caveat, and an equivalent table.
- Meet WCAG 2.2 AA and preserve the full research story without JavaScript.
- Keep narrative-page JavaScript below 200 KB compressed.
- Run every development command inside the `vulnbench-dev` container.
- Do not commit or push unless the user explicitly asks.

## File Map

- `src/data/releases/js-1.0-source.ts` — validates upstream publication manifests and assembles `PublishedEvidence`.
- `src/data/releases/js-1.0-source.test.ts` — reconstructs exact scorecard, chart, heatmap, and case values.
- `src/components/evidence/ConfigurationScorecard.tsx` — sortable accessible configuration table.
- `src/components/evidence/EvidenceScatter.tsx` — reusable focusable scatter with exact-value table.
- `src/components/evidence/VulnerabilityCoverage.astro` — static coverage heatmap/table and interpretation.
- `src/components/evidence/LargerFixtureEvidence.astro` — Nightowl configuration comparison.
- `src/components/evidence/RepresentativeCases.astro` — Tigerteam, Nightowl, and repeated-sink case evidence.
- `src/pages/releases/js-1.0/index.astro` — completed editorial release sequence.
- `tests/e2e/release-overview.spec.ts` — Phase 1 narrative, chart parity, caveat, and no-JavaScript acceptance coverage.

---

### Task 1: Validate and assemble published JS 1.0 evidence

**Files:**
- Create: `src/data/releases/js-1.0-source.ts`
- Create: `src/data/releases/js-1.0-source.test.ts`

**Interfaces:**
- Produces:

```ts
export interface ConfigurationEvidence {
  name: string;
  type: "model" | "command";
  f1: number;
  f1StdDev: number;
  recall: number;
  precision: number;
  durationMs: number;
  tokens: number;
  costUsd: number | null;
  repetitions: number;
}

export interface ScatterPoint {
  name: string;
  type: "model" | "command";
  x: number;
  y: number;
}

export interface PublishedEvidence {
  configurations: ConfigurationEvidence[];
  agreementVariance: ScatterPoint[];
  costQuality: ScatterPoint[];
  coverage: {
    columns: { key: string; label: string }[];
    rows: { name: string; type: "model" | "command"; values: Record<string, number> }[];
  };
  largerFixture: {
    name: "JS Todo App (SQLite 4)";
    rows: { name: string; type: "model" | "command"; f1: number; stdDev: number; repetitions: number }[];
  };
  cases: {
    tigerteamSqlDecoyRuns: 25;
    nightowlSqlGapRuns: 25;
    nightowlPathTraversalMisses: 15;
    nightowlResourceLimitMisses: 10;
  };
  provenance: {
    release: "Snyk VulnBench JS 1.0";
    datasetVersion: "1.0.0";
    aggregation: string;
    source: string;
  };
}

export async function loadJs10PublishedEvidence(
  workspaceRoot?: string,
): Promise<PublishedEvidence>;
```

- [ ] **Step 1: Write failing source reconstruction tests**

Assert:

```ts
expect(evidence.configurations).toHaveLength(6);
expect(evidence.configurations.find(({ name }) =>
  name === "Claude Opus 4.6 Medium"
)).toMatchObject({
  f1: 0.7537982017982017,
  f1StdDev: 0.0024674185437360318,
  recall: 0.6804112554112554,
  precision: 0.9146666666666666,
  durationMs: 27324.159999999996,
  tokens: 51573.72,
  costUsd: 0.06276034999999999,
  repetitions: 5,
});
expect(evidence.coverage.columns).toHaveLength(17);
expect(evidence.largerFixture.rows.find(({ name }) =>
  name === "Claude Opus 4.6 High"
)?.f1).toBe(0.4);
expect(evidence.cases).toEqual({
  tigerteamSqlDecoyRuns: 25,
  nightowlSqlGapRuns: 25,
  nightowlPathTraversalMisses: 15,
  nightowlResourceLimitMisses: 10,
});
```

- [ ] **Step 2: Run the focused test and confirm the source module is absent**

Run in the container:

`npm exec vitest run src/data/releases/js-1.0-source.test.ts`

Expected: FAIL because `js-1.0-source.ts` does not exist.

- [ ] **Step 3: Implement Zod schemas for upstream chart manifests**

Validate finite numeric values, nullable command cost, six unique configuration labels, five repetitions, 17 unique coverage columns, and exact chart IDs. Reject missing charts, duplicate labels, missing units, and non-finite values.

Read:

- `snyk-vulnbench-js-1.0/chart-manifest.json`
- `snyk-vulnbench-js-1.0/2026-05-28-llm-repeatability/chart-manifest.json`
- `snyk-vulnbench-js-1.0/2026-05-28-model-callouts/chart-manifest.json`

Join chart rows by exact configuration label. Use `process.cwd()` as the default root so Astro prerender bundling cannot change source resolution.

- [ ] **Step 4: Re-run focused source tests**

Run: `npm exec vitest run src/data/releases/js-1.0-source.test.ts`

Expected: PASS with all exact published values reconstructed.

### Task 2: Build the configuration scorecard

**Files:**
- Create: `src/components/evidence/ConfigurationScorecard.tsx`
- Create: `src/components/evidence/ConfigurationScorecard.test.tsx`

**Interfaces:**
- Consumes: `ConfigurationEvidence[]`.
- Produces: a progressively enhanced sortable table with the columns Configuration, Snyk-reference F1, F1 standard deviation, reference recall, reference precision, average duration, average tokens, and estimated model-session cost.

- [ ] **Step 1: Write failing scorecard behavior tests**

Test the default six-row table, exact Opus 4.6 Medium values, `N/A` for Snyk Code cost, deterministic reference reproduction labeling, and ascending/descending sort from every numeric column header.

- [ ] **Step 2: Run the focused test and confirm the component is absent**

Run: `npm exec vitest run src/components/evidence/ConfigurationScorecard.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the minimal sortable scorecard**

Render a real `<table>`. Use buttons inside column headers for sorting. Format F1/recall/precision as one-decimal percentages, standard deviation as percentage points, duration as seconds, tokens as rounded tabular numerals, and cost as USD. Preserve the source order in server-rendered HTML before hydration.

Place this caveat adjacent to the table:

> Snyk Code’s 100% row is deterministic reproduction of the reference set it defines. It is not a universal accuracy result.

- [ ] **Step 4: Re-run scorecard tests**

Run: `npm exec vitest run src/components/evidence/ConfigurationScorecard.test.tsx`

Expected: PASS with sorting and missing/not-applicable semantics intact.

### Task 3: Add agreement, efficiency, coverage, and project evidence

**Files:**
- Create: `src/components/evidence/EvidenceScatter.tsx`
- Create: `src/components/evidence/EvidenceScatter.test.tsx`
- Create: `src/components/evidence/VulnerabilityCoverage.astro`
- Create: `src/components/evidence/LargerFixtureEvidence.astro`

**Interfaces:**
- `EvidenceScatter` consumes `points`, axis labels/units, interpretation, caveat, provenance, and an optional `excludeReference` flag.
- `VulnerabilityCoverage` consumes `PublishedEvidence["coverage"]`.
- `LargerFixtureEvidence` consumes `PublishedEvidence["largerFixture"]`.

- [ ] **Step 1: Write failing scatter parity tests**

Assert focusable configuration marks, exact x/y values in an equivalent table, color-independent marker shapes, the “upper-left” interpretation, and release/dataset/source caption.

- [ ] **Step 2: Run the focused scatter test**

Run: `npm exec vitest run src/components/evidence/EvidenceScatter.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the reusable evidence scatter**

Render an SVG analytical canvas and a disclosure containing the exact-value table. Use focusable links or buttons outside the SVG for keyboard details; do not put interactive descendants inside an element with `role="img"`.

Use it for:

- Agreement versus variance: X = F1 standard deviation in percentage points; Y = Snyk-reference F1 percent; include all six configurations.
- Cost versus quality: X = estimated model-session cost USD; Y = Snyk-reference F1 percent; model-only.

- [ ] **Step 4: Implement vulnerability coverage**

Render the 6×17 published recall matrix as a horizontally scrollable semantic table. Use numeric text in every measured cell and CSS background steps as a redundant visual encoding. Keep Snyk Code labeled “deterministic reference reproduction.”

Adjacent interpretation must name strong high-signal classes and weaker resource-limit, sanitization/type-validation, insecure-transport, and repeated path-traversal coverage.

- [ ] **Step 5: Implement larger-fixture evidence**

Render the six Nightowl values and repeated-run spread. State that Claude Opus 4.6 High was the strongest model at 40.0% Snyk-reference F1 and that this one project is not the complete benchmark.

- [ ] **Step 6: Re-run evidence component tests and Astro checks**

Run: `npm exec vitest run src/components/evidence && npm run check`

Expected: PASS with zero diagnostics.

### Task 4: Add representative cases and complete the release narrative

**Files:**
- Create: `src/components/evidence/RepresentativeCases.astro`
- Modify: `src/pages/releases/js-1.0/index.astro`
- Create: `tests/e2e/release-overview.spec.ts`

**Interfaces:**
- `RepresentativeCases` consumes `PublishedEvidence["cases"]`.
- The release overview follows the required evidence order: question, design/configurations, repeatability, scorecard, complementarity, vulnerability/project behavior, efficiency, practical implications, representative cases, limitations, and publication actions.

- [ ] **Step 1: Write the failing Phase 1 release acceptance test**

Assert:

- Six configuration names and the complete scorecard.
- Agreement-versus-variance and cost-quality chart titles plus equivalent tables.
- Vulnerability coverage and larger-fixture evidence.
- Tigerteam SQL-shaped decoy: 25 of 25 model runs.
- Nightowl likely product gap: 25 of 25 model runs.
- Nightowl misses: 15 of 15 path-traversal opportunities and 10 of 15 resource-limit opportunities.
- Practical workflow implications.
- Adjacent scorer, reference-set, small-fixture, normalization, and cost caveats.
- Publication, methodology, data, GitHub, citation, and explorer actions.
- The same narrative remains present with JavaScript disabled.

- [ ] **Step 2: Run the focused browser test**

Run: `npm run test:e2e -- tests/e2e/release-overview.spec.ts`

Expected: FAIL because the Phase 1 evidence sections are incomplete.

- [ ] **Step 3: Implement representative case sections**

Add:

1. Tigerteam: SQL-shaped mock helper that logs and returns an empty array; reported in 25/25 model runs and treated as false-positive-shaped evidence.
2. Nightowl: string-concatenated SQLite delete query; reported in 25/25 model runs and treated as a likely Snyk Code product-gap candidate.
3. Nightowl systematic coverage: stable 40.0% Opus 4.6 High F1 while missing all 15 path-traversal opportunities and 10/15 resource-limit opportunities.

- [ ] **Step 4: Recompose the release overview**

Move each evidence component into the publication’s narrative order. Keep the page editorial rather than dashboard-like. Add a practical implications section recommending combined agentic review, deterministic coverage, recurrence-aware triage, and inspection of unmatched reports.

- [ ] **Step 5: Re-run release overview tests**

Run: `npm run test:e2e -- tests/e2e/release-overview.spec.ts`

Expected: PASS on desktop, mobile, and no-JavaScript contexts.

### Task 5: Complete Phase 1 acceptance verification

**Files:**
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/homepage.spec.ts` only if shared release links or labels change.
- Modify: `AGENTS.md` to route future agents to this plan after the slice is implemented.

**Interfaces:**
- `npm run verify` remains the single full gate.

- [ ] **Step 1: Extend accessibility coverage**

Ensure Axe scans the completed release overview and keyboard tests cover scorecard sorting and evidence details. Verify 320 px reflow and table horizontal scrolling without page-level overflow.

- [ ] **Step 2: Run the complete containerized gate**

Run: `npm run verify`

Expected:

- Astro/TypeScript: zero errors, warnings, and hints.
- Unit/source tests: all pass.
- Static build: all routes and data downloads generated.
- Homepage JavaScript: below 204800 compressed bytes.
- Desktop/mobile Playwright and Axe suites: zero failures.

- [ ] **Step 3: Run security verification**

Run Snyk Code against `src/` and dependency scanning against the root `package.json`. Treat intentionally vulnerable vendored fixtures separately. Resolve new application or dependency vulnerabilities; report license-policy findings independently.

