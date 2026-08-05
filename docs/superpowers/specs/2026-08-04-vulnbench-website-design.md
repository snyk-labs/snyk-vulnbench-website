# VulnBench Interactive Benchmark Website — Product Requirements and Design

**Status:** Approved design  
**Date:** 2026-08-04  
**Product:** Snyk VulnBench benchmark initiative website  
**Likely public domain:** `vulnbench.com`  
**Initial published release:** Snyk VulnBench JS 1.0  
**Next planned release:** Snyk VulnBench 2.0

## 1. Executive summary

Build a fast, accessible, interactive static website that serves as the canonical home for the Snyk VulnBench initiative. The site will centralize every public VulnBench release, publication, result, methodology, case, and downloadable dataset.

The primary product job is to help security practitioners compare model and tool behavior for vulnerability-finding tasks under the constraints that matter to them. The site must also:

- Establish VulnBench as a credible, durable Snyk research initiative.
- Let researchers independently explore the evidence and find comparisons beyond the published narrative.
- Make releases, charts, findings, and citations easy to share.
- Preserve precise scientific framing and prevent metrics from being interpreted as claims they do not support.
- Accommodate VulnBench 2.0 and later releases without rewriting or weakening the JS 1.0 experience.

The product combines two reference patterns:

- ReactBench's compact, editorial, evidence-led presentation and direct score-versus-resource comparisons.
- Martian Code Review Bench's configurable filters, comparison controls, trends, shareable state, and researcher-oriented depth.

The result should feel like a research publication and an analytical instrument, not a marketing landing page or a generic business dashboard.

## 2. Product boundary and positioning

### 2.1 What the website is

The canonical public hub for the Snyk VulnBench benchmark initiative:

- One initiative spanning versioned benchmark releases.
- One stable location for release narratives, interactive results, methods, cases, datasets, papers, blog posts, and citations.
- A reusable release system that can express differences between JS 1.0, 2.0, and later protocols.
- A thought-leadership surface that demonstrates Snyk's research rigor through transparent evidence.

### 2.2 What the website is not

- It is not the central home for all Snyk AI security research.
- It is not a general Snyk research portal.
- It is not a universal leaderboard for the "best" security model.
- It is not a live scanner, model runner, or benchmark execution service.
- It is not a claim that Snyk Code's JS 1.0 reference set represents exhaustive vulnerability ground truth.
- It is not a system that forces comparisons between incompatible releases.

### 2.3 Product promise

> Explore how reliably AI systems find vulnerabilities—and inspect the evidence behind every conclusion.

### 2.4 Initial release framing

Snyk VulnBench JS 1.0 asks:

> Can LLMs find the same bugs twice?

JS 1.0 is a repeatability and agreement study. It compares repeated agentic LLM security reviews against a deterministic Snyk Code reference set. It must not be described as a universal vulnerability-detection accuracy benchmark.

## 3. Goals and success criteria

### 3.1 Primary goal

Help a practitioner make an evidence-informed comparison between model configurations across repeatability, reference agreement, coverage, efficiency, and operational noise.

### 3.2 Secondary goals

- Communicate the release's research question and central finding within the first viewport and first minute.
- Establish Snyk VulnBench as a transparent, versioned benchmark initiative.
- Support independent analysis through filters, case inspection, chart-level exports, and downloadable data.
- Make filtered views reproducible and shareable.
- Make the publication easy to cite correctly.
- Provide a stable foundation for 2.0 and later releases.

### 3.3 Qualitative success criteria

- A first-time visitor can accurately state the JS 1.0 research question and central result after viewing the homepage.
- A practitioner can compare selected configurations across repeatability, coverage, and efficiency.
- A researcher can find metric definitions, sample sizes, caveats, cases, and downloadable source data without leaving the site.
- A shared explorer URL restores the same release, filters, view, metric, and pinned comparisons.
- A researcher can reconstruct a published chart from the downloadable data and metric documentation.
- A second release can be added through release metadata, content, and data assets without restructuring JS 1.0.

### 3.4 Measurable product signals

If privacy-approved analytics are enabled, measure:

