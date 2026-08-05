import { describe, expect, it } from "vitest";
import { loadJs10ExplorerDataset } from "./js-1.0";

describe("JS 1.0 explorer dataset", () => {
  it("loads the complete configuration-project matrix", async () => {
    const dataset = await loadJs10ExplorerDataset();

    expect(dataset.release).toEqual({
      id: "snyk-vulnbench-js-1.0",
      slug: "js-1.0",
      datasetVersion: "1.0.0",
    });
    expect(dataset.configurations).toHaveLength(6);
    expect(dataset.projects).toHaveLength(10);
    expect(dataset.vulnerabilityClasses).toHaveLength(19);
    expect(dataset.unmatchedCoverage.columns).toHaveLength(10);
    expect(dataset.unmatchedCoverage.rows).toHaveLength(5);
    expect(dataset.tasks).toHaveLength(60);
    expect(dataset.runs).toHaveLength(300);
    expect(
      new Set(
        dataset.tasks.map(
          ({ projectId, configurationId }) =>
            `${projectId}:${configurationId}`,
        ),
      ).size,
    ).toBe(60);
  });

  it("preserves task metrics and not-applicable command cost", async () => {
    const dataset = await loadJs10ExplorerDataset();

    expect(
      dataset.tasks.find(
        ({ projectId, configurationId }) =>
          projectId === "js-project-nightowl-find-vulns" &&
          configurationId === "opus-4-6-high",
      ),
    ).toMatchObject({
      f1: 0.4,
      f1StdDev: 0,
      repetitions: 5,
    });
    expect(
      dataset.tasks.find(
        ({ projectId, configurationId }) =>
          projectId === "js-project-nightowl-find-vulns" &&
          configurationId === "snyk-code",
      )?.costUsd,
    ).toBeNull();
  });

  it("loads per-configuration repeatability evidence", async () => {
    const dataset = await loadJs10ExplorerDataset();

    expect(dataset.repeatabilityByConfiguration).toHaveLength(5);
    expect(
      dataset.repeatabilityByConfiguration.find(
        ({ configurationId }) => configurationId === "opus-4-6-high",
      ),
    ).toEqual({
      configurationId: "opus-4-6-high",
      configurationName: "Claude Opus 4.6 High",
      uniqueUnmatched: 6,
      unmatchedOnce: 1,
      unmatchedAllFive: 3,
      matchedAllFive: 25,
      matchedTotal: 26,
    });
  });

  it("fails when the source dataset is unavailable", async () => {
    await expect(
      loadJs10ExplorerDataset("/not-a-vulnbench-workspace"),
    ).rejects.toThrow();
  });
});
