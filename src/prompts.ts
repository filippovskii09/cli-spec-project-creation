import { confirm, isCancel } from "@clack/prompts";

export type ConfirmPrompt = (options: {
  message: string;
  initialValue: boolean;
}) => Promise<boolean | symbol>;

export async function promptForOpenSpec(prompt: ConfirmPrompt = confirm): Promise<boolean | null> {
  const answer = await prompt({
    message: "Initialize OpenSpec?",
    initialValue: false,
  });

  return isCancel(answer) ? null : answer;
}
