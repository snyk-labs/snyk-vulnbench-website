import { describe, expect, it } from "vitest";
import { loadJs10PublishedEvidence } from "./js-1.0-source";

describe("JS 1.0 published evidence", () => {
  it("reconstructs the six-configuration scorecard", async () => {
    const evidence = await loadJs10PublishedEvidence();

    expect(evidence.configurations).toHaveLength(6);
    expect(
      evidence.configurations.find(
        ({ name }) => name === "Claude Opus 4.6 Medium",
      ),
    ).toMatchObject({
      type: "model",
      f1: 0.7537982017982017,
      f1StdDev: 0.0024674185437360318,
      recall: 0.6804112554112554,
      precision: 0.9146666666666666,
      durationMs: 27324.159999999996,
      tokens: 51573.72,
      costUsd: 0.06276034999999999,
      repetitions: 5,
    });
    expect(
      evidence.configurations.find(({ name }) => name === "Snyk Code SAST"),
    ).toMatchObject({
      type: "command",
      f1: 1,
      f1StdDev: 0,
      recall: 1,
      precision: 1,
      costUsd: null,
    });
  });

  it("reconstructs featured chart and coverage data", async () => {
    const evidence = await loadJs10PublishedEvidence();

    expect(evidence.agreementVariance).toHaveLength(6);
    expect(evidence.costQuality).toHaveLength(5);
    expect(evidence.coverage.columns).toHaveLength(17);
    expect(evidence.coverage.rows).toHaveLength(6);
    const coverageKeys = evidence.coverage.columns
      .map(({ key }) => key)
      .sort();
    for (const row of evidence.coverage.rows) {
      expect(Object.keys(row.values).sort()).toEqual(coverageKeys);
    }
    expect(
      evidence.largerFixture.rows.find(
        ({ name }) => name === "Claude Opus 4.6 High",
      ),
    ).toMatchObject({
      f1: 0.4,
      stdDev: 0,
      repetitions: 5,
    });
  });

  it("reconstructs the representative case counts", async () => {
    const evidence = await loadJs10PublishedEvidence();

    expect(evidence.cases).toEqual({
      tigerteamSqlDecoyRuns: 25,
      nightowlSqlGapRuns: 25,
      nightowlPathTraversalMisses: 15,
      nightowlResourceLimitMisses: 10,
    });
  });

  it("reconstructs the published recurrence distributions", async () => {
    const evidence = await loadJs10PublishedEvidence();

    expect(evidence.recurrence).toEqual({
      matched: {
        total: 158,
        counts: [9, 8, 3, 4, 134],
      },
      unmatched: {
        total: 161,
        counts: [80, 24, 23, 12, 22],
      },
    });
  });

  it("attaches release provenance to every derived view", async () => {
    const evidence = await loadJs10PublishedEvidence();

    expect(evidence.provenance).toEqual({
      release: "Snyk VulnBench JS 1.0",
      datasetVersion: "1.0.0",
      aggregation: "Macro average across 10 fixtures and 5 repetitions",
      source: "/data/js-1.0/published-evidence.json",
    });
  });

  it("fails when the immutable source manifests are unavailable", async () => {
    await expect(
      loadJs10PublishedEvidence("/not-a-vulnbench-workspace"),
    ).rejects.toThrow();
  });
});
