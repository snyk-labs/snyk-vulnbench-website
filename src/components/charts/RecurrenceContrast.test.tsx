import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getHeadlineEvidence } from "../../data/releases/headline";
import { RecurrenceContrast } from "./RecurrenceContrast";

const evidence = getHeadlineEvidence("js-1.0");

describe("RecurrenceContrast", () => {
  it("gives pointer and keyboard users the same exact values", () => {
    render(<RecurrenceContrast evidence={evidence} />);

    expect(
      screen.getByRole("img", { name: /finding recurrence contrast/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("table", { name: /exact recurrence values/i }),
    ).toHaveTextContent("134 of 158");
    expect(screen.getByText("Dataset 1.0.0")).toBeVisible();
  });

  it("links every observation to a reproducible explorer state", () => {
    render(<RecurrenceContrast evidence={evidence} />);

    expect(screen.getAllByRole("link", { name: /inspect/i })).toHaveLength(3);
    for (const link of screen.getAllByRole("link", { name: /inspect/i })) {
      expect(link).toHaveAttribute(
        "href",
        expect.stringContaining("/releases/js-1.0/explore?"),
      );
    }
  });
});
