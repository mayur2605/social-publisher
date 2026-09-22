# GitHub Spec Kit installation and alignment record

Installed 2026-09-22 · Official source: [github/spec-kit v1.0.9](https://github.com/github/spec-kit/tree/v1.0.9)

## Installed state

Spec Kit is now initialized for **Codex** in this repository. The previous audit correctly recorded absent tooling; the user subsequently requested installation. The existing PRD, constitution, feature specification, plan, and tasks were preserved rather than regenerated.

| Component             | Verified result                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Specify CLI           | 1.0.9, installed persistently from official GitHub tag `v1.0.9`                                     |
| Source revision       | `3b895d16bd55a0cdaad16d086ffc6b10eef34614`                                                          |
| Package environment   | uv-managed isolated tool environment; Python 3.14.7 on this machine                                 |
| uv                    | 0.12.15 installed through Homebrew                                                                  |
| Shell access          | uv tool directory added through `uv tool update-shell`; new zsh sessions can find `specify`         |
| Codex integration     | Default integration `codex`, ten skills under `.agents/skills/`                                     |
| Shared infrastructure | Bash scripts, templates, integration manifests and bundled SDD workflow under `.specify/`           |
| Integration check     | `status: ok`; zero missing/modified managed files, invalid paths, or unchecked manifests            |
| Feature selection     | `specs/001-social-publisher`, persisted locally by the supplied prerequisite script                 |
| Artifact check        | Existing spec, plan and tasks found; constitution and feature artifacts preserved by initialization |
| Workflow registration | Bundled Full SDD Cycle `speckit` v1.0.1 listed; not executed                                        |

The CLI lives in the user's tool environment, not `node_modules` or the application Docker images. Committing the project integration files does not install the executable on another machine. No app dependencies, source, migrations, provider credentials, or publishing state were changed by this installation.

## Installed commands and use

Start or reopen Codex with this repository as the project so it discovers the local skills. The installed skill files include `$speckit-constitution`, `$speckit-specify`, `$speckit-clarify`, `$speckit-plan`, `$speckit-checklist`, `$speckit-tasks`, `$speckit-analyze`, `$speckit-implement`, `$speckit-converge`, and `$speckit-taskstoissues`. These are agent skills, not shell executables. `taskstoissues` has not been run and no issues were created.

Use a bounded next feature or a review of the existing artifacts; do not overwrite the existing app-wide requirements with generated defaults. Read each skill's prerequisites before running it. Existing artifacts were authored manually, so installation alone does not mean generation-specific prerequisites or a Converged verdict have been satisfied.

Useful terminal checks:

```sh
specify version
specify integration status --json
specify workflow list
.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks
```

The last command uses the current local feature pointer. To select the existing feature in a new clone, use the supplied script with its explicit override:

```sh
SPECIFY_FEATURE_DIRECTORY=specs/001-social-publisher \
  .specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks
```

This records `.specify/feature.json` for that checkout. The tool's own `.specify/.gitignore` excludes this machine-local pointer; it is intentionally not shared in Git. Branch switching alone does not select a feature.

## Reproduce installation on another machine

Prerequisites are Python 3.11+, uv, and the selected coding agent. Install uv using its supported installer/package manager if it is not present, then pin the same source release:

```sh
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.0.9
uv tool update-shell
```

Open a new shell if necessary. In an already cloned initialized project, run the status/prerequisite checks above; do not rerun initialization just to select a feature. For a new adoption without the shared files, the command used here was:

```sh
specify init --here --force --non-interactive --integration codex --script sh
```

Initialization can replace conflicting managed paths. Save a reviewable baseline and review the generated diff. This run used a clean committed baseline `92baf94` plus an ignored local backup, and the tool explicitly preserved the existing constitution. Byte comparisons confirmed all original planning documents were unchanged before the installation status updates.

## Artifact alignment

| Concern             | Repository artifact                                                                | State                                                          |
| ------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Principles          | [constitution](../.specify/memory/constitution.md)                                 | Preserved project rules                                        |
| Requirements        | [spec](../specs/001-social-publisher/spec.md), PRD                                 | Existing user stories and acceptance                           |
| Plan/research/model | [plan](../specs/001-social-publisher/plan.md), technical spec, roadmap decisions   | Existing shared architecture documents                         |
| Contracts/design    | [OpenAPI](api/openapi.json), product design specification                          | Linked from the implementation plan                            |
| Quality checklist   | [requirements checklist](../specs/001-social-publisher/checklists/requirements.md) | Manual review; unresolved choices remain visible               |
| Tasks               | [task register](../specs/001-social-publisher/tasks.md)                            | T043 records installation; other completion states retained    |
| Analysis/acceptance | [documentation audit](documentation-audit.md), release report                      | Prior manual review, not an executed Spec Kit convergence pass |

`AVAILABLE_DOCS` reports optional feature-local files, so it currently lists `tasks.md`; data model/contracts/research remain linked through the existing plan rather than copied into separate generated feature files.

## Maintenance and scope

Generated skills/scripts/templates are vendor-managed; avoid formatting or rewriting them casually because integration manifests verify hashes. The app's constitution and feature documents remain project-owned. `.agents/.gitignore` permits shared skills while excluding other local agent state. Upstream licensing is retained in `.specify/LICENSE.spec-kit`.

Review/pin CLI upgrades and generated diffs together. Run integration status and artifact checks afterward, and update the version record. Follow the official [installation guide](https://github.github.io/spec-kit/installation.html) and [existing-project guidance](https://github.github.io/spec-kit/guides/existing-projects.html). Invocation/layout details are in the [integration reference](https://github.github.io/spec-kit/reference/integrations.html).

Installation is complete. No feature implementation, automatic issue creation, deployment, publishing, or formal convergence workflow was triggered. Production acceptance remains governed by the outstanding tests, approvals, and business decisions in the release report.
