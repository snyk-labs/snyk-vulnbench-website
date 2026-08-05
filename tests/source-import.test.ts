import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("JS 1.0 source snapshot", () => {
  it("matches the declared upstream source without nested Git metadata", () => {
    const verification = spawnSync(
      process.execPath,
      ["scripts/verify-source-import.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    expect(verification.status, verification.stderr).toBe(0);
    expect(verification.stdout).toContain(
      "Verified JS 1.0 source snapshot: 10 fixtures",
    );
  });
});
