# Efficiency Cost Scaling Design

**Status:** Approved  
**Date:** 2026-08-29  
**Applies to:** `/releases/js-1.0/explore?v=1&view=efficiency`

## Goal

Place a production-scale resource projection above the existing measured
Efficiency scatter so readers can compare how the five published model
configurations would scale across representative open-source web application
sizes without confusing extrapolated values with observed benchmark evidence.

## Approved composition

The center analysis column renders two ordered figures:

1. **Projected resource use by application size** — one line per selected
   configuration and five fixed web-application reference markers.
2. **Observed Snyk-reference agreement versus resource use** — the existing
   `EvidenceScatter`, unchanged in metric meaning.

A short relationship label between the figures states that the upper projection
is derived from the observed JS 1.0 resource measurements below. The existing
Cost, Tokens, and Duration selector drives both figures. Cost and tokens exclude
the Snyk Code command reference; duration may include it.

The five web-application references are:

- Mastodon — 170,480 production SLOC.
- Zulip — 326,630 production SLOC.
- WordPress Core — 476,469 production SLOC.
- Discourse — 637,925 production SLOC.
- Mattermost — 795,858 production SLOC.

These values come from `cloc` 2.06 measurements on pinned upstream revisions.
They include browser and server application code and exclude tests,
documentation, dependencies, generated output, fixtures, mocks, and build
artifacts. Each reference retains its repository URL, commit, measurement date,
and counting note in typed website data.

## Projection model

The JS 1.0 fixtures contain 1,154 SLOC across JavaScript, TypeScript, JSX/TSX,
CSS/SCSS, HTML, and Handlebars according to `cloc` 2.06. Package manifests,
lockfiles, dependencies, comments, and blank lines are outside that denominator.

For each configuration and active resource metric:

```text
release resource total =
  sum of the ten published per-fixture mean session resource values

resource rate per 1,000 SLOC =
  release resource total / 1.154

projected application resource =
  resource rate per 1,000 SLOC × application SLOC / 1,000
```

Cost uses published estimated API-equivalent model-session USD. Tokens use
published mean total tokens. Duration uses published mean wall-clock seconds.
The projection always derives rates from the complete release matrix, not the
currently filtered project subset. Configuration filters control which lines
remain visible.

This is a deliberately simple linear extrapolation. It does not model context
window boundaries, repository indexing, incremental scans, parallel execution,
deduplication, caching changes, model price changes, or economies of scale.

## Figure behavior

- X-axis: application source lines of code.
- Y-axis: projected USD, tokens, or duration according to the active resource.
- Each configuration uses the same color and shape identity as existing
  evidence figures.
- Each model line is labeled directly with configuration name and normalized
  rate; color is reinforcement, not the sole identifier.
- Each application appears as a labeled vertical reference marker.
- Keyboard-accessible controls select an application and expose exact projected
  values for every visible configuration.
- An equivalent table lists configuration, observed normalized rate, each
  application projection, unit, and source status.
- CSV and SVG exports include metric, unit, release, dataset version,
  denominator, model name, application name, application SLOC, projected value,
  and the extrapolation caveat.

The figure remains useful at narrow widths through local horizontal scrolling
and a readable exact-value table. It introduces no page-level horizontal
overflow. The existing three-column explorer behavior and sticky guide remain
unchanged.

## Scientific language

The upper figure is always labeled **Projected** and the lower figure
**Observed**. Adjacent copy states:

- The application points are size references, not completed scans.
- The values extrapolate from small JS 1.0 fixtures.
- Scanning the full codebase does not guarantee finding every vulnerability.
- Snyk-reference F1 is reference agreement, not universal detection accuracy.
- Snyk Code has no comparable model-session cost or token value.

The view must not call unmatched findings false positives, call
reference-matched findings true positives, or shorten reference agreement to
accuracy.

## Data and architecture

- Add the fixed application measurements and projection constants to a focused
  typed module under `src/data/explorer/`.
- Keep projection arithmetic in pure functions with finite-value validation.
- Derive release resource totals from the already validated JS 1.0 task
  observations; do not duplicate published cost, token, duration, or F1 values.
- Render the new React figure in a focused component above
  `EvidenceScatter`.
- Update the right guide so it explains projected versus observed evidence.
- Keep the site fully static and add no runtime API, database, account, or
  analytics requirement.

## Verification

- Unit tests cover the five pinned application references, 1,154-SLOC fixture
  denominator, exact model rates, projection arithmetic, null command cost, and
  active configuration filtering.
- Component tests cover both figure headings, direct labels, exact accessible
  values, projection caveat, and Cost/Tokens/Duration behavior.
- Browser tests cover ordering, wide three-column layout, mobile overflow,
  keyboard use, exports, both themes, and Axe.
- Run source integrity because the design derives a denominator from the
  immutable fixture snapshot without modifying it.
