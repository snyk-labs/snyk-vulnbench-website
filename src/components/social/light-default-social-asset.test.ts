import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Snyk 2026 default social PNG", () => {
  it("ships a cross-platform 1200x630 PNG under the WhatsApp-friendly size target", async () => {
    const image = await readFile(
      resolve(process.cwd(), "public/brand/snyk-2026/social.png"),
    );

    expect(image.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
    expect(image.byteLength).toBeLessThan(300 * 1024);
  });
});
