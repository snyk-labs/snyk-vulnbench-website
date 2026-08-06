# Snyk Design and Light Mode Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Make Snyk 2026 and Light the default design/mode while preserving
explicit Classic and saved Dark overrides.

**Architecture:** Change the typed build resolver fallback and the shared
pre-paint/color-mode controller. Remove system-preference and temporary
branch-preview logic, then align CSS no-theme fallbacks, tests, and docs.

**Tech Stack:** Astro, TypeScript, CSS custom properties, Vitest, Playwright,
Axe, Node verification scripts.

## Global Constraints

- No environment value builds Snyk 2026.
- `VULNBENCH_DESIGN_THEME=classic` remains valid and deterministic.
- No saved mode initializes Light regardless of system preference.
- Saved Light/Dark choices persist and synchronize across tabs.
- Clearing storage returns Light.
- No-JavaScript renders Light regardless of system preference.
- Preserve Classic, Snyk Light/Dark visuals, routes, evidence, exports,
  accessibility, static architecture, and budgets.
- Remove `vercel.json`, `scripts/vercel-build.mjs`, and
  `tests/vercel-preview-theme.test.ts`.
- Run development commands in `vulnbench-dev`.

### Task 1: Change typed design and color-mode defaults

**Files:**
- Modify: `src/config/design-theme.ts`
- Modify: `src/config/design-theme.test.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/site/ThemeToggle.astro`
- Modify: `tests/e2e/support/theme.ts`
- Modify: `tests/e2e/theme.spec.ts`
- Modify: `tests/e2e/design-theme.spec.ts`
- Delete: `vercel.json`
- Delete: `scripts/vercel-build.mjs`
- Delete: `tests/vercel-preview-theme.test.ts`

- [ ] Write failing tests for Snyk fallback, Light initialization on both
      system modes, saved preference precedence, ignored live system changes,
      storage clearing to Light, and obsolete Vercel config removal.
- [ ] Confirm RED.
- [ ] Change absent/empty design fallback to `snyk-2026`.
- [ ] Replace system-derived mode fallback with Light in both inline scripts.
- [ ] Remove media-query listeners and live system-following logic.
- [ ] Preserve saved mode and storage-event behavior.
- [ ] Remove obsolete branch-preview build configuration.
- [ ] Run focused tests, Astro check, and explicit default/Classic builds.
- [ ] Commit.

### Task 2: Make all no-JavaScript fallbacks Light

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/tokens-snyk-2026.css`
- Modify: `src/styles/global.css`
- Modify: `src/components/home/Hero.astro`
- Modify: `src/components/site/PageHero.astro`
- Modify: `src/components/site/BrandFabric.astro`
- Modify: `src/components/explorer/ExplorerApp.tsx`
- Modify: `src/styles/snyk-2026-contract.test.ts`
- Modify: `tests/e2e/theme.spec.ts`
- Modify: `tests/e2e/design-theme.spec.ts`

- [ ] Write failing explicit no-JavaScript system-Light/system-Dark assertions
      for Classic and Snyk.
- [ ] Confirm RED against current system-Dark fallbacks.
- [ ] Remove no-theme `prefers-color-scheme: dark` token/component mappings.
- [ ] Make Snyk no-theme Light selectors unconditional.
- [ ] Preserve explicit `data-theme="dark"` behavior.
- [ ] Run focused unit/e2e/Axe and both builds.
- [ ] Commit.

### Task 3: Align verification and documentation

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/CONVENTIONS.md`
- Modify: `docs/superpowers/specs/2026-08-05-dark-mode-theme-design.md`
- Modify: `docs/superpowers/specs/2026-08-05-snyk-2026-brand-theme-design.md`
- Modify: `docs/superpowers/plans/2026-08-05-snyk-2026-brand-theme.md`
- Modify: `tests/design-theme-documentation.test.ts`
- Modify: `tests/classic-gate-contract.test.ts`
- Modify: `tests/snyk-2026-gate-contract.test.ts`

- [ ] Add failing documentation/gate contracts for the new defaults.
- [ ] Update docs to state Snyk and Light defaults and explicit overrides.
- [ ] Ensure default build and verification exercise Snyk while dedicated
      Classic gate remains deterministic.
- [ ] Run focused contracts and brand audit.
- [ ] Commit.

### Task 4: Final verification and delivery

- [ ] Run default build and inspect `data-design-theme="snyk-2026"`.
- [ ] Run explicit Classic build and inspect `data-design-theme="classic"`.
- [ ] Run `npm run verify`.
- [ ] Run first-party Snyk Code and dependency scans.
- [ ] Complete whole-branch review and fix Critical/Important findings.
- [ ] Confirm clean status and diff.
- [ ] Push the branch and confirm Vercel Preview completion.
