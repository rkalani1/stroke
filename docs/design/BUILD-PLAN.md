# Stroke — Build Plan (design phase → live build)

Captures the approved direction so the live build can execute cleanly. Branch: `feat/currency-ux-perf-2026` (off `origin/main` v6.0.0).

## Non-negotiable constraints
- **Institution-neutral & public.** `rkalani1.github.io/stroke` carries **zero** HMC / UW / UW-Medicine content. (Already verified clean on main.)
- **Extend / refactor, never rewrite.** Preserve every route, calculator, IndexedDB ward census + 12h expiry, post-tPA timer, LKW countdown, 8 note generators, disclaimers, aria/keyboard. Existing **Encounter · Management · Trials** are *improved* (aesthetics/layout/ease-of-use), not replaced.
- **Offline PWA.** New data must be precached by the service worker; no in-app live network calls.
- **100% accurate.** Every evidence item PMID/DOI-verified against PubMed at authoring/update time; anything unverifiable is **quarantined, never displayed**.
- Gates each step: `npm run test:unit` (5608), `evidence:validate`, `validate:citations` green; manual review before merge; bundle (`npm run build`, unminified by repo convention) rebuilt at deploy.

## Approved design — "clinical precision instrument"
- Type: **Bricolage Grotesque** (display) · **Public Sans** (body) · **IBM Plex Mono** (data/citations).
- Palette: deep **teal** primary · signal **coral** (acute/harm) · **gold** (ICH / institutional) · warm paper · near-black ink. Light + dark. Softer graph-paper texture; freshness "pulse" signals.
- Reference: `docs/design/prototype.html` (standalone, approved).

## Information architecture (unified tab bar — additive)
`Encounter · Institutional Protocols & Algorithms · Trials` (existing — **Management is renamed to *Institutional Protocols & Algorithms***, preserved + improved) │ `Research & Guidelines` (new) │ `Resources ↗` (launcher) · `Patient` / `Teach` modes.

> **Decision 2026-05-29:** "Protocols & Algorithms" is **not** a new separate tab — it is the **new title of the existing Management section**, fully named **"Institutional Protocols and Algorithms."** Public site shows the **real protocol content, de-identified** (no UW/HMC/identifying references — a reader can't tell whose protocol it is), satisfying the institution-neutral constraint while staying clinically substantive. The word "Institutional" is a generic descriptor; no institution is named.

- **Research & Guidelines** (public) — *"what the literature shows"* (teach from this): What's New feed + Evidence Atlas + guidelines.
- **Institutional Protocols & Algorithms** (renamed Management, public) — *"what we do"* patterns: the **real protocols, de-identified** (no UW/HMC/identifying refs); each links to its evidence basis. Visually distinct (gold).
- **Fully-branded institutional layer** — the *identified* HMC/UW originals (named contacts, pagers, order-sets), **local-only, gitignored, never public** (fed from OneDrive Stroke Center) — the on-device source the public de-identified version is derived from. Built last.
- **Resources ↗** — external tools (UpToDate, OpenEvidence, Asta, clinic questionnaire, facilities map) as a launcher; institution links flagged private.

## What's New + autonomous updater
- Detailed cards: **study type · design (n, population, comparison) · key result (effect + 95% CI + p) · practice implication · certainty · PubMed**. Observational items carry a **caveat row** + low/moderate certainty.
- Scope: past ~30 days, practice-changing/informing — **trials, meta-analyses, AND key observational**.
- **Updater = build-time / scheduled CI job** (not in-app): PubMed E-utilities sweep → relevance filter → verify PMID/DOI → emit committed `whats-new.json` (verified only; quarantine the rest) → SW precaches it → app renders offline. **Autonomous in operation, accurate by construction.**

## Phases (sequenced; each reviewable & test-gated)
1. **Design tokens → app.** Port CSS variables/type/components into the monolith incrementally, surface by surface.
2. **What's New** — data module + UI section + the guarded updater script + `package.json` wiring + SW precache.
3. **Institutional Protocols & Algorithms** — rename the Management section + present real protocols **de-identified** for the public build (no UW/HMC/identifying refs).
4. **Patient / Explain mode** (flip-to-patient, plain language, big type).
5. **Teaching mode** (trial-behind-the-decision; predict-then-reveal).
6. **Cross-device + offline polish.**
7. **Private institutional layer** (local-only).

## Already done (this branch, deploy-ready, not pushed)
- Currency: **15 PubMed-verified trials** promoted into the Evidence Atlas (basilar EVT, ESUS, PFO, ICH-BP, MISTIE III, carotid, AF-timing). Atlas 31→46 trials. Bundle rebuilt.
- Docs: `evidence-currency-audit-2026-05-29.md`, `perf-ux-assessment-2026-05-29.md`, this plan, `prototype.html`.

## Known quick-fixes to fold in
- Eligibility-Tables iframe references `example.github.io` (likely a production 404) → point to `rkalani1.github.io`.
- Add `lastReviewed` metadata to guideline JSONs **only with real review dates** (don't fabricate).
