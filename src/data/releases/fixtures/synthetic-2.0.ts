import { releaseSchema } from "../schema";

const fixtureSource = "https://example.invalid/vulnbench/synthetic-2.0";

export const synthetic20Release = releaseSchema.parse({
  id: "snyk-vulnbench-synthetic-2.0",
  slug: "synthetic-2.0",
  name: "Snyk VulnBench Synthetic 2.0",
  shortName: "Synthetic 2.0",
  publicationState: "internal-fixture",
  status: "current",
  publishedAt: "2026-08-05",
  updatedAt: "2026-08-05",
  datasetVersion: "2.0.0",
  studyType: "Independent adjudicated evaluation fixture",
  researchQuestion:
    "Can a structurally different release coexist without changing JS 1.0?",
  description:
    "A non-public synthetic fixture used only to validate release-system boundaries and cross-release compatibility.",
  evidence: {
    scans: 48,
    projects: 4,
    configurations: 3,
    repetitions: 4,
  },
  links: {
    overview: "/releases/synthetic-2.0",
    explore: "/releases/synthetic-2.0/explore",
    methodology: "/releases/synthetic-2.0/methodology",
    data: "/releases/synthetic-2.0/data",
    paper: fixtureSource,
    publication: fixtureSource,
    github: fixtureSource,
  },
  citation: {
    authors: ["VulnBench release-system fixture"],
    title: "Synthetic VulnBench 2.0 Validation Fixture",
    year: 2026,
    url: fixtureSource,
  },
  availableViews: ["summary", "coverage", "efficiency"],
  dimensions: [
    { id: "configuration", label: "Configuration", scope: "shared" },
    { id: "project", label: "Benchmark project", scope: "shared" },
    { id: "run", label: "Evaluation run", scope: "shared" },
    { id: "finding", label: "Finding", scope: "shared" },
    {
      id: "vulnerability-class",
      label: "Vulnerability class",
      scope: "shared",
    },
    {
      id: "repository-scale",
      label: "Repository scale",
      scope: "release",
    },
    {
      id: "adjudication-status",
      label: "Adjudication status",
      scope: "release",
    },
  ],
  assets: [
    {
      id: "synthetic-summary",
      path: "/__fixtures__/synthetic-2.0/summary.json",
      format: "json",
      datasetVersion: "2.0.0",
    },
    {
      id: "synthetic-adjudications",
      path: "/__fixtures__/synthetic-2.0/adjudications.csv",
      format: "csv",
      datasetVersion: "2.0.0",
    },
  ],
  metrics: [
    {
      id: "independent-ground-truth-f1",
      label: "Independent ground-truth F1",
      definition:
        "Harmonic mean of precision and recall against independently adjudicated findings.",
      unit: "percent",
      aggregation: "Macro average across repository-scale strata",
      caveat: "Synthetic validation value; never publish as a benchmark result.",
    },
    {
      id: "ground-truth-recall",
      label: "Independent ground-truth recall",
      definition:
        "Share of independently adjudicated findings reported by a configuration.",
      unit: "percent",
      aggregation: "Macro average across repository-scale strata",
      caveat: "Not compatible with JS 1.0 Snyk-reference recall.",
    },
    {
      id: "session-duration",
      label: "Average session duration",
      definition: "Mean wall-clock duration for one benchmark session.",
      unit: "seconds",
      aggregation: "Mean across repeated runs",
      caveat: "Synthetic fixture reuses the JS 1.0 harness timing boundary.",
    },
    {
      id: "repository-risk-score",
      label: "Repository risk score",
      definition:
        "Synthetic release-only composite used to test metric isolation.",
      unit: "points",
      aggregation: "Weighted mean by repository scale",
      caveat: "Release-specific and incompatible with all JS 1.0 metrics.",
    },
  ],
  caveats: [
    "This fixture is internal validation data, not a public VulnBench release.",
    "Synthetic values must never appear in public routes or claims.",
  ],
  headlineEvidence: {
    kind: "generic",
    observations: [
      {
        id: "fixture-f1",
        label: "Synthetic independent ground-truth F1",
        value: 81,
        unit: "percent",
        source: fixtureSource,
        explorerPath: "/releases/synthetic-2.0/explore?view=summary",
        caveat: "Internal fixture value only.",
      },
    ],
  },
  featuredFindings: [
    {
      title: "Synthetic release-specific metric isolation",
      summary:
        "Repository risk score exists only to prove release-specific dimensions and metrics stay isolated.",
      explorerPath: "/releases/synthetic-2.0/explore?view=summary",
      caveat: "Internal fixture; not a public result.",
    },
  ],
  compatibility: {
    scoringProtocol: "Independent adjudicated synthetic protocol",
    referenceSetType: "Independent adjudicated ground truth",
    metricLineage: [
      {
        metricId: "independent-ground-truth-f1",
        lineageId: "independent-ground-truth-f1",
        compatibleWith: [],
        incompatibleWith: ["reference-agreement-f1"],
      },
      {
        metricId: "ground-truth-recall",
        lineageId: "ground-truth-recall",
        compatibleWith: [],
        incompatibleWith: ["reference-recall"],
      },
      {
        metricId: "session-duration",
        lineageId: "session-duration-seconds",
        compatibleWith: ["session-duration-seconds"],
        incompatibleWith: [],
      },
      {
        metricId: "repository-risk-score",
        lineageId: "repository-risk-score-v2",
        compatibleWith: [],
        incompatibleWith: [
          "reference-agreement-f1",
          "reference-recall",
          "reference-precision",
        ],
      },
    ],
  },
});
