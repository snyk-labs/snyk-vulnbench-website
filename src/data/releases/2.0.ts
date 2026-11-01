import {
  getV20Configuration,
  getV20Table,
  v20Copy,
  v20Tables,
} from "./2.0-content";
import { releaseSchema } from "./schema";

const paperUrl = "https://arxiv.org/abs/2610.38617";
const datasetVersion = v20Copy.releaseCard.dataset;
const metricCards = v20Copy.methodology.sections.find(
  ({ id }) => id === "metrics",
)?.metrics;
if (!metricCards) {
  throw new Error("Snyk VulnBench 2.0 methodology must define metric cards");
}
const metricIds = [
  "attacker-reachable-recall",
  "localized-recall",
  "reference-set-precision",
  "resampling-interval",
  "paired-comparison",
  "wall-time",
  "known-cost",
  "tokens",
  "findings-per-matched",
] as const;
const incompatibleJs10Lineage: Record<(typeof metricIds)[number], string[]> = {
  "attacker-reachable-recall": ["reference-recall", "reference-agreement-f1"],
  "localized-recall": ["reference-recall", "reference-agreement-f1"],
  "reference-set-precision": ["reference-precision"],
  "resampling-interval": [],
  "paired-comparison": [],
  "wall-time": ["session-duration-seconds"],
  "known-cost": ["model-session-cost-usd"],
  tokens: ["model-session-cost-usd"],
  "findings-per-matched": [],
};
if (metricCards.length !== metricIds.length) {
  throw new Error("Snyk VulnBench 2.0 metric cards changed; update metric IDs");
}

const headline = getV20Table("headline");
const designBoundary = v20Copy.releasePage.find(({ id }) => id === "design")?.boundary;
const localizedCaveat = metricCards[1]?.caveat;
if (!designBoundary || !localizedCaveat) {
  throw new Error("Snyk VulnBench 2.0 copy must define headline caveats");
}

const findingPaths: Record<string, string> = {
  complementarity: "/releases/2.0/explore?view=complementarity",
  "harness-policy": "/releases/2.0/explore?view=harness-policy",
  efficiency: "/releases/2.0/explore?view=efficiency",
  robustness: "/releases/2.0#robustness",
};

export const v20Release = releaseSchema.parse({
  id: "snyk-vulnbench-2.0",
  slug: "2.0",
  name: v20Copy.releaseCard.name,
  shortName: "2.0",
  publicationState: "public",
  status: "current",
  publishedAt: "2026-10-28",
  updatedAt: "2026-10-28",
  datasetVersion,
  studyType: v20Copy.home.subtitle,
  researchQuestion: v20Copy.releaseCard.question,
  description: v20Copy.releaseCard.summary,
  evidence: {
    scans: 180,
    projects: 20,
    configurations: 9,
    repetitions: 1,
  },
  links: {
    overview: "/releases/2.0",
    explore: "/releases/2.0/explore",
    methodology: "/releases/2.0/methodology",
    data: "/releases/2.0/data",
    paper: paperUrl,
    github: "https://github.com/snyk-labs/snyk-vulnbench",
  },
  citation: {
    authors: [
      "Liran Tal",
      "Chris Liu",
      "Charlotte Fereday",
      "Sebastian Roth",
      "Brian Clark",
    ],
    title:
      "How Deterministic SAST and AI Security Agents Divide the Work: Coverage, Harness Policy and Cost in Snyk VulnBench 2.0",
    year: 2026,
    url: paperUrl,
    arxivId: "2610.38617",
    primaryClass: "cs.CR",
    doi: "10.48550/arXiv.2610.38617",
    pdfUrl: "https://arxiv.org/pdf/2610.38617",
  },
  availableViews: [
    "summary",
    "complementarity",
    "harness-policy",
    "efficiency",
    "findings",
  ],
  dimensions: [
    { id: "configuration", label: "Configuration", scope: "shared" },
    { id: "application", label: "Benchmark application", scope: "release" },
    {
      id: "reference-vulnerability",
      label: "Reference vulnerability",
      scope: "release",
    },
    { id: "vulnerability-class", label: "Vulnerability class", scope: "shared" },
    { id: "flow-shape", label: "Same-file or cross-file flow", scope: "release" },
    { id: "language-family", label: "Language family", scope: "release" },
  ],
  assets: v20Tables.map(({ name }) => ({
    id: name.replaceAll("_", "-"),
    path: `/data/2.0/${name}.csv`,
    format: "csv",
    datasetVersion,
  })),
  metrics: metricCards.map((card, index) => ({
    id: metricIds[index],
    label: card.name,
    definition: card.definition,
    unit: card.unit,
    aggregation: card.aggregation,
    caveat: card.caveat,
  })),
  caveats: v20Copy.limitations,
  headlineEvidence: {
    kind: "generic",
    observations: headline.rows.map((row) => {
      const configuration = getV20Configuration(row.config_id ?? "");
      const localized = configuration.metric === "localized_recall";
      return {
        id: configuration.config_id,
        label: configuration.display_name,
        value: Number(row.macro_recall_pct),
        unit: localized ? "percent, localized recall" : "percent, macro Attacker-Reachable Vulnerability Recall",
        source: paperUrl,
        explorerPath: "/releases/2.0/explore?view=summary",
        caveat: localized ? localizedCaveat : designBoundary,
      };
    }),
  },
  featuredFindings: v20Copy.findings.map((finding) => ({
    title: finding.title,
    summary: finding.body[0],
    explorerPath: findingPaths[finding.id],
    caveat: finding.care,
  })),
  compatibility: {
    scoringProtocol: "2.0 endpoint rule, two-line tolerance, one-to-one credit",
    referenceSetType: "Independent curated attacker-reachable reference set",
    metricLineage: metricIds.map((metricId) => ({
      metricId,
      lineageId: `${metricId}-v2`,
      compatibleWith: [],
      incompatibleWith: incompatibleJs10Lineage[metricId],
    })),
  },
});
