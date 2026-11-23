# dsh-agent-team-profile-manager

For DSH **`0.2.3-alpha.2` only**. Validated with automated integration tests; live-profile and real-provider verification remain pending. See [verification](docs/VERIFICATION.md).

## Current scope

The rc.2 Agent Teams service is a task board over the native subagent tree. This plugin preserves native subagent and Team tools; it no longer mounts `spawn_teammate` or blocks `subagent`/`subagent_fork`. Native delegation tools must be configured with `modelSelection: true` to expose explicit child routes. Since DSH 0.2.3, authorized routes come from the live Host setting (`subagentModelSelection`: enabled + allowed models) and apply to every Session immediately; when disabled, only the agent's current route is allowed. Legacy per-Session policy events are ignored, as upstream does. The plugin does not grant route authorization.

| Tool | Behavior |
| --- | --- |
| `list_models` | Lists Session-authorized registered routes; metadata availability is not a successful inference. |
| `get_current_model` | Reports the last-used, pending and next model route for this agent. |
| `switch_model` | Selects the caller’s authorized route for its next step. |
| `switch_teammate_model` | Tree root only: selects a loaded reachable descendant’s next route. |
| `set_teammate_display_name` | Tree root only: sets/resets a durable alias without changing IDs or tool targets. |

An admitted inference is not interrupted by selection. Unloaded targets must be resumed through native controls before model switching. A persistence error after a selection append is reported as uncertain durability, not falsely rolled back; inspect the route before retrying.

Aliases appear in their own **"Display aliases" section of the Session panel**, right after the native Subagents section. Native row labels, breadcrumbs and sidebar remain upstream-owned and unchanged. Only aliases of direct children present in the current Session catalog are shown. This is not yet equivalent to replacing every visible name.

## Validation

```sh
npm ci --ignore-scripts
npm run check:versions
npm run build
npm test
```

Tests use actual 0.2.3-alpha.2 AgentLoop, subagent providers, native tool execution and JSONL storage with keyless scripted LLM adapters. The browser test mounts the real upstream catalog with fixture primitives/renderer. Live-profile and real-provider verification remain pending.

## Version and release rules

**The plugin version and all declared DSH dependency versions must match exactly.** CI and the manual publish workflow run `npm run check:versions`. Never invent a plugin-only next prerelease to fix a publishing mistake.

Every publication uses npm **`latest`**, including alpha and RC versions, through GitHub Actions OIDC/provenance without an npm token. Publication requires explicit human approval; the user approved 0.2.3-alpha.2 publication (0.2.3-alpha.1 skipped) based on automated validation. No joint live-profile test was performed.

MIT. See [NOTICE](NOTICE) and [LICENSE](LICENSE).
