# Explorer Adaptive Three-Column Layout Design

**Status:** Approved  
**Date:** 2026-08-05  
**Applies to:** `/releases/js-1.0/explore`

## Goal

Keep analytical charts and tables readable on wide desktop displays by capping
the center canvas, while using the additional horizontal space for contextual
research guidance rather than stretching data graphics.

## Approved direction

Use an adaptive three-column explorer:

1. Left: filters and view controls.
2. Center: scorecards, charts, tables, and explorer states.
3. Right: a view-specific research guide.

The complete workbench is centered within generous outer page gutters. The
center canvas remains aligned across scorecards, charts, tables, notes, and
exports.

## Wide desktop layout

At viewport widths of at least `90rem`:

- Workbench maximum width: `98rem`.
- Left filter rail: `17rem`.
- Center analysis canvas: `minmax(0, 62rem)`.
- Right research guide: `16rem`.
- Column gaps: `1.25rem`.
- The centered workbench receives any remaining viewport width as equal outer
  gutters.

The center column must not grow beyond its cap. Wide scorecards and matrices
continue to use local horizontal scrolling rather than widening the page.

## Standard desktop and tablet layout

From `64rem` through `89.99rem`:

- Use the existing two-column filter + analysis layout.
- Center the combined layout and cap the analysis canvas.
- Hide the persistent right guide.
- Preserve its essential content in the existing view heading, captions, and
  caveats; do not create an empty placeholder column.

Below `64rem`:

- Keep the mobile filter and comparison dialogs.
- Use one analysis column.
- Do not render the persistent right rail.

## Right research guide

The right rail is sticky within the viewport and contains useful information
from the first release:

- **How to read this view** — view-specific interpretation such as
  “upper-left means higher agreement and lower variance.”
- **Active context** — release, dataset version, active metric, aggregation,
  represented runs, and active filter count.
- **Keep in mind** — the most material scientific caveat for the active view.
- **Go deeper** — links to methodology, data, and representative cases.

Content changes with Summary, Repeatability, Coverage, and Efficiency. It must
use the same explorer state as the persistent header and must not introduce a
second source of truth.

Future Snyk product context may use a dedicated slot only when it is relevant,
restrained, clearly labeled, and does not displace evidence or caveats. Do not
ship an empty promotional card.

## Accessibility and behavior

- The guide uses an `<aside aria-label="View guide">`.
- Heading order remains logical after the center content.
- Sticky positioning must not cover the footer or trap keyboard focus.
- Links retain 24×24 CSS-pixel minimum targets.
- At 200% and 400% zoom the guide collapses before it causes horizontal page
  overflow.
- The no-JavaScript static explorer remains readable.

## Testing

Add browser coverage for:

- A wide Chrome viewport showing all three columns.
- A standard desktop viewport showing two columns.
- Mobile showing no persistent guide and no page-level horizontal overflow.
- Center canvas width remaining capped on very wide displays.
- Right-guide content updating when the active explorer view changes.
- Axe coverage and keyboard access for all guide links.

