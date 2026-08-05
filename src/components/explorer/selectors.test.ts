import { beforeAll, describe, expect, it } from "vitest";
import { loadJs10ExplorerDataset } from "../../data/explorer/js-1.0";
import type { ExplorerDataset } from "../../data/explorer/schema";
import { defaultExplorerState, type ExplorerState } from "./state";
import {
  comparisonRows,
  explainEmptySelection,
  selectExplorerData,
} from "./selectors";

let dataset: ExplorerDataset;

beforeAll(async () => {
  dataset = await loadJs10ExplorerDataset();
});

describe("explorer selectors", () => {
  it("selects the complete published default", () => {
    const selection = selectExplorerData(dataset, defaultExplorerState());

    expect(selection.configurations).toHaveLength(6);
    expect(selection.tasks).toHaveLength(60);
    expect(selection.representedRuns).toBe(300);
    expect(selection.activeFilterCount).toBe(0);
    expect(selection.summaries[0]).toMatchObject({
      name: "Snyk Code SAST",
      f1: 1,
    });
  });

  it("filters configurations and projects while preserving run counts", () => {
    const state: ExplorerState = {
      ...defaultExplorerState(),
      configurations: ["opus-4-6-high", "opus-4-6-medium"],
      projects: ["js-project-nightowl-find-vulns"],
    };
    const selection = selectExplorerData(dataset, state);

    expect(selection.configurations).toHaveLength(2);
    expect(selection.tasks).toHaveLength(2);
    expect(selection.representedRuns).toBe(10);
    expect(selection.activeFilterCount).toBe(3);
    expect(selection.summaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Claude Opus 4.6 High",
          f1: 0.4,
        }),
      ]),
    );
  });

  it("excludes deterministic reference and sorts nullable cost correctly", () => {
    const state: ExplorerState = {
      ...defaultExplorerState(),
      includeReference: false,
      sort: "cost-asc",
    };
    const selection = selectExplorerData(dataset, state);

    expect(selection.configurations).toHaveLength(5);
    expect(selection.tasks).toHaveLength(50);
    expect(selection.representedRuns).toBe(250);
    expect(selection.activeFilterCount).toBe(1);
    expect(selection.summaries[0]?.name).toBe("Claude Opus 4.6 Medium");
    expect(selection.summaries.at(-1)?.type).toBe("model");
  });

  it("computes comparison deltas from the selected baseline", () => {
    const state: ExplorerState = {
      ...defaultExplorerState(),
      pins: ["opus-4-6-medium", "opus-4-7-max", "snyk-code"],
      baseline: "opus-4-6-medium",
    };
    const rows = comparisonRows(dataset, state);

    expect(rows).toHaveLength(3);
    expect(rows.find(({ id }) => id === "opus-4-6-medium")).toMatchObject({
      isBaseline: true,
      f1Delta: 0,
      costDelta: 0,
    });
    expect(rows.find(({ id }) => id === "opus-4-7-max")).toMatchObject({
      isBaseline: false,
      f1Delta: 0.6876156355721573 - 0.7537982017982017,
      costDelta: 0.35590119000000003 - 0.06276034999999999,
    });
    expect(rows.find(({ id }) => id === "snyk-code")?.costDelta).toBeNull();
  });

  it("recomputes filtered repeated-run spread from repetition-level scores", () => {
    const state: ExplorerState = {
      ...defaultExplorerState(),
      configurations: ["sonnet-4-6-medium"],
      projects: [
        "js-project-ironclad-find-vulns",
        "js-project-skylark-find-vulns",
      ],
    };

    const summary = selectExplorerData(dataset, state).summaries[0];

    expect(summary?.f1StdDev).toBeCloseTo(0.0384, 3);
  });

  it("uses filtered summaries for comparison deltas", () => {
    const state: ExplorerState = {
      ...defaultExplorerState(),
      projects: ["js-project-nightowl-find-vulns"],
      pins: ["opus-4-6-high", "opus-4-6-medium"],
      baseline: "opus-4-6-medium",
    };
    const selection = selectExplorerData(dataset, state);
    const rows = comparisonRows(dataset, state, selection.summaries);

    expect(rows.find(({ id }) => id === "opus-4-6-high")).toMatchObject({
      f1: 0.4,
      f1Delta: 0.4 - 0.38545454545454544,
    });
  });

  it("explains empty selections and identifies clearable filters", () => {
    const state: ExplorerState = {
      ...defaultExplorerState(),
      configurations: ["missing-configuration"],
      projects: ["missing-project"],
    };

    expect(explainEmptySelection(dataset, state)).toEqual({
      restrictiveFilters: ["configurations", "projects"],
      clearableKey: "configurations",
    });
  });
});
