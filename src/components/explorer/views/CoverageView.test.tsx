import { readFile } from "node:fs/promises";
import { render } from "@testing-library/react";
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

describe("CoverageView heatmap", () => {
  it("renders semantic band classes without a continuous color bypass", async () => {
    const state = {
      ...defaultExplorerState(),
      view: "coverage" as const,
      metric: "recall" as const,
    };
    const { container } = render(
      <CoverageView
        dataset={dataset}
        onClearClasses={vi.fn()}
        onPin={vi.fn()}
        selection={selectExplorerData(dataset, state)}
        state={state}
      />,
    );
    const cells = [...container.querySelectorAll("td.coverage-cell")];
    const source = await readFile(
      `${process.cwd()}/src/components/explorer/views/CoverageView.tsx`,
      { encoding: "utf8" },
    );

    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(
        [...cell.classList].some((className) =>
          /^coverage-cell--(?:not-applicable|heatmap-[0-4])$/.test(className),
        ),
      ).toBe(true);
      expect(cell).not.toHaveAttribute("style");
    }
    expect(source).not.toContain("color-mix(");
  });
});