- Homepage-to-explorer conversion.
- Filter, metric-toggle, and comparison-pin usage.
- Successful share-link creation and restoration.
- Paper, blog, methodology, GitHub, and data-download clicks.
- Citation-copy actions.
- Case-detail opens.
- Empty-state and invalid-share-state frequency.
- Client-side errors and static asset load failures.

Analytics must not be required for any product capability.

## 4. Audiences and user needs

### 4.1 Security practitioners and engineering leaders

Need to understand:

- Which configurations are more repeatable.
- Which configurations align more closely with the reference set.
- Where models and deterministic SAST have different strengths.
- Whether higher cost, token usage, or duration produces better measured outcomes.
- How findings vary by project and vulnerability class.

### 4.2 Security and AI researchers

Need to:

- Inspect definitions, denominators, normalization, and aggregation.
- Filter and compare configurations, projects, vulnerability classes, and finding types.
- Inspect recurrence across repeated runs.
- Download chart-level and release-level data.
- Cite a stable release and dataset version.
- Understand limitations and incompatible cross-release metrics.

### 4.3 Developers and technical decision-makers

Need:

- A plain-language summary before deep analysis.
- Practical implications for security workflows.
- Representative cases showing complementarity, missed patterns, false-positive-shaped reports, and likely product gaps.
- Clear separation between reference agreement and real-world accuracy.

### 4.4 Media, analysts, and the wider developer community

Need:

- A defensible headline finding.
- Shareable charts with context and source metadata.
- Stable canonical URLs.
- Publication, author, and citation information.

## 5. Product principles

1. **Evidence before ranking.** Lead with the research question and measured behavior, not a winner.
2. **Precise language.** "Snyk-reference F1" and "reference agreement" must never be shortened to "accuracy."
3. **Narrative plus instrument.** Explain the result, then let visitors test and inspect it.
4. **Every value has provenance.** A chart value must trace to release, dataset version, filters, metric definition, aggregation, and sample size.
5. **Version boundaries are explicit.** Incompatible protocols must not produce false cross-release comparisons.
6. **Static and durable.** Published releases must remain available without a runtime API or database.
7. **Accessible by default.** Every chart has keyboard access, textual explanation, and equivalent tabular data.
8. **No hidden caveats.** Critical limitations and metric definitions sit adjacent to the relevant result.
9. **Inspectability over spectacle.** Visual design supports reading and analysis rather than decorative motion.
10. **Immutable releases, documented corrections.** Historical public results are not silently rewritten.

## 6. Information architecture

### 6.1 Global routes

- `/` — VulnBench initiative homepage.
- `/releases` — release catalog and version history.
- `/about` — initiative principles, team, release/version policy, and citation guidance.
- `/methodology` — initiative-level methodology principles and links to release-specific methods.
- `/data` — dataset catalog linking to each release's data page and downloads.

### 6.2 Release routes

Use a stable, descriptive release slug. JS 1.0 uses `js-1.0`.

- `/releases/js-1.0` — canonical release overview.
- `/releases/js-1.0/explore` — full interactive analysis workbench.
- `/releases/js-1.0/cases` — benchmark projects/cases and finding-level evidence.
- `/releases/js-1.0/methodology` — release-specific design, harness, scoring, limitations, and reproducibility.
- `/releases/js-1.0/data` — data dictionary, schema, provenance, version, and downloads.

Later releases reuse the same route contract. A release may omit a view only when its public dataset cannot support it; the release manifest must declare available capabilities.

### 6.3 Global navigation

Keep the primary navigation sparse:

- Overview
- Releases
- Explore
- Methodology
- Data
- GitHub

When multiple releases are public, "Explore" opens the current release and exposes a release selector.

### 6.4 Release metadata visible on every release page

- Release name and version.
- Publication date.
- Dataset version and correction history link.
- Current, archived, or superseded status.
- Snyk blog publication link.
- Paper/arXiv link.
- Citation action.
- GitHub/reproduction link where public.
- Last updated date.

## 7. Homepage requirements

### 7.1 Initiative and current-release hero

The homepage hero must include:

