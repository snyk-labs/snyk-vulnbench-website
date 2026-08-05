import { designTheme, type DesignTheme } from "./design-theme";

export type ColorMode = "light" | "dark";

export type BrowserThemeColors = Record<ColorMode, string>;

export const themeColorsByDesignTheme: Record<
  DesignTheme,
  BrowserThemeColors
> = {
  classic: {
    light: "#f7f4ed",
    dark: "#211e24",
  },
  "snyk-2026": {
    light: "#2B0250",
    dark: "#030328",
  },
};

export const browserThemeColors = themeColorsByDesignTheme[designTheme];
