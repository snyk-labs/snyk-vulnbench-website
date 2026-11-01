import { describe, expect, it } from "vitest";
import {
  currentRelease,
  getReleaseBySlug,
  publicReleases,
  releaseStatusLabel,
  releases,
  requireReleaseBySlug,
} from "./index";
import { validationFixtures } from "./fixtures/registry";
import { js10Release } from "./js-1.0";
import { releaseCatalogSchema, releaseSchema } from "./schema";

describe("release catalog", () => {
  it("exposes Snyk VulnBench 2.0 as the single current release", () => {
    expect(currentRelease.slug).toBe("2.0");
    expect(currentRelease.name).toBe("Snyk VulnBench 2.0");
    expect(currentRelease.publicationState).toBe("public");
    expect(currentRelease.datasetVersion).toBe("2.0.0");
    expect(currentRelease.publishedAt).toBe("2026-10-28");
    expect(releases.filter(({ status }) => status === "current")).toEqual([
      currentRelease,
    ]);
    expect(getReleaseBySlug("2.0")).toBe(currentRelease);
  });

  it("keeps JS 1.0 intact apart from its superseded status", () => {
    const js10 = requireReleaseBySlug("js-1.0");
    expect(js10.status).toBe("superseded");
    expect(js10.studyType).toBe("Repeatability and Snyk-reference agreement");
    expect(js10.evidence).toEqual({
      scans: 300,
      projects: 10,
      configurations: 6,
      repetitions: 5,
    });
    expect(js10.links.github).toBe(
      "https://github.com/snyk-labs/snyk-vulnbench-js-1.0",
    );
    expect(() => requireReleaseBySlug("missing")).toThrow(
      "Unknown release: missing",
    );
  });

  it("labels release status with the catalog's own vocabulary", () => {
    expect(releaseStatusLabel(currentRelease)).toBe("Current release");
    expect(releaseStatusLabel(requireReleaseBySlug("js-1.0"))).toBe(
      "Superseded release",
    );
  });

  it("contains unique stable release identifiers and slugs", () => {
    expect(new Set(releases.map(({ id }) => id)).size).toBe(releases.length);
    expect(new Set(releases.map(({ slug }) => slug)).size).toBe(releases.length);
  });

  it("keeps internal validation fixtures out of the public catalog", () => {
    expect(publicReleases.map(({ slug }) => slug)).toEqual(["2.0", "js-1.0"]);
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
    const invalidRelease = structuredClone(js10Release);
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
    const invalidRelease = structuredClone(js10Release);
    if (invalidRelease.headlineEvidence.kind !== "repeatability") {
      throw new Error("JS 1.0 must expose repeatability headlines");
    }
    invalidRelease.headlineEvidence.matchedAllFive.numerator = Number.NaN;

    expect(() => releaseSchema.parse(invalidRelease)).toThrow();
  });

  it("validates unique dimensions, assets, and metric lineage", () => {
    expect(js10Release.dimensions.length).toBeGreaterThan(0);
    expect(js10Release.assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "published-evidence",
          datasetVersion: "1.0.0",
        }),
      ]),
    );

    const duplicateDimension = structuredClone(js10Release);
    duplicateDimension.dimensions.push(duplicateDimension.dimensions[0]!);
    expect(() => releaseSchema.parse(duplicateDimension)).toThrow(
      "Dimension IDs must be unique",
    );

    const missingDimensions = structuredClone(js10Release);
    missingDimensions.dimensions = [];
    expect(() => releaseSchema.parse(missingDimensions)).toThrow();

    const missingAssets = structuredClone(js10Release);
    missingAssets.assets = [];
    expect(() => releaseSchema.parse(missingAssets)).toThrow();

    const wrongAssetVersion = structuredClone(js10Release);
    wrongAssetVersion.assets[0]!.datasetVersion = "9.9.9";
    expect(() => releaseSchema.parse(wrongAssetVersion)).toThrow(
      "Asset versions must match the release dataset version",
    );

    const contradictory = structuredClone(js10Release);
    const lineage = contradictory.compatibility.metricLineage[0]!;
    lineage.compatibleWith = ["same-lineage"];
    lineage.incompatibleWith = ["same-lineage"];
    expect(() => releaseSchema.parse(contradictory)).toThrow(
      "Metric lineage cannot be both compatible and incompatible",
    );
  });
});
