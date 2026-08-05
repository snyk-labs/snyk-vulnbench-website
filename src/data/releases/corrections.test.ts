import { describe, expect, it } from "vitest";
import {
  correctionHistorySchema,
  js10CorrectionHistory,
} from "./corrections";

describe("JS 1.0 correction history", () => {
  it("declares the immutable dataset version with no published corrections", () => {
    expect(js10CorrectionHistory).toEqual({
      releaseId: "snyk-vulnbench-js-1.0",
      datasetVersion: "1.0.0",
      corrections: [],
    });
  });

  it("rejects unordered versions and unknown affected values", () => {
    expect(() =>
      correctionHistorySchema.parse({
        releaseId: "snyk-vulnbench-js-1.0",
        datasetVersion: "1.0.0",
        corrections: [
          {
            version: "1.0.2",
            publishedAt: "2026-08-05",
            reason: "Example",
            affectedValues: ["scorecard"],
          },
          {
            version: "1.0.1",
            publishedAt: "2026-08-06",
            reason: "Out of order",
            affectedValues: ["unknown-value"],
          },
        ],
      }),
    ).toThrow();
  });
});
