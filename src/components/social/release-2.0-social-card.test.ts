import { describe, expect, it } from "vitest";
import releaseCardJson from "../../data/releases/content/2.0/copy/release-card.json";
import homeJson from "../../data/releases/content/2.0/copy/home.json";
import { renderRelease20SocialCard } from "./share-card";

const assets = {
  geistFontUrl: "/fonts/geist.woff2",
  geistMonoFontUrl: "/fonts/geist-mono.woff2",
  wordmarkUrl: "/brand/snyk-2026/logo-snyk-white.png",
};

const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];
const cardCopy = strings([releaseCardJson, homeJson]);

const unescape = (value: string) =>
  value
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

const visibleLines = (svg: string) =>
  [...svg.replace(/<defs>[\s\S]*?<\/defs>/gu, "").matchAll(/>([^<>]+)</gu)]
    .map(([, text]) => unescape(text ?? "").trim())
    .filter(Boolean);

describe("Snyk VulnBench 2.0 social card", () => {
  for (const options of [
    { designTheme: "classic" as const },
    { designTheme: "snyk-2026" as const, assets },
  ]) {
    it(`takes every line of text from the release card and homepage copy in the ${options.designTheme} design`, () => {
      const svg = renderRelease20SocialCard(options);
      const lines = visibleLines(svg);

      expect(svg).toContain(`<title id="title">${releaseCardJson.name}</title>`);
      for (const line of lines) {
        expect(
          cardCopy.some((copy) => copy.toLowerCase().includes(line.toLowerCase())),
          line,
        ).toBe(true);
      }
      const text = lines.join(" ");
      expect(text).toContain(releaseCardJson.name.toUpperCase());
      for (const copy of [
        releaseCardJson.question,
        homeJson.subtitle,
        releaseCardJson.summary,
        homeJson.headline_evidence.dataset_line,
      ]) {
        for (const word of copy.split(" ")) expect(text, copy).toContain(word);
      }
      expect(text).not.toMatch(/JS 1\.0|vulnbench\.com|\d+(?:\.\d+)?%/u);
    });
  }
});
