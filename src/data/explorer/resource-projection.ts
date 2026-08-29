import type {
  ExplorerConfiguration,
  ExplorerTaskObservation,
} from "./schema";

export const JS10_FIXTURE_SLOC = 1154;

const JS10_KSLOC_DENOMINATOR = JS10_FIXTURE_SLOC / 1000;

export interface ResourceProjectionProvenance {
  releaseName: string;
  datasetVersion: string;
  resourceObservationSource: string;
  applicationMeasurementTool: string;
  applicationMeasurementDate: string;
  exportFilePrefix: string;
}

export const resourceProjectionProvenance = {
  releaseName: "Snyk VulnBench JS 1.0",
  datasetVersion: "1.0.0",
  resourceObservationSource: "benchmark-2026-05-20T23-06-29-348Z.jsonl",
  applicationMeasurementTool: "cloc 2.06",
  applicationMeasurementDate: "2026-08-29",
  exportFilePrefix: "js-1.0",
} as const satisfies ResourceProjectionProvenance;

const SHARED_COUNTING_NOTE =
  "cloc 2.06 production application code; excludes tests, documentation, dependencies, generated output, fixtures, mocks, and build artifacts.";

export interface WebApplicationReference {
  id: string;
  name: string;
  sloc: number;
  repositoryUrl: string;
  commit: string;
  measurementDate: "2026-08-29";
  countingNote: string;
}

export const webApplicationReferences = [
  {
    id: "mastodon",
    name: "Mastodon",
    sloc: 170_480,
    repositoryUrl: "https://github.com/mastodon/mastodon",
    commit: "b59ddc79241a9e72415d61334b3f748a916c789a",
    measurementDate: "2026-08-29",
    countingNote: `Rails, React, and Node.js streaming service. ${SHARED_COUNTING_NOTE}`,
  },
  {
    id: "zulip",
    name: "Zulip",
    sloc: 326_630,
    repositoryUrl: "https://github.com/zulip/zulip",
    commit: "49ed929428a8bada600dfb2fc51432135e045396",
    measurementDate: "2026-08-29",
    countingNote: `Django and TypeScript web application. ${SHARED_COUNTING_NOTE}`,
  },
  {
    id: "wordpress",
    name: "WordPress Core",
    sloc: 476_469,
    repositoryUrl: "https://github.com/WordPress/wordpress-develop",
    commit: "d30211ee316ed5d41d3d1531e395440fa9f2ce6b",
    measurementDate: "2026-08-29",
    countingNote: `PHP and JavaScript core application code. ${SHARED_COUNTING_NOTE}`,
  },
  {
    id: "discourse",
    name: "Discourse",
    sloc: 637_925,
    repositoryUrl: "https://github.com/discourse/discourse",
    commit: "768a4ed1cd8e6742fe1c1340a9c4ab01318285ec",
    measurementDate: "2026-08-29",
    countingNote: `Rails and Ember web application. ${SHARED_COUNTING_NOTE}`,
  },
  {
    id: "mattermost",
    name: "Mattermost",
    sloc: 795_858,
    repositoryUrl: "https://github.com/mattermost/mattermost",
    commit: "c8b1cc0046c9ab53de4cb33804a7b4bc5cd03a83",
    measurementDate: "2026-08-29",
    countingNote: `Go and React web application. ${SHARED_COUNTING_NOTE}`,
  },
] as const satisfies readonly WebApplicationReference[];

export type ResourceMetric = "cost" | "tokens" | "duration";

export interface ModelResourceProfile {
  configurationId: string;
  configurationName: string;
  configurationType: "model";
  costPerKSloc: number;
  tokensPerKSloc: number;
  secondsPerKSloc: number;
}

export interface CommandResourceProfile {
  configurationId: string;
  configurationName: string;
  configurationType: "command";
  costPerKSloc: null;
  tokensPerKSloc: null;
  secondsPerKSloc: number;
}

export type ResourceProfile = ModelResourceProfile | CommandResourceProfile;

const REQUIRED_PROJECT_COUNT = 10;

