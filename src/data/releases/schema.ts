import { z } from "zod";

const dateSchema = z.iso.date();
const nonEmptyString = z.string().trim().min(1);
const positiveCount = z.number().int().positive();
const nonNegativeCount = z.number().int().nonnegative();

export const headlineObservationSchema = z
  .object({
    label: nonEmptyString,
    numerator: nonNegativeCount,
    denominator: positiveCount,
    recurrence: z.number().int().min(1).max(5),
    unit: nonEmptyString,
    release: nonEmptyString,
    datasetVersion: nonEmptyString,
    source: z.url(),
    explorerPath: z.string().startsWith("/releases/"),
  })
  .refine(({ numerator, denominator }) => numerator <= denominator, {
    message: "Headline numerator cannot exceed its denominator",
  });

export const metricDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  label: nonEmptyString,
  definition: nonEmptyString,
  unit: nonEmptyString,
  aggregation: nonEmptyString,
  caveat: nonEmptyString,
});

export const releaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
  slug: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  name: nonEmptyString,
  shortName: nonEmptyString,
  status: z.enum(["current", "archived", "superseded"]),
  publishedAt: dateSchema,
  updatedAt: dateSchema,
  datasetVersion: nonEmptyString,
  studyType: nonEmptyString,
  researchQuestion: nonEmptyString,
  description: nonEmptyString,
  evidence: z.object({
    scans: positiveCount,
    projects: positiveCount,
    configurations: positiveCount,
    repetitions: positiveCount,
  }),
  links: z.object({
    overview: z.string().startsWith("/releases/"),
    explore: z.string().startsWith("/releases/"),
    methodology: z.string().startsWith("/releases/"),
    data: z.string().startsWith("/releases/"),
    paper: z.url(),
    publication: z.url(),
    github: z.url(),
  }),
  citation: z.object({
    authors: z.array(nonEmptyString).min(1),
    title: nonEmptyString,
    year: z.number().int().min(2000),
    url: z.url(),
  }),
  availableViews: z
    .array(
      z.enum([
        "summary",
        "repeatability",
        "coverage",
        "efficiency",
        "findings",
      ]),
    )
    .min(1),
  metrics: z.array(metricDefinitionSchema).min(1),
  caveats: z.array(nonEmptyString).min(1),
  headlineEvidence: z.object({
    matchedAllFive: headlineObservationSchema,
    unmatchedOnce: headlineObservationSchema,
    unmatchedAllFive: headlineObservationSchema,
  }),
  featuredFindings: z.array(
    z.object({
      title: nonEmptyString,
      summary: nonEmptyString,
      explorerPath: z.string().startsWith("/releases/"),
      caveat: nonEmptyString,
    }),
  ),
  compatibility: z.object({
    scoringProtocol: nonEmptyString,
    referenceSetType: nonEmptyString,
    compatibleMetrics: z.array(nonEmptyString),
    incompatibleMetrics: z.array(nonEmptyString),
  }),
});

export const releaseCatalogSchema = z
  .array(releaseSchema)
  .min(1)
  .superRefine((releases, context) => {
    const ids = new Set(releases.map(({ id }) => id));
    const slugs = new Set(releases.map(({ slug }) => slug));

    if (ids.size !== releases.length || slugs.size !== releases.length) {
      context.addIssue({
        code: "custom",
        message: "Release IDs and slugs must be unique",
      });
    }
  });

export type Release = z.infer<typeof releaseSchema>;
export type HeadlineEvidence = Release["headlineEvidence"];
export type HeadlineObservation = z.infer<typeof headlineObservationSchema>;
