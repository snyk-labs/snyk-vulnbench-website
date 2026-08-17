# Homepage BibTeX Citation

**Status:** Approved design
**Date:** 2026-08-17
**Scope:** Homepage publication block

## Problem

The homepage currently presents the preferred citation as prose with typographic
quotes. Researchers can select it manually, but it is not a directly importable
academic citation entry and does not provide a copy action.

The site already exposes citation metadata and `ScholarlyArticle` structured data.
This change improves the researcher-facing copy/paste path without implying that
BibTeX formatting itself controls Google Scholar indexing.

## Goals

- Render a canonical arXiv-compatible BibTeX `@misc` entry for the current
  release.
- Provide a visible **Copy BibTeX** button.
- Keep the BibTeX source visible and manually selectable.
- Preserve complete functionality without JavaScript.
- Generate the entry from typed release metadata rather than duplicating
  publication details in the homepage component.
- Keep the citation block usable at narrow mobile widths.

## Non-goals

- Adding APA, MLA, or other citation styles.
- Changing the paper, release, or dataset metadata contracts.
- Adding analytics or a runtime service.
- Changing the existing citation metadata or structured data behavior.
- Guaranteeing Google Scholar indexing or ranking behavior.

## Design

Add a small tested formatter under `src/data/releases/` that accepts the release
identifier and existing citation fields. It will:

1. Derive a stable BibTeX key from the first author's surname, citation year, and
   release identifier.
2. Render authors in BibTeX's `Last, First and ...` form.
3. Escape BibTeX-sensitive characters in generated values.
4. Emit an `@misc` entry with `author`, `title`, `year`, and canonical `url`
   fields.

The homepage publication block will render the formatter output in
`<pre><code>` and place a button alongside it. The button will use a small
progressive-enhancement script to write the exact rendered entry to
`navigator.clipboard`, then temporarily announce **Copied**. If clipboard
access is unavailable, the visible code block remains the fallback. The button
will have an explicit accessible name and status text.

The existing release citation metadata, canonical URL, and structured data stay
unchanged. The About page is outside this focused homepage request and will
retain its current human-readable guidance.

## Testing

- Unit test the formatter's exact JS 1.0 output, author ordering, stable key,
  and escaping behavior.
- Extend the homepage browser test to assert the visible BibTeX entry and
  accessible copy button.
- Exercise the no-JavaScript homepage path to confirm the BibTeX source remains
  available even when the button enhancement is absent.
- Run focused unit and browser tests, then the repository's proportional
  diagnostics/build verification.

## Self-review

- No placeholders or unresolved decisions remain.
- The copy action is an enhancement, not a dependency; no-JavaScript behavior
  remains complete.
- The formatter consumes existing typed metadata and does not introduce a
  second source of truth.
- The scope is limited to the homepage publication block and its tests.
