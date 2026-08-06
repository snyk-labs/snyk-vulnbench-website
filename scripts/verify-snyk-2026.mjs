import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const snyk2026GateCommands = [
  "check",
  "test:unit",
  "build",
  "check:releases",
  "check:budget",
  "check:brand",
  "test:e2e:snyk-2026",
];

function snyk2026Environment(environment = process.env) {
  return {
    ...environment,
    VULNBENCH_DESIGN_THEME: "snyk-2026",
  };
}

export function inspectSnyk2026Gate(environment = process.env) {
  const childEnvironment = snyk2026Environment(environment);
  return snyk2026GateCommands.map((command) => ({
    command,
    designTheme: childEnvironment.VULNBENCH_DESIGN_THEME,
  }));
}

export function runSnyk2026Gate(environment = process.env) {
  const childEnvironment = snyk2026Environment(environment);
  for (const command of snyk2026GateCommands) {
    const result = spawnSync("npm", ["run", command], {
      env: childEnvironment,
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    if (result.status !== 0) return result.status ?? 1;
  }
  return 0;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  process.exitCode = runSnyk2026Gate();
}
