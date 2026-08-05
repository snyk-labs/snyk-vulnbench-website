import { describe, expect, it } from "vitest";
import { loadJs10EvidenceDepth } from "./js-1.0";

describe("JS 1.0 evidence depth", () => {
  it("reconstructs normalized matched and unmatched signatures", async () => {
    const evidence = await loadJs10EvidenceDepth();
    const matched = evidence.findings.filter(({ status }) => status === "matched");
    const unmatched = evidence.findings.filter(
      ({ status }) => status === "unmatched",
    );

    expect(matched).toHaveLength(158);
    expect(unmatched).toHaveLength(161);
    expect(matched.filter(({ occurrences }) => occurrences === 5)).toHaveLength(
      134,
    );
    expect(unmatched.filter(({ occurrences }) => occurrences === 1)).toHaveLength(
      80,
    );
    expect(unmatched.filter(({ occurrences }) => occurrences === 5)).toHaveLength(
      22,
    );
  });

  it("loads all project reference and source context", async () => {
    const evidence = await loadJs10EvidenceDepth();
    const nightowl = evidence.projects.find(
      ({ id }) => id === "js-project-nightowl-find-vulns",
    );

    expect(evidence.projects).toHaveLength(10);
    expect(nightowl?.referenceFindings).toHaveLength(7);
    expect(nightowl?.sourceFiles).toEqual(
      expect.arrayContaining(["server.js", "db.js", "public/app.js"]),
    );
    expect(
      nightowl?.referenceFindings.find(
        ({ id }) => id === "js-path-traversal-4a",
      ),
    ).toMatchObject({
      type: "path-traversal",
      file: "server.js",
      line: 140,
    });
    expect(
      nightowl?.sourceContexts.find(
        ({ findingId }) => findingId === "js-path-traversal-4a",
      )?.snippet,
    ).toContain("fs.unlink");
  });

  it("preserves opposite SQL-shaped case interpretations as evidence", async () => {
    const evidence = await loadJs10EvidenceDepth();
    const sql = evidence.findings.filter(
      ({ status, vulnerabilityClass }) =>
        status === "unmatched" && vulnerabilityClass === "sql-injection",
    );

    expect(
      sql.filter(
        ({ projectId, occurrences }) =>
          projectId === "js-project-tigerteam-find-vulns" && occurrences === 5,
      ),
    ).toHaveLength(5);
    expect(
      sql.filter(
        ({ projectId, occurrences }) =>
          projectId === "js-project-nightowl-find-vulns" && occurrences === 5,
      ),
    ).toHaveLength(5);
  });

  it("uses stable IDs and five-repetition denominators", async () => {
    const evidence = await loadJs10EvidenceDepth();

    expect(new Set(evidence.findings.map(({ id }) => id)).size).toBe(
      evidence.findings.length,
    );
    expect(
      evidence.findings.every(
        ({ occurrences, totalRepetitions }) =>
          occurrences >= 1 &&
          occurrences <= 5 &&
          totalRepetitions === 5,
      ),
    ).toBe(true);
    expect(
      evidence.findings.some(({ metadataVariants }) => metadataVariants.length > 1),
    ).toBe(true);
    expect(
      evidence.findings.every(
        ({ severity, description, metadataVariants }) =>
          severity === metadataVariants[0]?.severity &&
          description === metadataVariants[0]?.description,
      ),
    ).toBe(true);
  });
});
