import { useRef, useState, type KeyboardEvent } from "react";
import {
  JS10_FIXTURE_SLOC,
  projectResource,
  resourceProjectionProvenance,
  type ResourceMetric,
  type ResourceProfile,
  webApplicationReferences,
} from "../../../data/explorer/resource-projection";
import { downloadCsv, downloadSvg, toCsv } from "../export";

interface ModelResourceProjectionProps {
  metric: ResourceMetric;
  profiles: ResourceProfile[];
  selectedConfigurationIds: string[];
}

const configurationStyles: Record<
  string,
  { color: string; symbol: string }
> = {
  "Snyk Code SAST": {
    color: "var(--series-1)",
    symbol: "●",
  },
  "Claude Opus 4.6 Medium": {
    color: "var(--series-2)",
    symbol: "■",
  },
  "Claude Opus 4.6 High": {
    color: "var(--series-3)",
    symbol: "◆",
  },
  "Claude Opus 4.7 Max": {
    color: "var(--series-4)",
    symbol: "▲",
  },
  "Claude Sonnet 4.6 Medium": {
    color: "var(--series-5)",
    symbol: "⬟",
  },
  "Claude Sonnet 4.6 High": {
    color: "var(--series-6)",
    symbol: "✚",
  },
};

const metricDetails: Record<
  ResourceMetric,
  {
    label: string;
    title: string;
    axisLabel: string;
    unit: string;
  }
> = {
  cost: {
    label: "cost",
    title: "Projected model cost by web application size",
    axisLabel: "Projected model-session cost (USD)",
    unit: "USD",
  },
  tokens: {
    label: "tokens",
    title: "Projected model tokens by web application size",
    axisLabel: "Projected model-session tokens",
    unit: "tokens",
  },
  duration: {
    label: "duration",
    title: "Projected model duration by web application size",
    axisLabel: "Projected model-session duration (seconds)",
    unit: "seconds",
  },
};

const projectionCaveat =
  "Projected values are linear extrapolations from small JS 1.0 fixtures. They do not model context windows, repository indexing, incremental scans, parallel execution, deduplication, caching changes, model price changes, or economies of scale. Application points are size references, not completed scans. Scanning a full codebase does not guarantee finding every vulnerability.";

export const RESOURCE_PROJECTION_VIEWBOX_WIDTH = 720;

const plot = { left: 88, right: 445, top: 60, bottom: 342 };
const endpointLabelX = 470;
const endpointLabelGap = 30;
const endpointLabelCharacterWidth = 6.1;

export function resourceProjectionLabelBounds(
  configurationName: string,
  rateLabel: string,
) {
  return {
    left: endpointLabelX,
    right:
      endpointLabelX +
      Math.max(
        `● ${configurationName}`.length,
        rateLabel.length,
      ) *
        endpointLabelCharacterWidth,
  };
}

function styleFor(configurationName: string) {
  return (
    configurationStyles[configurationName] ?? {
      color: "var(--series-fallback)",
      symbol: "●",
    }
  );
}

function rateFor(profile: ResourceProfile, metric: ResourceMetric) {
  if (metric === "cost") return profile.costPerKSloc;
  if (metric === "tokens") return profile.tokensPerKSloc;
  return profile.secondsPerKSloc;
}

