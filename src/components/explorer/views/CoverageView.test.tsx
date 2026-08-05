import { readFile } from "node:fs/promises";
import { render, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { loadJs10ExplorerDataset } from "../../../data/explorer/js-1.0";
import type { ExplorerDataset } from "../../../data/explorer/schema";
import { selectExplorerData } from "../selectors";
import { defaultExplorerState } from "../state";
import { CoverageView } from "./CoverageView";

let dataset: ExplorerDataset;

beforeAll(async () => {
  dataset = await loadJs10ExplorerDataset();
});

function renderCoverageValue(value: number | null, omitTask = false) {
  const scopedDataset = structuredClone(dataset);
  const configuration = scopedDataset.configurations[0];
  const project = scopedDataset.projects[0];
  const coverageColumn = scopedDataset.coverage.columns[0];
  if (!configuration || !project || !coverageColumn) {
    throw new Error("Coverage test fixture requires one configuration and project");
  }
  const classId = coverageColumn.key;
  scopedDataset.runs = scopedDataset.runs.map((run) =>
    run.configurationId === configuration.id && run.projectId === project.id
      ? {
          ...run,
          referenceByClass: {
            ...run.referenceByClass,
            [classId]:
              value === null
                ? { found: 0, total: 0 }
                : { found: value * 100, total: 100 },
          },
        }
      : run,
  );
  if (omitTask) {
    scopedDataset.tasks = scopedDataset.tasks.filter(
      (task) =>
        task.configurationId !== configuration.id ||
        task.projectId !== project.id,
    );
  }
  const state = {
    ...defaultExplorerState(),
    view: "coverage" as const,
    metric: "recall" as const,
    configurations: [configuration.id],
    projects: [project.id],
    vulnerabilityClasses: [classId],
  };
  const rendered = render(
    <CoverageView
      dataset={scopedDataset}
      onClearClasses={vi.fn()}
      onPin={vi.fn()}
      selection={selectExplorerData(scopedDataset, state)}
      state={state}
    />,
  );
  const cell = rendered.container.querySelector("td.coverage-cell");
  expect(cell).not.toBeNull();
  return { ...rendered, cell: cell as HTMLTableCellElement };
}

describe("CoverageView heatmap", () => {
  it.each([
    [null, "coverage-cell--not-applicable"],
    [0, "coverage-cell--heatmap-0"],
    [0.01, "coverage-cell--heatmap-1"],
    [0.25, "coverage-cell--heatmap-1"],
    [0.26, "coverage-cell--heatmap-2"],
    [0.5, "coverage-cell--heatmap-2"],
    [0.51, "coverage-cell--heatmap-3"],
    [0.75, "coverage-cell--heatmap-3"],
    [0.76, "coverage-cell--heatmap-4"],
    [1, "coverage-cell--heatmap-4"],
  ] as const)("maps %s to %s", (value, expectedClass) => {
    const { cell, unmount } = renderCoverageValue(value);
    expect(cell).toHaveClass(expectedClass);
    expect(cell).not.toHaveAttribute("style");
    unmount();
  });

  it("keeps measured zero, N/A, and missing states distinct", () => {
    const zero = renderCoverageValue(0);
    expect(zero.cell).toHaveClass("coverage-cell--heatmap-0");
    expect(within(zero.cell).getByText("0%", { exact: true })).toBeVisible();
    zero.unmount();

    const unavailable = renderCoverageValue(null, true);
    expect(unavailable.cell).toHaveClass("coverage-cell--not-applicable");
    expect(
      within(unavailable.cell).getByText("N/A", { exact: true }),
    ).toBeVisible();
    const projectTable = unavailable.container.querySelectorAll("table")[1];
    if (!projectTable) throw new Error("Project matrix table was not rendered");
    expect(
      within(projectTable).getByText("Missing", { exact: true }),
    ).toBeVisible();
  });

  it("does not use a continuous color bypass", async () => {
    const source = await readFile(
      `${process.cwd()}/src/components/explorer/views/CoverageView.tsx`,
      { encoding: "utf8" },
    );

    expect(source).not.toContain("color-mix(");
  });
});
