import type { ComparisonRow } from "./selectors";

interface ComparisonTrayProps {
  compact: boolean;
  filterSummary: string;
  rows: ComparisonRow[];
  open: boolean;
  onBaseline: (id: string) => void;
  onClose: () => void;
  onUnpin: (id: string) => void;
}

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function delta(value: number | null, unit = "pp") {
  if (value === null) return "N/A";
  const rendered = unit === "pp" ? (value * 100).toFixed(1) : value.toFixed(3);
  return `${value > 0 ? "+" : ""}${rendered} ${unit}`;
}

export function ComparisonTray({
  rows,
  compact,
  filterSummary,
  open,
  onBaseline,
  onClose,
  onUnpin,
}: ComparisonTrayProps) {
  return (
    <section
      aria-label="Configuration comparison"
      aria-modal={compact && open ? true : undefined}
      className={`comparison-tray ${open ? "is-open" : ""}`}
      hidden={compact && !open}
      id="explorer-comparison"
      role={compact ? "dialog" : "region"}
    >
      <div className="comparison-tray__heading">
        <div>
          <p className="eyebrow">Compare</p>
          <h3>{rows.length} pinned</h3>
        </div>
        <button autoFocus={compact && open} onClick={onClose} type="button">
          Close comparison
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="comparison-tray__empty">
          Pin up to four configurations from a view to compare agreement,
          repeatability, and resource use.
        </p>
      ) : (
        <>
          <p className="comparison-tray__filters">{filterSummary}</p>
          <div className="comparison-tray__scroll" tabIndex={0}>
            <table>
            <caption>Configuration comparison with deltas from baseline</caption>
            <thead>
              <tr>
                <th scope="col">Configuration</th>
                <th scope="col">Baseline</th>
                <th scope="col">F1</th>
                <th scope="col">Δ F1</th>
                <th scope="col">F1 spread</th>
                <th scope="col">Recall</th>
                <th scope="col">Precision</th>
                <th scope="col">Cost</th>
                <th scope="col">Tokens</th>
                <th scope="col">Duration</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.name}</th>
                  <td>
                    <label>
                      <input
                        aria-label={`Use ${row.name} as baseline`}
                        checked={row.isBaseline}
                        name="comparison-baseline"
                        onChange={() => onBaseline(row.id)}
                        type="radio"
                      />
                      <span className="visually-hidden">Baseline</span>
                    </label>
                  </td>
                  <td className="metric">{percent.format(row.f1)}</td>
                  <td className="metric">{delta(row.f1Delta)}</td>
                  <td className="metric">
                    {(row.f1StdDev * 100).toFixed(1)} pp
                  </td>
                  <td className="metric">{percent.format(row.recall)}</td>
                  <td className="metric">{percent.format(row.precision)}</td>
                  <td className="metric">
                    {row.costUsd === null
                      ? "N/A"
                      : `$${row.costUsd.toFixed(3)}`}
                  </td>
                  <td className="metric">
                    {Math.round(row.tokens).toLocaleString("en-US")}
                  </td>
                  <td className="metric">
                    {(row.durationMs / 1000).toFixed(1)} s
                  </td>
                  <td>
                    <button onClick={() => onUnpin(row.id)} type="button">
                      Unpin {row.name}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