- VulnBench identity.
- "A Snyk benchmark initiative" attribution.
- Current release label: "Snyk VulnBench JS 1.0."
- Research-question headline: "Can LLMs find the same bugs twice?"
- Plain-language explanation of the evaluated security task.
- Explicit label that JS 1.0 is a repeatability and reference-agreement study.
- Evidence strip:
  - 300 vulnerability-finding scans.
  - 10 JavaScript projects.
  - 6 configurations.
  - 5 identical repetitions per configuration and task.
- Primary call to action: "Explore the results."
- Secondary calls to action:
  - "Read the paper."
  - "View methodology."
  - "Download data."
- A compact, data-driven headline visual contrasting stable reference-matched findings with variable unmatched reports.

The hero visual must use published values and include units, source, and release version. It must not be an ornamental illustration.

### 7.2 Latest evidence band

Summarize the central JS 1.0 contrast:

- 134 of 158 unique reference-matched findings appeared in all five repetitions.
- 80 of 161 unique unmatched findings appeared in only one of five repetitions.
- 22 of 161 unique unmatched findings appeared in all five repetitions.

Each value links to the relevant explorer state and metric definition.

### 7.3 Release timeline and catalog

Show:

- Published releases with date, research question, scope, and status.
- The current release.
- Superseded or corrected releases with explicit labels.

Do not publish speculative 2.0 results. Before 2.0 has approved public content, it should not appear as a fake card or empty state. A simple initiative-level statement that further releases are planned is acceptable.

### 7.4 Key findings

Present three evidence-backed findings from the current release:

- Reference-matched findings were substantially more repeatable than unmatched reports.
- Agentic LLM review and deterministic SAST showed complementary strengths and blind spots.
- More expensive model sessions did not automatically produce better Snyk-reference agreement.

Each finding must link to the exact chart and adjacent caveat.

### 7.5 Benchmark anatomy

Explain the measurement sequence:

1. Select inspectable benchmark projects.
2. Run each configuration repeatedly with the same code, prompt, and harness.
3. Normalize findings into documented signatures.
4. Match model findings to the deterministic Snyk Code reference set using the published scorer.
5. Analyze agreement, recurrence, variance, coverage, cost, tokens, and duration.
6. Inspect divergences instead of assuming all unmatched findings are false positives.

### 7.6 Explorer preview

Embed one real, lightweight interactive chart. It must:

- Use the published JS 1.0 data.
- Support focus and pointer details.
- Link into the explorer with the same state.
- Avoid loading the full explorer bundle on the homepage.

### 7.7 Research principles and publication block

Show:

- Transparent reference sets.
- Repeated measurement.
- Inspectable cases.
- Reproducible data.
- Explicit limitations.
- Authors and affiliations.
- Preferred citation.
- Blog, paper, GitHub, methodology, and data links.

## 8. Release overview requirements

The release overview is an editorial research story with interactive evidence.

Required sections:

1. Release-specific hero and evidence strip.
2. Research question and why repeatability matters.
3. Benchmark design and evaluated configurations.
4. Central repeatability finding.
5. Model-versus-SAST complementarity.
6. Vulnerability-class and project-level behavior.
7. Efficiency and cost-quality result.
8. Practical implications for security teams.
9. Representative cases.
10. Limitations and "what this does not prove."
11. Publication, citation, data, GitHub, and explorer calls to action.

The narrative order should match the evidence order in the publication, while linking each result to a reproducible explorer state.

## 9. Explorer requirements

### 9.1 Explorer model

The explorer is a guided analysis workbench. Its default state reproduces the release's central published view. It offers depth without changing scientific definitions.

Required top-level views:

- **Summary** — headline finding, configuration scorecard, and three annotated key charts.
- **Repeatability** — recurrence across identical runs, matched/unmatched stability, and score variance.
- **Coverage** — agreement by vulnerability class and benchmark project.
- **Efficiency** — quality versus cost, tokens, and duration.
- **Findings** — inspectable normalized signatures or run-level records that the approved public dataset safely exposes.

### 9.2 Persistent explorer context

Always display:

- Active release and dataset version.
- Active filters count.
- Active metric and aggregation.
- Number of records/runs/findings represented.
- Reset action.
- Copy/share action.
- Data and methodology links.

### 9.3 Desktop, tablet, and mobile layout

- Desktop: sticky compact filter rail and wide analysis canvas.
- Tablet: collapsible filter rail.
- Mobile: filter bottom sheet, one primary chart per viewport, horizontally scrollable comparison table, and sticky "Filters / Compare" bar.

