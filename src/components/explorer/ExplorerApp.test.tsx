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
  });
});
