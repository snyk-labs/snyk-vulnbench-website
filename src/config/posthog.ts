import type { CaptureResult, PostHogConfig } from "posthog-js";

export const posthogProjectToken =
  "phc_uk6CX56oMAvZ9i3aaRgwq2Fqz7Js9uHUbFt33ZPQhhvL";

export function sanitizeAnalyticsUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
}

export function sanitizePostHogEvent(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event || event.event !== "$pageview") {
    return null;
  }

  const currentUrl = sanitizeAnalyticsUrl(
    typeof event.properties.$current_url === "string"
      ? event.properties.$current_url
      : "",
  );
  const token = event.properties.token;
  const cookielessMode = event.properties.$cookieless_mode;
  const distinctId = event.properties.distinct_id;
  const library = event.properties.$lib;
  const libraryVersion = event.properties.$lib_version;
  const host = event.properties.$host;
  const pathname = event.properties.$pathname;

  if (
    !currentUrl ||
    typeof token !== "string" ||
    cookielessMode !== true ||
    typeof distinctId !== "string" ||
    typeof library !== "string" ||
    typeof libraryVersion !== "string" ||
    typeof host !== "string" ||
    typeof pathname !== "string"
  ) {
    return null;
  }

  return {
    uuid: event.uuid,
    event: event.event,
    properties: {
      token,
      $cookieless_mode: true,
      distinct_id: distinctId,
      $current_url: currentUrl,
      $lib: library,
      $lib_version: libraryVersion,
      $host: host,
      $pathname: pathname,
    },
  };
}

export const posthogOptions = {
  api_host: "https://eu.i.posthog.com",
  defaults: "2026-05-30",
  cookieless_mode: "always",
  persistence: "memory",
  person_profiles: "never",
  autocapture: false,
  capture_pageview: true,
  capture_pageleave: false,
  capture_performance: false,
  capture_exceptions: false,
  disable_session_recording: true,
  disable_surveys: true,
  advanced_disable_flags: true,
  property_denylist: ["$referrer", "$referring_domain"],
  before_send: sanitizePostHogEvent,
} satisfies Partial<PostHogConfig>;
