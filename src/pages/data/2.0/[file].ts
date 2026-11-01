import type { APIRoute, GetStaticPaths } from "astro";
import { getV20Table, v20Tables } from "../../../data/releases/2.0-content";

export const prerender = true;

export const getStaticPaths = (() =>
  v20Tables.flatMap(({ name }) => [
    { params: { file: `${name}.csv` } },
    { params: { file: `${name}.meta.json` } },
  ])) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const file = params.file ?? "";
  const isCsv = file.endsWith(".csv");
  const table = getV20Table(file.replace(/\.(csv|meta\.json)$/u, ""));
  const body = isCsv ? table.csv : table.metaJson;

  return new Response(body, {
    headers: {
      "Content-Type": isCsv ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
