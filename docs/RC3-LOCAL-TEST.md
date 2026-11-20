# DSH 0.2.2-rc.3 — local validation and joint test plan

No push, publication or running-profile modification is authorized. The rc.2 checkpoint remains on main; these rc.3 changes are local only.

## Contract comparison

Public entry declarations for agent, subagent, tool-subagent, tools, agent-team and UI-subagent match rc.2 byte-for-byte. Native model-selection source and UI-subagent mount source also match. Tests use the installed rc.3 packages, not the saved rc.2 tree.

## Validated locally

Version equality, build and 15 tests pass: spawn and fork select explicit authorized models, runtime selection affects actual next inference, identity/history remain stable, aliases persist through JSONL restart, invalid routes/effort/cancellation fail safely, idempotent selection does not duplicate events, and the complementary alias panel preserves native navigation.

## Before joint testing in this chat

1. Identify the exact profile used by this running Host and its startup command through user-provided configuration or supported UI. Do not guess profile paths or scan private storage.
2. Back up the selected configuration and confirm a rollback procedure.
3. Inspect native spawn/fork modelSelection configuration and Session-authorized model routes. Choose provider/model A and B together; do not guess authorization.
4. With explicit approval, install the local plugin build into that profile. Restart only the existing Host and refresh its existing URL; do not start a replacement server.
5. Create one child on A, send a short prompt, set an alias and verify the complementary footer. Switch the loaded child to B and send another prompt. Confirm stable child ID and old history, and verify the actual provider/model on the new request.
6. Reset the alias; verify no target name changed. Check persistence after an agreed restart.

The alias footer is informational and shows direct children only. It does not rename native catalog rows/breadcrumbs/sidebar. Cloud/provider behavior, the full running browser and profile activation remain unverified.
