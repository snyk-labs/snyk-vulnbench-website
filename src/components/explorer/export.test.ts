import { afterEach, describe, expect, it } from "vitest";
import { barChartSvg, serializeSvg, toCsv } from "./export";

describe("explorer exports", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-design-theme");
    document.body.innerHTML = "";
  });

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

  it("serializes standalone SVG with theme-resolved presentation colors", () => {
    document.documentElement.style.setProperty("--paper-raised", "#101820");
    document.documentElement.style.setProperty(
      "--theme-export-surface",
      "#101820",
    );
    document.documentElement.style.setProperty("--theme-export-text", "#f4efe7");
    document.documentElement.style.setProperty("--ink", "#f4efe7");
    document.documentElement.style.setProperty("--rule", "#536170");
    document.documentElement.style.setProperty("--series-1", "#8fb8ff");
    document.body.innerHTML = `
      <style>
        .chart { background: var(--paper-raised); }
        .chart text {
          fill: var(--ink);
          font-family: "Test Sans";
          font-size: 15px;
          font-weight: 750;
          text-anchor: end;
        }
        .chart line { stroke: var(--rule); }
      </style>
      <svg class="chart" role="img" aria-label="Agreement chart" viewBox="0 0 10 10">
        <title>Agreement chart</title>
        <line x1="0" x2="10" y1="5" y2="5"></line>
        <text x="1" y="4">Agreement</text>
        <circle cx="5" cy="5" r="2" fill="var(--series-1)"></circle>
      </svg>`;
    const svg = document.querySelector("svg");
    if (!(svg instanceof SVGElement)) throw new Error("SVG fixture missing");

    const serialized = serializeSvg(svg);

    expect(serialized).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(serialized).toContain("<title>Agreement chart</title>");
    expect(serialized).toContain('fill="#101820"');
    expect(serialized).toContain('fill="#f4efe7"');
    expect(serialized).toContain('stroke="#536170"');
    expect(serialized).toContain('fill="#8fb8ff"');
    expect(serialized).not.toContain("var(--");

    const exportedText = new DOMParser()
      .parseFromString(serialized, "text/html")
      .querySelector("text");
    expect(exportedText?.getAttribute("font-family")).toBe('"Test Sans"');
    expect(exportedText?.getAttribute("font-size")).toBe("15px");
    expect(exportedText?.getAttribute("font-weight")).toBe("750");
    expect(exportedText?.getAttribute("text-anchor")).toBe("end");
    expect(exportedText?.hasAttribute("class")).toBe(false);
    expect(exportedText?.hasAttribute("style")).toBe(false);
  });

  it("resolves alpha presentation to an opaque export palette", () => {
    document.documentElement.style.setProperty("--paper-raised", "rgba(255, 255, 255, 0.08)");
    document.documentElement.style.setProperty("--ink-soft", "rgba(255, 255, 255, 0.65)");
    document.documentElement.style.setProperty("--theme-export-surface", "#030328");
    document.documentElement.style.setProperty("--theme-export-text", "#FFFFFF");
    document.body.innerHTML = `
      <style>
        .chart { background: var(--paper-raised); }
        .chart text { fill: var(--ink-soft); }
      </style>
      <svg class="chart" role="img" aria-label="Dark export" viewBox="0 0 10 10">
        <title>Dark export</title>
        <text x="1" y="4">Readable text</text>
      </svg>`;
    const svg = document.querySelector("svg");
    if (!(svg instanceof SVGElement)) throw new Error("SVG fixture missing");

    const serialized = serializeSvg(svg);

    expect(serialized).toContain('data-export-background=""');
    expect(serialized).toContain('fill="#030328"');
    const exportedText = new DOMParser()
      .parseFromString(serialized, "text/html")
      .querySelector("text");
    expect(exportedText?.getAttribute("fill")).toBe("#FFFFFF");
  });

  it("builds a standalone SVG bar chart with the active theme palette", () => {
    document.documentElement.style.setProperty("--paper-raised", "#111820");
    document.documentElement.style.setProperty("--ink", "#f7f1e8");
    document.documentElement.style.setProperty("--matched", "#75d8ca");
    document.documentElement.style.setProperty("--unmatched", "#ff9b80");
    document.documentElement.style.setProperty("--series-fallback", "#b8afbd");
    document.documentElement.style.setProperty(
      "--font-sans",
      '"Export Sans", sans-serif',
    );
    document.documentElement.style.setProperty(
      "--font-mono",
      '"Export Mono", monospace',
    );

    const svg = barChartSvg("Repeatability", [
      { label: "Stable matched", value: 134, maximum: 158, tone: "matched" },
      { label: "Unmatched once", value: 80, maximum: 161, tone: "unmatched" },
      { label: "Context", value: 12, maximum: 20 },
    ]);

    expect(svg).toContain("<title>Repeatability</title>");
    expect(svg).toContain("Stable matched");
    expect(svg).toContain("<rect");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('fill="#111820"');
    expect(svg).toContain('fill="#f7f1e8"');
    expect(svg).toContain('fill="#75d8ca"');
    expect(svg).toContain('fill="#ff9b80"');
    expect(svg).toContain('fill="#b8afbd"');
    expect(svg).toContain(
      'font-family="&quot;Export Sans&quot;, sans-serif"',
    );
    expect(svg).toContain(
      'font-family="&quot;Export Mono&quot;, monospace"',
    );
  });

  it("inlines computed Snyk 2026 colors and fonts without Classic fallbacks", () => {
    document.documentElement.dataset.designTheme = "snyk-2026";
    document.body.innerHTML = `
      <style>
        html[data-design-theme="snyk-2026"] {
          --paper-raised: rgba(255, 255, 255, 0.08);
          --ink: rgba(255, 255, 255, 0.78);
          --matched: #6F00DD;
          --unmatched: #F3552E;
          --series-fallback: rgba(255, 255, 255, 0.65);
          --theme-export-surface: #030328;
          --theme-export-text: #FFFFFF;
          --font-sans: "Geist Variable", sans-serif;
          --font-mono: "Geist Mono Variable", monospace;
        }
      </style>`;

    const svg = barChartSvg("Snyk reference agreement", [
      { label: "Reference-matched", value: 134, maximum: 158, tone: "matched" },
      { label: "Unmatched", value: 80, maximum: 161, tone: "unmatched" },
      { label: "All signatures", value: 314, maximum: 319 },
    ]);

    expect(svg).toContain('fill="#030328"');
    expect(svg).toContain('fill="#FFFFFF"');
    expect(svg).toContain('fill="#6F00DD"');
    expect(svg).toContain('fill="#F3552E"');
    expect(svg).toContain('fill="#6F00DD"');
    expect(svg).toContain("Geist Variable");
    expect(svg).toContain("Geist Mono Variable");
    expect(svg).not.toContain("var(--");
    expect(svg).not.toContain("rgba(");
    expect(svg).not.toMatch(/Inter|#087c71|#b54c31|#fffdf8/i);
  });
});
