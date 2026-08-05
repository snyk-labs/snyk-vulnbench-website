import type { Release } from "./schema";

export function releaseViewModel(release: Release) {
  return {
    id: release.id,
    slug: release.slug,
    name: release.name,
    shortName: release.shortName,
    researchQuestion: release.researchQuestion,
    description: release.description,
    status: {
      releaseStatus: release.status,
      publicationState: release.publicationState,
      publishedAt: release.publishedAt,
      updatedAt: release.updatedAt,
      datasetVersion: release.datasetVersion,
    },
    links: [
      { label: "Overview", href: release.links.overview },
      { label: "Explore", href: release.links.explore },
      { label: "Methodology", href: release.links.methodology },
      { label: "Data", href: release.links.data },
      { label: "Paper", href: release.links.paper },
      { label: "Publication", href: release.links.publication },
      { label: "GitHub", href: release.links.github },
    ],
    citation: release.citation,
    availableViews: release.availableViews,
    sharedDimensions: release.dimensions.filter(
      ({ scope }) => scope === "shared",
    ),
    releaseDimensions: release.dimensions.filter(
      ({ scope }) => scope === "release",
    ),
    metrics: release.metrics,
    assets: release.assets,
  };
}
