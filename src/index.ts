#!/usr/bin/env node
import { parseArgs } from "node:util";
import { basename, resolve } from "node:path";
import { promptForProject } from "./prompts.js";
import { scaffoldProject } from "./scaffold.js";

export async function run(argv = process.argv.slice(2)): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      name: { type: "string", short: "n" },
      openspec: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log("Usage: create-spec-project [directory] [--name <name>] [--openspec]");
    return;
  }

  const directory = positionals[0] ?? ".";
  const projectName = values.name ?? (directory === "." ? undefined : basename(resolve(directory)));
  const answers = projectName
    ? { projectName, targetDirectory: directory, initializeOpenSpec: values.openspec }
    : await promptForProject(directory);
  const destination = await scaffoldProject(answers);
  console.log(`Created ${answers.projectName} in ${destination}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
