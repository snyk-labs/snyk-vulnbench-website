import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

const configurationTypeSchema = z.enum(["model", "command"]);
const chartManifestSchema = z.object({
  charts: z.array(
    z.object({
      id: z.string().min(1),
      dataSummary: z.unknown(),
    }),
  ),
});

const metricRowSchema = z.object({
  label: z.string().min(1),
  runConfigType: configurationTypeSchema,
  value: z.number().nullable(),
  repetitions: z.number().int().positive(),
  stdDev: z.number().optional(),
});

const metricRowsSchema = z.object({
  unit: z.string().min(1),
  rows: z.array(metricRowSchema),
});

const recallPrecisionSchema = z.object({
  unit: z.string().min(1),
  groups: z.array(
    z.object({
      label: z.string().min(1),
      runConfigType: configurationTypeSchema,
      recall: z.number().min(0).max(1),
      precision: z.number().min(0).max(1),
    }),
  ),
});

const scatterSchema = z.object({
  points: z.array(
    z.object({
      label: z.string().min(1),
      runConfigType: configurationTypeSchema,
      x: z.number(),
      y: z.number(),
    }),
  ),
});

const coverageSchema = z.object({
  unit: z.literal("percent"),
  columns: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
    }),
  ),
  rows: z.array(
    z.object({
      label: z.string().min(1),
      runConfigType: configurationTypeSchema,
      values: z.record(z.string(), z.number().min(0).max(1)),
    }),
  ),
});

const caseRowsSchema = z.object({
  unit: z.string().min(1),
  rows: z.array(
    z.object({
      label: z.string().min(1),
      value: z.number(),
      count: z.number().int().nonnegative().optional(),
      total: z.number().int().positive().optional(),
    }),
  ),
});

const recurrenceSchema = z.object({
  unit: z.literal("percent"),
  totalUniqueFindings: z.number().int().positive(),
  rows: z.array(
    z.object({
      label: z.enum(["1 of 5", "2 of 5", "3 of 5", "4 of 5", "5 of 5"]),
      value: z.number().min(0).max(1),
      count: z.number().int().nonnegative(),
      total: z.number().int().positive(),
    }),
  ),
});

export interface ConfigurationEvidence {
  name: string;
  type: "model" | "command";
  f1: number;
  f1StdDev: number;
  recall: number;
  precision: number;
  durationMs: number;
  tokens: number;
  costUsd: number | null;
  repetitions: number;
}

export interface ScatterPoint {
  name: string;
  type: "model" | "command";
  x: number;
  y: number;
}

export interface PublishedEvidence {
  configurations: ConfigurationEvidence[];
  agreementVariance: ScatterPoint[];
  costQuality: ScatterPoint[];
  coverage: {
    columns: { key: string; label: string }[];
    rows: {
      name: string;
      type: "model" | "command";
      values: Record<string, number>;
    }[];
  };
  largerFixture: {
    name: "JS Todo App (SQLite 4)";
    rows: {
      name: string;
      type: "model" | "command";
      f1: number;
      stdDev: number;
      repetitions: number;
    }[];
  };
  cases: {
    tigerteamSqlDecoyRuns: number;
    nightowlSqlGapRuns: number;
    nightowlPathTraversalMisses: number;
    nightowlResourceLimitMisses: number;
  };
  recurrence: {
    matched: { total: number; counts: number[] };
    unmatched: { total: number; counts: number[] };
  };
  provenance: {
    release: "Snyk VulnBench JS 1.0";
    datasetVersion: "1.0.0";
    aggregation: "Macro average across 10 fixtures and 5 repetitions";
    source: "/data/js-1.0/published-evidence.json";
  };
}

type ChartManifest = z.infer<typeof chartManifestSchema>;

async function readManifest(path: string): Promise<ChartManifest> {
  const manifest = chartManifestSchema.parse(
    JSON.parse(await readFile(path, "utf8")),
  );
  if (new Set(manifest.charts.map(({ id }) => id)).size !== manifest.charts.length) {
    throw new Error(`Duplicate chart ID in ${path}`);
  }
  return manifest;
}

function requireChart(manifest: ChartManifest, id: string) {
  const chart = manifest.charts.find((candidate) => candidate.id === id);
  if (!chart) {
    throw new Error(`Published chart is missing: ${id}`);
  }
  return chart.dataSummary;
}

function assertUniqueLabels(
  rows: { label: string }[],
  context: string,
): void {
  if (new Set(rows.map(({ label }) => label)).size !== rows.length) {
    throw new Error(`Duplicate configuration label in ${context}`);
  }
}

function rowsByLabel<T extends { label: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.label, row]));
}

