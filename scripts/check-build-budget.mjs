import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const NARRATIVE_JAVASCRIPT_BUDGET = 200 * 1024;
const buildRoot = resolve(process.cwd(), "dist");
const homepage = await readFile(resolve(buildRoot, "index.html"), "utf8");
const assetPattern = /["']([^"']+\.js)["']/g;
const assets = new Set(
  [...homepage.matchAll(assetPattern)].map((match) => match[1]),
);
const inlineScripts = [...homepage.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter(Boolean);

let totalCompressedBytes = 0;
for (const asset of assets) {
  const relativePath = asset.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
  const contents = await readFile(resolve(buildRoot, relativePath));
  const compressedBytes = gzipSync(contents, { level: 9 }).byteLength;
  totalCompressedBytes += compressedBytes;
  console.log(`${asset}: ${compressedBytes} compressed bytes`);
}

for (const [index, script] of inlineScripts.entries()) {
  const compressedBytes = gzipSync(script, { level: 9 }).byteLength;
  totalCompressedBytes += compressedBytes;
  console.log(`inline script ${index + 1}: ${compressedBytes} compressed bytes`);
}

if (assets.size === 0 && inlineScripts.length === 0) {
  throw new Error("No homepage JavaScript was found to measure");
}

if (totalCompressedBytes > NARRATIVE_JAVASCRIPT_BUDGET) {
  throw new Error(
    `Homepage JavaScript is ${totalCompressedBytes} compressed bytes; budget is ${NARRATIVE_JAVASCRIPT_BUDGET}`,
  );
}

console.log(
  `Homepage JavaScript budget passed: ${totalCompressedBytes}/${NARRATIVE_JAVASCRIPT_BUDGET} compressed bytes`,
);
