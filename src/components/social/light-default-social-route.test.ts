import { describe, expect, it } from "vitest";
import { GET } from "../../pages/brand/snyk-2026/social.svg";

describe("Snyk 2026 light default social route", () => {
  it("publishes the chart-led light composition with published points", async () => {
    const response = await GET({} as never);
    const svg = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "image/svg+xml; charset=utf-8",
    );
    expect(svg).toContain('data-light-social-card=""');
    expect(svg).toContain('data-social-background=""');
    expect(svg).toContain(
      'data-point-name="Claude Opus 4.6 Medium"',
    );
    expect(svg).toContain(
      'data-point-name="Claude Sonnet 4.6 High"',
    );
  });
});
