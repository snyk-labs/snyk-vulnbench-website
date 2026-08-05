import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { loadJs10PublishedEvidence } from "../releases/js-1.0-source";
import {
  explorerRunSchema,
  explorerTaskAggregateSchema,
  type ConfigurationRepeatability,
  type ExplorerConfiguration,
  type ExplorerDataset,
  type ExplorerProject,
  type ExplorerRunObservation,
  type ExplorerTaskObservation,
} from "./schema";

const repeatabilitySummarySchema = z.object({
  unit: z.literal("percent"),
  rows: z.array(
    z.object({
      label: z.string().min(1),
      runConfigType: z.literal("model"),
      value: z.number().min(0).max(1),
      count: z.number().int().nonnegative(),
      total: z.number().int().positive(),
    }),
  ),
});

const repeatabilityManifestSchema = z.object({
  charts: z.array(
    z.object({
      id: z.string().min(1),
      dataSummary: z.unknown(),
    }),
  ),
});

function uniqueById<T extends { id: string }>(values: T[], context: string) {
  if (new Set(values.map(({ id }) => id)).size !== values.length) {
    throw new Error(`Duplicate ${context} ID`);
  }
  return values;
}

function requireChart(
  manifest: z.infer<typeof repeatabilityManifestSchema>,
  id: string,
) {
  const chart = manifest.charts.find((candidate) => candidate.id === id);
  if (!chart) throw new Error(`Missing explorer chart: ${id}`);
  return repeatabilitySummarySchema.parse(chart.dataSummary).rows;
}

function rowsByName<T extends { label: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.label, row]));
}

function requiredRow<T>(rows: Map<string, T>, name: string, context: string) {
  const row = rows.get(name);
  if (!row) throw new Error(`Missing ${context} row for ${name}`);
  return row;
}

