# VulnBench Core Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the Phase 2 guided explorer so practitioners can reproduce headline views, filter approved JS 1.0 dimensions, compare configurations, share deterministic state, and export filtered evidence.

**Architecture:** Astro reads and validates immutable source assets at build time, then serializes a compact typed `ExplorerDataset` into one React explorer island. Pure TypeScript modules own URL state, filtering, aggregation, comparisons, and exports; view components consume selectors rather than parsing raw records.

**Tech Stack:** Astro 7 static generation, strict TypeScript 6, React 19, Zod 4, Vitest, Testing Library, Playwright, Axe, native URL/Blob/SVG browser APIs.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-04-vulnbench-website-design.md` §§9–12, 14–17, and Phase 2 in §18.
- Phase 2 includes Summary, Repeatability, Coverage, and Efficiency. Findings and rich case depth remain Phase 3.
- Static deployment only; no runtime API, database, account, or server session.
- Use Snyk-reference terminology and preserve all Phase 1 caveats.
- Never treat unmatched as false positive or reference-matched as independent true positive.
- Snyk Code is deterministic reference reproduction; cost is not applicable to its command row.
- URL state must be deterministic, human-safe, and backward-compatible within JS 1.0.
- Invalid URL values restore valid parameters, replace invalid values with defaults, and display ignored parameters.
- Zero, missing, not applicable, invalid, and empty states remain distinct.
- Pin at most four configurations and prevent incompatible cross-release comparisons.
- Every chart has exact keyboard-accessible values, an equivalent table, CSV export, and SVG export where practical.
- Desktop uses a sticky filter rail; mobile uses a filter sheet and sticky Filters / Compare bar.
- Keep full explorer code off narrative routes and homepage.
- Meet WCAG 2.2 AA and preserve the static release story if JavaScript fails.
- Run all development commands inside `vulnbench-dev`.
- Do not commit or push unless explicitly requested.

## File Map

- `src/data/explorer/js-1.0.ts` — build-time explorer dataset loader.
- `src/data/explorer/schema.ts` — runtime-safe explorer dataset types and validation.
- `src/components/explorer/state.ts` — defaults, URL parse/serialize, invalid-parameter diagnostics.
- `src/components/explorer/selectors.ts` — pure filtering, aggregation, sorting, comparison deltas, and empty-state reasoning.
- `src/components/explorer/export.ts` — CSV and SVG export formatting.
- `src/components/explorer/ExplorerApp.tsx` — state orchestration and responsive workbench.
- `src/components/explorer/ExplorerHeader.tsx` — persistent release/filter/metric/record context.
- `src/components/explorer/FilterRail.tsx` — global controls and mobile sheet.
- `src/components/explorer/ComparisonTray.tsx` — pins, baseline, deltas, and mobile sheet.
- `src/components/explorer/views/` — Summary, Repeatability, Coverage, and Efficiency views.
- `src/pages/releases/js-1.0/explore.astro` — static fallback plus explorer island.
- `tests/e2e/explorer.spec.ts` — URL restoration, filtering, comparison, export, states, keyboard, and mobile behavior.

---

### Task 1: Build the typed explorer dataset

**Files:**
- Create: `src/data/explorer/schema.ts`
- Create: `src/data/explorer/js-1.0.ts`
- Create: `src/data/explorer/js-1.0.test.ts`

**Interfaces:**

```ts
export interface ExplorerTaskObservation {
  projectId: string;
  projectName: string;
  configurationId: string;
  configurationName: string;
  configurationType: "model" | "command";
  f1: number;
  f1StdDev: number;
  recall: number;
  precision: number;
  durationMs: number;
  tokens: number;
  costUsd: number | null;
  repetitions: 5;
}

export interface ExplorerDataset {
  release: { id: "snyk-vulnbench-js-1.0"; slug: "js-1.0"; datasetVersion: "1.0.0" };
  configurations: { id: string; name: string; type: "model" | "command" }[];
  projects: { id: string; name: string }[];
  vulnerabilityClasses: { id: string; label: string }[];
  tasks: ExplorerTaskObservation[];
  coverage: PublishedEvidence["coverage"];
  recurrence: PublishedEvidence["recurrence"];
  repeatabilityByConfiguration: {
    configurationName: string;
    uniqueUnmatched: number;
    unmatchedOnce: number;
    unmatchedAllFive: number;
    matchedAllFive: number;
    matchedTotal: number;
  }[];
}

