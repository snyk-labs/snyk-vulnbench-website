# Snyk Dark Neutral Identity Refinement Design

**Status:** Approved design
**Date:** 2026-08-06
**Product:** Snyk VulnBench website

## Purpose

Refine the Snyk 2026 Dark color mode so it feels as clean, calm, and
evidence-led as the approved Light mode. Restore VulnBench as the primary
header identity, reduce navigation height, and move the official Snyk
wordmark to a secondary footer attribution.

This refinement changes only the Snyk 2026 design. Classic remains unchanged.
The approved white analytical Light mode remains visually unchanged.

## Identity hierarchy

VulnBench is the primary product identity. Snyk is the initiative sponsor.

- The global header renders the existing VulnBench wordmark and finding-trace
  mark in both Classic and Snyk 2026 builds.
- The Snyk 2026 favicon uses the same VulnBench finding-trace mark, adapted to
  the locked Snyk palette.
- The official white Snyk wordmark moves to the footer initiative area.
- The footer keeps the logo and “A Snyk benchmark initiative” text spatially
  separate rather than creating an improvised inline lockup.
- The Snyk wordmark remains white, proportional, effect-free, and surrounded
  by sufficient clear space.

## Header and navigation

The Snyk 2026 header returns to the compact Classic footprint:

- Minimum height is `4.25rem`.
- Desktop uses the existing sparse navigation and Light/Dark control.
- Mobile keeps the VulnBench identity, theme control, and menu on one compact,
  non-overlapping row where the viewport permits.
- The branded header remains Midnight so the neutral VulnBench mark and
  controls have stable contrast.
- Navigation and controls use Geist Medium 500.

The header must not contain the official Snyk wordmark.

## Dark visual direction: Warm Ink Editorial

Snyk 2026 Dark uses a neutral Midnight editorial foundation with restrained
warm brand accents.

### Surfaces and depth

- Page base: Midnight `#030328`.
- Raised surfaces use subtle white-alpha fills rather than large Dark Purple
  blocks.
- Structural rules use low white alpha; stronger control boundaries meet
  WCAG 2.2 AA non-text contrast.
- Dark Purple may support a small, intentional accent but is not the default
  panel, warning, matched, or hover background.
- Dense explorer, table, chart, and metadata surfaces remain visibly layered
  without glass, blur, or decorative shadow.

### Text hierarchy

- H1 and meaningful hero metrics may use solid white.
- H2/H3 and primary interface copy use softened near-white.
- Body text uses approximately 65–72% white.
- Tertiary metadata uses approximately 45–55% white.
- H1 is Geist Bold 700.
- H2/H3, navigation, controls, eyebrows, and compact labels are Geist or Geist
  Mono Medium 500.
- Body text is Geist Regular 400.
- No text shadow or glow is used.

### Brand color roles

- Purple `#6F00DD`: structural focus and reference-matched evidence.
- Orange-Red `#F3552E`: restrained warmth and unmatched evidence.
- Amber `#FE9104`: warnings and caveats only.
- Hot Pink `#FF00FF`: rare high-emphasis accent, not a general link or panel
  color.
- Dark Purple `#2B0250`: limited depth accent, not a dominant surface.

Color never replaces labels, shapes, line styles, exact values, or equivalent
tables.

### Warm edge

Each page may use one thin exact Brand Gradient rule as the warm edge. It must:

- remain a contained line or edge rather than a large fill;
- never sit behind running copy;
- remain the only CSS Brand Gradient in the page composition;
- avoid glow and animation.

The approved gradient fabric may appear once in the bottom-right composition
at low opacity. It must remain clear of copy, controls, logo, and footer.

## Light mode preservation

The Snyk 2026 Light mode remains the approved white analytical design:

- white canvas and raised surfaces;
- Midnight text and soft Midnight structural alpha;
- restrained locked-color tints;
- one thin Brand Gradient accent;
- subtle no-gradient fabric;
- existing typography hierarchy.

No Light-mode surface, spacing, semantic color, chart, or layout treatment is
changed by this refinement except shared identity markup required to restore
the VulnBench header and add the footer Snyk attribution.

## Evidence and explorer behavior

Dark analytical views use neutral white-alpha depth:

- matched evidence remains Purple;
- unmatched evidence remains Orange-Red;
- warnings remain Amber;
- Dark heatmap bands use distinct neutral or Purple-alpha levels with exact
  labels and sufficient text contrast;
- configuration colors remain locked-palette and retain shape encoding;
- selected and hover states avoid large saturated fills;
- exported SVGs continue to resolve active Dark tokens and Geist typography.

All filters, URL state, comparison, keyboard interaction, chart/table parity,
and no-JavaScript evidence remain unchanged.

## Accessibility and verification

Automated coverage must verify:

- VulnBench header identity and compact `4.25rem` footprint;
- official Snyk logo appears in the footer but not the header;
- Snyk 2026 favicon uses the VulnBench finding-trace mark;
- Light screenshots and computed surface tokens remain unchanged;
- Dark raised surfaces use approved neutral alpha rather than dominant Dark
  Purple;
- Dark text hierarchy uses the specified weights and opacity tiers;
- exactly one visible thin Brand Gradient edge per representative page;
- Dark semantic colors, control boundaries, charts, and tables meet WCAG 2.2
  AA;
- desktop/mobile, no-JavaScript, SVG export, budget, release isolation, and
  mechanical brand gates remain green.

Manual review covers the homepage, release overview, explorer coverage view,
mobile header, footer attribution, and Light/Dark comparison.

## Delivery boundary

The Vercel branch-preview configuration remains unchanged. This revision is
part of the existing feature branch and pull request. External publication
still requires the documented Jira and `#ask-brand-design` review plus
`brand-approved` status.
