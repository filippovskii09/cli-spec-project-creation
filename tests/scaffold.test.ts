import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { run } from "../src/index.js";
import { scaffoldProject } from "../src/scaffold.js";

test("initializes documentation and optional OpenSpec workspace", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-"));
  const destination = join(parent, "demo-project");

  await scaffoldProject({
    projectName: "Demo Project",
    targetDirectory: destination,
    initializeOpenSpec: true,
  });

  assert.deepEqual((await readdir(join(destination, "docs"))).sort(), [
    "01-vision.md",
    "02-domain.md",
    "03-use-cases.md",
    "04-requirements.md",
    "05-architecture.md",
    "06-implementation-plan.md",
  ]);
  assert.equal(await readFile(join(destination, "openspec", "README.md"), "utf8"), "# Demo Project OpenSpec\n");
  assert.match(await readFile(join(destination, "package.json"), "utf8"), /"name": "demo-project"/);
});

test("CLI arguments initialize a project without prompts", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-cli-"));
  const destination = join(parent, "from-cli");

  await run([destination, "--name", "From CLI", "--openspec"]);

  assert.equal(await readFile(join(destination, "openspec", "README.md"), "utf8"), "# From CLI OpenSpec\n");
});
