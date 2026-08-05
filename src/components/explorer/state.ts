import type { ExplorerDataset } from "../../data/explorer/schema";

export type ExplorerView =
  | "summary"
  | "repeatability"
  | "coverage"
  | "efficiency"
  | "findings";
export type FindingStatus = "matched" | "unmatched" | "combined";
export type EfficiencyMetric = "cost" | "tokens" | "duration";
export type ExplorerMetric =
  | "f1"
  | "recall"
  | "unmatched"
  | "repeatability"
  | "duration"
  | "cost";
export type ExplorerSort =
  | "f1-desc"
  | "f1-asc"
  | "recall-desc"
  | "precision-desc"
  | "duration-asc"
  | "cost-asc"
  | "recurrence-desc"
  | "recurrence-asc"
  | "project-asc"
  | "configuration-asc"
  | "class-asc";

export interface ExplorerState {
  version: 1;
  view: ExplorerView;
  configurations: string[];
  includeReference: boolean;
  projects: string[];
  vulnerabilityClasses: string[];
  findingStatus: FindingStatus;
  recurrenceThreshold: 1 | 2 | 3 | 4 | 5;
  valueMode: "count" | "percentage";
  efficiencyMetric: EfficiencyMetric;
  metric: ExplorerMetric;
  aggregation: "mean";
  sort: ExplorerSort;
  pins: string[];
  baseline: string | null;
  selectedFinding: string | null;
}

const views = new Set<ExplorerView>([
  "summary",
  "repeatability",
  "coverage",
  "efficiency",
  "findings",
]);
const findingStatuses = new Set<FindingStatus>([
  "matched",
  "unmatched",
  "combined",
]);
const valueModes = new Set<ExplorerState["valueMode"]>([
  "count",
  "percentage",
]);
const efficiencyMetrics = new Set<EfficiencyMetric>([
  "cost",
  "tokens",
  "duration",
]);
const metrics = new Set<ExplorerMetric>([
  "f1",
  "recall",
  "unmatched",
  "repeatability",
  "duration",
  "cost",
]);
const aggregations = new Set<ExplorerState["aggregation"]>(["mean"]);
const sorts = new Set<ExplorerSort>([
  "f1-desc",
  "f1-asc",
  "recall-desc",
  "precision-desc",
  "duration-asc",
  "cost-asc",
  "recurrence-desc",
  "recurrence-asc",
  "project-asc",
  "configuration-asc",
  "class-asc",
]);
const knownKeys = new Set([
  "v",
  "view",
  "configs",
  "ref",
  "projects",
  "classes",
  "status",
  "recurrence",
  "mode",
  "resource",
  "metric",
  "aggregation",
  "sort",
  "pins",
  "baseline",
  "finding",
]);

export function defaultExplorerState(): ExplorerState {
  return {
    version: 1,
    view: "summary",
    configurations: [],
    includeReference: true,
    projects: [],
    vulnerabilityClasses: [],
    findingStatus: "combined",
    recurrenceThreshold: 1,
    valueMode: "count",
    efficiencyMetric: "cost",
    metric: "f1",
    aggregation: "mean",
    sort: "f1-desc",
    pins: [],
    baseline: null,
    selectedFinding: null,
  };
}

function canonical(values: string[]) {
  return [...new Set(values)].sort();
}

function parseList(
  value: string | null,
  valid: Set<string>,
  key: string,
  ignored: string[],
) {
  if (!value) return [];
  const accepted: string[] = [];
  for (const candidate of value.split(",").filter(Boolean)) {
    if (valid.has(candidate)) accepted.push(candidate);
    else ignored.push(`${key}=${candidate}`);
  }
  return canonical(accepted);
}

function parseEnum<T extends string>(
  value: string | null,
  values: Set<T>,
  fallback: T,
  key: string,
  ignored: string[],
) {
  if (value === null) return fallback;
  if (values.has(value as T)) return value as T;
  ignored.push(`${key}=${value}`);
  return fallback;
}

