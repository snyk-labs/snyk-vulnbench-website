# Snyk Design and Light Mode Defaults

**Status:** Approved design
**Date:** 2026-08-06
**Product:** Snyk VulnBench website

## Purpose

Make the completed Snyk 2026 design the repository and deployment default.
Make Light the default color mode for visitors regardless of operating-system
preference, while preserving explicit saved Light/Dark choices.

## Design-theme resolution

`VULNBENCH_DESIGN_THEME` keeps two accepted explicit values:

- `snyk-2026` builds the Snyk 2026 design.
- `classic` builds the original Classic design.

When the variable is absent or empty, the resolver returns `snyk-2026`.
Unsupported explicit values continue to fail the build and name both accepted
values.

The temporary Vercel PR-branch build wrapper is removed. Standard
`npm run build` now produces Snyk 2026 on every platform unless the deployment
explicitly sets `VULNBENCH_DESIGN_THEME=classic`.

## Color-mode resolution

The color-mode order becomes:

1. A valid saved `light` or `dark` choice from `vulnbench-theme`.
2. Light.

`prefers-color-scheme` no longer participates in initialization or live
updates. A visitor who explicitly chooses Dark still receives Dark on reload,
navigation, and another tab. Clearing the saved value returns every open page
to Light.

The visible Light/Dark toggle and its accessible action label remain unchanged.

## No-JavaScript behavior

Without JavaScript:

- No `data-theme` attribute is emitted.
- Classic uses its Light tokens.
- Snyk 2026 uses its approved white analytical Light tokens.
- A system Dark preference does not change the rendered mode.
- Complete narrative, evidence, navigation, tables, and downloads remain
  available.

All no-theme component selectors use the Light presentation unconditionally.
System-Dark-only no-theme selectors are removed.

## Compatibility

- Explicit `VULNBENCH_DESIGN_THEME=classic` still verifies and deploys Classic.
- Explicit saved Dark still renders the approved Warm Ink Editorial mode.
- Explicit saved Light still renders the approved white analytical mode.
- URLs, datasets, scientific content, exports, accessibility, and static
  architecture remain unchanged.
- Social cards remain canonical per build and independent of visitor mode.

## Verification

Automated coverage must prove:

- absent/empty design configuration resolves to `snyk-2026`;
- explicit Classic and Snyk values still resolve correctly;
- system Light and system Dark both initialize Light when no preference exists;
- saved Dark and saved Light override the default;
- system preference changes do not alter an open page;
- clearing storage returns Light and synchronizes across tabs;
- no-JavaScript system Light and system Dark both render Light;
- standard `npm run build` emits `data-design-theme="snyk-2026"`;
- explicit Classic build emits `data-design-theme="classic"`;
- the obsolete Vercel branch wrapper/configuration is absent;
- Classic and Snyk verification, Axe, brand audit, source integrity, release
  isolation, and JavaScript budgets remain green.

## Documentation

README, agent guidance, theme specifications, and durable conventions must
state that Snyk 2026 and Light are the defaults. Documentation must distinguish
defaults from explicit overrides and must not imply that system preference
controls color mode.
