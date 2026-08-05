import { describe, expect, it } from "vitest";
import { synthetic20Release } from "./fixtures/synthetic-2.0";
import { js10Release } from "./js-1.0";
import { releaseViewModel } from "./view-model";

describe("shared release view model", () => {
  it("builds navigation, citation, status, data, and view context generically", () => {
    const js10 = releaseViewModel(js10Release);
    const synthetic = releaseViewModel(synthetic20Release);

    expect(js10.links.map(({ label }) => label)).toEqual([
      "Overview",
      "Explore",
      "Methodology",
      "Data",
      "Paper",
      "Publication",
      "GitHub",
    ]);
    expect(synthetic.links.map(({ label }) => label)).toEqual(
      js10.links.map(({ label }) => label),
    );
    expect(synthetic.citation.title).toBe(
      "Synthetic VulnBench 2.0 Validation Fixture",
    );
    expect(synthetic.status.publicationState).toBe("internal-fixture");
    expect(synthetic.availableViews).toEqual([
      "summary",
      "coverage",
      "efficiency",
    ]);
  });

  it("keeps release-specific dimensions and metrics isolated", () => {
    const js10 = releaseViewModel(js10Release);
    const synthetic = releaseViewModel(synthetic20Release);

    expect(synthetic.releaseDimensions.map(({ id }) => id)).toContain(
      "repository-scale",
    );
    expect(js10.releaseDimensions.map(({ id }) => id)).not.toContain(
      "repository-scale",
    );
    expect(synthetic.metrics.map(({ id }) => id)).toContain(
      "repository-risk-score",
    );
    expect(js10.metrics.map(({ id }) => id)).not.toContain(
      "repository-risk-score",
    );
  });
});
