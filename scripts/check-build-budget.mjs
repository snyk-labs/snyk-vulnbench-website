import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const NARRATIVE_JAVASCRIPT_BUDGET = 200 * 1024;
const buildRoot = resolve(process.cwd(), "dist");
const assetPattern = /["']([^"']+\.js)["']/g;

async function measurePage(path, label) {
  const html = await readFile(resolve(buildRoot, path), "utf8");
  const assets = new Set(
    [...html.matchAll(assetPattern)].map((match) => match[1]),
  );
  const inlineScripts = [
    ...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g),
  ]
    .map((match) => match[1])
    .filter(Boolean);
  let total = 0;

  for (const asset of assets) {
    const relativePath = asset
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/^\//, "");
    const contents = await readFile(resolve(buildRoot, relativePath));
    total += gzipSync(contents, { level: 9 }).byteLength;
  }
  for (const script of inlineScripts) {
    total += gzipSync(script, { level: 9 }).byteLength;
  }

  console.log(`${label}: ${total} compressed JavaScript bytes`);
  return total;
}

for (const [path, label] of [
  ["index.html", "Homepage"],
  ["releases/js-1.0/index.html", "Release overview"],
  ["releases/js-1.0/cases/index.html", "Cases"],
  ["releases/js-1.0/methodology/index.html", "Release methodology"],
  ["releases/js-1.0/data/index.html", "Release data"],
]) {
  const total = await measurePage(path, label);
  if (total > NARRATIVE_JAVASCRIPT_BUDGET) {
    throw new Error(
      `${label} JavaScript is ${total} compressed bytes; narrative budget is ${NARRATIVE_JAVASCRIPT_BUDGET}`,
    );
  }
}

const explorerTotal = await measurePage(
  "releases/js-1.0/explore/index.html",
  "Core explorer",
);
console.log(`Core explorer bundle measurement: ${explorerTotal} compressed bytes`);
