# Release System Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the VulnBench release system can support a structurally different 2.0 release without publishing it, leaking its metrics into JS 1.0, or breaking existing routes/state.

**Architecture:** Expand the typed release contract with publication state, dimensions, assets, and explicit metric lineage. Keep one public catalog and one test-only fixture catalog; pure compatibility and shared-view-model functions validate behavior without generating synthetic public routes.

**Tech Stack:** Strict TypeScript, Zod, Vitest, Astro static build, Playwright.

## Global Constraints

- Follow Phase 4 in `docs/superpowers/specs/2026-08-04-vulnbench-website-design.md`.
- The synthetic 2.0 fixture must never appear in public routes, navigation, sitemap, structured data, or downloads.
- JS 1.0 metric definitions, IDs, URLs, explorer states, and dataset assets remain unchanged.
- Cross-release comparisons are allowed only when both releases explicitly declare compatible metric lineage and equivalent definitions/units.
- Incompatible metrics return a user-readable blocking reason.
- Release-specific dimensions and metrics must not be added to shared JS 1.0 contracts.
- Static output only.
- Run all commands inside `vulnbench-dev`.
- Do not commit or push unless explicitly requested.

---

### Task 1: Expand the release manifest contract

**Files:**
- Modify: `src/data/releases/schema.ts`
- Modify: `src/data/releases/js-1.0.ts`
- Modify: `src/data/releases/releases.test.ts`

**Interfaces:**

```ts
publicationState: "public" | "internal-fixture";
dimensions: Array<{ id: string; label: string; scope: "shared" | "release" }>;
assets: Array<{ id: string; path: string; format: "json" | "jsonl" | "csv"; datasetVersion: string }>;
compatibility.metricLineage: Array<{
  metricId: string;
  lineageId: string;
  compatibleWith: string[];
  incompatibleWith: string[];
}>;
```

- [ ] Write failing tests for JS 1.0 public state, required dimensions/assets, duplicate dimension/asset IDs, broken asset versions, and contradictory compatibility declarations.
- [ ] Extend the schema and JS 1.0 manifest without changing its public metric semantics.
- [ ] Run focused tests; expect PASS.

### Task 2: Create the non-public synthetic 2.0 fixture

**Files:**
- Create: `src/data/releases/fixtures/synthetic-2.0.ts`
- Create: `src/data/releases/fixtures/synthetic-2.0.test.ts`

- [ ] Define a fixture with a different scoring protocol, adjudicated ground-truth type, release-only `repository-scale` dimension, one explicitly compatible resource metric, and incompatible agreement metrics.
- [ ] Use internal-only links and static fixture assets that are never routed.
- [ ] Validate the fixture independently and alongside JS 1.0.

### Task 3: Add public/internal registries and compatibility evaluation

**Files:**
- Modify: `src/data/releases/index.ts`
- Create: `src/data/releases/compatibility.ts`
- Create: `src/data/releases/compatibility.test.ts`

**Interfaces:**

```ts
export const publicReleases: Release[];
export const validationFixtures: Release[];
export function compareMetricCompatibility(
  left: Release,
  right: Release,
  metricId: string,
): { allowed: boolean; reason: string };
```

- [ ] Test that public catalog/navigation contain only JS 1.0.
- [ ] Test compatible resource lineage and blocked agreement/ground-truth comparisons in both directions.
- [ ] Test unknown metrics and contradictory declarations fail closed.

### Task 4: Prove shared metadata and release-specific isolation

**Files:**
- Create: `src/data/releases/view-model.ts`
- Create: `src/data/releases/view-model.test.ts`
- Modify shared release components only if tests expose hard-coded JS 1.0 assumptions.

- [ ] Build pure shared navigation, citation, status, data-link, and available-view models from either manifest.
- [ ] Assert synthetic release-only dimensions/metrics never appear in JS 1.0 models.
- [ ] Assert JS 1.0 and synthetic citations/status/data links use the same shared interface.

### Task 5: Lock public routes and explorer compatibility

**Files:**
- Create: `tests/e2e/release-system.spec.ts`
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] Assert `/releases` and sitemap contain JS 1.0 but not synthetic 2.0.
- [ ] Assert synthetic overview/explore/data URLs return 404.
- [ ] Assert existing JS 1.0 route inventory and representative explorer URLs restore unchanged.
- [ ] Run `npm run verify`, Snyk Code, and dependency scanning.

