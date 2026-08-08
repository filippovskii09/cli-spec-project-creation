#!/usr/bin/env node
import { parseArgs } from "node:util";
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

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
