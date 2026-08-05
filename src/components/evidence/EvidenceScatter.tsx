import { useState } from "react";
import type {
  PublishedEvidence,
  ScatterPoint,
} from "../../data/releases/js-1.0-source";

interface EvidenceScatterProps {
  title: string;
  points: ScatterPoint[];
  xLabel: string;
  xUnit: "percentage-points" | "usd";
  yLabel: string;
  interpretation: string;
  caveat: string;
  provenance: PublishedEvidence["provenance"];
}

const configurationStyles: Record<
  string,
  { color: string; shape: string; symbol: string }
> = {
  "Snyk Code SAST": { color: "#4b2be3", shape: "circle", symbol: "●" },
  "Claude Opus 4.6 Medium": {
    color: "#087c71",
    shape: "square",
    symbol: "■",
  },
  "Claude Opus 4.6 High": {
    color: "#0f5f9a",
    shape: "diamond",
    symbol: "◆",
  },
  "Claude Opus 4.7 Max": {
    color: "#8a4f08",
    shape: "triangle",
    symbol: "▲",
  },
  "Claude Sonnet 4.6 Medium": {
    color: "#b54c31",
    shape: "hexagon",
    symbol: "⬟",
  },
  "Claude Sonnet 4.6 High": {
    color: "#7a3d86",
    shape: "cross",
    symbol: "✚",
  },
};

const percentage = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function pointStyle(name: string, index: number) {
  return (
    configurationStyles[name] ?? {
      color: "#55515f",
      shape: `marker-${index + 1}`,
      symbol: "●",
    }
  );
}

function formatX(value: number, unit: EvidenceScatterProps["xUnit"]) {
  return unit === "usd"
    ? `$${value.toFixed(3)}`
    : `${(value * 100).toFixed(1)} pp`;
}

function scale(
  value: number,
  minimum: number,
  maximum: number,
  start: number,
  end: number,
) {
  if (minimum === maximum) return (start + end) / 2;
  return start + ((value - minimum) / (maximum - minimum)) * (end - start);
}

function ticks(minimum: number, maximum: number) {
  return Array.from(
    { length: 5 },
    (_, index) => minimum + ((maximum - minimum) * index) / 4,
  );
}

