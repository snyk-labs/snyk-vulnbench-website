#!/usr/bin/env node

// Imports the reviewed Snyk VulnBench 2.0 site handoff into the repository.
// Only content the site serves is copied. Source tags (`src`) and figure
// claims are internal review keys and are removed from copy and figure
// metadata. Tables and their notes files are served as supplied, so they are
// copied byte for byte and the import fails if one carries a claim ID. The
// handoff's numbers registry, table-claims mapping, README, guardrails and
// scripts are never copied.

import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CLAIM_ID_PATTERN = /\bC-[A-Z0-9]+-[0-9]+/u;

const CONTENT_DIRECTORY = "src/data/releases/content/2.0";
const FIGURE_DIRECTORY = "public/figures/2.0";
const COPY_FILES = [
  "citation.json",
  "data.json",
  "differs.json",
  "disclosure.json",
  "findings.json",
  "home.json",
  "limitations.json",
  "methodology.json",
  "release-card.json",
  "release-page.json",
  "terms.json",
];

export function stripSourceTags(value) {
  if (Array.isArray(value)) return value.map(stripSourceTags);
  if (value === null || typeof value !== "object") return value;

  const entries = Object.entries(value).filter(([key]) => key !== "src");
  if (
    "src" in value &&
    entries.length === 1 &&
    entries[0][0] === "text" &&
    typeof entries[0][1] === "string"
  ) {
    return entries[0][1];
  }
  return Object.fromEntries(
    entries.map(([key, entry]) => [key, stripSourceTags(entry)]),
  );
}

function withoutKeys(value, keys) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key)),
  );
}

function assertNoClaimIds(text, label) {
  const match = text.match(CLAIM_ID_PATTERN);
  if (match) {
    throw new Error(`${label} still contains claim ID ${match[0]}`);
  }
}

async function writeJson(path, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  assertNoClaimIds(text, path);
  await writeFile(path, text);
}

export async function importVulnbench20(handoffRoot, workspaceRoot) {
  const contentRoot = join(workspaceRoot, CONTENT_DIRECTORY);
  const figureRoot = join(workspaceRoot, FIGURE_DIRECTORY);
  await rm(contentRoot, { recursive: true, force: true });
  await rm(figureRoot, { recursive: true, force: true });
  await mkdir(join(contentRoot, "copy"), { recursive: true });
  await mkdir(join(contentRoot, "tables"), { recursive: true });

  for (const file of COPY_FILES) {
    const copy = JSON.parse(await readFile(join(handoffRoot, "copy", file), "utf8"));
    await writeJson(join(contentRoot, "copy", file), stripSourceTags(copy));
  }

  const tableRoot = join(handoffRoot, "data", "tables");
  for (const file of (await readdir(tableRoot)).sort()) {
    if (!file.endsWith(".csv") && !file.endsWith(".meta.json")) continue;
    const bytes = await readFile(join(tableRoot, file));
    assertNoClaimIds(bytes.toString("utf8"), file);
    if (file.endsWith(".meta.json")) JSON.parse(bytes.toString("utf8"));
    await writeFile(join(contentRoot, "tables", file), bytes);
  }

  const colours = JSON.parse(
    await readFile(join(handoffRoot, "data", "colours.json"), "utf8"),
  );
  await writeJson(join(contentRoot, "colours.json"), colours);

  const figures = JSON.parse(
    await readFile(join(handoffRoot, "figures", "figures.json"), "utf8"),
  );
  await writeJson(join(contentRoot, "figures.json"), {
    ...figures,
    figures: figures.figures.map((figure) => withoutKeys(figure, ["claims"])),
  });

  const bibtex = await readFile(join(handoffRoot, "paper", "citation.bib"), "utf8");
  assertNoClaimIds(bibtex, "citation.bib");
  await writeFile(join(contentRoot, "citation.bib"), bibtex);

  for (const format of ["svg", "png"]) {
    for (const scheme of ["light", "dark"]) {
      const from = join(handoffRoot, "figures", format, scheme);
      const to = join(figureRoot, format, scheme);
      await mkdir(to, { recursive: true });
      for (const file of (await readdir(from)).sort()) {
        if (file.startsWith("vulnbench-2.0-figure-")) {
          await copyFile(join(from, file), join(to, file));
        }
      }
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const handoffIndex = process.argv.indexOf("--handoff");
  const handoffRoot = handoffIndex > 0 ? process.argv[handoffIndex + 1] : undefined;
  if (!handoffRoot) {
    console.error("Usage: node scripts/import-vulnbench-2.0.mjs --handoff <extracted-package-dir>");
    process.exitCode = 1;
  } else {
    await importVulnbench20(resolve(handoffRoot), process.cwd());
    console.log(`Imported Snyk VulnBench 2.0 content into ${CONTENT_DIRECTORY} and ${FIGURE_DIRECTORY}`);
  }
}
