import { beforeAll, describe, expect, it } from "vitest";
import { loadJs10ExplorerDataset } from "../../data/explorer/js-1.0";
import type { ExplorerDataset } from "../../data/explorer/schema";
import {
  defaultExplorerState,
  parseExplorerState,
  serializeExplorerState,
} from "./state";

let dataset: ExplorerDataset;

beforeAll(async () => {
  dataset = await loadJs10ExplorerDataset();
});

describe("explorer URL state", () => {
  it("uses the published summary defaults", () => {
    expect(parseExplorerState("", dataset)).toEqual({
      state: defaultExplorerState(),
      ignored: [],
    });
    expect(serializeExplorerState(defaultExplorerState())).toBe("v=1");
  });

  it("round-trips deterministic human-safe state", () => {
    const search =
      "pins=sonnet-4-6-high%2Copus-4-6-medium&view=efficiency&resource=tokens&configs=opus-4-6-medium%2Csonnet-4-6-high&projects=js-project-nightowl-find-vulns&ref=0&baseline=opus-4-6-medium&v=1";
    const parsed = parseExplorerState(search, dataset);

    expect(parsed.ignored).toEqual([]);
    expect(serializeExplorerState(parsed.state)).toBe(
      "v=1&view=efficiency&configs=opus-4-6-medium%2Csonnet-4-6-high&ref=0&projects=js-project-nightowl-find-vulns&resource=tokens&pins=opus-4-6-medium%2Csonnet-4-6-high&baseline=opus-4-6-medium",
    );
    expect(
      parseExplorerState(serializeExplorerState(parsed.state), dataset).state,
    ).toEqual(parsed.state);
  });

  it("restores valid values and reports ignored parameters", () => {
    const parsed = parseExplorerState(
      "v=99&view=unknown&configs=opus-4-6-medium%2Cretired-model&projects=missing-project&classes=sql-injection%2Cunknown-class&status=invalid&recurrence=9&mode=wat&resource=wat&metric=wat&aggregation=median&pins=opus-4-6-medium%2Copus-4-6-high%2Copus-4-7-max%2Csonnet-4-6-medium%2Csonnet-4-6-high&baseline=retired-model&surprise=yes",
      dataset,
    );

    expect(parsed.state).toMatchObject({
      version: 1,
      view: "summary",
      configurations: ["opus-4-6-medium"],
      projects: [],
      vulnerabilityClasses: ["sql-injection"],
      findingStatus: "combined",
      recurrenceThreshold: 1,
      valueMode: "count",
      efficiencyMetric: "cost",
      metric: "f1",
      aggregation: "mean",
      pins: [
        "opus-4-6-high",
        "opus-4-6-medium",
        "opus-4-7-max",
        "sonnet-4-6-high",
      ],
      baseline: null,
    });
    expect(parsed.ignored).toEqual(
      expect.arrayContaining([
        "v=99",
        "view=unknown",
        "configs=retired-model",
        "projects=missing-project",
        "classes=unknown-class",
        "status=invalid",
        "recurrence=9",
        "mode=wat",
        "resource=wat",
        "metric=wat",
        "aggregation=median",
        "pins=sonnet-4-6-medium",
        "baseline=retired-model",
        "surprise=yes",
      ]),
    );
  });

  it("canonicalizes arrays and limits pins to four", () => {
    const parsed = parseExplorerState(
      "pins=sonnet-4-6-high%2Copus-4-6-medium%2Copus-4-6-high%2Copus-4-7-max%2Csonnet-4-6-medium&configs=sonnet-4-6-high%2Copus-4-6-medium%2Copus-4-6-medium",
      dataset,
    );

    expect(parsed.state.configurations).toEqual([
      "opus-4-6-medium",
      "sonnet-4-6-high",
    ]);
    expect(parsed.state.pins).toEqual([
      "opus-4-6-high",
      "opus-4-6-medium",
      "opus-4-7-max",
      "sonnet-4-6-high",
    ]);
  });

  it("serializes stable finding selection for the Findings view", () => {
    const finding = "0123456789abcdefabcd";
    const parsed = parseExplorerState(
      `v=1&view=findings&finding=${finding}`,
      dataset,
    );

    expect(parsed.state.view).toBe("findings");
    expect(parsed.state.selectedFinding).toBe(finding);
    expect(serializeExplorerState(parsed.state)).toBe(
      `v=1&view=findings&finding=${finding}`,
    );

    const invalid = parseExplorerState(
      "v=1&view=findings&finding=not-stable",
      dataset,
    );
    expect(invalid.state.selectedFinding).toBeNull();
    expect(invalid.ignored).toContain("finding=not-stable");
  });
});
