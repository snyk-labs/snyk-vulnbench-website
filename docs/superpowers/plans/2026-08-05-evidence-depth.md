# VulnBench Evidence Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 3 by letting researchers move from aggregate explorer evidence to normalized finding signatures, project detail, source context, correction history, and shareable chart assets.

**Architecture:** Build-time parsers derive a compact, public-safe finding index and project evidence summaries from the immutable JSONL and fixture references. The explorer adds a Findings view and URL-selected evidence; Astro statically generates project detail and chart-card routes.

**Tech Stack:** Astro static paths/endpoints, strict TypeScript, React explorer island, Zod, Vitest, Playwright, Axe.

## Global Constraints

- Follow Phase 3 in `docs/superpowers/specs/2026-08-04-vulnbench-website-design.md`.
- Never execute or modify intentionally vulnerable fixtures.
- Render all source-derived descriptions as text, never HTML.
- Unmatched remains an evidence status, not a false-positive classification.
- Preserve release, dataset version, signature definition, recurrence denominator, and source on finding views/exports.
- Keep raw descriptions and source snippets out of URL state.
- Static output only; no runtime data service.
- Phase 3 may deepen cases and cross-filtering but must not add accounts or mutable annotations.
- Run all development commands inside `vulnbench-dev`.
- Do not commit or push unless explicitly requested.

---

### Task 1: Derive the public finding and project evidence index

**Files:**
- Create: `src/data/evidence/js-1.0.ts`
- Create: `src/data/evidence/schema.ts`
- Create: `src/data/evidence/js-1.0.test.ts`

**Interfaces:**

```ts
interface FindingSignature {
  id: string;
  projectId: string;
  projectName: string;
  configurationId: string;
  configurationName: string;
  status: "matched" | "unmatched";
  vulnerabilityClass: string;
  severity: string;
  file: string | null;
  line: number | null;
  description: string | null;
  occurrences: number;
  totalRepetitions: 5;
  referenceFindingId: string | null;
}

interface ProjectEvidence {
  id: string;
  name: string;
  description: string;
  referenceFindings: Array<{ id: string; type: string; severity: string; file: string; line: number }>;
  sourceFiles: string[];
}
```

- [ ] Write failing tests reconstructing 158 matched and 161 unmatched normalized signatures, 10 projects, recurrence totals, Tigerteam/Nightowl SQL cases, and path traversal source context.
- [ ] Parse 250 model runs and ten fixture `findings.json` files with explicit Zod schemas.
- [ ] Normalize unmatched signature as task + configuration + type + basename(file) + line; matched signature as task + configuration + reference ID.
- [ ] Run focused tests; expect PASS.

### Task 2: Add the Findings explorer view and URL state

**Files:**
- Modify: `src/data/explorer/schema.ts`
- Modify: `src/data/explorer/js-1.0.ts`
- Modify: `src/components/explorer/state.ts`
- Create: `src/components/explorer/views/FindingsView.tsx`
- Modify: `src/components/explorer/ExplorerApp.tsx`
- Add focused tests.

- [ ] Add `findings` to explorer views and a stable `finding` URL parameter.
- [ ] Filter signatures by configuration, project, class, status, and recurrence threshold.
- [ ] Render sortable exact-value table, recurrence, source location, description, status caveat, CSV export, and selected-finding detail.
- [ ] Cross-filter from a finding to its configuration/project/class and preserve URL state.
- [ ] Test invalid/stale finding IDs and no-results recovery.

### Task 3: Generate project/case detail routes

**Files:**
- Create: `src/pages/releases/js-1.0/cases/[project].astro`
- Create: `src/components/evidence/ProjectCaseDetail.astro`
- Modify: `src/pages/releases/js-1.0/cases.astro`
- Modify explorer project matrix links.
- Add route/browser tests.

- [ ] Generate ten static project routes.
- [ ] Show project purpose/scale, reference classes, model matches, unmatched reports, recurrence by configuration, licensed source context, interpretation, and caveat.
- [ ] Link project matrix cells and finding rows to detail while preserving explorer return state.
- [ ] Keep Tigerteam false-positive-shaped, Nightowl likely-gap, and systematic-miss labels precise.

### Task 4: Add richer comparison and cross-filter transitions

**Files:**
- Modify explorer views, selectors, comparison tray, and URL tests.

- [ ] Let coverage/project/finding cells isolate or add configuration/project/class filters.
- [ ] Add finding recurrence and active selected project/class to comparison context.
- [ ] Preserve pins and baseline across cross-filter transitions.
- [ ] Test keyboard and pointer equivalents.

### Task 5: Generate chart share cards and correction history

**Files:**
- Create: `src/pages/social/js-1.0/[view].svg.ts`
- Create: `src/data/releases/corrections.ts`
- Modify release data and explorer share actions.
- Add metadata/route tests.

- [ ] Generate static SVG social cards for Summary, Repeatability, Coverage, and Efficiency with release, dataset, metric, units, source, and caveat.
- [ ] Link view-level share actions to canonical card URLs.
- [ ] Render a typed correction log; show “No corrections published” for dataset 1.0.0 without implying missing data.
- [ ] Validate correction versions and affected-value references.

### Task 6: Complete Phase 3 acceptance

**Files:**
- Create: `tests/e2e/evidence-depth.spec.ts`
- Modify accessibility, route, metadata, budget, README, and AGENTS docs.

- [ ] Test Findings filtering/selection/export/share restoration.
- [ ] Test all ten project routes and representative source context.
- [ ] Axe-scan Findings and project detail on desktop/mobile.
- [ ] Run `npm run verify`, Snyk Code, dependency scan, and bundle measurements.

