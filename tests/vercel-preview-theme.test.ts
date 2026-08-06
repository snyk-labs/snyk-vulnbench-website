import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const previewBranch = "feat/snyk-2026-brand-theme";

async function loadBuildModule() {
  return import(
    pathToFileURL(resolve(process.cwd(), "scripts/vercel-build.mjs")).href
  );
}

describe("Vercel PR preview theme", () => {
  it("selects Snyk 2026 only for this branch preview", async () => {
    const { resolveVercelDesignTheme } = await loadBuildModule();

    expect(
      resolveVercelDesignTheme({
        VERCEL_ENV: "preview",
        VERCEL_GIT_COMMIT_REF: previewBranch,
      }),
    ).toBe("snyk-2026");
    expect(
      resolveVercelDesignTheme({
        VERCEL_ENV: "preview",
        VERCEL_GIT_COMMIT_REF: previewBranch,
        VULNBENCH_DESIGN_THEME: "classic",
      }),
    ).toBe("classic");
  });

  it("preserves deployment configuration outside this branch preview", async () => {
    const { resolveVercelDesignTheme } = await loadBuildModule();

    expect(
      resolveVercelDesignTheme({
        VERCEL_ENV: "preview",
        VERCEL_GIT_COMMIT_REF: "another-branch",
      }),
    ).toBeUndefined();
    expect(
      resolveVercelDesignTheme({
        VERCEL_ENV: "production",
        VERCEL_GIT_COMMIT_REF: previewBranch,
        VULNBENCH_DESIGN_THEME: "classic",
      }),
    ).toBe("classic");
    expect(
      resolveVercelDesignTheme({
        VERCEL_ENV: "production",
        VERCEL_GIT_COMMIT_REF: "main",
        VULNBENCH_DESIGN_THEME: "snyk-2026",
      }),
    ).toBe("snyk-2026");
  });

  it("wires Vercel builds through the branch-aware runner", async () => {
    const config = JSON.parse(
      await readFile(`${process.cwd()}/vercel.json`, "utf8"),
    ) as { buildCommand?: string };

    expect(config.buildCommand).toBe("node scripts/vercel-build.mjs");
  });
});
