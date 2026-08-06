import { useEffect, useMemo, useRef, useState } from "react";
import type { ExplorerDataset } from "../../data/explorer/schema";
import { ComparisonTray } from "./ComparisonTray";
import { ExplorerHeader } from "./ExplorerHeader";
import { ExplorerGuideRail } from "./ExplorerGuideRail";
import { downloadCsv, toCsv } from "./export";
import { FilterRail } from "./FilterRail";
import {
  comparisonRows,
  explainEmptySelection,
  selectExplorerData,
} from "./selectors";
import {
  defaultExplorerState,
  parseExplorerState,
  serializeExplorerState,
  type ExplorerState,
  type ExplorerView,
} from "./state";
import { CoverageView } from "./views/CoverageView";
import { EfficiencyView } from "./views/EfficiencyView";
import { FindingsView } from "./views/FindingsView";
import { RepeatabilityView } from "./views/RepeatabilityView";
import { SummaryView } from "./views/SummaryView";

interface ExplorerAppProps {
  dataset: ExplorerDataset;
  initialSearch: string;
}

const views: Array<{ id: ExplorerView; label: string }> = [
  { id: "summary", label: "Summary" },
  { id: "repeatability", label: "Repeatability" },
  { id: "coverage", label: "Coverage" },
  { id: "efficiency", label: "Efficiency" },
  { id: "findings", label: "Findings" },
];

function stateForView(state: ExplorerState, view: ExplorerView): ExplorerState {
  const defaults = defaultExplorerState();
  const scoreSort =
    state.sort === "f1-desc" ||
    state.sort === "f1-asc" ||
    state.sort === "recall-desc" ||
    state.sort === "precision-desc" ||
    state.sort === "duration-asc" ||
    state.sort === "cost-asc"
      ? state.sort
      : defaults.sort;
  if (view === "repeatability") {
    return {
      ...state,
      view,
      configurations: [],
      includeReference: false,
      projects: [],
      vulnerabilityClasses: [],
      efficiencyMetric: defaults.efficiencyMetric,
      metric: defaults.metric,
      aggregation: defaults.aggregation,
      sort: defaults.sort,
      selectedFinding: null,
    };
  }
  if (view === "coverage") {
    return {
      ...state,
      view,
      findingStatus: defaults.findingStatus,
      recurrenceThreshold: defaults.recurrenceThreshold,
      valueMode: defaults.valueMode,
      efficiencyMetric: defaults.efficiencyMetric,
      aggregation: defaults.aggregation,
      sort: scoreSort,
      selectedFinding: null,
    };
  }
  if (view === "efficiency") {
    return {
      ...state,
      view,
      vulnerabilityClasses: [],
      findingStatus: defaults.findingStatus,
      recurrenceThreshold: defaults.recurrenceThreshold,
      valueMode: defaults.valueMode,
      metric: defaults.metric,
      aggregation: defaults.aggregation,
      sort: scoreSort,
      selectedFinding: null,
    };
  }
  if (view === "findings") {
    return {
      ...state,
      view,
      includeReference: false,
      efficiencyMetric: defaults.efficiencyMetric,
      metric: defaults.metric,
      aggregation: defaults.aggregation,
      sort:
        state.view === "findings" &&
        (state.sort === "recurrence-desc" ||
          state.sort === "recurrence-asc" ||
          state.sort === "project-asc" ||
          state.sort === "configuration-asc" ||
          state.sort === "class-asc")
          ? state.sort
          : "recurrence-desc",
    };
  }
  return {
    ...state,
    view,
    vulnerabilityClasses: [],
    findingStatus: defaults.findingStatus,
    recurrenceThreshold: defaults.recurrenceThreshold,
    valueMode: defaults.valueMode,
    efficiencyMetric: defaults.efficiencyMetric,
    metric: defaults.metric,
    aggregation: defaults.aggregation,
    sort: scoreSort,
    selectedFinding: null,
  };
}

