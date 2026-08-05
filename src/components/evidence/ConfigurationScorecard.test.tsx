import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  loadJs10PublishedEvidence,
  type ConfigurationEvidence,
} from "../../data/releases/js-1.0-source";
import { ConfigurationScorecard } from "./ConfigurationScorecard";

let configurations: ConfigurationEvidence[];

beforeAll(async () => {
  configurations = (await loadJs10PublishedEvidence()).configurations;
});

describe("ConfigurationScorecard", () => {
  it("renders all published configuration values and reference semantics", () => {
    render(<ConfigurationScorecard configurations={configurations} />);

    expect(screen.getAllByRole("row")).toHaveLength(7);
    const opusMedium = screen.getByRole("row", {
      name: /Claude Opus 4\.6 Medium/,
    });
    expect(opusMedium).toHaveTextContent("75.4%");
    expect(opusMedium).toHaveTextContent("0.2 pp");
    expect(opusMedium).toHaveTextContent("68.0%");
    expect(opusMedium).toHaveTextContent("91.5%");
    expect(opusMedium).toHaveTextContent("27.3 s");
    expect(opusMedium).toHaveTextContent("51,574");
    expect(opusMedium).toHaveTextContent("$0.063");

    const reference = screen.getByRole("row", { name: /Snyk Code SAST/ });
    expect(reference).toHaveTextContent("Deterministic reference reproduction");
    expect(reference).toHaveTextContent("N/A");
    expect(
      screen.getByText(/not a universal accuracy result/i),
    ).toBeVisible();
  });

  it("sorts every numeric column in both directions", () => {
    render(<ConfigurationScorecard configurations={configurations} />);

    const sortButtons = screen.getAllByRole("button", { name: /^Sort by/ });
    expect(sortButtons).toHaveLength(7);

    const costSort = screen.getByRole("button", {
      name: "Sort by estimated model-session cost",
    });
    fireEvent.click(costSort);
    let rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]!).getByText("Claude Opus 4.7 Max")).toBeVisible();
    expect(within(rows.at(-1)!).getByText("Snyk Code SAST")).toBeVisible();

    fireEvent.click(costSort);
    rows = screen.getAllByRole("row").slice(1);
    expect(
      within(rows[0]!).getByText("Claude Opus 4.6 Medium"),
    ).toBeVisible();
    expect(within(rows.at(-1)!).getByText("Snyk Code SAST")).toBeVisible();

    for (const button of sortButtons.filter((button) => button !== costSort)) {
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
    }
  });
});
