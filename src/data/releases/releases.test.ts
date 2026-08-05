import { describe, expect, it } from "vitest";
import {
  currentRelease,
  getReleaseBySlug,
  publicReleases,
  releases,
} from "./index";
import { validationFixtures } from "./fixtures/registry";
import { releaseCatalogSchema, releaseSchema } from "./schema";

describe("release catalog", () => {
  it("exposes JS 1.0 as the current repeatability release", () => {
    expect(currentRelease.slug).toBe("js-1.0");
    expect(currentRelease.publicationState).toBe("public");
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

  it("keeps internal validation fixtures out of the public catalog", () => {
    expect(publicReleases.map(({ slug }) => slug)).toEqual(["js-1.0"]);
    expect(validationFixtures.map(({ slug }) => slug)).toEqual([
      "synthetic-2.0",
    ]);
    expect(getReleaseBySlug("synthetic-2.0")).toBeUndefined();
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
    if (invalidRelease.headlineEvidence.kind !== "repeatability") {
      throw new Error("JS 1.0 must expose repeatability headlines");
    }
    invalidRelease.headlineEvidence.matchedAllFive.numerator = Number.NaN;

    expect(() => releaseSchema.parse(invalidRelease)).toThrow();
  });

  it("validates unique dimensions, assets, and metric lineage", () => {
    expect(currentRelease.dimensions.length).toBeGreaterThan(0);
    expect(currentRelease.assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "published-evidence",
          datasetVersion: "1.0.0",
        }),
      ]),
    );

    const duplicateDimension = structuredClone(currentRelease);
    duplicateDimension.dimensions.push(duplicateDimension.dimensions[0]!);
    expect(() => releaseSchema.parse(duplicateDimension)).toThrow(
      "Dimension IDs must be unique",
    );

    const missingDimensions = structuredClone(currentRelease);
    missingDimensions.dimensions = [];
    expect(() => releaseSchema.parse(missingDimensions)).toThrow();

    const missingAssets = structuredClone(currentRelease);
    missingAssets.assets = [];
    expect(() => releaseSchema.parse(missingAssets)).toThrow();

    const wrongAssetVersion = structuredClone(currentRelease);
    wrongAssetVersion.assets[0]!.datasetVersion = "9.9.9";
    expect(() => releaseSchema.parse(wrongAssetVersion)).toThrow(
      "Asset versions must match the release dataset version",
    );

    const contradictory = structuredClone(currentRelease);
    const lineage = contradictory.compatibility.metricLineage[0]!;
    lineage.compatibleWith = ["same-lineage"];
    lineage.incompatibleWith = ["same-lineage"];
    expect(() => releaseSchema.parse(contradictory)).toThrow(
      "Metric lineage cannot be both compatible and incompatible",
    );
  });
});
