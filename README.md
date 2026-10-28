# dsh-agent-team-profile-manager

Agent Teams model routing, durable display aliases and Team-first delegation for **DSH 0.2.1-rc.3 only**. Node 22.23+.

## What this release fixes

- Migrates the Team routing bridge from removed `startContinuable` to `startActivation`, retaining upstream provisioning, authority, cancellation and persistence.
- Restores explicit provider/model/reasoning-effort selection for fresh and fork teammates and runtime model changes without replacing their sessions.
- Shares both upstream Team policy and the new Team identity context when duplicate tool compositions are enabled, preventing duplicate-registration failures.
- Builds the alias-aware Web panel from the matching rc.3 upstream browser bundle, not the old RC panel. Display aliases preserve stable message/task targets.

## Team-first delegation (default)

The plugin hides global `subagent`, `subagent_fork` and `list_subagent_models` tools in Team member scopes. A scoped dispatch guard also rejects those names if a scoped registration bypasses visibility restrictions. Late registration and plugin disposal are handled. This is a tool-level policy, not a sandbox against arbitrary host code or other plugins.

**Do not disable the subagent runtime or spawn/fork providers.** Agent Teams uses that shared runtime internally. Only the standard model-facing delegation tools are blocked.

A dedicated system-prompt section and spawn-tool description instruct the model to:

1. Obtain human authorization to delegate; treat a request for sub-agents as Team-based delegation.
2. Ask which provider/model to use before delegation: one for all members, a per-responsibility mapping, or explicit inheritance. Reuse the choice for its stated scope.
3. Discover exact allowed routes via `list_models`; never guess model IDs or consent.
4. Reuse suitable members with `list_agents` and `send_message` instead of creating one per task.
5. Use Team runtime switch tools rather than claiming only sub-agents support model selection.

**Model-choice confirmation is prompt guidance, not mechanically verified consent.** The plugin cannot reliably infer from arbitrary conversation text that a human chose a model. It does not add a misleading “confirmed” boolean the model could fill itself. Host model authorization remains enforced by code.

Operator opt-out in the router's existing config: `disableSubagents: false`. Default is true; the model-choice guidance remains enabled in either mode.

## Tools

| Tool | Scope / behavior |
| --- | --- |
| spawn_teammate | Lead; upstream tool plus optional provider/model/reasoning_effort. Provider and model together; omission preserves inheritance. |
| list_models | Team members; exact authorized routes and current adapter metadata. |
| get_current_model | Actual last-used route, pending and next route, session ID. |
| switch_model | Teammate; changes its own route at the next model invocation. |
| switch_teammate_model | Lead; changes an exact live teammate's next route. Cold teammates must first be loaded via send_message. |
| set_teammate_display_name | Lead; edit/reset visual names, including cold members. Stable targets do not change. |
| compact_teammate | Lead; native compaction of a loaded idle teammate; no wake/recreation. Summary may lose detail. |

A running inference is never switched midway. A selected model may take effect on the next step of the same turn. The Lead's own route is not changed by these teammate tools.

## Host authorization

Enable **subagent-model-selection** in the DSH Host settings and authorize exact provider/model routes. The name of that native setting remains unchanged even when standard subagent tools are blocked. Sessions without a saved policy capture the Host allowlist; children inherit it. Existing durable policies are preserved, not silently broadened.

A missing provider, disallowed route, invalid effort or unavailable exact model fails before committing a route or creating a teammate. There is no hardcoded model catalog.

## Build and validation

~~~sh
npm ci --ignore-scripts
npm run build
npm test
npm pack --dry-run
~~~

32 tests cover actual rc.3 AgentLoop requests through keyless adapters, fresh/fork spawning, repeated switches and same-session history, JSONL restart/resume, invalid/cancelled selections, concurrent routing, real Cordis Loader duplicate composition/toggles, alias persistence/browser DOM navigation, and delegation visibility/dispatch/cleanup/opt-out. Compaction uses a stub backend; real summarization is not tested.

The suite does not exercise cloud credentials or install/restart the user's running Web profile. A successful local suite is not a claim of live-profile verification.

## Install / update a profile

Stop and back up the selected profile first. Upgrade the Host and Agent Teams bundle together to **0.2.1-rc.3**. Do not mix DSH package versions or force peer resolution.

