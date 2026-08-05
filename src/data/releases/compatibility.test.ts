import { describe, expect, it } from "vitest";
import { synthetic20Release } from "./fixtures/synthetic-2.0";
import { js10Release } from "./js-1.0";
import { compareMetricCompatibility } from "./compatibility";

describe("cross-release metric compatibility", () => {
  it("allows explicitly compatible resource lineage", () => {
    expect(
      compareMetricCompatibility(
        js10Release,
        synthetic20Release,
        "session-duration",
      ),
    ).toEqual({
      allowed: true,
      reason:
        "Both releases explicitly declare session-duration-seconds compatible with matching seconds units.",
    });
  });

  it("blocks incompatible agreement metrics in both directions", () => {
    const forward = compareMetricCompatibility(
      js10Release,
      synthetic20Release,
      "snyk-reference-f1",
    );
    expect(forward.allowed).toBe(false);
    expect(forward.reason).toMatch(/independent adjudicated ground truth/i);

    const reverse = compareMetricCompatibility(
      synthetic20Release,
      js10Release,
      "independent-ground-truth-f1",
    );
    expect(reverse.allowed).toBe(false);
    expect(reverse.reason).toMatch(/Snyk Code reference set/i);
  });

  it("fails closed for unknown or undeclared metrics", () => {
    expect(
      compareMetricCompatibility(
        js10Release,
        synthetic20Release,
        "not-a-metric",
      ),
    ).toEqual({
      allowed: false,
      reason: "Metric not-a-metric is not declared by Snyk VulnBench JS 1.0.",
    });
    expect(
      compareMetricCompatibility(
        js10Release,
        synthetic20Release,
        "finding-recurrence",
      ).allowed,
    ).toBe(false);
  });

  it("blocks matching lineage when definitions differ", () => {
    const changed = structuredClone(synthetic20Release);
    const duration = changed.metrics.find(
      ({ id }) => id === "session-duration",
    );
    if (!duration) throw new Error("Synthetic duration metric missing");
    duration.definition = "Different timing boundary";

    expect(
      compareMetricCompatibility(
        js10Release,
        changed,
        "session-duration",
      ),
    ).toEqual({
      allowed: false,
      reason:
        "Metric definitions or aggregations differ for session-duration-seconds.",
    });
  });
});
