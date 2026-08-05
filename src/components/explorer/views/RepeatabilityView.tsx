import type { ExplorerDataset } from "../../../data/explorer/schema";
import {
  barChartSvg,
  downloadCsv,
  downloadSvgMarkup,
  toCsv,
} from "../export";
import type { ExplorerState } from "../state";

interface RepeatabilityViewProps {
  dataset: ExplorerDataset;
  state: ExplorerState;
  onPin: (id: string) => void;
}

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function RepeatabilityView({
  dataset,
  state,
  onPin,
}: RepeatabilityViewProps) {
  const rows = [
    {
      status: "Reference-matched",
      ...dataset.recurrence.matched,
    },
    {
      status: "Unmatched",
      ...dataset.recurrence.unmatched,
    },
  ].filter(({ status }) => {
    if (state.findingStatus === "combined") return true;
    return state.findingStatus === "matched"
      ? status === "Reference-matched"
      : status === "Unmatched";
  });
  const configurationRows = dataset.repeatabilityByConfiguration.filter(
    ({ configurationId }) =>
      state.configurations.length === 0 ||
      state.configurations.includes(configurationId),
  );

  return (
    <section aria-labelledby="repeatability-view-title" className="explorer-view">
      <div className="explorer-view__heading">
        <p className="eyebrow">Repeated behavior</p>
        <h3 id="repeatability-view-title">Finding recurrence</h3>
        <p>
          Unique normalized signatures grouped by the number of identical runs
          in which they appeared. Threshold: {state.recurrenceThreshold} of 5
          or more.
        </p>
      </div>

      <div
        aria-label="Finding recurrence distribution chart"
        className="recurrence-visual"
        role="img"
      >
        {rows.map((row) => (
          <div className="recurrence-visual__group" key={row.status}>
            <strong>{row.status}</strong>
            <div>
              {row.counts.map((count, index) => (
                <span
                  key={index}
                  style={{ width: `${(count / row.total) * 100}%` }}
                  title={`${row.status}: ${count} of ${row.total} appeared in ${index + 1} of 5 runs`}
                >
                  {index + 1}/5
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="explorer-chart-actions">
        <button
          onClick={() =>
            downloadCsv(
              "js-1.0-recurrence.csv",
              toCsv(
                [
                  "Finding status",
                  "1 of 5",
                  "2 of 5",
                  "3 of 5",
                  "4 of 5",
                  "5 of 5",
                  "Total",
                  `At ${state.recurrenceThreshold} of 5 or more`,
                  "Mode",
                ],
                rows.map((row) => {
                  const values =
                    state.valueMode === "count"
                      ? row.counts
                      : row.counts.map((count) => count / row.total);
                  const thresholdCount = row.counts
                    .slice(state.recurrenceThreshold - 1)
                    .reduce((sum, count) => sum + count, 0);
                  return [
                    row.status,
                    ...values,
                    row.total,
                    state.valueMode === "count"
                      ? thresholdCount
                      : thresholdCount / row.total,
                    state.valueMode,
                  ];
                }),
              ),
            )
          }
          type="button"
        >
          Export recurrence CSV
        </button>
        <button
          onClick={() =>
            downloadSvgMarkup(
              "js-1.0-recurrence.svg",
              barChartSvg(
                "Finding recurrence distribution",
                rows.flatMap((row) =>
                  row.counts.map((count, index) => ({
                    label: `${row.status} · ${index + 1} of 5`,
                    value:
                      state.valueMode === "count"
                        ? count
                        : count / row.total,
                    maximum: state.valueMode === "count" ? row.total : 1,
                    displayValue:
                      state.valueMode === "count"
                        ? `${count}/${row.total}`
                        : percent.format(count / row.total),
                  })),
                ),
              ),
            )
          }
          type="button"
        >
          Export recurrence SVG
        </button>
      </div>

      <div className="explorer-table-scroll" tabIndex={0}>
        <table aria-label="Finding recurrence distribution">
          <thead>
            <tr>
              <th scope="col">Finding status</th>
              {[1, 2, 3, 4, 5].map((value) => (
                <th key={value} scope="col">
                  {value} of 5
                </th>
              ))}
              <th scope="col">At threshold</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const thresholdCount = row.counts
                .slice(state.recurrenceThreshold - 1)
                .reduce((sum, count) => sum + count, 0);
              return (
                <tr key={row.status}>
                  <th scope="row">{row.status}</th>
                  {row.counts.map((count, index) => (
                    <td className="metric" key={index}>
                      {state.valueMode === "count"
                        ? count
                        : percent.format(count / row.total)}
                    </td>
                  ))}
                  <td className="metric">
                    {state.valueMode === "count"
                      ? `${thresholdCount} of ${row.total}`
                      : percent.format(thresholdCount / row.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="explorer-note">
        <strong>Signature definition:</strong> unmatched signatures use task +
        configuration + vulnerability type + file basename + line;
        reference-matched signatures use task + configuration + reference
        finding ID. Unmatched does not mean false positive.
      </div>

      <div className="explorer-view__heading">
        <h3>Configuration repeatability</h3>
        <p>
          Stable reference matches and unmatched reports by model
          configuration.
        </p>
      </div>
      <div
        aria-label="Configuration repeatability bar chart"
        className="repeatability-bars"
        role="img"
      >
        {configurationRows.map((row) => {
          const measures = [
            {
              label: "Unique unmatched",
              value: row.uniqueUnmatched,
              total: row.uniqueUnmatched,
            },
            {
              label: "Unmatched once",
              value: row.unmatchedOnce,
              total: row.uniqueUnmatched,
            },
            {
              label: "Unmatched all five",
              value: row.unmatchedAllFive,
              total: row.uniqueUnmatched,
            },
            {
              label: "Matched all five",
              value: row.matchedAllFive,
              total: row.matchedTotal,
            },
          ];
          return (
            <div className="repeatability-bars__configuration" key={row.configurationId}>
              <strong>{row.configurationName}</strong>
              <div className="repeatability-bars__measures">
                {measures.map((measure) => (
                  <div key={measure.label}>
                    <small>{measure.label}</small>
                    <span>
                      <i
                        style={{
                          width: `${(measure.value / measure.total) * 100}%`,
                        }}
                      />
                    </span>
                    <em>
                      {state.valueMode === "count"
                        ? `${measure.value}/${measure.total}`
                        : percent.format(measure.value / measure.total)}
                    </em>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="explorer-chart-actions">
        <button
          onClick={() =>
            downloadCsv(
              "js-1.0-configuration-repeatability.csv",
              toCsv(
                [
                  "Configuration",
                  "Unique unmatched",
                  "Unmatched once",
                  "Unmatched all five",
                  "Matched all five",
                  "Matched total",
                  "Mode",
                ],
                configurationRows.map((row) => [
                  row.configurationName,
                  state.valueMode === "count" ? row.uniqueUnmatched : 1,
                  state.valueMode === "count"
                    ? row.unmatchedOnce
                    : row.unmatchedOnce / row.uniqueUnmatched,
                  state.valueMode === "count"
                    ? row.unmatchedAllFive
                    : row.unmatchedAllFive / row.uniqueUnmatched,
                  state.valueMode === "count"
                    ? row.matchedAllFive
                    : row.matchedAllFive / row.matchedTotal,
                  row.matchedTotal,
                  state.valueMode,
                ]),
              ),
            )
          }
          type="button"
        >
          Export configuration CSV
        </button>
        <button
          onClick={() =>
            downloadSvgMarkup(
              "js-1.0-configuration-repeatability.svg",
              barChartSvg(
                "Configuration repeatability",
                configurationRows.flatMap((row) =>
                  [
                    {
                      label: "unique unmatched",
                      value: row.uniqueUnmatched,
                      total: row.uniqueUnmatched,
                    },
                    {
                      label: "unmatched once",
                      value: row.unmatchedOnce,
                      total: row.uniqueUnmatched,
                    },
                    {
                      label: "unmatched all five",
                      value: row.unmatchedAllFive,
                      total: row.uniqueUnmatched,
                    },
                    {
                      label: "matched all five",
                      value: row.matchedAllFive,
                      total: row.matchedTotal,
                    },
                  ].map((measure) => ({
                    label: `${row.configurationName} · ${measure.label}`,
                    value:
                      state.valueMode === "count"
                        ? measure.value
                        : measure.value / measure.total,
                    maximum:
                      state.valueMode === "count" ? measure.total : 1,
                    displayValue:
                      state.valueMode === "count"
                        ? `${measure.value}/${measure.total}`
                        : percent.format(measure.value / measure.total),
                  })),
                ),
              ),
            )
          }
          type="button"
        >
          Export configuration SVG
        </button>
      </div>
      <div className="explorer-table-scroll" tabIndex={0}>
        <table aria-label="Configuration repeatability values">
          <thead>
            <tr>
              <th scope="col">Configuration</th>
              <th scope="col">Unique unmatched</th>
              <th scope="col">Unmatched once</th>
              <th scope="col">Unmatched all five</th>
              <th scope="col">Matched all five</th>
              <th scope="col">Compare</th>
            </tr>
          </thead>
          <tbody>
            {configurationRows.map((row) => (
                <tr key={row.configurationId}>
                  <th scope="row">{row.configurationName}</th>
                  <td className="metric">
                    {state.valueMode === "count"
                      ? row.uniqueUnmatched
                      : percent.format(1)}
                  </td>
                  <td className="metric">
                    {state.valueMode === "count"
                      ? row.unmatchedOnce
                      : percent.format(
                          row.unmatchedOnce / row.uniqueUnmatched,
                        )}
                  </td>
                  <td className="metric">
                    {state.valueMode === "count"
                      ? row.unmatchedAllFive
                      : percent.format(
                          row.unmatchedAllFive / row.uniqueUnmatched,
                        )}
                  </td>
                  <td className="metric">
                    {state.valueMode === "count"
                      ? `${row.matchedAllFive} of ${row.matchedTotal}`
                      : percent.format(row.matchedAllFive / row.matchedTotal)}
                  </td>
                  <td>
                    <button
                      aria-pressed={state.pins.includes(row.configurationId)}
                      onClick={() => onPin(row.configurationId)}
                      type="button"
                    >
                      {state.pins.includes(row.configurationId)
                        ? "Unpin"
                        : "Pin"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
