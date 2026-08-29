import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { loadJs10ExplorerDataset } from "../../data/explorer/js-1.0";
import type { ExplorerDataset } from "../../data/explorer/schema";
import { ExplorerApp } from "./ExplorerApp";

let dataset: ExplorerDataset;

beforeAll(async () => {
  dataset = await loadJs10ExplorerDataset();
});

beforeEach(() => {
  window.history.replaceState({}, "", "/releases/js-1.0/explore");
});

describe("ExplorerApp", () => {
  it("renders the published summary and persistent context", () => {
    render(<ExplorerApp dataset={dataset} initialSearch="" />);

    expect(
      screen.getByRole("heading", { name: "JS 1.0 explorer" }),
    ).toBeVisible();
    expect(screen.getAllByText("1.0.0", { exact: true })[0]).toBeVisible();
    expect(screen.getByText("300 represented runs")).toBeVisible();
    expect(screen.getByText("0 active filters")).toBeVisible();
    expect(
      screen.getByRole("tab", { name: "Summary", selected: true }),
    ).toBeVisible();
    expect(
      screen.getByRole("table", { name: /Published configuration scorecard/ }),
    ).toBeVisible();
  });

  it("switches guided views and updates filter context", () => {
    render(<ExplorerApp dataset={dataset} initialSearch="" />);

    fireEvent.click(screen.getByRole("tab", { name: "Repeatability" }));
    expect(
      screen.getByRole("tab", { name: "Repeatability", selected: true }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Finding recurrence" }),
    ).toBeVisible();

    expect(
      screen.queryByRole("checkbox", {
        name: "Include Snyk deterministic reference",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Repeatability signatures are published release-wide/),
    ).toBeVisible();
    expect(screen.getByText("250 represented runs")).toBeVisible();
    expect(screen.getByText("0 active filters")).toBeVisible();
  });

  it("orders combined, projected, and observed efficiency headings and changes both resource displays", () => {
    render(<ExplorerApp dataset={dataset} initialSearch="" />);

    fireEvent.click(screen.getByRole("tab", { name: "Efficiency" }));

    const combined = screen.getByRole("heading", {
      name: "Projected and observed efficiency evidence",
    });
    const projected = screen.getByRole("heading", {
      name: "Projected model cost by web application size",
    });
    const observed = screen.getByRole("heading", {
      name: "Observed Snyk-reference agreement versus estimated model-session cost",
    });
    expect(
      combined.compareDocumentPosition(projected) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      projected.compareDocumentPosition(observed) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    for (const name of [
      "Mastodon",
      "Zulip",
      "WordPress Core",
      "Discourse",
      "Mattermost",
    ]) {
      expect(
        screen.getByRole("button", { name: `Show ${name} projections` }),
      ).toBeVisible();
    }

    fireEvent.change(screen.getByLabelText("Efficiency resource"), {
      target: { value: "tokens" },
    });

    expect(
      screen.getByRole("heading", {
        name: "Projected model tokens by web application size",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Observed Snyk-reference agreement versus average total tokens",
      }),
    ).toBeVisible();
  });

  it("synchronizes duration across both figures and includes the command reference", () => {
    render(<ExplorerApp dataset={dataset} initialSearch="" />);

    fireEvent.click(screen.getByRole("tab", { name: "Efficiency" }));
    fireEvent.change(screen.getByLabelText("Efficiency resource"), {
      target: { value: "duration" },
    });

    expect(
      screen.getByRole("heading", {
        name: "Projected model duration by web application size",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Observed Snyk-reference agreement versus average duration",
      }),
    ).toBeVisible();
    expect(screen.getByTestId("projection-line-snyk-code")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Show details for Snyk Code SAST" }),
    ).toBeVisible();
  });

  it("keeps command cost and tokens not applicable in the projected view", () => {
    render(<ExplorerApp dataset={dataset} initialSearch="" />);

    fireEvent.click(screen.getByRole("tab", { name: "Efficiency" }));

    expect(
      screen.getByRole("table", {
        name: "Projected model cost by web application",
      }),
    ).toHaveTextContent("N/A");

    fireEvent.change(screen.getByLabelText("Efficiency resource"), {
      target: { value: "tokens" },
    });

    expect(
      screen.getByRole("table", {
        name: "Projected model tokens by web application",
      }),
    ).toHaveTextContent("N/A");
  });

  it("preserves the no-model recovery path for unavailable cost", () => {
    render(
      <ExplorerApp
        dataset={dataset}
        initialSearch="?view=efficiency&configs=snyk-code&ref=1"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Resource metric unavailable" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Show model configurations" }),
    );
    expect(
      screen.getByRole("heading", {
        name: "Projected model cost by web application size",
      }),
    ).toBeVisible();
  });

  it("filters projected lines by configuration while retaining release-wide rates after project filtering", () => {
    render(<ExplorerApp dataset={dataset} initialSearch="" />);

    fireEvent.click(screen.getByRole("tab", { name: "Efficiency" }));

    const mediumLabel = () =>
      screen
        .getAllByTestId("projection-label")
        .find((label) =>
          label.textContent?.includes("Claude Opus 4.6 Medium"),
        );
    expect(mediumLabel()).toHaveTextContent("$0.544/1k SLOC");

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Claude Opus 4.6 High" }),
    );
    expect(
      screen.queryByTestId("projection-line-opus-4-6-high"),
    ).not.toBeInTheDocument();
    expect(mediumLabel()).toHaveTextContent("$0.544/1k SLOC");

    fireEvent.click(
      screen.getByRole("checkbox", { name: dataset.projects[0]!.name }),
    );
    expect(mediumLabel()).toHaveTextContent("$0.544/1k SLOC");
  });

  it("pins configurations and selects a baseline", () => {
    render(<ExplorerApp dataset={dataset} initialSearch="" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Pin Claude Opus 4.6 Medium" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Pin Claude Opus 4.7 Max" }),
    );

    const tray = screen.getByRole("region", { name: "Configuration comparison" });
    expect(within(tray).getByText("2 pinned")).toBeVisible();
    fireEvent.click(
      within(tray).getByRole("radio", {
        name: "Use Claude Opus 4.7 Max as baseline",
      }),
    );
    expect(
      within(tray).getByRole("radio", {
        name: "Use Claude Opus 4.7 Max as baseline",
        checked: true,
      }),
    ).toBeVisible();
  });

  it("reports invalid URL values and resets to defaults", () => {
    render(
      <ExplorerApp
        dataset={dataset}
        initialSearch="?view=unknown&configs=retired-model"
      />,
    );

    expect(
      screen.getByText(/Ignored invalid explorer parameters/),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Reset view" }));
    expect(
      screen.queryByText(/Ignored invalid explorer parameters/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("300 represented runs")).toBeVisible();
  });

  it("copies a deterministic share URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    window.history.replaceState({}, "", "/releases/js-1.0/explore");
    render(<ExplorerApp dataset={dataset} initialSearch="" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/releases/js-1.0/explore?v=1"),
    );
    const status = await screen.findByText("Share link copied.", {
      selector: '[role="status"]',
    });
    expect(status).toHaveClass("explorer-app__share-status");
    expect(status).toHaveTextContent("Share link copied.");
  });
});
