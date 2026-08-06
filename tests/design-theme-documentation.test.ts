import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const readDocumentation = async (path: string) =>
  (await readFile(resolve(process.cwd(), path), "utf8")).replace(/\s+/gu, " ");

describe("Snyk 2026 design-theme documentation", () => {
  test("documents the build-selected deployment contract", async () => {
    const readme = await readDocumentation("README.md");

    expect(readme).toContain(
      "[Snyk 2026 brand design](docs/superpowers/specs/2026-08-05-snyk-2026-brand-theme-design.md)",
    );
    expect(readme).toContain("`VULNBENCH_DESIGN_THEME`");
    expect(readme).toContain("`classic` and `snyk-2026`");
    expect(readme).toContain("Absent or empty defaults to `classic`.");
    expect(readme).toContain("Invalid explicit values fail the build.");
    expect(readme).toContain("docker exec vulnbench-dev sh -lc 'npm run verify:classic'");
    expect(readme).toContain(
      "docker exec vulnbench-dev sh -lc 'npm run verify:snyk-2026'",
    );
    expect(readme).toContain(
      "Visitors control only the Light or Dark color mode within the selected design.",
    );
  });

  test("keeps agent guidance identical and scopes visual rules", async () => {
    const [agents, claude] = await Promise.all([
      readFile(resolve(process.cwd(), "AGENTS.md"), "utf8"),
      readFile(resolve(process.cwd(), "CLAUDE.md"), "utf8"),
    ]);

    expect(claude).toBe(agents);
    const agentsText = agents.replace(/\s+/gu, " ");
    expect(agentsText).toContain(
      "docs/superpowers/specs/2026-08-05-snyk-2026-brand-theme-design.md",
    );
    expect(agentsText).toContain(
      "docs/superpowers/plans/2026-08-05-snyk-2026-brand-theme.md",
    );
    expect(agentsText).toContain(
      "The warm-neutral and no-gradient editorial rules apply to Classic only.",
    );
    expect(agentsText).toContain(
      '`data-design-theme="snyk-2026"` is governed by the Snyk 2026 brand design specification.',
    );
    expect(agentsText).toContain("`npm run verify:classic`");
    expect(agentsText).toContain("`npm run verify:snyk-2026`");
    expect(agentsText).toContain("`npm run check:brand`");
    expect(agentsText).toContain("`npm run verify`");
  });

  test("records durable two-axis and asset-provenance conventions", async () => {
    const conventions = await readDocumentation("docs/CONVENTIONS.md");

    expect(conventions).toContain(
      "Design theme is selected at build time; color mode is selected by the visitor or system preference.",
    );
    expect(conventions).toContain(
      "Shared components consume semantic CSS tokens rather than environment variables.",
    );
    expect(conventions).toContain(
      "Classic and Snyk 2026 output require separate verification.",
    );
    expect(conventions).toContain(
      "Branded changes must pass the mechanical brand audit and real visual and Axe checks.",
    );
    expect(conventions).toContain(
      "Approved local branded assets retain documented provenance and checksums.",
    );
  });

  test("limits canonical-light static assets to Classic", async () => {
    const darkModeDesign = await readDocumentation(
      "docs/superpowers/specs/2026-08-05-dark-mode-theme-design.md",
    );

    expect(darkModeDesign).toContain(
      "This canonical-light asset rule applies to Classic.",
    );
    expect(darkModeDesign).toContain(
      "Snyk 2026 build-selected assets follow the Snyk 2026 brand design specification.",
    );
  });
});
