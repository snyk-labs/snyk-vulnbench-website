import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const componentPath = resolve(process.cwd(), "src/components/home/Hero.astro");

test("frames hero evidence around repeated identical reviews", async () => {
  const component = (await readFile(componentPath, "utf8")).replace(/\s+/g, " ");

  expect(component).toContain("Headline evidence · 5 identical reviews");
  expect(component).toContain("Same review. Different results.");
  expect(component).toContain("{currentRelease.evidence.scans} scans");
  expect(component).toContain("{currentRelease.evidence.projects} projects");
  expect(component).toContain(
    "{currentRelease.evidence.configurations} configurations",
  );
});
