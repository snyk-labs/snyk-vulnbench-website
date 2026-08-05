import { useEffect, useMemo, useState } from "react";
import type {
  EvidenceDepthDataset,
  FindingSignature,
} from "../../../data/evidence/schema";
import { downloadCsv, toCsv } from "../export";
import { serializeExplorerState, type ExplorerState } from "../state";

interface FindingsViewProps {
  evidenceUrl: string;
  state: ExplorerState;
  onChange: (state: ExplorerState) => void;
  onPin: (id: string) => void;
}

export function FindingsView({
  evidenceUrl,
  state,
  onChange,
  onPin,
}: FindingsViewProps) {
  const [evidence, setEvidence] = useState<EvidenceDepthDataset | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(evidenceUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Evidence request failed: ${response.status}`);
        return response.json() as Promise<EvidenceDepthDataset>;
      })
      .then(setEvidence)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Evidence request failed");
      });
    return () => controller.abort();
  }, [evidenceUrl]);

  const findings = useMemo(() => {
    if (!evidence) return [];
    const filtered = evidence.findings.filter(
        (finding) =>
          (state.configurations.length === 0 ||
            state.configurations.includes(finding.configurationId)) &&
          (state.projects.length === 0 ||
            state.projects.includes(finding.projectId)) &&
          (state.vulnerabilityClasses.length === 0 ||
            state.vulnerabilityClasses.includes(finding.vulnerabilityClass)) &&
          (state.findingStatus === "combined" ||
            state.findingStatus === finding.status) &&
          finding.occurrences >= state.recurrenceThreshold,
      );
    return filtered.sort((left, right) => {
      if (state.sort === "recurrence-asc") {
        return left.occurrences - right.occurrences;
      }
      if (state.sort === "project-asc") {
        return left.projectName.localeCompare(right.projectName);
      }
      if (state.sort === "configuration-asc") {
        return left.configurationName.localeCompare(right.configurationName);
      }
      if (state.sort === "class-asc") {
        return left.vulnerabilityClass.localeCompare(right.vulnerabilityClass);
      }
      return (
        right.occurrences - left.occurrences ||
        left.projectName.localeCompare(right.projectName) ||
        left.configurationName.localeCompare(right.configurationName)
      );
    });
  }, [evidence, state]);

  if (error) {
    return (
      <section className="explorer-empty">
        <h3>Finding evidence could not be loaded</h3>
        <p>{error}</p>
        <a href={evidenceUrl}>Download the evidence directly</a>
      </section>
    );
  }
  if (!evidence) {
    return (
      <section aria-live="polite" className="explorer-empty">
        <h3>Loading normalized finding evidence…</h3>
      </section>
    );
  }

  const selected = state.selectedFinding
    ? findings.find(({ id }) => id === state.selectedFinding)
    : null;
  const staleSelection = state.selectedFinding !== null && !selected;

  return (
    <section aria-labelledby="findings-view-title" className="explorer-view">
      <div className="explorer-view__heading">
        <p className="eyebrow">Finding evidence</p>
        <h3 id="findings-view-title">Normalized finding signatures</h3>
        <p>
          {findings.length} signatures match the active configuration, project,
          class, status, and recurrence filters.
        </p>
      </div>

      {staleSelection && (
        <div className="explorer-note" role="status">
          <strong>Selected finding is unavailable.</strong>
          <p>The URL referenced a stale or filtered finding ID.</p>
          <button
            onClick={() => onChange({ ...state, selectedFinding: null })}
            type="button"
          >
            Clear selected finding
          </button>
        </div>
      )}

      {selected && (
        <FindingDetail
          finding={selected}
          onChange={onChange}
          onPin={onPin}
          state={state}
        />
      )}

      <div className="explorer-chart-actions">
        <button
          onClick={() =>
            downloadCsv(
              "js-1.0-findings.csv",
              toCsv(
                [
                  "Signature ID",
                  "Project",
                  "Configuration",
                  "Status",
                  "Vulnerability class",
                  "Representative severity",
                  "File",
                  "Line",
                  "Occurrences",
                  "Total repetitions",
                  "Reference finding ID",
                  "Representative description",
                  "Metadata variant count",
                  "Metadata variants",
                  "Release",
                  "Dataset",
                ],
                findings.map((finding) => [
                  finding.id,
                  finding.projectName,
                  finding.configurationName,
                  finding.status,
                  finding.vulnerabilityClass,
                  finding.severity,
                  finding.file,
                  finding.line,
                  finding.occurrences,
                  finding.totalRepetitions,
                  finding.referenceFindingId,
                  finding.description,
                  finding.metadataVariants.length,
                  finding.metadataVariants
                    .map(
                      (variant) =>
                        `${variant.occurrences}x ${variant.severity}: ${variant.description ?? "No description"}`,
                    )
                    .join(" | "),
                  "Snyk VulnBench JS 1.0",
                  "1.0.0",
                ]),
              ),
            )
          }
          type="button"
        >
          Export findings CSV
        </button>
      </div>

      {findings.length === 0 ? (
        <div className="explorer-empty">
          <h3>No finding signatures match these filters</h3>
          <p>Clear a project, class, status, or recurrence filter.</p>
        </div>
      ) : (
        <div className="explorer-table-scroll" tabIndex={0}>
          <table aria-label="Normalized finding signatures">
            <thead>
              <tr>
                <th
                  aria-sort={state.sort === "project-asc" ? "ascending" : "none"}
                  scope="col"
                >
                  <button
                    onClick={() => onChange({ ...state, sort: "project-asc" })}
                    type="button"
                  >
                    Project
                  </button>
                </th>
                <th
                  aria-sort={
                    state.sort === "configuration-asc" ? "ascending" : "none"
                  }
                  scope="col"
                >
                  <button
                    onClick={() =>
                      onChange({ ...state, sort: "configuration-asc" })
                    }
                    type="button"
                  >
                    Configuration
                  </button>
                </th>
                <th scope="col">Status</th>
                <th
                  aria-sort={state.sort === "class-asc" ? "ascending" : "none"}
                  scope="col"
                >
                  <button
                    onClick={() => onChange({ ...state, sort: "class-asc" })}
                    type="button"
                  >
                    Class
                  </button>
                </th>
                <th scope="col">Location</th>
                <th
                  aria-sort={
                    state.sort === "recurrence-asc"
                      ? "ascending"
                      : state.sort === "recurrence-desc"
                        ? "descending"
                        : "none"
                  }
                  scope="col"
                >
                  <button
                    onClick={() =>
                      onChange({
                        ...state,
                        sort:
                          state.sort === "recurrence-desc"
                            ? "recurrence-asc"
                            : "recurrence-desc",
                      })
                    }
                    type="button"
                  >
                    Recurrence
                  </button>
                </th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((finding) => (
                <tr key={finding.id}>
                  <th scope="row">{finding.projectName}</th>
                  <td>{finding.configurationName}</td>
                  <td>{finding.status}</td>
                  <td>{finding.vulnerabilityClass}</td>
                  <td className="metric">
                    {finding.file ?? "N/A"}
                    {finding.line === null ? "" : `:${finding.line}`}
                  </td>
                  <td className="metric">
                    {finding.occurrences} of {finding.totalRepetitions}
                  </td>
                  <td>
                    <button
                      aria-pressed={state.selectedFinding === finding.id}
                      onClick={() =>
                        onChange({
                          ...state,
                          selectedFinding:
                            state.selectedFinding === finding.id
                              ? null
                              : finding.id,
                        })
                      }
                      type="button"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="explorer-note">
        <strong>Signature definition:</strong> matched signatures use project +
        configuration + reference finding ID. Unmatched signatures use project
        + configuration + vulnerability class + file basename + line. Source:
        benchmark JSONL and fixture reference findings · Dataset 1.0.0.
      </div>
    </section>
  );
}

function FindingDetail({
  finding,
  state,
  onChange,
  onPin,
}: {
  finding: FindingSignature;
  state: ExplorerState;
  onChange: (state: ExplorerState) => void;
  onPin: (id: string) => void;
}) {
  return (
    <article className="finding-detail">
      <div>
        <p className="eyebrow">Selected signature</p>
        <h3>{finding.vulnerabilityClass}</h3>
      </div>
      <dl>
        <div>
          <dt>Status</dt>
          <dd>{finding.status}</dd>
        </div>
        <div>
          <dt>Recurrence</dt>
          <dd>{finding.occurrences} of 5 runs</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>
            {finding.file ?? "Not available"}
            {finding.line === null ? "" : `:${finding.line}`}
          </dd>
        </div>
        <div>
          <dt>Reference ID</dt>
          <dd>{finding.referenceFindingId ?? "Not matched"}</dd>
        </div>
      </dl>
      {finding.description && <p>{finding.description}</p>}
      {finding.metadataVariants.length > 1 && (
        <details>
          <summary>
            {finding.metadataVariants.length} reported metadata variants
          </summary>
          <p>
            The description above is the most frequent variant, selected
            deterministically by occurrence count and lexical tie-break.
          </p>
          <ul>
            {finding.metadataVariants.map((variant, index) => (
              <li key={`${variant.severity}-${index}`}>
                {variant.occurrences} repetitions · {variant.severity} ·{" "}
                {variant.description ?? "No description"}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p>
        {finding.status === "matched"
          ? "This signature agrees with the deterministic Snyk Code reference set; it is not independent ground-truth adjudication."
          : "This report is outside the Snyk Code reference set. It may be false-positive-shaped, adjacent, or a valid product-gap candidate."}
      </p>
      <div className="finding-detail__actions">
        <button
          onClick={() =>
            onChange({
              ...state,
              configurations: [finding.configurationId],
              projects: [finding.projectId],
              vulnerabilityClasses: [finding.vulnerabilityClass],
            })
          }
          type="button"
        >
          Filter to this evidence
        </button>
        <button onClick={() => onPin(finding.configurationId)} type="button">
          Pin configuration
        </button>
        <a
          href={`/releases/js-1.0/cases/${finding.projectId}?return=${encodeURIComponent(`/releases/js-1.0/explore?${serializeExplorerState(state)}`)}`}
        >
          Open project detail
        </a>
      </div>
    </article>
  );
}
