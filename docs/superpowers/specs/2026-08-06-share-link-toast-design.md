# Share-link Confirmation Toast

**Status:** Approved design
**Date:** 2026-08-06
**Product:** Snyk VulnBench explorer

## Goal

Make share-link feedback compact, readable, and non-blocking without changing
the existing clipboard behavior or the separate invalid-URL diagnostic.

## Behavior

- Successful copies announce the concise message `Share link copied.`.
- Clipboard fallback continues to expose the generated URL in the notice.
- The notice uses `role="status"` and auto-dismisses after a short delay.
- The notice does not change explorer layout or prevent interaction with the
  page.

## Visual treatment

- Render the notice as a fixed lower-right toast.
- Cap its width to `24rem` and the viewport width minus `2rem`.
- Keep it compact with the existing semantic theme tokens, a clear border, and
  a small status accent.
- Allow long fallback URLs to wrap within the capped toast.
- Respect safe-area insets on narrow devices.

## Scope and testing

Only the explorer share notice and its tests change. The header's
`explorer-header__notice` remains a full-width diagnostic for ignored URL
parameters. Unit coverage verifies the status announcement and browser
coverage verifies the toast is fixed, compact, and positioned near the
lower-right viewport edge.
