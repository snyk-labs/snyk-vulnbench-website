# Snyk 2026 Brand Theme Design

**Status:** Approved design  
**Date:** 2026-08-05  
**Product:** Snyk VulnBench website

## Purpose

Add the Snyk 2026 brand system as a deployment-selected design theme without
replacing or regressing the existing VulnBench editorial theme. A deployment
chooses one design theme at build time. Visitors continue to choose only the
Light or Dark color mode within that selected design and are never shown a
design-theme switch.

The branded design must preserve the website's static architecture, scientific
framing, evidence density, accessibility, no-JavaScript behavior, stable URLs,
chart and table parity, and JavaScript budget.

## Terminology

This design separates two independent concepts:

- **Design theme:** `classic` or `snyk-2026`, selected once at build time.
- **Color mode:** `light` or `dark`, selected by the existing visitor control,
  saved under `vulnbench-theme`, and initialized from the operating system when
  no explicit preference exists.

User-facing copy may continue to call the color-mode control a theme control
for familiarity. No user-facing control or query parameter exposes the design
theme.

## Build-time contract

The environment variable `VULNBENCH_DESIGN_THEME` selects the design:

| Value | Result |
| --- | --- |
| unset or empty | Build the existing `classic` design |
| `classic` | Build the existing `classic` design |
| `snyk-2026` | Build the Snyk 2026 design |
| any other value | Fail the build with the accepted values in the error |

The resolved value is represented by a typed `DesignTheme` union and emitted as
`data-design-theme="classic"` or `data-design-theme="snyk-2026"` on the document
root. Resolution happens during static generation. The environment variable is
not serialized as a runtime flag, and the browser receives no design-theme
switching code.

Classic remains the defensive default so existing deployments retain their
current appearance without configuration. Invalid explicit values fail instead
of silently shipping an unintended design.

## Theme architecture

Shared pages, routes, release data, scientific copy, chart implementations, and
interactive behavior remain design-independent. Components continue to consume
the semantic variables already exposed by `src/styles/tokens.css`.

The implementation adds three focused layers:

1. A typed build configuration module resolves `VULNBENCH_DESIGN_THEME`.
2. Snyk 2026 primitive tokens map onto the existing semantic token contract
   under the combined design-theme and color-mode selectors.
3. Small build-selected shell treatments render the official Snyk logo, local
   brand assets, font resources, and homepage composition only for Snyk 2026.

The existing `data-theme="light|dark"` initialization, localStorage behavior,
live operating-system updates, storage-event synchronization, and accessible
color-mode control remain unchanged in purpose. The pre-paint initializer uses
design-specific `theme-color` values but never decides the design theme.

React analytical islands do not read the build variable. They inherit active
semantic CSS values as they do today. Theme-aware SVG exports continue to
resolve computed CSS values, including the active font families and branded
series palette.

## Snyk 2026 visual system

### Locked palette and type

Snyk 2026 uses only:

- Midnight `#030328`
- Dark Purple `#2B0250`
- Purple `#6F00DD`
- Hot Pink `#FF00FF`
- Orange-Red `#F3552E`
- Amber `#FE9104`
- white and black text, including white alpha values for secondary text and
  rules

The only gradient is:

`linear-gradient(90deg, #2B0250 0%, #6F00DD 6%, #FF00FF 30%, #F3552E 66%, #FE9104 100%)`

Geist is the sans-serif face. Geist Mono is used for eyebrows, metrics, labels,
buttons, signatures, and technical annotations. Both are self-hosted from local
font files with documented redistribution terms; the site makes no runtime font
request.

Display headings are bold, tightly tracked, responsive through `clamp()`, and
limited to a readable measure. Body copy uses open leading and a measure of
approximately 45–65 characters. The design does not rely on CSS gradient text.

### Dark color mode: Family A

Snyk 2026 Dark is the default branded surface:

- Midnight is the page and canvas base.
- Headings and primary copy are white; secondary copy uses white alpha.
- Raised analytical surfaces use Midnight or restrained translucent Purple
  fills with real one-pixel borders.
