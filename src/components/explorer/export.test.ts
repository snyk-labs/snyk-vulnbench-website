import { describe, expect, it } from "vitest";
import { barChartSvg, serializeSvg, toCsv } from "./export";

describe("explorer exports", () => {
  it("formats deterministic CSV with escaping and N/A semantics", () => {
    expect(
      toCsv(
        ["Configuration", "Cost", "Note"],
        [
          ["Claude Opus 4.6 Medium", 0.06276035, 'Stable, "efficient"'],
          ["Snyk Code SAST", null, "Command\nreference"],
        ],
      ),
    ).toBe(
      'Configuration,Cost,Note\r\nClaude Opus 4.6 Medium,0.06276035,"Stable, ""efficient"""\r\nSnyk Code SAST,N/A,"Command\nreference"\r\n',
    );
  });

  it("serializes SVG with its namespace and accessible title", () => {
    document.body.innerHTML =
      '<svg role="img" aria-label="Agreement chart" viewBox="0 0 10 10"><title>Agreement chart</title><circle cx="5" cy="5" r="2"></circle></svg>';
    const svg = document.querySelector("svg");
    if (!(svg instanceof SVGElement)) throw new Error("SVG fixture missing");

    const serialized = serializeSvg(svg);

    expect(serialized).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(serialized).toContain("<title>Agreement chart</title>");
    expect(serialized).toContain("<circle");
  });

  it("builds an accessible standalone SVG bar chart", () => {
    const svg = barChartSvg("Repeatability", [
      { label: "Stable matched", value: 134, maximum: 158 },
      { label: "Unmatched once", value: 80, maximum: 161 },
    ]);

    expect(svg).toContain("<title>Repeatability</title>");
    expect(svg).toContain("Stable matched");
    expect(svg).toContain("<rect");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
});
