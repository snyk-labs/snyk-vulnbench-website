import type { APIRoute } from "astro";
import geistFontUrl from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import geistMonoFontUrl from "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url";
import { renderDefaultSocialCard } from "../../../components/social/share-card";
import { loadJs10PublishedEvidence } from "../../../data/releases/js-1.0-source";

export const GET: APIRoute = async () => {
  const evidence = await loadJs10PublishedEvidence();

  return new Response(
    renderDefaultSocialCard(
      {
        geistFontUrl,
        geistMonoFontUrl,
        wordmarkUrl: "/brand/snyk-2026/logo-snyk-white.png",
      },
      { agreementVariance: evidence.agreementVariance },
    ),
    {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
};
