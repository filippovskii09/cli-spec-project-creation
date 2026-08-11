# Architecture

`src/index.ts` owns CLI parsing and orchestration. The runtime sequence is:

1. require exactly one positional target;
2. run a read-only target preflight;
3. ask `Initialize OpenSpec?` once, defaulting to No;
4. stop without scaffolding when the prompt is cancelled;
5. copy the template scaffold;
6. initialize OpenSpec only after a Yes answer and successful scaffold;
7. print the success message only after every selected step succeeds.

`src/prompts.ts` owns the `@clack/prompts` confirmation and maps cancellation to
`null`. `src/scaffold.ts` owns both target preflight and filesystem writes; its
second preflight protects direct callers and changes between orchestration and
copy. `src/openspec.ts` is the only external-command boundary.

For the optional integration, `src/openspec.ts` uses `execa` to run
`openspec init --tools none --no-animation --no-copilot-cloud`. It runs the
command with the destination's resolved absolute filesystem path as `cwd`. The
`openspec` executable is discovered through `PATH`; this package neither
installs nor ships the OpenSpec CLI. OpenSpec failure is wrapped with
`OpenSpec initialization failed:`, happens after scaffolding, and does not roll
back the completed scaffold.

Templates are the single source of truth for generated documents and agent instruction files.
