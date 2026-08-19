import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const componentPath = resolve(process.cwd(), "src/components/home/LatestEvidence.astro");

test("leads the evidence band with the repeatability contrast", async () => {
  const component = (await readFile(componentPath, "utf8")).replace(/\s+/g, " ");

  expect(component).toContain("Same code. Same prompt. Different findings.");
  expect(component).toContain(
    "Across five identical runs, 84.8% of reference-matched findings recurred every time.",
  );
  expect(component).toContain(
    "Nearly half of unmatched reports appeared only once—evidence to inspect, not dismiss.",
  );
  expect(component).toContain(
    "Nearly half of unmatched reports surfaced in just one run.",
  );
  expect(component).toContain(
    "Only 13.7% of unmatched reports recurred in all five runs.",
  );
  expect(component).toContain('value: "5.67×"');
  expect(component).toContain(
    "Opus 4.7 Max cost more and scored lower than Opus 4.6 Medium: 68.8% vs 75.4% Snyk-reference F1.",
  );
  expect(component).toContain(
    'href: "/releases/js-1.0/explore?view=efficiency"',
  );
});
