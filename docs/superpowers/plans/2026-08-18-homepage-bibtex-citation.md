# Homepage BibTeX Citation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's prose citation with a tested, selectable arXiv-compatible BibTeX entry and an accessible **Copy BibTeX** enhancement.

**Architecture:** A pure formatter in `src/data/releases/` will derive the BibTeX entry from the typed release metadata. `PublicationBlock.astro` will server-render the entry and button, while a small Astro script progressively enhances the button with `navigator.clipboard`; the visible `<pre><code>` remains the no-JavaScript fallback.

**Tech Stack:** Astro 7, strict TypeScript, Vitest, Playwright, existing release schema and homepage component patterns.

## Global Constraints

- The deployed product remains fully static; no runtime API, database, account, session, or required analytics is added.
- The citation formatter consumes existing release metadata and does not create a second source of truth.
- BibTeX is the only visible citation style for this homepage change.
- The copy button is optional enhancement; the visible citation remains manually selectable and available without JavaScript.
- Run all development commands from the repository root.
- Do not modify the vendored `snyk-vulnbench-js-1.0/` snapshot.
- Do not commit changes unless the user explicitly requests a commit.

---

### Task 1: Add and test the BibTeX formatter

**Files:**
- Create: `src/data/releases/citation.ts`
- Create: `src/data/releases/citation.test.ts`

**Interfaces:**
- Consumes: `Pick<Release, "id" | "citation">` from `src/data/releases/schema.ts`.
- Produces: `formatBibtexCitation(release): string`, returning a complete BibTeX entry without a trailing newline.

- [x] **Step 1: Write the failing formatter tests**

Create `src/data/releases/citation.test.ts` with an exact JS 1.0 expectation:

