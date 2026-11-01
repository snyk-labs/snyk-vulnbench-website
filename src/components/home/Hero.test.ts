import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const componentPath = resolve(process.cwd(), "src/components/home/Hero.astro");

test("frames the hero with the 2.0 copy, Figure 1 and the short disclosure", async () => {
  const component = (await readFile(componentPath, "utf8")).replace(/\s+/g, " ");

  for (const binding of [
    "{home.h1}",
    "{home.subtitle}",
    "{home.lede}",
    "{home.headline_evidence.kicker}",
    "{home.headline_evidence.h2}",
    "{home.headline_evidence.for_appsec}",
    "{home.headline_evidence.dataset_line}",
    '<Disclosure form="short" />',
    "<EvidenceStrip items={home.stats} />",
    "<PaperFigure number={1}",
  ]) {
    expect(component).toContain(binding);
  }
  expect(component).not.toContain("5 identical reviews");
});
