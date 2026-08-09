import { execa } from "execa";
import { resolve } from "node:path";

export type OpenSpecExecutor = (
  command: string,
  arguments_: string[],
  options: { cwd: string },
) => Promise<unknown>;

export async function initializeOpenSpec(
  target: string,
  execute: OpenSpecExecutor = execa,
): Promise<void> {
  try {
    await execute("openspec", ["init", "--tools", "none", "--no-animation", "--no-copilot-cloud"], {
      cwd: resolve(target),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenSpec initialization failed: ${message}`);
  }
}
