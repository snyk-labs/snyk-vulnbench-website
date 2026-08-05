import type { ExplorerState } from "./state";

interface ExplorerGuideRailProps {
  state: ExplorerState;
  representedRuns: number;
  activeFilterCount: number;
}

const efficiencyMetric = {
  cost: "Estimated model-session cost",
  tokens: "Average total tokens",
  duration: "Average duration",
} as const;

function viewGuide(state: ExplorerState) {
  if (state.view === "findings") {
    return {
      interpretation:
        "Inspect normalized signatures, recurrence, source location, and the project/configuration context behind aggregate evidence.",
      metric: "Normalized finding signatures",
      caveat:
        "Matched means agreement with the reference set; unmatched findings still require case-level interpretation.",
    };
  }
  if (state.view === "repeatability") {
    return {
      interpretation:
        "Recurrence is published release-wide. Compare how often the same normalized signature returns across five identical runs.",
      metric: "Finding recurrence",
      caveat:
        "Stable reports can still be incomplete, and unmatched does not mean false positive.",
    };
  }
  if (state.view === "coverage") {
    return {
      interpretation:
        "Cells separate measured zero from unavailable evidence and expose numerator, denominator, eligible runs, and project coverage.",
      metric:
        state.metric === "unmatched"
          ? "Average unmatched reports"
          : state.metric === "recall"
            ? "Reference recall"
            : state.metric,
      caveat:
        "Coverage is agreement with the Snyk Code reference set, not universal detection accuracy.",
    };
  }
  if (state.view === "efficiency") {
    return {
      interpretation:
        "Upper-left combines higher agreement with lower resource use. Change the resource axis without changing the agreement definition.",
      metric: efficiencyMetric[state.efficiencyMetric],
      caveat:
        "Cost and token values apply to model sessions; they are not applicable to the command reference.",
    };
  }
  return {
    interpretation:
      "Higher agreement and lower repeated-run variance move toward the upper-left. Use the scorecard for exact values.",
    metric: "Snyk-reference F1",
    caveat:
      "Snyk Code’s 100% row is deterministic reference reproduction, not universal accuracy.",
  };
}

export function ExplorerGuideRail({
  state,
  representedRuns,
  activeFilterCount,
}: ExplorerGuideRailProps) {
  const guide = viewGuide(state);

  return (
    <aside aria-label="View guide" className="explorer-guide">
      <section>
        <p className="eyebrow">How to read this view</p>
        <p>{guide.interpretation}</p>
      </section>

      <section>
        <p className="eyebrow">Active context</p>
        <dl>
          <div>
            <dt>Release</dt>
            <dd>JS 1.0</dd>
          </div>
          <div>
            <dt>Dataset</dt>
            <dd>1.0.0</dd>
          </div>
          <div>
            <dt>Metric</dt>
            <dd>{guide.metric}</dd>
          </div>
          <div>
            <dt>Aggregation</dt>
            <dd>
              {state.aggregation[0]?.toUpperCase()}
              {state.aggregation.slice(1)}
            </dd>
          </div>
          <div>
            <dt>Runs</dt>
            <dd>{representedRuns}</dd>
          </div>
          <div>
            <dt>Filters</dt>
            <dd>{activeFilterCount}</dd>
          </div>
        </dl>
      </section>

      <section>
        <p className="eyebrow">Keep in mind</p>
        <p>{guide.caveat}</p>
      </section>

      <nav aria-label="Go deeper">
        <p className="eyebrow">Go deeper</p>
        <a href="/releases/js-1.0/methodology">Methodology</a>
        <a href="/releases/js-1.0/data">Data and provenance</a>
        <a href="/releases/js-1.0/cases">Representative cases</a>
      </nav>

      <style>{`
        .explorer-guide {
          display: grid;
          padding: var(--space-3);
          border-left: 1px solid var(--rule-strong);
          background: var(--paper-muted);
          gap: var(--space-3);
          align-content: start;
        }

        .explorer-guide section,
        .explorer-guide nav {
          padding: var(--space-3);
          border-top: 0.2rem solid var(--purple);
          background: var(--paper-raised);
        }

        .explorer-guide p:not(.eyebrow) {
          margin-top: var(--space-2);
          color: var(--ink-soft);
          font-size: 0.75rem;
          line-height: 1.5;
        }

        .explorer-guide dl {
          display: grid;
          margin: var(--space-2) 0 0;
          gap: 0.5rem;
        }

        .explorer-guide dl div {
          display: grid;
          gap: 0.05rem;
        }

        .explorer-guide dt {
          color: var(--ink-faint);
          font-family: var(--font-mono);
          font-size: 0.62rem;
          text-transform: uppercase;
        }

        .explorer-guide dd {
          margin: 0;
          font-size: 0.75rem;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .explorer-guide nav {
          display: grid;
          gap: 0.35rem;
        }

        .explorer-guide nav a {
          display: inline-flex;
          min-height: 1.75rem;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 700;
        }
      `}</style>
    </aside>
  );
}