~~~sh
REPO="$HOME/path/to/dsh-agent-team-profile-manager" # replace
PROFILE=web # replace with your actual profile
npm ci --ignore-scripts
npm run build
npm test
dsh --version # must be 0.2.1-rc.3
# Install/update the upstream bundle before this plugin:
dsh plugin --profile "$PROFILE" add @deepseek-ai/dsh-experimental-agent-team-profile@0.2.1-rc.3
dsh plugin --profile "$PROFILE" add "link:$REPO"
dsh --profile "$PROFILE" --dump-config
dsh --profile "$PROFILE"
~~~

The bundle patch disables the standalone tool-agent-team row and mounts the same upstream tools below the router decorators. Keep Agent Teams enabled and ordered before this plugin. Do not add a duplicate manual router row. Hot-install over existing live Team tools is deliberately rejected; restart the profile. If link resolution does not share Host packages correctly, install an npm-packed tarball instead.

After installing, restart the existing DSH Host and refresh its existing Web URL to load rebuilt client assets. This repository does not automatically modify your profile, global DSH installation, or running server.

## Release policy and naming

Plugin version and every DSH integration dependency must exactly match the target DSH release. Cordis uses the matching upstream framework range. Prepack rebuilds and runs tests, and release tests reject mismatched DSH pins. Upstream changes still require review and tests; matching version numbers alone do not ensure compatibility.

The public package is **`dsh-agent-team-profile-manager`**. It extends the official **`@deepseek-ai/dsh-experimental-agent-team-profile`** bundle; it does not replace or rename that upstream package. Plugin, bundle entry, browser module and locale namespace use the new manager identity. Persisted projection/event keys remain unchanged so existing aliases and routing history survive the rename.

For an existing local installation, stop the Host, remove the old plugin bundle/dependency and enable only the new manager entry. Do not load both identities together. Source repository: https://github.com/wads-dev/dsh-agent-team-profile-manager.

~~~sh
npm pack --dry-run
# Authenticate and verify ownership/availability before the first publication:
npm whoami
npm publish --tag rc --access public
npm dist-tag ls dsh-agent-team-profile-manager
~~~

Publication follows the Live Voice pattern: one npm dist-tag derived from the version (`rc` for `0.2.1-rc.3`, `latest` for stable versions). GitHub Actions uses OIDC trusted publishing with provenance, without an npm token or secondary dist-tag operation.

After publication, install using:

~~~sh
PROFILE=web # replace with your actual profile
dsh plugin --profile "$PROFILE" add @deepseek-ai/dsh-experimental-agent-team-profile@0.2.1-rc.3
dsh plugin --profile "$PROFILE" add dsh-agent-team-profile-manager@0.2.1-rc.3
~~~

## GitHub Actions CI and publication

The workflows follow the Live Voice repository pattern, adapted to this single-package npm repository:

- [CI](.github/workflows/ci.yml): every push and PR, Ubuntu, Node 24, cached npm ci, build, tests and package inspection.
- [Publish to npm](.github/workflows/publish.yml): manual workflow_dispatch on main only, serialized releases, npm environment, OIDC/provenance, metadata/version checks, duplicate npm/Git tag refusal, dry-run, Git tag, OIDC publication and GitHub Release.

Before the first automated release:

1. Create the GitHub environment **npm** in **wads-dev/dsh-agent-team-profile-manager**, preferably with main-only deployment and required reviewers.
2. Configure npm Trusted Publisher: GitHub Actions, owner **wads-dev**, repository **dsh-agent-team-profile-manager**, workflow **publish.yml**, environment **npm**. A first manual publication may be required to create the package before configuring its trusted publisher.
3. Run **Publish to npm** from main. Version **0.2.1-rc.3** publishes directly to `rc` via OIDC, without `NPM_TOKEN`. The GitHub Release is marked prerelease.

Git tagging and npm publication are not atomic. If publication fails after Git tagging, inspect the run and registry before recovery; do not blindly republish an immutable version.

## Attribution

MIT. See [NOTICE](NOTICE) and [LICENSE](LICENSE). Historical incident notes under docs describe earlier RC releases and are not current compatibility guarantees.
