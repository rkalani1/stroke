# PWA, installation and updates

The public workspace is synthetic only. Do not enter PHI or real encounter data. Core scripts, styles, fonts and retained protocol dependencies are bundled locally under `/stroke/`; there is no required CDN or external API.

## Installation

Use **More → Install App**. Chromium browsers use an available native prompt; iOS Safari shows Share → Add to Home Screen instructions. Other browsers show their own menu instructions. Manifest shortcuts open Encounter and Protocols. Existing Capacitor wrappers are preserved; see `pwa-native-distribution.md`. No native release was performed by this redesign.

## Atomic updates

`build-browser.mjs` emits the complete module manifest with hashes, then synchronizes the worker module list. Installation stages the complete graph in a temporary app-owned cache and verifies scripts/checksums before committing it. An interrupted or corrupt download cannot replace the working version. Worker activation waits for an explicit user action; no automatic active-encounter reload occurs.

**Reload to update** activates the waiting worker and reloads, clearing session data. **Later** leaves the encounter open. A failed lazy protocol download is isolated to its surface; Encounter remains usable. Explicit reload-to-retry warns that session entries will be cleared. No recovery path persists/transfers encounter values.

Activation removes obsolete app-owned version caches and retired teaching assets. It does not remove unrelated origin caches/storage. The shell clears only known obsolete app-owned clinical storage keys, without reading or migrating their values. Nonclinical theme/install preferences may remain. An already-open old page or permanently offline device cannot be forced remotely to update.

## Offline limits

After successful complete online installation, Encounter calculations, Pulsara/Epic documentation, Evidence, Trials and retained protocols work offline. External references require internet. An uncached first visit needs network. Documented post-treatment timing uses explicit administration timestamps and elapsed wall time; browser background scheduling, notifications and alarms are not guaranteed. Resume/visibility events recompute time.

Run `node scripts/qa-upgrade.mjs` for baseline upgrade, defer/accept, interrupted install, chunk failure, recovery and retired-cache cleanup. `npm test` runs the published-artifact synthetic workflow, offline reload and viewports/themes. These are simulated browser checks, not physical iPhone/Android validation. Use manual physical testing before claiming native device behavior.

Changes to cached assets require a new coherent app/cache version and complete build. Private builds must write outside the published tree. Deploy through the ordinary protected process. The owner-authorized factor-Xa wording correction is documented in [source limitations](source-limits.md); any newly identified material protected-source conflict must be resolved before release.
