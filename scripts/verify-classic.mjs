import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const classicGateCommands = [
  "check",
  "test:unit",
  "build",
  "check:releases",
  "check:budget",
  "test:e2e",
];

function classicEnvironment(environment = process.env) {
  return {
    ...environment,
    VULNBENCH_DESIGN_THEME: "classic",
  };
}

export function inspectClassicGate(environment = process.env) {
  const childEnvironment = classicEnvironment(environment);
  return classicGateCommands.map((command) => ({
    command,
    designTheme: childEnvironment.VULNBENCH_DESIGN_THEME,
  }));
}

export function runClassicGate(environment = process.env) {
  const childEnvironment = classicEnvironment(environment);
  for (const command of classicGateCommands) {
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
  process.exitCode = runClassicGate();
}