export async function loadJs10ExplorerDataset(
  workspaceRoot = process.cwd(),
): Promise<ExplorerDataset> {
  const sourceRoot = resolve(workspaceRoot, "snyk-vulnbench-js-1.0");
  const [jsonl, repeatabilityManifest, publishedEvidence] = await Promise.all([
    readFile(
      resolve(sourceRoot, "benchmark-2026-05-20T23-06-29-348Z.jsonl"),
      "utf8",
    ),
    readFile(
      resolve(
        sourceRoot,
        "2026-05-28-model-callouts/chart-manifest.json",
      ),
      "utf8",
    ).then((contents) =>
      repeatabilityManifestSchema.parse(JSON.parse(contents)),
    ),
    loadJs10PublishedEvidence(workspaceRoot),
  ]);

  const records = jsonl
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { _type?: string });
  const aggregates = records
    .filter((record) => record._type === "task-aggregate")
    .map((record) => explorerTaskAggregateSchema.parse(record));
  const runs: ExplorerRunObservation[] = records
    .filter((record) => record._type === "run")
    .map((record) => explorerRunSchema.parse(record))
    .map((run) => {
      const unmatchedByClass: Record<string, number> = {};
      for (const finding of run.details.falsePositives) {
        unmatchedByClass[finding.type] =
          (unmatchedByClass[finding.type] ?? 0) + 1;
      }
      return {
        projectId: run.taskId,
        configurationId: run.runConfigId,
        configurationType: run.runConfigType,
        repetition: run.repetition,
        f1: run.score,
        referenceByClass: run.details.byType,
        unmatchedByClass,
      };
    });

  if (aggregates.length !== 60) {
    throw new Error(`Expected 60 task aggregates, found ${aggregates.length}`);
  }
  if (runs.length !== 300) {
    throw new Error(`Expected 300 runs, found ${runs.length}`);
  }

  const configurationByName = new Map(
    aggregates.map((row) => [
      row.runConfigName,
      {
        id: row.runConfigId,
        name: row.runConfigName,
        type: row.runConfigType,
      } satisfies ExplorerConfiguration,
    ]),
  );
  const configurations = uniqueById(
    publishedEvidence.configurations.map(({ name }) => {
      const configuration = configurationByName.get(name);
      if (!configuration) {
        throw new Error(`Missing explorer configuration: ${name}`);
      }
      return configuration;
    }),
    "configuration",
  );

  const projects = uniqueById(
    [
      ...new Map(
        aggregates.map((row) => [
          row.taskId,
          { id: row.taskId, name: row.taskName } satisfies ExplorerProject,
        ]),
      ).values(),
    ],
    "project",
  );
  if (configurations.length !== 6 || projects.length !== 10) {
    throw new Error(
      `Expected 6 configurations and 10 projects, found ${configurations.length} and ${projects.length}`,
    );
  }

  const tasks: ExplorerTaskObservation[] = aggregates.map((row) => {
    if (
      (row.runConfigType === "command" && row.totalCostUsd !== null) ||
      (row.runConfigType === "model" && row.totalCostUsd === null)
    ) {
      throw new Error(`Invalid cost semantics for ${row.runConfigName}`);
    }
    return {
      projectId: row.taskId,
      projectName: row.taskName,
      configurationId: row.runConfigId,
      configurationName: row.runConfigName,
      configurationType: row.runConfigType,
      f1: row.score,
      f1StdDev: row.scoreStdDev,
      recall: row.recall,
      precision: row.precision,
      durationMs: row.sessionDurationMs,
      tokens: row.totalTokens,
      costUsd: row.totalCostUsd,
      repetitions: row.repetitions,
    };
  });

  if (
    new Set(
      tasks.map(
        ({ projectId, configurationId }) =>
          `${projectId}:${configurationId}`,
      ),
    ).size !== 60
  ) {
    throw new Error("Explorer task matrix contains duplicate pairs");
  }
  for (const project of projects) {
    for (const configuration of configurations) {
      if (
        !tasks.some(
          ({ projectId, configurationId }) =>
            projectId === project.id && configurationId === configuration.id,
        )
      ) {
        throw new Error(
          `Missing explorer task pair: ${project.id}:${configuration.id}`,
        );
      }
      const pairRuns = runs.filter(
        ({ projectId, configurationId }) =>
          projectId === project.id && configurationId === configuration.id,
      );
      if (
        pairRuns.length !== 5 ||
        new Set(pairRuns.map(({ repetition }) => repetition)).size !== 5
      ) {
        throw new Error(
          `Incomplete explorer run pair: ${project.id}:${configuration.id}`,
        );
      }
    }
  }

  const unmatchedOnce = rowsByName(
    requireChart(repeatabilityManifest, "one-run-unmatched-by-model"),
  );
  const unmatchedAllFive = rowsByName(
    requireChart(repeatabilityManifest, "stable-unmatched-by-model"),
  );
  const matchedAllFive = rowsByName(
    requireChart(repeatabilityManifest, "stable-matched-by-model"),
  );

  const repeatabilityByConfiguration: ConfigurationRepeatability[] =
    configurations
      .filter(({ type }) => type === "model")
      .map(({ id, name }) => {
        const once = requiredRow(unmatchedOnce, name, "one-run unmatched");
        const stableUnmatched = requiredRow(
          unmatchedAllFive,
          name,
          "stable unmatched",
        );
        const stableMatched = requiredRow(
          matchedAllFive,
          name,
          "stable matched",
        );
        if (once.total !== stableUnmatched.total) {
          throw new Error(`Unmatched denominators differ for ${name}`);
        }
        return {
          configurationId: id,
          configurationName: name,
          uniqueUnmatched: once.total,
          unmatchedOnce: once.count,
          unmatchedAllFive: stableUnmatched.count,
          matchedAllFive: stableMatched.count,
          matchedTotal: stableMatched.total,
        };
      });

  return {
    release: {
      id: "snyk-vulnbench-js-1.0",
      slug: "js-1.0",
      datasetVersion: "1.0.0",
      findingEvidenceUrl: "/data/js-1.0/finding-evidence.json",
    },
    configurations,
    configurationMetrics: publishedEvidence.configurations,
    projects,
    vulnerabilityClasses: [
      ...new Map(
        [
          ...publishedEvidence.coverage.columns,
          ...publishedEvidence.unmatchedCoverage.columns,
        ].map(({ key, label }) => [key, { id: key, label }]),
      ).values(),
    ],
    tasks,
    runs,
    coverage: publishedEvidence.coverage,
    unmatchedCoverage: publishedEvidence.unmatchedCoverage,
    recurrence: publishedEvidence.recurrence,
    repeatabilityByConfiguration,
  };
}
