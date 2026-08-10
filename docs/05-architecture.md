# Architecture

`src/index.ts` owns CLI orchestration: positional parsing, read-only target preflight, the single OpenSpec confirmation, scaffolding, optional integration, and success output. `src/prompts.ts` gathers the confirmation, `src/scaffold.ts` owns preflight and filesystem writes, and `src/openspec.ts` is the only external-command boundary.

For the optional integration, `src/openspec.ts` uses `execa` to run `openspec init --tools none --no-animation --no-copilot-cloud`. It runs the command with the destination's resolved absolute filesystem path as `cwd`. The `openspec` executable is discovered through `PATH`; this package neither installs nor ships the OpenSpec CLI. OpenSpec failure happens after scaffolding and does not roll back the completed scaffold.

Templates are the single source of truth for generated documents and agent instruction files.
