import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const templateDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../../templates");

export interface ScaffoldOptions {
  projectName: string;
  targetDirectory: string;
  initializeOpenSpec: boolean;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<string> {
  const projectName = options.projectName.trim();
  if (!projectName) {
    throw new Error("Project name is required.");
  }

  const destination = resolve(options.targetDirectory);
  const contents = await readdir(destination).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  if (contents.length > 0) {
    throw new Error(`Destination is not empty: ${destination}`);
  }

  await mkdir(destination, { recursive: true });
  await cp(join(templateDirectory, "docs"), join(destination, "docs"), { recursive: true });
  await cp(join(templateDirectory, "CLAUDE.md"), join(destination, "CLAUDE.md"));
  await cp(join(templateDirectory, "AGENTS.md"), join(destination, "AGENTS.md"));

  await mkdir(join(destination, "src"), { recursive: true });
  await mkdir(join(destination, "tests"), { recursive: true });
  await writeFile(
    join(destination, "package.json"),
    JSON.stringify({ name: toPackageName(projectName), private: true, version: "0.1.0" }, null, 2) + "\n",
  );

  return destination;
}

function toPackageName(projectName: string): string {
  return projectName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
}
