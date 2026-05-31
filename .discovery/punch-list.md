# Stroke CDS Punch List — Phase 1 Synthesis (2026-05-02)

**Audience locked:** Senior UW/HMC vascular neurology faculty + neuro hospitalists + neurointensivists.
**Scoping decisions:** Flag-don't-strip non-local content (option c). Tablet/laptop primary; phone must be excellent. Identify broken/wrong/annoying issues myself.
**Inputs synthesized:** OneDrive extracts INDEX (16 priority docs + bonus + subfolder inventory), live Playwright UX audit (41 screenshots, ~50 issues), code grep cross-walk against canonical Pocket Cards v4 May 2026.

---

## Top-level verdict

The site is **more mature than the original ask implied.** v6.0 design tokens shipped a week ago and the foundation is well-conceived (warm cream paper, semantic 4-color palette, JetBrains Mono numerics, Manrope body, Newsreader serif headings). 427 vitest tests are green, evidence subsystem is sophisticated. But there are **real bugs, real content drift, and real responsive-design gaps** — and the 35K-line `app.jsx` monolith is the structural blocker for rapid iteration. None are catastrophic; together they fall short of "perfect for senior UW/HMC neurology."

**Five categories of work below.** Severities: 🔴 critical / 🟠 high / 🟡 medium / 🔵 enhancement.

---

## A. Critical / safety-relevant content drift

🔴 **C1. TNK window terminology is outdated vs Pocket Cards v4 (May 2026).**
- Site bins `<3h` vs `3-4.5h` (`src/app.jsx:561-566`).
- Pocket Cards v4 treats **≤4.5h as a single COR 1 LOE A bucket**. The 3h subdivision is legacy alteplase framing, not aligned with current TNK-first practice.
- **Fix:** collapse to ≤4.5h | 4.5-9h-or-wake-up (MRI) | 9-24h (CTP) per Card 1.

🔴 **C2. Source-of-truth split between `institutional-protocols.js` and `app.jsx` on labetalol escalation.**
- `src/institutional-protocols.js:31` correctly carries HMC protocol: "Labetalol 10 mg IV, repeat q15 min; escalate to 20 mg, then 40 mg, then 60 mg (max single bolus). Max 300 mg in 2h."
- `src/app.jsx:3304` still reads: "Use IV labetalol 10-20 mg or nicardipine 5 mg/hr…" (generic AHA/ASA wording).
- **Fix:** route the user-facing recommendation through the institutional-protocol object so HMC's actual escalation appears in the UI.

🔴 **C3. DOAC-exposed IVT — verify HMC anti-Xa-undetectable rule surfaces in encounter UI.**
- Logic exists in `src/institutional-protocols.js:215-272` with hub vs spoke branching.
- Pocket Cards v4 Card 3 requires HMC/UWML/UWNW to use **anti-Xa undetectable + attending attestation**, telestroke sites use **last dose ≥24h + normal renal + consent**.
- **Verify:** UI integration shows the right pathway when DOAC is selected; patient-discussion script (verbatim from Card 3) appears for the extended-window indication.

🟠 **C4. EVT eligibility matrix — verify every Card 4 row appears with correct COR/LOE.**
Required rows (per Pocket Cards v4 Card 4):
| Vessel | Time | ASPECTS | Add'l | Rec | COR | LOE |
|---|---|---|---|---|---|---|
| Anterior LVO | 0-6h | 6-10 | mRS 0-1 | EVT | 1 | A |
| Anterior LVO | 0-6h | 6-10 | mRS 2 | EVT | 2a | B-NR |
| Anterior LVO | 0-6h | 6-10 | mRS 3-4 | EVT | 2b | B-R |
| Anterior LVO | 0-6h | 3-5 | no mass effect | EVT | 1 | A |
| Anterior LVO | 0-6h | 0-2 | no mass effect | EVT | 2a | B-NR |
| Anterior LVO | 6-24h | 6-10 | — | EVT | 1 | A |
| Anterior LVO | 6-24h | 3-5 | age<80 | EVT | 2a | B-R |
| M2 distal | ≤24h | ≥6 | NIHSS≥6, dominant prox M2 | EVT | 2b | B-NR |
| Nondominant M2/ACA/PCA | — | — | — | **No EVT** | 3 NB | A |
| Basilar | ≤24h | pc-ASPECTS ≥6 | NIHSS≥10 | EVT | 2b | B-R |

