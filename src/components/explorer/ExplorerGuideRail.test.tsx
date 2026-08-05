import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultExplorerState } from "./state";
import { ExplorerGuideRail } from "./ExplorerGuideRail";

describe("ExplorerGuideRail", () => {
  it("explains the Summary view and active context", () => {
    render(
      <ExplorerGuideRail
        activeFilterCount={2}
        representedRuns={50}
        state={defaultExplorerState()}
      />,
    );

    const guide = screen.getByRole("complementary", { name: "View guide" });
    expect(guide).toHaveTextContent(
      "Higher agreement and lower repeated-run variance move toward the upper-left.",
    );
    expect(guide).toHaveTextContent("Snyk-reference F1");
    expect(guide).toHaveTextContent("Mean");
    expect(guide).toHaveTextContent("50");
    expect(guide).toHaveTextContent("2");
    expect(
      screen.getByRole("link", { name: "Representative cases" }),
    ).toBeVisible();
  });

  it.each([
    [
      "repeatability",
      "Recurrence is published release-wide",
      "Finding recurrence",
    ],
    [
      "coverage",
      "Cells separate measured zero from unavailable evidence",
      "Reference recall",
    ],
    [
      "efficiency",
      "Upper-left combines higher agreement with lower resource use",
      "Estimated model-session cost",
    ],
  ] as const)("explains the %s view", (view, interpretation, metric) => {
    const state = {
      ...defaultExplorerState(),
      view,
      includeReference: view === "repeatability" ? false : true,
      metric: view === "coverage" ? ("recall" as const) : defaultExplorerState().metric,
    };
    render(
      <ExplorerGuideRail
        activeFilterCount={0}
        representedRuns={view === "repeatability" ? 250 : 300}
        state={state}
      />,
    );

    expect(screen.getByText(interpretation, { exact: false })).toBeVisible();
    expect(screen.getByText(metric, { exact: true })).toBeVisible();
  });
});
