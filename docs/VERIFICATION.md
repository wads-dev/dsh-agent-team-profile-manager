# Verification — local DSH 0.2.2-rc.4 migration

Verified locally against exact installed rc.4 dependencies, including a clean installation and package dry run. The version guard, build and 15 automated tests pass. See [migration status](RC3-LOCAL-TEST.md) for limitations and the proposed joint test.

## Evidence

- Actual native spawn/fork tools and keyless scripted LLM adapters verify requested model and reasoning effort.
- Runtime self-switch and root-controlled descendant switch verify actual next inference, stable Session ID and prior history.
- Unauthorized routes, unknown targets, invalid effort, cancellation and idempotent retries are exercised.
- Real tool receipts feed the alias projection; JSONL restart tests preserve aliases and native model selection.
- The complementary footer is tested with the actual upstream catalog bundle and SlotCore; native navigation targets are unchanged.

## Not verified / not equivalent

No live-profile installation, real-provider inference or running-browser end-to-end check was performed. No running Host/profile configuration was changed; activation and a joint test remain separate steps. Alias display is complementary and only covers direct children in the root catalog; it does not replace native row names, breadcrumbs or sidebar labels. Previous Team-only APIs, custom spawn_teammate, subagent blocking and compact_teammate are not part of this adaptation. The migration replaces the old integration suite; its previous coverage must not be inferred from the current 15 tests.

The user explicitly authorized publication of rc.4 via CI based on these automated results. This does not imply live-profile verification.
