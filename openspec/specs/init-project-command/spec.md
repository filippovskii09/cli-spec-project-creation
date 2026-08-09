# init-project-command

## Purpose

Define the `create-spec-project` contract for creating a project from repository templates and optionally initializing OpenSpec.

## Requirements

### Requirement: Command interface

The CLI SHALL expose the command as `create-spec-project <target>` and require exactly one positional `target` argument.

#### Scenario: Target argument is omitted

- **WHEN** `create-spec-project` is run without a target argument
- **THEN** the command writes an explanation of the error to standard error
- **AND** exits with a non-zero exit code
- **AND** does not write the success message

### Requirement: Target directory preflight

The CLI SHALL create a target directory that does not exist and SHALL use a target directory that already exists and is empty. A target directory containing any entry, including a hidden entry, SHALL be rejected during preflight before the CLI performs any directory creation, copy, or write operation. A preflight rejection SHALL not modify existing files or directories.

#### Scenario: Missing target is created and populated from templates

- **WHEN** the target directory does not exist
- **THEN** the CLI creates the target directory
- **AND** copies the complete contents of `templates/` into it with the same nested files and directories

#### Scenario: Existing empty target is used

- **WHEN** the target directory already exists and contains no entries
- **THEN** the CLI uses that directory as the scaffold destination
- **AND** copies the complete contents of `templates/` into it

#### Scenario: Non-empty target is detected before modification

- **WHEN** the target directory contains any entry, including a hidden entry
- **THEN** the CLI rejects the target during preflight
- **AND** does not perform directory creation, copying, or writing for that target

#### Scenario: Existing target entries are preserved after rejection

- **WHEN** the CLI rejects a non-empty target directory
- **THEN** every pre-existing entry and its contents remain unchanged

### Requirement: Template-driven scaffold contents

The `templates/` directory SHALL be the sole dynamic source for scaffold contents. The CLI SHALL copy every nested file and directory from `templates/` without using a hardcoded file list and without adding extra artifacts.

#### Scenario: Templates are copied exactly

- **WHEN** scaffolding succeeds
- **THEN** the generated project contains every nested file and directory from `templates/`
- **AND** the CLI adds no scaffold artifacts outside those copied from `templates/`

### Requirement: Interactive OpenSpec choice

After a successful read-only target preflight, the CLI SHALL ask exactly one `@clack/prompts` confirmation question about OpenSpec initialization. The confirmation SHALL default to No. It SHALL not ask for a project name, destination, or any further OpenSpec input.

#### Scenario: Default or No choice creates only the scaffold

- **WHEN** the user submits the default choice or selects No
- **THEN** the CLI scaffolds only the template-driven project
- **AND** does not execute OpenSpec

#### Scenario: Yes initializes OpenSpec after scaffolding

- **WHEN** the user selects Yes
- **THEN** the CLI successfully completes `scaffoldProject()` before invoking OpenSpec
- **AND** invokes `openspec init --tools none --no-animation --no-copilot-cloud` once with the generated absolute target as its working directory

#### Scenario: Cancellation leaves no target

- **WHEN** the user cancels the confirmation prompt
- **THEN** the CLI reports cancellation and exits with code `0`
- **AND** does not create a missing target, scaffold files, invoke OpenSpec, or write the success message

#### Scenario: Preflight rejection does not display a prompt

- **WHEN** the target is non-empty
- **THEN** the CLI rejects it before displaying the OpenSpec prompt

### Requirement: Process output, exit status, and integration errors

On successful scaffolding and optional OpenSpec initialization, the CLI SHALL exit with code `0` and write `✔ Project created successfully` to standard output. Prompt output may precede this message. On error, the CLI SHALL write a clear explanation to standard error, exit non-zero, and not write the success message.

#### Scenario: Successful scaffold reports success

- **WHEN** a project is scaffolded successfully
- **THEN** the command exits with code `0`
- **AND** standard output contains `✔ Project created successfully`
- **AND** standard error is empty

#### Scenario: Failed command reports an error without success output

- **WHEN** the command fails
- **THEN** standard error contains a clear explanation of the cause
- **AND** the command exits with a non-zero exit code
- **AND** standard output does not contain `✔ Project created successfully`

#### Scenario: OpenSpec initialization failure preserves the scaffold

- **WHEN** OpenSpec exits unsuccessfully after a successful scaffold
- **THEN** standard error contains `OpenSpec initialization failed:` and the underlying error context
- **AND** the CLI exits non-zero without writing the success message
- **AND** the generated scaffold remains in place without rollback

## Non-Goals

- Git initialization
- Package manager setup
- `package.json` generation
- Runtime stack generation
- Framework presets

Copy failures are not required to provide atomic rollback. The preservation requirement applies only to preflight rejection of a non-empty target; OpenSpec failures do not roll back a completed scaffold.
