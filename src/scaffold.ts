import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const templateDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../../templates");

export async function preflightTarget(targetDirectory: string): Promise<string> {
  const destination = resolve(targetDirectory);
  let contents: string[] | undefined;

  try {
    contents = await readdir(destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  if (contents && contents.length > 0) {
    throw new Error(`Destination is not empty: ${destination}`);
  }

  return destination;
}

export async function scaffoldProject(targetDirectory: string): Promise<string> {
  const destination = await preflightTarget(targetDirectory);
  let contents: string[] | undefined;

  try {
    contents = await readdir(destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  if (!contents) {
    await mkdir(destination, { recursive: true });
  }

  await cp(templateDirectory, destination, { recursive: true });

  return destination;
}
