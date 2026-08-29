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
      "Upper-left applies only to the lower observed scatter",
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

  it("distinguishes projected resource estimates from observed benchmark evidence", () => {
    const state = {
      ...defaultExplorerState(),
      view: "efficiency" as const,
    };
    render(
      <ExplorerGuideRail
        activeFilterCount={0}
        representedRuns={300}
        state={state}
      />,
    );

    const guide = screen.getByRole("complementary", { name: "View guide" });
    expect(guide).toHaveTextContent(
      "Projected resource rates apply the complete JS 1.0 release to web-application size references",
    );
    expect(guide).toHaveTextContent(
      "Upper-left applies only to the lower observed scatter",
    );
    expect(guide).toHaveTextContent(
      "upper projection instead plots resource use against application source lines of code",
    );
    expect(guide).toHaveTextContent(
      "Observed evidence below shows measured Snyk-reference agreement",
    );
    expect(guide).toHaveTextContent(
      "linear extrapolation from small JS 1.0 fixtures",
    );
    expect(guide).toHaveTextContent(
      "does not guarantee finding every vulnerability",
    );
  });
});
