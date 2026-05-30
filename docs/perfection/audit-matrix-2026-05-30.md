# StrokeOps Perfection Campaign — Audit Matrix (2026-05-30)

Status of each required audit dimension across iterations. `CLEAN` = the dimension's parallel audit found zero
SAFE+MATERIAL (P0/P1/P2) findings that cycle. `n×P0/P1/P2` = count + max priority of blocking findings fixed.
Live baseline at campaign start: **v6.5.0**.

| # | Audit dimension | It1 (6.6.x) | It2 (6.7.0) | It3 (6.8.0) | It4 (6.8.1) | It5 (6.8.2) | It6 (6.8.3) | It7 (6.8.4) | It8 (Cycle 8) | It9 (Cycle 9) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Clinical accuracy & evidence currency | **P0** ×3 (instit. leak, AF-timing, fabricated stats) | **P0** ×2 (11 wrong PMIDs, fabricated appraisal) | **P0** ×1 (6 inline PMIDs) | CLEAN | P2 (18 non-rendered PMIDs, hygiene) | CLEAN | CLEAN | **CLEAN** | ⏳ workflow |
| 2 | Usability across devices (phone→1920) | P1 (theme/contrast device-wide) | P1 ×3 (edu search, nav overprint, Encounter squeeze) | P1 ×2 (sticky strip, sidebar clip) | CLEAN | P1 (refs/calc deep states) | P1 (caveat-pill card distortion) | P1 (COR/LOE+PHQ-9 phone clip) | ⏳ workflow | ⏳ workflow |
| 3 | Aesthetic quality (Claude Design) | P1 (dark mode coherence) | P2 (CLS/layout) | P2 (DAPT empty state) | CLEAN | P2 (TRAGUS clip) | P1 (caveat distortion, TRAGUS) | P1 (TRAGUS negative-offset) | ⏳ workflow | ⏳ workflow |
| 4 | Interaction quality | P2 (palette focus, TOC) | P1 (offline dead-end loop) | P1 (radiogroup-in-menu, link color-only) | CLEAN | P1 (unlabeled selects) | CLEAN | P1 (date/time labels) | ⏳ workflow | ⏳ workflow |
| 5 | Accessibility (WCAG 2.1 AA) | P1 (1540 dark + 46 light contrast) | P1 (tables, landmark, headings) | P1 (menuitemradio, underlines) | P1 (M4-1 + 41-node tail) | P1 (PHQ-9 radios, 14 wash-badges) | P1 (landmark-unique, heading-order) | P1 (mobile-nav landmark, table class) | ⏳ workflow | ⏳ workflow |
| 6 | Performance & PWA | P1 (C1 offline precache) | P1 (CLS 1.0, dead-end) | **CLEAN** | CLEAN | CLEAN | CLEAN | CLEAN | **CLEAN** | ⏳ workflow |
| 7 | Public compliance & privacy | **P0** (institutional leak) → fixed+CI guard | **CLEAN** | CLEAN | CLEAN | CLEAN | CLEAN | CLEAN | **CLEAN** | ⏳ workflow |
| 8 | Error-free operation | P1 (theme/console/cache) | P1 (offline, cache) | CLEAN | CLEAN | CLEAN | CLEAN | CLEAN | **CLEAN** | ⏳ workflow |

## Convergence counter
- The stop criterion is **two consecutive cycles with zero P0/P1/P2 safe+material+source-verifiable findings.**
- Cycles 1–7: every cycle found ≥1 blocking item → counter never started. **The findings shrank monotonically
  and shifted from site-wide P0 breaches (Cycle 1) to single state-gated stragglers in satellite files
  (Cycle 7) — the loop working as designed.**
- Cycle 8: evidence + perf/PWA + public-safety **CLEAN** (3/5); a11y + visual pending (workflow).
- Convergence achieved only when Cycle 8 AND Cycle 9 are both fully clean across all 8 dimensions.

## Defect classes closed (durably, via static enumeration across all files)
| Class | Closed in | Mechanism |
|---|---|---|
| Real institutional identifiers in bundle | It1 | scrub + `tests/no-institutional-identifiers.test.js` CI guard (scans built app.js+index.html) |
| Wrong-article citation PMIDs | It2–It5 | corrected 11 rendered + 6 inline + 18 non-rendered; `--check-identifiers` content cross-check guards in CI |
| Fabricated appraisal text | It2 | generator-level `isFabricatedResults`/`safeResults` (durable vs weekly briefing) |
| Dark-mode `color-contrast` | It1,It4 | tokens.css `[data-theme=dark]` remap + 41-node calculator-state tail |
| Light-mode `color-contrast` | It1 | source-level darken (slate/orange 600→700) |
| Semantic-wash-badge contrast (dark) | It5 | 14-pair static sweep → `dark:bg-*-950` + `--tag-*` vars |
| Wide-table keyboard-scroll / phone-clip | It2,It7 | 21-table inventory across ALL files → standard `overflow-x-auto tabIndex=0 role=region` |
| Landmark structure (main/region/nav) | It2,It6,It7 | single `main`, unique region labels, mobile-nav landmark |
| Heading-order | It2,It3,It6,It7 | contiguous outline, tag-only (appearance preserved) |
| Form-control labels (select/radio/date-time) | It1,It2,It5,It7 | id+htmlFor / aria-label across calculators + PHQ-9 + phone path |
| SVG simulator label placement | It5,It6,It7 | EvdIcp TRAGUS + error annotation verified across full offset range |
| Theme-system coherence | It1 | unified 3-way control; all 3 surfaces (theme.js + app.jsx + inline pre-paint) agree |
| Offline-reload resilience | It2 | SW serves cached shell first; offline.html link → real nav |
| CLS | It2 | static `#root` min-height pre-paint (1.0 → ~0) |

## Validation gates (run every cycle; all green at v6.8.4)
`npm run build` · `npm run lint:tokens` · `npm run lint:contrast` (21/21) · `npx vitest run` (5688/5688) ·
`npm run validate:citations` (+`--check-identifiers` 0) · `npm run validate:inline-citations`
(+`--check-identifiers` 0) · `npm run evidence:validate` · `npm run validate:whats-new` (21 verified + 29
unverified, partition intact) · institutional-identifier grep on built bundle (0) · axe-core full matrix
(0 across all rules, both themes) · live Pages smoke after each deploy.
