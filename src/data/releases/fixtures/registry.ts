import { js10Release } from "../js-1.0";
import { releaseCatalogSchema } from "../schema";
import { synthetic20Release } from "./synthetic-2.0";

export const releaseSystemValidationCatalog = releaseCatalogSchema.parse([
  js10Release,
  synthetic20Release,
]);

export const validationFixtures = releaseSystemValidationCatalog.filter(
  ({ publicationState }) => publicationState === "internal-fixture",
);
