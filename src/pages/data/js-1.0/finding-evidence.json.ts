import type { APIRoute } from "astro";
import { loadJs10EvidenceDepth } from "../../../data/evidence/js-1.0";

export const prerender = true;

export const GET: APIRoute = async () => {
  const evidence = await loadJs10EvidenceDepth();

  return new Response(`${JSON.stringify(evidence, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="snyk-vulnbench-js-1.0-finding-evidence.json"',
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
