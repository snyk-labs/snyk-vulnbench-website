import { z } from "zod";
import citationBib from "./content/2.0/citation.bib?raw";
import coloursJson from "./content/2.0/colours.json";
import citationJson from "./content/2.0/copy/citation.json";
import dataJson from "./content/2.0/copy/data.json";
import differsJson from "./content/2.0/copy/differs.json";
import disclosureJson from "./content/2.0/copy/disclosure.json";
import findingsJson from "./content/2.0/copy/findings.json";
import homeJson from "./content/2.0/copy/home.json";
import limitationsJson from "./content/2.0/copy/limitations.json";
import methodologyJson from "./content/2.0/copy/methodology.json";
import releaseCardJson from "./content/2.0/copy/release-card.json";
import releasePageJson from "./content/2.0/copy/release-page.json";
import termsJson from "./content/2.0/copy/terms.json";
import figuresJson from "./content/2.0/figures.json";

const text = z.string().trim().min(1);
const figureNumber = z.number().int().min(1).max(13);

const homeSchema = z.object({
  current_release_label: text,
  eyebrow: text,
  h1: text,
  subtitle: text,
  lede: text,
  buttons: z.tuple([text, text, text, text]),
  stats: z.array(z.object({ value: text, label: text })).length(4),
  headline_evidence: z.object({
    kicker: text,
    h2: text,
    callouts: z.array(text).min(1),
    for_appsec: text,
    dataset_line: text,
  }),
  findings_intro: z.object({ kicker: text, h2: text, body: text }),
  principles: z.object({
    kicker: text,
    h2: text,
    body: text,
    items: z.array(z.object({ title: text, text })).min(1),
  }),
  release_history: z.array(z.object({ name: text, line: text })).length(2),
  release_history_note: text,
});

const releaseCardSchema = z.object({
  name: text,
  slug: z.string().startsWith("/releases/"),
  question: text,
  summary: text,
  published: text,
  dataset: text,
  last_updated: text,
  links: z.array(text),
  catalogue_footer: text,
});

const findingSchema = z.object({
  n: z.string().regex(/^\d{2}$/),
  id: z.enum(["complementarity", "harness-policy", "efficiency", "robustness"]),
  title: text,
  paper_section: text,
  body: z.array(text).min(1),
  care: text,
  figures: z.array(figureNumber),
});

const releaseSectionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z-]*$/),
  kicker: text,
  h2: text,
  body: z.array(text).optional(),
  boundary: text.optional(),
  figure: figureNumber.optional(),
  figures: z.array(figureNumber).optional(),
  table: text.optional(),
  items: z.array(z.object({ title: text, text })).optional(),
});

const methodologySchema = z.object({
  title: text,
  h1: text,
  lede: text,
  sections: z.array(
    z.object({
      id: z.string().regex(/^[a-z][a-z-]*$/),
      h2: text,
      body: z.array(text).optional(),
      table: text.optional(),
      figure: figureNumber.optional(),
      list_from: text.optional(),
      metrics: z
        .array(
          z.object({
            name: text,
            definition: text,
            unit: text,
            aggregation: text,
            caveat: text,
          }),
        )
        .optional(),
    }),
  ),
});

const termSchema = z.array(z.tuple([text, text]));

const dataSchema = z.object({
  h1: text,
  downloads: z.array(
    z.object({ kind: text, title: text, href: text, text }),
  ),
  provenance: z.object({
    dataset_version: text,
    execution: text,
    parent: text,
    archive_sha256: z.string().regex(/^[0-9a-f]{64}$/),
    parent_archive_sha256: z.string().regex(/^[0-9a-f]{64}$/),
    checksums_file: text,
    license: text,
  }),
  dictionary: termSchema,
  corrections: text,
});

const citationSchema = z.object({
  plain_2_0: text,
  guidance: text,
  team_2_0: z.array(text).min(1),
});

const differsSchema = z.object({
  h2: text,
  intro: text,
  rows: z.array(z.object({ aspect: text, js10: text, v20: text })).min(1),
  boundary: text,
});

const disclosureSchema = z.object({ short: text, long: text });

const colourToken = z.enum(["ink", "purple", "orange", "pink"]);
const coloursSchema = z.object({
  configs: z.array(
    z.object({
      config_id: z.string().regex(/^[a-z0-9-]+$/),
      display_name: text,
      figure_label: text,
      family: z.enum(["SAST", "Claude Code", "Codex Security", "DeepSec"]),
      metric: z.enum(["ar_recall", "localized_recall"]),
      colour: z.string().regex(/^(ink|(purple|orange|pink)-\d{2,3})$/),
    }),
  ),
});