Narrative pages must not inherit the full explorer sidebar.

## 10. Visualization requirements

### 10.1 Configuration scorecard

Display:

- Configuration.
- Snyk-reference F1.
- Snyk-reference F1 standard deviation in percentage points.
- Recall against the Snyk Code reference set.
- Precision against the Snyk Code reference set.
- Average duration.
- Average tokens.
- Estimated model-session cost.

Requirements:

- Sort by any metric.
- Preserve Snyk Code as "deterministic reference reproduction."
- Explain why 100% reference reproduction is not a universal accuracy claim.
- Provide an accessible table as the primary or equivalent representation.

### 10.2 Agreement-versus-variance scatter

- Y-axis: Snyk-reference F1 (%).
- X-axis: repeated-run F1 standard deviation (percentage points).
- Interpretation: upper-left is higher agreement and lower variance.
- Encode configuration consistently by color and shape.
- Show exact score, variance, sample size, release, and configuration on hover/focus.
- Allow configuration pinning from a point.

### 10.3 Finding recurrence distribution

- Group unique normalized finding signatures by recurrence in 1, 2, 3, 4, or 5 identical runs.
- Toggle matched, unmatched, or combined status.
- Toggle count or percentage.
- State the exact signature definition adjacent to the chart.
- Make the denominator visible.

### 10.4 Configuration repeatability bars

Show per configuration:

- Unique unmatched signatures.
- Unmatched signatures seen in one of five runs.
- Unmatched signatures seen in all five runs.
- Reference-matched findings seen in all five runs.

Support count and percentage modes. Do not imply that unmatched equals false positive.

### 10.5 Vulnerability-class heatmap

- Rows: configurations.
- Columns: vulnerability classes.
- Metric toggle:
  - Mean recall against the Snyk Code reference set.
  - Average unmatched reports per run.
- Cell details include numerator, denominator, sample size, and project coverage.
- Missing/not-applicable cells have a distinct non-numeric treatment.

### 10.6 Project/task matrix

- Rows: benchmark projects/tasks.
- Columns: configurations.
- Metric options:
  - Snyk-reference F1.
  - Reference recall.
  - Repeatability.
  - Unmatched finding count.
  - Duration.
  - Estimated cost.
- Selecting a cell opens the relevant case detail and preserves explorer state.

### 10.7 Efficiency scatter

- Y-axis: Snyk-reference F1 (%).
- X-axis toggle:
  - Estimated model-session cost (USD).
  - Average output tokens.
  - Average duration (seconds).
- Interpretation: upper-left is higher agreement with lower resource use.
- Model-only is the default because Snyk Code has no comparable token/session cost.
- The Snyk reference may be added only when the selected X metric is valid and clearly labeled.

### 10.8 Larger-fixture view

Show mean benchmark score for the larger multi-file fixture with repeated-run spread. Explain that this is one project-level result, not the complete benchmark.

### 10.9 Case-level detail

For a selected project, show:

- Project purpose and scale.
- Reference finding classes.
- Model matches.
- Unmatched model reports.
- Recurrence by configuration.
- Relevant source context when publication and licensing permit.
- Interpretation and caveat.

Case commentary should distinguish:

- Likely false-positive-shaped reports.
- Adjacent but out-of-reference-scope comments.
- Likely valid findings that may expose a reference/product gap.
- Missed repeated sinks or systematic coverage gaps.

### 10.10 Data-table parity

Every chart must have:

- A self-contained title.
- Labeled axes with units.
- Legend when more than one series appears.
- Source, release, dataset version, and aggregation caption.
- Plain-language interpretation.
- Adjacent metric definition and caveat.
- Keyboard-accessible exact values.
- Equivalent sortable table.
- CSV export of the filtered values.
- SVG and PNG chart export where technically practical.

## 11. Filters, knobs, toggles, and comparison

### 11.1 Global controls

- Release selector.
- Configuration multi-select.
- Include/exclude Snyk deterministic reference.
- Project/task multi-select.
- Vulnerability-class multi-select.
- Finding status: matched, unmatched, or combined.
- Recurrence threshold: 1/5 through 5/5.
- Metric selector.
- Aggregation selector where mathematically valid.
- Sort selector.
- Reset view.

