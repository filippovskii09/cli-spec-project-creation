import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { scaffoldProject } from "../src/scaffold.js";

const execFile = promisify(execFileCallback);
const projectRoot = resolve(import.meta.dirname, "../..");
const templateDirectory = join(projectRoot, "templates");

type ManifestEntry = { type: "directory" | "file" | "symbolicLink"; contents?: string };

async function directoryManifest(directory: string): Promise<Map<string, ManifestEntry>> {
  const manifest = new Map<string, ManifestEntry>();

  async function visit(currentDirectory: string): Promise<void> {
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const path = join(currentDirectory, entry.name);
      const relativePath = relative(directory, path);

      if (entry.isDirectory()) {
        manifest.set(relativePath, { type: "directory" });
        await visit(path);
      } else if (entry.isFile()) {
        manifest.set(relativePath, { type: "file", contents: await readFile(path, "utf8") });
      } else if (entry.isSymbolicLink()) {
        manifest.set(relativePath, { type: "symbolicLink" });
      } else {
        const stats = await lstat(path);
        throw new Error(`Unsupported template entry: ${relativePath} (${stats.mode})`);
      }
    }
  }

  await visit(directory);
  return manifest;
}

async function assertMatchesTemplates(destination: string): Promise<void> {
  assert.deepEqual(await directoryManifest(destination), await directoryManifest(templateDirectory));
}

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

test("creates a new target from all spec templates", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-"));
  const destination = join(parent, "demo-project");

  await scaffoldProject(destination);

  await assertMatchesTemplates(destination);
  await assert.rejects(readdir(join(destination, "src")));
  await assert.rejects(readFile(join(destination, "package.json")));
});

test("uses an existing empty target", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-empty-"));

  await scaffoldProject(destination);

  assert.match(await readFile(join(destination, "docs", "02-domain.md"), "utf8"), /### Project Documentation/);
});

test("refuses a target with a hidden entry before writing and preserves it", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-existing-"));
  await writeFile(join(destination, ".important.txt"), "keep me");

  await assert.rejects(
    scaffoldProject(destination),
    new Error(`Destination is not empty: ${destination}`),
  );
  assert.equal(await readFile(join(destination, ".important.txt"), "utf8"), "keep me");
  assert.deepEqual(await readdir(destination), [".important.txt"]);
});

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
  await assertMatchesTemplates(join(consumerDirectory, "my-app"));
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
