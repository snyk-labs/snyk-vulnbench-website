import {
  getV20Configuration,
  getV20Table,
  inPaperOrder,
  isEndpointAware,
  v20Configurations,
  type V20Table,
} from "../../data/releases/2.0-content";
import { configurationColour } from "./configuration-style";

type Row = Record<string, string>;

export interface DataColumn {
  key: string;
  label: string;
  rowHeader?: boolean;
  numeric?: boolean;
  display?: (row: Row) => string;
  swatch?: (row: Row) => string | undefined;
}

export interface ColumnGroup {
  label: string;
  span: number;
}

export interface TableSpec {
  id: string;
  caption: string;
  columns: DataColumn[];
  rows: Row[];
  groups?: ColumnGroup[];
  table?: V20Table;
  note?: string;
}

const SINGLE_RUN_NOTE =
  "One run per configuration and application: every ratio is a single observation. Snyk Code has no per-scan model cost; its license cost is outside this study.";

const CLASS_LABELS: Record<string, string> = {
  idor: "IDOR",
  redos: "ReDoS",
  sql: "SQL",
  ssrf: "SSRF",
  xss: "cross-site scripting",
};

export const classLabel = (id: string) =>
  id
    .split("-")
    .map((part) => CLASS_LABELS[part] ?? part)
    .join(" ");

const sentenceCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const ofTotal = (matched: string, total: string) =>
  matched === "" || total === "" ? "" : `${matched} of ${total}`;

const percent = (value: string) => (value === "" ? "" : `${value}%`);

const yesNo = (value: string) =>
  value === "true" ? "Yes" : value === "false" ? "No" : value;

const endpointAware = v20Configurations.filter(({ metric }) => metric === "ar_recall");
const deepSec = v20Configurations.filter(({ metric }) => metric === "localized_recall");

const configurationColumn = (key = "config_id", label = "Configuration"): DataColumn => ({
  key,
  label,
  rowHeader: true,
  display: (row) => getV20Configuration(row[key] ?? "").display_name,
  swatch: (row) => configurationColour(getV20Configuration(row[key] ?? "")),
});

const splitByMetric = (rows: Row[]) => ({
  endpointAware: inPaperOrder(rows.filter((row) => isEndpointAware(row.config_id ?? ""))),
  deepSec: inPaperOrder(rows.filter((row) => !isEndpointAware(row.config_id ?? ""))),
});

const recallColumns = (label: string): DataColumn[] => [
  {
    key: "macro_recall_pct",
    label,
    numeric: true,
    display: (row) =>
      `${percent(row.macro_recall_pct ?? "")} (${ofTotal(row.matched ?? "", row.reference ?? "")})`,
  },
  {
    key: "interval95",
    label: "95% interval",
    numeric: true,
    display: (row) => `${row.interval95_lo_pct}–${row.interval95_hi_pct}%`,
  },
];

const precisionColumn: DataColumn = {
  key: "precision_pct",
  label: "Precision against the reference set (lower bound)",
  numeric: true,
  display: (row) => percent(row.precision_pct ?? ""),
};

export function scorecardSpecs(): TableSpec[] {
  const table = getV20Table("headline");
  const rows = splitByMetric(table.rows);
  return [
    {
      id: "scorecard-endpoint-aware",
      caption: "Endpoint-aware configurations · Attacker-Reachable Vulnerability Recall",
      table,
      rows: rows.endpointAware,
      columns: [
        configurationColumn(),
        ...recallColumns("Attacker-Reachable Vulnerability Recall (macro, matched)"),
        precisionColumn,
        {
          key: "matched_exact_line",
          label: "Matched at the exact line",
          numeric: true,
        },
      ],
    },
    {
      id: "scorecard-deepsec",
      caption: "DeepSec · localized recall, a different evidence requirement",
      rows: rows.deepSec,
      columns: [
        configurationColumn(),
        ...recallColumns("Localized recall (macro, matched)"),
        precisionColumn,
      ],
    },
  ];
}

