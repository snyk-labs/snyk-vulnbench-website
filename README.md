# Snyk VulnBench Website

This repository contains the interactive static website for the Snyk VulnBench benchmark initiative. The website will centralize published VulnBench releases, research insights, methodology, benchmark data, and interactive comparisons.

The initial release will showcase [Snyk VulnBench JS 1.0](https://snyk.io/blog/snyk-vulnbench-js-1-0-llm-security-review-repeatability/) and provide a foundation for VulnBench 2.0 and later iterations.

## Project status

The Phase 1 static research narrative, Phase 2 configurable benchmark explorer,
and Phase 3 finding/project evidence depth are implemented. Phase 4 validates
the release system with a non-public synthetic second release fixture.

## Project documentation

- [Product requirements and design](docs/superpowers/specs/2026-08-04-vulnbench-website-design.md)
- [Dark mode theme design](docs/superpowers/specs/2026-08-05-dark-mode-theme-design.md)
- [Snyk 2026 brand design](docs/superpowers/specs/2026-08-05-snyk-2026-brand-theme-design.md)
- [Snyk and Light defaults design](docs/superpowers/specs/2026-08-06-snyk-light-defaults-design.md)
- [Coding-agent and development guidance](AGENTS.md)
- [Published VulnBench JS 1.0 paper](https://arxiv.org/abs/2606.15762)

## Design deployment

`VULNBENCH_DESIGN_THEME` accepts `classic` and `snyk-2026`. Absent or empty
defaults to `snyk-2026`. Invalid explicit values fail the build. A deployment
chooses the design at build time. With no saved choice, Light is the color-mode
default regardless of system preference. Saved Light or Dark choices remain
explicit overrides. No-JavaScript rendering is also Light regardless of system
preference.

Run the default Snyk build and full verification, or the deterministic Classic
override, in `vulnbench-dev`:

```sh
# Snyk 2026 and Light defaults
docker exec vulnbench-dev sh -lc 'npm run build'
docker exec vulnbench-dev sh -lc 'npm run verify'
docker exec vulnbench-dev sh -lc 'npm run verify:snyk-2026'

# Explicit Classic override
docker exec vulnbench-dev sh -lc 'VULNBENCH_DESIGN_THEME=classic npm run build'
docker exec vulnbench-dev sh -lc 'VULNBENCH_DESIGN_THEME=classic npm run verify:classic'
```

## License

Licensed under the [Apache License 2.0](LICENSE).
