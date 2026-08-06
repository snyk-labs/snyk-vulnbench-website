import { useState } from "react";
import type {
  HeadlineEvidence,
  HeadlineObservation,
} from "../../data/releases/schema";

interface RecurrenceContrastProps {
  evidence: HeadlineEvidence;
}

const keys = [
  "matchedAllFive",
  "unmatchedOnce",
  "unmatchedAllFive",
] as const;

function percentage({ numerator, denominator }: HeadlineObservation) {
  return (numerator / denominator) * 100;
}

function exactValue({ numerator, denominator }: HeadlineObservation) {
  return `${numerator} of ${denominator}`;
}

export function RecurrenceContrast({ evidence }: RecurrenceContrastProps) {
  const observations = keys.map((key) => ({ key, ...evidence[key] }));
  const [activeKey, setActiveKey] =
    useState<(typeof keys)[number]>("matchedAllFive");
  const active = evidence[activeKey];

  return (
    <figure className="recurrence-chart">
      <div
        className="recurrence-plot"
        role="img"
        aria-label="Finding recurrence contrast. Reference-matched findings were more likely to recur in all five runs than unmatched findings."
      >
        {observations.map((observation) => (
          <div className="recurrence-plot__item" key={observation.key}>
            <div className="recurrence-plot__label">
              <span>{observation.label}</span>
              <strong>{percentage(observation).toFixed(1)}%</strong>
            </div>
            <div
              className={`recurrence-plot__bar recurrence-plot__bar--${observation.key}`}
              style={{ width: `${percentage(observation)}%` }}
            />
          </div>
        ))}
      </div>

      <ul className="recurrence-chart__marks" aria-label="Chart values">
        {observations.map((observation) => (
          <li key={observation.key}>
            <a
              href={observation.explorerPath}
              onFocus={() => setActiveKey(observation.key)}
              onMouseEnter={() => setActiveKey(observation.key)}
            >
              <span
                className={`recurrence-chart__marker recurrence-chart__marker--${observation.key}`}
                aria-hidden="true"
              />
              <span>
                <strong>{exactValue(observation)}</strong>
                <small>{observation.label}</small>
              </span>
              <span className="recurrence-chart__inspect">Inspect</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="recurrence-chart__detail" aria-live="polite">
        <strong>{exactValue(active)}</strong> · {active.label}
      </p>

      <details className="recurrence-chart__table">
        <summary>View exact recurrence values</summary>
        <table aria-label="Exact recurrence values">
          <thead>
            <tr>
              <th scope="col">Finding group</th>
              <th scope="col">Count</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((observation) => (
              <tr key={observation.key}>
                <th scope="row">{observation.label}</th>
                <td>{exactValue(observation)}</td>
                <td>{percentage(observation).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <figcaption>
        <span>Dataset {active.datasetVersion}</span>
        <span>{active.release}</span>
        <span>Unique signatures · recurrence across 5 identical runs</span>
        <a href={active.source}>Source: published JS 1.0 paper</a>
      </figcaption>

      <style>{`
        .recurrence-chart {
          margin: 0;
        }

        .recurrence-plot {
          display: grid;
          min-height: 13rem;
          padding: 1.3rem;
          gap: 1rem;
          align-content: center;
          border: 1px solid var(--rule-strong);
          background: var(--paper-raised);
        }

        .recurrence-plot__item {
          display: grid;
          gap: 0.4rem;
        }

        .recurrence-plot__label {
          display: grid;
          color: var(--ink);
          font-size: var(--step--1);
          gap: 1rem;
          grid-template-columns: minmax(0, 1fr) auto;
          line-height: 1.25;
        }

        .recurrence-plot__label strong {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
        }

        .recurrence-plot__bar {
          min-width: 0.35rem;
          height: 1.35rem;
          border: 2px solid currentColor;
          background: currentColor;
        }

        .recurrence-plot__bar--matchedAllFive {
          color: var(--matched);
        }

        .recurrence-plot__bar--unmatchedOnce {
          color: var(--unmatched);
          border-style: dashed;
          background: transparent;
        }

        .recurrence-plot__bar--unmatchedAllFive {
          color: var(--unmatched);
          background: currentColor;
        }

        .recurrence-chart__marks {
          display: grid;
          padding: 0;
          margin: 0;
          border-inline: 1px solid var(--rule-strong);
          list-style: none;
        }

        .recurrence-chart__marks a {
          display: grid;
          min-height: 4.2rem;
          padding: 0.8rem 1rem;
          border-bottom: 1px solid var(--rule);
          color: var(--ink);
          gap: 0.8rem;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          text-decoration: none;
        }

        .recurrence-chart__marks a:hover,
        .recurrence-chart__marks a:focus-visible {
          background: var(--paper-muted);
        }

        .recurrence-chart__marks strong,
        .recurrence-chart__marks small {
          display: block;
        }

        .recurrence-chart__marks strong {
          font-family: var(--font-mono);
          font-size: 1rem;
          font-variant-numeric: tabular-nums;
        }

        .recurrence-chart__marks small {
          color: var(--ink-soft);
          line-height: 1.35;
        }

        .recurrence-chart__marker {
          width: 0.75rem;
          height: 0.75rem;
          border: 2px solid currentColor;
        }

        .recurrence-chart__marker--matchedAllFive {
          border-radius: 50%;
          color: var(--matched);
          background: currentColor;
        }

        .recurrence-chart__marker--unmatchedOnce {
          color: var(--unmatched);
          transform: rotate(45deg);
        }

        .recurrence-chart__marker--unmatchedAllFive {
          color: var(--unmatched);
          background: currentColor;
        }

        .recurrence-chart__inspect {
          color: var(--purple-dark);
          font-size: var(--step--1);
          font-weight: var(--font-weight-control);
        }

        .recurrence-chart__detail {
          padding: 0.65rem 1rem;
          border: 1px solid var(--ink);
          background: var(--ink);
          color: var(--paper-raised);
          font-family: var(--font-mono);
          font-size: var(--step--1);
          font-variant-numeric: tabular-nums;
        }

        .recurrence-chart__table {
          padding: 0.65rem 1rem;
          border-inline: 1px solid var(--rule-strong);
          border-bottom: 1px solid var(--rule-strong);
          background: var(--paper-raised);
          font-size: var(--step--1);
        }

        .recurrence-chart__table summary {
          cursor: pointer;
          font-weight: var(--font-weight-control);
        }

        .recurrence-chart__table table {
          width: 100%;
          margin-top: 0.75rem;
          border-collapse: collapse;
          text-align: left;
        }

        .recurrence-chart__table th,
        .recurrence-chart__table td {
          padding: 0.5rem;
          border-top: 1px solid var(--rule);
        }

        .recurrence-chart__table td {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
        }

        .recurrence-chart figcaption {
          display: flex;
          padding-top: 0.65rem;
          color: var(--ink-faint);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          gap: 0.35rem 1rem;
          flex-wrap: wrap;
        }

        @media (max-width: 35rem) {
          .recurrence-chart__marks a {
            grid-template-columns: auto 1fr;
          }

          .recurrence-chart__inspect {
            grid-column: 2;
          }
        }
      `}</style>
    </figure>
  );
}
