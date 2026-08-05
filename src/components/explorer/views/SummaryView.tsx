import { ConfigurationScorecard } from "../../evidence/ConfigurationScorecard";
import { EvidenceScatter } from "../../evidence/EvidenceScatter";
import type { ExplorerDataset } from "../../../data/explorer/schema";
import type { ExplorerSelection } from "../selectors";
import type { ExplorerState } from "../state";
import {
  barChartSvg,
  downloadCsv,
  downloadSvgMarkup,
  toCsv,
} from "../export";

interface SummaryViewProps {
  dataset: ExplorerDataset;
  selection: ExplorerSelection;
  state: ExplorerState;
  onPin: (id: string) => void;
}

export function SummaryView({
  dataset,
  selection,
  state,
  onPin,
}: SummaryViewProps) {
  const agreementVariance = selection.summaries.map((summary) => ({
    name: summary.name,
    type: summary.type,
    x: summary.f1StdDev,
    y: summary.f1,
  }));
  const costQuality = selection.summaries
    .filter(({ type, costUsd }) => type === "model" && costUsd !== null)
    .map((summary) => ({
      name: summary.name,
      type: summary.type,
      x: summary.costUsd ?? 0,
      y: summary.f1,
    }));
  const projectCount = new Set(
    selection.tasks.map(({ projectId }) => projectId),
  ).size;
  const provenance = {
    release: "Snyk VulnBench JS 1.0" as const,
    datasetVersion: "1.0.0" as const,
    aggregation: `Macro average across ${projectCount} ${projectCount === 1 ? "fixture" : "fixtures"} and 5 repetitions`,
    source: "/data/js-1.0/published-evidence.json" as const,
  };

  return (
    <section aria-labelledby="summary-view-title" className="explorer-view">
      <div className="explorer-view__heading">
        <p className="eyebrow">Published default view</p>
        <h3 id="summary-view-title">Configuration summary</h3>
        <p>
          Compare Snyk-reference agreement, repeated-run spread, coverage, and
          resource use under the active project and configuration filters.
        </p>
      </div>

      <div className="explorer-pin-list" aria-label="Pin configurations">
        {selection.configurations.map(({ id, name }) => (
          <button
            aria-pressed={state.pins.includes(id)}
            key={id}
            onClick={() => onPin(id)}
            type="button"
          >
            {state.pins.includes(id) ? "Unpin" : "Pin"} {name}
          </button>
        ))}
      </div>

      <ConfigurationScorecard
        aggregationCaption={`Macro average across ${projectCount} ${projectCount === 1 ? "fixture" : "fixtures"} and 5 repetitions`}
        configurations={selection.summaries}
      />

      {agreementVariance.length > 0 && (
        <div className="explorer-view__chart">
          <EvidenceScatter
            caveat="Reference agreement is not universal vulnerability-detection accuracy."
            exportFilename="js-1.0-agreement-variance"
            interpretation="Upper-left means higher Snyk-reference agreement and lower repeated-run variance."
            points={agreementVariance}
            provenance={provenance}
            title="Agreement versus repeated-run variance"
            xLabel="F1 standard deviation"
            xUnit="percentage-points"
            yLabel="Snyk-reference F1"
          />
        </div>
      )}

      <div className="summary-evidence-grid">
        <div>
          <div className="explorer-view__heading">
            <h3>Headline recurrence</h3>
            <p>
              Stable reference matches contrast with variable unmatched
              reports across identical runs. This release-wide context is not
              changed by active project or configuration filters.
            </p>
          </div>
          <div
            aria-label="Headline recurrence comparison"
            className="summary-recurrence"
            role="img"
          >
            <div>
              <strong>Reference-matched, all five</strong>
              <span>
                <i
                  style={{
                    width: `${(dataset.recurrence.matched.counts[4]! / dataset.recurrence.matched.total) * 100}%`,
                  }}
                />
              </span>
              <small>
                {dataset.recurrence.matched.counts[4]} of{" "}
                {dataset.recurrence.matched.total}
              </small>
            </div>
            <div>
              <strong>Unmatched, only once</strong>
              <span>
                <i
                  style={{
                    width: `${(dataset.recurrence.unmatched.counts[0]! / dataset.recurrence.unmatched.total) * 100}%`,
                  }}
                />
              </span>
              <small>
                {dataset.recurrence.unmatched.counts[0]} of{" "}
                {dataset.recurrence.unmatched.total}
              </small>
            </div>
          </div>
          <div className="explorer-chart-actions">
            <button
              onClick={() =>
                downloadCsv(
                  "js-1.0-summary-recurrence.csv",
                  toCsv(
                    ["Finding group", "Count", "Total"],
                    [
                      [
                        "Reference-matched, all five",
                        dataset.recurrence.matched.counts[4] ?? 0,
                        dataset.recurrence.matched.total,
                      ],
                      [
                        "Unmatched, only once",
                        dataset.recurrence.unmatched.counts[0] ?? 0,
                        dataset.recurrence.unmatched.total,
                      ],
                    ],
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
                  "js-1.0-summary-recurrence.svg",
                  barChartSvg("Headline recurrence", [
                    {
                      label: "Reference-matched, all five",
                      value: dataset.recurrence.matched.counts[4] ?? 0,
                      maximum: dataset.recurrence.matched.total,
                      tone: "matched",
                    },
                    {
                      label: "Unmatched, only once",
                      value: dataset.recurrence.unmatched.counts[0] ?? 0,
                      maximum: dataset.recurrence.unmatched.total,
                      tone: "unmatched",
                    },
                  ]),
                )
              }
              type="button"
            >
              Export recurrence SVG
            </button>
          </div>
        </div>

        <aside className="summary-finding">
          <p className="eyebrow">Operational finding</p>
          <h3>Stable does not mean complete</h3>
          <p>
            On Nightowl, Claude Opus 4.6 High repeated the same 40.0%
            Snyk-reference F1 while missing systematic path-traversal and
            resource-limit opportunities.
          </p>
          <a href="/releases/js-1.0/cases">Inspect representative cases</a>
        </aside>
      </div>

      {costQuality.length > 0 && (
        <div className="explorer-view__chart">
          <EvidenceScatter
            caveat="Costs reflect small fixtures and published model-session assumptions."
            exportFilename="js-1.0-summary-cost-quality"
            interpretation="Upper-left means higher Snyk-reference agreement at lower estimated cost."
            points={costQuality}
            provenance={provenance}
            title="Cost versus Snyk-reference F1"
            xLabel="Estimated model-session cost"
            xUnit="usd"
            yLabel="Snyk-reference F1"
          />
        </div>
      )}
    </section>
  );
}
