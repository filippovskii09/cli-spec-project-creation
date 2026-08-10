# 01 — Vision

## Problem

Creating a new pet/project often starts chaotically:

* documentation is created manually;
* OpenSpec is initialized optionally;
* `CLAUDE.md` / `AGENTS.md` are created separately;
* structure differs between projects;
* AI receives inconsistent context and workflow.

## Vision

`create-spec-project` is a local CLI for quickly creating a consistent AI-native / spec-driven structure for a new project.

The CLI does not define the project's technology stack.

It creates a basic development framework from idea/discovery to implementation.

## Target User

The first user is the CLI author.

## Core Value

One command should remove repetitive new-project setup and provide a consistent starting structure for AI-assisted development.

After the positional target, the command offers one interactive choice: whether to initialize OpenSpec. The default choice is No.

## Non-Goals

V1 does not include:

* frontend/backend stack generation;
* a plugin system;
* presets;
* deployment;
* CI/CD;
* automatic business-requirement generation;
* complex configuration.
