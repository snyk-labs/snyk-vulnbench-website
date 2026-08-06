# Final whole-branch review fix report

## Status

Complete. All three final review findings were fixed in one TDD wave:

1. `verify:classic` now invokes a dedicated runner with
   `VULNBENCH_DESIGN_THEME=classic`, and that runner replaces the theme for every
   child command and Playwright server.
2. The official Snyk wordmark retains its 120px mobile and 140px desktop visible
   widths while deriving four-sided clear space from the asset's rendered
   height. The 320px shell wraps controls onto a separate row without overlap
   or horizontal overflow.
3. Coverage cells expose a bounded, design-neutral CSS percentage. Classic
   consumes it as the original continuous `color-mix` scale; root-scoped Snyk
   2026 rules continue to consume the locked discrete `--heatmap-0..4` bands.
   React does not inspect the build environment.

## TDD evidence

RED was observed before production changes:

- Classic gate contract:
  - Both `classic` and `snyk-2026` ambient cases failed because
    `verify:classic` was the unscoped `npm run ... && ...` chain.
- Logo source and browser geometry:
  - The source contract failed because clear space was fixed rather than
    proportional to the rendered wordmark height.
  - At 320px, rendered padding was 16px against a roughly 62px wordmark height.
  - At 1440px, rendered padding was 28px against a roughly 72px wordmark height.
- Coverage:
  - Nine measured-value unit cases failed because no safe custom percentage was
    emitted.
  - Classic and branded browser presentation tests failed before the custom
    percentage existed.
- Documentation:
  - The durable convention test failed before gate isolation, four-sided clear
    space, and design-specific analytical-scale rules were recorded.

GREEN after the minimal implementation:

- Focused final-review contracts: 4 files, 22 tests passed.
- Package/brand gate contracts: 2 files, 89 tests passed.
- Focused Classic continuous and branded discrete browser tests passed.
- Mobile and desktop logo geometry tests passed.

The browser heatmap regression initially queried the React island before cells
were rendered. Waiting for the first real cell fixed the test synchronization.
A stale pre-existing Astro server on port 4321 was also stopped so Playwright
could exercise the current worktree rather than reused output.

## Verification evidence

All development commands ran inside `vulnbench-dev`.

### Focused and explicit gates

- `npm run check`: 126 files, 0 errors, 0 warnings, 0 hints.
- `npm run check:brand`: PASS for branded sources, generated identity SVGs, and
  generated HTML metadata.
- Explicit Classic browser suite: 210 passed.
- Explicit Snyk 2026 browser suite: 65 passed.
- Explicit Classic build: 20 pages generated.
- Explicit Snyk 2026 build: 20 pages generated.

### Fresh full verification

`npm run verify` passed normally, then passed again with the hostile ambient
environment:

```sh
VULNBENCH_DESIGN_THEME=snyk-2026 npm run verify
```

Both runs proved:

- Classic gate starts with
  `VULNBENCH_DESIGN_THEME=classic node scripts/verify-classic.mjs`.
- Astro checks: 126 files, 0 errors, 0 warnings, 0 hints in both designs.
- Unit tests: 29 files and 200 tests passed in each design.
- Builds: 20 pages generated in each design.
- Release isolation: JS 1.0 only.
- Classic browser suite: 210 passed.
- Snyk 2026 browser suite: 65 passed.
- Mechanical brand audit: PASS.
- Classic compressed JavaScript bytes:
  - Homepage 62,207
  - Release overview 65,102
  - Cases 2,015
  - Release methodology 2,025
  - Release data 2,017
  - Core explorer 78,095
- Snyk 2026 compressed JavaScript bytes:
  - Homepage 62,212
  - Release overview 65,107
  - Cases 2,020
  - Release methodology 2,030
  - Release data 2,022
  - Core explorer 78,100

An intermediate full gate correctly found the old package-gate expectation.
That existing contract was updated to the deterministic runner and the full
gate was rerun from the beginning. The brand audit also required the new
root-scoped selectors to be placed in explicit audit blocks and the semantic
heatmap variables to carry locked-palette fallbacks.

## Security scan

Targeted Snyk Code scans reported zero issues for:

- Modified first-party application source under `src/`.
- New `scripts/verify-classic.mjs` gate runner.

The fixed command list is not derived from external input, and each child
receives an explicit cloned environment with the Classic design selection.

## Visual findings

Captured and read back:

- `.superpowers/sdd/artifacts/final-review-home-mobile.png`
- `.superpowers/sdd/artifacts/final-review-home-desktop.png`
- `.superpowers/sdd/artifacts/final-review-coverage-heatmap.png`
- `.superpowers/sdd/artifacts/final-review-classic-coverage-heatmap.png`

Observed results:

- At 320px the 120px Snyk wordmark has at least one rendered wordmark height of
  clear space on every side. Theme and menu controls remain visible, move to a
  clean second row, do not overlap the logo safe zone, and do not overflow.
- At 1440px the 140px wordmark remains corner-aligned with proportional
  four-sided clear space; navigation and theme controls remain separated.
- The logo remains white, proportional, unboxed, and free of effects.
- Classic Coverage visibly restores continuous intensity: nearby values such
  as 30%, 45%, and 48% render as progressively different teal mixes.
- Snyk 2026 Coverage visibly retains discrete neutral bands: values in the same
  threshold band share a locked surface while exact percentages and supporting
  numerator/denominator text remain printed.
- Zero, N/A, missing, exact text, and equivalent table behavior remain covered
  by unit and browser regressions.
- No horizontal overflow, decorative treatment, or second gradient was
  introduced.

## Concerns

- The mandatory one-height logo safe zone makes the 320px branded header
  intentionally taller; wrapping the controls is the necessary responsive
  tradeoff that preserves both the brand rule and usable controls.
- No actionable implementation concern remains.
- External publication still requires the separate Snyk brand approval gate
  described in the approved design specification.