const figuresSchema = z.object({
  figures: z.array(
    z.object({
      paper_figure: figureNumber,
      file_stem: z.string().regex(/^vulnbench-2\.0-figure-\d{2}$/),
      caption: text,
      alt: text,
    }),
  ),
});

export const v20Copy = {
  home: homeSchema.parse(homeJson),
  releaseCard: releaseCardSchema.parse(releaseCardJson),
  findings: z.array(findingSchema).length(4).parse(findingsJson),
  releasePage: z.array(releaseSectionSchema).parse(releasePageJson),
  methodology: methodologySchema.parse(methodologyJson),
  terms: termSchema.parse(termsJson),
  limitations: z.array(text).min(1).parse(limitationsJson),
  data: dataSchema.parse(dataJson),
  citation: citationSchema.parse(citationJson),
  differs: differsSchema.parse(differsJson),
  disclosure: disclosureSchema.parse(disclosureJson),
};

export const v20CitationBib = citationBib;

export type ConfigurationColour = z.infer<typeof colourToken>;
export type V20Configuration = z.infer<typeof coloursSchema>["configs"][number] & {
  order: number;
  colourFamily: ConfigurationColour;
  colourStrength: number;
};

export const v20Configurations: V20Configuration[] = coloursSchema
  .parse(coloursJson)
  .configs.map((config, index) => {
    const [family = "ink", strength] = config.colour.split("-");
    return {
      ...config,
      order: index + 1,
      colourFamily: colourToken.parse(family),
      colourStrength: strength ? Number(strength) : 100,
    };
  });

export function getV20Configuration(configId: string) {
  const id = configId.replace(/ \(localized\)$/u, "");
  const configuration = v20Configurations.find(
    ({ config_id }) => config_id === id,
  );
  if (!configuration) {
    throw new Error(`Unknown Snyk VulnBench 2.0 configuration: ${configId}`);
  }
  return configuration;
}

export interface V20Figure {
  number: number;
  stem: string;
  caption: string;
  alt: string;
  light: { svg: string; png: string };
  dark: { svg: string; png: string };
}

const figurePath = (format: "svg" | "png", scheme: "light" | "dark", stem: string) =>
  `/figures/2.0/${format}/${scheme}/${stem}.${format}`;

export const v20Figures: V20Figure[] = figuresSchema
  .parse(figuresJson)
  .figures.map(({ paper_figure, file_stem, caption, alt }) => ({
    number: paper_figure,
    stem: file_stem,
    caption,
    alt,
    light: {
      svg: figurePath("svg", "light", file_stem),
      png: figurePath("png", "light", file_stem),
    },
    dark: {
      svg: figurePath("svg", "dark", file_stem),
      png: figurePath("png", "dark", file_stem),
    },
  }));

export function getV20Figure(number: number) {
  const figure = v20Figures.find((candidate) => candidate.number === number);
  if (!figure) throw new Error(`Unknown Snyk VulnBench 2.0 figure ${number}`);
  return figure;
}

export function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export interface V20Table {
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  csv: string;
  meta: Record<string, unknown> & { empty_cells?: string; basis?: string; paper?: string };
}

const tableSources = import.meta.glob<string>("./content/2.0/tables/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
});
const tableMeta = import.meta.glob<Record<string, unknown>>(
  "./content/2.0/tables/*.meta.json",
  { import: "default", eager: true },
);

export const v20Tables: V20Table[] = Object.entries(tableSources)
  .map(([path, csv]) => {
    const name = path.replace(/^.*\/(.+)\.csv$/u, "$1");
    const [columns = [], ...records] = parseCsv(csv);
    const meta = tableMeta[`./content/2.0/tables/${name}.meta.json`];
    if (!meta) throw new Error(`Missing notes file for ${name}.csv`);
    return {
      name,
      columns,
      csv,
      meta,
      rows: records.map((record) => {
        if (record.length !== columns.length) {
          throw new Error(`${name}.csv has a row with ${record.length} cells`);
        }
        return Object.fromEntries(
          columns.map((column, index) => [column, record[index] ?? ""]),
        );
      }),
    };
  })
  .sort((left, right) => left.name.localeCompare(right.name));

export function getV20Table(name: string) {
  const table = v20Tables.find((candidate) => candidate.name === name);
  if (!table) throw new Error(`Unknown Snyk VulnBench 2.0 table ${name}`);
  return table;
}

export function inPaperOrder<T extends Record<string, string>>(
  rows: T[],
  key = "config_id",
) {
  return [...rows].sort(
    (left, right) =>
      getV20Configuration(left[key] ?? "").order -
      getV20Configuration(right[key] ?? "").order,
  );
}

export const isEndpointAware = (configId: string) =>
  getV20Configuration(configId).metric === "ar_recall";