function greedyCoverSpec(): TableSpec {
  const table = getV20Table("greedy_cover");
  return {
    id: "greedy-cover",
    caption: "Greedy cover · endpoint-aware configurations only; DeepSec excluded",
    table,
    rows: table.rows,
    columns: [
      { key: "step", label: "Step", numeric: true },
      configurationColumn(),
      { key: "marginal_gain", label: "Vulnerabilities added at this step", numeric: true },
      { key: "cumulative", label: "Cumulative matched", numeric: true },
    ],
  };
}

function pairwiseUnionSpec(): TableSpec {
  const table = getV20Table("pairwise_union");
  return {
    id: "pairwise-union",
    caption: "Pairs of endpoint-aware configurations · DeepSec excluded",
    table,
    rows: table.rows.filter(
      (row) => isEndpointAware(row.config_a ?? "") && isEndpointAware(row.config_b ?? ""),
    ),
    columns: [
      configurationColumn("config_a", "Configuration A"),
      {
        key: "config_b",
        label: "Configuration B",
        display: (row) => getV20Configuration(row.config_b ?? "").display_name,
      },
      { key: "union_matched", label: "Matched by either", numeric: true },
      { key: "b_adds_to_a", label: "B adds to A", numeric: true },
      { key: "a_adds_to_b", label: "A adds to B", numeric: true },
      { key: "union_findings", label: "Combined findings to triage", numeric: true },
    ],
  };
}

const POOLED_CODEX = "codex-security-any";

function overlapSpec(): TableSpec {
  const table = getV20Table("overlap_intersections");
  const members = table.columns.filter((column) => column !== "n");
  const memberName = (column: string) =>
    column === POOLED_CODEX
      ? "Codex Security (three configurations pooled)"
      : getV20Configuration(column).display_name;
  return {
    id: "overlap-intersections",
    caption:
      "Vulnerabilities matched by exactly each combination · endpoint-aware configurations; DeepSec excluded",
    table,
    rows: table.rows,
    columns: [
      {
        key: "combination",
        label: "Combination",
        rowHeader: true,
        display: (row) => {
          const included = members.filter((column) => row[column] === "1");
          return included.length === 0
            ? "No endpoint-aware configuration"
            : included.map(memberName).join("; ");
        },
      },
      { key: "n", label: "Vulnerabilities", numeric: true },
    ],
  };
}

function flowShapeSpec(): TableSpec {
  const table = getV20Table("flow_shape");
  return {
    id: "flow-shape",
    caption: "Same-file and cross-file vulnerabilities · endpoint-aware configurations",
    table,
    rows: inPaperOrder(table.rows),
    columns: [
      configurationColumn(),
      {
        key: "same_file_matched",
        label: "Same-file matched",
        numeric: true,
        display: (row) => ofTotal(row.same_file_matched ?? "", row.same_file_total ?? ""),
      },
      {
        key: "cross_file_matched",
        label: "Cross-file matched",
        numeric: true,
        display: (row) => ofTotal(row.cross_file_matched ?? "", row.cross_file_total ?? ""),
      },
      { key: "same_file_misses", label: "Same-file misses", numeric: true },
      {
        key: "same_file_misses_policy_classes",
        label: "Misses in classes the built-in review policy excludes or restricts",
        numeric: true,
      },
      { key: "same_file_misses_xss", label: "Misses in cross-site scripting", numeric: true },
    ],
  };
}

function triageSpec(): TableSpec {
  const table = getV20Table("headline");
  return {
    id: "triage",
    caption: "Findings and precision against the reference set · endpoint-aware configurations; DeepSec omitted",
    table,
    rows: splitByMetric(table.rows).endpointAware,
    columns: [
      configurationColumn(),
      { key: "findings", label: "Findings", numeric: true },
      { key: "matched", label: "Matched", numeric: true },
      precisionColumn,
    ],
  };
}