export function parseExplorerState(
  search: string,
  dataset: ExplorerDataset,
): { state: ExplorerState; ignored: string[] } {
  const params = new URLSearchParams(search.replace(/^\?/, ""));
  const ignored: string[] = [];
  const defaults = defaultExplorerState();
  const configurationIds = new Set(
    dataset.configurations.map(({ id }) => id),
  );
  const projectIds = new Set(dataset.projects.map(({ id }) => id));
  const classIds = new Set(
    dataset.vulnerabilityClasses.map(({ id }) => id),
  );

  for (const [key, value] of params) {
    if (!knownKeys.has(key)) ignored.push(`${key}=${value}`);
  }

  const version = params.get("v");
  if (version !== null && version !== "1") ignored.push(`v=${version}`);

  const ref = params.get("ref");
  let includeReference = defaults.includeReference;
  if (ref === "0") includeReference = false;
  else if (ref === "1" || ref === null) includeReference = true;
  else ignored.push(`ref=${ref}`);

  const pins = parseList(
    params.get("pins"),
    configurationIds,
    "pins",
    ignored,
  );
  const limitedPins = pins.slice(0, 4);
  for (const ignoredPin of pins.slice(4)) {
    ignored.push(`pins=${ignoredPin}`);
  }

  const baselineValue = params.get("baseline");
  let baseline: string | null = null;
  if (baselineValue !== null) {
    if (
      configurationIds.has(baselineValue) &&
      limitedPins.includes(baselineValue)
    ) {
      baseline = baselineValue;
    } else {
      ignored.push(`baseline=${baselineValue}`);
    }
  }

  const findingValue = params.get("finding");
  let selectedFinding: string | null = null;
  if (findingValue !== null) {
    if (/^[a-f0-9]{20}$/.test(findingValue)) {
      selectedFinding = findingValue;
    } else {
      ignored.push(`finding=${findingValue}`);
    }
  }

  const recurrenceValue = params.get("recurrence");
  let recurrenceThreshold = defaults.recurrenceThreshold;
  if (recurrenceValue !== null) {
    const parsed = Number(recurrenceValue);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
      recurrenceThreshold = parsed as ExplorerState["recurrenceThreshold"];
    } else {
      ignored.push(`recurrence=${recurrenceValue}`);
    }
  }

  return {
    state: {
      version: 1,
      view: parseEnum(
        params.get("view"),
        views,
        defaults.view,
        "view",
        ignored,
      ),
      configurations: parseList(
        params.get("configs"),
        configurationIds,
        "configs",
        ignored,
      ),
      includeReference,
      projects: parseList(
        params.get("projects"),
        projectIds,
        "projects",
        ignored,
      ),
      vulnerabilityClasses: parseList(
        params.get("classes"),
        classIds,
        "classes",
        ignored,
      ),
      findingStatus: parseEnum(
        params.get("status"),
        findingStatuses,
        defaults.findingStatus,
        "status",
        ignored,
      ),
      recurrenceThreshold,
      valueMode: parseEnum(
        params.get("mode"),
        valueModes,
        defaults.valueMode,
        "mode",
        ignored,
      ),
      efficiencyMetric: parseEnum(
        params.get("resource"),
        efficiencyMetrics,
        defaults.efficiencyMetric,
        "resource",
        ignored,
      ),
      metric: parseEnum(
        params.get("metric"),
        metrics,
        defaults.metric,
        "metric",
        ignored,
      ),
      aggregation: parseEnum(
        params.get("aggregation"),
        aggregations,
        defaults.aggregation,
        "aggregation",
        ignored,
      ),
      sort: parseEnum(
        params.get("sort"),
        sorts,
        defaults.sort,
        "sort",
        ignored,
      ),
      pins: limitedPins,
      baseline,
      selectedFinding,
    },
    ignored,
  };
}

export function serializeExplorerState(state: ExplorerState): string {
  const defaults = defaultExplorerState();
  const params = new URLSearchParams();
  params.set("v", "1");

  if (state.view !== defaults.view) params.set("view", state.view);
  if (state.configurations.length > 0) {
    params.set("configs", canonical(state.configurations).join(","));
  }
  if (!state.includeReference) params.set("ref", "0");
  if (state.projects.length > 0) {
    params.set("projects", canonical(state.projects).join(","));
  }
  if (state.vulnerabilityClasses.length > 0) {
    params.set("classes", canonical(state.vulnerabilityClasses).join(","));
  }
  if (state.findingStatus !== defaults.findingStatus) {
    params.set("status", state.findingStatus);
  }
  if (state.recurrenceThreshold !== defaults.recurrenceThreshold) {
    params.set("recurrence", String(state.recurrenceThreshold));
  }
  if (state.valueMode !== defaults.valueMode) {
    params.set("mode", state.valueMode);
  }
  if (state.efficiencyMetric !== defaults.efficiencyMetric) {
    params.set("resource", state.efficiencyMetric);
  }
  if (state.metric !== defaults.metric) params.set("metric", state.metric);
  if (state.aggregation !== defaults.aggregation) {
    params.set("aggregation", state.aggregation);
  }
  if (state.sort !== defaults.sort) params.set("sort", state.sort);
  if (state.pins.length > 0) {
    params.set("pins", canonical(state.pins).slice(0, 4).join(","));
  }
  if (state.baseline !== null && state.pins.includes(state.baseline)) {
    params.set("baseline", state.baseline);
  }
  if (state.selectedFinding !== null) {
    params.set("finding", state.selectedFinding);
  }

  return params.toString();
}
