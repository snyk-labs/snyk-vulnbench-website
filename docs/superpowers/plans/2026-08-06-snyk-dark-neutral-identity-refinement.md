# Snyk Dark Neutral Identity Refinement Implementation Plan

> **Defaults supersession:** The later
> `docs/superpowers/specs/2026-08-06-snyk-light-defaults-design.md` and
> `docs/superpowers/plans/2026-08-06-snyk-light-defaults.md` supersede this
> plan's temporary Vercel-preview preservation and system-derived no-JavaScript
> Dark assumptions. Snyk 2026 and Light are now the defaults; Classic and Dark
> remain explicit overrides.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore neutral VulnBench identity and implement the approved Warm
Ink Editorial Snyk 2026 Dark mode without changing Classic or the approved
Snyk Light visual system.

**Architecture:** Keep the existing build-selected design and visitor
Light/Dark contracts. Change shared identity markup at build time, map Dark
visual depth through scoped semantic tokens, and verify rendered behavior in
the existing mechanical brand and Playwright gates.

**Tech Stack:** Astro 7, strict TypeScript, React 19, CSS custom properties,
Vitest, Playwright, Axe, Node brand-audit scripts.

## Global Constraints

- Classic rendering and behavior remain unchanged.
- Snyk 2026 Light surfaces, colors, typography, charts, and layout remain
  visually unchanged except for shared header/footer identity.
- The header renders the VulnBench finding-trace wordmark in both designs.
- The official white Snyk logo appears only in the Snyk 2026 footer.
- Snyk Dark uses Midnight plus neutral white-alpha depth; no large Dark Purple
  panels, text glow, glass, masks, or decorative shadow.
- Purple means focus/reference-matched evidence, Orange-Red means warmth and
  unmatched evidence, Amber means warnings, and Hot Pink is rare.
- Exactly one thin Brand Gradient edge may be visible per representative page.
- Preserve WCAG 2.2 AA, no-JavaScript behavior, chart/table parity, stable
  routes, static architecture, and the 200 KB compressed JavaScript budget.
- Standard builds use the Snyk default; the obsolete temporary Vercel
  branch-preview wrapper is removed by the defaults migration.
- Run every development command inside `vulnbench-dev` from
  `/workspace/.worktrees/snyk-2026-brand-theme`.

---

### Task 1: Restore neutral identity and compact navigation

**Files:**
- Modify: `src/components/site/SiteHeader.astro`
- Modify: `src/components/site/Wordmark.astro`
- Modify: `src/components/site/SiteFooter.astro`
- Modify: `src/components/site/SnykLogo.astro`
- Modify: `src/config/design-theme.ts`
- Modify: `public/brand/snyk-2026/favicon.svg`
- Modify: `src/components/site/branded-shell-contract.test.ts`
- Modify: `tests/e2e/design-theme-mobile.spec.ts`
- Modify: `tests/e2e/design-theme.spec.ts`

**Interfaces:**
- `SiteHeader` always consumes `Wordmark`; no design branch for identity.
- `SiteFooter` renders `SnykLogo` only when `isSnyk2026Design`.
- `designThemeAssets["snyk-2026"].favicon` remains stable at
  `/brand/snyk-2026/favicon.svg`.

- [ ] Write failing contracts requiring the VulnBench trace identity in the
      Snyk header, no Snyk header logo, compact `4.25rem` header, branded trace
      favicon, and a footer-only official Snyk logo.
- [ ] Run focused Vitest and Playwright tests and confirm expected failures.
- [ ] Remove the Snyk logo branch from `SiteHeader`; reuse `Wordmark` and scope
      its Snyk colors/weight to the current semantic tokens.
- [ ] Replace the branded favicon artwork with the VulnBench five-dot trace
      motif using only the locked palette.
- [ ] Add a build-selected footer attribution block containing the official
      white logo and separate initiative text, with proportional dimensions
      and clear space.
- [ ] Remove branded header wrapping/oversized safe-zone rules and restore the
      compact desktop/mobile navigation footprint.
- [ ] Run focused tests, Astro check, Classic build, and Snyk build.
- [ ] Commit as `fix: restore neutral VulnBench identity`.

### Task 2: Implement Warm Ink Editorial Dark tokens

