# Project Conventions

This document records durable lessons learned from implemented product feedback
and code review. It supplements the approved design specifications; when they
conflict, the approved specification is the source of truth.

## Maintaining this document

- Update this document when accepted feedback establishes a reusable functional,
  visual, content, accessibility, testing, or maintenance principle.
- Capture the general rule and its rationale, not a chronological account of a
  single review.
- Amend an existing convention when possible instead of adding duplicates.
- Keep examples concrete, but do not turn one implementation into a universal
  rule unless the underlying reason applies elsewhere.
- Include the checks that demonstrate the convention is preserved.

## Build-selected design themes

Design theme is selected at build time; color mode is selected by the visitor or system preference.
The current Snyk 2026 identity and Dark rules are defined by the
[Snyk Dark Neutral Identity Refinement Design](superpowers/specs/2026-08-06-snyk-dark-neutral-identity-refinement-design.md).

- Shared components consume semantic CSS tokens rather than environment
  variables. This keeps release content and analytical behavior independent of
  the deployment-selected `classic` or `snyk-2026` design.
- Classic and Snyk 2026 output require separate verification. Run the complete
  `verify:classic` and `verify:snyk-2026` gates before delivery.
- Verification gates override the design theme for every spawned child process
  and server. Contract tests must exercise each gate under Classic, invalid,
  and unset ambient values so an inherited deployment environment cannot
  select the wrong design.
- Branded changes must pass the mechanical brand audit and real visual and Axe
  checks. The audit is additive to, not a substitute for, browser validation.
  Keep branded constructs inside marked audit blocks in shared sources. The
  audit must reject saturated Dark panel fills, off-palette literals, excess
  gradients, and branded source outside marked audit blocks.
- VulnBench remains the primary header identity in both designs. Keep the
  shared header compact at `4.25rem`. The official Snyk wordmark appears only
  in the Snyk 2026 footer attribution, spatially separate from the initiative
  text and with its required clear space.
- Snyk 2026 Dark uses Midnight and restrained white-alpha depth for page,
  narrative, explorer, chart, table, and metadata surfaces. Reserve locked
  saturated colors for semantic marks and small intentional accents rather
  than broad panels. Explicit Dark and no-JavaScript system Dark must resolve
  the same semantic tokens; verify that parity in source contracts and rendered
  browser checks.
- Snyk 2026 Light is a website-specific white analytical canvas with Midnight
  copy, restrained locked-color alpha tints, and one contained exact Brand
  Gradient accent per page. Keep header/footer Midnight, keep most narrative
  and explorer surfaces light, and reserve a dark evidence card for a contained
  analytical focal point. Verify explicit and no-JavaScript system Light in a
  real browser at desktop and mobile widths.
- Verify official logo minimums from rendered image bounds at mobile and
  desktop widths. Preserve clear space of at least one rendered wordmark height
  on all four sides, and measure each side in a real browser together with
  control visibility and a 320-pixel horizontal-overflow assertion.
- Shared analytical markup may expose bounded, design-neutral values through
  CSS custom properties. Classic may use continuous analytical scales while
  Snyk 2026 uses locked discrete bands. Root-scoped computed-style tests must
  prove the presentations differ without reading the build environment in
  React.
- Approved local branded assets retain documented provenance and checksums.
  This keeps their origin and integrity reviewable.

## Evidence visualizations

### Label quantitative marks directly

Readers must be able to understand a chart without inferring meaning from color,
vertical order, hover behavior, or nearby content.

- Put a concise category label and formatted value adjacent to every bar or
  other quantitative mark.
- Make units and denominators explicit. If a compact chart uses percentages,
  keep exact counts available in the same figure through visible supporting
  content or an equivalent table.
- Use color, shape, fill, and line style as reinforcement rather than as the
  only mapping between a mark and its meaning.
- Keep the chart's scope, dataset version, release, and source adjacent to the
  visualization.
- Preserve an equivalent accessible description and exact-value table for
  assistive technology and non-visual inspection.
- Verify labels at narrow viewports and in every supported theme.

For the recurrence contrast chart, this means showing each finding-group label
and percentage directly above its bar while retaining exact counts, linked
explorer states, provenance, and the accessible table below the plot.
