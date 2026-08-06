import { describe, expect, it } from "vitest";
import { GET } from "../../pages/brand/snyk-2026/social.svg";

describe("Snyk 2026 default social image endpoint", () => {
  it("serves the canonical branded SVG at the configured stable path", async () => {
    const response = await GET({} as never);
    const svg = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "image/svg+xml; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(svg).toContain("Snyk VulnBench JS 1.0");
    expect(svg).toContain('data-brand-background=""');
    expect(svg).toContain('data-copy-region=""');
    expect(svg).toContain("/brand/snyk-2026/logo-snyk-white.png");
    expect(svg).toContain("Geist");
    expect(svg).toContain("Geist Mono");
  });
});
