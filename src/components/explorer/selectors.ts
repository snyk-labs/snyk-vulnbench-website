import type {
  ExplorerConfiguration,
  ExplorerDataset,
  ExplorerRunObservation,
  ExplorerTaskObservation,
} from "../../data/explorer/schema";
import type { ConfigurationEvidence } from "../../data/releases/js-1.0-source";
import {
  defaultExplorerState,
  type ExplorerSort,
  type ExplorerState,
} from "./state";

export interface ConfigurationSummary extends ConfigurationEvidence {
  id: string;
}

export interface ExplorerSelection {
  configurations: ExplorerConfiguration[];
  tasks: ExplorerTaskObservation[];
  runs: ExplorerRunObservation[];
  summaries: ConfigurationSummary[];
  representedRuns: number;
  activeFilterCount: number;
}

export interface ComparisonRow extends ConfigurationSummary {
  isBaseline: boolean;
  f1Delta: number | null;
  recallDelta: number | null;
  precisionDelta: number | null;
  costDelta: number | null;
  durationDelta: number | null;
  tokensDelta: number | null;
}

const mean = (values: number[]) =>
  values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;

function sampleStandardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
      (values.length - 1),
  );
}

function activeFilterCount(state: ExplorerState) {
  const defaults = defaultExplorerState();
  return (
    state.configurations.length +
    state.projects.length +
    state.vulnerabilityClasses.length +
    (state.includeReference || state.view === "repeatability" ? 0 : 1) +
    (state.findingStatus === defaults.findingStatus ? 0 : 1) +
    (state.recurrenceThreshold === defaults.recurrenceThreshold ? 0 : 1) +
    (state.valueMode === defaults.valueMode ? 0 : 1) +
    (state.efficiencyMetric === defaults.efficiencyMetric ? 0 : 1) +
    (state.metric === defaults.metric ? 0 : 1) +
    (state.aggregation === defaults.aggregation ? 0 : 1)
  );
}

function sortSummaries(
  summaries: ConfigurationSummary[],
  sort: ExplorerSort,
) {
  const [key, direction] = sort.split("-") as [
    "f1" | "recall" | "precision" | "duration" | "cost",
    "asc" | "desc",
  ];
  const value = (summary: ConfigurationSummary) => {
    if (key === "duration") return summary.durationMs;
    if (key === "cost") return summary.costUsd;
    return summary[key];
  };

  return [...summaries].sort((left, right) => {
    const leftValue = value(left);
    const rightValue = value(right);
    if (leftValue === null) return 1;
    if (rightValue === null) return -1;
    return direction === "asc"
      ? leftValue - rightValue
      : rightValue - leftValue;
  });
}

function summarizeFilteredTasks(
  dataset: ExplorerDataset,
  configurations: ExplorerConfiguration[],
  tasks: ExplorerTaskObservation[],
  runs: ExplorerRunObservation[],
  usePublishedAggregates: boolean,
) {
  const publishedByName = new Map(
    dataset.configurationMetrics.map((metric) => [metric.name, metric]),
  );

  return configurations.map((configuration): ConfigurationSummary => {
    if (usePublishedAggregates) {
      const published = publishedByName.get(configuration.name);
      if (!published) {
        throw new Error(`Missing published metrics for ${configuration.name}`);
      }
      return { id: configuration.id, ...published };
    }

    const rows = tasks.filter(
      ({ configurationId }) => configurationId === configuration.id,
    );
    const costs = rows
      .map(({ costUsd }) => costUsd)
      .filter((cost): cost is number => cost !== null);
    const repetitionMeans = [1, 2, 3, 4, 5].map((repetition) =>
      mean(
        runs
          .filter(
            (run) =>
              run.configurationId === configuration.id &&
              run.repetition === repetition,
          )
          .map(({ f1 }) => f1),
      ),
    );
    return {
      id: configuration.id,
      name: configuration.name,
      type: configuration.type,
      f1: mean(rows.map(({ f1 }) => f1)),
      f1StdDev: sampleStandardDeviation(repetitionMeans),
      recall: mean(rows.map(({ recall }) => recall)),
      precision: mean(rows.map(({ precision }) => precision)),
      durationMs: mean(rows.map(({ durationMs }) => durationMs)),
      tokens: mean(rows.map(({ tokens }) => tokens)),
      costUsd: costs.length === 0 ? null : mean(costs),
      repetitions: 5,
    };
  });
}

