# Verification — DSH 0.2.1-alpha.3

Verified 2026-10-14 with Node v22.23.2 and matching published alpha.3 DSH packages. Cordis 4.0.5-alpha.2, Loader 1.0.6-alpha.2.

## Passed

- Clean npm ci --ignore-scripts using the committed lockfile.
- npm run build: Host ESM and matching alpha.3 alias-aware browser bundle.
- npm test: 31 passed, zero failed/skipped.
- npm pack --dry-run: prepack rebuild and all 31 tests passed again; expected Host/client entry points, bundle patch and documentation included.
- npm ls --depth=0: no invalid or missing direct dependencies.
- git diff --check.

## Coverage

Actual released AgentLoop, Team service/tools, SubagentRuntime, spawn/fork providers, filesystem/working-directory services, Cordis Loader and JSONL persistence are exercised. Keyless scripted adapters assert actual request provider/model/reasoningEffort/sessionId and history, not only metadata.

Tests cover fresh/fork explicit routes and inheritance; repeated same-session switches; cold resume/full runtime restart; authorization and adapter validation; cancelled/invalid switches; concurrent spawn isolation; assembly snapshot timing; route and alias persistence; stable member/task identity; duplicate-enabled Team composition, both Loader orders and toggles; alias-aware browser DOM navigation; global subagent tools registered after startup; scoped bypass denial; Team creation while tools are blocked; prompt model-choice/reuse guidance; operator opt-out and disposal restoring tool access.

## Diagnosed compatibility changes

The removed startContinuable method is replaced by startActivation. The router preserves upstream transactions and injects options only for the exact async-local Team spawning parent and reserved child ID. Upstream team:identity must be shared alongside team:policy to avoid duplicate-registration failures. Persistence now exposes a plugin namespace instead of a default export; test fixtures must mount workingDirectory for SubagentRuntime.

## Limits / deployment still required

No cloud credentials, live provider billing, global installation or user profile configuration changed. No running DSH Host restart or existing-URL Web verification performed. The installed CLI inspected during this work is still alpha.2; it must be upgraded together with its profile before loading this exact alpha.3 release. The historical inactive-context live incident is not independently reproduced or claimed universally fixed.

Browser verification is DOM-based against the built alpha.3 panel. Native compaction is tested with a stub backend, not real summarization. Model-choice confirmation is system-prompt/tool-description guidance; code enforces route authorization and standard-subagent tool denial, not proof of human consent. Tool restrictions are not a security boundary against arbitrary host-side code or other plugins.
