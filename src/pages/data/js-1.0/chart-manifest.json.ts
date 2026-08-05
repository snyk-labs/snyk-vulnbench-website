import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const prerender = true;

export const GET: APIRoute = async () => {
  const contents = await readFile(
    resolve(
      process.cwd(),
      "snyk-vulnbench-js-1.0/chart-manifest.json",
    ),
  );

  return new Response(contents, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="snyk-vulnbench-js-1.0-chart-manifest.json"',
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