export function EvidenceScatter({
  title,
  points,
  xLabel,
  xUnit,
  yLabel,
  interpretation,
  caveat,
  provenance,
}: EvidenceScatterProps) {
  const [activeName, setActiveName] = useState(points[0]?.name ?? "");
  const active = points.find(({ name }) => name === activeName) ?? points[0];

  if (!active) {
    throw new Error(`${title} requires at least one point`);
  }

  const xValues = points.map(({ x }) => x);
  const yValues = points.map(({ y }) => y);
  const xMinimum = Math.min(...xValues);
  const xMaximum = Math.max(...xValues);
  const yMinimum = Math.min(...yValues);
  const yMaximum = Math.max(...yValues);
  const xTicks = ticks(xMinimum, xMaximum);
  const yTicks = ticks(yMinimum, yMaximum);
  const xAxisLabel =
    xUnit === "usd" ? `${xLabel} (USD)` : `${xLabel} (percentage points)`;
  const yAxisLabel = `${yLabel} (%)`;

  return (
    <figure className="evidence-scatter">
      <svg
        aria-label={title}
        className="evidence-scatter__plot"
        role="img"
        viewBox="0 0 720 420"
      >
        <title>{title}</title>
        <text className="chart-title" x="82" y="24">
          {title}
        </text>
        <line className="axis" x1="82" x2="680" y1="350" y2="350" />
        <line className="axis" x1="82" x2="82" y1="38" y2="350" />
        {yTicks.map((tick) => {
          const y = scale(tick, yMinimum, yMaximum, 320, 66);
          return (
            <g key={`y-${tick}`}>
              <line
                className="gridline"
                x1="82"
                x2="680"
                y1={y}
                y2={y}
              />
              <text className="tick-label" textAnchor="end" x="74" y={y + 4}>
                {percentage.format(tick)}
              </text>
            </g>
          );
        })}
        {xTicks.map((tick) => {
          const x = scale(tick, xMinimum, xMaximum, 110, 652);
          return (
            <g key={`x-${tick}`}>
              <line className="tick-mark" x1={x} x2={x} y1="350" y2="356" />
              <text className="tick-label" textAnchor="middle" x={x} y="372">
                {formatX(tick, xUnit)}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const style = pointStyle(point.name, index);
          const x = scale(point.x, xMinimum, xMaximum, 110, 652);
          const y = scale(point.y, yMinimum, yMaximum, 320, 66);
          return (
            <text
              fill={style.color}
              fontSize="24"
              fontWeight="800"
              key={point.name}
              textAnchor="middle"
              x={x}
              y={y}
            >
              {style.symbol}
            </text>
          );
        })}
        <text className="axis-label" textAnchor="middle" x="380" y="404">
          {xAxisLabel}
        </text>
        <text
          className="axis-label"
          textAnchor="middle"
          transform="rotate(-90 20 195)"
          x="20"
          y="195"
        >
          {yAxisLabel}
        </text>
      </svg>

      <ul className="evidence-scatter__legend" aria-label={`${title} legend`}>
        {points.map((point, index) => {
          const style = pointStyle(point.name, index);
          return (
            <li key={point.name}>
              <button
                aria-label={`Show details for ${point.name}`}
                aria-pressed={active.name === point.name}
                onClick={() => setActiveName(point.name)}
                onFocus={() => setActiveName(point.name)}
                onMouseEnter={() => setActiveName(point.name)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  data-shape={style.shape}
                  data-testid="configuration-marker"
                  style={{ color: style.color }}
                >
                  {style.symbol}
                </span>
                {point.name}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="evidence-scatter__status" aria-live="polite" role="status">
        <strong>{active.name}</strong>
        <span>
          {xLabel}: {formatX(active.x, xUnit)}
        </span>
        <span>
          {yLabel}: {percentage.format(active.y)}
        </span>
      </p>

      <div className="evidence-scatter__table" tabIndex={0}>
        <table aria-label={`${title} exact values`}>
          <thead>
            <tr>
              <th scope="col">Configuration</th>
              <th scope="col">{xLabel}</th>
              <th scope="col">{yLabel}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.name}>
                <th scope="row">{point.name}</th>
                <td className="metric">{formatX(point.x, xUnit)}</td>
                <td className="metric">{percentage.format(point.y)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption>
        <p>{interpretation}</p>
        <p>
          <strong>Caveat:</strong> {caveat}
        </p>
        <p className="evidence-scatter__provenance">
          {provenance.release} · Dataset {provenance.datasetVersion} ·{" "}
          {provenance.aggregation} · Source {provenance.source}
        </p>
      </figcaption>

      <style>{`
        .evidence-scatter {
          margin: 0;
        }

        .evidence-scatter__plot {
          width: 100%;
          border: 1px solid var(--rule-strong);
          background: var(--paper-raised);
        }

        .evidence-scatter__plot .axis {
          stroke: var(--ink);
          stroke-width: 1.5;
        }

        .evidence-scatter__plot .chart-title {
          fill: var(--ink);
          font-size: 15px;
          font-weight: 750;
        }

        .evidence-scatter__plot .gridline {
          stroke: var(--rule);
          stroke-width: 1;
        }

        .evidence-scatter__plot .tick-mark {
          stroke: var(--ink);
          stroke-width: 1;
        }

        .evidence-scatter__plot .axis-label,
        .evidence-scatter__plot .tick-label {
          fill: var(--ink-soft);
          font-family: var(--font-mono);
        }

        .evidence-scatter__plot .axis-label {
          font-size: 13px;
        }

        .evidence-scatter__plot .tick-label {
          font-size: 10px;
        }

        .evidence-scatter__legend {
          display: grid;
          padding: 0;
          margin: 0;
          border-inline: 1px solid var(--rule-strong);
          list-style: none;
          grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        }

        .evidence-scatter__legend li {
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }

        .evidence-scatter__legend button {
          display: flex;
          width: 100%;
          min-height: 3.2rem;
          padding: 0.65rem 0.8rem;
          border: 0;
          background: var(--paper-raised);
          color: var(--ink);
          cursor: pointer;
          gap: 0.6rem;
          align-items: center;
          font-size: var(--step--1);
          text-align: left;
        }

        .evidence-scatter__legend button:hover,
        .evidence-scatter__legend button[aria-pressed="true"] {
          background: var(--purple-soft);
        }

        .evidence-scatter__legend button span {
          width: 1rem;
          flex: 0 0 1rem;
          font-size: 1rem;
          text-align: center;
        }

        .evidence-scatter__status {
          display: flex;
          padding: 0.7rem 0.9rem;
          background: var(--ink);
          color: var(--paper-raised);
          gap: 0.35rem 1rem;
          flex-wrap: wrap;
          font-family: var(--font-mono);
          font-size: var(--step--1);
          font-variant-numeric: tabular-nums;
        }

        .evidence-scatter__table {
          overflow-x: auto;
          border: 1px solid var(--rule-strong);
          border-top: 0;
        }

        .evidence-scatter table {
          width: 100%;
          min-width: 38rem;
          border-collapse: collapse;
          background: var(--paper-raised);
          text-align: left;
        }

        .evidence-scatter th,
        .evidence-scatter td {
          padding: 0.6rem 0.8rem;
          border-bottom: 1px solid var(--rule);
        }

        .evidence-scatter tbody tr:last-child th,
        .evidence-scatter tbody tr:last-child td {
          border-bottom: 0;
        }

        .evidence-scatter td {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .evidence-scatter figcaption {
          display: grid;
          padding-top: 0.75rem;
          color: var(--ink-soft);
          font-size: var(--step--1);
          gap: 0.35rem;
        }

        .evidence-scatter__provenance {
          font-family: var(--font-mono);
          font-size: 0.7rem;
        }
      `}</style>
    </figure>
  );
}
