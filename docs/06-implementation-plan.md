# Implementation plan

1. Initialize the Node.js TypeScript package.
2. Implement positional CLI parsing and read-only destination preflight.
3. Implement template-driven scaffolding with its own repeated preflight guard.
4. Ask once whether to initialize OpenSpec (default No), then run it only after a successful scaffold.
5. Cover No, Yes, cancellation, preflight failure, integration failure, and installed-package stdin flows with tests.
