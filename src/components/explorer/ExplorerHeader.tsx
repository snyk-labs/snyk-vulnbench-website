interface ExplorerHeaderProps {
  activeFilterCount: number;
  aggregation: string;
  metric: string;
  representedRuns: number;
  viewLabel: string;
  ignored: string[];
  onExport: () => void;
  onReset: () => void;
  onShare: () => void;
}

export function ExplorerHeader({
  activeFilterCount,
  aggregation,
  metric,
  representedRuns,
  viewLabel,
  ignored,
  onExport,
  onReset,
  onShare,
}: ExplorerHeaderProps) {
  return (
    <header className="explorer-header">
      <div>
        <p className="eyebrow">Snyk VulnBench JS 1.0</p>
        <h2>JS 1.0 explorer</h2>
      </div>
      <dl>
        <div>
          <dt>Dataset</dt>
          <dd>1.0.0</dd>
        </div>
        <div>
          <dt>View</dt>
          <dd>{viewLabel}</dd>
        </div>
        <div>
          <dt>Filters</dt>
          <dd>
            {activeFilterCount} active{" "}
            {activeFilterCount === 1 ? "filter" : "filters"}
          </dd>
        </div>
        <div>
          <dt>Records</dt>
          <dd>{representedRuns} represented runs</dd>
        </div>
        <div>
          <dt>Metric</dt>
          <dd>{metric}</dd>
        </div>
        <div>
          <dt>Aggregation</dt>
          <dd>{aggregation}</dd>
        </div>
      </dl>
      <div className="explorer-header__actions">
        <button onClick={onReset} type="button">
          Reset view
        </button>
        <button onClick={onShare} type="button">
          Copy share link
        </button>
        <button onClick={onExport} type="button">
          Export filtered CSV
        </button>
        <a href="/releases/js-1.0/data">Data</a>
        <a href="/releases/js-1.0/methodology">Methodology</a>
      </div>
      {ignored.length > 0 && (
        <p className="explorer-header__notice" role="status">
          <strong>Ignored invalid explorer parameters:</strong>{" "}
          {ignored.join(", ")}
        </p>
      )}
    </header>
  );
}