🟡 **C5. Pre-EVT BP target without IVT** — `app.jsx:3322` says ≤185/110; Pocket Cards v4 doesn't explicitly state pre-EVT-only-no-IVT case. Source the citation explicitly (likely AHA/ASA 2026 IIa B-NR per the existing detail line).

🟠 **C6. Card 2 IVT contraindications matrix — verify completeness.**
Pocket Cards v4 has 9 absolute + 17 relative + 9 benefit>risk items. **Amyloid immunotherapy / ARIA** (2026 addition, IVT should be avoided due to unknown ICH risk) and **moderate-severe TBI <14 days** explicit threshold (GCS<13 OR hemorrhage/contusion/skull fracture) need verification in encounter contraindication checker.

---

## B. High-impact UX (multi-surface)

🔴 **U1. iOS auto-zoom on every input focus** — 35/46 inputs are 14px on phone. Trivial CSS fix (`text-base` / 16px floor on form inputs); massive ergonomic gain.

🔴 **U2. Resources dropdown clipped offscreen on phone** (`phone/11-resources-menu.png`). Half the menu unreachable. Add `right-0` flip behavior.

🔴 **U3. Resources `<details>` sticks open across route changes.** State bug — close on `popstate` / route effect.

🟠 **U4. No sticky header on laptop/tablet.** Clinician scrolls to NIHSS, loses search/⌘K/Resources/Generate Note. `position: sticky; top: 0; z-index: 40` on `<banner>`.

🟠 **U5. Single-column layout at every breakpoint.** Laptop/tablet waste 700-1000px horizontally. **Two-pane Encounter on ≥1024px** (form ~720px left, live handoff/note/safety-alert rail ~360px right) is the single biggest productivity win for tablet/laptop users.

🟠 **U6. 18/38 phone buttons <44×44.** Vessel chips, dose chips, "Now" button. WCAG 2.5.5 / Apple HIG.

🟠 **U7. Dark mode tokens broken on header chrome and Resources/More menus.** v6.0 token repaint didn't reach those surfaces.

🟠 **U8. Cmd+K palette anchored to search input, not centered modal.** Awkward on all viewports; especially poor on phone.

🟡 **U9. "Light mode" toggle copy is paradoxical.** Replace with "Theme: Light | Dark | System" segmented control.

🟡 **U10. No keyboard arrow-key nav between top tabs.** Standard ARIA tablist; senior-clinician audience expects it.

🟡 **U11. No in-page TOC/scrollspy on Encounter** even though Management has "Jump to Section". Mirror the pattern.

🟡 **U12. Phone header consumes ~30% of viewport** before content. 36-40px "Stroke" serif wordmark is excessive; reduce to 22-24px and collapse Resources/New Case/More into overflow icon.

🟡 **U13. Sub-tab strip on Management wraps into 2 jagged rows on phone** (4+3 with justified gaps). Use horizontal scroll-snap with hidden scrollbar instead.

🟡 **U14. Patient Info & History grid breaks asymmetrically** on phone+tablet (Sex column short, Weight column tall, gap below Sex). Fix grid template or flex layout.

🟡 **U15. Three different active-state pill treatments** (top tab blue / sub-tab black / bottom tab text+blue). Unify on one token.

🔵 **U16. References list is single-column on tablet/laptop** when 2-3 column grid would halve scroll length.

🔵 **U17. Trial cards waste horizontal space on tablet** — 2-column tile grid would be denser.

🔵 **U18. No phone bottom-bar Search affordance.** Add 4th pill or replace overflow with search.

---

## C. UW/HMC content gaps (Phase 2 alignment)

🟠 **G1. Pocket Cards v4 (May 2026) — full integration.** `src/pocket-cards.jsx` (483 lines) likely contains older content. Replace with verbatim transcription of all 5 cards as the canonical reference layer. Card-3 patient discussion script (the 9-11% absolute-benefit / ~3% sICH script) should be a one-tap copy.

🟠 **G2. HMC IP Code Stroke flow Nov 2024 — missing.** BEFAST trigger → x222 page → bedside checklist with explicit roles (primary RN, primary team provider, neuro team, STAT/ICU RN). Anna Kwak-Callen authored. Add as a Management → Wards or new Inpatient sub-tab.

🟠 **G3. Pulsara workflow** — minimal/missing. On-call provider responsibilities, login workflow, canned "mix TNK. ED, confirm order placed" message. Surface as a card on Encounter when consultation type = telestroke.

