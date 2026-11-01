import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { v20Copy } from "../../data/releases/2.0-content";
import { v20Release } from "../../data/releases/2.0";

const componentPath = resolve(process.cwd(), "src/components/home/KeyFindings.astro");

test("frames headline findings with the 2.0 copy in the paper's order", async () => {
  const component = (await readFile(componentPath, "utf8")).replace(/\s+/g, " ");

  expect(component).toContain("{intro.kicker}");
  expect(component).toContain("{intro.h2}");
  expect(component).toContain("{intro.body}");
  expect(component).toContain("Interpret with care:");
  expect(v20Copy.findings.map(({ id }) => id)).toEqual([
    "complementarity",
    "harness-policy",
    "efficiency",
    "robustness",
  ]);
  expect(v20Release.featuredFindings.map(({ title }) => title)).toEqual(
    v20Copy.findings.map(({ title }) => title),
  );
});
