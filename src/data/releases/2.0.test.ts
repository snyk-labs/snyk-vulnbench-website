import { describe, expect, it } from "vitest";
import { v20Release } from "./2.0";
import {
  getV20Table,
  inPaperOrder,
  parseCsv,
  v20Configurations,
  v20Copy,
  v20Figures,
  v20Tables,
} from "./2.0-content";
import { compareMetricCompatibility } from "./compatibility";
import { js10Release } from "./js-1.0";

describe("Snyk VulnBench 2.0 release manifest", () => {
  it("uses the reviewed release identity and public links", () => {
    expect(v20Release).toMatchObject({
      id: "snyk-vulnbench-2.0",
      slug: "2.0",
      name: v20Copy.releaseCard.name,
      shortName: "2.0",
      status: "current",
      publishedAt: "2026-10-28",
      datasetVersion: v20Copy.releaseCard.dataset,
      researchQuestion: v20Copy.releaseCard.question,
      description: v20Copy.releaseCard.summary,
      studyType: v20Copy.home.subtitle,
    });
    expect(v20Release.links).toEqual({
      overview: "/releases/2.0",
      explore: "/releases/2.0/explore",
      methodology: "/releases/2.0/methodology",
      data: "/releases/2.0/data",
      paper: "https://arxiv.org/abs/2610.38617",
      github: "https://github.com/snyk-labs/snyk-vulnbench",
    });
    expect(v20Release.links).not.toHaveProperty("publication");
    expect(v20Release.citation).toMatchObject({
      authors: [
        "Liran Tal",
        "Chris Liu",
        "Charlotte Fereday",
        "Sebastian Roth",
        "Brian Clark",
      ],
      arxivId: "2610.38617",
      pdfUrl: "https://arxiv.org/pdf/2610.38617",
      doi: "10.48550/arXiv.2610.38617",
    });
  });

  it("keeps its scope counts consistent with the published tables", () => {
    expect(v20Release.evidence.configurations).toBe(getV20Table("headline").rows.length);
    expect(v20Release.evidence.projects).toBe(getV20Table("per_app").rows.length);
    expect(v20Release.evidence.repetitions).toBe(1);
    expect(v20Release.evidence.scans).toBe(
      v20Release.evidence.configurations * v20Release.evidence.projects,
    );
  });

  it("publishes every table as a versioned CSV asset", () => {
    expect(v20Tables).toHaveLength(15);
    expect(v20Release.assets.map(({ path }) => path)).toEqual(
      v20Tables.map(({ name }) => `/data/2.0/${name}.csv`),
    );
  });

  it("keeps findings in the paper's order with their caveats", () => {
    expect(v20Copy.findings.map(({ id }) => id)).toEqual([
      "complementarity",
      "harness-policy",
      "efficiency",
      "robustness",
    ]);
    expect(v20Release.featuredFindings).toEqual(
      v20Copy.findings.map((finding) =>
        expect.objectContaining({
          title: finding.title,
          summary: finding.body[0],
          caveat: finding.care,
        }),
      ),
    );
  });

  it("separates DeepSec's localized recall from the endpoint-aware rows", () => {
    const headline = getV20Table("headline");
    expect(headline.rows.map(({ config_id }) => config_id)).toEqual(
      v20Configurations.map(({ config_id }) => config_id),
    );
    expect(
      v20Configurations
        .filter(({ family }) => family === "DeepSec")
        .every(({ metric }) => metric === "localized_recall"),
    ).toBe(true);
    if (v20Release.headlineEvidence.kind !== "generic") {
      throw new Error("2.0 must expose generic headline observations");
    }
    expect(v20Release.headlineEvidence.observations.map(({ value }) => String(value))).toEqual(
      headline.rows.map(({ macro_recall_pct }) => String(Number(macro_recall_pct))),
    );
  });

  it("restores paper order for tables stored in a different order", () => {
    const ordered = inPaperOrder(getV20Table("flow_shape").rows).map(
      ({ config_id }) => config_id,
    );
    expect(ordered).toEqual(
      v20Configurations
        .filter(({ metric }) => metric === "ar_recall")
        .map(({ config_id }) => config_id),
    );
  });

  it("never declares a 2.0 metric comparable with a JS 1.0 metric", () => {
    for (const { metricId } of v20Release.compatibility.metricLineage) {
      expect(compareMetricCompatibility(v20Release, js10Release, metricId).allowed).toBe(false);
    }
    for (const { id } of js10Release.metrics) {
      expect(compareMetricCompatibility(js10Release, v20Release, id).allowed).toBe(false);
    }
  });

  it("indexes all thirteen paper figures with captions and alt text", () => {
    expect(v20Figures.map(({ number }) => number)).toEqual(
      Array.from({ length: 13 }, (_, index) => index + 1),
    );
    expect(v20Figures[0]?.light.svg).toBe(
      "/figures/2.0/svg/light/vulnbench-2.0-figure-01.svg",
    );
  });
});

describe("parseCsv", () => {
  it("handles quoted cells, escaped quotes and empty cells", () => {
    expect(parseCsv('a,b,c\n"x, y","say ""hi""",\n')).toEqual([
      ["a", "b", "c"],
      ["x, y", 'say "hi"', ""],
    ]);
  });
});
