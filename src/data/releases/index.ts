import { js10Release } from "./js-1.0";
import { releaseCatalogSchema } from "./schema";
import type { Release } from "./schema";

export const releases = releaseCatalogSchema.parse([js10Release]);

function requireCurrentRelease(): Release {
  const release = releases.find(({ status }) => status === "current");
  if (!release) {
    throw new Error("Release catalog must declare one current release");
  }
  return release;
}

export const currentRelease = requireCurrentRelease();

export function getReleaseBySlug(slug: string) {
  return releases.find((release) => release.slug === slug);
}
