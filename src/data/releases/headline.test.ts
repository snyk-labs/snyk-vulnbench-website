import { describe, expect, it } from "vitest";
import { getHeadlineEvidence } from "./headline";

describe("JS 1.0 headline evidence", () => {
  it("reconstructs the published recurrence values", () => {
    expect(getHeadlineEvidence("js-1.0")).toMatchObject({
      matchedAllFive: { numerator: 134, denominator: 158 },
      unmatchedOnce: { numerator: 80, denominator: 161 },
      unmatchedAllFive: { numerator: 22, denominator: 161 },
    });
  });

  it("includes provenance for every displayed value", () => {
    const evidence = getHeadlineEvidence("js-1.0");

    for (const observation of Object.values(evidence)) {
      expect(observation.release).toBe("Snyk VulnBench JS 1.0");
      expect(observation.datasetVersion).toBe("1.0.0");
      expect(observation.unit).toBe("unique normalized finding signatures");
      expect(observation.source).toMatch(/2606\.15762/);
    }
  });

  it("rejects unknown release slugs", () => {
    expect(() => getHeadlineEvidence("not-a-release")).toThrow(
      "Unknown release: not-a-release",
    );
  });
});
