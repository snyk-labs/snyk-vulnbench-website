import { describe, expect, test } from "vitest";
import {
  getV20Configuration,
  v20Configurations,
  v20Copy,
  v20Tables,
} from "../../data/releases/2.0-content";
import {
  classRecallSpec,
  configurationSpecs,
  corpusSpec,
  figureTableSpecs,
  matchMatrixSpec,
  perApplicationSpec,
  scorecardSpecs,
  type TableSpec,
} from "./evidence-tables";

const allSpecs: TableSpec[] = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].flatMap(figureTableSpecs),
  ...configurationSpecs(),
  corpusSpec(),
  perApplicationSpec(),
  classRecallSpec(),
  matchMatrixSpec(),
];

const rendered = (spec: TableSpec) =>
  spec.rows.map((row) =>
    spec.columns.map((column) =>
      column.display ? column.display(row) : (row[column.key] ?? ""),
    ),
  );

const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];
const copyStrings = new Set(strings(v20Copy));

const deepSecNames = v20Configurations
  .filter(({ metric }) => metric === "localized_recall")
  .map(({ display_name }) => display_name);
const paperOrder = (names: string[]) =>
  names.map((name) => v20Configurations.findIndex((c) => c.display_name === name));

describe("Snyk VulnBench 2.0 evidence tables", () => {
  test("every rendered number is a table cell, never a computed value", () => {
    const numbers = (value: string) => value.match(/\d+(?:\.\d+)*/gu) ?? [];
    const cellNumbers = new Set(
      v20Tables.flatMap((table) =>
        table.rows.flatMap((row) => Object.values(row).flatMap(numbers)),
      ),
    );
    for (const spec of allSpecs) {
      for (const value of rendered(spec).flat()) {
        for (const number of numbers(value)) {
          expect(cellNumbers.has(number), `${spec.id}: ${value}`).toBe(true);
        }
      }
    }
  });

  test("configuration rows start in the paper's order", () => {
    for (const spec of allSpecs) {
      const header = spec.columns.find((column) => column.rowHeader);
      if (!header || !["config_id", "config_a"].includes(header.key)) continue;
      if (spec.id === "pairwise-union" || spec.id === "greedy-cover") continue;
      const names = rendered(spec).map(
        (cells) => cells[spec.columns.indexOf(header)] ?? "",
      );
      const order = paperOrder(names);
      expect(order, spec.id).toEqual([...order].sort((a, b) => a - b));
    }
  });

  test("DeepSec is never in a block, union or overlap with the endpoint-aware configurations", () => {
    for (const spec of allSpecs) {
      const values = rendered(spec).flat().join("\n");
      const headers = spec.columns.map(({ label }) => label);
      const mentionsDeepSec = deepSecNames.some(
        (name) => values.includes(name) || headers.includes(name),
      );
      if (!mentionsDeepSec) continue;
      const mixed = [
        "per-app",
        "match-matrix",
      ].includes(spec.id);
      if (mixed) {
        expect(spec.groups?.some(({ label }) => label.startsWith("DeepSec")), spec.id).toBe(true);
        continue;
      }
      expect(spec.id, spec.id).toMatch(/deepsec/u);
      expect(values).not.toContain("Snyk Code");
    }
    const pairwise = figureTableSpecs(2).find(({ id }) => id === "pairwise-union");
    expect(pairwise?.rows.every((row) => !/^deepsec/u.test(row.config_a ?? ""))).toBe(true);
  });

  test("shows every configuration of each comparison", () => {
    const [endpointAware, deepSec] = scorecardSpecs();
    expect(endpointAware?.rows.map((row) => row.config_id)).toEqual(
      v20Configurations.filter(({ metric }) => metric === "ar_recall").map(({ config_id }) => config_id),
    );
    expect(deepSec?.rows).toHaveLength(2);
    expect(rendered(endpointAware!)[0]?.[1]).toBe("82.4% (89 of 108)");
  });

  test("labels the supplementary control as a single run kept out of the main results", () => {
    const control = figureTableSpecs(6).find(({ id }) => id === "policy-control-supplementary");
    expect(control?.caption).toContain("Supplementary");
    expect(control?.caption).toContain("single run");
    expect(control?.caption).toContain("never merged into the main results");
  });

  test("keeps numbers, claims and rankings out of interface labels", () => {
    for (const spec of allSpecs) {
      const dataValues = new Set(spec.table?.rows.flatMap((row) => Object.values(row)) ?? []);
      const labels = [
        spec.caption,
        ...(spec.groups ?? []).map(({ label }) => label),
        ...spec.columns.filter(({ key }) => !dataValues.has(key)).map(({ label }) => label),
      ].filter((label) => !copyStrings.has(label));
      for (const label of labels) {
        const withoutNames = v20Configurations
          .map(({ display_name }) => display_name)
          .reduce((text, name) => text.replaceAll(name, ""), label)
          .replace(/Opus 5|GPT-5\.6|Sonnet 5/gu, "");
        expect(withoutNames, `${spec.id}: ${label}`).not.toMatch(/\d|most |best|better|worse|leads?\b/u);
      }
    }
  });

  test("gives Figures 7, 9 and 12 their exact-value tables", () => {
    for (const figure of [7, 9, 12]) {
      expect(figureTableSpecs(figure)[0]?.table, `Figure ${figure}`).toBeDefined();
    }
  });

  test("shows the Codex Security with GPT-5.6 Sol sink offsets by bin", () => {
    const [offsets] = figureTableSpecs(7);
    expect(offsets?.caption).toContain("Codex Security · GPT-5.6 Sol");
    expect(rendered(offsets!)).toEqual([
      ["≤−21", "0", "1"],
      ["−20…−11", "1", "8"],
      ["−10…−6", "9", "15"],
      ["−5…−3", "6", "15"],
      ["≥+3", "0", "2"],
    ]);
  });

  test("keeps DeepSec's localized-recall note beside the Figure 9 table", () => {
    const [stages, languages] = figureTableSpecs(9);
    expect(stages?.note).toBe(
      "Localized recall is DeepSec's primary metric and is not comparable with Attacker-Reachable Vulnerability Recall.",
    );
    expect(rendered(stages!)).toContainEqual(["Localized match, Opus 5 xhigh backend", "37 of 56"]);
    expect(rendered(stages!)[0]).toEqual(["Reference vulnerabilities", "108"]);
    expect(rendered(languages!)).toContainEqual(["Java", "12 of 12"]);
  });

  test("ranks every endpoint-aware configuration under each scoring rule", () => {
    const [ranks] = figureTableSpecs(12);
    expect(ranks?.rows).toHaveLength(21);
    expect(ranks?.columns.map(({ label }) => label)).toEqual([
      "Scoring rule",
      ...v20Configurations
        .filter(({ metric }) => metric === "ar_recall")
        .map(({ display_name }) => display_name),
      "Kendall's τ",
    ]);
    expect(rendered(ranks!)[0]?.[0]).toBe("Endpoint rule, ±2 lines (used for all results)");
  });

  test("never shows a cost as zero", () => {
    for (const spec of figureTableSpecs(10)) {
      for (const cells of rendered(spec)) {
        expect(cells.join(" ")).not.toMatch(/(^|\s)\$?0(\.0+)?(\s|$)/u);
      }
    }
    const snyk = figureTableSpecs(10)[0]?.rows.find((row) => row.config_id === "snyk-code");
    expect(snyk?.cost_status).toBe("no per-scan model cost");
    expect(snyk?.known_cost_total_usd).toBe("");
  });

  test("names configurations in full in tables", () => {
    for (const { display_name, figure_label } of v20Configurations) {
      if (figure_label === display_name) continue;
      for (const spec of allSpecs) {
        expect(rendered(spec).flat(), spec.id).not.toContain(figure_label);
      }
    }
    expect(getV20Configuration("codex-security-sol-xhigh").display_name).toBe(
      "Codex Security · GPT-5.6 Sol",
    );
  });
});
