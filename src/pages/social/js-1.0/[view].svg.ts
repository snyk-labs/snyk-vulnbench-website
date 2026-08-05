import type { APIRoute, GetStaticPaths } from "astro";

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

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const GET: APIRoute = ({ params }) => {
  const view = params.view as keyof typeof cards;
  const card = cards[view];
  if (!card) return new Response("Not found", { status: 404 });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(card.title)}</title>
  <desc id="description">${escapeXml(card.finding)}</desc>
  <rect width="1200" height="630" fill="#f7f4ed"/>
  <rect x="0" width="28" height="630" fill="#4b2be3"/>
  <text x="80" y="92" fill="#4b2be3" font-family="monospace" font-size="24" font-weight="700">${escapeXml(card.eyebrow.toUpperCase())}</text>
  <text x="80" y="190" fill="#17141f" font-family="Arial, sans-serif" font-size="58" font-weight="700">${escapeXml(card.title)}</text>
  <rect x="80" y="252" width="1040" height="2" fill="#aaa1b0"/>
  <text x="80" y="315" fill="#17141f" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeXml(card.finding)}</text>
  <text x="80" y="365" fill="#625d68" font-family="monospace" font-size="17">${escapeXml(card.metric.toUpperCase())}</text>
  <text x="80" y="400" fill="#4b2be3" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeXml(card.value)} · ${escapeXml(card.unit)}</text>
  <rect x="80" y="430" width="1040" height="92" fill="#eee9df" stroke="#aaa1b0"/>
  <text x="108" y="468" fill="#625d68" font-family="monospace" font-size="18">KEEP IN MIND</text>
  <text x="108" y="498" fill="#17141f" font-family="Arial, sans-serif" font-size="22">${escapeXml(card.caveat)}</text>
  <text x="80" y="560" fill="#625d68" font-family="monospace" font-size="16">Source: ${escapeXml(card.source)}</text>
  <text x="80" y="592" fill="#625d68" font-family="monospace" font-size="18">Dataset 1.0.0 · Snyk VulnBench JS 1.0 · vulnbench.com</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
