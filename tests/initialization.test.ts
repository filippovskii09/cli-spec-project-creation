import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { run } from "../src/index.js";
import { initializeOpenSpec } from "../src/openspec.js";
import { promptForOpenSpec } from "../src/prompts.js";
import { preflightTarget } from "../src/scaffold.js";

test("prompt adapter returns Yes, No, and the default No response", async () => {
  const values = [true, false, false];

  for (const expected of values) {
    const actual = await promptForOpenSpec(async ({ initialValue }) => {
      assert.equal(initialValue, false);
      return expected;
    });

    assert.equal(actual, expected);
  }
});

test("cancelling the prompt skips scaffolding and success output", async () => {
  let scaffoldCalled = false;
  let successWritten = false;
  let cancellationWritten = false;

  await run(["unused-target"], {
    preflightTarget: async (target) => target,
    promptForOpenSpec: async () => null,
    scaffoldProject: async () => {
      scaffoldCalled = true;
      return "unused-target";
    },
    writeSuccess: () => {
      successWritten = true;
    },
    writeCancellation: () => {
      cancellationWritten = true;
    },
  });

  assert.equal(scaffoldCalled, false);
  assert.equal(successWritten, false);
  assert.equal(cancellationWritten, true);
});

test("a non-empty target is rejected before the prompt and remains unchanged", async () => {
  const destination = await mkdtemp(join(tmpdir(), "create-spec-project-preflight-"));
  const importantFile = join(destination, "important.txt");
  await writeFile(importantFile, "keep me");
  let promptCalled = false;

  await assert.rejects(
    run([destination], {
      promptForOpenSpec: async () => {
        promptCalled = true;
        return false;
      },
    }),
    new Error(`Destination is not empty: ${destination}`),
  );

  assert.equal(promptCalled, false);
  assert.equal(await readFile(importantFile, "utf8"), "keep me");
});

test("Yes scaffolds before initializing OpenSpec exactly once", async () => {
  const events: string[] = [];

  await run(["target"], {
    preflightTarget: async () => "absolute-target",
    promptForOpenSpec: async () => true,
    scaffoldProject: async (target) => {
      events.push(`scaffold:${target}`);
      return "generated-target";
    },
    initializeOpenSpec: async (target) => {
      events.push(`openspec:${target}`);
    },
    writeSuccess: () => events.push("success"),
  });

  assert.deepEqual(events, ["scaffold:absolute-target", "openspec:generated-target", "success"]);
});

test("No does not initialize OpenSpec", async () => {
  let initialized = false;

  await run(["target"], {
    preflightTarget: async () => "target",
    promptForOpenSpec: async () => false,
    scaffoldProject: async (target) => target,
    initializeOpenSpec: async () => {
      initialized = true;
    },
    writeSuccess: () => {},
  });

  assert.equal(initialized, false);
});

test("OpenSpec initializer invokes the expected command in the absolute target", async () => {
  const calls: Array<{ command: string; arguments_: string[]; cwd: string }> = [];
  const target = "relative-target";

  await initializeOpenSpec(target, async (command, arguments_, { cwd }) => {
    calls.push({ command, arguments_, cwd });
  });

  assert.deepEqual(calls, [{
    command: "openspec",
    arguments_: ["init", "--tools", "none", "--no-animation", "--no-copilot-cloud"],
    cwd: resolve(target),
  }]);
});

test("OpenSpec failures include a clear integration error", async () => {
  await assert.rejects(
    initializeOpenSpec("target", async () => {
      throw new Error("fake openspec failed");
    }),
    new Error("OpenSpec initialization failed: fake openspec failed"),
  );
});

test("an OpenSpec failure keeps the scaffold but skips success output", async () => {
  const parent = await mkdtemp(join(tmpdir(), "create-spec-project-openspec-failure-"));
  const destination = join(parent, "app");
  let successWritten = false;

  await assert.rejects(
    run([destination], {
      promptForOpenSpec: async () => true,
      initializeOpenSpec: async () => {
        throw new Error("OpenSpec initialization failed: fake openspec failed");
      },
      writeSuccess: () => {
        successWritten = true;
      },
    }),
    new Error("OpenSpec initialization failed: fake openspec failed"),
  );

  assert.equal(successWritten, false);
  assert.equal(await readFile(join(destination, "AGENTS.md"), "utf8"), await readFile(join(resolve(import.meta.dirname, "../../templates"), "AGENTS.md"), "utf8"));
});
