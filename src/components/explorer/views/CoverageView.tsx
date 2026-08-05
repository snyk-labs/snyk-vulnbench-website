import type { ExplorerDataset } from "../../../data/explorer/schema";
import {
  barChartSvg,
  downloadCsv,
  downloadSvgMarkup,
  toCsv,
} from "../export";
import type { ExplorerSelection } from "../selectors";
import type { ExplorerState } from "../state";

interface CoverageViewProps {
  dataset: ExplorerDataset;
  selection: ExplorerSelection;
  state: ExplorerState;
  onPin: (id: string) => void;
  onClearClasses: () => void;
}

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

function projectValue(
  task: ExplorerSelection["tasks"][number],
  metric: ExplorerState["metric"],
  runs: ExplorerSelection["runs"],
  classIds: string[],
) {
  if (metric === "recall") return percent.format(task.recall);
  if (metric === "repeatability") {
    return `${(task.f1StdDev * 100).toFixed(1)} pp`;
  }
  if (metric === "duration") return `${(task.durationMs / 1000).toFixed(1)} s`;
  if (metric === "cost") {
    return task.costUsd === null ? "N/A" : `$${task.costUsd.toFixed(3)}`;
  }
  if (metric === "unmatched") {
    if (runs.length === 0) return "Missing";
    if (classIds.length === 0) return "N/A";
    const reports = runs.reduce(
      (sum, run) =>
        sum +
        classIds.reduce(
          (classSum, classId) =>
            classSum + (run.unmatchedByClass[classId] ?? 0),
          0,
        ),
      0,
    );
    return (reports / runs.length).toFixed(2);
  }
  return percent.format(task.f1);
}

