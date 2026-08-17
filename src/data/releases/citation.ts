import type { Release } from "./schema";

type CitationRelease = Pick<Release, "id" | "citation">;

const bibtexEscapes: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "%": "\\%",
  "$": "\\$",
  "&": "\\&",
  "#": "\\#",
  _: "\\_",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

const escapeBibtexValue = (value: string) =>
  value.replace(/[\\{}%$&#_~^]/g, (character) => bibtexEscapes[character] ?? character);

const formatAuthor = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return escapeBibtexValue(name.trim());

  const surname = parts.pop();
  return `${escapeBibtexValue(surname ?? "")}, ${escapeBibtexValue(parts.join(" "))}`;
};

const citationKey = ({ id, citation }: CitationRelease) => {
  const surname =
    citation.authors[0]
      ?.trim()
      .split(/\s+/)
      .at(-1)
      ?.replace(/[^A-Za-z0-9]/g, "")
      .toLowerCase() || "vulnbench";
  const releaseId = id.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
  return `${surname}${citation.year}${releaseId}`;
};

export function formatBibtexCitation({
  id,
  citation,
}: CitationRelease): string {
  const authors = citation.authors.map(formatAuthor).join(" and ");

  return [
    `@misc{${citationKey({ id, citation })},`,
    `  author = {${authors}},`,
    `  title = {${escapeBibtexValue(citation.title)}},`,
    `  year = {${citation.year}},`,
    `  url = {${escapeBibtexValue(citation.url)}}`,
    "}",
  ].join("\n");
}
