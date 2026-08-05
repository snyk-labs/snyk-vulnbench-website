import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

const summarySchema = z.object({
  schemaVersion: z.literal(1),
  releaseId: z.literal("snyk-vulnbench-synthetic-2.0"),
  datasetVersion: z.literal("2.0.0"),
  repositoryScale: z
    .array(z.enum(["small", "medium", "large"]))
    .length(3),
  observations: z
    .array(
      z.object({
        configurationId: z.string().min(1),
        independentGroundTruthF1: z.number().min(0).max(1),
        groundTruthRecall: z.number().min(0).max(1),
        sessionDurationSeconds: z.number().positive(),
        repositoryRiskScore: z.number().min(0).max(100),
      }),
    )
    .length(3),
});

const adjudicationStatuses = new Set(["confirmed", "rejected"]);

export async function loadSynthetic20FixtureData(
  workspaceRoot = process.cwd(),
) {
  const dataRoot = resolve(
    workspaceRoot,
    "src/data/releases/fixtures/data",
  );
  const [summaryContents, csv] = await Promise.all([
    readFile(resolve(dataRoot, "synthetic-2.0-summary.json"), "utf8"),
    readFile(resolve(dataRoot, "synthetic-2.0-adjudications.csv"), "utf8"),
  ]);
  const summary = summarySchema.parse(JSON.parse(summaryContents));
  const [header, ...rows] = csv.trim().split("\n").map((line) => line.split(","));
  const expectedHeader = [
    "finding_id",
    "project_id",
    "adjudication_status",
    "vulnerability_class",
  ];
  if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
    throw new Error("Synthetic adjudication CSV header is invalid");
  }
  const adjudications = rows.map((row) => {
    const [findingId, projectId, status, vulnerabilityClass] = row;
    if (
      !findingId ||
      !projectId ||
      !status ||
      !vulnerabilityClass ||
      !adjudicationStatuses.has(status)
    ) {
      throw new Error("Synthetic adjudication CSV row is invalid");
    }
    return { findingId, projectId, status, vulnerabilityClass };
  });

  return { summary, adjudications };
}
