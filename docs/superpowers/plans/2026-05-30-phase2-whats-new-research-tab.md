# StrokeOps Phase 2 — What's New + Research & Guidelines tab + guarded updater

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Ship a **verified-only** "What's New" feed inside a new **Research & Guidelines** tab, fed by a build-time generator from the repo's verified Evidence Atlas, precached for offline — accurate by construction, no in-app network.

**Architecture:** Discovery (`evidence-watch.mjs`, PubMed sweep) → human-gated promotion into `src/evidence/completedTrials.js`+`citations.js` (gold tier `verificationStatus:'verified-pubmed'`) → `generate-whats-new.mjs` emits committed `whats-new.json` from verified-atlas records only → app renders it offline. The new `research` tab houses the feed + the existing Evidence Atlas + guidelines.

**Clinical-safety rule (non-negotiable):** Every study shown must have a PMID that resolves to the claimed study AND a key result consistent with the abstract. Anything unverifiable is **quarantined, never displayed**. Verification uses the PubMed MCP (`mcp__plugin_pubmed_PubMed__get_article_metadata` / `search_articles`).

## IA edit points (from the verified app map — `src/app.jsx`)
- `VALID_TABS` line ~996 · desktop nav array ~16541 + kbd array ~16532 · mobile nav ~16869/34869 · render dispatch after ~34618 · `parseHashRoute` ~1014 · `buildHashRoute` ~1038 · Ctrl-shortcut map ~7532. Tab id = `research`, label "Research & Guidelines" (mobile "Research").

---

## Task 1: Verify & promote recent practice-changing studies into the Evidence Atlas

**Files:** `src/evidence/completedTrials.js`, `src/evidence/citations.js`, `src/evidence/schema.js` (add `promotedDate`).

