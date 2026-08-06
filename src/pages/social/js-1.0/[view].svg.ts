import type { APIRoute, GetStaticPaths } from "astro";
import geistFontUrl from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import geistMonoFontUrl from "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url";
import { renderReleaseShareCard } from "../../../components/social/share-card";
import { designTheme } from "../../../config/design-theme";

const cards = {
  summary: {
    eyebrow: "JS 1.0 · Summary",
    title: "Can LLMs find the same bugs twice?",
    finding: "134 of 158 reference-matched signatures appeared in all five runs.",
    metric: "Reference-matched recurrence",
    value: "134 of 158",
    unit: "unique normalized signatures",
    source: "published-evidence.json",
    caveat: "Reference agreement is not universal accuracy.",
  },
  repeatability: {
    eyebrow: "JS 1.0 · Repeatability",
    title: "Stable matches. Variable extras.",
    finding: "80 of 161 unmatched signatures appeared in only one run.",
    metric: "One-run unmatched recurrence",
    value: "80 of 161",
    unit: "unique normalized signatures",
    source: "published-evidence.json",
    caveat: "Unmatched findings require case-level inspection.",
  },
  coverage: {
    eyebrow: "JS 1.0 · Coverage",
    title: "Different systems exposed different strengths.",
    finding: "High-signal exploit shapes were recovered more consistently.",
    metric: "Reference coverage domain",
    value: "17 documented",
    unit: "vulnerability classes",
    source: "benchmark JSONL + model-callout manifest",
    caveat: "Snyk Code defines this release’s deterministic reference set.",
  },
  efficiency: {
    eyebrow: "JS 1.0 · Efficiency",
    title: "Higher session cost did not guarantee higher agreement.",
    finding: "Opus 4.6 Medium was the strongest published cost-quality point.",
    metric: "Snyk-reference F1 vs estimated cost",
    value: "75.4% at $0.063",
    unit: "F1 percent and USD/session",
    source: "benchmark JSONL + root chart manifest",
    caveat: "Costs reflect small fixtures and published pricing assumptions.",
  },
} as const;

export const getStaticPaths: GetStaticPaths = () =>
  Object.keys(cards).map((view) => ({ params: { view } }));

export const GET: APIRoute = ({ params }) => {
  const view = params.view as keyof typeof cards;
  const card = cards[view];
  if (!card) return new Response("Not found", { status: 404 });

  const svg = renderReleaseShareCard(
    card,
    designTheme === "classic"
      ? { designTheme: "classic" }
      : {
          designTheme: "snyk-2026",
          assets: {
            geistFontUrl,
            geistMonoFontUrl,
            wordmarkUrl: "/brand/snyk-2026/logo-snyk-white.png",
          },
        },
  );

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
