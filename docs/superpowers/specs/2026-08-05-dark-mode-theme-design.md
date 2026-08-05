# Dark Mode Theme Design

**Status:** Approved and implemented  
**Date:** 2026-08-05  
**Product:** Snyk VulnBench website

## Purpose

Add a full warm-charcoal dark theme without changing the website's editorial
research character, static architecture, scientific framing, accessibility
requirements, or JavaScript budget. Visitors can switch themes from the global
header, while first-time visits follow the operating-system preference.

## Theme architecture

`src/styles/tokens.css` is the source of truth for visual themes. It defines
light and dark primitives and maps them to the existing semantic variables used
by Astro and React components. Layout, spacing, typography, and component
structure remain theme-independent.

The document root uses `data-theme="light"` or `data-theme="dark"` as the
explicit theme contract. A small inline initializer in `BaseLayout.astro` runs
before paint and resolves the active theme in this order:

1. A valid saved `light` or `dark` preference.
2. The current `prefers-color-scheme` value.
3. Light as the defensive fallback.

The initializer also synchronizes the browser `color-scheme` and
`theme-color`. Storage and media-query access must fail safely.

Without JavaScript, the site follows `prefers-color-scheme` through CSS. The
complete narrative, navigation, tables, and static evidence remain usable.

## Toggle behavior

The top-right header control is a framework-free two-state button:

- It is visible at desktop and mobile breakpoints when JavaScript is available.
- Its accessible name describes the action, such as “Switch to dark theme.”
- Sun and moon icons are decorative and never replace the accessible name.
- Mouse and keyboard activation update the page immediately.
- An explicit choice is stored under `vulnbench-theme` and persists across
  navigation and reloads.
- Before an explicit choice, an open page follows live operating-system theme
  changes.
- Valid changes from another tab synchronize. Removing the saved value returns
  the page to the current system preference.
- With JavaScript disabled, the inactive control stays hidden.

## Visual direction

Dark mode uses warm charcoal surfaces, soft ivory text, restrained light
purple accents, and thin structural rules. It does not introduce gradients,
glass effects, decorative shadows, glow, or additional motion.

Semantic evidence colors remain stable in meaning:

- Teal represents reference-matched evidence.
- Coral represents unmatched evidence.
- Amber represents caveats and warnings.
- Configuration series retain consistent identities and shape encodings, so
  color is not the only distinction.

Charts, explorer controls, tables, legends, tooltips, heatmaps, and other
analytical surfaces use the active theme. The homepage evidence band has
dedicated semantic tokens so it remains a distinct dark section in either
theme.

Theme changes use no required motion. Any CSS transition or animation remains
subject to the global `prefers-reduced-motion` handling.

## Exports and static assets

User-triggered chart exports resolve active CSS values and inline the
background, color, stroke, and text presentation needed for a standalone SVG.
Exports therefore match the visitor's active theme without depending on the
website stylesheet.

Favicons and server-generated social share cards remain canonical light assets.
Those static requests have no reliable visitor theme state, and a stable
appearance is preferable for external consumers.

## Accessibility and verification

The implementation must preserve WCAG 2.2 AA, including visible keyboard
focus, sufficient text and data-mark contrast, semantic color alternatives,
chart/table parity, and responsive behavior at a 320-pixel viewport.

Automated coverage includes:

- System-light and system-dark initialization.
- Saved-preference precedence and invalid-value fallback.
- Mouse and keyboard switching.
- Navigation and reload persistence.
- Live system changes and cross-tab synchronization.
- Browser metadata updates.
- Dark-mode Axe checks across public routes.
- Dark CSS fallback with JavaScript disabled.
- Theme-aware standalone SVG exports.
- Existing build, source-integrity, release-isolation, accessibility, and
  JavaScript-budget gates.

Manual review covers the homepage, release narrative, explorer, cases, charts,
tables, and responsive global header in both themes.
