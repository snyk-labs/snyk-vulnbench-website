import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import {
  evidenceRunSchema,
  fixtureFindingsSchema,
  type EvidenceDepthDataset,
  type FindingSignature,
  type ProjectEvidence,
} from "./schema";

interface FindingAccumulator
  extends Omit<FindingSignature, "occurrences" | "metadataVariants"> {
  repetitions: Set<number>;
  variants: Map<
    string,
    { severity: string; description: string | null; repetitions: Set<number> }
  >;
}

const stableId = (signature: string) =>
  createHash("sha256").update(signature).digest("hex").slice(0, 20);

function addVariant(
  finding: FindingAccumulator,
  severity: string,
  description: string | null,
  repetition: number,
) {
  const key = JSON.stringify([severity, description]);
  const existing = finding.variants.get(key);
  if (existing) existing.repetitions.add(repetition);
  else {
    finding.variants.set(key, {
      severity,
      description,
      repetitions: new Set([repetition]),
    });
  }
}

function normalizedLine(value: number | string | null | undefined) {
  const line = typeof value === "string" ? Number(value) : value;
  return typeof line === "number" && Number.isFinite(line)
    ? Math.trunc(line)
    : null;
}

async function walkFiles(
  directory: string,
  root = directory,
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(path, root)));
    else if (entry.isFile()) {
      files.push(relative(root, path).split(sep).join("/"));
    }
  }
  return files;
}

async function projectEvidence(
  sourceRoot: string,
  projectId: string,
  projectName: string,
): Promise<ProjectEvidence> {
  const fixtureId = projectId.replace(/-find-vulns$/, "");
  const fixtureRoot = resolve(sourceRoot, "fixtures", fixtureId);
  const findings = fixtureFindingsSchema.parse(
    JSON.parse(await readFile(resolve(fixtureRoot, "findings.json"), "utf8")),
  );
  const projectRoot = resolve(fixtureRoot, "project");
  const sourceFiles = (await walkFiles(projectRoot)).sort();
  const sourceContexts = await Promise.all(
    findings.vulnerabilities.map(async (finding) => {
      const sourcePath = resolve(projectRoot, finding.file);
      if (!sourcePath.startsWith(`${projectRoot}/`)) {
        throw new Error(`Reference source escapes fixture: ${finding.file}`);
      }
      const lines = (await readFile(sourcePath, "utf8")).split("\n");
      const startLine = Math.max(1, finding.line - 2);
      const endLine = Math.min(lines.length, finding.line + 2);
      return {
        findingId: finding.id,
        file: finding.file,
        line: finding.line,
        startLine,
        snippet: lines.slice(startLine - 1, endLine).join("\n"),
      };
    }),
  );

  return {
    id: projectId,
    name: projectName,
    description: findings.description,
    referenceFindings: findings.vulnerabilities,
    sourceFiles,
    sourceContexts,
  };
}

