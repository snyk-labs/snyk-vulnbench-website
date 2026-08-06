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
    expect(readme).toContain(
      "[Snyk and Light defaults design](docs/superpowers/specs/2026-08-06-snyk-light-defaults-design.md)",
    );
    expect(readme).toContain("`VULNBENCH_DESIGN_THEME`");
    expect(readme).toContain("`classic` and `snyk-2026`");
    expect(readme).toContain("Absent or empty defaults to `snyk-2026`.");
    expect(readme).toContain("Invalid explicit values fail the build.");
    expect(readme).toContain(
      "With no saved choice, Light is the color-mode default regardless of system preference.",
    );
    expect(readme).toContain(
      "Saved Light or Dark choices remain explicit overrides.",
    );
    expect(readme).toContain(
      "No-JavaScript rendering is also Light regardless of system preference.",
    );
    expect(readme).toContain(
      "docker exec vulnbench-dev sh -lc 'npm run build'",
    );
    expect(readme).toContain(
      "docker exec vulnbench-dev sh -lc 'VULNBENCH_DESIGN_THEME=classic npm run verify:classic'",
    );
    expect(readme).toContain(
      "docker exec vulnbench-dev sh -lc 'npm run verify:snyk-2026'",
    );
    expect(readme).toContain(
      "docker exec vulnbench-dev sh -lc 'npm run verify'",
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
    expect(agentsText).toContain(
      "Snyk 2026 is the default design theme; explicit `VULNBENCH_DESIGN_THEME=classic` remains the Classic override.",
    );
    expect(agentsText).toContain(
      "Light is the default color mode regardless of system preference; only saved Light or Dark choices override it.",
    );
  });

  test("records durable two-axis and asset-provenance conventions", async () => {
    const conventions = await readDocumentation("docs/CONVENTIONS.md");

    expect(conventions).toContain(
      "Snyk 2026 is the default build-selected design theme; explicit `classic` remains a deterministic override.",
    );
    expect(conventions).toContain(
      "Light is the default color mode regardless of system preference; valid saved Light or Dark choices override it.",
    );
    expect(conventions).toContain(
      "No-JavaScript output uses Light tokens regardless of system preference.",
    );
    expect(conventions).toContain(
      "The standard build and full verification gate exercise the Snyk 2026 default",
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
    expect(conventions).toContain(
      "Verification gates override the design theme for every spawned child process",
    );
    expect(conventions).toContain(
      "one rendered wordmark height on all four sides",
    );
    expect(conventions).toContain(
      "Classic may use continuous analytical scales while Snyk 2026 uses locked discrete bands.",
    );
    expect(conventions).toContain(
      "Snyk 2026 Light is a website-specific white analytical canvas",
    );
    expect(conventions).toContain(
      "one contained exact Brand Gradient accent per page",
    );
  });

  test("records the neutral identity and Dark refinement as the current branded contract", async () => {
    const conventions = await readDocumentation("docs/CONVENTIONS.md");

    expect(conventions).toContain(
      "[Snyk Dark Neutral Identity Refinement Design](superpowers/specs/2026-08-06-snyk-dark-neutral-identity-refinement-design.md)",
    );
    expect(conventions).toContain(
      "VulnBench remains the primary header identity in both designs",
    );
    expect(conventions).toContain(
      "The official Snyk wordmark appears only in the Snyk 2026 footer attribution",
    );
    expect(conventions).toContain(
      "Snyk 2026 Dark uses Midnight and restrained white-alpha depth",
    );
    expect(conventions).toContain(
      "Explicit saved Dark must resolve the approved Dark semantic tokens; no-JavaScript output remains Light under either system preference.",
    );
    expect(conventions).toContain(
      "reject saturated Dark panel fills, off-palette literals, excess gradients, decorative shadow or `drop-shadow()` effects",
    );
    expect(conventions).toContain(
      "General Dark action links use a dedicated contrast-safe near-white semantic rather than Hot Pink",
    );
    expect(conventions).toContain(
      "Audit every direct or custom-property `background`, `background-image`, `border-image`, and `border-image-source` consumer",
    );
  });

  test("explicitly supersedes stale header and Dark requirements in the original spec and plan", async () => {
    const [design, plan] = await Promise.all([
      readDocumentation(
        "docs/superpowers/specs/2026-08-05-snyk-2026-brand-theme-design.md",
      ),
      readDocumentation(
        "docs/superpowers/plans/2026-08-05-snyk-2026-brand-theme.md",
      ),
    ]);
    const refinementLink =
      "[Snyk Dark Neutral Identity Refinement Design](2026-08-06-snyk-dark-neutral-identity-refinement-design.md)";
    const planRefinementLink =
      "[Snyk Dark Neutral Identity Refinement Design](../specs/2026-08-06-snyk-dark-neutral-identity-refinement-design.md)";

    expect(design).toContain(refinementLink);
    expect(design).toContain(
      "supersedes the original header identity and Dark surface requirements below wherever they conflict",
    );
    expect(design).toContain(
      "VulnBench is the primary compact header identity",
    );
    expect(design).toContain(
      "neutral white-alpha raised surfaces replace broad saturated Dark Purple or Purple panels",
    );

    expect(plan).toContain(planRefinementLink);
    expect(plan).toContain(
      "supersedes the original header and Family A Dark implementation bullets below wherever they conflict",
    );
    expect(plan).toContain(
      "the official Snyk wordmark is footer-only",
    );
    expect(plan).toContain(
      "Light styling remains exactly preserved",
    );
  });

  test("records the accepted website-specific Light deviation", async () => {
    const [design, plan] = await Promise.all([
      readDocumentation(
        "docs/superpowers/specs/2026-08-05-snyk-2026-brand-theme-design.md",
      ),
      readDocumentation(
        "docs/superpowers/plans/2026-08-05-snyk-2026-brand-theme.md",
      ),
    ]);

    expect(design).toContain(
      "accepted website-specific deviation from the general Snyk 2026 no-light-canvas and Family-B guidance",
    );
    expect(design).toContain(
      "White `#FFFFFF` is the page, paper, and raised-surface base.",
    );
    expect(design).toContain(
      "Midnight `#030328` is primary text in Light mode.",
    );
    expect(design).toContain(
      "The exact Brand Gradient appears at most once per page",
    );
    expect(design).toContain(
      "H1 remains Bold 700; H2 and H3 use Medium 500",
    );
    expect(plan).toContain(
      "The approved 2026-08-06 Light refinement supersedes the original Family B implementation bullets",
    );
    expect(plan).toContain(
      "Snyk Light uses a white analytical canvas with Midnight copy",
    );
    expect(plan).toContain(
      "one visible exact Brand Gradient hero or PageHero accent",
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

  test("updates historical theme documents for the Snyk and Light defaults", async () => {
    const [darkModeDesign, snykDesign, snykPlan, darkRefinement] =
      await Promise.all([
      readDocumentation("docs/superpowers/specs/2026-08-05-dark-mode-theme-design.md"),
      readDocumentation(
        "docs/superpowers/specs/2026-08-05-snyk-2026-brand-theme-design.md",
      ),
      readDocumentation(
        "docs/superpowers/plans/2026-08-05-snyk-2026-brand-theme.md",
      ),
      readDocumentation(
        "docs/superpowers/specs/2026-08-06-snyk-dark-neutral-identity-refinement-design.md",
      ),
    ]);

    expect(darkModeDesign).toContain(
      "Light is the first-visit default regardless of operating-system preference",
    );
    expect(darkModeDesign).toContain(
      "the site uses Light tokens regardless of `prefers-color-scheme`",
    );
    expect(snykDesign).toContain(
      "| unset or empty | Build the `snyk-2026` design |",
    );
    expect(snykDesign).toContain(
      "The pre-paint initializer selects saved Light or Dark, otherwise Light",
    );
    expect(snykDesign).toContain(
      "explicit saved Dark mode follow the refinement. Without a saved mode and no-theme output use Light.",
    );
    expect(snykDesign).toContain(
      "Snyk 2026 Dark is the explicit saved color mode:",
    );
    expect(snykDesign).not.toContain("explicit/system Dark parity");
    expect(snykPlan).toContain(
      "Snyk 2026 and Light are the unconfigured defaults",
    );
    expect(snykPlan).toContain(
      "No-JavaScript output uses Light regardless of system preference.",
    );
    expect(darkRefinement).toContain(
      "Standard `npm run build` uses Snyk 2026 by default",
    );
    expect(darkRefinement).toContain(
      "The temporary Vercel PR-branch build wrapper is removed.",
    );
    expect(darkRefinement).not.toContain(
      "The Vercel branch-preview configuration remains unchanged.",
    );
  });
});
