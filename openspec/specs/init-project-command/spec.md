# init-project-command

## Purpose

Define the MVP contract for the `create-spec-project` command that scaffolds a project from the repository templates.

## Requirements

### Requirement: Command interface

The CLI SHALL expose the command as `create-spec-project <target>` and require exactly one positional `target` argument.

#### Scenario: Target argument is omitted

- **WHEN** `create-spec-project` is run without a target argument
- **THEN** the command writes an explanation of the error to standard error
- **AND** exits with a non-zero exit code
- **AND** does not write the success message

### Requirement: Target directory policy

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

### Requirement: Process output and exit status

On success, the CLI SHALL exit with code `0`, write exactly `✔ Project created successfully\n` to standard output, and write nothing to standard error. On error, the CLI SHALL write a clear explanation of the cause to standard error, exit with a non-zero exit code, and not write the success message. The exact error-message text is not part of this contract.

#### Scenario: Successful scaffold reports exact output

- **WHEN** a project is scaffolded successfully
- **THEN** the command exits with code `0`
- **AND** standard output is exactly `✔ Project created successfully\n`
- **AND** standard error is empty

#### Scenario: Failed command reports an error without success output

- **WHEN** the command fails
- **THEN** standard error contains a clear explanation of the cause
- **AND** the command exits with a non-zero exit code
- **AND** standard output does not contain `✔ Project created successfully`

## Non-Goals

- Interactive prompts
- OpenSpec initialization
- Git initialization
- Package manager setup
- `package.json` generation
- Runtime stack generation
- Framework presets
- External command execution

Copy failures are not required to provide atomic rollback. The preservation requirement applies only to preflight rejection of a non-empty target.
