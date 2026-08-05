import { getReleaseBySlug } from "./index";
import type { HeadlineEvidence } from "./schema";

export function getHeadlineEvidence(releaseSlug: string): HeadlineEvidence {
  const release = getReleaseBySlug(releaseSlug);

  if (!release) {
    throw new Error(`Unknown release: ${releaseSlug}`);
  }

  return release.headlineEvidence;
}
