import { describe, expect, it } from "vitest";
import { v20Copy } from "../../data/releases/2.0-content";
import { renderRelease20SocialCard } from "./share-card";

const assets = {
  geistFontUrl: "/fonts/geist.woff2",
  geistMonoFontUrl: "/fonts/geist-mono.woff2",
  wordmarkUrl: "/brand/snyk-2026/logo-snyk-white.png",
};

describe("Snyk VulnBench 2.0 social card", () => {
  for (const options of [
    { designTheme: "classic" as const },
    { designTheme: "snyk-2026" as const, assets },
  ]) {
    it(`uses only reviewed 2.0 copy in the ${options.designTheme} design`, () => {
      const svg = renderRelease20SocialCard(options);
      const visibleText = svg
        .replace(/<style>[\s\S]*?<\/style>/gu, "")
        .replace(/<[^>]+>/gu, " ")
        .replace(/\s+/gu, " ")
        .replaceAll("&apos;", "'");

      expect(svg).toContain("<title id=\"title\">Snyk VulnBench 2.0</title>");
      for (const word of v20Copy.home.h1.split(" ")) {
        expect(visibleText).toContain(word);
      }
      expect(visibleText).toContain(v20Copy.home.subtitle);
      expect(visibleText.replace(/\s+/gu, " ")).toContain(
        v20Copy.disclosure.short.split(". ")[1]?.split(" ").slice(0, 4).join(" "),
      );
      expect(visibleText).toContain("Dataset 2.0.0 · Snyk VulnBench 2.0 · vulnbench.com");
      expect(visibleText).not.toMatch(/JS 1\.0|\d+(?:\.\d+)?%/u);
    });
  }
});