export async function loadJs10EvidenceDepth(
  workspaceRoot = process.cwd(),
): Promise<EvidenceDepthDataset> {
  const sourceRoot = resolve(workspaceRoot, "snyk-vulnbench-js-1.0");
  const records = (
    await readFile(
      resolve(sourceRoot, "benchmark-2026-05-20T23-06-29-348Z.jsonl"),
      "utf8",
    )
  )
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { _type?: string });
  const modelRuns = records
    .filter(
      (record) =>
        record._type === "run" &&
        (record as { runConfigType?: string }).runConfigType === "model",
    )
    .map((record) => evidenceRunSchema.parse(record));

  if (modelRuns.length !== 250) {
    throw new Error(`Expected 250 model runs, found ${modelRuns.length}`);
  }

  const projectNames = new Map(
    modelRuns.map(({ taskId, taskName }) => [taskId, taskName]),
  );
  const projects = await Promise.all(
    [...projectNames].map(([projectId, projectName]) =>
      projectEvidence(sourceRoot, projectId, projectName),
    ),
  );
  projects.sort((left, right) => left.id.localeCompare(right.id));
  const references = new Map(
    projects.flatMap((project) =>
      project.referenceFindings.map((finding) => [
        `${project.id}:${finding.id}`,
        finding,
      ]),
    ),
  );

  const signatures = new Map<string, FindingAccumulator>();
  for (const run of modelRuns) {
    for (const finding of run.details.truePositives) {
      const signature = [
        "matched",
        run.taskId,
        run.runConfigId,
        finding.id,
      ].join("|");
      const reference = references.get(`${run.taskId}:${finding.id}`);
      const existing = signatures.get(signature);
      if (existing) {
        existing.repetitions.add(run.repetition);
        addVariant(
          existing,
          finding.severity,
          reference?.description ?? null,
          run.repetition,
        );
        continue;
      }
      signatures.set(signature, {
        id: stableId(signature),
        projectId: run.taskId,
        projectName: run.taskName,
        configurationId: run.runConfigId,
        configurationName: run.runConfigName,
        status: "matched",
        vulnerabilityClass: finding.type,
        severity: finding.severity,
        file: reference?.file ?? null,
        line: reference?.line ?? null,
        description: reference?.description ?? null,
        totalRepetitions: 5,
        referenceFindingId: finding.id,
        repetitions: new Set([run.repetition]),
        variants: new Map([
          [
            JSON.stringify([
              finding.severity,
              reference?.description ?? null,
            ]),
            {
              severity: finding.severity,
              description: reference?.description ?? null,
              repetitions: new Set([run.repetition]),
            },
          ],
        ]),
      });
    }

    for (const finding of run.details.falsePositives) {
      const line = normalizedLine(finding.line);
      const file = finding.file ? basename(finding.file) : null;
      const signature = [
        "unmatched",
        run.taskId,
        run.runConfigId,
        finding.type,
        file ?? "",
        line ?? "",
      ].join("|");
      const existing = signatures.get(signature);
      if (existing) {
        existing.repetitions.add(run.repetition);
        addVariant(
          existing,
          finding.severity,
          finding.description ?? null,
          run.repetition,
        );
        continue;
      }
      signatures.set(signature, {
        id: stableId(signature),
        projectId: run.taskId,
        projectName: run.taskName,
        configurationId: run.runConfigId,
        configurationName: run.runConfigName,
        status: "unmatched",
        vulnerabilityClass: finding.type,
        severity: finding.severity,
        file,
        line,
        description: finding.description ?? null,
        totalRepetitions: 5,
        referenceFindingId: null,
        repetitions: new Set([run.repetition]),
        variants: new Map([
          [
            JSON.stringify([
              finding.severity,
              finding.description ?? null,
            ]),
            {
              severity: finding.severity,
              description: finding.description ?? null,
              repetitions: new Set([run.repetition]),
            },
          ],
        ]),
      });
    }
  }

  const findings = [...signatures.values()]
    .map(({ repetitions, variants, ...finding }): FindingSignature => {
      const metadataVariants = [...variants.values()]
        .map(({ severity, description, repetitions: variantRepetitions }) => ({
          severity,
          description,
          occurrences: variantRepetitions.size,
        }))
        .sort(
          (left, right) =>
            right.occurrences - left.occurrences ||
            left.severity.localeCompare(right.severity) ||
            (left.description ?? "").localeCompare(right.description ?? ""),
        );
      const representative = metadataVariants[0];
      if (!representative) {
        throw new Error(`Finding signature has no metadata: ${finding.id}`);
      }
      return {
        ...finding,
        severity: representative.severity,
        description: representative.description,
        metadataVariants,
        occurrences: repetitions.size,
      };
    })
    .sort(
      (left, right) =>
        left.projectId.localeCompare(right.projectId) ||
        left.configurationId.localeCompare(right.configurationId) ||
        left.status.localeCompare(right.status) ||
        left.vulnerabilityClass.localeCompare(right.vulnerabilityClass) ||
        (left.file ?? "").localeCompare(right.file ?? "") ||
        (left.line ?? 0) - (right.line ?? 0),
    );

  return { findings, projects };
}