🟠 **G4. Direct-to-angio LVO criteria** (Oct 2025) — no lytics, ≤3h of last neuroimaging. Surface as decision card in Ischemic protocol.

🟡 **G5. Late-window IVT trial provenance map.** OneDrive has explicit imaging-modality → trial map: MRI DWI-FLAIR mismatch (WAKE-UP, THAWS, ROSE-TNK), CTP (EXTEND, TRACE-III, ECASS-4, HOPE) with mismatch volume thresholds. Enrich existing extended-window calculator with this provenance.

🟡 **G6. ReverseCoag 9_2025 — verify all 7 classes.** Warfarin / Heparin-LMWH / Argatroban-Bivalirudin / DOAC apixaban-rivaroxaban (with andexanet alfa low/high-dose decision tree) / DOAC dabigatran (idarucizumab) / antiplatelets / fibrinolytics. Lab thresholds, 4F-PCC dosing tables, andexanet alfa low/high criteria.

🟡 **G7. Inpatient Code Stroke order sets** (`Stroke Algorithm Updates June 2025/2025 Stroke Order Sets/`) — 19 PDFs. Site could link directly: ED Stroke, GEN IP Code Stroke, NCCS NSURG SAH, NEURO Acute Care Stroke IPH/Ischemic Admit, NEURO ICU Admit Stroke (4 variants), NEURO Post Thrombectomy, NEURO Tenecteplase, NEURO Post Thrombolytic Hemorrhage Reversal, Reversing Coagulopathies. These are Epic-deployed order sets — links + names is enough.

🟡 **G8. Pediatric AIS protocol** May 2026 (`Pediatric Stroke/`). Not the audience's daily work but neuro hospitalists may handle pediatric calls — flag as low-frequency reference.

🟡 **G9. Hyperacute Stroke MRI process** Apr 2026 (`Institutional Guidelines, Protocols/Code stroke MRI/`). Limited Hyperacute Stroke MRI process, hyperacute stroke MRI process pptx, Stroke code MRI EPIC + Pulsara protocol. Critical for late-window selection workflow at HMC.

🟡 **G10. ENRICH / MIS criteria** for ICH minimally-invasive evacuation (`Institutional Guidelines, Protocols/Minimally invasive surgery/`). Links to ENRICH RCT criteria + UW MIS protocol. Surface in ICH protocol.

🟡 **G11. ADAMTS13 testing in cryptogenic stroke** (`To be added to Telestroke website/Including ADAMTS13 testing in crytogenic stroke evaluation.docx` — note "crytogenic" typo in filename). Surface in TIA / cryptogenic workup.

🟡 **G12. Post-thrombectomy DECT imaging** protocol (`Stroke Algorithm Updates June 2025/Post thrombectomy imaging_DECT 2025.pdf`).

🟡 **G13. 2026 Internalized AIS Guidelines** — UW's own internalized AIS guideline draft (1.5 MB, Apr 2026, `Institutional Guidelines, Protocols/2026 Internalizing AIS guidelines/`). Once finalized, this is the single most important Phase 2 content source.

🟡 **G14. NCCS feedback on ICH BP mgmt algorithm** (Jun 2025) + ICH BP order sets folder (8 docs). Cross-walk against current site ICH BP recs.

🔵 **G15. WSO Hyperacute Essential Stroke Care Checklist** — international reference; flag with "not in HMC/UW protocol" badge per scoping (c).

🔵 **G16. Note templates** — `note-template-is-tia.md`, `note-template-ich.md` plus discharge summary templates exist. Site already has a note-generation system; consider whether to align dot-phrase content.

🔵 **G17. Communication with Neurosurgery SOP** — UW-specific stroke→nsurg communication protocol. Reference card in ICH/SAH.

---

## D. Code-quality / refactor (Phase 4)

🟠 **R1. `src/app.jsx` is 35,063 lines.** Break into: `router.jsx`, `encounter/` (sub-modules per form section), `management/` (one file per sub-tab: ich/ischemic/sah/tia/cvt/calculators/etc.), `trials.jsx`, `references.jsx`. Behavior-preserving refactor; vitest 427 + qa-smoke must remain green.

🟠 **R2. Source-of-truth split** (re: C2). Establish `institutional-protocols.js` as canonical for HMC/UWMC-specific dosing, escalation, thresholds. UI rendering should consume from there, never duplicate.

🟡 **R3. `src/pocket-cards.jsx` (483 lines) likely not aligned with Pocket Cards v4.** Full content swap.

