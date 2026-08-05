# Explorer Three-Column Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cap the explorer analysis canvas and add an adaptive view-specific research guide on wide desktop displays.

**Architecture:** `ExplorerApp` remains the single owner of explorer state. A presentational `ExplorerGuideRail` receives the active state and represented-run context, while CSS changes the workbench from one to two to three columns without altering view data.

**Tech Stack:** React 19, Astro 7, CSS Grid, Vitest, Testing Library, Playwright, Axe.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-05-explorer-three-column-layout-design.md`.
- Maximum center canvas width is `62rem` at wide desktop.
- Show the persistent right guide only at viewport widths of at least `90rem`.
- Preserve current mobile filter/comparison dialog behavior.
- Do not introduce page-level horizontal overflow.
- Keep the guide contextual and evidence-first; do not add empty promotional UI.
- Run all development commands inside `vulnbench-dev`.
- Do not commit or push unless explicitly requested.

---

### Task 1: Add the view-specific research guide

**Files:**
- Create: `src/components/explorer/ExplorerGuideRail.tsx`
- Create: `src/components/explorer/ExplorerGuideRail.test.tsx`
- Modify: `src/components/explorer/ExplorerApp.tsx`

**Interfaces:**

```ts
interface ExplorerGuideRailProps {
  state: ExplorerState;
  representedRuns: number;
  activeFilterCount: number;
}
```

- [ ] Write failing tests for Summary, Repeatability, Coverage, and Efficiency interpretation/caveat text plus active metric, aggregation, represented runs, and resource links.
- [ ] Run `npm exec vitest run src/components/explorer/ExplorerGuideRail.test.tsx`; expect missing-component failure.
- [ ] Implement semantic `<aside aria-label="View guide">` content derived only from `ExplorerState`.
- [ ] Render the guide as the third workbench child.
- [ ] Re-run focused tests; expect PASS.

### Task 2: Cap and center the adaptive workbench

**Files:**
- Modify: `src/components/explorer/ExplorerApp.tsx`
- Modify: `tests/e2e/explorer.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`

- [ ] Add failing browser assertions at `1920px`, `1280px`, and `390px` for three, two, and one-column behavior.
- [ ] Assert the center canvas is at most `62rem`, the wide workbench is centered, the guide is hidden below `90rem`, and page scroll width never exceeds viewport width.
- [ ] Implement the centered `98rem` maximum workbench grid with `17rem minmax(0, 62rem) 16rem` wide columns.
- [ ] Keep matrices and scorecards locally scrollable.
- [ ] Re-run explorer and accessibility browser tests; expect PASS.

### Task 3: Verify the layout slice

**Files:**
- Modify: `AGENTS.md`

- [ ] Add the approved layout spec and plan to agent routing.
- [ ] Run `npm run verify` inside the container.
- [ ] Run Snyk Code against `src/`.
- [ ] Confirm no new dependency, license, accessibility, or narrative-budget regression.

