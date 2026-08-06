import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const expectedCommands = [
  "check",
  "test:unit",
  "build",
  "check:releases",
  "check:budget",
  "check:brand",
  "test:e2e:snyk-2026",
];

describe("Snyk 2026 verification gate", () => {
  it("runs the default build without a Vercel theme wrapper", async () => {
    const packageJson = JSON.parse(
      await readFile(`${process.cwd()}/package.json`, "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts.build).toBe("astro build");
    expect(packageJson.scripts["build:snyk-2026"]).toBe(
      "VULNBENCH_DESIGN_THEME=snyk-2026 astro build",
    );
    expect(packageJson.scripts.verify).toContain("npm run verify:snyk-2026");
  });

  it.each([
    "vercel.json",
    "scripts/vercel-build.mjs",
    "tests/vercel-preview-theme.test.ts",
  ])("removes %s from disk", async (path) => {
    await expect(access(resolve(process.cwd(), path))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it.each(["classic", "invalid", undefined])(
    "forces every child command to Snyk 2026 under ambient %s",
    async (ambientTheme) => {
      const packageJson = JSON.parse(
        await readFile(`${process.cwd()}/package.json`, "utf8"),
      ) as { scripts: Record<string, string> };

      expect(packageJson.scripts["verify:snyk-2026"]).toBe(
        "VULNBENCH_DESIGN_THEME=snyk-2026 node scripts/verify-snyk-2026.mjs",
      );

      const { inspectSnyk2026Gate } = await import(
        pathToFileURL(
          resolve(process.cwd(), "scripts/verify-snyk-2026.mjs"),
        ).href
      );
      const environment = { ...process.env };
      if (ambientTheme === undefined) {
        delete environment.VULNBENCH_DESIGN_THEME;
      } else {
        environment.VULNBENCH_DESIGN_THEME = ambientTheme;
      }

      expect(inspectSnyk2026Gate(environment)).toEqual(
        expectedCommands.map((command) => ({
          command,
          designTheme: "snyk-2026",
        })),
      );
    },
  );
});
