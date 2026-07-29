# codacy-lizard

This is the docker engine we use at Codacy to have [lizard](https://github.com/terryyin/lizard) support.
You can also create a docker to integrate the tool and language of your choice!
Check the **Docs** section for more information.

## Docs

[Tool Developer Guide](https://support.codacy.com/hc/en-us/articles/207994725-Tool-Developer-Guide)

[Tool Developer Guide - Using Scala](https://support.codacy.com/hc/en-us/articles/207280379-Tool-Developer-Guide-Using-Scala)

## Test

We use the [codacy-plugins-test](https://github.com/codacy/codacy-plugins-test) to test our external tools integration.
You can follow the instructions there to make sure your tool is working as expected.

## Agent Playbook: Updating This Repository End-to-End

This section is written for an AI coding agent (or a human) tasked with updating this repo — most commonly bumping the wrapped [Lizard](https://github.com/terryyin/lizard) version, but also base image / orb / dependency bumps. Follow it top to bottom.

### 1. What this repository is

This is a **Codacy engine**: a TypeScript/Node.js wrapper (`src/index.ts` -> `src/lizardIssuesEngine.ts` -> `src/lizard.ts`, built on the `codacy-seed` npm package) that packages the Python tool [Lizard](https://github.com/terryyin/lizard) (a cyclomatic-complexity analyzer) as a Docker image Codacy's platform runs against a customer's source code. `src/lizard.ts` shells out to the `lizard` CLI (installed via `pip`) and parses its plain-text stdout into structured method/file metrics.

Unlike a typical rule-based linter engine, this tool reports **metrics** (NLOC, cyclomatic complexity, parameter count) rather than an open-ended list of upstream lint rules. It does, however, still have a `docs/patterns.json` — but it is a small, fixed, **hand-maintained** set of 9 Codacy-defined threshold patterns (`nloc-minor/medium/critical`, `ccn-minor/medium/critical`, `parameter-count-minor/medium/critical`) that wrap Lizard's own metrics with Codacy severity levels and default thresholds. There is **no generator script** (no `DocGenerator`-equivalent) — `docs/patterns.json` and `docs/description/*.md` + `docs/description/description.json` are edited directly by hand. The `patterns.json` `"version"` field is a **documentation-only** string that records which Lizard release the patterns/behavior were last verified against — it is not read by any build step and does not pin anything.

### 2. Files that encode versions — check all of these on every update

| File | What it controls | What to check |
|---|---|---|
| `Dockerfile` → `pip install lizard` | The actual Lizard version bundled in the image | **Not pinned** — always installs the latest PyPI release at image-build time. To pin a specific version instead (e.g. for a controlled bump), change to `pip install lizard==<version>`; otherwise treat every rebuild as picking up latest Lizard automatically. |
| `docs/patterns.json` → top-level `"version"` | Documentation string recording which Lizard version the patterns were last verified/updated against | Bump this to the new Lizard version whenever you verify behavior against it (see prior commits like "Bump Lizard 1.23.0"). Purely informational. |
| `Dockerfile` → `FROM node:lts-alpine...` (builder stage) | Node.js build image | Bump opportunistically or when asked; check compatibility with `engines.node` in `package.json` (`>=18.0.0`). |
| `Dockerfile` → `FROM python:...-alpine...` (runtime stage) | Python runtime that runs `lizard` | Bump opportunistically or when asked; keep the alpine tag in sync with the builder stage's alpine version if the repo's convention does (recent history keeps both alpine minor versions matching). |
| `package.json` → `dependencies.codacy-seed` | Codacy's engine SDK for Node | Check npm for newer versions if asked to update it. |
| `package.json` → `devDependencies` (`eslint`, `typescript`, `mocha`, `prettier`, etc.) | Dev/build tooling | Run `npm run preupgrade && npm run upgrade` (uses `npm-check-updates`) to bump these and regenerate `package-lock.json`, or bump by hand and run `npm install`. |
| `package-lock.json` | Locked dependency tree | Must be regenerated (`npm install`) any time `package.json` dependencies change; commit it together with `package.json`. |
| `.circleci/config.yml` → `codacy/base` orb | Shared CircleCI steps (checkout, versioning, docker publish, tagging) | Check the latest published orb version; `git log -p .circleci/config.yml` shows prior bump history as a fallback reference. |
| `.circleci/config.yml` → `codacy/plugins-test` orb | Runs `codacy-plugins-test` in CI after the image is built | Same as above. |

### 3. Step-by-step update procedure

1. **Bump the version(s)** as scoped by the task — e.g. pin/verify the Lizard version, bump `docs/patterns.json`'s `"version"` field, bump base images, or bump npm deps.
2. **Update `docs/patterns.json` and `docs/description/*`** by hand if the new Lizard version changes metric names/behavior/defaults (there is no generator to run — edit the JSON/Markdown directly). Otherwise just bump the documentation `"version"` string.
3. **Install deps and build:** `npm install` then `npm run build` (runs `tsc`). Run `npm run lint` (ESLint with `--fix`) to catch style issues.
4. **Build the Docker image:** `npm run build:docker` (add `:m1` on Apple Silicon) — this runs the full multi-stage `Dockerfile` build (Node build stage + Python/Lizard runtime stage).
5. **Run `codacy-plugins-test` locally before pushing.** CI runs it with `run_multiple_tests: true` and `run_metrics_tests: true` (see `.circleci/config.yml`), so validate against the fixtures in `docs/multiple-tests/` — clone https://github.com/codacy/codacy-plugins-test and run its `multiple` and `metrics` DockerTest commands against your locally built `codacy-lizard:dev` image tag.
6. **Iterate on failures**, re-running only the relevant DockerTest command after each fix.
7. **Commit** the version bump(s) together with any hand-edited `docs/` files in one change.
8. **Push and open a PR.** CI (CircleCI) runs `checkout_and_version` -> `publish_docker_local` (builds and saves the Docker image) -> `plugins_test` (multiple + metrics tests) -> `publish_docker` (master only) -> `tag_version`.
9. **Poll the PR's real CI checks until they all pass — local validation is NOT the finish line.** After every push, run `gh pr checks <pr-url>` and keep re-polling (short sleep while any check is `pending`) until all checks finish. If a check fails, fetch its actual log (the CircleCI job log for the failing job — don't guess), find the true root cause, fix it, push again (never `--no-verify`, never force-push), and re-poll. Repeat until every check is green. The CI environment's toolchain (Node/npm/pip resolution at build time) can differ subtly from your local one, especially since `pip install lizard` always resolves to whatever is latest on PyPI at build time — so a clean local run does not guarantee CI passes. Only stop iterating when every check passes, or you hit a genuine product/infra decision that needs a human — in which case explain it in the PR rather than guessing.

### 4. Definition of done

- Version bump(s) reflected in all files that encode them (Dockerfile base images/pip pin if applicable, `docs/patterns.json` version string, `package.json`/`package-lock.json`, CircleCI orbs, as scoped by the task).
- `docs/patterns.json` and `docs/description/*` manually reviewed and updated if Lizard's metric behavior changed.
- `npm run build` and `npm run lint` pass locally.
- Docker image builds successfully via `npm run build:docker`.
- `codacy-plugins-test` `multiple` and `metrics` commands pass locally against the freshly built image.
- **After pushing and opening/updating the PR, every CI check on it is green.** Poll `gh pr checks <pr-url>` and iterate on any failure (fetch the real CI log, fix, push, re-poll) until all pass — a passing local build is not sufficient, because the CI toolchain can differ from your local one (see step 9).

## What is Codacy

[Codacy](https://www.codacy.com/) is an Automated Code Review Tool that monitors your technical debt, helps you improve your code quality, teaches best practices to your developers, and helps you save time in Code Reviews.

### Among Codacy’s features

-   Identify new Static Analysis issues
-   Commit and Pull Request Analysis with GitHub, BitBucket/Stash, GitLab (and also direct git repositories)
-   Auto-comments on Commits and Pull Requests
-   Integrations with Slack, HipChat, Jira, YouTrack
-   Track issues in Code Style, Security, Error Proneness, Performance, Unused Code and other categories

Codacy also helps keep track of Code Coverage, Code Duplication, and Code Complexity.

Codacy supports PHP, Python, Ruby, Java, JavaScript, and Scala, among others.

### Free for Open Source

Codacy is free for Open Source projects.

## GitHub actions

This repository has the common GitHub actions that we want to have accross all of our public repositories.
They should be kept at `.github/workflows`