🟡 **R4. 17 guideline JSONs — several stale by name:**
- `secondary-prevention-2021.json` (1306 lines) — AHA secondary prevention has had 2024 focused updates
- `ich-2022.json` (1002 lines) — current as of 2022 Greenberg; verify 2024-2026 additions
- `perioperative-stroke-2021.json` — 5 years old
- `poststroke-primary-care-2021.json` — 5 years old
- `cancer-stroke-2026.json`, `ais-2026.json`, `maternal-stroke-2026.json`, `poststroke-spasticity-2026.json` — recent, verify

🟡 **R5. Bundle 2.5 MB minified.** Code-split per route, lazy-load non-critical (teaching, references, trials). Target ≤1.8 MB.

🔵 **R6. Spelling typos in UW source files surface in extracts:** "Anteior" (should be Anterior), "crytogenic" (cryptogenic), "draftts/" (drafts), "Vasular". Some may have leaked into the app via copy-paste; grep the site.

---

## E. Flag as non-HMC/UW (per scoping decision c — keep with badge)

- **F1.** WSO Hyperacute Essential Stroke Care Checklist — international, not local.
- **F2.** DAWN/DEFUSE-3 framing where it's used as primary criterion rather than "supporting evidence" (Pocket Cards v4 supersedes the 2018 trial-criteria framing).
- **F3.** `workflowPersona` setting with non-senior options (Card audience-locked → senior is the only persona that matters; default + remove other choices).
- **F4.** Anything in `src/teaching.{js,jsx}` (~1215 lines combined) that teaches basics — your audience already knows; review for trim or move under a clearly-labeled "Education" section.
- **F5.** MDCalc-style category color coding that doubles up semantic meaning — keep but add inline legend.

---

## Recommended Phase 2 ordering

| # | Bucket | Items | Effort | Risk |
|---|---|---|---|---|
| **2A** | Quick wins + critical content drift | U1-U3 (phone bugs), U4 (sticky header), U7 (dark mode), U8 (cmdk modal), U9 (theme toggle), U12 (phone header), C1 (TNK window), C2 (labetalol sync) | 1 session | Low |
| **2B** | Pocket Cards v4 swap + HMC core protocols | G1 (Pocket Cards v4), G2 (IP Code Stroke), G3 (Pulsara), G4 (Direct-to-angio), G6 (ReverseCoag 7 classes), C3 (DOAC anti-Xa rule UI), C4 (EVT matrix), C6 (contraindications) | 1-2 sessions | Medium — content changes |
| **2C** | Content extension + HMC linkage | G5 (late-window provenance), G7 (order set links), G9 (Hyperacute MRI), G10 (ENRICH/MIS), G11 (ADAMTS13), G12 (DECT), G13 (Internalized AIS guideline when ready), G14 (NCCS ICH BP) | 1-2 sessions | Low — additive |
| **3** | Multi-surface UX redesign | U5 (two-pane laptop/tablet Encounter), U10 (ARIA tablist), U11 (Encounter TOC), U13-U18 (responsive grids, unified pill states, bottom-bar search) | 2 sessions | Medium — visual changes |
| **4** | Monolith refactor | R1-R5 + token unification | 1-2 sessions | Medium — large diff but behavior-preserving |
| **5** | Evidence linkage tightening | Citation chips on every actionable rec, "Why?" drawer everywhere, trial matcher always-on, currency check on JSONs (R4) | 1 session | Low |
| **6** | Cross-device verification + deploy | Manual phone/tablet/laptop walkthrough, qa-smoke + vitest, Lighthouse, CHANGELOG, deploy | 0.5 session | Low |

---

## Open questions for Rizwan before Phase 2 starts

1. **Native wrappers (Capacitor iOS/Android)** — freeze, or actively maintain? You didn't answer; default to freeze unless trivial.
2. **2026 Internalized AIS Guidelines (UW draft, Apr 2026)** — is this expected to land soon? If yes, defer G13 until final; if no, proceed off the draft.
3. **Note templates (G16)** — do you want the site's note generator to align dot-phrase output to the UW templates exactly (`IS-TIA admit, progress note templates.docx`), or does the existing site-generated note suit you?
4. **Pediatric (G8)** — keep at low-frequency reference layer or deprioritize entirely?
5. **`workflowPersona` (F3)** — confirm OK to delete non-senior options, or keep them visible but flagged?
