import { describe, expect, it } from "vitest";
import { js10Release } from "../js-1.0";
import { releaseCatalogSchema } from "../schema";
import { synthetic20Release } from "./synthetic-2.0";

describe("synthetic VulnBench 2.0 validation fixture", () => {
  it("validates beside JS 1.0 without becoming public", () => {
    expect(() =>
      releaseCatalogSchema.parse([js10Release, synthetic20Release]),
    ).not.toThrow();
    expect(synthetic20Release.publicationState).toBe("internal-fixture");
    expect(synthetic20Release.headlineEvidence.kind).toBe("generic");
  });

  it("contains release-specific dimensions and isolated metrics", () => {
    expect(synthetic20Release.dimensions).toContainEqual({
      id: "repository-scale",
      label: "Repository scale",
      scope: "release",
    });
    expect(js10Release.dimensions.map(({ id }) => id)).not.toContain(
      "repository-scale",
    );
    expect(synthetic20Release.metrics.map(({ id }) => id)).toContain(
      "independent-ground-truth-f1",
    );
    expect(js10Release.metrics.map(({ id }) => id)).not.toContain(
      "independent-ground-truth-f1",
    );
  });
});
