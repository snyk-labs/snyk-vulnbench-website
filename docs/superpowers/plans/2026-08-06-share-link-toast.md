# Share-link Confirmation Toast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the explorer's full-width share confirmation with a compact,
accessible lower-right toast.

**Architecture:** Keep share state and clipboard fallback in `ExplorerApp`.
Render the existing status paragraph outside the header flow and style only
that paragraph as a fixed, viewport-capped toast. Preserve the header's
invalid-parameter notice and all URL-generation behavior.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Playwright, CSS
custom properties.

## Global Constraints

- Keep the deployment fully static; do not add a runtime service or dependency.
- Preserve deterministic explorer URLs and clipboard fallback behavior.
- Keep the notice accessible with `role="status"`.
- Use semantic theme tokens and avoid broad page-level layout changes.
- Run npm, Astro, Vitest, and Playwright commands inside `vulnbench-dev`.
- Do not commit or push unless explicitly requested.

---

### Task 1: Add failing share-toast regression coverage

**Files:**
- Modify: `src/components/explorer/ExplorerApp.test.tsx`
- Modify: `tests/e2e/explorer.spec.ts`

**Interfaces:**
- Consumes the existing `ExplorerApp` share action and
  `.explorer-app__share-status` status element.
- Produces assertions for the accessible status and compact lower-right
  viewport geometry.

- [ ] **Step 1: Extend the unit test**

After clicking `Copy share link`, await the status element and assert it has
the share-status class and concise success text:

```tsx
const status = await screen.findByRole("status", {
  name: "Share link copied.",
});
expect(status).toHaveClass("explorer-app__share-status");
```

- [ ] **Step 2: Add browser geometry coverage**

Add a Playwright test at a desktop viewport that clicks the share button,
waits for the status element, and evaluates its computed position and bounds:

```ts
const toast = page.getByRole("status", { name: /Share link copied|Copy this URL/ });
const geometry = await toast.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return {
    position: style.position,
    width: rect.width,
    right: window.innerWidth - rect.right,
    bottom: window.innerHeight - rect.bottom,
  };
});
expect(geometry.position).toBe("fixed");
expect(geometry.width).toBeLessThan(400);
expect(geometry.right).toBeGreaterThan(15);
expect(geometry.right).toBeLessThan(40);
expect(geometry.bottom).toBeGreaterThan(15);
expect(geometry.bottom).toBeLessThan(40);
```

- [ ] **Step 3: Run the focused tests and confirm RED**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npx vitest run src/components/explorer/ExplorerApp.test.tsx'
docker exec vulnbench-dev sh -lc 'npx playwright test tests/e2e/explorer.spec.ts -g "share confirmation"'
```

Expected: the unit assertion may pass for the existing status semantics, but
the browser geometry test fails because the current status is an in-flow,
full-width block.

### Task 2: Implement the compact toast

**Files:**
- Modify: `src/components/explorer/ExplorerApp.tsx:137-143,267-280,608-612,831-838`

**Interfaces:**
- Consumes the existing `shareMessage` state and clipboard promise.
- Produces the same status message contract with timed dismissal and bounded
  fixed positioning.

- [ ] **Step 1: Add automatic dismissal**

Add an effect keyed by `shareMessage` that schedules
`setShareMessage("")` after 4 seconds and clears the timeout on replacement or
unmount:

```tsx
useEffect(() => {
  if (!shareMessage) return;
  const timeout = window.setTimeout(() => setShareMessage(""), 4000);
  return () => window.clearTimeout(timeout);
}, [shareMessage]);
```

- [ ] **Step 2: Render the status as an independent toast**

Keep the status after `ExplorerHeader` so it is announced independently, but
give it no layout role beyond its fixed positioning:

```tsx
{shareMessage && (
  <p className="explorer-app__share-status" role="status">
    {shareMessage}
  </p>
)}
```

- [ ] **Step 3: Replace shared warning styling**

Remove `.explorer-app__share-status` from the header-warning selector and add a
dedicated rule:

```css
.explorer-app__share-status {
  position: fixed;
  z-index: 90;
  right: max(var(--space-4), env(safe-area-inset-right));
  bottom: max(var(--space-4), env(safe-area-inset-bottom));
  width: min(24rem, calc(100vw - 2rem));
  padding: 0.7rem 1rem;
  margin: 0;
  border: 1px solid var(--rule-strong);
  border-inline-start: 0.25rem solid var(--matched);
  border-radius: var(--radius);
  background: var(--paper-raised);
  color: var(--ink);
  font-size: var(--step--1);
  overflow-wrap: anywhere;
}
```

- [ ] **Step 4: Run the focused tests and confirm GREEN**

Run the unit and browser tests from Task 1. Expected: both pass, including
the compact lower-right geometry assertions.

### Task 3: Run proportional verification

**Files:**
- Verify all modified explorer source, test, and documentation files.

- [ ] **Step 1: Run explorer unit coverage**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npx vitest run src/components/explorer/ExplorerApp.test.tsx'
```

- [ ] **Step 2: Run explorer browser coverage**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npx playwright test tests/e2e/explorer.spec.ts'
```

- [ ] **Step 3: Run diagnostics**

Run:

```sh
docker exec vulnbench-dev sh -lc 'npm run check'
```

- [ ] **Step 4: Inspect the final diff**

Run:

```sh
git diff --check
git status --short
```

Confirm only the share-toast implementation, its focused tests, and the
approved design/plan documents are included in this task's changes. Do not
commit or push.
