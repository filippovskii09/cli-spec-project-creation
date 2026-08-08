import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export interface ProjectAnswers {
  projectName: string;
  targetDirectory: string;
  initializeOpenSpec: boolean;
}

export async function promptForProject(defaultDirectory = "."): Promise<ProjectAnswers> {
  const readline = createInterface({ input, output });

  try {
    const projectName = (await readline.question("Project name: ")).trim();
    const openSpecAnswer = (await readline.question("Initialize OpenSpec? (y/N): "))
      .trim()
      .toLowerCase();

    return {
      projectName,
      targetDirectory: defaultDirectory,
      initializeOpenSpec: openSpecAnswer === "y" || openSpecAnswer === "yes",
    };
  } finally {
    readline.close();
  }
}
