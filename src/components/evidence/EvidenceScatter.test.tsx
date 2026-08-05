import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  loadJs10PublishedEvidence,
  type PublishedEvidence,
} from "../../data/releases/js-1.0-source";
import { EvidenceScatter } from "./EvidenceScatter";

let evidence: PublishedEvidence;

beforeAll(async () => {
  evidence = await loadJs10PublishedEvidence();
});

describe("EvidenceScatter", () => {
  it("renders exact values, provenance, and color-independent markers", () => {
    render(
      <EvidenceScatter
        caveat="Reference agreement is not universal accuracy."
        interpretation="Upper-left means higher agreement and lower variance."
        points={evidence.agreementVariance}
        provenance={evidence.provenance}
        title="Agreement versus repeated-run variance"
        xLabel="F1 standard deviation"
        xUnit="percentage-points"
        yLabel="Snyk-reference F1"
      />,
    );

    const plot = screen.getByRole("img", {
      name: "Agreement versus repeated-run variance",
    });
    expect(plot).toBeVisible();
    expect(
      within(plot).getByText("F1 standard deviation (percentage points)"),
    ).toBeVisible();
    expect(within(plot).getByText("Snyk-reference F1 (%)")).toBeVisible();
    expect(within(plot).getByText("3.5 pp")).toBeVisible();
    expect(within(plot).getByText("100.0%")).toBeVisible();
    expect(screen.getAllByRole("button", { name: /Show details for/ })).toHaveLength(
      6,
    );
    expect(
      new Set(
        screen
          .getAllByTestId("configuration-marker")
          .map((marker) => marker.getAttribute("data-shape")),
      ).size,
    ).toBe(6);
    const expectedSeries = new Map([
      ["Snyk Code SAST", "var(--series-1)"],
      ["Claude Opus 4.6 Medium", "var(--series-2)"],
      ["Claude Opus 4.6 High", "var(--series-3)"],
      ["Claude Opus 4.7 Max", "var(--series-4)"],
      ["Claude Sonnet 4.6 Medium", "var(--series-5)"],
      ["Claude Sonnet 4.6 High", "var(--series-6)"],
    ]);
    for (const [name, color] of expectedSeries) {
      const button = screen.getByRole("button", {
        name: `Show details for ${name}`,
      });
      expect(within(button).getByTestId("configuration-marker")).toHaveStyle({
        color,
      });
    }

    const table = screen.getByRole("table", {
      name: "Agreement versus repeated-run variance exact values",
    });
    expect(table).toHaveTextContent("Claude Opus 4.6 Medium");
    expect(table).toHaveTextContent("0.2 pp");
    expect(table).toHaveTextContent("75.4%");
    expect(screen.getByText(/Dataset 1\.0\.0/)).toBeVisible();
    expect(screen.getByText(/Upper-left/)).toBeVisible();
    expect(screen.getByText(/not universal accuracy/)).toBeVisible();
  });

  it("announces focused point details", () => {
    render(
      <EvidenceScatter
        caveat="Costs use published small-fixture assumptions."
        interpretation="Upper-left means higher agreement and lower cost."
        points={evidence.costQuality}
        provenance={evidence.provenance}
        title="Cost versus Snyk-reference F1"
        xLabel="Estimated model-session cost"
        xUnit="usd"
        yLabel="Snyk-reference F1"
      />,
    );

    fireEvent.focus(
      screen.getByRole("button", {
        name: "Show details for Claude Opus 4.7 Max",
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Claude Opus 4.7 Max",
    );
    expect(screen.getByRole("status")).toHaveTextContent("$0.356");
    expect(screen.getByRole("status")).toHaveTextContent("68.8%");
  });
});
