# PostHog Cookieless Web Analytics Design

**Status:** Approved design
**Date:** 2026-08-19
**Product:** Snyk VulnBench website

## Purpose

Add minimal PostHog web analytics to measure aggregate page visits without
browser cookies, browser storage, person profiles, user identification, or
behavioral capture. The website remains a fully static Astro deployment and no
analytics data is required for any visitor-facing capability.

This design supports anonymous audience measurement; it is not legal advice and
does not independently establish a lawful basis for processing personal data.
The project owner remains responsible for confirming the deployed configuration,
privacy disclosure, data-hosting choice, retention, and regulatory obligations.

## PostHog project prerequisites

The PostHog project is hosted in EU Cloud and must retain these dashboard
settings:

- Cookieless server hash mode is enabled.
- Client IP data is discarded.

Cookieless server hash mode strips IP data before GeoIP enrichment and bot
detection. As a result, geographic reports and IP-based bot detection are not
available. The server-side daily salted hash cannot recognize a visitor across
days, so unique-visitor counts beyond a day are approximate.

## Architecture

The requested PostHog wizard runs from the repository root. Its result is
reduced to a single page-view integration in the shared `BaseLayout.astro`
document head and a focused configuration module. The PostHog project token is
a client-side write-only token and is necessarily public in the generated site;
it is not treated as a secret or exposed through a server endpoint.

The client initializes only after the document has begun loading. With
JavaScript disabled, no analytics asset loads and every existing static route
remains fully usable.

The client configuration must include:

- the EU Cloud ingestion host;
- `cookieless_mode: "always"`;
- memory-only persistence;
- `person_profiles: "never"`;
- no autocapture, session replay, surveys, exception capture, feature-flag
  evaluation, automatic page views, or page-leave capture.

After initialization, the integration sends one explicit `$pageview` for the
rendered document route. It never calls `identify`, `alias`, people APIs, or
other capture methods. Client-side explorer state changes do not create
analytics events.

Before sending the page-view event, the integration replaces the current URL
with its origin and pathname only and removes the referrer. Query strings and
fragments—including shareable explorer filter state—are never sent to PostHog.

## Public disclosure

Add a concise static privacy page linked from the global footer. It states that
the site uses PostHog to measure aggregate page visits, does not use analytics
cookies or browser storage, discards IP data, avoids visitor identification and
behavioral capture, and sends only the page origin and path. It also names
PostHog's EU Cloud hosting location and links to Snyk's canonical
`https://snyk.io/policies/privacy/` privacy notice and
`https://snyk.io/policies/terms-of-service/` terms of service. The footer
links directly to both the local privacy page and Snyk's terms of service.

The disclosure does not claim that cookieless analytics is universally exempt
from consent or privacy-law requirements and does not present legal advice.
There is no consent banner or analytics opt-in UI in this approved scope.

## Out of scope

- Custom product events, click tracking, and form/input capture.
- Session replay, surveys, feature flags, experiments, error tracking, and
  person profiles.
- IP retention, GeoIP enrichment, bot detection, user identification, or
  cross-device/cross-day tracking.
- A runtime API, database, account, server session, or analytics-dependent
  content.
- Legal determinations about consent, lawful basis, retention, or regional
  hosting.

## Verification

Automated coverage must prove that:

- every shared-layout route emits the privacy-constrained PostHog
  configuration;
- the runtime integration captures only sanitized document page-view URLs;
- query strings, fragments, and referrers are excluded;
- identification, autocapture, replay, surveys, exception capture, page-leave
  capture, and persistent browser storage remain disabled;
- the privacy disclosure is linked, crawlable, and accessible;
- no-JavaScript rendering loads no PostHog client and preserves the current
  static content contract;
- the standard build, TypeScript checks, relevant unit and browser tests, and
  compressed JavaScript budget pass.

Manual rollout validation verifies a single sanitized `$pageview` in PostHog
Live Events and confirms that the project dashboard still shows cookieless
server hash mode and discarded IP capture enabled.