**Files:**
- Modify: `src/styles/tokens-snyk-2026.css`
- Modify: `src/styles/snyk-2026-contract.test.ts`
- Modify: `src/styles/global.css`
- Modify: `src/components/home/Hero.astro`
- Modify: `src/components/site/PageHero.astro`
- Modify: `src/components/explorer/ExplorerApp.tsx`
- Modify: `src/components/explorer/ExplorerGuideRail.tsx`
- Modify: `src/components/site/ReleaseMeta.astro`
- Modify: `src/components/evidence/EvidenceScatter.tsx`

**Interfaces:**
- Explicit saved Dark uses the Warm Ink mapping.
- No-JavaScript system-Light and system-Dark both use the approved Light
  mapping after the defaults migration.
- Existing `--font-weight-*` tokens retain the approved Light hierarchy.

- [ ] Write failing token/browser contracts for neutral Dark raised surfaces,
      softened text tiers, semantic Orange/Purple/Amber roles, low fabric
      opacity, one thin warm edge, and unchanged Light computed values.
- [ ] Run focused tests and confirm failures against the current
      Dark-Purple-dominant mapping.
- [ ] Map Dark paper-raised/muted and soft semantic surfaces to restrained
      white-alpha or low-alpha locked-color values instead of broad
      `#2B0250`.
- [ ] Set primary/secondary/tertiary Dark text tiers so pure white is limited
      to H1 and meaningful metrics.
- [ ] Keep matched evidence Purple, unmatched Orange-Red, warnings Amber, and
      Hot Pink restricted to rare emphasis.
- [ ] Apply the existing 700/500/400 typography hierarchy to Dark controls,
      labels, narrative headings, tables, and explorer rails.
- [ ] Replace saturated Dark hover/selected panels with neutral layered
      surfaces and visible WCAG-compliant boundaries.
- [ ] Use one exact thin Brand Gradient edge and low-opacity warm BRC fabric
      without placing color behind copy.
- [ ] Run focused unit/browser/Axe tests and verify computed Light values are
      unchanged.
- [ ] Commit as `fix: refine Snyk Dark editorial depth`.

### Task 3: Update brand audit, docs, and rendered regression coverage

**Files:**
- Modify: `scripts/check-snyk-brand.mjs`
- Modify: `tests/scripts/check-snyk-brand.test.ts`
- Modify: `tests/e2e/design-theme.spec.ts`
- Modify: `tests/e2e/design-theme-accessibility.spec.ts`
- Modify: `tests/design-theme-documentation.test.ts`
- Modify: `docs/CONVENTIONS.md`
- Modify: `docs/superpowers/specs/2026-08-05-snyk-2026-brand-theme-design.md`
- Modify: `docs/superpowers/plans/2026-08-05-snyk-2026-brand-theme.md`

**Interfaces:**
- The Node audit remains the single mechanical policy implementation.
- Rendered browser checks validate page-level composition and contrast.

- [ ] Add failing audit fixtures for unauthorized saturated Dark panels,
      excessive gradient use, off-palette literals, and unmarked branded
      source.
- [ ] Add rendered assertions for header/footer identity, compact navigation,
      neutral Dark surfaces, softened text tiers, semantic colors, single warm
      edge, Light preservation, no-JavaScript parity, and dual-mode SVG export.
- [ ] Update durable docs to link the new refinement spec and supersede stale
      header/Dark requirements without duplicating the full brand guide.
- [ ] Run focused audit/documentation/browser tests and fix every finding.
- [ ] Capture desktop/mobile homepage, release, explorer, and footer screenshots
      in both modes; read back all images and compare Light against the previous
      approved captures.
- [ ] Run Snyk Code on changed first-party source/scripts.
- [ ] Commit as `test: validate neutral Snyk Dark refinement`.

### Task 4: Final verification and PR delivery

**Files:**
- No planned production files; fixes only if a failing gate identifies a
  specific regression.

- [ ] Run `npm run verify` inside `vulnbench-dev`.
- [ ] Confirm Classic and Snyk builds, unit tests, Playwright/Axe suites,
      source integrity, release isolation, budgets, and brand audit pass.
- [ ] Run final Snyk Code and dependency scans; separate expected fixture,
      checksum, and license findings from actionable website defects.
- [ ] Run a whole-branch code review and resolve all Critical/Important
      findings.
- [ ] Confirm clean git status and `git diff --check`.
- [ ] Push `feat/snyk-2026-brand-theme`.
- [ ] Confirm Vercel Preview redeploys successfully and report the PR URL.
