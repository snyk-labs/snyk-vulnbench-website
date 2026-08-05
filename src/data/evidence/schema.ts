import { z } from "zod";

const findingSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  severity: z.string().min(1),
  file: z.string().min(1),
  line: z.number().int().positive(),
  description: z.string().min(1),
});

export const fixtureFindingsSchema = z.object({
  description: z.string().min(1),
  vulnerabilities: z.array(findingSchema),
});

export const evidenceRunSchema = z.object({
  _type: z.literal("run"),
  taskId: z.string().min(1),
  taskName: z.string().min(1),
  runConfigId: z.string().min(1),
  runConfigName: z.string().min(1),
  runConfigType: z.enum(["model", "command"]),
  repetition: z.number().int().min(1).max(5),
  totalRepetitions: z.literal(5),
  details: z.object({
    truePositives: z.array(
      z.object({
        id: z.string().min(1),
        type: z.string().min(1),
        severity: z.string().min(1),
      }),
    ),
    falsePositives: z.array(
      z.object({
        type: z.string().min(1),
        severity: z.string().min(1),
        file: z.string().optional().nullable(),
        line: z.union([z.number(), z.string()]).optional().nullable(),
        description: z.string().optional().nullable(),
      }),
    ),
  }),
});

export interface FindingSignature {
  id: string;
  projectId: string;
  projectName: string;
  configurationId: string;
  configurationName: string;
  status: "matched" | "unmatched";
  vulnerabilityClass: string;
  severity: string;
  file: string | null;
  line: number | null;
  description: string | null;
  metadataVariants: Array<{
    severity: string;
    description: string | null;
    occurrences: number;
  }>;
  occurrences: number;
  totalRepetitions: 5;
  referenceFindingId: string | null;
}

export interface ProjectEvidence {
  id: string;
  name: string;
  description: string;
  referenceFindings: z.infer<typeof findingSchema>[];
  sourceFiles: string[];
  sourceContexts: Array<{
    findingId: string;
    file: string;
    line: number;
    startLine: number;
    snippet: string;
  }>;
}

export interface EvidenceDepthDataset {
  findings: FindingSignature[];
  projects: ProjectEvidence[];
}