function requireRow<T>(rows: Map<string, T>, label: string, context: string): T {
  const row = rows.get(label);
  if (!row) {
    throw new Error(`Missing ${context} row for ${label}`);
  }
  return row;
}

function caseValue(
  rows: z.infer<typeof caseRowsSchema>["rows"],
  label: string,
) {
  const row = rows.find((candidate) => candidate.label === label);
  if (!row) {
    throw new Error(`Missing representative case row: ${label}`);
  }
  return row;
}

function validateMetricSummary(
  summary: z.infer<typeof metricRowsSchema>,
  expectedUnit: "percent" | "milliseconds" | "tokens" | "usd",
  context: string,
) {
  if (summary.unit !== expectedUnit) {
    throw new Error(
      `Expected ${expectedUnit} units for ${context}, received ${summary.unit}`,
    );
  }
  if (summary.rows.some(({ repetitions }) => repetitions !== 5)) {
    throw new Error(`Expected five repetitions for every ${context} row`);
  }
  return summary.rows;
}

function recurrenceDistribution(
  summary: z.infer<typeof recurrenceSchema>,
  context: string,
) {
  if (
    summary.rows.length !== 5 ||
    new Set(summary.rows.map(({ label }) => label)).size !== 5
  ) {
    throw new Error(`Expected five unique recurrence rows for ${context}`);
  }
  if (
    summary.rows.some(({ total }) => total !== summary.totalUniqueFindings) ||
    summary.rows.reduce((sum, { count }) => sum + count, 0) !==
      summary.totalUniqueFindings
  ) {
    throw new Error(`Invalid recurrence denominator for ${context}`);
  }

  return {
    total: summary.totalUniqueFindings,
    counts: [...summary.rows]
      .sort((left, right) => Number(left.label[0]) - Number(right.label[0]))
      .map(({ count }) => count),
  };
}