function formatProjected(value: number | null, metric: ResourceMetric) {
  if (value === null) return "N/A";
  if (metric === "cost") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (metric === "tokens") return Math.round(value).toLocaleString("en-US");
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} s`;
}

function formatRate(value: number | null, metric: ResourceMetric) {
  if (value === null) return "N/A";
  if (metric === "cost") return `$${value.toFixed(3)}/1k SLOC`;
  if (metric === "tokens") {
    return `${Math.round(value).toLocaleString("en-US")} tokens/1k SLOC`;
  }
  return `${value.toFixed(1)} s/1k SLOC`;
}

function formatTick(value: number, metric: ResourceMetric) {
  if (metric === "cost") return `$${value.toFixed(0)}`;
  if (metric === "tokens") return `${Math.round(value / 1_000_000)}M`;
  return `${Math.round(value / 3600)}h`;
}

function formatCsvValue(value: number | null, metric: ResourceMetric) {
  if (value === null) return null;
  if (metric === "cost") return value.toFixed(3);
  if (metric === "tokens") return Math.round(value);
  return value.toFixed(3);
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

function ticks(maximum: number) {
  return Array.from({ length: 5 }, (_, index) => (maximum * index) / 4);
}

export function ModelResourceProjection({
  metric,
  profiles,
  selectedConfigurationIds,
}: ModelResourceProjectionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeReferenceId, setActiveReferenceId] = useState<string>(
    webApplicationReferences[0].id,
  );
  const detail = metricDetails[metric];
  const title = detail.title;
  const plotTitle = `Projected model ${detail.label} by source lines of code`;
  const selectedProfiles = profiles.filter(({ configurationId }) =>
    selectedConfigurationIds.includes(configurationId),
  );
  const activeReference =
    webApplicationReferences.find(({ id }) => id === activeReferenceId) ??
    webApplicationReferences[0];
  const series = selectedProfiles
    .map((profile, index) => ({
      profile,
      index,
      rate: rateFor(profile, metric),
      values: webApplicationReferences.map((reference) =>
        projectResource(profile, reference, metric),
      ),
    }))
    .filter(
      (
        candidate,
      ): candidate is {
        profile: ResourceProfile;
        index: number;
        rate: number;
        values: number[];
      } =>
        candidate.rate !== null &&
        candidate.values.every((value): value is number => value !== null),
    );
  const maximumValue = Math.max(
    1,
    ...series.flatMap(({ values }) => values),
  );
  const yMaximum = maximumValue * 1.1;
  const xForSloc = (sloc: number) =>
    scale(sloc, 0, webApplicationReferences.at(-1)!.sloc, plot.left, plot.right);
  const yForValue = (value: number) =>
    scale(value, 0, yMaximum, plot.bottom, plot.top);
  const endpointLabelSeeds = series
    .map((entry) => ({
      ...entry,
      endpointY: yForValue(entry.values.at(-1)!),
    }))
    .sort((left, right) => left.endpointY - right.endpointY);
  const endpointLabels = endpointLabelSeeds.reduce<
    Array<(typeof endpointLabelSeeds)[number] & { labelY: number }>
  >((labels, entry) => {
    const previous = labels.at(-1);
    labels.push({
      ...entry,
      labelY: Math.max(
        plot.top + 10,
        entry.endpointY,
        (previous?.labelY ?? 0) + endpointLabelGap,
      ),
    });
    return labels;
  }, []);
  for (let index = endpointLabels.length - 1; index >= 0; index -= 1) {
    const next = endpointLabels[index + 1];
    endpointLabels[index]!.labelY = Math.min(
      endpointLabels[index]!.labelY,
      next ? next.labelY - endpointLabelGap : plot.bottom - 20,
    );
  }
  const activeValues = selectedProfiles.map((profile) => ({
    profile,
    value: projectResource(profile, activeReference, metric),
  }));
  const svgProjectionValues = selectedProfiles
    .flatMap((profile) =>
      webApplicationReferences.map(
        (reference) =>
          `${profile.configurationName}; ${reference.name}: ${formatProjected(
            projectResource(profile, reference, metric),
            metric,
          )} ${detail.unit}`,
      ),
    )
    .join(". ");

  function selectReference(index: number) {
    setActiveReferenceId(webApplicationReferences[index]!.id);
  }

  function handleReferenceKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const lastIndex = webApplicationReferences.length - 1;
    const nextIndex =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? Math.min(index + 1, lastIndex)
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? Math.max(index - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null;
    if (nextIndex === null) return;
    event.preventDefault();
    selectReference(nextIndex);
    document
      .getElementById(`resource-projection-reference-${nextIndex}`)
      ?.focus();
  }

  return (
    <figure className="model-resource-projection">
      <div className="model-resource-projection__heading">
        <p className="eyebrow">Projected</p>
        <h3>{title}</h3>
        <p>
          Release-wide observed resource rates applied to five pinned
          web-application size references.
        </p>
      </div>

      <div className="model-resource-projection__plot-scroll" tabIndex={0}>
        <svg
          aria-label={plotTitle}
          className="model-resource-projection__plot"
          ref={svgRef}
          role="img"
          viewBox={`0 0 ${RESOURCE_PROJECTION_VIEWBOX_WIDTH} 440`}
        >
        <title>{plotTitle}</title>
        <desc>
          {resourceProjectionProvenance.releaseName} · Dataset{" "}
          {resourceProjectionProvenance.datasetVersion} · Resource denominator:
          {" "}
          {JS10_FIXTURE_SLOC.toLocaleString("en-US")} SLOC. Resource
          observations: {resourceProjectionProvenance.resourceObservationSource}.
          {" "}{projectionCaveat}{" "}
          Exact projected {detail.label} values: {svgProjectionValues}
        </desc>
        <text className="chart-title" x="88" y="25">
          {title}
        </text>
        <line className="axis" x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} />
        <line className="axis" x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} />
        {ticks(yMaximum).map((tick) => {
          const y = yForValue(tick);
          return (
            <g key={tick}>
              <line className="gridline" x1={plot.left} x2={plot.right} y1={y} y2={y} />
              <text className="tick-label" textAnchor="end" x="80" y={y + 4}>
                {formatTick(tick, metric)}
              </text>
            </g>
          );
        })}
        {webApplicationReferences.map((reference) => {
          const x = xForSloc(reference.sloc);
          return (
            <g key={reference.id}>
              <line
                className="application-reference"
                data-application={reference.id}
                strokeDasharray="3 3"
                x1={x}
                x2={x}
                y1={plot.top}
                y2={plot.bottom}
              />
              <text
                className="application-label"
                textAnchor="middle"
                x={x}
                y="365"
              >
                {reference.name}
              </text>
              <text
                className="tick-label"
                textAnchor="middle"
                x={x}
                y="380"
              >
                {reference.sloc.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}
        {series.map(({ profile, values }) => {
          const style = styleFor(profile.configurationName);
          const points = [
            `${plot.left},${plot.bottom}`,
            ...values.map(
              (value, referenceIndex) =>
                `${xForSloc(webApplicationReferences[referenceIndex]!.sloc)},${yForValue(value)}`,
            ),
          ].join(" ");
          return (
            <polyline
              className="projection-line"
              data-configuration={profile.configurationId}
              data-testid={`projection-line-${profile.configurationId}`}
              fill="none"
              key={profile.configurationId}
              points={points}
              stroke={style.color}
            />
          );
        })}
        {endpointLabels.map(({ profile, endpointY, labelY, rate }) => {
          const style = styleFor(profile.configurationName);
          return (
            <g key={`label-${profile.configurationId}`}>
              <line
                className="projection-leader"
                stroke={style.color}
                x1={plot.right}
                x2={endpointLabelX - 5}
                y1={endpointY}
                y2={labelY}
              />
              <text
                className="configuration-label"
                data-configuration={profile.configurationId}
                data-testid="projection-label"
                fill="var(--ink)"
                paintOrder="stroke fill"
                stroke="var(--paper-raised)"
                strokeLinejoin="round"
                strokeWidth="3px"
                x={endpointLabelX}
                y={labelY}
              >
                <tspan fill={style.color} x={endpointLabelX} y={labelY}>
                  {style.symbol}
                </tspan>{" "}
                <tspan>{profile.configurationName}</tspan>
                <tspan x={endpointLabelX} dy="12">
                  {formatRate(rate, metric)}
                </tspan>
              </text>
            </g>
          );
        })}
        <text className="axis-label" textAnchor="middle" x="349" y="418">
          Application source lines of code
        </text>
        <text
          className="axis-label"
          textAnchor="middle"
          transform="rotate(-90 20 201)"
          x="20"
          y="201"
        >
          {detail.axisLabel}
        </text>
        </svg>
      </div>

      <div
        aria-label="Web application reference selector"
        className="model-resource-projection__references"
        role="group"
      >
        {webApplicationReferences.map((reference, index) => (
          <button
            aria-label={`Show ${reference.name} projections`}
            aria-pressed={reference.id === activeReference.id}
            id={`resource-projection-reference-${index}`}
            key={reference.id}
            onClick={() => selectReference(index)}
            onKeyDown={(event) => handleReferenceKeyDown(event, index)}
            type="button"
          >
            <strong>{reference.name}</strong>
            <span>{reference.sloc.toLocaleString("en-US")} SLOC</span>
          </button>
        ))}
      </div>

      <p className="model-resource-projection__status" aria-live="polite" role="status">
        <span>
          Projected {detail.label} ({detail.unit})
        </span>
        <strong>{activeReference.name}</strong>
        <span>{activeReference.sloc.toLocaleString("en-US")} SLOC</span>
        {activeValues.map(({ profile, value }) => (
          <span key={profile.configurationId}>
            {profile.configurationName}: {formatProjected(value, metric)}
          </span>
        ))}
      </p>

      <div className="model-resource-projection__exports">
        <button
          onClick={() =>
            downloadCsv(
              `${resourceProjectionProvenance.exportFilePrefix}-projected-${metric}.csv`,
              toCsv(
                [
                  "Metric",
                  "Unit",
                  "Release",
                  "Dataset version",
                  "Resource observations source",
                  "Fixture SLOC denominator",
                  "Configuration",
                  "Application",
                  "Application SLOC",
                  "Observed normalized rate per 1,000 SLOC",
                  "Projected value",
                  "Source status",
                  "Projection caveat",
                ],
                selectedProfiles.flatMap((profile) =>
                  webApplicationReferences.map((reference) => [
                    detail.label,
                    detail.unit,
                    resourceProjectionProvenance.releaseName,
                    resourceProjectionProvenance.datasetVersion,
                    resourceProjectionProvenance.resourceObservationSource,
                    JS10_FIXTURE_SLOC,
                    profile.configurationName,
                    reference.name,
                    reference.sloc,
                    rateFor(profile, metric),
                    formatCsvValue(projectResource(profile, reference, metric), metric),
                    "Projected",
                    projectionCaveat,
                  ]),
                ),
              ),
            )
          }
          type="button"
        >
          Export projected {detail.label} CSV
        </button>
        <button
          onClick={() => {
            if (svgRef.current) {
              downloadSvg(
                `${resourceProjectionProvenance.exportFilePrefix}-projected-${metric}.svg`,
                svgRef.current,
              );
            }
          }}
          type="button"
        >
          Export projected {detail.label} SVG
        </button>
      </div>

      <div className="model-resource-projection__table" tabIndex={0}>
        <table aria-label={`Projected model ${detail.label} by web application`}>
          <thead>
            <tr>
              <th scope="col">Configuration</th>
              <th scope="col">Observed normalized rate</th>
              {webApplicationReferences.map((reference) => (
                <th key={reference.id} scope="col">
                  {reference.name}
                </th>
              ))}
              <th scope="col">Unit</th>
              <th scope="col">Source status</th>
            </tr>
          </thead>
          <tbody>
            {selectedProfiles.map((profile) => {
              const style = styleFor(profile.configurationName);
              return (
                <tr key={profile.configurationId}>
                  <th scope="row">
                    <span
                      aria-hidden="true"
                      className="model-resource-projection__symbol"
                      style={{ color: style.color }}
                    >
                      {style.symbol}
                    </span>{" "}
                    {profile.configurationName}
                  </th>
                  <td className="metric">{formatRate(rateFor(profile, metric), metric)}</td>
                  {webApplicationReferences.map((reference) => (
                    <td className="metric" key={reference.id}>
                      {formatProjected(
                        projectResource(profile, reference, metric),
                        metric,
                      )}
                    </td>
                  ))}
                  <td>{detail.unit}</td>
                  <td>Projected</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <figcaption>
        <p>
          <strong>Projection:</strong> each value uses the complete 10-fixture
          release resource total, normalized by {JS10_FIXTURE_SLOC.toLocaleString(
            "en-US",
          )}{" "}
          SLOC, then scaled to the reference application size.
        </p>
        <p>
          <strong>Caveat:</strong> {projectionCaveat}
        </p>
        <p>
          Snyk-reference F1 is reference agreement, not universal detection
          accuracy. Snyk Code has no comparable model-session cost or token
          value.
        </p>
        <p className="model-resource-projection__provenance">
          {resourceProjectionProvenance.releaseName} · Dataset{" "}
          {resourceProjectionProvenance.datasetVersion} · Resource observations
          from {resourceProjectionProvenance.resourceObservationSource} ·
          Application SLOC measured with{" "}
          {resourceProjectionProvenance.applicationMeasurementTool} on pinned
          revisions, {resourceProjectionProvenance.applicationMeasurementDate}
        </p>
      </figcaption>

      <style>{`
        .model-resource-projection {
          min-width: 0;
          margin: 0;
        }

        .model-resource-projection__heading {
          margin-bottom: 0.75rem;
        }

        .model-resource-projection__heading p {
          margin: 0;
        }

        .model-resource-projection__heading h3 {
          margin: 0.25rem 0;
        }

        .model-resource-projection__plot-scroll {
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          border: 1px solid var(--rule-strong);
          background: var(--paper-raised);
        }

        .model-resource-projection__plot {
          display: block;
          width: 100%;
          min-width: 45rem;
        }

        .model-resource-projection__plot .axis {
          stroke: var(--ink);
          stroke-width: 1.5;
        }

        .model-resource-projection__plot .gridline,
        .model-resource-projection__plot .application-reference {
          stroke: var(--rule);
          stroke-width: 1;
        }

        .model-resource-projection__plot .application-reference {
        }

        .model-resource-projection__plot .chart-title {
          fill: var(--ink);
          font-size: 15px;
          font-weight: var(--font-weight-label-strong);
        }

        .model-resource-projection__plot .axis-label,
        .model-resource-projection__plot .tick-label,
        .model-resource-projection__plot .application-label {
          fill: var(--ink-soft);
          font-family: var(--font-mono);
        }

        .model-resource-projection__plot .axis-label {
          font-size: 13px;
        }

        .model-resource-projection__plot .tick-label,
        .model-resource-projection__plot .application-label {
          font-size: 10px;
        }

        .model-resource-projection__plot .application-label {
          font-weight: var(--font-weight-label-strong);
        }

        .model-resource-projection__plot .projection-line {
          stroke-width: 2.5;
        }

        .model-resource-projection__plot .projection-leader {
          stroke-width: 1.5;
        }

        .model-resource-projection__plot .configuration-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: var(--font-weight-label-strong);
        }

        .model-resource-projection__references {
          display: grid;
          border-inline: 1px solid var(--rule-strong);
          grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
        }

        .model-resource-projection__references button {
          display: grid;
          min-width: 0;
          min-height: 3.4rem;
          padding: 0.55rem 0.7rem;
          border: 0;
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
          background: var(--paper-raised);
          color: var(--ink);
          cursor: pointer;
          font: inherit;
          text-align: left;
        }

        .model-resource-projection__references button:hover,
        .model-resource-projection__references button[aria-pressed="true"] {
          background: var(--purple-soft);
        }

        .model-resource-projection__references span {
          color: var(--ink-soft);
          font-family: var(--font-mono);
          font-size: var(--step--1);
        }

        .model-resource-projection__status {
          display: flex;
          margin: 0;
          padding: 0.7rem 0.9rem;
          background: var(--ink);
          color: var(--inverse-text);
          gap: 0.35rem 1rem;
          flex-wrap: wrap;
          font-family: var(--font-mono);
          font-size: var(--step--1);
          font-variant-numeric: tabular-nums;
        }

        .model-resource-projection__exports {
          display: flex;
          padding: 0.55rem;
          border-inline: 1px solid var(--rule-strong);
          background: var(--paper-muted);
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .model-resource-projection__exports button {
          min-height: 2.2rem;
          padding: 0.35rem 0.55rem;
          border: 1px solid var(--ink);
          background: var(--paper-raised);
          color: var(--ink);
          font-size: 0.72rem;
          font-weight: var(--font-weight-control);
        }

        .model-resource-projection__table {
          max-width: 100%;
          overflow-x: auto;
          border: 1px solid var(--rule-strong);
          border-top: 0;
        }

        .model-resource-projection table {
          width: 100%;
          min-width: 68rem;
          border-collapse: collapse;
          background: var(--paper-raised);
          text-align: left;
        }

        .model-resource-projection th,
        .model-resource-projection td {
          padding: 0.6rem 0.8rem;
          border-bottom: 1px solid var(--rule);
          white-space: nowrap;
        }

        .model-resource-projection tbody tr:last-child th,
        .model-resource-projection tbody tr:last-child td {
          border-bottom: 0;
        }

        .model-resource-projection td {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .model-resource-projection__symbol {
          display: inline-block;
          width: 1rem;
          text-align: center;
        }

        .model-resource-projection figcaption {
          display: grid;
          padding-top: 0.75rem;
          color: var(--ink-soft);
          font-size: var(--step--1);
          gap: 0.35rem;
        }

        .model-resource-projection figcaption p {
          margin: 0;
        }

        .model-resource-projection__provenance {
          font-family: var(--font-mono);
          font-size: 0.7rem;
        }
      `}</style>
    </figure>
  );
}