function pivotByConfiguration(
  rows: Row[],
  columnKey: string,
  value: (row: Row) => string,
) {
  const columnValues = [...new Set(rows.map((row) => row[columnKey] ?? ""))];
  const configIds = inPaperOrder(
    [...new Set(rows.map((row) => row.config_id ?? ""))].map((config_id) => ({ config_id })),
  ).map(({ config_id }) => config_id);
  const pivoted = configIds.map((config_id) => {
    const record: Row = { config_id };
    for (const row of rows.filter((candidate) => candidate.config_id === config_id)) {
      record[row[columnKey] ?? ""] = value(row);
    }
    return record;
  });
  return { columnValues, rows: pivoted };
}

function policyRecallSpec(): TableSpec {
  const table = getV20Table("policy_class_recall");
  const pivot = pivotByConfiguration(table.rows, "subset", (row) =>
    ofTotal(row.matched ?? "", row.n ?? ""),
  );
  return {
    id: "policy-class-recall",
    caption: "Credited recall by subset · endpoint-aware configurations, main runs",
    table,
    rows: pivot.rows,
    columns: [
      configurationColumn(),
      ...pivot.columnValues.map((subset) => ({
        key: subset,
        label: sentenceCase(subset),
        numeric: true,
      })),
    ],
  };
}

function policyDetailSpec(): TableSpec {
  const table = getV20Table("policy_class_detail");
  return {
    id: "policy-class-detail",
    caption: "Per class, credited against reported anywhere in the application · main runs",
    table,
    rows: inPaperOrder(table.rows),
    columns: [
      configurationColumn(),
      { key: "class", label: "Class", display: (row) => classLabel(row.class ?? "") },
      {
        key: "credited",
        label: "Credited",
        numeric: true,
        display: (row) => ofTotal(row.credited ?? "", row.n ?? ""),
      },
      {
        key: "reported_anywhere_in_app",
        label: "Reported anywhere in the application",
        numeric: true,
        display: (row) => ofTotal(row.reported_anywhere_in_app ?? "", row.n ?? ""),
      },
    ],
  };
}

function policyControlSpec(): TableSpec {
  const table = getV20Table("policy_control_supplementary");
  return {
    id: "policy-control-supplementary",
    caption:
      "Supplementary prompt-swap control · single run, 19 of the 20 applications · never merged into the main results",
    table,
    rows: table.rows,
    columns: [
      { key: "subset", label: "Subset", rowHeader: true, display: (row) => sentenceCase(row.subset ?? "") },
      {
        key: "control_matched",
        label: "Supplementary prompt-swap control (Opus 5 xhigh, default audit prompt)",
        numeric: true,
        display: (row) => ofTotal(row.control_matched ?? "", row.n ?? ""),
      },
      {
        key: "security_review_matched",
        label: "Main run: Claude Code /security-review · Opus 5 xhigh, same 19 applications",
        numeric: true,
        display: (row) => ofTotal(row.security_review_matched ?? "", row.n ?? ""),
      },
    ],
  };
}

const toleranceLabel = (tolerance: string) =>
  tolerance === "0"
    ? "Exact line"
    : tolerance === "file"
      ? "Any line in the right file"
      : tolerance === "2"
        ? "±2 lines (used for results)"
        : `±${tolerance} lines`;

function toleranceSpec(): TableSpec {
  const table = getV20Table("tolerance_sweep");
  const pivot = pivotByConfiguration(table.rows, "tolerance_lines", (row) => row.matched ?? "");
  return {
    id: "tolerance-sweep",
    caption:
      "Vulnerabilities matched against line tolerance · endpoint rule; only ±2 lines is used for results; DeepSec excluded",
    table,
    rows: pivot.rows,
    groups: [
      { label: "Configuration", span: 1 },
      { label: "Line tolerance", span: pivot.columnValues.length },
    ],
    columns: [
      configurationColumn(),
      ...pivot.columnValues.map((tolerance) => ({
        key: tolerance,
        label: toleranceLabel(tolerance),
        numeric: true,
      })),
    ],
  };
}

