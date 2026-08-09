# Agent instructions

- Use the templates in `templates/` instead of duplicating generated content in code.
- Keep CLI parsing in `src/index.ts`, questions in `src/prompts.ts`, and filesystem work in `src/scaffold.ts`.
- Add or update tests for observable scaffolding behavior.
- For a direct `git push`, do not check `gh` authentication or alter `gh` credentials; Git may use separate credentials.
