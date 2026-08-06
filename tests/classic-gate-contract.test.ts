import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const expectedCommands = [
  "check",
  "test:unit",
  "build",
  "check:releases",
  "check:budget",
  "test:e2e",
];

describe("Classic verification gate", () => {
  it.each(["classic", "snyk-2026"])(
    "forces every child command to Classic under ambient %s",
    async (ambientTheme) => {
      const packageJson = JSON.parse(
        await readFile(`${process.cwd()}/package.json`, "utf8"),
      ) as { scripts: Record<string, string> };

      expect(packageJson.scripts["verify:classic"]).toBe(
        "VULNBENCH_DESIGN_THEME=classic node scripts/verify-classic.mjs",
      );

      const { inspectClassicGate } = await import(
        "../scripts/verify-classic.mjs"
      );
      const observations = inspectClassicGate({
          ...process.env,
          VULNBENCH_DESIGN_THEME: ambientTheme,
      });

      expect(observations).toEqual(
        expectedCommands.map((command) => ({
          command,
          designTheme: "classic",
        })),
      );
    },
  );
});