function requireFiniteNonNegative(value: number, context: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${context} must be a finite non-negative number`);
  }
  return value;
}

function requirePositiveFinite(value: number, context: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${context} must be a finite positive number`);
  }
  return value;
}

function requireResourceMetric(metric: ResourceMetric): ResourceMetric {
  if (metric !== "cost" && metric !== "tokens" && metric !== "duration") {
    throw new Error(`Unknown resource metric: ${String(metric)}`);
  }
  return metric;
}

type ResourceProfileRuntime = {
  configurationId?: unknown;
  configurationName?: unknown;
  configurationType?: unknown;
  costPerKSloc?: unknown;
  tokensPerKSloc?: unknown;
  secondsPerKSloc?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireProfile(profile: unknown): ResourceProfile {
  if (!isRecord(profile)) {
    throw new Error("Resource profile is required");
  }

  const runtime = profile as ResourceProfileRuntime;
  const configurationId = runtime.configurationId;
  const configurationName = runtime.configurationName;

  if (
    typeof configurationId !== "string" ||
    !configurationId ||
    typeof configurationName !== "string" ||
    !configurationName
  ) {
    throw new Error("Resource profile is required");
  }

  if (typeof runtime.secondsPerKSloc !== "number") {
    throw new Error("secondsPerKSloc must be a finite non-negative number");
  }
  const secondsPerKSloc = requireFiniteNonNegative(
    runtime.secondsPerKSloc,
    "secondsPerKSloc",
  );

  if (runtime.configurationType === "command") {
    if (runtime.costPerKSloc !== null || runtime.tokensPerKSloc !== null) {
      throw new Error(
        `Command profile ${configurationId} must not publish cost or token rates`,
      );
    }
    return {
      configurationId,
      configurationName,
      configurationType: "command",
      costPerKSloc: null,
      tokensPerKSloc: null,
      secondsPerKSloc,
    };
  }

  if (runtime.configurationType !== "model") {
    throw new Error(`Unknown configuration type for ${configurationId}`);
  }

  if (
    runtime.costPerKSloc === null ||
    runtime.tokensPerKSloc === null ||
    typeof runtime.costPerKSloc !== "number" ||
    typeof runtime.tokensPerKSloc !== "number"
  ) {
    throw new Error(
      `Model profile ${configurationId} must publish cost and token rates`,
    );
  }

  return {
    configurationId,
    configurationName,
    configurationType: "model",
    costPerKSloc: requireFiniteNonNegative(
      runtime.costPerKSloc,
      "costPerKSloc",
    ),
    tokensPerKSloc: requireFiniteNonNegative(
      runtime.tokensPerKSloc,
      "tokensPerKSloc",
    ),
    secondsPerKSloc,
  };
}

function requireReference(
  reference: WebApplicationReference,
): WebApplicationReference {
  if (!reference?.id || !reference.name) {
    throw new Error("Web application reference is required");
  }
  requirePositiveFinite(reference.sloc, "application SLOC");
  return reference;
}

function perKSlocRate(total: number, context: string): number {
  return requireFiniteNonNegative(total, context) / JS10_KSLOC_DENOMINATOR;
}

function projectFiniteResource(
  ratePerKSloc: number,
  sloc: number,
  context: string,
): number {
  requireFiniteNonNegative(ratePerKSloc, `${context} rate`);
  requirePositiveFinite(sloc, `${context} application SLOC`);
  const product = ratePerKSloc * sloc;
  if (!Number.isFinite(product)) {
    throw new Error(`${context} projection overflowed to a non-finite value`);
  }
  const projected = product / 1000;
  return requireFiniteNonNegative(projected, context);
}

function validateTaskMatrix(
  configurations: ExplorerConfiguration[],
  tasks: ExplorerTaskObservation[],
): void {
  const configurationById = new Map(
    configurations.map((configuration) => [configuration.id, configuration]),
  );

  for (const task of tasks) {
    const configuration = configurationById.get(task.configurationId);
    if (!configuration) {
      throw new Error(`Unknown configurationId: ${task.configurationId}`);
    }
    if (task.configurationName !== configuration.name) {
      throw new Error(
        `Configuration name mismatch for ${task.configurationId}:${task.projectId}`,
      );
    }
    if (task.configurationType !== configuration.type) {
      throw new Error(
        `Configuration type mismatch for ${task.configurationId}:${task.projectId}`,
      );
    }
  }
}

export function deriveResourceProfiles(
  configurations: ExplorerConfiguration[],
  tasks: ExplorerTaskObservation[],
): ResourceProfile[] {
  validateTaskMatrix(configurations, tasks);

  return configurations.map((configuration) => {
    const configurationTasks = tasks.filter(
      ({ configurationId }) => configurationId === configuration.id,
    );
    const projectIds = new Set(
      configurationTasks.map(({ projectId }) => projectId),
    );
    if (projectIds.size !== REQUIRED_PROJECT_COUNT) {
      throw new Error(
        `Expected ${REQUIRED_PROJECT_COUNT} unique projects for ${configuration.id}, found ${projectIds.size}`,
      );
    }
    if (configurationTasks.length !== REQUIRED_PROJECT_COUNT) {
      throw new Error(
        `Expected ${REQUIRED_PROJECT_COUNT} task observations for ${configuration.id}, found ${configurationTasks.length}`,
      );
    }

    let totalCostUsd = 0;
    let totalTokens = 0;
    let totalDurationSeconds = 0;

    for (const task of configurationTasks) {
      totalDurationSeconds += requireFiniteNonNegative(
        task.durationMs / 1000,
        `${configuration.id}:${task.projectId} duration`,
      );
      if (configuration.type === "model") {
        if (task.costUsd === null) {
          throw new Error(
            `Missing model cost for ${configuration.id}:${task.projectId}`,
          );
        }
        totalCostUsd += requireFiniteNonNegative(
          task.costUsd,
          `${configuration.id}:${task.projectId} cost`,
        );
        totalTokens += requireFiniteNonNegative(
          task.tokens,
          `${configuration.id}:${task.projectId} tokens`,
        );
      } else if (task.costUsd !== null || task.tokens !== 0) {
        throw new Error(
          `Command configuration ${configuration.id} must not publish cost or token totals`,
        );
      }
    }

    if (configuration.type === "model") {
      return {
        configurationId: configuration.id,
        configurationName: configuration.name,
        configurationType: "model",
        costPerKSloc: perKSlocRate(
          totalCostUsd,
          `${configuration.id} cost total`,
        ),
        tokensPerKSloc: perKSlocRate(
          totalTokens,
          `${configuration.id} token total`,
        ),
        secondsPerKSloc: perKSlocRate(
          totalDurationSeconds,
          `${configuration.id} duration total`,
        ),
      };
    }

    return {
      configurationId: configuration.id,
      configurationName: configuration.name,
      configurationType: "command",
      costPerKSloc: null,
      tokensPerKSloc: null,
      secondsPerKSloc: perKSlocRate(
        totalDurationSeconds,
        `${configuration.id} duration total`,
      ),
    };
  });
}

export function projectResource(
  profile: ResourceProfile,
  reference: WebApplicationReference,
  metric: ResourceMetric,
): number | null {
  const validatedProfile = requireProfile(profile);
  const validatedReference = requireReference(reference);
  const validatedMetric = requireResourceMetric(metric);

  if (validatedMetric === "cost") {
    if (validatedProfile.configurationType === "command") {
      return null;
    }
    return projectFiniteResource(
      validatedProfile.costPerKSloc,
      validatedReference.sloc,
      `${validatedProfile.configurationId} cost`,
    );
  }

  if (validatedMetric === "tokens") {
    if (validatedProfile.configurationType === "command") {
      return null;
    }
    return projectFiniteResource(
      validatedProfile.tokensPerKSloc,
      validatedReference.sloc,
      `${validatedProfile.configurationId} tokens`,
    );
  }

  return projectFiniteResource(
    validatedProfile.secondsPerKSloc,
    validatedReference.sloc,
    `${validatedProfile.configurationId} duration`,
  );
}
