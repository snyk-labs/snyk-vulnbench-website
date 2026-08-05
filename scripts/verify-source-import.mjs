import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SNAPSHOT_DIRECTORY = "snyk-vulnbench-js-1.0";
const EXPECTED_COMMIT = "7c944ea438a31ea4cbd6803f1bb9560d01f932e5";
const EXPECTED_TREE = "e1490c821be5be869b91e482eb037e3f2672f432";
const LOCAL_METADATA = new Set([
  "UPSTREAM-FILES.json",
  "UPSTREAM-PROVENANCE.md",
]);

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      paths.push(...(await walkFiles(path)));
    } else if (entry.isFile()) {
      paths.push(path);
    }
  }

  return paths;
}

function gitBlobHash(contents) {
  return createHash("sha1")
    .update(`blob ${contents.byteLength}\0`)
    .update(contents)
    .digest("hex");
}

export async function verifySourceImport(workspaceRoot) {
  const snapshotRoot = join(workspaceRoot, SNAPSHOT_DIRECTORY);
  const manifest = JSON.parse(
    await readFile(join(snapshotRoot, "UPSTREAM-FILES.json"), "utf8"),
  );
  const provenance = await readFile(
    join(snapshotRoot, "UPSTREAM-PROVENANCE.md"),
    "utf8",
  );

  if (manifest.upstreamTree !== EXPECTED_TREE) {
    throw new Error(
      `Unexpected upstream tree: ${manifest.upstreamTree ?? "missing"}`,
    );
  }
  if (
    !provenance.includes(EXPECTED_COMMIT) ||
    !provenance.includes(EXPECTED_TREE)
  ) {
    throw new Error("Provenance does not identify the imported commit and tree");
  }

  const allFiles = await walkFiles(snapshotRoot);
  const nestedGit = allFiles.some((path) =>
    path.split(sep).includes(".git"),
  );
  if (nestedGit) {
    throw new Error("Nested Git metadata is not allowed in the source snapshot");
  }

  const upstreamPaths = allFiles
    .map((path) => relative(snapshotRoot, path).split(sep).join("/"))
    .filter((path) => !LOCAL_METADATA.has(path))
    .sort();
  const declaredPaths = manifest.files.map(({ path }) => path).sort();

  if (JSON.stringify(upstreamPaths) !== JSON.stringify(declaredPaths)) {
    throw new Error("Local source paths do not match the upstream tree manifest");
  }

  for (const entry of manifest.files) {
    const contents = await readFile(join(snapshotRoot, entry.path));
    if (contents.byteLength !== entry.size) {
      throw new Error(`Size mismatch for ${entry.path}`);
    }
    if (gitBlobHash(contents) !== entry.sha) {
      throw new Error(`Git blob hash mismatch for ${entry.path}`);
    }
  }

  const fixtures = declaredPaths.filter((path) =>
    /^fixtures\/[^/]+\/findings\.json$/.test(path),
  );
  if (fixtures.length !== 10) {
    throw new Error(`Expected 10 fixtures, found ${fixtures.length}`);
  }

  const requiredFiles = [
    "LICENSE",
    "article-visuals.md",
    "chart-manifest.json",
    "benchmark-2026-05-20T23-06-29-348Z.jsonl",
  ];
  for (const requiredFile of requiredFiles) {
    if (!declaredPaths.includes(requiredFile)) {
      throw new Error(`Missing required upstream file: ${requiredFile}`);
    }
  }

  return {
    fileCount: declaredPaths.length,
    fixtureCount: fixtures.length,
    importedCommit: EXPECTED_COMMIT,
    upstreamTree: EXPECTED_TREE,
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await verifySourceImport(process.cwd());
  console.log(
    `Verified JS 1.0 source snapshot: ${result.fixtureCount} fixtures, ${result.fileCount} upstream files`,
  );
}
