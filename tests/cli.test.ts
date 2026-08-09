import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

async function assertCliUsage(args: string[]): Promise<void> {
  await assert.rejects(
    execFile(process.execPath, ["dist/src/index.js", ...args]),
    (error: NodeJS.ErrnoException & { stderr: string }) => {
      assert.notEqual(error.code, 0);
      assert.match(error.stderr, /Usage: create-spec-project <target>/);
      return true;
    },
  );
}

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
});

test("CLI requires exactly one positional target", async () => {
  await assertCliUsage([]);
  await assertCliUsage(["first-project", "second-project"]);
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
