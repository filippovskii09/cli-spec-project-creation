import assert from "node:assert/strict";
import { lstat, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { scaffoldProject } from "../src/scaffold.js";
import { directoryManifest } from "./manifest.js";

const projectRoot = resolve(import.meta.dirname, "../..");
const templateDirectory = join(projectRoot, "templates");

async function assertMatchesTemplates(destination: string): Promise<void> {
  assert.deepEqual(await directoryManifest(destination), await directoryManifest(templateDirectory));
}

test("creates a missing target as an exact template copy", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-"));
  const destination = join(parent, "demo-project");

  await assert.rejects(lstat(destination), { code: "ENOENT" });

  await scaffoldProject(destination);

  await assertMatchesTemplates(destination);
});

test("uses an existing empty target as an exact template copy", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-empty-"));

  assert.deepEqual(await directoryManifest(destination), new Map());

  await scaffoldProject(destination);

  await assertMatchesTemplates(destination);
});

test("refuses a non-empty target without changing its manifest", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-existing-"));
  await writeFile(join(destination, ".important.txt"), "keep me");
  await mkdir(join(destination, "nested", "deeper"), { recursive: true });
  await writeFile(join(destination, "nested", "deeper", "notes.txt"), "preserve this too");
  const manifestBefore = await directoryManifest(destination);

  await assert.rejects(
    scaffoldProject(destination),
    new Error(`Destination is not empty: ${destination}`),
  );

  assert.deepEqual(await directoryManifest(destination), manifestBefore);
});
