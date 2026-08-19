import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const componentPath = resolve(process.cwd(), "src/components/home/KeyFindings.astro");
const releasePath = resolve(process.cwd(), "src/data/releases/js-1.0.ts");

test("frames headline findings as practical implications", async () => {
  const [component, release] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(releasePath, "utf8"),
  ]);
  const normalizedComponent = component.replace(/\s+/g, " ");
  const normalizedRelease = release.replace(/\s+/g, " ");

  expect(normalizedComponent).toContain("What the results mean in practice");
  expect(normalizedComponent).toContain(
    "An AI review is a measurement—not a verdict.",
  );
  expect(normalizedComponent).toContain(
    "Repeat the same task and the story sharpens: many reference-matched findings hold steady; AI review and deterministic SAST reveal different blind spots; and more spend does not reliably improve Snyk-reference agreement.",
  );
  expect(normalizedRelease).toContain("Repeatability makes confidence visible");
  expect(normalizedRelease).toContain(
    "AI review and SAST expose different blind spots",
  );
  expect(normalizedRelease).toContain(
    "Paying more did not reliably improve the result",
  );
});