const costColumns: DataColumn[] = [
  { key: "cost_status", label: "Cost status" },
  { key: "known_cost_total_usd", label: "Known cost, total (USD)", numeric: true },
  {
    key: "known_cost_per_matched_usd",
    label: "Known cost per matched vulnerability (USD)",
    numeric: true,
  },
  {
    key: "tokens_per_matched_millions",
    label: "Tokens per matched vulnerability (millions)",
    numeric: true,
  },
];

const wallTimeColumns: DataColumn[] = [
  {
    key: "wall_time_total",
    label: "Wall time, total over 20 applications",
    numeric: true,
    display: (row) =>
      row.config_id === "snyk-code"
        ? `${row.wall_time_total_min} min`
        : `${row.wall_time_total_h} h`,
  },
  {
    key: "wall_time_per_matched_s",
    label: "Wall time per matched vulnerability (s)",
    numeric: true,
  },
];

function efficiencySpecs(): TableSpec[] {
  const table = getV20Table("efficiency");
  const rows = splitByMetric(table.rows);
  return [
    {
      id: "efficiency-endpoint-aware",
      caption: "Resources per matched vulnerability · endpoint-aware configurations",
      table,
      rows: rows.endpointAware,
      note: SINGLE_RUN_NOTE,
      columns: [
        configurationColumn(),
        ...wallTimeColumns,
        ...costColumns,
        {
          key: "findings_per_matched",
          label: "Findings per matched vulnerability",
          numeric: true,
        },
      ],
    },
    {
      id: "efficiency-deepsec",
      caption:
        "DeepSec · per localized-recall match; never compared with the endpoint-aware configurations",
      rows: rows.deepSec,
      columns: [configurationColumn(), ...wallTimeColumns, ...costColumns],
    },
  ];
}

export function corpusSpec(): TableSpec {
  const table = getV20Table("corpus_by_language");
  return {
    id: "corpus-by-language",
    caption: "Reference vulnerabilities by language family · frozen reference set",
    table,
    rows: table.rows,
    columns: [
      { key: "language_family", label: "Language family", rowHeader: true },
      { key: "applications", label: "Applications", numeric: true },
      { key: "vulnerabilities", label: "Reference vulnerabilities", numeric: true },
      { key: "cross_file", label: "Cross-file", numeric: true },
      { key: "same_file", label: "Same-file", numeric: true },
    ],
  };
}

export function configurationSpecs(): TableSpec[] {
  const table = getV20Table("configurations");
  const columns: DataColumn[] = [
    { key: "display_name", label: "Configuration", rowHeader: true },
    { key: "harness_and_version", label: "Harness and version" },
    { key: "version_basis", label: "How the version is known" },
    { key: "model", label: "Model" },
    { key: "effort_budget", label: "Effort and budget" },
    { key: "prompt", label: "Prompt" },
    { key: "primary_metric", label: "Primary metric" },
  ];
  const isDeepSec = (row: Row) => (row.display_name ?? "").startsWith("DeepSec");
  return [
    {
      id: "configurations-endpoint-aware",
      caption: "Endpoint-aware configurations, as run",
      table,
      rows: table.rows.filter((row) => !isDeepSec(row)),
      columns,
    },
    {
      id: "configurations-deepsec",
      caption: "DeepSec configurations, as run · scored with localized recall",
      rows: table.rows.filter(isDeepSec),
      columns,
    },
  ];
}

