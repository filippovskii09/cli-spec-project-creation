import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { run } from "../src/index.js";
import { scaffoldProject } from "../src/scaffold.js";

test("creates a new project with documentation, agent instructions, and OpenSpec", async () => {
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
  assert.match(
    await readFile(join(destination, "docs", "02-domain.md"), "utf8"),
    /### Project Documentation/,
  );
  assert.match(await readFile(join(destination, "openspec", "config.yaml"), "utf8"), /schema:/);
  assert.match(await readFile(join(destination, "package.json"), "utf8"), /"name": "demo-project"/);
  assert.match(await readFile(join(destination, "CLAUDE.md"), "utf8"), /Project/);
  assert.match(await readFile(join(destination, "AGENTS.md"), "utf8"), /Project/);
});

test("uses a supplied directory name without prompting", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-cli-"));
  const destination = join(parent, "from-cli-project");

  await run([destination]);

  assert.match(await readFile(join(destination, "package.json"), "utf8"), /"name": "from-cli-project"/);
});

test("initializes the current directory without nesting another project folder", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-current-directory-"));
  const originalDirectory = process.cwd();

  try {
    process.chdir(destination);
    await run([".", "--name", "Current Directory"]);
  } finally {
    process.chdir(originalDirectory);
  }

  assert.match(await readFile(join(destination, "package.json"), "utf8"), /"name": "current-directory"/);
  await assert.rejects(readdir(join(destination, "current-directory")));
});

test("CLI flags initialize OpenSpec non-interactively", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-openspec-cli-"));
  const destination = join(parent, "from-cli");

  await run([destination, "--name", "From CLI", "--openspec"]);

  assert.match(await readFile(join(destination, "openspec", "config.yaml"), "utf8"), /schema:/);
});

test("refuses to overwrite a non-empty destination", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-existing-"));
  await writeFile(join(destination, "important.txt"), "keep me");

  await assert.rejects(
    scaffoldProject({
      projectName: "Demo Project",
      targetDirectory: destination,
      initializeOpenSpec: false,
    }),
    new Error(`Destination is not empty: ${destination}`),
  );
  assert.equal(await readFile(join(destination, "important.txt"), "utf8"), "keep me");
});
