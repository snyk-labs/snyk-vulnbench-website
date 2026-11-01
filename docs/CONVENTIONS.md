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

Snyk 2026 is the default build-selected design theme; explicit `classic` remains
a deterministic override. Light is the default color mode regardless of system
preference; valid saved Light or Dark choices override it. No-JavaScript output
uses Light tokens regardless of system preference.
The current Snyk 2026 identity and Dark rules are defined by the
[Snyk Dark Neutral Identity Refinement Design](superpowers/specs/2026-08-06-snyk-dark-neutral-identity-refinement-design.md).

- Shared components consume semantic CSS tokens rather than environment
  variables. This keeps release content and analytical behavior independent of
  the deployment-selected `classic` or `snyk-2026` design.
- Classic and Snyk 2026 output require separate verification. Run the complete
  `verify:classic` and `verify:snyk-2026` gates before delivery. The standard
  build and full verification gate exercise the Snyk 2026 default; the full
  gate also includes the deterministic Classic override.
- Verification gates override the design theme for every spawned child process
  and server. Contract tests must exercise each gate under Classic, invalid,
  and unset ambient values so an inherited deployment environment cannot
  select the wrong design.
- Branded changes must pass the mechanical brand audit and real visual and Axe
  checks. The audit is additive to, not a substitute for, browser validation.
  Keep branded constructs inside marked audit blocks in shared sources. The
  audit must reject saturated Dark panel fills, off-palette literals, excess
  gradients, decorative shadow or `drop-shadow()` effects, and branded source
  outside marked audit blocks. Every shared component with branded selectors
  belongs to a page composition in the audit; balanced markers must exclude
  Classic-only rules without hiding branded violations. Reject every visible
  `text-shadow` and every backdrop/filter blur; only guaranteed no-effect
  `text-shadow` values are valid. Resolve custom-property chains and fallbacks
  before auditing filters: backdrop filters are no-effect only, while
  foreground filters may use the explicit non-blur function allowlist.
- VulnBench remains the primary header identity in both designs. Keep the
  shared header compact at `4.25rem`. The official Snyk wordmark appears only
  in the Snyk 2026 footer attribution, spatially separate from the initiative
  text and with its required clear space.
- Snyk 2026 Dark uses Midnight and restrained white-alpha depth for page,
  narrative, explorer, chart, table, and metadata surfaces. Reserve locked
  saturated colors for semantic marks and small intentional accents rather
  than broad panels. General Dark action links use a dedicated contrast-safe
  near-white semantic rather than Hot Pink; approved Light action treatment is
  unchanged, and Purple remains available for reference-matched marks. Explicit
  saved Dark must resolve the approved Dark semantic tokens; no-JavaScript
  output remains Light under either system preference.
- Snyk 2026 Light is a website-specific white analytical canvas with Midnight
  copy, restrained locked-color alpha tints, and one contained exact Brand
  Gradient accent per page. Keep header/footer Midnight, keep most narrative
  and explorer surfaces light, and reserve a dark evidence card for a contained
  analytical focal point. Verify explicit Light and no-JavaScript system Light
  and Dark in a real browser at desktop and mobile widths.
- The exact Brand Gradient is valid only as one objectively bounded edge per
  page. Audit every direct or custom-property `background`,
  `background-image`, `border-image`, and `border-image-source` consumer;
  require a thin element, no-repeat bounded background size, or thin border.
  Focus treatment is the only allowed `box-shadow`: it uses approved Purple and
  white zero-blur keylines on `:focus-visible`.
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

### Separate projected and observed evidence

Projections are interpretations of measured benchmark data, not further
measurements. Readers must not have to infer that distinction from chart
position, color, or surrounding prose.

- Render projected and observed analytical evidence as separate, explicitly
  labeled figures. Preserve their reading order and provide an equivalent
  exact-value table for each figure.
- State each projection's observed input scope, denominator and formula,
  assumptions, out-of-sample scale, unit, and limitations adjacent to the
  figure. Label size references as references rather than completed scans.
- Keep release-wide rates release-wide: filters may change visible series, but
  must not silently recalculate the measured basis from a subset unless the
  figure states that altered basis.
- Test the browser composition for figure order, exact accessible values,
  keyboard controls, exports, and narrow-page overflow. Run the existing Axe
  suite to protect the semantic structure and contrast of both figures.

## Cookieless analytics

When analytics is approved for a public VulnBench release, it must default to
PostHog EU Cloud cookieless page-view measurement. Keep Cookieless server hash
mode and IP discard enabled in PostHog, use no browser persistence or person
profiles, and disable behavioral collection such as autocapture, heatmaps,
performance capture, replay, surveys, feature flags, exceptions, and page
leaves. Send only origin-plus-path page views; remove query strings, fragments,
and referrers. Publish the static privacy disclosure and verify both sanitized
network payloads and the absence of PostHog requests with JavaScript disabled.

## Release copy and published numbers

A release's narrative claims and numbers are reviewed outside this repository
before launch. The site reproduces that reviewed record; it never derives new
claims from it.

- Import release copy, tables and figures with the release's import script
  (for 2.0, `node scripts/import-vulnbench-2.0.mjs --handoff <extracted-package-dir>`).
  Keep the handoff package outside the repository. The importer copies only
  served content and strips internal review keys (`src` tags, claim IDs and
  `source_claims`); the numbers registry, guardrails and checking scripts stay
  in the package.
- Serve each table and notes download as the stored file's bytes, never a
  re-serialization, so `/data/<release>/` files can be compared byte for byte
  with the reviewed package.
- Render numbers exactly as the imported copy or table cell prints them. Do
  not compute differences, ratios, percentages or rankings in components, and
  do not type numbers into components or tests; tests read the imported files.
- Keep wording as imported. Presentation may split lines, choose which body
  lines a card shows, or shorten headings without changing meaning; record any
  added interface label as a deviation for review.
- An interface label that is not in the imported copy must be purely
  navigational or descriptive: no number, claim, ranking or evaluative word.
  Put units, denominators and scope in a table note quoted from the copy or the
  table's notes file instead, and list every such label, with its page, in the
  pull request for review.
- Drop a copy sentence only where the page shows the identical text directly
  above it, and do it in code that fails the build if the copy changes
  (for example `<Disclosure repeats={home.eyebrow} />`); everywhere else render
  the copy in full.
- Previous releases keep their URLs, pages, data and citations. A new release
  changes only the previous release's status label; global navigation and the
  footer move to the current release.
- Verify with the package's number checker against built output, a search of
  the build for claim IDs, and a normalized diff of previous-release pages and
  data against `main` that ignores only the shared header and footer.

## Social previews

External unfurlers do not reliably render SVG. In the Snyk 2026 build, every
page's `og:image` is a 1200 × 630 PNG; generated SVG cards remain available as
sources. Rasterize a new card from the served build with
`scripts/rasterise-social-card.mjs`, record its provenance and checksum, and
assert the PNG's dimensions and size in unit tests.

A release card's text comes only from that release's card and homepage copy
(for 2.0, `copy/release-card.json` and `copy/home.json`), and its numbers only
from the release's printed values; a unit test checks every line of the card
against those files. A shared page with no release-neutral default card uses
the current release's card, never a previous release's.
