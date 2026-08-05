import { useMemo, useState } from "react";
import type { ConfigurationEvidence } from "../../data/releases/js-1.0-source";

interface ConfigurationScorecardProps {
  aggregationCaption?: string;
  configurations: ConfigurationEvidence[];
}

type SortKey =
  | "f1"
  | "f1StdDev"
  | "recall"
  | "precision"
  | "durationMs"
  | "tokens"
  | "costUsd";

interface Column {
  key: SortKey;
  label: string;
  sortLabel: string;
  format: (configuration: ConfigurationEvidence) => string;
}

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const columns: Column[] = [
  {
    key: "f1",
    label: "Snyk-reference F1",
    sortLabel: "Snyk-reference F1",
    format: ({ f1 }) => percent.format(f1),
  },
  {
    key: "f1StdDev",
    label: "F1 spread",
    sortLabel: "F1 standard deviation",
    format: ({ f1StdDev }) => `${(f1StdDev * 100).toFixed(1)} pp`,
  },
  {
    key: "recall",
    label: "Reference recall",
    sortLabel: "reference recall",
    format: ({ recall }) => percent.format(recall),
  },
  {
    key: "precision",
    label: "Reference precision",
    sortLabel: "reference precision",
    format: ({ precision }) => percent.format(precision),
  },
  {
    key: "durationMs",
    label: "Avg. duration",
    sortLabel: "average duration",
    format: ({ durationMs }) => `${(durationMs / 1000).toFixed(1)} s`,
  },
  {
    key: "tokens",
    label: "Avg. tokens",
    sortLabel: "average tokens",
    format: ({ tokens }) => integer.format(tokens),
  },
  {
    key: "costUsd",
    label: "Est. session cost",
    sortLabel: "estimated model-session cost",
    format: ({ costUsd }) => (costUsd === null ? "N/A" : usd.format(costUsd)),
  },
];

export function ConfigurationScorecard({
  aggregationCaption = "Macro average across 10 fixtures and 5 repetitions",
  configurations,
}: ConfigurationScorecardProps) {
  const [sort, setSort] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);

  const sortedConfigurations = useMemo(() => {
    if (!sort) {
      return configurations;
    }

    return [...configurations].sort((left, right) => {
      const leftValue = left[sort.key];
      const rightValue = right[sort.key];

      if (leftValue === null) return 1;
      if (rightValue === null) return -1;

      const comparison = leftValue - rightValue;
      return sort.direction === "ascending" ? comparison : -comparison;
    });
  }, [configurations, sort]);

  function updateSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "descending"
          ? "ascending"
          : "descending",
    }));
  }

  return (
    <div className="configuration-scorecard">
      <div className="configuration-scorecard__scroll" tabIndex={0}>
        <table>
          <caption>
            Published configuration scorecard. Activate a metric heading to
            sort.
          </caption>
          <thead>
            <tr>
              <th scope="col">Configuration</th>
              {columns.map((column) => (
                <th
                  aria-sort={
                    sort?.key === column.key ? sort.direction : "none"
                  }
                  key={column.key}
                  scope="col"
                >
                  <button
                    aria-label={`Sort by ${column.sortLabel}`}
                    aria-pressed={sort?.key === column.key}
                    onClick={() => updateSort(column.key)}
                    type="button"
                  >
                    {column.label}
                    <span aria-hidden="true">
                      {sort?.key === column.key
                        ? sort.direction === "ascending"
                          ? " ↑"
                          : " ↓"
                        : " ↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedConfigurations.map((configuration) => (
              <tr key={configuration.name}>
                <th scope="row">
                  <strong>{configuration.name}</strong>
                  <small>
                    {configuration.type === "command"
                      ? "Deterministic reference reproduction"
                      : "Model via agentic harness"}
                  </small>
                </th>
                {columns.map((column) => (
                  <td className="metric" key={column.key}>
                    {column.format(configuration)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="configuration-scorecard__caption">
        <p>
          {aggregationCaption} · Dataset 1.0.0 · Snyk VulnBench JS 1.0
        </p>
        <p>
          <strong>Interpretation boundary:</strong> Snyk Code’s 100% row is
          deterministic reproduction of the reference set it defines. It is
          not a universal accuracy result.
        </p>
      </div>

      <style>{`
        .configuration-scorecard__scroll {
          overflow-x: auto;
          border: 1px solid var(--rule-strong);
          background: var(--paper-raised);
        }

        .configuration-scorecard table {
          width: 100%;
          min-width: 76rem;
          border-collapse: collapse;
          text-align: right;
        }

        .configuration-scorecard caption {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .configuration-scorecard th,
        .configuration-scorecard td {
          padding: 0.8rem 0.9rem;
          border-bottom: 1px solid var(--rule);
          vertical-align: top;
        }

        .configuration-scorecard thead th {
          position: sticky;
          top: 0;
          background: var(--paper-muted);
          color: var(--ink-soft);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.02em;
        }

        .configuration-scorecard th:first-child {
          position: sticky;
          left: 0;
          z-index: 1;
          width: 15rem;
          background: var(--paper-raised);
          text-align: left;
        }

        .configuration-scorecard thead th:first-child {
          z-index: 2;
          background: var(--paper-muted);
        }

        .configuration-scorecard button {
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font: inherit;
          text-align: right;
        }

        .configuration-scorecard button:hover {
          color: var(--purple-dark);
        }

        .configuration-scorecard tbody tr:last-child th,
        .configuration-scorecard tbody tr:last-child td {
          border-bottom: 0;
        }

        .configuration-scorecard tbody tr:hover th,
        .configuration-scorecard tbody tr:hover td {
          background: var(--purple-soft);
        }

        .configuration-scorecard tbody th strong,
        .configuration-scorecard tbody th small {
          display: block;
        }

        .configuration-scorecard tbody th strong {
          font-size: var(--step--1);
        }

        .configuration-scorecard tbody th small {
          margin-top: 0.2rem;
          color: var(--ink-soft);
          font-weight: 500;
          line-height: 1.3;
        }

        .configuration-scorecard td {
          font-size: var(--step--1);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .configuration-scorecard__caption {
          display: grid;
          padding: 0.8rem 1rem;
          border: 1px solid var(--rule-strong);
          border-top: 0;
          color: var(--ink-soft);
          font-size: var(--step--1);
          gap: 0.4rem;
        }

        .configuration-scorecard__caption p:first-child {
          font-family: var(--font-mono);
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
}
