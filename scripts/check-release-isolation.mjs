import { access, readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(process.cwd(), "dist");
const forbiddenValues = [
  "synthetic-2.0",
  "snyk-vulnbench-synthetic-2.0",
  "/__fixtures__/",
];
const publicFiles = [
  "sitemap-0.xml",
  "releases/index.html",
  "releases/js-1.0/index.html",
  "releases/js-1.0/explore/index.html",
  "releases/js-1.0/data/index.html",
  "data/js-1.0/published-evidence.json",
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

for (const file of publicFiles) {
  await access(resolve(root, file));
}

const textualExtensions = new Set([
  ".html",
  ".xml",
  ".json",
  ".jsonl",
  ".csv",
  ".js",
  ".css",
  ".svg",
  ".txt",
]);
for (const file of await walk(root)) {
  const outputPath = relative(root, file);
  const leakedPath = forbiddenValues.find((value) =>
    outputPath.includes(value),
  );
  if (leakedPath) {
    throw new Error(
      `Internal release fixture value ${leakedPath} leaked into output path ${outputPath}`,
    );
  }
  if (!textualExtensions.has(extname(file))) continue;
  const contents = await readFile(file, "utf8");
  const leaked = forbiddenValues.find((value) => contents.includes(value));
  if (leaked) {
    throw new Error(
      `Internal release fixture value ${leaked} leaked into ${outputPath}`,
    );
  }
}

try {
  await access(resolve(root, "releases/synthetic-2.0"));
  throw new Error("Internal synthetic release route was generated");
} catch (error) {
  if (
    error instanceof Error &&
    error.message === "Internal synthetic release route was generated"
  ) {
    throw error;
  }
}

console.log("Public release isolation passed: JS 1.0 only");
