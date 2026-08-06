export const designThemes = ["classic", "snyk-2026"] as const;

export type DesignTheme = (typeof designThemes)[number];

export interface DesignThemeAssets {
  favicon: string;
  defaultSocialImage: string;
}

export const designThemeAssets: Record<DesignTheme, DesignThemeAssets> = {
  classic: {
    favicon: "/favicon.svg",
    defaultSocialImage: "/social/vulnbench-default.svg",
  },
  "snyk-2026": {
    favicon: "/brand/snyk-2026/favicon.svg",
    defaultSocialImage: "/brand/snyk-2026/social.png",
  },
};

export function resolveDesignTheme(value: string | undefined): DesignTheme {
  if (value === undefined || value === "") {
    return "snyk-2026";
  }

  if (value === "classic" || value === "snyk-2026") {
    return value;
  }

  throw new Error(
    `Invalid VULNBENCH_DESIGN_THEME "${value}". Expected "classic" or "snyk-2026".`,
  );
}

export const designTheme = resolveDesignTheme(
  process.env.VULNBENCH_DESIGN_THEME,
);

export const isSnyk2026Design = designTheme === "snyk-2026";