export function ExplorerApp({ dataset, initialSearch }: ExplorerAppProps) {
  const initial = useMemo(
    () => {
      const parsed = parseExplorerState(initialSearch, dataset);
      return {
        ...parsed,
        state: stateForView(parsed.state, parsed.state.view),
      };
    },
    [dataset, initialSearch],
  );
  const [state, setState] = useState<ExplorerState>(initial.state);
  const [ignored, setIgnored] = useState(initial.ignored);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const comparisonTriggerRef = useRef<HTMLButtonElement>(null);

  function restoreFocus(ref: React.RefObject<HTMLButtonElement | null>) {
    window.setTimeout(() => ref.current?.focus(), 0);
  }
  const selection = useMemo(
    () => selectExplorerData(dataset, state),
    [dataset, state],
  );
  const comparisons = useMemo(
    () => comparisonRows(dataset, state, selection.summaries),
    [dataset, selection.summaries, state],
  );

  useEffect(() => {
    if (initialSearch !== "" || window.location.search === "") return;
    const parsed = parseExplorerState(window.location.search, dataset);
    setState(stateForView(parsed.state, parsed.state.view));
    setIgnored(parsed.ignored);
  }, [dataset, initialSearch]);

  useEffect(() => {
    const query = serializeExplorerState(state);
    const next = `${window.location.pathname}?${query}${window.location.hash}`;
    window.history.replaceState({}, "", next);
  }, [state]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(max-width: 63.99rem)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!compact || (!filtersOpen && !comparisonOpen)) return;
    const activeId = filtersOpen
      ? "explorer-filters"
      : "explorer-comparison";
    const activeDialog = document.getElementById(activeId);
    if (!activeDialog) return;
    const backgroundSelector = filtersOpen
      ? ".explorer-header, .explorer-tabs, .explorer-canvas, .comparison-tray, .explorer-mobile-bar"
      : ".explorer-header, .explorer-tabs, .explorer-app__layout, .explorer-mobile-bar";
    const background = [
      ...document.querySelectorAll<HTMLElement>(backgroundSelector),
    ].filter(
      (element) =>
        element !== activeDialog && !element.contains(activeDialog),
    );
    for (const element of background) element.inert = true;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (filtersOpen) {
          setFiltersOpen(false);
          restoreFocus(filterTriggerRef);
        }
        if (comparisonOpen) {
          setComparisonOpen(false);
          restoreFocus(comparisonTriggerRef);
        }
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        ...activeDialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], summary',
        ),
      ].filter((element) => !element.hidden);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      for (const element of background) element.inert = false;
    };
  }, [compact, comparisonOpen, filtersOpen]);

  function updateState(next: ExplorerState) {
    setState(next);
    setIgnored([]);
  }

  function reset() {
    setState(defaultExplorerState());
    setIgnored([]);
    setShareMessage("");
  }

  function togglePin(id: string) {
    setState((current) => {
      if (current.pins.includes(id)) {
        const pins = current.pins.filter((pin) => pin !== id);
        return {
          ...current,
          pins,
          baseline:
            current.baseline === id ? (pins[0] ?? null) : current.baseline,
        };
      }
      if (current.pins.length >= 4) return current;
      const pins = [...current.pins, id].sort();
      return {
        ...current,
        pins,
        baseline: current.baseline ?? id,
      };
    });
    if (!compact) setComparisonOpen(true);
  }

  async function share() {
    const query = serializeExplorerState(state);
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareMessage("Share link copied.");
      } catch {
        setShareMessage(`Copy this URL: ${url}`);
      }
    } else {
      setShareMessage(`Copy this URL: ${url}`);
    }
  }

  function exportFilteredCsv() {
    let headers: string[];
    let rows: Array<Array<string | number | null>>;

    if (state.view === "repeatability") {
      headers = [
        "Finding status",
        "1 of 5",
        "2 of 5",
        "3 of 5",
        "4 of 5",
        "5 of 5",
        "Total signatures",
        "At recurrence threshold",
        "Value mode",
        "Release",
        "Dataset",
      ];
      rows = [
        { status: "Reference-matched", ...dataset.recurrence.matched },
        { status: "Unmatched", ...dataset.recurrence.unmatched },
      ]
        .filter(({ status }) => {
          if (state.findingStatus === "combined") return true;
          return state.findingStatus === "matched"
            ? status === "Reference-matched"
            : status === "Unmatched";
        })
        .map((row) => {
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
            "Snyk VulnBench JS 1.0",
            "1.0.0",
          ];
        });
    } else if (state.view === "coverage") {
      const unmatched = state.metric === "unmatched";
      const matrix = unmatched
        ? dataset.unmatchedCoverage
        : dataset.coverage;
      const classIds =
        state.vulnerabilityClasses.length === 0
          ? new Set(matrix.columns.map(({ key }) => key))
          : new Set(state.vulnerabilityClasses);
      const columns = matrix.columns.filter(({ key }) => classIds.has(key));
      headers = [
        "Artifact",
        "Configuration",
        "Dimension",
        "Metric",
        "Value",
        "Numerator",
        "Denominator",
        "Represented runs",
        "Represented projects",
        "Projects with reports",
        "Release",
        "Dataset",
      ];
      rows = [];
      for (const configuration of selection.configurations) {
        if (unmatched && configuration.type === "command") continue;
        const runs = selection.runs.filter(
          ({ configurationId }) => configurationId === configuration.id,
        );
        for (const column of columns) {
          const eligibleRuns = unmatched
            ? runs
            : runs.filter(
                (run) =>
                  (run.referenceByClass[column.key]?.total ?? 0) > 0,
              );
          const numerator = unmatched
            ? eligibleRuns.reduce(
                (sum, run) =>
                  sum + (run.unmatchedByClass[column.key] ?? 0),
                0,
              )
            : eligibleRuns.reduce(
                (sum, run) =>
                  sum + (run.referenceByClass[column.key]?.found ?? 0),
                0,
              );
          const denominator = unmatched
            ? eligibleRuns.length
            : eligibleRuns.reduce(
                (sum, run) =>
                  sum + (run.referenceByClass[column.key]?.total ?? 0),
                0,
              );
          const value =
            eligibleRuns.length === 0
              ? null
              : unmatched
                ? numerator / eligibleRuns.length
                : eligibleRuns.reduce(
                    (sum, run) =>
                      sum +
                      (run.referenceByClass[column.key]?.found ?? 0) /
                        (run.referenceByClass[column.key]?.total ?? 1),
                    0,
                  ) / eligibleRuns.length;
          rows.push([
            "Vulnerability class matrix",
            configuration.name,
            column.label,
            unmatched
              ? "Average unmatched reports per run"
              : "Mean per-run reference recall",
            value,
            numerator,
            denominator,
            eligibleRuns.length,
            new Set(eligibleRuns.map(({ projectId }) => projectId)).size,
            new Set(
              eligibleRuns
                .filter((run) =>
                  unmatched
                    ? (run.unmatchedByClass[column.key] ?? 0) > 0
                    : (run.referenceByClass[column.key]?.found ?? 0) > 0,
                )
                .map(({ projectId }) => projectId),
            ).size,
            "Snyk VulnBench JS 1.0",
            "1.0.0",
          ]);
        }
      }
      const selectedProjects =
        state.projects.length === 0
          ? dataset.projects
          : dataset.projects.filter(({ id }) => state.projects.includes(id));
      for (const project of selectedProjects) {
        for (const configuration of selection.configurations) {
          const task = selection.tasks.find(
            ({ projectId, configurationId }) =>
              projectId === project.id &&
              configurationId === configuration.id,
          );
          if (!task) continue;
          const pairRuns = selection.runs.filter(
            ({ projectId, configurationId }) =>
              projectId === project.id &&
              configurationId === configuration.id,
          );
          const selectedClassIds =
            state.vulnerabilityClasses.length === 0
              ? dataset.unmatchedCoverage.columns.map(({ key }) => key)
              : state.vulnerabilityClasses.filter((classId) =>
                  dataset.unmatchedCoverage.columns.some(
                    ({ key }) => key === classId,
                  ),
                );
          const unmatchedAvailable = selectedClassIds.length > 0;
          const unmatchedTotal = pairRuns.reduce(
            (sum, run) =>
              sum +
              selectedClassIds.reduce(
                (classSum, classId) =>
                  classSum + (run.unmatchedByClass[classId] ?? 0),
                0,
              ),
            0,
          );
          const value =
            state.metric === "recall"
              ? task.recall
              : state.metric === "repeatability"
                ? task.f1StdDev
                : state.metric === "duration"
                  ? task.durationMs
                  : state.metric === "cost"
                    ? task.costUsd
                    : state.metric === "unmatched"
                      ? unmatchedAvailable
                        ? unmatchedTotal / pairRuns.length
                        : null
                      : task.f1;
          rows.push([
            "Project matrix",
            configuration.name,
            project.name,
            state.metric,
            value,
            state.metric === "unmatched" && unmatchedAvailable
              ? unmatchedTotal
              : null,
            state.metric === "unmatched" && unmatchedAvailable
              ? pairRuns.length
              : null,
            pairRuns.length,
            1,
            state.metric === "unmatched" &&
            unmatchedAvailable &&
            unmatchedTotal > 0
              ? 1
              : null,
            "Snyk VulnBench JS 1.0",
            "1.0.0",
          ]);
        }
      }
    } else if (state.view === "efficiency") {
      const resource = state.efficiencyMetric;
      headers = [
        "Configuration",
        resource === "cost"
          ? "Estimated model-session cost USD"
          : resource === "tokens"
            ? "Average tokens"
            : "Average duration seconds",
        "Snyk-reference F1",
        "Release",
        "Dataset",
      ];
      rows = selection.summaries
        .filter(({ type }) => resource === "duration" || type === "model")
        .map((summary) => [
          summary.name,
          resource === "cost"
            ? summary.costUsd
            : resource === "tokens"
              ? summary.tokens
              : summary.durationMs / 1000,
          summary.f1,
          "Snyk VulnBench JS 1.0",
          "1.0.0",
        ]);
    } else {
      headers = [
        "Configuration",
        "Snyk-reference F1",
        "F1 standard deviation",
        "Reference recall",
        "Reference precision",
        "Average duration ms",
        "Average tokens",
        "Estimated model-session cost USD",
        "Release",
        "Dataset",
      ];
      rows = selection.summaries.map((summary) => [
        summary.name,
        summary.f1,
        summary.f1StdDev,
        summary.recall,
        summary.precision,
        summary.durationMs,
        summary.tokens,
        summary.costUsd,
        "Snyk VulnBench JS 1.0",
        "1.0.0",
      ]);
    }

    downloadCsv(
      `snyk-vulnbench-js-1.0-${state.view}.csv`,
      toCsv(headers, rows),
    );
  }

  function navigateTabs(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentView: ExplorerView,
  ) {
    const currentIndex = views.findIndex(({ id }) => id === currentView);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % views.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + views.length) % views.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = views.length - 1;
    else return;

    event.preventDefault();
    const nextView = views[nextIndex]?.id;
    if (!nextView) return;
    updateState(stateForView(state, nextView));
    const tabs = event.currentTarget.parentElement?.querySelectorAll("button");
    (tabs?.[nextIndex] as HTMLButtonElement | undefined)?.focus();
  }

  const viewLabel =
    views.find(({ id }) => id === state.view)?.label ?? "Summary";
  const activeMetric =
    state.view === "findings"
      ? "Normalized finding signatures"
      : state.view === "repeatability"
      ? "Finding recurrence"
      : state.view === "efficiency"
        ? state.efficiencyMetric
        : state.metric;
  const empty = selection.tasks.length === 0;
  const emptyReason = empty ? explainEmptySelection(dataset, state) : null;

  return (
    <section className="explorer-app">
      <ExplorerHeader
        activeFilterCount={selection.activeFilterCount}
        aggregation={state.aggregation}
        ignored={ignored}
        metric={activeMetric}
        onExport={state.view === "findings" ? null : exportFilteredCsv}
        onReset={reset}
        onShare={share}
        representedRuns={selection.representedRuns}
        shareCardUrl={
          state.view === "findings"
            ? null
            : `/social/js-1.0/${state.view}.svg`
        }
        viewLabel={viewLabel}
      />
      {shareMessage && (
        <p className="explorer-app__share-status" role="status">
          {shareMessage}
        </p>
      )}

      <div aria-label="Explorer views" className="explorer-tabs" role="tablist">
        {views.map(({ id, label }) => (
          <button
            aria-controls={`explorer-view-${id}`}
            aria-selected={state.view === id}
            id={`explorer-tab-${id}`}
            key={id}
            onKeyDown={(event) => navigateTabs(event, id)}
            onClick={() => updateState(stateForView(state, id))}
            role="tab"
            tabIndex={state.view === id ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="explorer-app__layout">
        <FilterRail
          compact={compact}
          dataset={dataset}
          onChange={updateState}
          onClose={() => {
            setFiltersOpen(false);
            restoreFocus(filterTriggerRef);
          }}
          open={filtersOpen}
          state={state}
        />

        <main
          aria-labelledby={`explorer-tab-${state.view}`}
          className="explorer-canvas"
          id={`explorer-view-${state.view}`}
          role="tabpanel"
        >
          {empty ? (
            <section className="explorer-empty">
              <h3>No measurements match this view</h3>
              <p>
                Restrictive filters:{" "}
                {emptyReason?.restrictiveFilters.join(", ") || "configuration"}
                .
              </p>
              <button onClick={reset} type="button">
                Reset all filters
              </button>
            </section>
          ) : state.view === "findings" ? (
            <FindingsView
              evidenceUrl={dataset.release.findingEvidenceUrl}
              onChange={updateState}
              onPin={togglePin}
              state={state}
            />
          ) : state.view === "repeatability" ? (
            <RepeatabilityView
              dataset={dataset}
              onPin={togglePin}
              state={state}
            />
          ) : state.view === "coverage" ? (
            <CoverageView
              dataset={dataset}
              onClearClasses={() =>
                updateState({ ...state, vulnerabilityClasses: [] })
              }
              onPin={togglePin}
              selection={selection}
              state={state}
            />
          ) : state.view === "efficiency" ? (
            <EfficiencyView
              onPin={togglePin}
              onRecover={() =>
                updateState({
                  ...state,
                  configurations: [],
                  includeReference: false,
                })
              }
              selection={selection}
              state={state}
            />
          ) : (
            <SummaryView
              dataset={dataset}
              onPin={togglePin}
              selection={selection}
              state={state}
            />
          )}
        </main>
        <ExplorerGuideRail
          activeFilterCount={selection.activeFilterCount}
          representedRuns={selection.representedRuns}
          state={state}
        />
      </div>

      <ComparisonTray
        compact={compact}
        filterSummary={`${state.projects.length || dataset.projects.length} projects · ${state.vulnerabilityClasses.length || dataset.vulnerabilityClasses.length} vulnerability classes`}
        onBaseline={(baseline) => setState((current) => ({ ...current, baseline }))}
        onClose={() => {
          setComparisonOpen(false);
          restoreFocus(comparisonTriggerRef);
        }}
        onUnpin={togglePin}
        open={comparisonOpen}
        rows={comparisons}
      />

      <div className="explorer-mobile-bar">
        <button
          aria-controls="explorer-filters"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
          ref={filterTriggerRef}
          type="button"
        >
          Filters ({selection.activeFilterCount})
        </button>
        <button
          aria-controls="explorer-comparison"
          aria-expanded={comparisonOpen}
          onClick={() => setComparisonOpen(true)}
          ref={comparisonTriggerRef}
          type="button"
        >
          Compare ({state.pins.length})
        </button>
      </div>

      <style>{`
        .explorer-app {
          --explorer-border: var(--rule-strong);
          color: var(--ink);
        }

        /* snyk-2026-audit:start */
        html[data-design-theme="snyk-2026"][data-theme="light"] .explorer-app,
        html[data-design-theme="snyk-2026"][data-theme="light"] .explorer-canvas,
        html[data-design-theme="snyk-2026"]:not([data-theme]) .explorer-app,
        html[data-design-theme="snyk-2026"]:not([data-theme]) .explorer-canvas {
          background: #030328;
          color: #FFFFFF;
        }
        /* snyk-2026-audit:end */

        .explorer-header {
          display: grid;
          width: min(100%, 98rem);
          padding: var(--space-5);
          margin-inline: auto;
          border-bottom: 1px solid var(--ink);
          background: var(--paper-raised);
          gap: var(--space-4);
        }

        .explorer-header h2 {
          margin-top: 0.2rem;
          font-size: var(--step-2);
        }

        .explorer-header dl {
          display: flex;
          margin: 0;
          gap: var(--space-3) var(--space-5);
          flex-wrap: wrap;
        }

        .explorer-header dl div {
          display: grid;
        }

        .explorer-header dt {
          color: var(--ink-faint);
          font-family: var(--font-mono);
          font-size: 0.66rem;
          text-transform: uppercase;
        }

        .explorer-header dd {
          margin: 0;
          font-family: var(--font-mono);
          font-size: var(--step--1);
          font-weight: 700;
        }

        .explorer-header__actions {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .explorer-header button,
        .explorer-header a,
        .explorer-mobile-bar button {
          display: inline-flex;
          min-height: 2.6rem;
          padding: 0.55rem 0.75rem;
          border: 1px solid var(--ink);
          background: transparent;
          color: var(--ink);
          align-items: center;
          font-size: var(--step--1);
          font-weight: 700;
          text-decoration: none;
        }

        .explorer-header__notice,
        .explorer-app__share-status {
          padding: 0.7rem 1rem;
          margin: 0;
          background: var(--warning-soft);
          color: var(--ink);
          font-size: var(--step--1);
        }

        .explorer-tabs {
          display: flex;
          width: min(100%, 98rem);
          padding-inline: var(--space-4);
          margin-inline: auto;
          border-bottom: 1px solid var(--ink);
          background: var(--paper-muted);
          overflow-x: auto;
        }

        .explorer-tabs button {
          min-height: 3rem;
          padding: 0.65rem 1rem;
          border: 0;
          border-bottom: 0.25rem solid transparent;
          background: transparent;
          color: var(--ink-soft);
          font-weight: 750;
          white-space: nowrap;
        }

        .explorer-tabs button[aria-selected="true"] {
          border-bottom-color: var(--purple);
          color: var(--ink);
        }

        .explorer-app__layout {
          display: grid;
          width: min(100%, 98rem);
          min-width: 0;
          margin-inline: auto;
          gap: 1.25rem;
          grid-template-columns: minmax(0, 1fr);
        }

        .explorer-guide {
          display: none;
        }

        .filter-rail {
          padding: var(--space-4);
          border-right: 1px solid var(--explorer-border);
          background: var(--paper-muted);
        }

        .filter-rail__heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .filter-rail__heading button {
          display: none;
        }

        .filter-rail fieldset,
        .filter-rail details,
        .filter-rail__select {
          display: grid;
          padding: var(--space-3) 0 0;
          margin: var(--space-3) 0 0;
          border: 0;
          border-top: 1px solid var(--rule-strong);
          gap: 0.45rem;
        }

        .filter-rail__notice {
          padding: var(--space-3);
          margin-top: var(--space-3);
          border-left: 0.2rem solid var(--warning);
          background: var(--warning-soft);
          color: var(--ink-soft);
          font-size: 0.75rem;
        }

        .filter-rail legend,
        .filter-rail summary,
        .filter-rail__select {
          font-size: var(--step--1);
          font-weight: 750;
        }

        .filter-rail label:not(.filter-rail__select) {
          display: grid;
          grid-template-columns: 1.5rem 1fr;
          gap: 0.55rem;
          align-items: start;
          font-size: 0.78rem;
          line-height: 1.3;
        }

        .filter-rail input[type="checkbox"],
        .filter-rail input[type="radio"] {
          width: 1.5rem;
          height: 1.5rem;
          margin: 0;
        }

        .filter-rail select {
          width: 100%;
          min-height: 2.5rem;
          padding: 0.35rem;
          border: 1px solid var(--rule-strong);
          background: var(--paper-raised);
        }

        .explorer-canvas {
          min-width: 0;
          padding: var(--space-5);
        }

        .explorer-view {
          display: grid;
          min-width: 0;
          gap: var(--space-6);
          grid-template-columns: minmax(0, 1fr);
        }

        .explorer-view > * {
          min-width: 0;
        }

        .explorer-view__heading {
          display: grid;
          max-width: 52rem;
          gap: var(--space-2);
        }

        .explorer-view__heading h3 {
          font-size: var(--step-2);
        }

        .explorer-view__heading p:last-child {
          color: var(--ink-soft);
        }

        .explorer-view__chart {
          min-width: 0;
        }

        .explorer-pin-list {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .explorer-pin-list button,
        .explorer-table-scroll button {
          min-height: 2.2rem;
          padding: 0.35rem 0.55rem;
          border: 1px solid var(--rule-strong);
          background: var(--paper-raised);
          font-size: 0.72rem;
        }

        .explorer-pin-list button[aria-pressed="true"] {
          border-color: var(--purple);
          background: var(--purple-soft);
        }

        .explorer-table-scroll {
          min-width: 0;
          overflow-x: auto;
          border: 1px solid var(--explorer-border);
        }

        .explorer-table-scroll table {
          width: 100%;
          min-width: 42rem;
          border-collapse: collapse;
          background: var(--paper-raised);
          font-size: var(--step--1);
          text-align: left;
        }

        .explorer-table-scroll th,
        .explorer-table-scroll td {
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid var(--rule);
        }

        .explorer-table-scroll td {
          font-variant-numeric: tabular-nums;
          text-align: right;
        }

        .coverage-cell strong,
        .coverage-cell small {
          display: block;
        }

        .coverage-cell small {
          margin-top: 0.2rem;
          color: var(--ink);
          font-size: 0.62rem;
          white-space: nowrap;
        }

        .explorer-note,
        .explorer-empty {
          padding: var(--space-4);
          border-left: 0.3rem solid var(--warning);
          background: var(--warning-soft);
          color: var(--ink-soft);
        }

        .explorer-chart-actions {
          display: flex;
          gap: var(--space-2);
        }

        .explorer-chart-actions button,
        .explorer-note button,
        .explorer-view__heading button {
          min-height: 2.5rem;
          padding: 0.45rem 0.7rem;
          border: 1px solid var(--ink);
          background: var(--paper-raised);
          color: var(--ink);
          font-weight: 700;
        }

        .finding-detail {
          display: grid;
          padding: var(--space-4);
          border-top: 0.3rem solid var(--purple);
          background: var(--purple-soft);
          gap: var(--space-3);
        }

        .finding-detail dl {
          display: grid;
          margin: 0;
          gap: var(--space-3);
          grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
        }

        .finding-detail dl div {
          display: grid;
        }

        .finding-detail dt {
          color: var(--ink-faint);
          font-family: var(--font-mono);
          font-size: 0.65rem;
          text-transform: uppercase;
        }

        .finding-detail dd {
          margin: 0;
          font-size: var(--step--1);
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .finding-detail > p {
          max-width: 55rem;
          color: var(--ink-soft);
        }

        .finding-detail__actions {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .finding-detail__actions button,
        .finding-detail__actions a {
          display: inline-flex;
          min-height: 2.5rem;
          padding: 0.45rem 0.7rem;
          border: 1px solid var(--ink);
          background: var(--paper-raised);
          color: var(--ink);
          align-items: center;
          font-size: var(--step--1);
          font-weight: 700;
          text-decoration: none;
        }

        .recurrence-visual,
        .repeatability-bars {
          display: grid;
          padding: var(--space-4);
          border: 1px solid var(--explorer-border);
          background: var(--paper-raised);
          gap: var(--space-3);
        }

        .recurrence-visual__group {
          display: grid;
          gap: 0.45rem;
        }

        .recurrence-visual__group > div {
          display: flex;
          min-height: 2rem;
          background: var(--paper-muted);
        }

        .recurrence-visual__group span {
          display: grid;
          min-width: 2rem;
          border-right: 1px solid var(--paper-raised);
          background: var(--matched);
          color: var(--paper-raised);
          font-family: var(--font-mono);
          font-size: 0.65rem;
          place-items: center;
        }

        .recurrence-visual__group:last-child span {
          background: var(--unmatched-soft);
          color: var(--ink);
        }

        .repeatability-bars__configuration {
          display: grid;
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--rule);
          gap: 0.55rem;
          font-size: var(--step--1);
        }

        .repeatability-bars__configuration:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }

        .repeatability-bars__measures {
          display: grid;
          gap: 0.35rem;
        }

        .repeatability-bars__measures > div {
          display: grid;
          grid-template-columns: minmax(10rem, 0.8fr) minmax(10rem, 1.2fr) 5rem;
          gap: 0.55rem;
          align-items: center;
        }

        .repeatability-bars__measures span {
          height: 0.8rem;
          border: 1px solid var(--rule-strong);
          background: var(--paper-muted);
        }

        .repeatability-bars__measures i {
          display: block;
          height: 100%;
          background: var(--matched);
        }

        .repeatability-bars__measures small {
          color: var(--ink-soft);
        }

        .repeatability-bars__measures em {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-style: normal;
          text-align: right;
        }

        .summary-evidence-grid {
          display: grid;
          gap: var(--space-5);
          grid-template-columns: minmax(0, 1.25fr) minmax(16rem, 0.75fr);
        }

        .summary-recurrence {
          display: grid;
          padding: var(--space-4);
          margin-top: var(--space-3);
          border: 1px solid var(--explorer-border);
          background: var(--paper-raised);
          gap: var(--space-4);
        }

        .summary-recurrence > div {
          display: grid;
          gap: 0.35rem;
          grid-template-columns: minmax(12rem, 1fr) minmax(8rem, 1.5fr) 5rem;
          align-items: center;
          font-size: var(--step--1);
        }

        .summary-recurrence span {
          height: 0.8rem;
          border: 1px solid var(--rule-strong);
          background: var(--paper-muted);
        }

        .summary-recurrence i {
          display: block;
          height: 100%;
          background: var(--matched);
        }

        .summary-recurrence > div:last-child i {
          background: var(--unmatched);
        }

        .summary-finding {
          padding: var(--space-4);
          border-top: 0.3rem solid var(--purple);
          background: var(--purple-soft);
          align-self: end;
        }

        .summary-finding h3,
        .summary-finding p:not(.eyebrow),
        .summary-finding a {
          margin-top: var(--space-2);
        }

        .comparison-tray {
          width: min(100%, 98rem);
          padding: var(--space-4);
          margin-inline: auto;
          border-top: 1px solid var(--ink);
          background: var(--paper-raised);
        }

        .comparison-tray__heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .comparison-tray__heading button {
          display: none;
        }

        .comparison-tray__scroll {
          margin-top: var(--space-3);
          overflow-x: auto;
        }

        .comparison-tray__filters {
          margin-top: var(--space-2);
          color: var(--ink-soft);
          font-family: var(--font-mono);
          font-size: 0.7rem;
        }

        .comparison-tray table {
          width: 100%;
          min-width: 62rem;
          border-collapse: collapse;
          font-size: var(--step--1);
          text-align: left;
        }

        .comparison-tray th,
        .comparison-tray td {
          padding: 0.55rem 0.65rem;
          border-bottom: 1px solid var(--rule);
        }

        .comparison-tray__empty {
          color: var(--ink-soft);
        }

        .explorer-mobile-bar {
          display: none;
        }

        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
        }

        @media (min-width: 64rem) {
          .explorer-header {
            grid-template-columns: 0.8fr 1.4fr auto;
            align-items: center;
          }

          .explorer-header__notice {
            grid-column: 1 / -1;
          }

          .explorer-app__layout {
            grid-template-columns: 17rem minmax(0, 62rem);
            justify-content: center;
          }

          .filter-rail {
            position: sticky;
            top: 0;
            max-height: 100vh;
            overflow-y: auto;
            align-self: start;
          }
        }

        @media (min-width: 90rem) {
          .explorer-app__layout {
            grid-template-columns: 17rem minmax(0, 62rem) 16rem;
          }

          .explorer-guide {
            position: sticky;
            top: 0;
            display: grid;
            max-height: 100vh;
            overflow-y: auto;
            align-self: start;
          }
        }

        @media (max-width: 63.99rem) {
          .summary-evidence-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .filter-rail {
            position: fixed;
            z-index: 80;
            inset: 0 auto 0 0;
            width: min(24rem, 92vw);
            overflow-y: auto;
            border-right: 1px solid var(--ink);
            transform: translateX(-105%);
          }

          .filter-rail.is-open {
            transform: translateX(0);
          }

          .filter-rail__heading button,
          .comparison-tray__heading button {
            display: inline-flex;
          }

          .comparison-tray {
            position: fixed;
            z-index: 75;
            right: 0;
            bottom: 0;
            left: 0;
            max-height: 72vh;
            overflow-y: auto;
            transform: translateY(105%);
          }

          .comparison-tray.is-open {
            transform: translateY(0);
          }

          .explorer-mobile-bar {
            position: sticky;
            z-index: 60;
            bottom: 0;
            display: grid;
            padding: 0.55rem;
            border-top: 1px solid var(--ink);
            background: var(--paper-raised);
            gap: 0.55rem;
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 40rem) {
          .explorer-header,
          .explorer-canvas {
            padding: var(--space-4);
          }

          .repeatability-bars__measures > div,
          .summary-recurrence > div {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </section>
  );
}
