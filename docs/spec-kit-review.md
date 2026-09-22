# GitHub Spec Kit alignment review

Reviewed 2026-09-22 against the official [repository](https://github.com/github/spec-kit), [existing-project guide](https://github.github.io/spec-kit/guides/existing-projects.html), [quickstart](https://github.github.io/spec-kit/quickstart.html), and [integration reference](https://github.github.io/spec-kit/reference/integrations.html).

## Finding

This repository has manually authored Spec Kit-style documents. It is **not an initialized or operational Specify CLI project**. Neither `specify` nor `uv` was found on this session's PATH. There are no generated agent skills, templates/scripts, integration manifests, or active-feature metadata in the repository. The presence of `.specify/memory/constitution.md` alone does not prove tooling installation or a completed convergence run.

## Workflow and artifact mapping

The current official workflow separates constitution, specification, planning, tasks, implementation, and convergence; optional clarification, checklists, and analysis help validate consistency. A requirements checklist evaluates clarity/coverage, not delivered code. The project artifacts map as follows:

| Concern                 | Repository artifact                                                                 | Assessment                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Project principles      | [constitution](../.specify/memory/constitution.md)                                  | Present; tied to agreed product and existing architecture               |
| User outcome/acceptance | [spec](../specs/001-social-publisher/spec.md) and PRD                               | Present; app-wide baseline, not proof of all acceptance                 |
| Technical plan/research | [plan](../specs/001-social-publisher/plan.md), technical spec and roadmap decisions | Present; supporting design/security/dependency docs linked              |
| Data model/contracts    | Technical specification, migrations, [OpenAPI](api/openapi.json)                    | Present in shared docs rather than duplicated generated feature files   |
| Setup/quickstart        | Root README, provider and deployment runbooks                                       | Present; external credentials still required                            |
| Requirement quality     | [requirements checklist](../specs/001-social-publisher/checklists/requirements.md)  | Manual review; unresolved behavioral/business choices remain open       |
| Task decomposition      | [tasks](../specs/001-social-publisher/tasks.md)                                     | Present; checked items distinguish local implementation from acceptance |
| Analysis/convergence    | [documentation audit](documentation-audit.md), acceptance report                    | Manual gap analysis; no official command run or Converged verdict       |
| Agent/CLI integration   | None                                                                                | Not installed; no commands claimed callable                             |

## Adoption path if tooling is added

The official existing-project guidance supports adopting a bounded next change without rebuilding the existing application. Preserve and commit the baseline, use an adoption branch, install a reviewed/pinned CLI, initialize in place with the selected integration, and review managed-file conflicts before accepting them. `--force` initialization can replace conflicting generated paths, including ones near this manually maintained content. Do not overwrite the constitution/spec/tasks blindly.

The integration reference currently identifies `codex` as the CLI integration key, with skills under `.agents/skills` and `$speckit-...` invocation. Setup commands belong in the terminal; feature workflows are invoked in the agent. Confirm the installed version's help and generated layout before running them. This review does not install those capabilities or modify global agent configuration.

The current quickstart resolves active feature state through `.specify/feature.json` or `SPECIFY_FEATURE_DIRECTORY`; changing Git branches alone is not feature selection. Let the actual installed tool establish/validate that state during adoption rather than adding a fabricated manifest here.

Use a bounded next feature such as protected-page authorization or safe in-flight entitlement settlement. Keep `001-social-publisher` as the living product baseline, record each change's requirements/evidence, and reconcile the shared PRD/plan/tasks. The app-wide retrospective documentation is appropriate here because the user explicitly requested the full inventory; it should not become one unreviewable implementation task.

## Review outcome

Documentation structure aligns conceptually with specification-driven work; tool initialization and formal workflow execution remain absent. Production acceptance remains incomplete. Installing a planning tool does not resolve platform approvals, production tests, or business decisions. Track optional tool adoption as T043 without marking it required for operating the application itself.
