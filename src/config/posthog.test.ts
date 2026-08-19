import type { CaptureResult } from "posthog-js";
import { describe, expect, it } from "vitest";
import {
  posthogOptions,
  posthogProjectToken,
  sanitizeAnalyticsUrl,
  sanitizePostHogEvent,
} from "./posthog";

describe("PostHog privacy contract", () => {
  it("uses EU cookieless page-view-only settings", () => {
    expect(posthogOptions).toMatchObject({
      api_host: "https://eu.i.posthog.com",
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
    });
    expect(posthogOptions).not.toHaveProperty("disable_compression");
  });

  it("removes query strings and fragments from analytics URLs", () => {
    expect(
      sanitizeAnalyticsUrl(
        "https://vulnbench.com/releases/js-1.0/explore?v=1&view=findings#detail",
      ),
    ).toBe("https://vulnbench.com/releases/js-1.0/explore");
    expect(sanitizeAnalyticsUrl("not a URL")).toBeNull();
  });

  it("retains only required pageview transport data", () => {
    expect(
      sanitizePostHogEvent({
        uuid: "c8bf40d3-c21c-4dbe-9d7f-7091e3b0eace",
        event: "$autocapture",
        properties: {},
      } as CaptureResult),
    ).toBeNull();

    expect(
      sanitizePostHogEvent({
        uuid: "ee2d9a4a-34bd-4911-b45c-c5f181cd59cf",
        event: "$pageview",
        properties: {
          token: posthogProjectToken,
          $cookieless_mode: true,
          $current_url: "https://vulnbench.com/?email=reader@example.com#top",
          $lib: "web",
          $lib_version: "1.418.1",
          $host: "vulnbench.com",
          $pathname: "/",
          $pageview_id: "page-view-id",
          $event_type: "pageview",
          $referrer: "https://example.test/?token=secret",
          $referring_domain: "example.test",
          distinct_id: "ephemeral-device-id",
          $session_id: "session-id",
          title: "Sensitive page title",
        },
        timestamp: new Date("2026-08-19T14:00:00.000Z"),
      } as CaptureResult),
    ).toEqual({
      uuid: "ee2d9a4a-34bd-4911-b45c-c5f181cd59cf",
      event: "$pageview",
      properties: {
        token: posthogProjectToken,
        $cookieless_mode: true,
        distinct_id: "ephemeral-device-id",
        $current_url: "https://vulnbench.com/",
        $lib: "web",
        $lib_version: "1.418.1",
        $host: "vulnbench.com",
        $pathname: "/",
        $pageview_id: "page-view-id",
        $event_type: "pageview",
      },
    });
  });

  it("keeps pageviews when optional classification metadata is absent", () => {
    expect(
      sanitizePostHogEvent({
        uuid: "9eb33bb4-4ab6-4129-8a9e-4c4f9fbd4055",
        event: "$pageview",
        properties: {
          token: posthogProjectToken,
          $cookieless_mode: true,
          distinct_id: "ephemeral-device-id",
          $current_url: "https://vulnbench.com/",
          $lib: "web",
          $lib_version: "1.418.1",
          $host: "vulnbench.com",
          $pathname: "/",
        },
      } as CaptureResult),
    ).toMatchObject({
      event: "$pageview",
      properties: {
        distinct_id: "ephemeral-device-id",
        $current_url: "https://vulnbench.com/",
      },
    });
  });
});
