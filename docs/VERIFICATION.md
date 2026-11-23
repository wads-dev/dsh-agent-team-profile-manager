# Verification — local DSH 0.2.3-alpha.2 migration

Verified locally against exact installed 0.2.3-alpha.2 dependencies, including a clean installation and package dry run. The version guard, build and 15 automated tests pass. See [migration status](RC3-LOCAL-TEST.md) for limitations and the proposed joint test.

## Evidence

- Actual native spawn/fork tools and keyless scripted LLM adapters verify requested model and reasoning effort.
- Runtime self-switch and root-controlled descendant switch verify actual next inference, stable Session ID and prior history.
- Unauthorized routes, unknown targets, invalid effort, cancellation and idempotent retries are exercised.
- Real tool receipts feed the alias projection; JSONL restart tests preserve aliases and native model selection.
- The alias Session panel section is tested beside the actual upstream Subagents section (real bundle, client store and SlotCore); native row navigation keeps the original address.
- Route authorization follows the live Host setting; a legacy per-Session policy event alone does not authorize a switch.

## Not verified / not equivalent

No live-profile installation, real-provider inference or running-browser end-to-end check was performed. No running Host/profile configuration was changed; activation and a joint test remain separate steps. Alias display is complementary and only covers direct children in the root catalog; it does not replace native row names, breadcrumbs or sidebar labels. Previous Team-only APIs, custom spawn_teammate, subagent blocking and compact_teammate are not part of this adaptation. The migration replaces the old integration suite; its previous coverage must not be inferred from the current 15 tests.

0.2.3-alpha.1 is skipped (upstream Cordis peer mismatch). The user approved publishing 0.2.3-alpha.2 through CI based on automated validation; this does not imply live-profile verification.
