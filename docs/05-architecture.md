# Architecture

`src/index.ts` owns CLI orchestration: positional parsing, read-only target preflight, the single OpenSpec confirmation, scaffolding, optional integration, and success output. `src/prompts.ts` gathers the confirmation, `src/scaffold.ts` owns preflight and filesystem writes, and `src/openspec.ts` is the only external-command boundary.

Templates are the single source of truth for generated documents and agent instruction files.
