import type { APIRoute } from "astro";
import { loadJs10PublishedEvidence } from "../../../data/releases/js-1.0-source";

export const prerender = true;

export const GET: APIRoute = async () => {
  const evidence = await loadJs10PublishedEvidence();

  return new Response(`${JSON.stringify(evidence, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="snyk-vulnbench-js-1.0-published-evidence.json"',
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