- One fabric diagonal frames a page composition. The homepage uses a corner
  treatment sized to remain clear of the headline, navigation, and evidence.
- Accent gradients appear at most once in a composition.
- Decorative glow, when present in an approved local image, remains contained
  and never obscures data or copy.

### Light color mode: Family B

Snyk 2026 Light is the sanctioned full Brand-Gradient family, not a white or
warm-neutral canvas:

- The page background uses the full Brand Gradient once.
- Primary copy sits over the dark Purple region and is solid white.
- No gradient text appears on the gradient background.
- Dense explorer, chart, table, methodology, citation, and case-detail content
  sits on opaque or near-opaque Midnight panels.
- A purple-only fabric asset may appear as a restrained same-tone corner
  accent. It does not introduce a second competing gradient.
- Responsive layouts preserve a dark region behind copy rather than allowing
  white text to move onto the Amber edge.

### Brand assets and identity

The official white Snyk wordmark appears in a true shell corner with clear space
of at least one wordmark height. It is never stretched, recolored, rotated,
boxed, paired inline with another logo, or given effects.

`VulnBench` remains the product identity as ordinary Geist display text and
navigation language. It is spatially separate from the Snyk logo so the two are
not presented as an improvised lockup.

Fabric is a generated local PNG with its corner fade pre-composited into the
alpha channel. It is anchored to its named corner, remains on one diagonal
only, scales proportionally, and never uses CSS `mask-image`. It clears the
logo, primary headline, navigation, and footer.

The Classic design keeps the current VulnBench wordmark and assets unchanged.

### Favicons and social assets

Static identity assets follow the build-selected design theme rather than the
visitor's color mode:

- Classic builds keep the current favicon, default Open Graph image, and
  generated chart share cards unchanged.
- Snyk 2026 builds select a local branded favicon, branded default Open Graph
  image, and branded generated share-card palette and typography.
- Snyk 2026 social assets use a canonical Midnight or Brand-Gradient
  composition with solid white text. They do not attempt to infer the
  recipient's Light or Dark preference.
- Social assets preserve the same release title, metric context, dataset
  version, provenance, and scientific caveats as Classic assets.

The asset choice is resolved during static generation. A Classic deployment
does not publish links to the branded variants, and a branded deployment does
not rely on runtime theme state for external previews.

## Content and component treatment

The homepage receives the strongest branded composition:

- The research question remains the primary idea and stays within three lines.
- Release metadata, study framing, calls to action, evidence counts, and the
  real headline visualization remain visible in the first narrative sequence.
- The evidence visualization remains quantitative rather than becoming an
  ornamental hero image.
- The right-side evidence zone keeps a clean boundary and sufficient contrast.

Narrative pages use restrained Midnight sections, thin rules, generous spacing,
and a single corner treatment. They remain research publications rather than
campaign landing pages.

Explorer and evidence pages prioritize analytical density:

- Filters, tables, charts, tooltips, dialogs, and comparison trays use opaque
  surfaces and real borders.
- No glass coating is applied.
- No decorative graphic is placed behind data marks, labels, controls, or
  source notes.
- Existing responsive three-column, two-column, and one-column behavior remains
  unchanged.

Cards use real per-edge border properties. The implementation does not use
pseudo-element mask composition, `mask-image`, `-webkit-background-clip: text`,
or radial-gradient helper elements that can bleed in restricted webviews.

## Evidence color semantics

The branded palette replaces the Classic theme's teal, coral, and off-palette
series colors only inside Snyk 2026:

- Reference-matched evidence uses Purple or Hot Pink with an adjacent text label
  and existing shape/pattern encoding.
- Unmatched evidence uses Orange-Red with an adjacent text label and existing
  shape/pattern encoding.
- Warnings and caveats use Amber with explicit warning text.
- Configuration series use Purple, Hot Pink, Orange-Red, Amber, Dark Purple,
  and white. The existing marker shapes, line styles, labels, and equivalent
  tables remain mandatory because color is never the only encoding.
