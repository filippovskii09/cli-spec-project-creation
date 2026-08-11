# Requirements

- Expose `create-spec-project <target>` and accept exactly one positional target.
- Resolve the target to an absolute path. Create a missing destination, reuse an
  existing empty destination, and reject any non-empty destination before the
  prompt or filesystem changes.
- Copy the complete `templates/` tree without a hardcoded scaffold manifest or
  additional generated files.
- After preflight, ask exactly one question: `Initialize OpenSpec?`, defaulting
  to No. Cancellation exits successfully without creating a missing target.
- On No, create only the template scaffold.
- On Yes, finish scaffolding first, then run
  `openspec init --tools none --no-animation --no-copilot-cloud` once in the
  resolved destination. Discover `openspec` through `PATH`; do not bundle it.
- Report successful completion with `✔ Project created successfully`.
- Report CLI or OpenSpec failures on standard error with a non-zero exit code
  and no success message. An OpenSpec failure keeps the completed scaffold.
