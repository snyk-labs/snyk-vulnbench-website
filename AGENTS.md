# AGENTS.md

Guidance for AI coding agents working in this repository. This file applies to
the whole repository unless a more specific nested `AGENTS.md` overrides it.

## Start Here

Before making changes, read the documents relevant to the task:

- `README.md` for the public project overview.
- `docs/superpowers/specs/2026-08-04-vulnbench-website-design.md` for the
  approved product, content, visual, architecture, accessibility, and delivery
  requirements.
- `docs/superpowers/specs/2026-08-04-js-1.0-source-import-design.md` before
  changing anything related to the vendored JS 1.0 source.
- `docs/superpowers/plans/2026-08-05-foundation-homepage.md` for the initial
  implementation plan and file boundaries.
- `docs/superpowers/plans/2026-08-05-phase-1-evidence-completion.md` for the
  scorecard, published evidence, and release-narrative completion plan.
- `snyk-vulnbench-js-1.0/UPSTREAM-PROVENANCE.md` for the imported research
  source revision and immutability policy.

Treat the approved design specs as the source of truth. Keep implementation and
documentation aligned with them.

## Project Context

This repository is the canonical static website for the Snyk VulnBench
benchmark initiative. The current public release is Snyk VulnBench JS 1.0,
which studies repeatability and agreement with a deterministic Snyk Code
reference set.

The implemented foundation includes:

- A statically generated Astro site and release routes.
- Strict TypeScript release contracts validated with Zod.
- React islands only where client-side interaction is needed.
- Accessible narrative pages and a lightweight recurrence visualization.
- Immutable JS 1.0 source downloads generated from the vendored snapshot.
- Vitest, Playwright, Axe, source-integrity, build, and JavaScript-budget tests.

## Repository Map

- `src/pages/` — Astro routes and static download endpoints.
- `src/layouts/` — shared document shell, metadata, and structured data.
- `src/components/site/` — global navigation, footer, wordmark, and page shell.
- `src/components/home/` — homepage narrative sections.
- `src/components/charts/` — typed interactive analytical components.
- `src/data/releases/` — release schema, manifests, selectors, and contract
  tests.
- `src/styles/` — global design tokens and shared styles.
- `public/` — static crawl, favicon, and social assets.
- `scripts/` — source-integrity and build-budget checks.
- `tests/e2e/` — route, accessibility, metadata, responsive, and no-JavaScript
  browser tests.
- `snyk-vulnbench-js-1.0/` — immutable upstream research snapshot; not
  application source.

## Architecture and Invariants

- The deployed product is fully static. Do not add a runtime API, database,
  accounts, server sessions, or required analytics.
- Astro owns routing, layouts, metadata, and narrative rendering.
- Use React only for stateful analytical islands; narrative content must remain
  useful when JavaScript fails.
- Keep TypeScript strict and validate release metadata and published evidence
  at build/test time.
- Release-specific behavior belongs behind typed release manifests rather than
  hard-coded global assumptions.
- Preserve stable release URLs and dataset versions.
- Keep narrative-page JavaScript below the 200 KB compressed budget.
- Meet WCAG 2.2 AA. Charts require exact keyboard-accessible values and an
  equivalent table.

## Scientific and Editorial Guardrails

- Describe JS 1.0 as a repeatability and Snyk-reference agreement study, not a
  universal vulnerability-detection benchmark.
- Use “Snyk-reference F1,” “reference agreement,” “reference-matched finding,”
  “unmatched finding,” and “deterministic reference reproduction.”
- Do not shorten reference agreement to “accuracy.”
- Do not call unmatched findings false positives or reference-matched findings
  true positives without independent adjudication.
- Keep metric definitions, units, denominators, dataset versions, provenance,
  and material caveats adjacent to results.
- Never imply that Snyk Code's 100% reference reproduction is universal
  accuracy or force comparisons between incompatible release protocols.

## Vendored Research Source

`snyk-vulnbench-js-1.0/` reproduces upstream commit
`7c944ea438a31ea4cbd6803f1bb9560d01f932e5` and tree
`e1490c821be5be869b91e482eb037e3f2672f432`.

- Do not edit, format, fix, or regenerate upstream files in this directory.
- Local provenance files are the only additions to the upstream snapshot.
- Run the source-integrity test after touching import or data plumbing.
- The fixture applications are intentionally vulnerable benchmark evidence.
  Never run them as services, “fix” their vulnerabilities, or treat their Snyk
  findings as defects in the website.
- Scope first-party security reviews to the website source and scripts, while
  documenting expected findings from the benchmark fixtures separately.

## Development Environment

All development commands must run inside a container based on
`node:24-trixie-slim`, with this repository mounted at `/workspace`. Do not run
`npm install`, build tools, tests, or the development server directly on the
host.

The active development convention is:

```sh
docker exec vulnbench-dev sh -lc 'npm install'
docker exec vulnbench-dev sh -lc 'npm run dev'
docker exec vulnbench-dev sh -lc 'npm run verify'
```

The development server listens on container port `4321`; publish it to
`127.0.0.1:4321` when creating the container.

## Testing and Verification

- `npm run check` — Astro and TypeScript diagnostics.
- `npm run test:unit` — release contracts, chart behavior, and source integrity.
- `npm run build` — static generation, routes, downloads, sitemap, and assets.
- `npm run check:budget` — compressed homepage JavaScript budget.
- `npm run test:e2e` — desktop/mobile routes, accessibility, metadata, and
  no-JavaScript behavior.
- `npm run verify` — required full local gate before claiming completion.

Run commands inside the development container. Add a failing test before
implementing behavior changes, then run the focused test and the proportional
full verification suite.

## Implementation Conventions

- Prefer focused components and typed data modules over large page files.
- Use semantic HTML first; add ARIA only when native semantics are insufficient.
- Reuse tokens in `src/styles/tokens.css` instead of introducing arbitrary
  colors or spacing.
- Follow the approved editorial research aesthetic: warm-neutral surfaces,
  deep ink, deliberate Snyk purple, no gradients, glass effects, decorative
  shadows, hacker imagery, or gratuitous motion.
- Preserve URL, chart/table, keyboard, and no-JavaScript behavior when changing
  interactive evidence.
- Add dependencies through npm in the container, keep `package-lock.json` in
  sync, and run dependency/security checks for new packages.

## Documentation

- Keep documentation in sync when changing behavior, public interfaces,
  workflows, architecture, configuration, or scientific assumptions.
- Put durable project details in `docs/`; keep the root README focused on public
  project discovery.
- Prefer linking to the source of truth over duplicating long requirements.

## Git and Review

- Do not modify Git configuration.
- Do not commit, push, amend, force-push, or create a pull request unless the
  user explicitly requests it.
- Preserve unrelated user changes and generated-file ignore rules.
- Before handoff, report verification evidence and any expected security or
  license findings separately from actionable defects.
