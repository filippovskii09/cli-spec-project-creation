#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { initializeOpenSpec } from "./openspec.js";
import { promptForOpenSpec } from "./prompts.js";
import { preflightTarget, scaffoldProject } from "./scaffold.js";

export interface InitializationDependencies {
  promptForOpenSpec: () => Promise<boolean | null>;
  preflightTarget: (target: string) => Promise<string>;
  scaffoldProject: (target: string) => Promise<string>;
  initializeOpenSpec: (target: string) => Promise<void>;
  writeSuccess: () => void;
  writeCancellation: () => void;
}

const defaultDependencies: InitializationDependencies = {
  promptForOpenSpec,
  preflightTarget,
  scaffoldProject,
  initializeOpenSpec,
  writeSuccess: () => console.log("✔ Project created successfully"),
  writeCancellation: () => console.log("Initialization cancelled"),
};

export async function run(
  argv = process.argv.slice(2),
  dependencies: Partial<InitializationDependencies> = {},
): Promise<void> {
  const resolvedDependencies = { ...defaultDependencies, ...dependencies };
  const { positionals } = parseArgs({
    args: argv,
    options: {},
    allowPositionals: true,
  });

  if (positionals.length !== 1) {
    throw new Error("Usage: create-spec-project <target>");
  }

  const destination = await resolvedDependencies.preflightTarget(positionals[0]);
  const useOpenSpec = await resolvedDependencies.promptForOpenSpec();

  if (useOpenSpec === null) {
    resolvedDependencies.writeCancellation();
    return;
  }

  const scaffoldedTarget = await resolvedDependencies.scaffoldProject(destination);

  if (useOpenSpec) {
    await resolvedDependencies.initializeOpenSpec(scaffoldedTarget);
  }

  resolvedDependencies.writeSuccess();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
