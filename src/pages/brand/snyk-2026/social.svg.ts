import type { APIRoute } from "astro";
import geistFontUrl from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import geistMonoFontUrl from "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url";
import { renderDefaultSocialCard } from "../../../components/social/share-card";

export const GET: APIRoute = () =>
  new Response(
    renderDefaultSocialCard({
      geistFontUrl,
      geistMonoFontUrl,
      wordmarkUrl: "/brand/snyk-2026/logo-snyk-white.png",
    }),
    {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
