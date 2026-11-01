import { v20Release } from "./2.0";
import { js10Release } from "./js-1.0";
import { releaseCatalogSchema } from "./schema";
import type { Release } from "./schema";

const validatedReleases = releaseCatalogSchema.parse([v20Release, js10Release]);

export const publicReleases = validatedReleases.filter(
  ({ publicationState }) => publicationState === "public",
);
export const releases = publicReleases;

function requireCurrentRelease(): Release {
  const current = releases.filter(({ status }) => status === "current");
  if (current.length !== 1 || !current[0]) {
    throw new Error("Release catalog must declare one current release");
  }
  return current[0];
}

export const currentRelease = requireCurrentRelease();

export function getReleaseBySlug(slug: string) {
  return releases.find((release) => release.slug === slug);
}

export function requireReleaseBySlug(slug: string): Release {
  const release = getReleaseBySlug(slug);
  if (!release) {
    throw new Error(`Unknown release: ${slug}`);
  }
  return release;
}

const statusLabels: Record<Release["status"], string> = {
  current: "Current release",
  superseded: "Superseded release",
  archived: "Archived release",
};

export function releaseStatusLabel(release: Pick<Release, "status">) {
  return statusLabels[release.status];
}