export function CoverageView({
  dataset,
  selection,
  state,
  onPin,
  onClearClasses,
}: CoverageViewProps) {
  const unmatched = state.metric === "unmatched";
  const matrix = unmatched ? dataset.unmatchedCoverage : dataset.coverage;
  const selectedNames = new Set(
    selection.configurations.map(({ name }) => name),
  );
  const selectedClasses =
    state.vulnerabilityClasses.length === 0
      ? null
      : new Set(state.vulnerabilityClasses);
  const columns = matrix.columns.filter(
    ({ key }) => selectedClasses === null || selectedClasses.has(key),
  );
  const rows = selection.configurations.filter(
    ({ name, type }) =>
      selectedNames.has(name) && (!unmatched || type === "model"),
  );
  const selectedProjects =
    state.projects.length === 0
      ? dataset.projects
      : dataset.projects.filter(({ id }) => state.projects.includes(id));

  function cellDetails(configurationId: string, classId: string) {
    const runs = selection.runs.filter(
      ({ configurationId: candidate }) => candidate === configurationId,
    );
    if (unmatched) {
      const numerator = runs.reduce(
        (sum, run) => sum + (run.unmatchedByClass[classId] ?? 0),
        0,
      );
      const denominator = runs.length;
      return {
        value: denominator === 0 ? null : numerator / denominator,
        numerator,
        denominator,
        sampleSize: runs.length,
        representedProjects: new Set(runs.map(({ projectId }) => projectId))
          .size,
        projectsWithReports: new Set(
          runs
            .filter((run) => (run.unmatchedByClass[classId] ?? 0) > 0)
            .map(({ projectId }) => projectId),
        ).size,
      };
    }

    const eligibleRuns = runs.filter(
      (run) => (run.referenceByClass[classId]?.total ?? 0) > 0,
    );
    const numerator = eligibleRuns.reduce(
      (sum, run) => sum + (run.referenceByClass[classId]?.found ?? 0),
      0,
    );
    const denominator = eligibleRuns.reduce(
      (sum, run) => sum + (run.referenceByClass[classId]?.total ?? 0),
      0,
    );
    return {
      value:
        eligibleRuns.length === 0
          ? null
          : eligibleRuns.reduce(
              (sum, run) =>
                sum +
                (run.referenceByClass[classId]?.found ?? 0) /
                  (run.referenceByClass[classId]?.total ?? 1),
              0,
            ) / eligibleRuns.length,
      numerator,
      denominator,
      sampleSize: eligibleRuns.length,
      representedProjects: new Set(
        eligibleRuns.map(({ projectId }) => projectId),
      ).size,
      projectsWithReports: new Set(
        eligibleRuns
          .filter((run) => (run.referenceByClass[classId]?.found ?? 0) > 0)
          .map(({ projectId }) => projectId),
      ).size,
    };
  }

  return (
    <section aria-labelledby="coverage-view-title" className="explorer-view">
      <div className="explorer-view__heading">
        <p className="eyebrow">Coverage</p>
        <h3 id="coverage-view-title">
          {unmatched
            ? "Average unmatched reports by vulnerability class"
            : "Reference recall by vulnerability class"}
        </h3>
        <p>
          {unmatched
            ? "Average reports per model run outside the Snyk Code reference set. Unmatched does not mean false positive."
            : "Mean recall against the Snyk Code reference set. Snyk Code is deterministic reference reproduction."}
        </p>
      </div>

      {columns.length === 0 ? (
        <div className="explorer-note">
          <strong>Metric unavailable for the selected classes.</strong>
          <p>
            The active class filters are not represented in this metric’s
            published domain.
          </p>
          <button onClick={onClearClasses} type="button">
            Clear vulnerability-class filters
          </button>
        </div>
      ) : (
        <div className="explorer-table-scroll coverage-matrix" tabIndex={0}>
          <table aria-label="Vulnerability class coverage matrix">
            <thead>
              <tr>
                <th scope="col">Configuration</th>
                {columns.map(({ key, label }) => (
                  <th key={key} scope="col">
                    {label}
                  </th>
                ))}
                <th scope="col">Compare</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((configuration) => (
                <tr key={configuration.name}>
                  <th scope="row">{configuration.name}</th>
                  {columns.map(({ key }) => {
                    const details = cellDetails(configuration.id, key);
                    return (
                      <td
                        className="metric coverage-cell"
                        key={key}
                        style={{
                          backgroundColor:
                            details.value === null
                              ? "var(--paper-muted)"
                              : `color-mix(in srgb, var(--matched) ${Math.round(details.value * 65)}%, var(--paper-raised))`,
                        }}
                      >
                        <strong>
                          {details.value === null
                            ? "N/A"
                            : unmatched
                              ? details.value.toFixed(2)
                              : percent.format(details.value)}
                        </strong>
                        <small>
                          {details.numerator}/{details.denominator} ·{" "}
                          {details.sampleSize} eligible runs ·{" "}
                          {details.representedProjects} represented projects ·{" "}
                          {details.projectsWithReports} with reports
                        </small>
                      </td>
                    );
                  })}
                  <td>
                    <button
                      aria-pressed={state.pins.includes(configuration.id)}
                      onClick={() => onPin(configuration.id)}
                      type="button"
                    >
                      {state.pins.includes(configuration.id) ? "Unpin" : "Pin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="explorer-note">
        <strong>Cell details:</strong> exact numerator/denominator, represented
        runs, and project coverage. Snyk VulnBench JS 1.0 · Dataset 1.0.0 ·
        active project/configuration filters · Source
        benchmark-2026-05-20T23-06-29-348Z.jsonl, validated against the
        published evidence manifests.
      </div>
      <div className="explorer-chart-actions">
        <button
          disabled={columns.length === 0}
          onClick={() =>
            downloadCsv(
              `js-1.0-coverage-${unmatched ? "unmatched" : "recall"}.csv`,
              toCsv(
                [
                  "Configuration",
                  "Vulnerability class",
                  unmatched
                    ? "Average unmatched reports per run"
                    : "Reference recall",
                  "Numerator",
                  "Denominator",
                  "Represented runs",
                  "Represented projects",
                  "Projects with reports",
                ],
                rows.flatMap((configuration) =>
                  columns.map((column) => {
                    const details = cellDetails(
                      configuration.id,
                      column.key,
                    );
                    return [
                      configuration.name,
                      column.label,
                      details.value,
                      details.numerator,
                      details.denominator,
                      details.sampleSize,
                      details.representedProjects,
                      details.projectsWithReports,
                    ];
                  }),
                ),
              ),
            )
          }
          type="button"
        >
          Export coverage CSV
        </button>
        <button
          disabled={columns.length === 0}
          onClick={() =>
            downloadSvgMarkup(
              `js-1.0-coverage-${unmatched ? "unmatched" : "recall"}.svg`,
              barChartSvg(
                unmatched
                  ? "Average unmatched reports by class"
                  : "Reference recall by class",
                rows.flatMap((configuration) =>
                  columns.map((column) => {
                    const value = cellDetails(
                      configuration.id,
                      column.key,
                    ).value;
                    return {
                      label: `${configuration.name} · ${column.label}`,
                      value: value ?? 0,
                      maximum: 1,
                      displayValue:
                        value === null
                          ? "N/A"
                          : unmatched
                            ? value.toFixed(2)
                            : percent.format(value),
                    };
                  }),
                ),
              ),
            )
          }
          type="button"
        >
          Export coverage SVG
        </button>
      </div>

      <div className="explorer-view__heading">
        <h3>Project/task matrix</h3>
        <p>
          Active metric: {state.metric}. Select projects and configurations in
          the filter rail to narrow this matrix.
        </p>
      </div>
      <div className="explorer-table-scroll" tabIndex={0}>
        <table aria-label="Project and configuration metric matrix">
          <thead>
            <tr>
              <th scope="col">Project</th>
              {selection.configurations.map(({ id, name }) => (
                <th key={id} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedProjects.map((project) => (
              <tr key={project.id}>
                <th scope="row">{project.name}</th>
                {selection.configurations.map(({ id }) => {
                  const task = selection.tasks.find(
                    ({ projectId, configurationId }) =>
                      projectId === project.id && configurationId === id,
                  );
                  const pairRuns = selection.runs.filter(
                    ({ projectId, configurationId }) =>
                      projectId === project.id && configurationId === id,
                  );
                  const unmatchedClassIds =
                    state.vulnerabilityClasses.length === 0
                      ? dataset.unmatchedCoverage.columns.map(({ key }) => key)
                      : state.vulnerabilityClasses.filter((classId) =>
                          dataset.unmatchedCoverage.columns.some(
                            ({ key }) => key === classId,
                          ),
                        );
                  return (
                    <td className="metric" key={id}>
                      {task
                        ? projectValue(
                            task,
                            state.metric,
                            pairRuns,
                            unmatchedClassIds,
                          )
                        : "Missing"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
