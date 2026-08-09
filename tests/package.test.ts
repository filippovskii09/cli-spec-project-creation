import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { directoryManifest } from "./manifest.js";

const execFile = promisify(execFileCallback);
const projectRoot = resolve(import.meta.dirname, "../..");
const templateDirectory = join(projectRoot, "templates");

test("installed package bin scaffolds the exact packaged template tree", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "create-spec-project-package-"));
  const packageDirectory = join(temporaryDirectory, "package");
  const cacheDirectory = join(temporaryDirectory, "cache");
  const consumerDirectory = join(temporaryDirectory, "consumer");
  const npmCli = process.env.npm_execpath;

  assert.ok(npmCli, "npm test must provide the current npm CLI path");
  await Promise.all([mkdir(packageDirectory), mkdir(consumerDirectory)]);
  const packed = await execFile(process.execPath, [npmCli, "pack", "--json", "--ignore-scripts", "--cache", cacheDirectory, "--pack-destination", packageDirectory], {
    cwd: projectRoot,
  });
  const [{ filename }] = JSON.parse(packed.stdout) as Array<{ filename: string }>;

  await execFile(process.execPath, [npmCli, "install", "--offline", "--ignore-scripts", "--omit=dev", "--no-save", "--no-package-lock", "--cache", cacheDirectory, join(packageDirectory, filename)], {
    cwd: consumerDirectory,
  });

  const result = await execFile(join(consumerDirectory, "node_modules", ".bin", "create-spec-project"), ["my-app"], {
    cwd: consumerDirectory,
  });

  assert.equal(result.stdout, "✔ Project created successfully\n");
  assert.equal(result.stderr, "");
  assert.deepEqual(
    await directoryManifest(join(consumerDirectory, "my-app")),
    await directoryManifest(templateDirectory),
  );
});