export async function loadJs10ExplorerDataset(
  workspaceRoot?: string,
): Promise<ExplorerDataset>;
```

- [ ] Write failing tests asserting 6 configurations, 10 projects, 17 classes, 60 task aggregates, nullable command cost, exact Nightowl/Opus High F1 `0.4`, and exact per-configuration repeatability rows.
- [ ] Run `npm exec vitest run src/data/explorer/js-1.0.test.ts`; expect missing module failure.
- [ ] Parse the JSONL record union with Zod, retain only 60 `_type:"task-aggregate"` records, join validated Phase 1 evidence, and fail on unknown/duplicate configuration-project pairs.
- [ ] Run the focused test; expect PASS.

### Task 2: Implement deterministic explorer URL state

**Files:**
- Create: `src/components/explorer/state.ts`
- Create: `src/components/explorer/state.test.ts`

**Interfaces:**

```ts
export type ExplorerView = "summary" | "repeatability" | "coverage" | "efficiency";
export type FindingStatus = "matched" | "unmatched" | "combined";
export type EfficiencyMetric = "cost" | "tokens" | "duration";

export interface ExplorerState {
  version: 1;
  view: ExplorerView;
  configurations: string[];
  includeReference: boolean;
  projects: string[];
  vulnerabilityClasses: string[];
  findingStatus: FindingStatus;
  recurrenceThreshold: 1 | 2 | 3 | 4 | 5;
  valueMode: "count" | "percentage";
  efficiencyMetric: EfficiencyMetric;
  sort: string;
  pins: string[];
  baseline: string | null;
}

export function parseExplorerState(
  search: string,
  dataset: ExplorerDataset,
): { state: ExplorerState; ignored: string[] };
export function serializeExplorerState(state: ExplorerState): string;
```

- [ ] Write failing round-trip, deterministic-order, defaults, invalid-value, max-four-pins, stale-ID, and backward-compatible-version tests.
- [ ] Run focused tests and confirm missing module failure.
- [ ] Implement `URLSearchParams` parsing with canonical sorted arrays and compact keys: `v`, `view`, `configs`, `ref`, `projects`, `classes`, `status`, `recurrence`, `mode`, `resource`, `sort`, `pins`, `baseline`.
- [ ] Run focused tests; expect PASS.

### Task 3: Implement pure filtering, aggregation, and comparison selectors

**Files:**
- Create: `src/components/explorer/selectors.ts`
- Create: `src/components/explorer/selectors.test.ts`

**Interfaces:**

```ts
export interface ExplorerSelection {
  configurations: ExplorerDataset["configurations"];
  tasks: ExplorerTaskObservation[];
  representedRuns: number;
  activeFilterCount: number;
}

