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
  it("runs Playwright against an isolated explicit Classic server", async () => {
    const { default: config } = await import("../playwright.config");

    expect(config.use).toMatchObject({
      baseURL: "http://127.0.0.1:4323",
    });
    expect(config.webServer).toMatchObject({
      command:
        "VULNBENCH_DESIGN_THEME=classic npm run dev -- --port 4323",
      url: "http://127.0.0.1:4323",
      reuseExistingServer: false,
    });
  });

  it.each(["classic", "snyk-2026", "invalid", undefined])(
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
      const environment = { ...process.env };
      if (ambientTheme === undefined) {
        delete environment.VULNBENCH_DESIGN_THEME;
      } else {
        environment.VULNBENCH_DESIGN_THEME = ambientTheme;
      }
      const observations = inspectClassicGate(environment);

      expect(observations).toEqual(
        expectedCommands.map((command) => ({
          command,
          designTheme: "classic",
        })),
      );
    },
  );
});
