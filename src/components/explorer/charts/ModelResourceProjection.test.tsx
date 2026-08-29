import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { loadJs10ExplorerDataset } from "../../../data/explorer/js-1.0";
import {
  deriveResourceProfiles,
  resourceProjectionProvenance,
  type ResourceProfile,
} from "../../../data/explorer/resource-projection";
import { downloadCsv, downloadSvg, serializeSvg } from "../export";
import {
  ModelResourceProjection,
  RESOURCE_PROJECTION_VIEWBOX_WIDTH,
  resourceProjectionLabelBounds,
} from "./ModelResourceProjection";

vi.mock("../export", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../export")>();
  return {
    ...actual,
    downloadCsv: vi.fn(),
    downloadSvg: vi.fn(),
  };
});

let profiles: ResourceProfile[];

beforeAll(async () => {
  const dataset = await loadJs10ExplorerDataset();
  profiles = deriveResourceProfiles(dataset.configurations, dataset.tasks);
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderProjection(
  metric: "cost" | "tokens" | "duration" = "cost",
  selectedConfigurationIds = profiles.map(
    ({ configurationId }) => configurationId,
  ),
) {
  return render(
    <ModelResourceProjection
      metric={metric}
      profiles={profiles}
      selectedConfigurationIds={selectedConfigurationIds}
    />,
  );
}

describe("ModelResourceProjection", () => {
  it("renders cost values, direct labels, provenance, and an exact table", () => {
    renderProjection();

    expect(
      screen.getByRole("heading", {
        name: "Projected model cost by web application size",
      }),
    ).toBeVisible();
    const plot = screen.getByRole("img", {
      name: /Projected model cost by source lines of code/,
    });
    expect(plot).toBeVisible();
    expect(
      plot.querySelectorAll('[y="NaN"], [y1="NaN"], [y2="NaN"]'),
    ).toHaveLength(0);
    expect(
      plot.querySelector('text[data-configuration="opus-4-6-medium"]'),
    ).toHaveTextContent("■ Claude Opus 4.6 Medium");
    expect(
      screen.getByRole("button", {
        name: "Show Mattermost projections",
      }),
    ).toBeVisible();
    const table = screen.getByRole("table", {
      name: "Projected model cost by web application",
    });
    expect(table).toBeVisible();
    expect(table).toHaveTextContent("$432.83");
    expect(screen.getByText("Caveat:").parentElement).toHaveTextContent(
      "small JS 1.0 fixtures",
    );
    expect(
      document.querySelector(".model-resource-projection__provenance"),
    ).toHaveTextContent(resourceProjectionProvenance.datasetVersion);
  });

  it("reserves bounded in-viewBox space for direct endpoint labels", () => {
    renderProjection("cost", ["opus-4-6-medium", "sonnet-4-6-high"]);

    const plot = screen.getByRole("img", {
      name: /Projected model cost by source lines of code/,
    });
    for (const label of within(plot).getAllByTestId("projection-label")) {
      expect(label.getAttribute("x")).not.toBeNull();
      expect(label.getAttribute("x")).not.toBe(String(RESOURCE_PROJECTION_VIEWBOX_WIDTH));
    }
    for (const configurationName of [
      "Claude Opus 4.6 Medium",
      "Claude Sonnet 4.6 High",
    ]) {
      expect(
        resourceProjectionLabelBounds(configurationName, "$1.146/1k SLOC").right,
      ).toBeLessThanOrEqual(RESOURCE_PROJECTION_VIEWBOX_WIDTH);
    }
  });

  it("fills the analysis width while retaining local narrow-screen scrolling", () => {
    const { container } = renderProjection();
    const plotScroll = container.querySelector(
      ".model-resource-projection__plot-scroll",
    );
    expect(plotScroll).toHaveAttribute("tabindex", "0");
    const css = container.querySelector("style")?.textContent ?? "";
    expect(css).toContain(".model-resource-projection__plot-scroll");
    expect(css).toContain("overflow-x: auto");
    const plotCss =
      css.match(/\.model-resource-projection__plot\s*\{(?<rules>[^}]*)\}/u)
        ?.groups?.rules ?? "";
    expect(plotCss).toMatch(/(?:^|\n)\s*width:\s*100%/u);
    expect(plotCss).not.toMatch(/(?:^|\n)\s*width:\s*45rem/u);
    expect(plotCss).toContain("min-width: 45rem");
    expect(css).not.toContain(".evidence-scatter");
  });

  it.each([
    [
      "tokens" as const,
      "Projected model tokens by web application size",
      "355,679,009",
    ],
    [
      "duration" as const,
      "Projected model duration by web application size",
      "188,441.5 s",
    ],
  ])("renders $s projections with exact active-metric values", (
    metric,
    title,
    expectedValue,
  ) => {
    renderProjection(metric);

    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(
      screen.getByRole("table", {
        name: `Projected model ${metric} by web application`,
      }),
    ).toHaveTextContent(expectedValue);
  });

  it("shows command cost as not applicable without a projected plot line", () => {
    renderProjection("cost", ["snyk-code"]);

    expect(
      screen.getByRole("table", {
        name: "Projected model cost by web application",
      }),
    ).toHaveTextContent("N/A");
    expect(
      screen.queryByTestId("projection-line-snyk-code"),
    ).not.toBeInTheDocument();
  });

  it("filters plotted configurations to the selected IDs", () => {
    renderProjection("duration", ["opus-4-6-medium"]);

    expect(screen.getByTestId("projection-line-opus-4-6-medium")).toBeVisible();
    expect(
      screen.queryByTestId("projection-line-opus-4-6-high"),
    ).not.toBeInTheDocument();
  });

  it("selects applications with keyboard controls and announces exact values", () => {
    renderProjection("cost", ["opus-4-6-medium"]);

    const mastodon = screen.getByRole("button", {
      name: "Show Mastodon projections",
    });
    mastodon.focus();
    fireEvent.keyDown(mastodon, { key: "End" });

    const mattermost = screen.getByRole("button", {
      name: "Show Mattermost projections",
    });
    expect(mattermost).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Mattermost");
    expect(screen.getByRole("status")).toHaveTextContent("Projected cost (USD)");
    expect(screen.getByRole("status")).toHaveTextContent("$432.83");
  });

  it("announces the active tokens metric and unit", () => {
    renderProjection("tokens", ["opus-4-6-medium"]);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Projected tokens (tokens)",
    );
    expect(screen.getByRole("status")).toHaveTextContent("76,189,669");
  });

  it("exports projected CSV and self-contained SVG metadata", () => {
    renderProjection("cost", ["opus-4-6-medium"]);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Export projected cost CSV",
      }),
    );
    expect(downloadCsv).toHaveBeenCalledWith(
      "js-1.0-projected-cost.csv",
      expect.stringContaining("Application SLOC"),
    );
    const csv = vi.mocked(downloadCsv).mock.calls[0]?.[1];
    expect(csv).toContain("Mattermost,795858");
    expect(csv).toContain(resourceProjectionProvenance.releaseName);
    expect(csv).toContain(resourceProjectionProvenance.datasetVersion);
    expect(csv).toContain(
      resourceProjectionProvenance.resourceObservationSource,
    );
    expect(csv).toContain("small JS 1.0 fixtures");

    const plot = screen.getByRole("img", {
      name: /Projected model cost by source lines of code/,
    });
    if (!(plot instanceof SVGSVGElement)) {
      throw new Error("Projected SVG fixture missing");
    }
    const serialized = serializeSvg(plot);
    expect(serialized).toContain(resourceProjectionProvenance.releaseName);
    expect(serialized).toContain(resourceProjectionProvenance.datasetVersion);
    expect(serialized).toContain(
      resourceProjectionProvenance.resourceObservationSource,
    );
    expect(serialized).toContain("1,154 SLOC");
    expect(serialized).toContain("small JS 1.0 fixtures");
    expect(serialized).toContain("Mattermost: $432.83");
    expect(serialized).toContain('stroke-dasharray="3 3"');
    expect(serialized).toContain('paint-order="stroke fill"');
    expect(serialized).toContain('stroke-linejoin="round"');
    expect(serialized).toContain('stroke-width="3px"');
    expect(serialized).not.toMatch(/class="[^"]+"/);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Export projected cost SVG",
      }),
    );
    expect(downloadSvg).toHaveBeenCalledWith(
      `${resourceProjectionProvenance.exportFilePrefix}-projected-cost.svg`,
      expect.any(SVGSVGElement),
    );
  });

  it("uses semantic ink for endpoint label text and series color only for its symbol", () => {
    renderProjection("cost", ["opus-4-6-medium"]);

    const label = screen.getByTestId("projection-label");
    expect(label).toHaveAttribute("fill", "var(--ink)");
    expect(label).toHaveAttribute("paint-order", "stroke fill");
    expect(label).toHaveAttribute("stroke", "var(--paper-raised)");
    expect(label).toHaveAttribute("stroke-linejoin", "round");
    expect(label).toHaveAttribute("stroke-width", "3px");
    expect(label.querySelector("tspan")).toHaveAttribute(
      "fill",
      "var(--series-2)",
    );
    expect(label.querySelectorAll("tspan")[1]).not.toHaveAttribute("fill");
  });
});
