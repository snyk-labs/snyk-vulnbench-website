import { releaseSchema } from "./schema";

const paperUrl = "https://arxiv.org/abs/2606.15762";
const releaseName = "Snyk VulnBench JS 1.0";
const datasetVersion = "1.0.0";
const signatureUnit = "unique normalized finding signatures";

const observation = (
  label: string,
  numerator: number,
  denominator: number,
  recurrence: number,
  explorerPath: string,
) => ({
  label,
  numerator,
  denominator,
  recurrence,
  unit: signatureUnit,
  release: releaseName,
  datasetVersion,
  source: paperUrl,
  explorerPath,
});

export const js10Release = releaseSchema.parse({
  id: "snyk-vulnbench-js-1.0",
  slug: "js-1.0",
  name: releaseName,
  shortName: "JS 1.0",
  status: "current",
  publishedAt: "2026-06-11",
  updatedAt: "2026-06-11",
  datasetVersion,
  studyType: "Repeatability and Snyk-reference agreement",
  researchQuestion: "Can LLMs find the same bugs twice?",
  description:
    "A controlled study of how repeatably agentic LLM security reviews find vulnerabilities in the same JavaScript code, prompt, and benchmark harness.",
  evidence: {
    scans: 300,
    projects: 10,
    configurations: 6,
    repetitions: 5,
  },
  links: {
    overview: "/releases/js-1.0",
    explore: "/releases/js-1.0/explore",
    methodology: "/releases/js-1.0/methodology",
    data: "/releases/js-1.0/data",
    paper: paperUrl,
    publication:
      "https://snyk.io/blog/snyk-vulnbench-js-1-0-llm-security-review-repeatability/",
    github: "https://github.com/snyk-labs/snyk-vulnbench-js-1.0",
  },
  citation: {
    authors: [
      "Liran Tal",
      "Johannes Kloos",
      "Arsenii Rudich",
      "Stephen Thoemmes",
      "Manoj Nair",
    ],
    title: "Snyk VulnBench JS 1.0: Can LLMs Find the Same Bugs Twice?",
    year: 2026,
    url: paperUrl,
  },
  availableViews: [
    "summary",
    "repeatability",
    "coverage",
    "efficiency",
    "findings",
  ],
  metrics: [
    {
      id: "finding-recurrence",
      label: "Finding recurrence",
      definition:
        "The number of identical repetitions in which a normalized finding signature appeared.",
      unit: "runs out of 5",
      aggregation: "Unique normalized finding signatures",
      caveat:
        "Normalization choices affect recurrence percentages and do not establish ground-truth validity.",
    },
    {
      id: "snyk-reference-f1",
      label: "Snyk-reference F1",
      definition:
        "The harmonic mean of precision and recall when Snyk Code findings define the reference set.",
      unit: "percent",
      aggregation: "Macro average across benchmark projects",
      caveat:
        "Reference agreement is not universal vulnerability-detection accuracy.",
    },
    {
      id: "reference-recall",
      label: "Recall against the Snyk Code reference set",
      definition:
        "The share of Snyk Code reference findings matched by a configuration.",
      unit: "percent",
      aggregation: "Macro average across benchmark projects",
      caveat:
        "The scorer matches vulnerability type without requiring the same file, line, severity, or data-flow identity.",
    },
    {
      id: "reference-precision",
      label: "Precision against the Snyk Code reference set",
      definition:
        "The share of reported findings that match a Snyk Code reference finding.",
      unit: "percent",
      aggregation: "Macro average across benchmark projects",
      caveat:
        "Unmatched reports can be false-positive-shaped, adjacent, or valid product-gap candidates.",
    },
    {
      id: "session-duration",
      label: "Average session duration",
      definition: "Mean wall-clock duration for one benchmark session.",
      unit: "seconds",
      aggregation: "Mean across repeated runs",
      caveat:
        "Small benchmark fixtures do not represent the latency of every production repository.",
    },
    {
      id: "model-session-cost",
      label: "Estimated model-session cost",
      definition:
        "Estimated API-equivalent model cost under the publication's pricing assumptions.",
      unit: "USD",
      aggregation: "Mean across repeated model runs",
      caveat:
        "Snyk Code has no comparable model-session cost and published values reflect small fixtures.",
    },
  ],
  caveats: [
    "Snyk Code defines the reference set; its 100% score is deterministic reproduction of that set, not universal accuracy.",
    "The scorer matches by vulnerability type and does not require the same file, line, severity, or source-to-sink identity.",
    "The fixtures are small JavaScript and Express projects and do not represent every production architecture.",
    "Unmatched reports may include false positives, adjacent comments, or valid product-gap candidates.",
    "Normalization choices affect recurrence percentages.",
    "Cost values reflect small fixtures and the publication's model-session assumptions.",
  ],
  headlineEvidence: {
    matchedAllFive: observation(
      "Reference-matched findings seen in all five runs",
      134,
      158,
      5,
      "/releases/js-1.0/explore?view=repeatability&status=matched&recurrence=5",
    ),
    unmatchedOnce: observation(
      "Unmatched findings seen in only one run",
      80,
      161,
      1,
      "/releases/js-1.0/explore?view=repeatability&status=unmatched&recurrence=1",
    ),
    unmatchedAllFive: observation(
      "Unmatched findings seen in all five runs",
      22,
      161,
      5,
      "/releases/js-1.0/explore?view=repeatability&status=unmatched&recurrence=5",
    ),
  },
  featuredFindings: [
    {
      title: "Reference-matched findings were substantially more repeatable",
      summary:
        "134 of 158 unique reference-matched findings appeared in all five repetitions.",
      explorerPath: "/releases/js-1.0#repeatability",
      caveat:
        "A reference match measures agreement with Snyk Code, not independent ground-truth accuracy.",
    },
    {
      title: "LLM review and deterministic SAST showed complementary behavior",
      summary:
        "Models identified high-signal exploit shapes while deterministic SAST systematically enumerated repeated data-flow sinks.",
      explorerPath: "/releases/js-1.0#coverage",
      caveat:
        "Unmatched findings require case-level inspection before they can be classified.",
    },
    {
      title: "Higher session cost did not guarantee higher reference agreement",
      summary:
        "The published cost-quality comparison does not show a monotonic relationship between spend and Snyk-reference F1.",
      explorerPath: "/releases/js-1.0#efficiency",
      caveat:
        "Cost estimates reflect the tested small fixtures and publication assumptions.",
    },
  ],
  compatibility: {
    scoringProtocol: "JS 1.0 vulnerability-type reference matcher",
    referenceSetType: "Deterministic Snyk Code reference set",
    compatibleMetrics: [],
    incompatibleMetrics: [],
  },
});
