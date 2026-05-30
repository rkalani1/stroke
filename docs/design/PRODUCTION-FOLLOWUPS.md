# Production Follow-ups (non-blocking)

Cross-phase items surfaced by reviews during the v6→production rebuild
(branch `feat/currency-ux-perf-2026`). None block deployment; all are
data-hygiene / polish. Tracked here so they survive into post-launch work.

## Phase 2 — What's New
- **Source-gap auto-verify:** 29 of 50 briefing studies are unverified (mostly
  conference late-breakers without a DOI). `whats-new-source-gaps.md` lists each
  + the fix (embed the article DOI in the briefing). Update the Gemini briefing
  agent to include `https://doi.org/...` links so more auto-verify each Monday.
- **vitest worktree noise:** `vitest` (no config exclude) also scans stale
  duplicate test copies under untracked `.claude/worktrees/`, inflating the count
  to 5608 (real `src/`+`tests/` suite is ~472). All pass, so no false-green, but
  add a `vitest.config` `exclude: ['.claude/**']` so the gate number is honest.

## Phase 3 — Institutional Protocols & Algorithms (AIS Command Center)
Clinical-accuracy review (2026-05-30, stroke subagent vs AHA/ASA 2026 JSON +
verified atlas): **SAFE TO SHIP, no FIX/REMOVE.** Non-blocking follow-ups:
1. **Wire 4 dangling `recommendationId`s** in `src/management-guidance.js`
   (`rec-ais-ivt-within-45h` → real id is `rec-tnk-first-line`; `rec-ais-bp-targets`,
   `rec-ais-mevo-no-routine-evt`, `rec-ais-post-ivt-complications`). The UI uses a
   separate `COMMAND_CENTER_REC_TO_ATLAS_REC` map (3 resolve, 3 PubMed-fallback),
   so these are cosmetic in the data file — but create matching atlas recs (or
   repoint) so the source is self-consistent.
2. **Add ESCAPE-MeVO** (NEJM 2025, neutral) to `src/evidence/completedTrials.js`
   so the MeVO card's Class III claim is backed by the verified atlas, not just an
   `evidenceQuery` string.
3. **Disambiguate "HOPE-BP"** (the card's ESOC-2026 post-EVT BP descriptor) from
   the published late-window-IVT "HOPE" referenced in the extended-IVT card —
   label it "HOPE (ESOC 2026, post-EVT BP)".
4. **Footnote the ASPECTS 0-2 EVT row** as a IIb/under-enrolled zone per the 2026
   guideline (card already hedges; this just tightens it).

## Housekeeping
- `~/.claude/CLAUDE.md` model line says "Opus 4.7"; running model is Opus 4.8 —
  update when convenient.
- Old `fix/qa-smoke-current-ui` stashes (×3) are landmines in `git stash list`
  (an undisciplined agent stash-popped one mid-build, causing a recoverable
  working-tree conflict). Consider dropping them once confirmed obsolete.
