import { describe, expect, it } from "vitest";
import { getHeadlineEvidence } from "./headline";
import { loadJs10PublishedEvidence } from "./js-1.0-source";

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
    const { kind: _kind, ...observations } = evidence;

    for (const observation of Object.values(observations)) {
      expect(observation.release).toBe("Snyk VulnBench JS 1.0");
      expect(observation.datasetVersion).toBe("1.0.0");
      expect(observation.unit).toBe("unique normalized finding signatures");
      expect(observation.source).toMatch(/2606\.15762/);
    }
  });

  it("matches the published recurrence source", async () => {
    const headline = getHeadlineEvidence("js-1.0");
    const source = await loadJs10PublishedEvidence();

    expect(headline.matchedAllFive).toMatchObject({
      numerator: source.recurrence.matched.counts[4],
      denominator: source.recurrence.matched.total,
    });
    expect(headline.unmatchedOnce).toMatchObject({
      numerator: source.recurrence.unmatched.counts[0],
      denominator: source.recurrence.unmatched.total,
    });
    expect(headline.unmatchedAllFive).toMatchObject({
      numerator: source.recurrence.unmatched.counts[4],
      denominator: source.recurrence.unmatched.total,
    });
  });

  it("rejects unknown release slugs", () => {
    expect(() => getHeadlineEvidence("not-a-release")).toThrow(
      "Unknown release: not-a-release",
    );
  });
});
