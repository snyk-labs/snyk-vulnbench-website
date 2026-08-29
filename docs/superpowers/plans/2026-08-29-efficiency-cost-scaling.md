# Efficiency Cost Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a projected web-application resource-scaling figure above the existing observed Efficiency scatter.

**Architecture:** A pure explorer data module owns the pinned application-size references and derives per-1,000-SLOC rates from the complete validated JS 1.0 task matrix. A focused React figure renders selected configurations and the active Cost/Tokens/Duration metric, while `EfficiencyView` composes the projected figure before the unchanged observed scatter.

**Tech Stack:** Astro 7, React 19, strict TypeScript, Zod-validated release data, Vitest, Testing Library, Playwright, accessible SVG and HTML tables.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-29-efficiency-cost-scaling-design.md`.
- Label extrapolated values Projected and benchmark values Observed.
- Never imply that a complete codebase scan finds every vulnerability.
- Keep Snyk-reference F1 terminology and the existing reference-agreement caveats.
- Keep the application static and preserve URL, filter, export, keyboard, responsive, and no-JavaScript behavior.
- Do not modify `snyk-vulnbench-js-1.0/`.
- Do not commit because the user did not request a commit.

---

### Task 1: Typed projection model

**Files:**
- Create: `src/data/explorer/resource-projection.ts`
- Create: `src/data/explorer/resource-projection.test.ts`

**Interfaces:**
- Consumes: `ExplorerConfiguration[]` and the complete `ExplorerTaskObservation[]`.
- Produces: `webApplicationReferences`, `JS10_FIXTURE_SLOC`, `deriveResourceProfiles()`, `projectResource()`, `ResourceMetric`, and `ResourceProfile`.

- [ ] **Step 1: Write failing reference and arithmetic tests**

```ts
import { describe, expect, it } from "vitest";
import { loadJs10ExplorerDataset } from "./js-1.0";
import {
  deriveResourceProfiles,
  JS10_FIXTURE_SLOC,
  projectResource,
  webApplicationReferences,
} from "./resource-projection";

