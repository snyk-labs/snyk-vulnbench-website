import { EvidenceScatter } from "../../evidence/EvidenceScatter";
import type { ExplorerSelection } from "../selectors";
import type { ExplorerState } from "../state";

interface EfficiencyViewProps {
  selection: ExplorerSelection;
  state: ExplorerState;
  onPin: (id: string) => void;
  onRecover: () => void;
}

export function EfficiencyView({
  selection,
  state,
  onPin,
  onRecover,
}: EfficiencyViewProps) {
  const resource = state.efficiencyMetric;
  const points = selection.summaries
    .filter(
      ({ type, costUsd }) =>
        resource === "duration" || (type === "model" && costUsd !== null),
    )
    .map((summary) => ({
      name: summary.name,
      type: summary.type,
      x:
        resource === "cost"
          ? (summary.costUsd ?? 0)
          : resource === "tokens"
            ? summary.tokens
            : summary.durationMs / 1000,
      y: summary.f1,
    }));
  const xLabel =
    resource === "cost"
      ? "Estimated model-session cost"
      : resource === "tokens"
        ? "Average total tokens"
        : "Average duration";
  const xUnit =
    resource === "cost"
      ? ("usd" as const)
      : resource === "tokens"
        ? ("tokens" as const)
        : ("seconds" as const);
  const projectCount = new Set(
    selection.tasks.map(({ projectId }) => projectId),
  ).size;
  const provenance = {
    release: "Snyk VulnBench JS 1.0" as const,
    datasetVersion: "1.0.0" as const,
    aggregation: `Macro average across ${projectCount} ${projectCount === 1 ? "fixture" : "fixtures"} and 5 repetitions`,
    source: "/data/js-1.0/published-evidence.json" as const,
  };

  if (points.length === 0) {
    return (
      <section
        aria-labelledby="efficiency-view-title"
        className="explorer-view"
      >
        <div className="explorer-view__heading">
          <p className="eyebrow">Efficiency</p>
          <h3 id="efficiency-view-title">Resource metric unavailable</h3>
          <p>
            Estimated model-session cost and tokens do not apply to the Snyk
            command reference. Select at least one model configuration or use
            duration.
          </p>
          <button onClick={onRecover} type="button">
            Show model configurations
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="efficiency-view-title" className="explorer-view">
      <div className="explorer-view__heading">
        <p className="eyebrow">Efficiency</p>
        <h3 id="efficiency-view-title">
          Snyk-reference agreement versus {xLabel.toLowerCase()}
        </h3>
        <p>
          Better points move toward the upper-left: higher reference agreement
          with lower resource use.
        </p>
      </div>

      <div className="explorer-pin-list" aria-label="Pin configurations">
        {selection.configurations.map(({ id, name, type }) => (
          <button
            aria-pressed={state.pins.includes(id)}
            disabled={resource !== "duration" && type === "command"}
            key={id}
            onClick={() => onPin(id)}
            title={
              resource !== "duration" && type === "command"
                ? "Model-session resources are not applicable to the command reference"
                : undefined
            }
            type="button"
          >
            {state.pins.includes(id) ? "Unpin" : "Pin"} {name}
          </button>
        ))}
      </div>

      <EvidenceScatter
        caveat={
          resource === "duration"
            ? "Duration reflects small fixtures and the published harness."
            : "Snyk Code has no comparable model-session resource value and is excluded."
        }
        exportFilename={`js-1.0-efficiency-${resource}`}
        interpretation={`Upper-left means higher Snyk-reference agreement and lower ${xLabel.toLowerCase()}.`}
        points={points}
        provenance={provenance}
        title={`${xLabel} versus Snyk-reference F1`}
        xLabel={xLabel}
        xUnit={xUnit}
        yLabel="Snyk-reference F1"
      />
    </section>
  );
}