```ts
import { describe, expect, it } from "vitest";
import { js10Release } from "./js-1.0";
import { formatBibtexCitation } from "./citation";

describe("formatBibtexCitation", () => {
  it("formats JS 1.0 as an importable arXiv BibTeX entry", () => {
    expect(formatBibtexCitation(js10Release)).toBe(`@misc{tal2026snykvulnbenchjs10,
  author = {Tal, Liran and Kloos, Johannes and Rudich, Arsenii and Thoemmes, Stephen and Nair, Manoj},
  title = {Snyk VulnBench JS 1.0: Can LLMs Find the Same Bugs Twice?},
  year = {2026},
  url = {https://arxiv.org/abs/2606.15762}
}`);
  });

  it("orders multi-word names and escapes BibTeX-sensitive values", () => {
    const result = formatBibtexCitation({
      id: "example-1.0",
      citation: {
        authors: ["Ada Lovelace"],
        title: "A {study} with a \\ check",
        year: 2026,
        url: "https://example.test/paper",
      },
    });

    expect(result).toContain("author = {Lovelace, Ada}");
    expect(result).toContain("title = {A \\{study\\} with a \\\\ check}");
    expect(result).toContain("@misc{lovelace2026example10,");
  });
});
```

- [x] **Step 2: Run the focused test and verify it fails for the missing formatter**

Run:

```sh
npm run test:unit -- src/data/releases/citation.test.ts
```

Expected: Vitest fails because `src/data/releases/citation.ts` and
`formatBibtexCitation` do not exist yet.

- [x] **Step 3: Implement the minimal formatter**

Create `src/data/releases/citation.ts`:

```ts
import type { Release } from "./schema";

type CitationRelease = Pick<Release, "id" | "citation">;

const escapeBibtexValue = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}");

const formatAuthor = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return escapeBibtexValue(name.trim());

  const surname = parts.pop();
  return `${escapeBibtexValue(surname ?? "")}, ${escapeBibtexValue(parts.join(" "))}`;
};

const citationKey = ({ id, citation }: CitationRelease) => {
  const surname =
    citation.authors[0]
      ?.trim()
      .split(/\s+/)
      .at(-1)
      ?.replace(/[^A-Za-z0-9]/g, "")
      .toLowerCase() || "vulnbench";
  const releaseId = id.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
  return `${surname}${citation.year}${releaseId}`;
};

export function formatBibtexCitation({
  id,
  citation,
}: CitationRelease): string {
  const authors = citation.authors.map(formatAuthor).join(" and ");

  return [
    `@misc{${citationKey({ id, citation })},`,
    `  author = {${authors}},`,
    `  title = {${escapeBibtexValue(citation.title)}},`,
    `  year = {${citation.year}},`,
    `  url = {${escapeBibtexValue(citation.url)}}`,
    "}",
  ].join("\n");
}
```

- [x] **Step 4: Run the formatter tests and verify they pass**

Run the same focused Vitest command. Expected: both formatter tests pass with
zero failures.

### Task 2: Render the citation block and add the copy enhancement

**Files:**
- Modify: `src/components/home/PublicationBlock.astro`
- Modify: `tests/e2e/homepage.spec.ts`

**Interfaces:**
- Consumes: `formatBibtexCitation(currentRelease)` from Task 1.
- Produces: a server-rendered `[data-bibtex-citation]` code block, a button named
  **Copy BibTeX**, and an `aria-live` status element that reports copy success
  or fallback guidance.

- [x] **Step 1: Add failing homepage assertions**

Extend `expectHomepageEvidence` in `tests/e2e/homepage.spec.ts`:

```ts
  const citation = page.locator("[data-bibtex-citation]");
  await expect(citation).toContainText("@misc{tal2026snykvulnbenchjs10,");
  await expect(citation).toContainText(
    "author = {Tal, Liran and Kloos, Johannes and Rudich, Arsenii and Thoemmes, Stephen and Nair, Manoj}",
  );
  await expect(
    page.getByRole("button", { name: "Copy BibTeX" }),
  ).toBeVisible();
```

Add a browser interaction test:

```ts
test("copies the homepage BibTeX citation", async ({ page }) => {
  await page.goto("/");
  const origin = new URL(page.url()).origin;
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin,
  });

  await page.getByRole("button", { name: "Copy BibTeX" }).click();
  await expect(page.locator("[data-citation-status]")).toHaveText("Copied");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("@misc{tal2026snykvulnbenchjs10,");
});
```

Extend the no-JavaScript test after `expectHomepageEvidence(page)`:

```ts
  await expect(page.locator("[data-bibtex-citation]")).toContainText(
    "@misc{tal2026snykvulnbenchjs10,",
  );
```

- [x] **Step 2: Run the focused homepage tests and verify the new assertions fail**

Run:

```sh
npm run test:e2e -- tests/e2e/homepage.spec.ts
```

Expected: existing homepage assertions pass, while the new citation assertions
fail because the current block has no BibTeX marker or copy button.

- [x] **Step 3: Replace the homepage prose citation with server-rendered BibTeX**

In `src/components/home/PublicationBlock.astro`, import
`formatBibtexCitation`, define:

```astro
const citation = formatBibtexCitation(currentRelease);
```

Replace the existing `<blockquote>` with:

```astro
<div class="citation-source" data-bibtex-citation>
  <pre><code>{citation}</code></pre>
  <div class="citation-actions">
    <button class="button secondary" type="button" data-copy-bibtex>
      Copy BibTeX
    </button>
    <span data-citation-status aria-live="polite"></span>
  </div>
</div>
```

Keep the author summary below the source block. Update the component styles so
the source uses `white-space: pre-wrap`, `overflow-wrap: anywhere`, and the
existing monospace token; keep the button/status row aligned and usable at
mobile widths.

- [x] **Step 4: Add the progressive-enhancement copy script**

Add an Astro `<script>` in `PublicationBlock.astro` that finds each
`[data-copy-bibtex]` button, reads the sibling `code` text from its nearest
`[data-bibtex-citation]` block, and:

1. Writes the exact text with `navigator.clipboard.writeText`.
2. Sets the matching `[data-citation-status]` text to `Copied` on success.
3. Sets it to `Select and copy the BibTeX entry manually.` when the Clipboard API
   is unavailable or rejects the write.

The script must not hide or replace the visible code block and must not add
analytics.

- [x] **Step 5: Run the homepage tests and verify the copy behavior**

Run the focused Playwright command again. Expected: the visible BibTeX entry,
button, clipboard result, success status, and no-JavaScript source assertions
all pass.

### Task 3: Run proportional repository verification

**Files:**
- No additional files; verify the changes from Tasks 1 and 2.

- [x] **Step 1: Run unit tests** — Completed with the known baseline font-resolution failure: 352 tests passed, while `default-social-route.test.ts` and `light-default-social-route.test.ts` cannot load the Geist font from the repository's `node_modules` directory.

Run:

```sh
npm run test:unit
```

Expected: all unit tests pass, including release contract and citation tests.

- [x] **Step 2: Run Astro diagnostics**

Run:

```sh
npm run check
```

Expected: Astro and TypeScript diagnostics finish with zero errors.

- [x] **Step 3: Run the static build**

Run:

```sh
npm run build
```

Expected: the default Snyk 2026 static build completes successfully and the
generated homepage contains the server-rendered citation block.

- [x] **Step 4: Run the JavaScript budget check**

Run:

```sh
npm run check:budget
```

Expected: the homepage remains under the existing compressed JavaScript budget.

- [x] **Step 5: Run the full verification gate** — Completed with the same known baseline font-resolution failure during the Classic unit-test phase; `verify` therefore did not reach the Snyk 2026 phase.

Run:

```sh
npm run verify
```

Expected: Classic and Snyk 2026 verification complete with zero failures.

- [x] **Step 6: Inspect the final diff and worktree**

Run:

```sh
git diff --check && git status --short
```

Expected: no whitespace errors; only the citation formatter, homepage block,
homepage tests, and the already-approved design/plan documents are changed.

## Self-review

- The spec's formatter, exact JS 1.0 output, author ordering, key generation,
  escaping, visible source, copy button, accessible feedback, mobile wrapping,
  no-JavaScript fallback, unit coverage, browser coverage, build, budget, and
  full verification requirements each have an explicit task.
- No placeholders or unresolved file paths remain.
- Task 1's `formatBibtexCitation` signature matches Task 2's import and call.
- The copy script is an enhancement only; the static source is emitted before
  any client code runs.
- No new dependency, route, API, metadata contract, or vendored-source change
  is introduced.
