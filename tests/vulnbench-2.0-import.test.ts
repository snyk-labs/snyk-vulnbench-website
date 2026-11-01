import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { importVulnbench20, stripSourceTags } from "../scripts/import-vulnbench-2.0.mjs";

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

const copyFiles = [
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

async function withHandoff(meta: string, run: (handoff: string, workspace: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "vulnbench-import-"));
  const handoff = join(root, "handoff");
  const workspace = join(root, "workspace");
  const put = async (path: string, text: string) => {
    await mkdir(dirname(join(handoff, path)), { recursive: true });
    await writeFile(join(handoff, path), text);
  };
  try {
    for (const file of copyFiles) await put(`copy/${file}`, "{}");
    await put("data/tables/example.csv", "a,b\n1,\n");
    await put("data/tables/example.meta.json", meta);
    await put("data/table-claims.json", '{"tables":{"example.csv":["C-HEAD-01"]}}');
    await put("data/colours.json", "{}");
    await put("figures/figures.json", '{"figures":[]}');
    await put("paper/citation.bib", "@article{x}\n");
    for (const format of ["svg", "png"]) {
      for (const scheme of ["light", "dark"]) {
        await mkdir(join(handoff, "figures", format, scheme), { recursive: true });
      }
    }
    await mkdir(workspace);
    await run(handoff, workspace);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("Snyk VulnBench 2.0 content import", () => {
  it("copies each notes file byte for byte and never the claim mapping", async () => {
    const meta = '{\n  "units": "counts",\n  "paper": "Figure 6A"\n}';
    await withHandoff(meta, async (handoff, workspace) => {
      await importVulnbench20(handoff, workspace);
      const tables = join(workspace, "src/data/releases/content/2.0/tables");
      expect(await readFile(join(tables, "example.meta.json"), "utf8")).toBe(meta);
      expect((await readdir(tables)).sort()).toEqual(["example.csv", "example.meta.json"]);
      const imported = await walk(join(workspace, "src/data/releases/content/2.0"));
      expect(imported.some((file) => file.endsWith("table-claims.json"))).toBe(false);
    });
  });

  it("refuses a notes file that still carries claim IDs", async () => {
    const meta = '{\n  "source_claims": ["C-HEAD-01"]\n}';
    await withHandoff(meta, async (handoff, workspace) => {
      await expect(importVulnbench20(handoff, workspace)).rejects.toThrow(/claim ID C-HEAD-01/u);
    });
  });

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
    expect(names.filter((name) => name.endsWith(".csv"))).toHaveLength(18);
    for (const table of ["sol_sink_offsets", "deepsec_funnel", "rank_stability"]) {
      expect(names).toContain(`tables/${table}.csv`);
      expect(names).toContain(`tables/${table}.meta.json`);
    }
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