### 11.2 Metric-specific controls

- Count versus percentage.
- Per-run versus unique-signature.
- Cost versus tokens versus duration.
- Mean versus median only where the release manifest explicitly supports both.
- Include/exclude uncertainty or repeated-run spread only when uncertainty remains represented elsewhere; users may not remove all uncertainty context.

### 11.3 Comparison tray

Users can pin up to four configurations.

The tray shows:

- Absolute metric values.
- Delta from a selected baseline.
- Repeatability and variance.
- Coverage/agreement.
- Cost, tokens, and duration.
- Active project and vulnerability filters.

Requirements:

- Pin/unpin from charts, tables, and configuration controls.
- Choose comparison baseline.
- Persist pins and baseline in the URL.
- On mobile, use a dedicated comparison sheet.
- Prevent comparisons across incompatible release metrics.

### 11.4 Chart interaction

- Hover and keyboard focus reveal exact details.
- Click/tap a mark to cross-filter related charts.
- Click a legend item to hide/show.
- Double-click or explicit "isolate" action to isolate a series.
- Brush or range selection may be used only when it improves analysis and has a keyboard-accessible equivalent.
- All interactions must update the visible active-filter summary.

### 11.5 Shareable state

Serialize into the URL:

- Release.
- Active explorer view.
- Selected configurations.
- Snyk-reference inclusion.
- Projects/tasks.
- Vulnerability classes.
- Finding status.
- Recurrence threshold.
- Metric and aggregation.
- Sort.
- Pinned configurations and baseline.
- Selected case.

Share URLs must be human-safe, deterministic, and backward-compatible within a release.

## 12. Scientific and editorial guardrails

### 12.1 Required terminology

Use:

- Snyk-reference F1.
- Reference agreement.
- Recall against the Snyk Code reference set.
- Precision against the Snyk Code reference set.
- Deterministic reference reproduction.
- Reference-matched finding.
- Unmatched finding or report.
- Repeated-run variance.
- Normalized finding signature.

### 12.2 Prohibited or restricted terminology

Do not use without an independent ground-truth protocol:

- Accuracy.
- True positive as a synonym for reference matched.
- False positive as a synonym for unmatched.
- Best security model.
- Snyk Code is 100% accurate.
- Model X catches Y% of all vulnerabilities.

### 12.3 Mandatory JS 1.0 caveats

- Snyk Code defines the reference set.
- The 100% Snyk Code score means deterministic reproduction of its own reference set.
- The scorer matches by vulnerability type and does not require exact file, line, severity, or source-to-sink identity.
- Fixtures are small JavaScript and Express projects and do not represent every production architecture.
- Unmatched reports may include false positives, adjacent comments, or valid product-gap candidates.
- Normalization choices affect recurrence percentages.
- Cost values reflect small fixtures and the published model-session assumptions.

### 12.4 Cross-release compatibility

The release manifest must explicitly list:

- Metric definitions.
- Data dimensions.
- Compatible predecessor/successor metrics.
- Incompatible metrics.
- Scoring protocol.
- Ground-truth/reference-set type.

The UI must block or split comparisons when definitions differ.

## 13. Visual and content design

### 13.1 Visual direction

Use an editorial research aesthetic:

- Primarily light, warm-neutral background.
- Deep ink text.
- Official Snyk purple for initiative identity and deliberate emphasis.
- Stable semantic colors for reference-matched, unmatched, caveat/warning, and neutral context.
- Consistent model/provider colors across every chart and release.
- Shape or line pattern as a second encoding so color is never the only distinction.
- Clean sans-serif narrative type.
- Tabular numerals and restrained monospace for metrics, versions, signatures, and chart annotations.
- Thin structural rules and generous narrative spacing.
- Compact controls and high information density inside the explorer.

A dark hero or evidence band is allowed when contrast remains accessible. Charts should favor a light analytical canvas.

### 13.2 Motif

A subtle "finding signature" or "scan trace" motif may appear in the identity, hero, and section transitions. It must remain abstract and technical without using hacker stereotypes, green terminal clichés, locks, shields, or decorative vulnerability icons.

