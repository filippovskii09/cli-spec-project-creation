import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { scaffoldProject } from "../src/scaffold.js";

const execFile = promisify(execFileCallback);
const templateFiles = [
  "AGENTS.md",
  "CLAUDE.md",
  "docs/01-vision.md",
  "docs/02-domain.md",
  "docs/03-use-cases.md",
  "docs/04-requirements.md",
  "docs/05-architecture.md",
  "docs/06-implementation-plan.md",
];

test("creates a new target from all spec templates", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-"));
  const destination = join(parent, "demo-project");

  await scaffoldProject(destination);

  for (const file of templateFiles) {
    assert.equal(await readFile(join(destination, file), "utf8"), await readFile(join("templates", file), "utf8"));
  }
  await assert.rejects(readdir(join(destination, "src")));
  await assert.rejects(readFile(join(destination, "package.json")));
});

test("uses an existing empty target", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-empty-"));

  await scaffoldProject(destination);

  assert.match(await readFile(join(destination, "docs", "02-domain.md"), "utf8"), /### Project Documentation/);
});

test("refuses a non-empty target before writing and preserves its files", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-existing-"));
  await writeFile(join(destination, "important.txt"), "keep me");

  await assert.rejects(
    scaffoldProject(destination),
    new Error(`Destination is not empty: ${destination}`),
  );
  assert.equal(await readFile(join(destination, "important.txt"), "utf8"), "keep me");
  assert.deepEqual(await readdir(destination), ["important.txt"]);
});

test("CLI accepts a positional target and reports success without prompts", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-cli-"));
  const destination = join(parent, "from-cli-project");
  const result = await execFile(process.execPath, ["dist/src/index.js", destination]);

  assert.equal(result.stdout, "✔ Project created successfully\n");
  assert.equal(result.stderr, "");
  assert.match(await readFile(join(destination, "CLAUDE.md"), "utf8"), /Project/);
});

test("CLI writes errors to stderr and exits non-zero", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-cli-error-"));
  await writeFile(join(destination, "important.txt"), "keep me");

  await assert.rejects(
    execFile(process.execPath, ["dist/src/index.js", destination]),
    (error: NodeJS.ErrnoException & { stderr: string }) => {
      assert.notEqual(error.code, 0);
      assert.match(error.stderr, /Destination is not empty/);
      return true;
    },
  );
  assert.equal(await readFile(join(destination, "important.txt"), "utf8"), "keep me");
});

test("CLI requires exactly one positional target", async () => {
  await assert.rejects(
    execFile(process.execPath, ["dist/src/index.js"]),
    (error: NodeJS.ErrnoException & { stderr: string }) => {
      assert.notEqual(error.code, 0);
      assert.match(error.stderr, /Usage: create-spec-project <target>/);
      return true;
    },
  );
});

test("CLI rejects removed options", async () => {
  await assert.rejects(
    execFile(process.execPath, ["dist/src/index.js", "--openspec", "project"]),
    (error: NodeJS.ErrnoException & { stderr: string }) => {
      assert.notEqual(error.code, 0);
      assert.match(error.stderr, /Unknown option '--openspec'/);
      return true;
    },
  );
});
