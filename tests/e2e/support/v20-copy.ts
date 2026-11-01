import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const copyRoot = resolve(process.cwd(), "src/data/releases/content/2.0/copy");

export function readV20Copy<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(copyRoot, file), "utf8")) as T;
}

export const v20Home = readV20Copy<{
  h1: string;
  subtitle: string;
  buttons: string[];
  stats: { value: string; label: string }[];
  headline_evidence: { h2: string; callouts: string[]; for_appsec: string };
  findings_intro: { h2: string };
  principles: { h2: string };
}>("home.json");

export function firstOf<T>(items: readonly T[]): T {
  const [item] = items;
  if (item === undefined) throw new Error("Expected at least one 2.0 copy item");
  return item;
}
