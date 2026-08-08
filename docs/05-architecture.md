# Architecture

`src/index.ts` owns CLI orchestration, `src/prompts.ts` gathers interactive input, and `src/scaffold.ts` validates and writes the project filesystem.

Templates are the single source of truth for generated documents and agent instruction files.

