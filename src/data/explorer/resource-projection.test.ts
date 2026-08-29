import { describe, expect, it } from "vitest";
import { loadJs10ExplorerDataset } from "./js-1.0";
import type {
  ExplorerConfiguration,
  ExplorerTaskObservation,
} from "./schema";
import {
  deriveResourceProfiles,
  JS10_FIXTURE_SLOC,
  projectResource,
  resourceProjectionProvenance,
  type ResourceMetric,
  type ResourceProfile,
  webApplicationReferences,
} from "./resource-projection";

const SHARED_COUNTING_NOTE =
  "cloc 2.06 production application code; excludes tests, documentation, dependencies, generated output, fixtures, mocks, and build artifacts.";

const expectedProvenance = [
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
] as const;

const expectedModelRates = {
  "opus-4-6-high": {
    costPerKSloc: 1.0826994800693241,
    tokensPerKSloc: 579977.2963604853,
    secondsPerKSloc: 466.43916811091856,
  },
  "opus-4-6-medium": {
    costPerKSloc: 0.5438505199306759,
    tokensPerKSloc: 446912.6516464472,
    secondsPerKSloc: 236.7778162911612,
  },
  "opus-4-7-max": {
    costPerKSloc: 3.084065771230503,
    tokensPerKSloc: 831620.1039861352,
    secondsPerKSloc: 323.66308492201046,
  },
  "sonnet-4-6-high": {
    costPerKSloc: 1.1456719844020795,
    tokensPerKSloc: 643328.4228769498,
    secondsPerKSloc: 821.6689774696708,
  },
  "sonnet-4-6-medium": {
    costPerKSloc: 0.7450614211438474,
    tokensPerKSloc: 493864.4714038128,
    secondsPerKSloc: 514.021663778163,
  },
} as const;

function cloneTasks(tasks: ExplorerTaskObservation[]) {
  return tasks.map((task) => ({ ...task }));
}

