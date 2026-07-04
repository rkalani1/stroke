# Stroke CDS — Autopilot Status & Cross-Device Handoff

**Living doc.** Updated each phase so this work can be resumed from any device
(desktop, web `claude.ai/code`, or the Claude mobile app). Last update: 2026-06-19.

> **How to resume on mobile / web:** open `claude.ai/code` (or the mobile app),
> select the **`rkalani1/stroke`** repo, and tell the session: *"Read
> `docs/AUTOPILOT-STATUS.md` and continue the stroke autopilot work."* Everything
> needed for the **public** workstreams is in the repo. See **Cross-device limits**
> at the bottom for the one part that can't move off this Mac.

---

## Mission (from the owner)
Update / refine / optimize `rkalani1.github.io/stroke` for efficient bedside use and
productivity, make it **agent-ready/usable**, and **maintain local stroke-center
protocol translations** from approved private source material. Iterate until no further optimization remains.

## Decisions locked (2026-06-19)
1. **Private institutional layer scope:** *Full operational kit* — ingest the complete
   June-2026 source-of-truth into the gitignored private layer, provisional items flagged.
2. **Agent-readiness depth:** *Read-ready layer **+ a stroke-CDS MCP server***.
3. **Ship cadence:** *Full autopilot to `main`* — PR per phase, merge when CI is green
   (unit tests + leak guard + qa-smoke = the gate).

## Deploy model (important)
GitHub Pages serves the **`main` branch root directly**; the 2.7 MB `app.js` is **committed**.
Shipping a UI change = `npm run build` locally → commit the regenerated `app.js`/`index.html`.
Branch new work from `origin/main` (the working tree was found on a stale branch 71 commits behind).

---

## Workstreams
- **A · Agent-readiness (PUBLIC → main).** `llms.txt`/`llms-full.txt`, `robots.txt`,
  `sitemap.xml`, served `/data/*.json` API (trials, evidence atlas, whats-new, guidelines
  index, management cards, generic protocols, calculators index — versioned), JSON-LD
  (`MedicalWebPage`/`MedicalGuideline`/`FAQPage`) in `index.html`, published `schema.json`.
  Wired into `npm run build` + a validator.
- **B · Institutional currency (PRIVATE local extension, NEVER deployed).**
  Ingest June-2026 OneDrive source-of-truth into the `window.__INSTITUTIONAL_LOCAL__` shape
  (see `src/institutional-protocols.local.example.js`), per-protocol status `firm|provisional|draft`.
- **C · Stroke-CDS MCP server (PUBLIC → main).** Wrap calculators + protocol/evidence/trial
  lookup so agents can *call* the tool, not just read JSON.
- **D · Clinical-currency + hygiene (PUBLIC → main).** Wire 4 dangling `recommendationId`s,
  add ESCAPE-MeVO + DISTAL to the atlas, disambiguate HOPE-BP, ASPECTS 0-2 footnote;
  `vitest` exclude `.claude/**`; drop stale stash landmines.

## Progress log
- **2026-06-19 — Phase 0 (safety) DONE → PR #39** (`chore/safety-leak-guard-and-hygiene`).
  Added institutional/PHI **leak guard** (`scripts/check-no-institutional-leak.mjs` +
  `leak-guard-denylist.json`), 4 defense layers, and **untracked `.discovery/`** — a
  92-file dump of institutional source material that was tracked in the public repo.
  Full-tree guard: 244 files, 0 violations.

## Status (2026-06-19, end of autopilot session)
- ✅ **Safety** — leak guard (PR #39) + full git-history scrub of `.discovery` across all 14 branches (filter-repo, force-pushed). `main` clean; 0 commits touch `.discovery`.
- ✅ **A · Agent-readiness** (PR #40, merged) — `data/*.json` API + `llms.txt`/`robots.txt`/`sitemap.xml` + JSON-LD. `npm run agent:assets`.
- ✅ **C · MCP server** (PR #40, merged) — `mcp/` stdio server, 16 tools (smoke passes).
- ✅ **B · Private layer** (local-only) — gitignored local extension: 33 sections, 812 items, 20 contacts, 6 provisional/draft flagged. Verified end-to-end in a browser on localhost (injects + renders the "local -- not public" section); host-gate keeps it off `github.io`.
- 🔶 **D · Clinical-currency + hygiene** — vitest honest-count fix shipped (this PR). ESCAPE-MeVO/DISTAL + HOPE-BP already on main. See "Documented, not done" below.

## Documented, not done (need owner judgment / deliberate work)
- **4 dangling `recommendationId`s** in `src/management-guidance.js`: only `rec-ais-ivt-within-45h`→`rec-tnk-first-line` has a real atlas target; the other 3 (AIS-BP, MeVO, post-IVT-complications) have NO atlas rec — fixing means *authoring new cited recommendations*, not a mechanical repoint. Cosmetic (UI resolves via `COMMAND_CENTER_REC_TO_ATLAS_REC` fallback). Deferred.
- **ASPECTS 0-2 EVT row** already nuanced (IIa/B-R for *selected* patients w/ criteria); changing COR→IIb needs AHA/ASA-2026 verification, not a mechanical edit.
- **3 stale stashes** on `fix/qa-smoke-current-ui` are NON-trivial (app.jsx + a 168-line qa-smoke.mjs refactor) — NOT dropped. Owner: decide if any is worth recovering, else `git stash clear`.
- **Optional larger optimizations** (owner to direct): code-split the 36k-line `src/app.jsx` monolith (biggest perf/maintainability lever, higher risk on the committed-bundle model); bedside-productivity UI (deep-link share button, door-to-needle timer ring); more MCP calculator tools (NIHSS/ICH-score/ABCD2 score builders).

## Guardrails (do not violate)
- **Never** commit real institutional content, pager/phone numbers, room codes, or
  EPIC order-set IDs. They belong only in the gitignored local extension.
- Run `npm run hooks:install` once per clone to enable the pre-commit leak guard.
- The public generic `src/institutional-protocols.js` stays institution-neutral.

## Cross-device limits
- **Public workstreams (A, C, D)** are fully resumable on web/mobile via this repo.
- **Workstream B (private layer)** is tied to **this Mac**: the local extension is
  gitignored and is authored from OneDrive files that live on this machine. A cloud/mobile
  session cannot see them. Do the private layer here; do public work anywhere.
