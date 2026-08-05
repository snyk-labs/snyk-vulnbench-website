import { describe, expect, it } from "vitest";
import { currentRelease, getReleaseBySlug, releases } from "./index";
import { releaseCatalogSchema, releaseSchema } from "./schema";

describe("release catalog", () => {
  it("exposes JS 1.0 as the current repeatability release", () => {
    expect(currentRelease.slug).toBe("js-1.0");
    expect(currentRelease.studyType).toBe(
      "Repeatability and Snyk-reference agreement",
    );
    expect(currentRelease.evidence).toEqual({
      scans: 300,
      projects: 10,
      configurations: 6,
      repetitions: 5,
    });
    expect(getReleaseBySlug("js-1.0")).toBe(currentRelease);
  });

  it("contains unique stable release identifiers and slugs", () => {
    expect(new Set(releases.map(({ id }) => id)).size).toBe(releases.length);
    expect(new Set(releases.map(({ slug }) => slug)).size).toBe(releases.length);
  });

  it("rejects duplicate stable identifiers", () => {
    expect(() =>
      releaseCatalogSchema.parse([currentRelease, currentRelease]),
    ).toThrow("Release IDs and slugs must be unique");
  });

  it("rejects metric definitions without a unit", () => {
    const invalidRelease = structuredClone(currentRelease);
    const firstMetric = invalidRelease.metrics[0];
    if (!firstMetric) {
      throw new Error("Test fixture must define at least one metric");
    }
    invalidRelease.metrics[0] = {
      ...firstMetric,
      unit: "",
    };

    expect(() => releaseSchema.parse(invalidRelease)).toThrow();
  });

  it("rejects non-finite headline values", () => {
    const invalidRelease = structuredClone(currentRelease);
    invalidRelease.headlineEvidence.matchedAllFive.numerator = Number.NaN;

    expect(() => releaseSchema.parse(invalidRelease)).toThrow();
  });
});
