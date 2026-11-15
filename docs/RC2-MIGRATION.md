# DSH 0.2.2-rc.2 migration — local prototype, not published

## Implemented and locally tested

- Native subagent creation with explicit provider/model/reasoning effort under the Session route policy.
- Runtime self/descendant model switches using `agent.model.select()`: the already admitted inference stays unchanged; the next inference uses the saved route. Session identity and history are retained.
- Aliases stored via native tool receipts and the existing `agentTeamDisplayNames` projection. Root-only authorization, reset, and stable targets are tested.
- A complementary footer in the native subagent catalog displays aliases of direct children. It does not replace native row labels, breadcrumbs or sidebar names.
- JSONL restart tests prove alias and model-choice persistence.

## Current evidence

`npm run check:versions`, `npm run build`, and `npm test` pass locally (15 tests at this checkpoint). The UI test uses the real upstream rc.2 catalog bundle and SlotCore, with fixture primitives/renderer, not a running-browser end-to-end test. No real-provider billing was used.

## Joint test is not ready in this chat

The installed DSH was checked on 2026-11-15 and is now `0.2.2-rc.3`. This prototype and its exact peers are `0.2.2-rc.2`. Do not weaken the version guard or mix them. The proposed next step is a separate migration to rc.3 after human confirmation. Do not publish rc.2 or start a replacement server.

Before a joint test, align versions, choose the target profile and create a backup, inspect its tool configuration (native spawn/fork modelSelection flags and authorized model routes), install the local build with explicit consent, restart the existing Host and refresh its existing URL. Then choose two authorized routes together: create a child on A, set an alias, switch to B, send another prompt and verify provider/model, stable child ID and history. Check aliases visually and restart persistence. Roll back the profile if any check fails.

No profile or running Host has been changed. This work may be committed and pushed as a local-validation checkpoint; no npm publication or joint live test has been performed.
