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
