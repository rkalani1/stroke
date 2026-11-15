# PWA, installation and updates

The public workspace is synthetic only. Do not enter PHI or real encounter data. Core scripts, styles, fonts and retained protocol dependencies are bundled locally under `/stroke/`; there is no required CDN or external API.

## Installation

Use **More → Install App**. Chromium browsers use an available native prompt; iOS Safari shows Share → Add to Home Screen instructions. Other browsers show their own menu instructions. Manifest shortcuts open Encounter and Protocols. Existing Capacitor wrappers are preserved; see `pwa-native-distribution.md`. No native release was performed by this redesign.

## Atomic updates

`build-browser.mjs` emits the complete module manifest with hashes, synchronizes the worker module list and writes a SHA-256 table (`PRECACHE_SHA256`) of every precached file: the shell, entry, stylesheet, manifest, offline page, reference data, icons, fonts and every module, each as finally written by the build (`./` is `index.html`). Installation fetches that set into a temporary app-owned staging cache, rejects a module graph that names an unlisted module, an invalid reference envelope or any file whose SHA-256 differs from the table, and only then copies it into the release cache. A partly propagated Pages deploy (for example the new worker with the previous release's `app.js` or `tailwind.css` under the same names), an interrupted download or a corrupt file therefore fails the install: the current version keeps running and a later update check retries. The table can only detect bytes that differ from this build; it is not a signature and does not protect against a compromised origin. `scripts/check-committed-bundle.mjs` and `tests/committed-bundle-coherence.test.js` check that the committed table matches the committed files. Worker activation waits for an explicit user action; no automatic active-encounter reload occurs.

**Reload to update** activates the waiting worker and reloads, clearing session data. **Later** leaves the encounter open. A failed lazy protocol download is isolated to its surface; Encounter remains usable. Explicit reload-to-retry warns that session entries will be cleared. No recovery path persists/transfers encounter values.

Activation removes obsolete app-owned version caches and retired teaching assets. It does not remove unrelated origin caches/storage. The shell clears only known obsolete app-owned clinical storage keys, without reading or migrating their values. Nonclinical theme/install preferences may remain. An already-open old page or permanently offline device cannot be forced remotely to update.

## Offline limits

After successful complete online installation, Encounter calculations, Pulsara/Epic documentation, Evidence, Trials and retained protocols work offline. External references require internet. An uncached first visit needs network. iOS launch screens (`assets/splash/`) are not part of the installation, because only an iOS home-screen launch shows one: the worker stores each in the current release's cache on its first request, so an offline launch before then, including the first after an update, may show no launch image. Whether iOS requests that image through the worker is unverified on a device. Documented post-treatment timing uses explicit administration timestamps and elapsed wall time; browser background scheduling, notifications and alarms are not guaranteed. Resume/visibility events recompute time.

Run `node scripts/qa-upgrade.mjs` for baseline upgrade, defer/accept, interrupted install, chunk failure, a mixed deploy with a stale entry, recovery and retired-cache cleanup. `npm test` runs the published-artifact synthetic workflow, offline reload and viewports/themes. Both offline reloads drop every connection at the local server as well as setting the browser context offline, because in Chromium `setOffline` alone does not keep the worker's own fetches off the network after a reload; qa-smoke then requires a non-precached probe (`llms.txt?offline-probe`) to get the worker's 503 offline response. These are simulated browser checks, not physical iPhone/Android validation. Use manual physical testing before claiming native device behavior.

Changes to cached assets require a new coherent app/cache version and complete build. Private builds must write outside the published tree. Deploy through the ordinary protected process. The owner-authorized factor-Xa wording correction is documented in [source limitations](source-limits.md); any newly identified material protected-source conflict must be resolved before release.
