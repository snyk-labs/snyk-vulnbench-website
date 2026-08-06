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
- [Coding-agent and development guidance](AGENTS.md)
- [Published VulnBench JS 1.0 paper](https://arxiv.org/abs/2606.15762)

## Design deployment

`VULNBENCH_DESIGN_THEME` accepts `classic` and `snyk-2026`. Absent or empty
defaults to `classic`. Invalid explicit values fail the build. A deployment
chooses the design at build time. Visitors control only the Light or Dark color
mode within the selected design.

Run either build and its matching verification gate in `vulnbench-dev`:

```sh
# Classic (default)
docker exec vulnbench-dev sh -lc 'npm run build'
docker exec vulnbench-dev sh -lc 'npm run verify:classic'

# Snyk 2026
docker exec vulnbench-dev sh -lc 'npm run build:snyk-2026'
docker exec vulnbench-dev sh -lc 'npm run verify:snyk-2026'
```

## License

Licensed under the [Apache License 2.0](LICENSE).