### 13.3 Avoid

- Gradients.
- Glass effects.
- Decorative shadows.
- Gratuitous card grids.
- Rainbow chart palettes.
- Excessive motion.
- Giant marketing typography that displaces evidence.
- Vendor-logo clutter.
- Dense controls on narrative pages.

### 13.4 Content voice

- Precise, plain, and technically confident.
- Lead with what was measured.
- State limitations directly.
- Separate observed result from interpretation.
- Prefer "the data show" over broad claims.
- Avoid adversarial model-vendor language.
- Keep practical implications concrete.

## 14. Static architecture and data model

### 14.1 Architecture

- Static generation for all narrative and release pages.
- Typed client-side interactive islands for charts, filters, URL state, exports, and comparison.
- No runtime application API.
- No database.
- No user accounts.
- No server-side session state.
- Versioned datasets ship as static build assets.
- Explorer code loads only on explorer routes or the lightweight homepage preview.

### 14.2 Recommended implementation stack

- Astro for static routing, content, and build output.
- TypeScript in strict mode.
- React islands for the explorer and stateful analytical controls.
- MDX for reviewed narrative and methodology content.
- Observable Plot for accessible SVG-first statistical charts.
- Focused D3 modules only for interactions or layouts that Observable Plot cannot express cleanly.
- A schema validator for release manifests and datasets.
- A static deployment target such as Cloudflare Pages, Netlify, Vercel static output, or GitHub Pages; the final host must not change the route or data contracts.

### 14.3 Release manifest

Each release manifest defines:

- ID and slug.
- Name and version.
- Status.
- Publication and update dates.
- Dataset version.
- Research question.
- Short description.
- Evidence counts.
- Publication, citation, GitHub, methodology, and download links.
- Available explorer views.
- Available dimensions and metrics.
- Metric definitions and units.
- Cross-release compatibility.
- Data asset paths.
- Featured findings and chart states.

### 14.4 Shared data concepts

Normalize shared concepts:

- Release.
- Configuration.
- Provider/model/tool.
- Benchmark project/task.
- Run/repetition.
- Finding.
- Normalized finding signature.
- Reference match.
- Vulnerability class.
- Metric observation.
- Cost/token/duration observation.
- Publication annotation.

Release-specific extensions are allowed. Shared fields must not be overloaded with release-specific meanings.

### 14.5 Precomputed and deep data

- Precompute published aggregates and default chart datasets during the build.
- Load raw or normalized finding-level data only for deep explorer views.
- Keep public data assets immutable by dataset version.
- Compress large JSON assets.
- Provide CSV for common tabular downloads.
- Include a human-readable data dictionary.

### 14.6 Data validation

The build must fail on:

- Invalid release metadata.
- Duplicate stable IDs.
- Missing metric definitions.
- Missing units or denominators.
- Broken provenance or citation links.
- Non-finite chart values.
- Unsupported aggregation requests.
- Unknown configuration, task, class, or finding references.
- Headline findings that cannot be reconstructed from the declared dataset.

## 15. States and failure handling

### 15.1 No matching data

When filters produce zero results:

- Name the active filters causing the empty result.
- Offer to clear the most restrictive filter or reset all.
- Do not render empty axes or imply zero measurements.

### 15.2 Missing versus zero

- Zero is a measured numeric result.
- Missing means no observation.
- Not applicable means the metric does not apply.

These states must have distinct data values, labels, visual treatment, exports, and screen-reader text.

### 15.3 Invalid share URL

- Restore all valid parameters.
- Replace invalid values with release defaults.
- Show a dismissible explanation naming ignored parameters.
- Never crash or silently switch release.

### 15.4 Unavailable metric

Disable the control and show why the metric is unavailable for the active release or filter combination.

### 15.5 JavaScript failure

The server-rendered static page must still expose:

- Research question.
- Central findings.
- Evidence counts.
- Static scorecard.
- Publication and methodology links.
- Data download.

### 15.6 Corrected data

- Never silently replace an old dataset.
- Publish a new dataset patch version.
- Record affected values and reason.
- Preserve stable release URLs.
- Display a correction notice where the old value appeared.

## 16. Accessibility, performance, privacy, and SEO

### 16.1 Accessibility