export async function loadJs10PublishedEvidence(
  workspaceRoot = process.cwd(),
): Promise<PublishedEvidence> {
  const sourceRoot = resolve(workspaceRoot, "snyk-vulnbench-js-1.0");
  const [headlineManifest, repeatabilityManifest, calloutManifest] =
    await Promise.all([
      readManifest(resolve(sourceRoot, "chart-manifest.json")),
      readManifest(
        resolve(
          sourceRoot,
          "2026-05-28-llm-repeatability/chart-manifest.json",
        ),
      ),
      readManifest(
        resolve(sourceRoot, "2026-05-28-model-callouts/chart-manifest.json"),
      ),
    ]);

  const score = validateMetricSummary(
    metricRowsSchema.parse(requireChart(headlineManifest, "headline-score")),
    "percent",
    "score",
  );
  const duration = validateMetricSummary(
    metricRowsSchema.parse(requireChart(headlineManifest, "headline-duration")),
    "milliseconds",
    "duration",
  );
  const tokens = validateMetricSummary(
    metricRowsSchema.parse(
      requireChart(headlineManifest, "headline-total-tokens"),
    ),
    "tokens",
    "token",
  );
  const cost = validateMetricSummary(
    metricRowsSchema.parse(requireChart(headlineManifest, "headline-cost")),
    "usd",
    "cost",
  );
  const recallPrecisionSummary = recallPrecisionSchema.parse(
    requireChart(headlineManifest, "headline-recall-precision"),
  );
  if (recallPrecisionSummary.unit !== "percent") {
    throw new Error("Expected percent units for recall and precision");
  }
  const recallPrecision = recallPrecisionSummary.groups;

  for (const [rows, context] of [
    [score, "score"],
    [duration, "duration"],
    [tokens, "tokens"],
    [cost, "cost"],
    [recallPrecision, "recall and precision"],
  ] as const) {
    assertUniqueLabels(rows, context);
    if (rows.length !== 6) {
      throw new Error(`Expected six configuration rows in ${context}`);
    }
  }

  const durationByLabel = rowsByLabel(duration);
  const tokensByLabel = rowsByLabel(tokens);
  const costByLabel = rowsByLabel(cost);
  const recallPrecisionByLabel = rowsByLabel(recallPrecision);

  const configurations = score.map((scoreRow): ConfigurationEvidence => {
    if (scoreRow.value === null || scoreRow.stdDev === undefined) {
      throw new Error(`Incomplete score row for ${scoreRow.label}`);
    }
    const durationRow = requireRow(
      durationByLabel,
      scoreRow.label,
      "duration",
    );
    const tokenRow = requireRow(tokensByLabel, scoreRow.label, "tokens");
    const costRow = requireRow(costByLabel, scoreRow.label, "cost");
    const agreementRow = requireRow(
      recallPrecisionByLabel,
      scoreRow.label,
      "recall and precision",
    );
    if (durationRow.value === null || tokenRow.value === null) {
      throw new Error(`Incomplete resource row for ${scoreRow.label}`);
    }

    return {
      name: scoreRow.label,
      type: scoreRow.runConfigType,
      f1: scoreRow.value,
      f1StdDev: scoreRow.stdDev,
      recall: agreementRow.recall,
      precision: agreementRow.precision,
      durationMs: durationRow.value,
      tokens: tokenRow.value,
      costUsd: costRow.value,
      repetitions: scoreRow.repetitions,
    };
  });

  const agreementVariance = scatterSchema
    .parse(
      requireChart(
        repeatabilityManifest,
        "score-stability-labeled-scatter",
      ),
    )
    .points.map(({ label, runConfigType, x, y }) => ({
      name: label,
      type: runConfigType,
      x,
      y,
    }));
  const costQuality = scatterSchema
    .parse(
      requireChart(
        repeatabilityManifest,
        "score-vs-cost-repeatability-story",
      ),
    )
    .points.map(({ label, runConfigType, x, y }) => ({
      name: label,
      type: runConfigType,
      x,
      y,
    }));

  const coverageSource = coverageSchema.parse(
    requireChart(
      calloutManifest,
      "reference-coverage-by-type-and-config",
    ),
  );
  if (coverageSource.columns.length !== 17 || coverageSource.rows.length !== 6) {
    throw new Error("Published vulnerability coverage matrix is incomplete");
  }
  const coverageKeys = coverageSource.columns.map(({ key }) => key);
  if (new Set(coverageKeys).size !== coverageKeys.length) {
    throw new Error("Published vulnerability coverage columns must be unique");
  }
  const sortedCoverageKeys = [...coverageKeys].sort();
  for (const row of coverageSource.rows) {
    if (
      JSON.stringify(Object.keys(row.values).sort()) !==
      JSON.stringify(sortedCoverageKeys)
    ) {
      throw new Error(
        `Coverage keys for ${row.label} do not match the published columns`,
      );
    }
  }

  const largerFixtureSource = validateMetricSummary(
    metricRowsSchema.parse(
      requireChart(calloutManifest, "larger-fixture-score-by-config"),
    ),
    "percent",
    "larger-fixture score",
  );
  const sqlCases = caseRowsSchema.parse(
    requireChart(repeatabilityManifest, "sql-shaped-complementarity"),
  ).rows;
  const nightowlMisses = caseRowsSchema.parse(
    requireChart(repeatabilityManifest, "nightowl-recall-cliff"),
  ).rows;
  const unmatchedRecurrence = recurrenceDistribution(
    recurrenceSchema.parse(
      requireChart(repeatabilityManifest, "unmatched-finding-repeatability"),
    ),
    "unmatched findings",
  );
  const matchedRecurrence = recurrenceDistribution(
    recurrenceSchema.parse(
      requireChart(repeatabilityManifest, "matched-finding-repeatability"),
    ),
    "reference-matched findings",
  );
  const pathTraversal = caseValue(nightowlMisses, "Path traversal");
  const resourceLimits = caseValue(nightowlMisses, "Resource limits");

  return {
    configurations,
    agreementVariance,
    costQuality,
    coverage: {
      columns: coverageSource.columns,
      rows: coverageSource.rows.map(
        ({ label, runConfigType, values }) => ({
          name: label,
          type: runConfigType,
          values,
        }),
      ),
    },
    largerFixture: {
      name: "JS Todo App (SQLite 4)",
      rows: largerFixtureSource.map((row) => {
        if (row.value === null || row.stdDev === undefined) {
          throw new Error(`Incomplete larger-fixture row for ${row.label}`);
        }
        return {
          name: row.label,
          type: row.runConfigType,
          f1: row.value,
          stdDev: row.stdDev,
          repetitions: row.repetitions,
        };
      }),
    },
    cases: {
      tigerteamSqlDecoyRuns: caseValue(
        sqlCases,
        "Tigerteam SQL decoy",
      ).value,
      nightowlSqlGapRuns: caseValue(sqlCases, "Nightowl likely gap").value,
      nightowlPathTraversalMisses:
        pathTraversal.count ?? pathTraversal.value,
      nightowlResourceLimitMisses:
        resourceLimits.count ?? resourceLimits.value,
    },
    recurrence: {
      matched: matchedRecurrence,
      unmatched: unmatchedRecurrence,
    },
    provenance: {
      release: "Snyk VulnBench JS 1.0",
      datasetVersion: "1.0.0",
      aggregation: "Macro average across 10 fixtures and 5 repetitions",
      source: "/data/js-1.0/published-evidence.json",
    },
  };
}
