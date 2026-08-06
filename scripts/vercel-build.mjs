import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const snykPreviewBranch = "feat/snyk-2026-brand-theme";

export function resolveVercelDesignTheme(environment) {
  if (
    environment.VERCEL_ENV === "preview" &&
    environment.VERCEL_GIT_COMMIT_REF === snykPreviewBranch &&
    (environment.VULNBENCH_DESIGN_THEME === undefined ||
      environment.VULNBENCH_DESIGN_THEME === "")
  ) {
    return "snyk-2026";
  }

  return environment.VULNBENCH_DESIGN_THEME;
}

export function runVercelBuild(environment = process.env) {
  const designTheme = resolveVercelDesignTheme(environment);
  const childEnvironment = { ...environment };

  if (designTheme === undefined || designTheme === "") {
    delete childEnvironment.VULNBENCH_DESIGN_THEME;
  } else {
    childEnvironment.VULNBENCH_DESIGN_THEME = designTheme;
  }

  const result = spawnSync("npm", ["run", "build"], {
    env: childEnvironment,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : null;

if (invokedPath === import.meta.url) {
  process.exitCode = runVercelBuild();
}