- Heatmaps use discrete brand-color and opacity steps with exact values printed
  or available through the equivalent table. Missing, zero, and not-applicable
  states remain distinct.

Every use must pass WCAG 2.2 AA against its actual surface. A palette assignment
that fails contrast must be moved to a darker surface or use white text; no
off-palette substitute may be introduced.

## Accessibility and resilience

Both design themes and both color modes preserve:

- semantic landmarks, headings, links, controls, and tables
- visible keyboard focus
- keyboard-operable charts and exact-value equivalents
- color-independent evidence encodings
- 200% and 400% zoom and a 320-pixel viewport
- reduced-motion behavior
- no-JavaScript access to the complete narrative and static evidence
- system Light/Dark fallback when JavaScript is unavailable

The Snyk 2026 design introduces no required animation. Fabric and logo assets
are decorative where appropriate and do not add redundant screen-reader
content.

## Performance and delivery

The site remains fully static. No runtime API, database, account, cookie,
analytics dependency, or server session is added.

Classic deployments do not request branded font or fabric assets. Snyk 2026
assets are optimized, immutable, and locally served. The narrative JavaScript
budget remains below 200 KB compressed, and the feature adds no design-theme
client bundle.

The branded design must build without a network connection after dependencies
and approved assets are present.

## Verification

Automated verification covers:

- build configuration parsing, defaulting, and invalid-value failure
- Classic Light and Dark regression behavior
- Snyk 2026 Light and Dark initialization
- saved color-mode precedence, reload persistence, keyboard activation, live
  system changes, and cross-tab synchronization in the branded design
- design-specific `theme-color` metadata
- Snyk 2026 no-JavaScript color-mode fallback and usable content
- computed Geist and Geist Mono typography
- locked palette and forbidden CSS constructs
- logo placement and local asset loading
- chart and SVG export colors, surfaces, and font families
- Axe checks on public routes in both branded color modes
- mobile, tablet, desktop, and wide explorer layouts
- build, release isolation, source integrity, and JavaScript budgets

The branded browser suite runs from a separate Playwright configuration that
starts Astro with `VULNBENCH_DESIGN_THEME=snyk-2026`. The default suite
continues to exercise Classic.

Manual visual verification renders and reads back at least:

- homepage at desktop and mobile widths in both branded color modes
- release overview and a dense evidence section
- explorer summary and coverage views
- mobile navigation, filters, and comparison sheet

The review checks fabric anchoring and size, one-diagonal placement, logo
clearance, headline wrapping, data legibility, contrast, overflow, and
composition against the closest canonical Snyk 2026 reference.

The Snyk brand audit is a release gate. Any locked-palette, type, logo, gradient,
fabric, overlap, contrast, or forbidden-CSS failure blocks the branded theme
until corrected.

## Documentation and rollout

The README documents the optional build variable and keeps Classic as the
unconfigured behavior. Contributor documentation records the local branded
verification command and asset provenance. `AGENTS.md`, `CLAUDE.md`, and
`docs/CONVENTIONS.md` explicitly scope the existing warm-neutral and
no-gradient rules to Classic and identify this specification as the governing
visual source for Snyk 2026. The original dark-mode design remains the source of
truth for Classic; this design supersedes its visual rules only when
`data-design-theme="snyk-2026"`.

Example deployment commands:

```sh
# Existing design
npm run build

# Explicit existing design
VULNBENCH_DESIGN_THEME=classic npm run build

# Snyk 2026 design
VULNBENCH_DESIGN_THEME=snyk-2026 npm run build
```

All development and verification commands run inside the repository's
`node:24-trixie-slim` development container.

## Approval gate

The implementation and pull request are internal work in progress. Before an
externally published Snyk 2026 deployment goes live, the owner must submit the
asset for brand review through a Jira ticket labeled `brand-review` and
`design-asset` and a draft post to `#ask-brand-design`. Publication requires
both a complete brand-audit pass and status `brand-approved`.
