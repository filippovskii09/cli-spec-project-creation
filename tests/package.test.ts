import assert from "node:assert/strict";
import { execFile as execFileCallback, spawn } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { directoryManifest } from "./manifest.js";

const execFile = promisify(execFileCallback);
const projectRoot = resolve(import.meta.dirname, "../..");
const templateDirectory = join(projectRoot, "templates");

async function runCli(
  command: string,
  args: string[],
  cwd: string,
  input: string,
  environment: NodeJS.ProcessEnv = {},
): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...environment },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (exitCode) => resolveRun({ exitCode, stdout, stderr }));
    child.stdin.end(input);
  });
}

test("installed package supports interactive No, Yes, and cancellation", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "create-spec-project-package-"));
  const packageDirectory = join(temporaryDirectory, "package");
  const consumerDirectory = join(temporaryDirectory, "consumer");
  const executableDirectory = join(temporaryDirectory, "bin");
  const fakeOpenSpecLog = join(temporaryDirectory, "openspec.log");
  const npmCli = process.env.npm_execpath;

  assert.ok(npmCli, "npm test must provide the current npm CLI path");
  await Promise.all([mkdir(packageDirectory), mkdir(consumerDirectory), mkdir(executableDirectory)]);
  const packed = await execFile(process.execPath, [npmCli, "pack", "--json", "--ignore-scripts", "--pack-destination", packageDirectory], {
    cwd: projectRoot,
  });
  const [{ filename }] = JSON.parse(packed.stdout) as Array<{ filename: string }>;

  await execFile(process.execPath, [npmCli, "install", "--offline", "--ignore-scripts", "--omit=dev", "--no-save", "--no-package-lock", join(packageDirectory, filename)], {
    cwd: consumerDirectory,
  });

  const fakeOpenSpec = join(executableDirectory, "openspec");
  await writeFile(fakeOpenSpec, `#!/bin/sh\nmkdir -p .fake-openspec\nprintf '%s\\n' \"$PWD\" >> \"$OPEN_SPEC_LOG\"\n`);
  await chmod(fakeOpenSpec, 0o755);

  const command = join(consumerDirectory, "node_modules", ".bin", "create-spec-project");
  const no = await runCli(command, ["no-app"], consumerDirectory, "\r");
  assert.equal(no.exitCode, 0);
  assert.match(no.stdout, /Project created successfully/);
  assert.equal(no.stderr, "");
  assert.deepEqual(
    await directoryManifest(join(consumerDirectory, "no-app")),
    await directoryManifest(templateDirectory),
  );

  const yes = await runCli(command, ["yes-app"], consumerDirectory, "y\r", {
    PATH: `${executableDirectory}:${process.env.PATH}`,
    OPEN_SPEC_LOG: fakeOpenSpecLog,
  });
  assert.equal(yes.exitCode, 0);
  assert.match(yes.stdout, /Project created successfully/);
  assert.equal(yes.stderr, "");
  assert.deepEqual(
    await directoryManifest(join(consumerDirectory, "yes-app")),
    new Map([
      ...(await directoryManifest(templateDirectory)),
      [".fake-openspec", { type: "directory" }],
    ]),
  );
  assert.equal(await readFile(fakeOpenSpecLog, "utf8"), `${await realpath(join(consumerDirectory, "yes-app"))}\n`);

  await writeFile(fakeOpenSpec, "#!/bin/sh\necho fake openspec failed >&2\nexit 1\n");
  const failure = await runCli(command, ["failure-app"], consumerDirectory, "y\r", {
    PATH: `${executableDirectory}:${process.env.PATH}`,
  });
  assert.notEqual(failure.exitCode, 0);
  assert.match(failure.stderr, /OpenSpec initialization failed:/);
  assert.match(failure.stderr, /fake openspec failed/);
  assert.doesNotMatch(failure.stdout, /Project created successfully/);
  assert.deepEqual(
    await directoryManifest(join(consumerDirectory, "failure-app")),
    await directoryManifest(templateDirectory),
  );

  const cancelled = await runCli(command, ["cancelled-app"], consumerDirectory, "\u0003");
  assert.equal(cancelled.exitCode, 0);
  assert.match(cancelled.stdout, /Initialization cancelled/);
  await assert.rejects(directoryManifest(join(consumerDirectory, "cancelled-app")), { code: "ENOENT" });
});
