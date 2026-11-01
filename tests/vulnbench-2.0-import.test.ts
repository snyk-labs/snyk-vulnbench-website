import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { stripSourceTags } from "../scripts/import-vulnbench-2.0.mjs";

const workspaceRoot = resolve(process.cwd());
const contentRoot = join(workspaceRoot, "src/data/releases/content/2.0");
const figureRoot = join(workspaceRoot, "public/figures/2.0");
const claimId = /\bC-[A-Z0-9]+-[0-9]+/u;

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

function collectKeys(value: unknown, keys = new Set<string>()) {
  if (Array.isArray(value)) value.forEach((entry) => collectKeys(entry, keys));
  else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      keys.add(key);
      collectKeys(entry, keys);
    }
  }
  return keys;
}

describe("Snyk VulnBench 2.0 content import", () => {
  it("replaces tagged lines with their text and drops source tags", () => {
    expect(
      stripSourceTags({
        h1: { text: "Question", src: ["paper:§1"] },
        stats: [{ value: "108", label: "vulnerabilities", src: ["x"] }],
        plain: "Label",
      }),
    ).toEqual({
      h1: "Question",
      stats: [{ value: "108", label: "vulnerabilities" }],
      plain: "Label",
    });
  });

  it("commits only served content, without claim IDs or review keys", async () => {
    const files = await walk(contentRoot);
    const names = files.map((file) => file.slice(contentRoot.length + 1)).sort();

    expect(names).toContain("copy/home.json");
    expect(names).toContain("tables/headline.csv");
    expect(names).toContain("tables/headline.meta.json");
    expect(names).toContain("figures.json");
    expect(names).toContain("colours.json");
    expect(names).toContain("citation.bib");
    expect(names.filter((name) => name.endsWith(".csv"))).toHaveLength(15);
    expect(names.some((name) => /site-numbers|guardrails|README|allow-list|\.py$/iu.test(name))).toBe(false);

    for (const file of files) {
      const text = await readFile(file, "utf8");
      expect(text, file).not.toMatch(claimId);
      if (file.endsWith(".json")) {
        const keys = collectKeys(JSON.parse(text));
        expect(keys.has("src"), file).toBe(false);
        expect(keys.has("raw"), file).toBe(false);
        expect(keys.has("claims"), file).toBe(false);
        expect(keys.has("source_claims"), file).toBe(false);
      }
    }
  });

  it("serves every paper figure in light and dark SVG and PNG variants", async () => {
    const figures = JSON.parse(
      await readFile(join(contentRoot, "figures.json"), "utf8"),
    ) as { figures: { file_stem: string }[] };
    expect(figures.figures).toHaveLength(13);

    for (const { file_stem: stem } of figures.figures) {
      for (const format of ["svg", "png"]) {
        for (const scheme of ["light", "dark"]) {
          const light = await readFile(join(figureRoot, format, "light", `${stem}.${format}`));
          const variant = await readFile(join(figureRoot, format, scheme, `${stem}.${format}`));
          expect(variant.byteLength).toBeGreaterThan(0);
          if (scheme === "dark") expect(variant.equals(light), `${stem}.${format}`).toBe(false);
        }
      }
    }
  });
});