export function perApplicationSpec(): TableSpec {
  const table = getV20Table("per_app");
  return {
    id: "per-app",
    caption: "Matched vulnerabilities per application · main runs",
    table,
    rows: table.rows,
    groups: [
      { label: "Application", span: 5 },
      { label: "Endpoint-aware configurations: matched", span: endpointAware.length },
      { label: "DeepSec: localized matches", span: deepSec.length },
    ],
    columns: [
      { key: "app", label: "Application", rowHeader: true },
      { key: "language_family", label: "Language family" },
      {
        key: "frameworks",
        label: "Frameworks",
        display: (row) => (row.frameworks ?? "").split(";").join(", "),
      },
      { key: "n_vulns", label: "Reference vulnerabilities", numeric: true },
      { key: "n_cross_file", label: "Cross-file", numeric: true },
      ...endpointAware.map(({ config_id, display_name }) => ({
        key: config_id,
        label: display_name,
        numeric: true,
      })),
      ...deepSec.map(({ config_id, display_name }) => ({
        key: `${config_id} (localized)`,
        label: display_name,
        numeric: true,
      })),
    ],
  };
}

export function classRecallSpec(): TableSpec {
  const table = getV20Table("class_recall");
  const classes = [...new Set(table.rows.map((row) => row.class ?? ""))];
  const rows = classes.map((id) => {
    const classRows = table.rows.filter((row) => row.class === id);
    return {
      class: id,
      n: classRows[0]?.n ?? "",
      ...Object.fromEntries(classRows.map((row) => [row.config_id ?? "", row.matched ?? ""])),
    };
  });
  return {
    id: "class-recall",
    caption: "Matched vulnerabilities by class · endpoint-aware configurations; most classes are small",
    table,
    rows,
    columns: [
      { key: "class", label: "Class", rowHeader: true, display: (row) => classLabel(row.class ?? "") },
      { key: "n", label: "Reference vulnerabilities", numeric: true },
      ...endpointAware.map(({ config_id, display_name }) => ({
        key: config_id,
        label: display_name,
        numeric: true,
      })),
    ],
  };
}

export function matchMatrixSpec(): TableSpec {
  const table = getV20Table("match_matrix");
  return {
    id: "match-matrix",
    caption: "One row per reference vulnerability · main runs; frozen reference set",
    table,
    rows: table.rows,
    groups: [
      { label: "Reference vulnerability", span: 5 },
      { label: "Endpoint-aware configurations: matched", span: endpointAware.length + 1 },
      { label: "DeepSec: localized match", span: deepSec.length },
    ],
    columns: [
      { key: "vuln_id", label: "Vulnerability", rowHeader: true },
      { key: "app", label: "Application" },
      { key: "class", label: "Class", display: (row) => classLabel(row.class ?? "") },
      { key: "language_family", label: "Language family" },
      { key: "cross_file", label: "Cross-file", display: (row) => yesNo(row.cross_file ?? "") },
      ...endpointAware.map(({ config_id, display_name }) => ({
        key: config_id,
        label: display_name,
        display: (row: Row) => yesNo(row[config_id] ?? ""),
      })),
      {
        key: "n_endpoint_aware_matched",
        label: "Endpoint-aware configurations that matched it",
        numeric: true,
      },
      ...deepSec.map(({ config_id, display_name }) => ({
        key: `${config_id} (localized)`,
        label: display_name,
        display: (row: Row) => yesNo(row[`${config_id} (localized)`] ?? ""),
      })),
    ],
  };
}

const FIGURE_TABLES: Record<number, () => TableSpec[]> = {
  1: scorecardSpecs,
  2: () => [greedyCoverSpec(), pairwiseUnionSpec()],
  3: () => [overlapSpec()],
  4: () => [flowShapeSpec()],
  5: () => [triageSpec()],
  6: () => [policyRecallSpec(), policyDetailSpec(), policyControlSpec()],
  8: () => [toleranceSpec()],
  10: efficiencySpecs,
  11: efficiencySpecs,
  13: () => [corpusSpec()],
};

export function figureTableSpecs(figure: number): TableSpec[] {
  return FIGURE_TABLES[figure]?.() ?? [];
}