describe("JS 1.0 resource projection", () => {
  it("preserves the measured denominator and pinned web-app references", () => {
    expect(JS10_FIXTURE_SLOC).toBe(1154);
    expect(webApplicationReferences.map(({ id, sloc }) => [id, sloc])).toEqual([
      ["mastodon", 170480],
      ["zulip", 326630],
      ["wordpress", 476469],
      ["discourse", 637925],
      ["mattermost", 795858],
    ]);
  });

  it("records repository provenance for every web-application reference", () => {
    expect(webApplicationReferences).toEqual(expectedProvenance);
  });

  it("centralizes the JS 1.0 release projection provenance", () => {
    expect(resourceProjectionProvenance).toEqual({
      releaseName: "Snyk VulnBench JS 1.0",
      datasetVersion: "1.0.0",
      resourceObservationSource: "benchmark-2026-05-20T23-06-29-348Z.jsonl",
      applicationMeasurementTool: "cloc 2.06",
      applicationMeasurementDate: "2026-08-29",
      exportFilePrefix: "js-1.0",
    });
  });

  it("derives exact release-wide rates for every model configuration", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const profiles = deriveResourceProfiles(
      dataset.configurations,
      dataset.tasks,
    );

    for (const [configurationId, expected] of Object.entries(
      expectedModelRates,
    )) {
      const profile = profiles.find(
        (candidate) => candidate.configurationId === configurationId,
      );
      expect(profile?.configurationType).toBe("model");
      if (profile?.configurationType !== "model") {
        continue;
      }
      expect(profile.costPerKSloc).toBeCloseTo(expected.costPerKSloc, 9);
      expect(profile.tokensPerKSloc).toBeCloseTo(expected.tokensPerKSloc, 9);
      expect(profile.secondsPerKSloc).toBeCloseTo(expected.secondsPerKSloc, 9);
    }
  });

  it("derives release-wide rates and projects exact application cost", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const profiles = deriveResourceProfiles(
      dataset.configurations,
      dataset.tasks,
    );
    const profile = profiles.find(({ configurationId }) =>
      configurationId === "opus-4-6-medium",
    );
    expect(profile?.configurationType).toBe("model");
    if (profile?.configurationType !== "model") {
      return;
    }
    expect(profile.costPerKSloc).toBeCloseTo(0.5438505199, 9);
    expect(
      projectResource(profile, webApplicationReferences[4]!, "cost"),
    ).toBeCloseTo(432.826, 2);
  });

  it("projects exact token and duration values for representative applications", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const profile = deriveResourceProfiles(
      dataset.configurations,
      dataset.tasks,
    ).find(({ configurationId }) => configurationId === "opus-4-6-medium");
    expect(profile?.configurationType).toBe("model");
    if (profile?.configurationType !== "model") {
      return;
    }

    const mattermost = webApplicationReferences[4]!;
    expect(projectResource(profile, mattermost, "tokens")).toBeCloseTo(
      355_679_009.114,
      2,
    );
    expect(projectResource(profile, mattermost, "duration")).toBeCloseTo(
      188_441.519,
      2,
    );

    const mastodon = webApplicationReferences[0]!;
    expect(projectResource(profile, mastodon, "tokens")).toBeCloseTo(
      76_189_668.853,
      2,
    );
    expect(projectResource(profile, mastodon, "duration")).toBeCloseTo(
      40_365.882,
      2,
    );
  });

  it("keeps command cost and tokens not applicable", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const snyk = deriveResourceProfiles(
      dataset.configurations,
      dataset.tasks,
    ).find(({ configurationId }) => configurationId === "snyk-code");
    expect(snyk?.configurationType).toBe("command");
    expect(snyk?.costPerKSloc).toBeNull();
    expect(snyk?.tokensPerKSloc).toBeNull();
    expect(snyk?.secondsPerKSloc).toBeCloseTo(127.886481802, 9);
  });

  it("returns null for command cost and token projections", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const snyk = deriveResourceProfiles(
      dataset.configurations,
      dataset.tasks,
    ).find(({ configurationId }) => configurationId === "snyk-code");
    expect(snyk).toBeDefined();

    for (const reference of webApplicationReferences) {
      expect(projectResource(snyk!, reference, "cost")).toBeNull();
      expect(projectResource(snyk!, reference, "tokens")).toBeNull();
      expect(projectResource(snyk!, reference, "duration")).toBeGreaterThan(0);
    }
  });

  it("rejects externally constructed command profiles that publish cost or token rates", () => {
    const invalidCommandProfile = {
      configurationId: "snyk-code",
      configurationName: "Snyk Code",
      configurationType: "command",
      costPerKSloc: 1,
      tokensPerKSloc: 2,
      secondsPerKSloc: 3,
    } as unknown as ResourceProfile;

    expect(() =>
      projectResource(
        invalidCommandProfile,
        webApplicationReferences[0]!,
        "cost",
      ),
    ).toThrow(/must not publish cost or token rates/);
    expect(() =>
      projectResource(
        invalidCommandProfile,
        webApplicationReferences[0]!,
        "tokens",
      ),
    ).toThrow(/must not publish cost or token rates/);
  });

  it("rejects unknown configuration IDs in the task matrix", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const tasks = cloneTasks(dataset.tasks);
    tasks[0] = { ...tasks[0]!, configurationId: "missing-configuration" };

    expect(() =>
      deriveResourceProfiles(dataset.configurations, tasks),
    ).toThrow(/Unknown configurationId: missing-configuration/);
  });

  it("rejects configuration name mismatches against declared configurations", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const tasks = cloneTasks(dataset.tasks);
    tasks[0] = {
      ...tasks[0]!,
      configurationName: "Renamed configuration",
    };

    expect(() =>
      deriveResourceProfiles(dataset.configurations, tasks),
    ).toThrow(/Configuration name mismatch/);
  });

  it("rejects configuration type mismatches against declared configurations", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const tasks = cloneTasks(dataset.tasks);
    tasks[0] = {
      ...tasks[0]!,
      configurationType: "command",
    };

    expect(() =>
      deriveResourceProfiles(dataset.configurations, tasks),
    ).toThrow(/Configuration type mismatch/);
  });

  it("rejects incomplete and duplicate project coverage per configuration", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const configurations = dataset.configurations.slice(0, 1);
    const configurationId = configurations[0]!.id;
    const completeTasks = dataset.tasks.filter(
      (task) => task.configurationId === configurationId,
    );
    const missingProjectTasks = completeTasks.slice(0, 9);
    const duplicateProjectTasks = [
      ...completeTasks,
      { ...completeTasks[0]! },
    ];

    expect(() =>
      deriveResourceProfiles(configurations, missingProjectTasks),
    ).toThrow(/Expected 10 unique projects/);
    expect(() =>
      deriveResourceProfiles(configurations, duplicateProjectTasks),
    ).toThrow(/Expected 10 task observations/);
  });

  it("rejects missing model cost and command token totals", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const modelTasks = cloneTasks(
      dataset.tasks.filter(
        ({ configurationId }) => configurationId === "opus-4-6-medium",
      ),
    );
    modelTasks[0] = { ...modelTasks[0]!, costUsd: null };

    expect(() =>
      deriveResourceProfiles(
        dataset.configurations.filter(
          ({ id }) => id === "opus-4-6-medium",
        ),
        modelTasks,
      ),
    ).toThrow(/Missing model cost/);

    const commandTasks = cloneTasks(
      dataset.tasks.filter(({ configurationId }) => configurationId === "snyk-code"),
    );
    commandTasks[0] = { ...commandTasks[0]!, tokens: 42 };

    expect(() =>
      deriveResourceProfiles(
        dataset.configurations.filter(({ id }) => id === "snyk-code"),
        commandTasks,
      ),
    ).toThrow(/must not publish cost or token totals/);
  });

  it("rejects non-finite and negative task resources", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const configurations: ExplorerConfiguration[] = [
      dataset.configurations.find(({ id }) => id === "opus-4-6-medium")!,
    ];
    const baseTasks = dataset.tasks.filter(
      ({ configurationId }) => configurationId === "opus-4-6-medium",
    );

    const negativeCostTasks = cloneTasks(baseTasks);
    negativeCostTasks[0] = { ...negativeCostTasks[0]!, costUsd: -1 };
    expect(() =>
      deriveResourceProfiles(configurations, negativeCostTasks),
    ).toThrow(/cost must be a finite non-negative number/);

    const infiniteTokenTasks = cloneTasks(baseTasks);
    infiniteTokenTasks[0] = {
      ...infiniteTokenTasks[0]!,
      tokens: Number.POSITIVE_INFINITY,
    };
    expect(() =>
      deriveResourceProfiles(configurations, infiniteTokenTasks),
    ).toThrow(/tokens must be a finite non-negative number/);

    const negativeDurationTasks = cloneTasks(baseTasks);
    negativeDurationTasks[0] = {
      ...negativeDurationTasks[0]!,
      durationMs: -1000,
    };
    expect(() =>
      deriveResourceProfiles(configurations, negativeDurationTasks),
    ).toThrow(/duration must be a finite non-negative number/);
  });

  it("rejects overflow and non-finite projection results", () => {
    const overflowProfile: ResourceProfile = {
      configurationId: "overflow-model",
      configurationName: "Overflow Model",
      configurationType: "model",
      costPerKSloc: Number.MAX_VALUE,
      tokensPerKSloc: 1,
      secondsPerKSloc: 1,
    };

    expect(() =>
      projectResource(
        overflowProfile,
        webApplicationReferences[4]!,
        "cost",
      ),
    ).toThrow(/overflowed to a non-finite value/);
  });

  it("rejects invalid projection inputs", async () => {
    const dataset = await loadJs10ExplorerDataset();
    const profile = deriveResourceProfiles(
      dataset.configurations,
      dataset.tasks,
    ).find(({ configurationId }) => configurationId === "opus-4-6-medium")!;

    expect(() =>
      projectResource(
        profile,
        webApplicationReferences[0]!,
        "wat" as ResourceMetric,
      ),
    ).toThrow(/Unknown resource metric/);

    expect(() =>
      projectResource(
        profile,
        { ...webApplicationReferences[0]!, sloc: -1 },
        "cost",
      ),
    ).toThrow(/application SLOC must be a finite positive number/);

    expect(() =>
      projectResource(
        {
          ...profile,
          configurationType: "model",
          costPerKSloc: null,
          tokensPerKSloc: null,
        } as unknown as ResourceProfile,
        webApplicationReferences[0]!,
        "cost",
      ),
    ).toThrow(/must publish cost and token rates/);
  });
});
