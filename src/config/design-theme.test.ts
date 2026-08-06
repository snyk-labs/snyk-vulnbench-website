import { describe, expect, test } from "vitest";
import {
  designThemeAssets,
  resolveDesignTheme,
} from "./design-theme";
import {
  type BrowserThemeColors,
  themeColorsByDesignTheme,
} from "./theme-colors";

describe("resolveDesignTheme", () => {
  test.each([
    [undefined, "classic"],
    ["", "classic"],
    ["classic", "classic"],
    ["snyk-2026", "snyk-2026"],
  ] as const)("resolves %j to %s", (value, expected) => {
    expect(resolveDesignTheme(value)).toBe(expected);
  });

  test("rejects an unsupported explicit value with both accepted values", () => {
    expect(() => resolveDesignTheme("future-theme")).toThrow(
      /classic.*snyk-2026/,
    );
  });
});

describe("design-theme browser metadata", () => {
  test("maps classic colors and static identity assets", () => {
    expect(themeColorsByDesignTheme.classic).toEqual<BrowserThemeColors>({
      light: "#f7f4ed",
      dark: "#211e24",
    });
    expect(designThemeAssets.classic).toEqual({
      favicon: "/favicon.svg",
      defaultSocialImage: "/social/vulnbench-default.svg",
    });
  });

  test("maps Snyk 2026 browser colors and static identity assets", () => {
    expect(themeColorsByDesignTheme["snyk-2026"]).toEqual<BrowserThemeColors>({
      light: "#FFFFFF",
      dark: "#030328",
    });
    expect(designThemeAssets["snyk-2026"]).toEqual({
      favicon: "/brand/snyk-2026/favicon.svg",
      defaultSocialImage: "/brand/snyk-2026/social.svg",
    });
  });
});