Meet WCAG 2.2 AA:

- Full keyboard navigation.
- Visible focus.
- Semantic headings and landmarks.
- Form labels and descriptions.
- Chart summaries and equivalent tables.
- No hover-only information.
- Color-independent encodings.
- Sufficient text, line, and data-mark contrast.
- Reduced-motion support.
- Accessible validation and filter-state announcements.
- Logical reading and focus order at every breakpoint.

### 16.2 Performance

Targets at the 75th percentile:

- LCP below 2.5 seconds.
- CLS below 0.1.
- INP below 200 milliseconds.

Additional budgets:

- Narrative pages: less than 200 KB compressed JavaScript.
- Full explorer code must not block homepage interactivity.
- Lazy-load deep finding data and non-visible explorer views.
- Avoid chart re-rendering unrelated views when one filter changes.

### 16.3 Privacy

- Core functionality requires no cookies, account, or analytics.
- If analytics are approved, collect only event-level product signals needed to evaluate the goals in this document.
- Do not collect source-code content, filter values that could expose private information, or user-entered free text.

### 16.4 SEO and citation

- Stable canonical URLs.
- Crawlable release narratives and scorecards.
- Open Graph and social cards for releases and selected charts.
- `Dataset` structured data for release datasets.
- `ScholarlyArticle` structured data for the publication.
- Citation meta tags.
- Sitemap and robots configuration.
- Descriptive page titles and summaries.
- Paper, blog, GitHub, and dataset links visible in HTML.

## 17. Testing requirements

### 17.1 Data and contract tests

- Validate every release manifest and dataset.
- Reconstruct published JS 1.0 headline values.
- Reconstruct every featured chart dataset.
- Test zero, missing, and not-applicable semantics.
- Test cross-release compatibility declarations.

### 17.2 Unit tests

- Metric calculations.
- Filtering.
- Aggregation.
- Sorting.
- Comparison deltas.
- Finding recurrence.
- URL serialization and parsing.
- Export formatting.

### 17.3 Interaction tests

- Filter, reset, and empty state.
- Pin, unpin, and baseline selection.
- Chart-to-table parity.
- Legend hide/show and isolate.
- Cross-filtering.
- Share-link copy and restoration.
- Case selection.
- CSV and image export.
- Invalid share parameters.

### 17.4 Accessibility tests

- Automated checks on every route.
- Keyboard-only explorer review.
- Screen-reader review of at least one chart, its controls, and equivalent table.
- Zoom and reflow at 200% and 400%.
- Reduced-motion behavior.

### 17.5 Visual and responsive tests

- Mobile, tablet, laptop, and wide-desktop breakpoints.
- Long model/configuration names.
- Dense heatmaps.
- Four pinned comparisons.
- Missing values and correction notices.
- Light and any supported dark sections.

### 17.6 Performance and build tests

- Static build succeeds without network access to runtime data services.
- Broken-link and missing-asset scan.
- JavaScript budgets.
- Core Web Vitals lab checks.
- Deep dataset lazy-loading.

## 18. Delivery phases

### Phase 1 — Foundation and JS 1.0 narrative

Deliver:

- Project identity and design tokens.
- Route shell and global navigation.
- Release manifest and schema.
- Initiative homepage.
- JS 1.0 release overview.
- Methodology, publication, citation, and data pages.
- Static configuration scorecard.
- Static or lightly interactive featured charts.
- Structured data and basic social metadata.

Exit condition:

- The full JS 1.0 research story is accurate, accessible, crawlable, and publishable without the deep explorer.

### Phase 2 — Core explorer

Deliver:

- Summary, Repeatability, Coverage, and Efficiency views.
- Shared filters and active-filter summary.
- Required charts and equivalent tables.
- Comparison pins.
- URL state.
- CSV and chart export.
- Empty, invalid, missing, and unavailable states.

Exit condition:

- A practitioner can reproduce headline views and compare configurations across the approved JS 1.0 metrics.

### Phase 3 — Evidence depth

Deliver:

- Findings view.
- Case/project detail.
- Richer cross-filtering.
- Comparison tray deltas.
- Chart-level social share-card generation.
- Correction-history presentation.

Exit condition:

