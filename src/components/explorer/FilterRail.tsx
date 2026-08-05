import type { ExplorerDataset } from "../../data/explorer/schema";
import type { ExplorerState } from "./state";

interface FilterRailProps {
  dataset: ExplorerDataset;
  state: ExplorerState;
  compact: boolean;
  open: boolean;
  onChange: (state: ExplorerState) => void;
  onClose: () => void;
}

function toggledSelection(
  current: string[],
  id: string,
  allIds: string[],
) {
  const selected = new Set(current.length === 0 ? allIds : current);
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  return selected.size === allIds.length ? [] : [...selected].sort();
}

export function FilterRail({
  dataset,
  state,
  compact,
  open,
  onChange,
  onClose,
}: FilterRailProps) {
  const configurationIds = dataset.configurations.map(({ id }) => id);
  const projectIds = dataset.projects.map(({ id }) => id);
  const classIds = dataset.vulnerabilityClasses.map(({ id }) => id);
  const releaseWideRepeatability = state.view === "repeatability";
  const coverageView = state.view === "coverage";
  const efficiencyView = state.view === "efficiency";

  return (
    <aside
      aria-label="Explorer filters"
      aria-modal={compact && open ? true : undefined}
      className={`filter-rail ${open ? "is-open" : ""}`}
      hidden={compact && !open}
      id="explorer-filters"
      role={compact ? "dialog" : undefined}
    >
      <div className="filter-rail__heading">
        <h3>Filters</h3>
        <button autoFocus={compact && open} onClick={onClose} type="button">
          Close filters
        </button>
      </div>

      {releaseWideRepeatability && (
        <p className="filter-rail__notice">
          Repeatability signatures are published release-wide. Configuration,
          project, class, and reference filters are unavailable in this view.
        </p>
      )}

      {!releaseWideRepeatability && <fieldset>
        <legend>Reference</legend>
        <label>
          <input
            checked={state.includeReference}
            onChange={(event) =>
              onChange({
                ...state,
                includeReference: event.currentTarget.checked,
              })
            }
            type="checkbox"
          />
          Include Snyk deterministic reference
        </label>
      </fieldset>}

      {!releaseWideRepeatability && <fieldset>
        <legend>Configurations</legend>
        {dataset.configurations.map(({ id, name }) => (
          <label key={id}>
            <input
              checked={
                state.configurations.length === 0 ||
                state.configurations.includes(id)
              }
              onChange={() =>
                onChange({
                  ...state,
                  configurations: toggledSelection(
                    state.configurations,
                    id,
                    configurationIds,
                  ),
                })
              }
              type="checkbox"
            />
            {name}
          </label>
        ))}
      </fieldset>}

      {!releaseWideRepeatability && <details>
        <summary>Projects ({dataset.projects.length})</summary>
        <fieldset>
          <legend>Benchmark projects</legend>
          {dataset.projects.map(({ id, name }) => (
            <label key={id}>
              <input
                checked={
                  state.projects.length === 0 || state.projects.includes(id)
                }
                onChange={() =>
                  onChange({
                    ...state,
                    projects: toggledSelection(
                      state.projects,
                      id,
                      projectIds,
                    ),
                  })
                }
                type="checkbox"
              />
              {name}
            </label>
          ))}
        </fieldset>
      </details>}

      {coverageView && <details>
        <summary>
          Vulnerability classes ({dataset.vulnerabilityClasses.length})
        </summary>
        <fieldset>
          <legend>Vulnerability classes</legend>
          {dataset.vulnerabilityClasses.map(({ id, label: name }) => (
            <label key={id}>
              <input
                checked={
                  state.vulnerabilityClasses.length === 0 ||
                  state.vulnerabilityClasses.includes(id)
                }
                onChange={() =>
                  onChange({
                    ...state,
                    vulnerabilityClasses: toggledSelection(
                      state.vulnerabilityClasses,
                      id,
                      classIds,
                    ),
                  })
                }
                type="checkbox"
              />
              {name}
            </label>
          ))}
        </fieldset>
      </details>}

      {releaseWideRepeatability && <fieldset>
        <legend>Finding status</legend>
        {(["combined", "matched", "unmatched"] as const).map((status) => (
          <label key={status}>
            <input
              checked={state.findingStatus === status}
              name="finding-status"
              onChange={() => onChange({ ...state, findingStatus: status })}
              type="radio"
            />
            {status[0]?.toUpperCase()}
            {status.slice(1)}
          </label>
        ))}
      </fieldset>}

      {releaseWideRepeatability && <label className="filter-rail__select">
        Recurrence threshold
        <select
          onChange={(event) =>
            onChange({
              ...state,
              recurrenceThreshold: Number(
                event.currentTarget.value,
              ) as ExplorerState["recurrenceThreshold"],
            })
          }
          value={state.recurrenceThreshold}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value} of 5 or more
            </option>
          ))}
        </select>
      </label>}

      {releaseWideRepeatability && <label className="filter-rail__select">
        Value mode
        <select
          onChange={(event) =>
            onChange({
              ...state,
              valueMode: event.currentTarget
                .value as ExplorerState["valueMode"],
            })
          }
          value={state.valueMode}
        >
          <option value="count">Count</option>
          <option value="percentage">Percentage</option>
        </select>
      </label>}

      {efficiencyView && <label className="filter-rail__select">
        Efficiency resource
        <select
          onChange={(event) =>
            onChange({
              ...state,
              efficiencyMetric: event.currentTarget
                .value as ExplorerState["efficiencyMetric"],
            })
          }
          value={state.efficiencyMetric}
        >
          <option value="cost">Estimated cost</option>
          <option value="tokens">Tokens</option>
          <option value="duration">Duration</option>
        </select>
      </label>}

      {coverageView && <label className="filter-rail__select">
        Active metric
        <select
          onChange={(event) =>
            onChange({
              ...state,
              metric: event.currentTarget.value as ExplorerState["metric"],
            })
          }
          value={state.metric}
        >
          <option value="f1">Snyk-reference F1</option>
          <option value="recall">Reference recall</option>
          <option value="unmatched">Unmatched reports</option>
          <option value="repeatability">Repeatability</option>
          <option value="duration">Duration</option>
          <option value="cost">Estimated cost</option>
        </select>
      </label>}

      {coverageView && <label className="filter-rail__select">
        Aggregation
        <select
          onChange={() => onChange({ ...state, aggregation: "mean" })}
          value={state.aggregation}
        >
          <option value="mean">Mean</option>
        </select>
      </label>}

      {!releaseWideRepeatability && <label className="filter-rail__select">
        Sort scorecard
        <select
          onChange={(event) =>
            onChange({
              ...state,
              sort: event.currentTarget.value as ExplorerState["sort"],
            })
          }
          value={state.sort}
        >
          <option value="f1-desc">F1: high to low</option>
          <option value="f1-asc">F1: low to high</option>
          <option value="recall-desc">Recall: high to low</option>
          <option value="precision-desc">Precision: high to low</option>
          <option value="duration-asc">Duration: low to high</option>
          <option value="cost-asc">Cost: low to high</option>
        </select>
      </label>}
    </aside>
  );
}