describe("JS 1.0 resource projection", () => {
  it("preserves the measured denominator and pinned web-app references", () => {
    expect(JS10_FIXTURE_SLOC).toBe(1154);
    expect(webApplicationReferences.map(({ id, sloc }) => [id, sloc])).toEqual([
      ["mastodon", 170480],
      ["zulip", 326630],
      ["wordpress", 476469],
      ["discourse", 637925],
      ["mattermost", 795858],
    ]);
  });

  it("derives release-wide rates and projects exact application cost", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const profiles = deriveResourceProfiles(
      dataset.configurations,
      dataset.tasks,
    );
    const profile = profiles.find(({ configurationId }) =>
      configurationId === "opus-4-6-medium"
    );
    expect(profile?.costPerKSloc).toBeCloseTo(0.5438505199, 9);
    expect(
      projectResource(profile!, webApplicationReferences[4]!, "cost"),
    ).toBeCloseTo(432.826, 2);
  });

  it("keeps command cost and tokens not applicable", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const snyk = deriveResourceProfiles(
      dataset.configurations,
      dataset.tasks,
    ).find(({ configurationId }) => configurationId === "snyk-code");
    expect(snyk?.costPerKSloc).toBeNull();
    expect(snyk?.tokensPerKSloc).toBeNull();
    expect(snyk?.secondsPerKSloc).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test and confirm the module is missing**

Run: `npm exec vitest run src/data/explorer/resource-projection.test.ts`  
Expected: FAIL because `resource-projection.ts` does not exist.

- [ ] **Step 3: Implement validated constants and pure derivation**

Create readonly application references with IDs, names, SLOC, repository URLs,
commit hashes, measurement date `2026-08-29`, and counting notes. Set
`JS10_FIXTURE_SLOC = 1154`. Group the complete task matrix by configuration,
require exactly ten unique projects per configuration, sum each mean task
resource, and divide by `JS10_FIXTURE_SLOC / 1000`. Return `null` for command
cost and tokens. Reject missing, duplicate, non-finite, or negative values.

- [ ] **Step 4: Run the focused data test**

Run: `npm exec vitest run src/data/explorer/resource-projection.test.ts`  
Expected: PASS.

### Task 2: Accessible projected resource figure

**Files:**
- Create: `src/components/explorer/charts/ModelResourceProjection.tsx`
- Create: `src/components/explorer/charts/ModelResourceProjection.test.tsx`

**Interfaces:**
- Consumes: `{ metric, profiles, selectedConfigurationIds }`.
- Produces: a `<figure>` with a directly labeled SVG, application selector, exact-value table, CSV/SVG exports, provenance, and projection caveat.

- [ ] **Step 1: Write failing component tests**

Render cost mode with profiles derived from `loadJs10ExplorerDataset()` and
assert:

```ts
expect(
  screen.getByRole("heading", {
    name: "Projected model cost by web application size",
  }),
).toBeVisible();
expect(screen.getByRole("img", {
  name: /Projected model cost by source lines of code/,
})).toBeVisible();
expect(screen.getByRole("button", {
  name: "Show Mattermost projections",
})).toBeVisible();
expect(screen.getByRole("table", {
  name: "Projected model cost by web application",
})).toBeVisible();
expect(screen.getByText(/small JS 1.0 fixtures/)).toBeVisible();
expect(screen.getByText("$432.83")).toBeVisible();
```

Add token and duration cases, a command N/A case, selected-configuration
filtering, application keyboard selection, and CSV export assertions.

- [ ] **Step 2: Run the component test and confirm the component is missing**

Run: `npm exec vitest run src/components/explorer/charts/ModelResourceProjection.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the figure**

Use semantic CSS variables already consumed by `EvidenceScatter`. Render a
720×440 SVG with SLOC on X and the active resource on Y. Draw labeled vertical
application references and one selected-configuration line per valid profile.
Sort endpoint labels and enforce a minimum vertical gap with leader lines so
similar rates remain readable. Use configuration symbols as well as color.
Keep exact values in a horizontally scrollable table. Reuse `downloadCsv`,
`downloadSvg`, and `toCsv`.

- [ ] **Step 4: Run component and export tests**

Run:
`npm exec vitest run src/components/explorer/charts/ModelResourceProjection.test.tsx src/components/explorer/export.test.ts`  
Expected: PASS.

### Task 3: Compose projected and observed Efficiency evidence

**Files:**
- Modify: `src/components/explorer/views/EfficiencyView.tsx`
- Modify: `src/components/explorer/ExplorerApp.tsx`
- Modify: `src/components/explorer/ExplorerGuideRail.tsx`
- Modify: `src/components/explorer/ExplorerApp.test.tsx`
- Modify: `src/components/explorer/ExplorerGuideRail.test.tsx`

**Interfaces:**
- `EfficiencyView` additionally consumes `dataset: ExplorerDataset`.
- `ExplorerApp` passes the complete dataset so projection rates remain
  release-wide while configuration filters control visible lines.

- [ ] **Step 1: Add failing integration assertions**

In `ExplorerApp.test.tsx`, open the Efficiency tab and assert the Projected
heading appears before the Observed heading, the five application controls are
present, and changing the resource selector updates both heading units. Assert
that filtering a configuration removes its projected line without recalculating
remaining release-wide rates.

In `ExplorerGuideRail.test.tsx`, require projected-versus-observed explanatory
copy and the production-scale extrapolation caveat.

- [ ] **Step 2: Run the focused integration tests**

Run:
`npm exec vitest run src/components/explorer/ExplorerApp.test.tsx src/components/explorer/ExplorerGuideRail.test.tsx`  
Expected: FAIL because the projection is not composed.

- [ ] **Step 3: Compose both figures**

Derive profiles from `dataset.configurations` and `dataset.tasks`. Render
`ModelResourceProjection` after the Efficiency heading and pin controls, then a
relationship divider labeled `Projected from the observed benchmark evidence
below`, then the existing `EvidenceScatter` under an `Observed benchmark
efficiency` heading. Preserve the current empty-state recovery behavior.

- [ ] **Step 4: Update guide copy**

Explain that the upper figure projects release-wide resource rates across
reference application sizes and the lower figure shows measured
Snyk-reference agreement. Keep cost/token command semantics unchanged.

- [ ] **Step 5: Run focused integration tests**

Run:
`npm exec vitest run src/components/explorer/ExplorerApp.test.tsx src/components/explorer/ExplorerGuideRail.test.tsx`  
Expected: PASS.

### Task 4: Public methodology, browser coverage, and verification

**Files:**
- Modify: `src/pages/releases/js-1.0/methodology.astro`
- Modify: `tests/e2e/explorer.spec.ts`
- Modify: `docs/CONVENTIONS.md`

**Interfaces:**
- Public methodology defines the 1,154-SLOC denominator, formula, five pinned
  upstream revisions, exclusions, and limits.
- E2E coverage protects ordering, responsiveness, accessibility, and exports.

- [ ] **Step 1: Add failing browser assertions**

On the cost Efficiency route, assert both headings and their order, five
application selectors, exact Mattermost projection text, the extrapolation
caveat, and CSV download. Add a 320px viewport assertion that
`document.documentElement.scrollWidth <= window.innerWidth` and run Axe through
the existing accessibility suite.

- [ ] **Step 2: Add methodology and durable visualization convention**

Document the formula from the approved design. Add a convention requiring
observed and projected analytical evidence to be visually and semantically
separated, with assumptions and out-of-sample scale stated adjacent to every
projection.

- [ ] **Step 3: Run focused and proportional verification**

Run:

```sh
npm run check
npm run test:unit
npm run build
npm run check:budget
npm run test:e2e -- tests/e2e/explorer.spec.ts tests/e2e/accessibility.spec.ts
npm run check:brand
```

Expected: all commands exit 0.

- [ ] **Step 4: Run source integrity**

Run: `npm exec vitest run tests/source-import.test.ts`  
Expected: PASS and the vendored snapshot remains unchanged.
