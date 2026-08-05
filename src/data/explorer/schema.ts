import { z } from "zod";
import type { PublishedEvidence } from "../releases/js-1.0-source";

export const explorerTaskAggregateSchema = z.object({
  _type: z.literal("task-aggregate"),
  taskId: z.string().min(1),
  taskName: z.string().min(1),
  runConfigId: z.string().min(1),
  runConfigName: z.string().min(1),
  runConfigType: z.enum(["model", "command"]),
  repetitions: z.literal(5),
  score: z.number().min(0).max(1),
  scoreStdDev: z.number().nonnegative(),
  recall: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  sessionDurationMs: z.number().nonnegative(),
  totalTokens: z.number().nonnegative(),
  totalCostUsd: z.number().nonnegative().nullable(),
});

export const explorerRunSchema = z.object({
  _type: z.literal("run"),
  taskId: z.string().min(1),
  runConfigId: z.string().min(1),
  runConfigType: z.enum(["model", "command"]),
  repetition: z.number().int().min(1).max(5),
  totalRepetitions: z.literal(5),
  score: z.number().min(0).max(1),
  details: z.object({
    byType: z.record(
      z.string(),
      z.object({
        total: z.number().int().nonnegative(),
        found: z.number().int().nonnegative(),
      }),
    ),
    falsePositives: z.array(
      z.object({
        type: z.string().min(1),
      }),
    ),
  }),
});

export interface ExplorerTaskObservation {
  projectId: string;
  projectName: string;
  configurationId: string;
  configurationName: string;
  configurationType: "model" | "command";
  f1: number;
  f1StdDev: number;
  recall: number;
  precision: number;
  durationMs: number;
  tokens: number;
  costUsd: number | null;
  repetitions: 5;
}

export interface ExplorerRunObservation {
  projectId: string;
  configurationId: string;
  configurationType: "model" | "command";
  repetition: number;
  f1: number;
  referenceByClass: Record<string, { found: number; total: number }>;
  unmatchedByClass: Record<string, number>;
}

export interface ExplorerConfiguration {
  id: string;
  name: string;
  type: "model" | "command";
}

export interface ExplorerProject {
  id: string;
  name: string;
}

export interface ConfigurationRepeatability {
  configurationId: string;
  configurationName: string;
  uniqueUnmatched: number;
  unmatchedOnce: number;
  unmatchedAllFive: number;
  matchedAllFive: number;
  matchedTotal: number;
}

export interface ExplorerDataset {
  release: {
    id: "snyk-vulnbench-js-1.0";
    slug: "js-1.0";
    datasetVersion: "1.0.0";
    findingEvidenceUrl: "/data/js-1.0/finding-evidence.json";
  };
  configurations: ExplorerConfiguration[];
  configurationMetrics: PublishedEvidence["configurations"];
  projects: ExplorerProject[];
  vulnerabilityClasses: { id: string; label: string }[];
  tasks: ExplorerTaskObservation[];
  runs: ExplorerRunObservation[];
  coverage: PublishedEvidence["coverage"];
  unmatchedCoverage: PublishedEvidence["unmatchedCoverage"];
  recurrence: PublishedEvidence["recurrence"];
  repeatabilityByConfiguration: ConfigurationRepeatability[];
}
