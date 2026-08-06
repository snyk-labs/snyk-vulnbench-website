# Classic VulnBench Trace in Snyk 2026

**Status:** Approved design
**Date:** 2026-08-06
**Product:** Snyk VulnBench website

## Goal

Restore the exact Classic VulnBench trace treatment in every Snyk 2026 build and
visitor color mode. The shared header trace and branded favicon should use the
same lavender surface, purple border, and purple five-dot arrangement as the
Classic identity.

## Scope

- Keep the Snyk 2026 build-selected favicon URL
  (`/brand/snyk-2026/favicon.svg`) so asset selection remains static and
  design-aware.
- Replace that branded favicon's drawing with the exact Classic favicon
  geometry and colors.
- Retain the Snyk trace override in `Wordmark.astro`, but set its trace
  declarations to the approved Classic values.
- Keep the surrounding Snyk 2026 header identity unchanged:
  - Snyk Dark retains a white VulnBench wordmark.
  - Snyk Light retains its existing readable wordmark color.
  - Only the trace treatment and favicon change.

## Visual contract

The restored trace uses:

- a `1.75rem` square in the header;
- a `1px` purple border;
- a lavender `#e8e1ff` surface;
- five purple `#4b2be3` dots in the existing trace arrangement;
- the favicon's existing Classic `28 × 28` SVG geometry and colors.

The result is independent of saved Light/Dark mode. The favicon remains
independent of visitor color mode because it is a static build asset.

## Approved Snyk palette exception

The owner explicitly approves a narrowly scoped exception to the Snyk 2026
locked-palette audit for the primary VulnBench trace identity:

- `#4b2be3` remains the trace border and dot color.
- `#e8e1ff` remains the trace surface color.
- The exception applies only to `src/components/site/Wordmark.astro`'s
  branded trace treatment and `public/brand/snyk-2026/favicon.svg`.
- The audit must continue rejecting these colors in every other Snyk-branded
  source, component, generated asset, and page composition.

This preserves the established VulnBench identity while keeping the Snyk
palette contract strict everywhere else.

## Testing

Update the existing branded identity tests to prove:

- the Snyk branded favicon retains the five-dot trace and exact Classic color
  values;
- the Snyk wordmark retains the Snyk-specific trace override with the approved
  Classic trace colors;
- the Classic favicon remains unchanged;
- the Snyk favicon path remains the build-selected asset path.
- the brand audit accepts the two exact Classic trace colors only for the two
  approved identity sources and rejects them in generic branded fixtures.

Run the focused identity tests, Astro/TypeScript diagnostics, and the
proportional Classic and Snyk verification checks inside the mandated
`vulnbench-dev` container.
