import { describe, expect, it } from "vitest";
import { js10Release } from "./js-1.0";
import { v20Release } from "./2.0";
import { v20CitationBib } from "./2.0-content";
import { formatBibtexCitation } from "./citation";

describe("formatBibtexCitation", () => {
  it("formats JS 1.0 as an importable arXiv BibTeX entry", () => {
    expect(formatBibtexCitation(js10Release)).toBe(`@misc{tal2026snykvulnbenchjs10,
  author = {Tal, Liran and Kloos, Johannes and Rudich, Arsenii and Thoemmes, Stephen and Nair, Manoj},
  title = {Snyk VulnBench JS 1.0: Can LLMs Find the Same Bugs Twice?},
  year = {2026},
  url = {https://arxiv.org/abs/2606.15762}
}`);
  });

  it("orders multi-word names and escapes BibTeX-sensitive values", () => {
    const result = formatBibtexCitation({
      id: "example-1.0",
      citation: {
        authors: ["Ada Lovelace"],
        title: "A {study} with a \\ check",
        year: 2026,
        url: "https://example.test/paper",
      },
    });

    expect(result).toContain("author = {Lovelace, Ada}");
    expect(result).toContain(
      "title = {A \\{study\\} with a \\textbackslash{} check}",
    );
    expect(result).toContain("@misc{lovelace2026example10,");
  });

  it("escapes TeX-sensitive characters and renders literal backslashes", () => {
    const result = formatBibtexCitation({
      id: "example-1.0",
      citation: {
        authors: ["Ada Lovelace"],
        title:
          "50% costs $5 & tags #1_2 use ~ and ^ with {braces} and \\backslashes",
        year: 2026,
        url: "https://example.test/paper",
      },
    });

    expect(result).toContain(
      "title = {50\\% costs \\$5 \\& tags \\#1\\_2 use \\textasciitilde{} and \\textasciicircum{} with \\{braces\\} and \\textbackslash{}backslashes}",
    );
  });
});

describe("published BibTeX entries", () => {
  it("match the reviewed citation.bib for both releases, 2.0 first", () => {
    expect(v20CitationBib.trim()).toBe(
      [formatBibtexCitation(v20Release), formatBibtexCitation(js10Release)].join("\n\n"),
    );
  });
});
