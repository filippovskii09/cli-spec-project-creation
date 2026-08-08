#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { scaffoldProject } from "./scaffold.js";

export async function run(argv = process.argv.slice(2)): Promise<void> {
  const { positionals } = parseArgs({
    args: argv,
    options: {},
    allowPositionals: true,
  });

  if (positionals.length !== 1) {
    throw new Error("Usage: create-spec-project <target>");
  }

  await scaffoldProject(positionals[0]);
  console.log("✔ Project created successfully");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