- A researcher can move from a headline result to the underlying case or normalized finding evidence exposed by the public dataset.

### Phase 4 — Release-system validation

Before public 2.0 implementation, create a synthetic non-public release fixture to prove:

- A second release can be added through manifest, content, and data.
- Release-specific metrics do not leak into JS 1.0.
- Incompatible metrics are blocked.
- Shared navigation, citation, data, and status behavior works.
- Existing JS 1.0 URLs and chart states remain stable.

Exit condition:

- The system can support 2.0 without restructuring or silently changing 1.0.

## 19. Out of scope for the initial product

- User accounts.
- Saved private dashboards.
- Comments or community submissions.
- Benchmark voting.
- Running models or Snyk scans.
- Uploading repositories.
- Live pricing feeds.
- Mutable third-party model metadata.
- A universal composite "best model" score.
- Forced cross-release rankings.
- General Snyk research content outside VulnBench.
- A full content-management system.
- Public placeholders for unpublished release results.

## 20. Release acceptance checklist

A release is ready when:

- [ ] Research question and product framing are approved.
- [ ] Release manifest and datasets pass validation.
- [ ] Headline values are reconstructed by automated tests.
- [ ] Every chart includes title, units, legend, source, release, dataset version, aggregation, and sample size.
- [ ] Every chart has keyboard-accessible values and an equivalent table.
- [ ] Required metric definitions and caveats are adjacent to relevant results.
- [ ] No reference-agreement metric is described as universal accuracy.
- [ ] Filtered and compared views restore from copied URLs.
- [ ] Zero, missing, not-applicable, invalid, and empty states are tested.
- [ ] Methodology, limitations, data, citation, paper, blog, and GitHub links are present.
- [ ] Accessibility review passes.
- [ ] Responsive review passes.
- [ ] Performance budgets pass.
- [ ] Static build and broken-link checks pass.
- [ ] Dataset version and correction history are visible.

## 21. Risks and mitigations

### Risk: self-referential leaderboard interpretation

Mitigation:

- Lead with repeatability.
- Use "Snyk-reference" in labels.
- Keep reference-set caveats adjacent.
- Avoid winner language and universal ranks.

### Risk: too many controls obscure the story

Mitigation:

- Separate release overview from explorer.
- Use guided explorer views.
- Keep advanced controls collapsed until needed.
- Preserve a meaningful default state.

### Risk: JS 1.0 assumptions constrain 2.0

Mitigation:

- Use capability-driven release manifests.
- Allow release-specific dimensions.
- Require compatibility declarations.
- Validate with a synthetic second release before public 2.0 work.

### Risk: chart interactions are inaccessible

Mitigation:

- SVG-first rendering.
- Keyboard focus for marks.
- Adjacent controls.
- Equivalent tables.
- Manual screen-reader and keyboard review.

### Risk: public data is too large for static delivery

Mitigation:

- Precompute aggregates.
- Split assets by explorer view.
- Lazy-load finding-level records.
- Compress JSON and provide CSV downloads.

### Risk: correction undermines trust

Mitigation:

- Immutable dataset versions.
- Visible correction log.
- Contract tests for published values.
- No silent rewrites.

## 22. Research references reviewed for this design

- ReactBench: <https://www.reactbench.com/>
- Martian Code Review Bench: <https://codereview.withmartian.com/>
- Snyk VulnBench JS 1.0 blog publication: <https://snyk.io/blog/snyk-vulnbench-js-1-0-llm-security-review-repeatability/>
- Snyk VulnBench JS 1.0 arXiv paper: <https://arxiv.org/abs/2606.15762>

## 23. Decisions recorded

- The site is scoped to VulnBench, not all Snyk AI security research.
- The product is a multi-release VulnBench hub, not a one-off JS 1.0 microsite.
- Practitioner comparison is the primary product job.
- Thought leadership, researcher exploration, and broad sharing are required secondary jobs.
- The preferred direction is an editorial research hub with a dedicated benchmark explorer.
- JS 1.0 must be framed as repeatability and reference agreement, not universal accuracy.
- The website is static and has no runtime backend dependency.
- Cross-release comparison requires explicit metric compatibility.
- The approved visual direction is editorial, research-grade, Snyk-attributed, and data-first.