export function selectExplorerData(
  dataset: ExplorerDataset,
  state: ExplorerState,
): ExplorerSelection;
export function comparisonRows(
  dataset: ExplorerDataset,
  state: ExplorerState,
): ComparisonRow[];
export function explainEmptySelection(
  dataset: ExplorerDataset,
  state: ExplorerState,
): { restrictiveFilters: string[]; clearableKey: keyof ExplorerState | null };
```

- [ ] Write failing tests for configuration/project filters, reference exclusion, record counts, sorting, baseline deltas, N/A cost, max pins, zero results, and the most restrictive filter.
- [ ] Run focused tests and confirm missing module failure.
- [ ] Implement pure selectors with no React or browser dependencies.
- [ ] Run focused tests; expect PASS.

### Task 4: Build the responsive explorer shell and controls

**Files:**
- Create: `src/components/explorer/ExplorerApp.tsx`
- Create: `src/components/explorer/ExplorerHeader.tsx`
- Create: `src/components/explorer/FilterRail.tsx`
- Create: `src/components/explorer/ComparisonTray.tsx`
- Create: `src/components/explorer/ExplorerApp.test.tsx`
- Modify: `src/pages/releases/js-1.0/explore.astro`

**Interfaces:**
- `ExplorerApp` consumes only `ExplorerDataset` and `initialSearch`.
- State changes call `history.replaceState` with `serializeExplorerState`.
- Static Astro fallback exposes research question, evidence counts, scorecard, methodology, and downloads before hydration.

- [ ] Write failing interaction tests for view tabs, filters, active count, reset, pin/unpin, baseline, invalid-state notice, share action, and empty state.
- [ ] Run focused tests and confirm missing components.
- [ ] Implement desktop filter rail, tablet disclosure, mobile modal sheet, persistent context header, and sticky mobile Filters / Compare bar.
- [ ] Replace the Phase 1 interim evidence copy with the hydrated explorer while retaining a `<noscript>`/static fallback.
- [ ] Run focused tests and Astro checks; expect PASS.

### Task 5: Implement Summary and Repeatability views

**Files:**
- Create: `src/components/explorer/views/SummaryView.tsx`
- Create: `src/components/explorer/views/RepeatabilityView.tsx`
- Create: `src/components/explorer/charts/RecurrenceChart.tsx`
- Create: `src/components/explorer/charts/RepeatabilityBars.tsx`
- Create tests beside each component.

**Interfaces:**
- Summary renders filtered scorecard, agreement/variance, recurrence, and one annotated operational finding.
- Repeatability renders matched/unmatched/combined recurrence, count/percentage mode, score variance, and per-configuration repeatability.

- [ ] Write failing parity and control tests.
- [ ] Implement accessible SVG/chart + table components, configuration pin actions, visible denominators, signature definitions, source, and caveats.
- [ ] Run focused tests; expect PASS.

### Task 6: Implement Coverage and Efficiency views

**Files:**
- Create: `src/components/explorer/views/CoverageView.tsx`
- Create: `src/components/explorer/views/EfficiencyView.tsx`
- Create: `src/components/explorer/charts/CoverageMatrix.tsx`
- Create: `src/components/explorer/charts/ProjectMatrix.tsx`
- Create: `src/components/explorer/charts/EfficiencyScatter.tsx`
- Create tests beside each component.

**Interfaces:**
- Coverage toggles reference recall / unmatched reports and project metrics supported by the dataset.
- Efficiency toggles cost / tokens / duration; command reference is excluded for invalid resource metrics.

- [ ] Write failing metric-toggle, missing/N/A, cross-filter, table-parity, and pin tests.
- [ ] Implement matrices/scatter using filtered selectors and consistent configuration color+shape.
- [ ] Run focused tests; expect PASS.

### Task 7: Implement exports, sharing, and failure states

**Files:**
- Create: `src/components/explorer/export.ts`
- Create: `src/components/explorer/export.test.ts`
- Modify explorer chart/view components.

**Interfaces:**

```ts
export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null>>,
): string;
export function downloadCsv(filename: string, csv: string): void;
export function downloadSvg(filename: string, svg: SVGElement): void;
```

- [ ] Write failing CSV escaping, null/N/A, deterministic filename, SVG serialization, and clipboard fallback tests.
- [ ] Implement chart-level CSV/SVG actions, copy-share action, invalid-state notice, unavailable metric explanations, and reset/clear-most-restrictive actions.
- [ ] Run focused tests; expect PASS.

### Task 8: Complete Phase 2 browser, accessibility, and performance acceptance

**Files:**
- Create: `tests/e2e/explorer.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `scripts/check-build-budget.mjs`
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] Test default published state, every view, filter/reset/empty, pins/baseline, URL copy/restoration, invalid parameters, CSV/SVG downloads, keyboard details, mobile filter/comparison sheets, and N/A semantics.
- [ ] Axe-scan every explorer view and verify 320 px reflow without page-level overflow.
- [ ] Enforce the 200 KB compressed narrative budget and record a separate explorer bundle measurement.
- [ ] Run `npm run verify`; expect zero diagnostics and failures.
- [ ] Run Snyk Code on `src/` and dependency scanning on `package.json`; resolve new vulnerabilities and report license-policy findings separately.

