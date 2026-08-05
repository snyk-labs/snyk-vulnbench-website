import { z } from "zod";

const versionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
const affectedValueSchema = z.enum([
  "headline.matchedAllFive",
  "headline.unmatchedOnce",
  "headline.unmatchedAllFive",
  "scorecard",
  "coverage",
  "efficiency",
  "findingEvidence",
  "projectEvidence",
]);

export const correctionHistorySchema = z
  .object({
    releaseId: z.string().min(1),
    datasetVersion: versionSchema,
    corrections: z.array(
      z.object({
        version: versionSchema,
        publishedAt: z.iso.date(),
        reason: z.string().min(1),
        affectedValues: z.array(affectedValueSchema).min(1),
      }),
    ),
  })
  .superRefine(({ datasetVersion, corrections }, context) => {
    const [major, minor, patch] = datasetVersion.split(".").map(Number);
    const versions = corrections.map(({ version }) => version);
    if (new Set(versions).size !== versions.length) {
      context.addIssue({ code: "custom", message: "Correction versions must be unique" });
    }
    let previousPatch = patch ?? 0;
    for (const correction of corrections) {
      const [correctionMajor, correctionMinor, correctionPatch] =
        correction.version.split(".").map(Number);
      if (
        correctionMajor !== major ||
        correctionMinor !== minor ||
        correctionPatch === undefined ||
        correctionPatch <= previousPatch
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Correction versions must be ordered patch releases of the dataset version",
        });
      }
      previousPatch = correctionPatch ?? previousPatch;
    }
  });

export const js10CorrectionHistory = correctionHistorySchema.parse({
  releaseId: "snyk-vulnbench-js-1.0",
  datasetVersion: "1.0.0",
  corrections: [],
});
