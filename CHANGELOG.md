# Changelog

## 0.2.1-rc.3

- Support DSH `0.2.1-rc.3` with matching exact integration dependencies and runtime guard.
- Build and validate the alias-aware panel against the rc.3 upstream bundle.
- Retain tokenless GitHub OIDC publishing to the `rc` npm tag.

## 0.2.1-rc.2

- Declare exact compatibility with DSH `0.2.1-rc.2`; align plugin version, DSH peers/dev dependencies, and lockfile.
- Use the matching stable Cordis `~4.0.5` and Loader `~1.0.6` ranges.
- Add an explicit rc.2 runtime compatibility guard and build the alias-aware panel from the rc.2 upstream bundle.
- Update release checks, installation guidance and prerelease dist-tag instructions for rc.2.

## 0.2.1-alpha.3

- Publish identity: dsh-agent-team-profile-manager; align Cordis bundle, Host plugin, browser module, locale and diagnostics. Preserve persisted event/projection keys.
- Move repository metadata to wads-dev/dsh-agent-team-profile-manager; default npm publication to public access with the latest tag and document the matching alpha dist-tag.

- Pin plugin and DSH integration packages to alpha.3.
- Replace removed startContinuable interception with startActivation.
- Deduplicate both team:policy and team:identity registrations.
- Build browser alias panel from the matching alpha.3 upstream client.
- Default to Team-first delegation: hide standard subagent tools and guard scoped bypasses without disabling the shared runtime.
- Inject explicit model-choice and reusable-member guidance; operator opt-out via disableSubagents: false. Human choice is prompt guidance, not fabricated runtime consent.
- Repair integration fixtures with the current persistence export and real filesystem/working-directory services.
- Add release prepack validation and policy lifecycle regressions.


## 0.2.1-alpha.2

### Improvements
- Align the plugin release and all DSH integration dependencies with DSH `0.2.1-alpha.2` (and its matching Cordis alpha releases).
- Add provider/model/reasoning-effort selection when spawning teammates, with exact route authorization and model discovery through `list_models`.
- Add teammate model-switch tools that apply the selected route on the next inference without replacing the teammate session.
- Add Lead-controlled teammate display aliases, persisted with successful tool results and used only for UI labels; stable teammate targets remain unchanged.

### Compatibility
- Add an explicit DSH `0.2.1-alpha.2` compatibility guard for required runtime services and methods.

### Verification
- Build and focused release validation pass. The complete test suite is not yet passing; the alpha.2 Team-service test fixture currently fails to expose Team tools, so runtime integration remains unverified.
