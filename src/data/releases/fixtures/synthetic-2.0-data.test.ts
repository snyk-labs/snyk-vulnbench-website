import { describe, expect, it } from "vitest";
import { loadSynthetic20FixtureData } from "./synthetic-2.0-data";

describe("synthetic 2.0 fixture data", () => {
  it("validates structurally different summary and adjudication assets", async () => {
    const data = await loadSynthetic20FixtureData();

    expect(data.summary.releaseId).toBe("snyk-vulnbench-synthetic-2.0");
    expect(data.summary.repositoryScale).toEqual([
      "small",
      "medium",
      "large",
    ]);
    expect(data.summary.observations).toHaveLength(3);
    expect(data.adjudications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "confirmed" }),
        expect.objectContaining({ status: "rejected" }),
      ]),
    );
  });

  it("is available only from test-source paths", async () => {
    await expect(
      loadSynthetic20FixtureData("/not-a-vulnbench-workspace"),
    ).rejects.toThrow();
  });
});
