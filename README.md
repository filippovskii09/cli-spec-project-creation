# create-spec-project

## Purpose

`create-spec-project` is a local CLI for creating a consistent AI-native, spec-driven project scaffold from this repository's `templates/` directory.

## Prerequisites

- Node.js and npm
- OpenSpec only if you choose to initialize it during project creation

## Local setup

```bash
npm install
npm run build
```

## Usage

```bash
npm start -- <target>
```

`target` is the positional path supplied by the user. Internally, the CLI resolves it to an absolute destination path.

- A missing target is created and populated with the scaffold from `templates/`.
- An existing empty target is populated with that scaffold.
- A non-empty target, including one containing hidden entries, is rejected before the prompt or filesystem changes.
- After preflight, the CLI asks exactly one question: `Initialize OpenSpec?` The default is No. Cancelling the prompt leaves a missing target uncreated.

## Optional OpenSpec setup

Selecting Yes requires the `openspec` executable to be available through `PATH`. This package does not install or ship OpenSpec. Install it separately with Node.js 20.19 or later:

```bash
npm install -g @fission-ai/openspec@latest
openspec --version
```

See the official [OpenSpec installation instructions](https://openspec.dev/docs/installation).

If OpenSpec is unavailable or its initialization command fails, the CLI exits non-zero and does not print the success message. The completed scaffold remains in place.

## Development verification

```bash
npm test
```