export function selectExplorerData(
  dataset: ExplorerDataset,
  state: ExplorerState,
): ExplorerSelection {
  const selectedConfigurationIds =
    state.configurations.length === 0
      ? new Set(dataset.configurations.map(({ id }) => id))
      : new Set(state.configurations);
  const selectedProjectIds =
    state.projects.length === 0 ? null : new Set(state.projects);

  const configurations = dataset.configurations.filter(
    ({ id, type }) =>
      selectedConfigurationIds.has(id) &&
      (state.includeReference || type !== "command"),
  );
  const configurationIds = new Set(configurations.map(({ id }) => id));
  const tasks = dataset.tasks.filter(
    ({ configurationId, projectId }) =>
      configurationIds.has(configurationId) &&
      (selectedProjectIds === null || selectedProjectIds.has(projectId)),
  );
  const runs = dataset.runs.filter(
    ({ configurationId, projectId }) =>
      configurationIds.has(configurationId) &&
      (selectedProjectIds === null || selectedProjectIds.has(projectId)),
  );
  const summaries = sortSummaries(
    summarizeFilteredTasks(
      dataset,
      configurations,
      tasks,
      runs,
      state.projects.length === 0,
    ),
    state.sort,
  );

  return {
    configurations,
    tasks,
    runs,
    summaries,
    representedRuns: runs.length,
    activeFilterCount: activeFilterCount(state),
  };
}

export function comparisonRows(
  dataset: ExplorerDataset,
  state: ExplorerState,
  filteredSummaries?: ConfigurationSummary[],
): ComparisonRow[] {
  const configurationById = new Map(
    dataset.configurations.map((configuration) => [
      configuration.id,
      configuration,
    ]),
  );
  const metricsByName = new Map(
    (filteredSummaries ?? dataset.configurationMetrics).map((metrics) => [
      metrics.name,
      metrics,
    ]),
  );
  const pinned = state.pins
    .slice(0, 4)
    .map((id) => {
      const configuration = configurationById.get(id);
      const metrics = configuration
        ? metricsByName.get(configuration.name)
        : undefined;
      return configuration && metrics
        ? ({ id, ...metrics } satisfies ConfigurationSummary)
        : null;
    })
    .filter((row): row is ConfigurationSummary => row !== null);
  const baselineId = state.baseline ?? pinned[0]?.id ?? null;
  const baseline = pinned.find(({ id }) => id === baselineId);

  return pinned.map((row) => ({
    ...row,
    isBaseline: row.id === baselineId,
    f1Delta: baseline ? row.f1 - baseline.f1 : null,
    recallDelta: baseline ? row.recall - baseline.recall : null,
    precisionDelta: baseline ? row.precision - baseline.precision : null,
    costDelta:
      baseline && row.costUsd !== null && baseline.costUsd !== null
        ? row.costUsd - baseline.costUsd
        : null,
    durationDelta: baseline
      ? row.durationMs - baseline.durationMs
      : null,
    tokensDelta: baseline ? row.tokens - baseline.tokens : null,
  }));
}

export function explainEmptySelection(
  dataset: ExplorerDataset,
  state: ExplorerState,
): {
  restrictiveFilters: string[];
  clearableKey: keyof ExplorerState | null;
} {
  const restrictiveFilters: string[] = [];
  if (
    state.configurations.length > 0 &&
    !state.configurations.some((id) =>
      dataset.configurations.some((configuration) => configuration.id === id),
    )
  ) {
    restrictiveFilters.push("configurations");
  }
  if (
    state.projects.length > 0 &&
    !state.projects.some((id) =>
      dataset.projects.some((project) => project.id === id),
    )
  ) {
    restrictiveFilters.push("projects");
  }
  if (
    state.vulnerabilityClasses.length > 0 &&
    !state.vulnerabilityClasses.some((id) =>
      dataset.vulnerabilityClasses.some(
        (vulnerabilityClass) => vulnerabilityClass.id === id,
      ),
    )
  ) {
    restrictiveFilters.push("vulnerabilityClasses");
  }

  return {
    restrictiveFilters,
    clearableKey:
      (restrictiveFilters[0] as keyof ExplorerState | undefined) ?? null,
  };
}