- [ ] **Step 1 — Build the candidate manifest.** Read the What's New feed in `docs/design/prototype.html` (the `.study` cards ~lines 246–379). For each study extract: claimed acronym, study type, full title, journal/year, design (n/population/comparator), key result (effect + CI + p), practice implication, certainty, and the **PMID**. List all (~13).
- [ ] **Step 2 — Verify each PMID** via `mcp__plugin_pubmed_PubMed__get_article_metadata` (batch; the result is large — handle out-of-context per the tool's guidance, extract title/journal/year/abstract via jq). For each: (a) PMID resolves; (b) returned title matches the claimed study/intervention; (c) the claimed key result (direction + rough effect) is consistent with the abstract. Mark each VERIFIED or QUARANTINE (with reason).
- [ ] **Step 3 — Add `promotedDate`** to the `makeCompletedTrial` factory + schema docs (ISO `YYYY-MM-DD`, the date the record entered the feed window; optional, defaults to `lastReviewed`).
- [ ] **Step 4 — Promote VERIFIED studies** not already in the atlas into `completedTrials.js` (via `makeCompletedTrial`) + their citations into `citations.js` (via `makeCitation`, `verificationStatus:'verified-pubmed'`, real pmid/doi/journal/year from the MCP), with `promotedDate`. Use the existing record style exactly. Do NOT add quarantined studies.
- [ ] **Step 5 — Gate:** `npm run evidence:validate` (clean), `npm run validate:citations` (PASS), `npm run validate:inline-citations`, `npm run test:unit` (≥5608). Commit: `feat(evidence): verify + promote recent practice-changing studies (PubMed-verified)`.
- [ ] **Step 6** — Report VERIFIED vs QUARANTINED list (quarantined go in the phase report, not the app).

---

## Task 2: `promotedDate` schema + What's New generator + validator + wiring

**Files:** `scripts/generate-whats-new.mjs` (new), `scripts/validate-whats-new.mjs` (new), `package.json`, generated `whats-new.json` (repo root).

- [ ] **Step 1 — `generate-whats-new.mjs`** (mirror `evidence-export.mjs` import pattern): read the atlas via `src/evidence/index.js`; select `completedTrials` with `verificationStatus==='verified-pubmed'` AND a `promotedDate`/`lastReviewed` within the feed window (e.g. last ~120 days, configurable); join `citations` for pmid/url/journal/year; map to the prototype card shape (acronym, studyType, title, journal+year, design{n,population,comparator}, result{effect,ci,p,direction}, practiceImpact, certainty, pubmedUrl, topic, observationalCaveat?); sort by promotedDate desc; write `whats-new.json` (+ a `generatedAt` from an injected timestamp, NOT Date.now in a way that breaks determinism — accept a `--now` arg or read from env, else omit).
- [ ] **Step 2 — `validate-whats-new.mjs`** (mirror `evidence-validate.mjs`): parse `whats-new.json`; assert every entry resolves to a `completedTrials` record with `verificationStatus==='verified-pubmed'`; every `pmid` matches that record's citation; required display fields present; exit 1 on any violation.
- [ ] **Step 2b** — run it; it must pass.
- [ ] **Step 3 — `package.json` wiring:** add `"evidence:whats-new": "node ./scripts/generate-whats-new.mjs"`, `"validate:whats-new": "node ./scripts/validate-whats-new.mjs"`; add `validate:whats-new` to the `test` chain (after `evidence:validate`); add `evidence:whats-new` to `build` (before `build:js`) so the committed feed regenerates each build.
- [ ] **Step 4 — Gate:** `npm run evidence:whats-new && npm run validate:whats-new && npm run build && npm run test:unit`. Commit: `feat(whats-new): build-time generator + validator + committed whats-new.json`.

---

## Task 3: Research & Guidelines tab (houses What's New + Evidence Atlas + guidelines)

**Files:** `src/app.jsx` (IA edits + the new tab panel), maybe `src/components.jsx`.

- [ ] **Step 1 — IA wiring (additive):** add `research` to `VALID_TABS`; add `{id:'research',name:'Research & Guidelines'}` to the desktop nav array + the kbd arrow array; add `{id:'research',name:'Research',icon:'book-open'}` to mobile nav; add `case 'research'` to `parseHashRoute`→`{tab:'research'}` and `buildHashRoute`→`'#/research'`; add `'4':{tab:'research'}` to the Ctrl-shortcut map. Preserve every existing tab/handler/aria.
- [ ] **Step 2 — Render the tab panel** (`{activeTab==='research' && <ErrorBoundary><div id="tabpanel-research" role="tabpanel" aria-labelledby="tab-research">…</div></ErrorBoundary>}` after the protocols panel close ~34618): a "What's New" section rendering the imported `whats-new.json` as study cards using the Phase-1 `v7-study`/`v7-stype`/`v7-cert`/`v7-verify`/`v7-tag`/`v7-pulse` classes (study type · design · result with teal/coral effect · practice implication · certainty · PubMed link · observational caveat row); then a "Evidence Atlas" section that surfaces the existing completedTrials atlas; then a "Guidelines" section surfacing `src/guidelines/*`. Reuse existing atlas/guideline render helpers if present — do not duplicate logic.
- [ ] **Step 3 — Wire whats-new.json import** (esbuild bundles JSON imports; `import whatsNew from '../whats-new.json'` or fetch-at-runtime-with-cache — prefer static import so it's bundled + offline by default). Confirm build inlines it.
- [ ] **Step 4 — Gate:** `npm run build`, `lint:tokens` clean, `lint:contrast` 21/21, `test:unit` ≥5608. Touch-targets: attempt; if the `/#/trials` networkidle quirk blocks the full run, note it (this task DOES add interactive elements — the PubMed links + section toggles — so try a scoped run on `/#/research` if possible). Visual smoke on `/#/research`. Commit: `feat(research): add Research & Guidelines tab with verified What's New feed`.

---

## Task 4: Offline precache

**Files:** `service-worker.js`.
- [ ] Add `'./whats-new.json'` to `CORE_ASSETS`; bump `APP_VERSION`/`CACHE_NAME` to `6.2.0`; bump `index.html` `?v=` to `6.2.0`. Gate: build; offline check (SW serves whats-new.json + research tab offline). Commit: `feat(pwa): precache whats-new.json; bump SW to 6.2.0`.

---

## Task 5: Guarded build-time updater (autonomous discovery, human-gated promotion)

**Files:** `scripts/update-whats-new.mjs` (new, thin) or extend `evidence-watch.mjs`; `docs/whats-new-updater.md`.
- [ ] **Step 1** — Wire a `scripts/update-whats-new.mjs` that: runs the `evidence-watch` PubMed sweep (past ~30d, relevance-filtered) → for each candidate fetches metadata + verifies PMID/DOI → writes a **candidate report** (`docs/whats-new-candidates.md`) for clinician promotion. It does NOT auto-edit the atlas (clinical safety) — promotion stays human. Then `generate-whats-new.mjs` (Task 2) regenerates the committed feed from whatever is verified in the atlas.
- [ ] **Step 2** — Document the operating model in `docs/whats-new-updater.md`: scheduled CI job runs `update-whats-new` (emit candidates) + `evidence:whats-new` (regenerate feed from verified atlas) + `validate:whats-new`; clinician reviews candidates and promotes; nothing unverified is ever displayed. Note the network requirement (CI, not in-app).
- [ ] **Step 3 — Gate:** the script runs without crashing (network-dependent steps degrade gracefully when offline — report "no network, skipped sweep"); `validate:whats-new` still green. Commit: `feat(whats-new): guarded discovery updater + operating model docs`.

---

## Phase gate (before moving to Phase 3)
`npm run build:prod && npm run test:unit && node scripts/lint-tokens.mjs && node scripts/lint-contrast.mjs && npm run evidence:validate && npm run validate:citations && npm run validate:whats-new` — all green. Push to PR #2.

## Deferred to later phases
- The Research tab's nav styling (frosted `.v7-app`) — folds into the Phase-1-deferred IA masthead work, done coherently when all tabs exist.
- Patient/Teaching framings of the feed — Phases 4/5.
