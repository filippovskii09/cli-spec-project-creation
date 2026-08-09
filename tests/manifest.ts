import { lstat, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export type ManifestEntry = {
  type: "directory" | "file" | "symbolicLink";
  contents?: string;
};

export async function directoryManifest(directory: string): Promise<Map<string, ManifestEntry>> {
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
        throw new Error(`Unsupported manifest entry: ${relativePath} (${stats.mode})`);
      }
    }
  }

  await visit(directory);
  return manifest;
}
