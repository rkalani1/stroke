# REFACTOR_MAP.md — Phase-1 Audit Synthesis

Stroke clinical-decision-support SPA. Single bundle `src/app.jsx` = **36,224 lines** (esbuild → `app.js`), React 18, hash routing, no router lib. GitHub Pages, `PUBLIC_DEMO_MODE` on any `*.github.io` host.

**Purpose of the coming refactor (Phases 2–6):** (a) extract clinical content into schema-validated `/content`, (b) de-duplicate shared concepts to one canonical source, (c) centralize calculators + citations, (d) add a Telestroke / Inpatient / Clinic context switch.

**HARD CONSTRAINT (non-negotiable):** the Example Protocols tab (`activeTab === 'protocols'`, subtabs `ich/ischemic/sah/tia/cvt/calculators`, routes `#/protocols/*`, rendered in `app.jsx` **27678–33582**) must keep clinical wording **byte-identical**. A lock harness already exists (`scripts/snapshot-example-protocols.mjs`) — see §7.

> Provenance: full findings in `scratchpad/audit/*.json` (11 app-slice files `app-1..app-11`, 4 module files `mod-*`, 11 duplication files `dup-*`). Line numbers are from the audited HEAD (`feat/v1-polish-privacy-2026-07`, app version 6.11.1). Treat as a map, not a spec; re-grep before editing.

---

## 1. Route inventory

Routing lives in module-scope helpers `parseHashRoute` (app.jsx **1072–1123**), `buildHashRoute` (**1125–1148**), `VALID_TABS` (**1061**), `MANAGEMENT_SUBTABS` (**1028**), `RESEARCH_SUBTABS` (**1030**), `LEGACY_MANAGEMENT_TABS` (**1032–1043**), and normalizers `normalizeManagementSubTab`/`normalizeResearchSubTab` (**1044–1059**). Runtime resolution effect: `resolveRoute()` (**16076–16135**); hash write-back (**16138–16147**). Central navigator `navigateTo` (**8017–8061**) is the one choke point (legacy remap + `uiState` persistence).

### Canonical tabs → owning render region

| Tab (`activeTab`) | Hash | Owning render region (app.jsx) | Notes |
|---|---|---|---|
| encounter | `#/encounter`, `#/`, `#` | **17206–27677** | Also `#/dashboard`, `#/home` (legacy) → encounter |
| protocols | `#/protocols[/{sub}]` | **27678–33582** | **BYTE-FROZEN ZONE** |
| research | `#/research[/{sub}]` | **33583–35709** | Guidelines & References |
| trials | `#/trials` | **35710–35791** | Two external iframes; no local data |
| education | `#/education[/{sub}]` | **35792–35808** → `src/education.jsx` | sub = module id (open enum) |
| settings | `#/settings` | **35809–35906** | API provider form |

### Subtab enums

| Group | Values | Const |
|---|---|---|
| protocols (managementSubTab) | `ich, ischemic, sah, tia, cvt, calculators` | `MANAGEMENT_SUBTABS` (1028) |
| research (researchSubTab) | `guidelines, references` **+ hidden `whatsnew`** | `RESEARCH_SUBTABS` (1030); `whatsnew` reachable only via alias normalization (1053–1059), NOT in the enum |
| education | module ids (e.g. `toast-classification`), `null` = gallery | no fixed enum; `EDUCATION_MODULES` in education.jsx 206–423 |

### Legacy aliases → resolution (all must keep resolving identically)

| Legacy hash / tab | Resolves to | Source |
|---|---|---|
| `#/management/*`, `#/library/*` | `#/protocols/*` (identical handling) | parseHashRoute; `management`/`library` in `VALID_TABS` but normalized away by parse/build |
| `#/ich` | `{protocols, ich}` | parseHashRoute |
| `#/calculators` | `{protocols, calculators}` | parseHashRoute |
| `#/evidence`, `#/teaching`, `#/references` | `{research, references}` | parseHashRoute |
| `#/research/{whats-new, what's-new, whatsnew}` | `{research, whatsnew}` | normalizeResearchSubTab |
| `#/protocols/simulators` | `{education, simulators}` | parseHashRoute |
| `#/protocols/references` | `{research, references}` | parseHashRoute (intercepts before normalizeManagementSubTab) |
| `#/protocols/{protocols, clinic, wards, pocket-cards}` | `{protocols, ischemic}` | LEGACY_MANAGEMENT_TABS |
| `#/protocols/{evidence, teaching}` | `{protocols, references}` (latent quirk; `references` not a valid protocols sub) | normalizeManagementSubTab via LEGACY_MANAGEMENT_TABS |
| `#/dashboard`, `#/home` | encounter | parseHashRoute |

**Context-switch collision warning (goal d):** `LEGACY_MANAGEMENT_TABS` still redirects old **`clinic`** and **`wards`** subtabs → `ischemic` (1040–1041), and CHANGELOG v2.6 (app.jsx 687) records that inpatient/clinic *contexts* were previously **removed**. A new Telestroke/Inpatient/Clinic switch must not reuse those alias tokens as routes. Existing seams to extend instead: `consultationType` (`telephone`|`videoTelestroke`), `clinicalContext` (`acute`|`phone`, set at 17404–17405 and via `mode` palette command 14452–14467), `roleOptions` (`consult/attending/ed/icu/transfer`, 16461–16479), `settings.workflowPersona` (899–906), and `recommendations.js` `setting` enum (`inpatient|outpatient|pre-facility|all`).

---

## 2. Component inventory — app.jsx internal geography

`app.jsx` is essentially **one 34k-line closure** (`StrokeClinicalTool`, starts **1197**). Almost every "constant" (bpPhaseTargets, protocolDetailMap, trialsData, ANTICOAGULANT_INFO, GUIDELINE_RECOMMENDATIONS, etc.) is declared **inside** that render closure, so extraction requires lifting to module scope and threading via context/props.

### Module-scope (before StrokeClinicalTool)

| Region | Lines | Contents |
|---|---|---|
| Imports | 4–176 | calculators (4–26), calculators-extended (75–112), institutional-protocols (113), theme (114–122), 17 guideline JSONs (124–140), management-guidance (144–148), whats-new.json, evidence atlas barrel (157–176), matcher-engine (201–205) |
| `window.strokeP0` QA shim | 205–229 | 15 P0 calculators on window; stale `version '5.20.0'`; also defeats tree-shaking |
| `V7HeroReadoutTicker` | 238–261 | Hardcodes TNK window 270 min, EVT 1440 min (249–250) |
| Storage layer | 263–436 | `STORAGE_PREFIX 'strokeApp:'`, `APP_DATA_KEY 'stroke.appData.v2'`, 28 LEGACY_KEYS, TTL 12h, `PUBLIC_DEMO_MODE` (304–314), migrations (419–436) |
| Toast/Confirm/ErrorBoundary | 465–653 | UI primitives; ErrorBoundary excludes PII by policy (573) |
| `ENCOUNTER_TEMPLATES` | 658–667 | 8 templates |
| `CLINICAL_PEARLS` | 672–680 | 7 pearls, densest hardcoded-fact block |
| `CHANGELOG` | 685–693 | Stale (stops v3.4); embeds clinical assertions |
| `parseBloodPressure` | 695–703 | Regex BP parser |
| `getWindowStatusFromTime` / `useStrokeWindow` | 705–759 | 4.5/6/24h window taxonomy |
| clipboard packs / default settings / appData | 856–966 | `getDefaultClipboardPacks` (4 packs), `getDefaultSettings`, migrations |
| Route constants + normalizers | 1028–1148 | see §1 |
| `AutoDetectedContraindicationsBanner` | 1151–1195 | |

### Inside StrokeClinicalTool (1197+) — data constants declared in render closure

| Constant / function | Lines | Kind |
|---|---|---|
| `defaultTelestrokeTemplate` (localStorage `telestrokeTemplate`) | 1198–1226 | note template; hardcodes "sx ICH of up to 4%" (1220) |
| `getDefaultTelestrokeNote` | 1271–1972 | ~700-line central encounter state; `tnkContraindicationChecklist` = 27 items (1405–1434), `ldlTarget '<70'`, EXTEND criteria |
| state hooks (calculators, UI, PWA, search) | 2019–2592 | ~18 calculator state atoms; `apiProvider/apiKey` (2588–2592) |
| `ENCOUNTER_TOC_SECTIONS` | 2114–2119 | 4 phase markers + scrollspy |
| `bpPhaseTargets` | 2700–2718 | 11 BP-phase target map |
| `protocolDetailMap` (useMemo) | 2725–2833 | 24 drug/reversal/BP/seizure protocol cards |
| `trialsData` | 2864–3368 | 13 trials w/ verbatim inclusion/exclusion (MOCHA has PMC id in nct field) |
| `ANTICOAGULANT_INFO` | 3382–3495 | 8 drugs incl `ichReversal` |
| `GUIDELINE_URLS` | 3503–3540 | ~37 name→URL |
| `GUIDELINE_LIBRARY` / `_INDEX` / `_CLASS_COLORS` | 3558–3596 | 17 imported JSONs (GOOD pattern); omits landmark-trials.json |
| `GUIDELINE_RECOMMENDATIONS` | 3598–5950 | **~124 recommendation cards** w/ prose + `conditions(data)=>bool` predicates |
| trial/pathway helpers, `renderTrialCard` | 5952–6263 | |
| inline clinical logic (wake-up, TIA dispo, CVT special-pop, DOAC timing, post-EVT BP, contraindication trace, BP badge, DTN, `detectContraindications`) | 6450–7259 | see §3 |
| `calculate4FPCC` (inline DUP) | 6884–6922 | duplicates `calculatePCCDose` |
| nav/palette/shortcuts (`navigateTo`, `gotoProtocolsSub`, `paletteCommands`, keyboard) | 7796–8163 | `paletteCommands` = 30-entry static index |
| `DOC_TEMPLATES` (tnk/evt risk-benefit, postTnk, postEvt) | 8629–8634 | |
| note generators (`generateTelestrokeNoteBody` 7 branches + 3 summarizers) | 8779–12314 | ~2950-line function; §3 |
| `getEvtEligibilityRecommendation` | 12363–12503 | full EVT eligibility engine in note region |
| `CalculatorSync` / `CalculatorPatientSnapshot` | 12532–12608 | one-way patient→calculator sync |
| `getSanityChecks` | 12613–13287 | ~95 rules |
| `getOrderBundles` | 13292–13735 | 13 order sets |
| `applyDiagnosisSelection` | 13812–13900 | pathway reset (near-dup of palette dx cmd 14327–14399) |
| search registries (`QUICK_SEARCH_COMMANDS`, `performSearch`, `searchableItems`, `evidenceDocuments`, `guidelineQuickActions`) | 14007–14873 | 4 hand-maintained indexes |
| case snapshot / persistence / TNK auto-block / timers / de-ID | 14875–15911 | |
| `generateHPI` / `generateAdmissionOrders` | 16250–16347 | 3rd copy of BP targets |
| **JSX return begins** | 16511 | header shell, timer strip, 5-tab nav |
| encounter tab | 17206–27677 | §3 |
| protocols tab | 27678–33582 | **BYTE-FROZEN**, §3/§7 |
| research tab | 33583–35709 | §3 |
| trials / education / settings / tail chrome | 35710–36224 | |

### Content-bearing modules outside app.jsx

| File | Lines | Role |
|---|---|---|
| `src/education.jsx` | 4710 | Education tab: 17-module registry + ~60 inline PMIDs, 17 pocket cards (SVG/JSX prose), 5 orphaned calculators (ASTRAL/PLAN/ICH), guideline-library UI |
| `src/calculators.js` | 487 | 19 canonical calc fns |
| `src/calculators-extended.js` | 1348 | ~35 calc/advisory fns + `getAIConfiguration` |
| `src/institutional-protocols.js` | 637 | BP protocols + IVT contraindications + COR key + ICH algorithm (data) and evaluateIVT/EVT/DOAC (fns) |
| `src/management-guidance.js` | 357 | `AIS_COMMAND_CENTER_CARDS` (renders **inside frozen ischemic subtab**) |
| `src/pocket-cards.jsx` | 487 | PocketCards (consumes institutional-protocols) |
| `src/teaching.js` / `.jsx` | 304 / 337 | teaching data + `LandmarkTrialsCard`; `TeachingModule` exported but unused |
| `src/components.jsx` | 799 | shared components; imports calculators-extended |
| `src/simulators/*` | ~2528 | 4 self-contained simulators (EvdIcp, Hints, Pupillometry, NeuroExams) |
| `src/components/EligibilityTables.jsx`, `TrialScreener.jsx` | 350 / 902 | **GOOD PATTERN**: pure renderers over `src/evidence/*` |
| `src/evidence/*` | see §6 | schema-validated Evidence Atlas |

---

## 3. Content-block inventory (clinical surfaces)

Kind legend: **inline** = hardcoded JSX/JS string literal in app.jsx; **module** = imported from a content module; **data-driven** = rendered from a structured data source.

| Surface | Location | Kind | Notes |
|---|---|---|---|
| **Protocols: ICH subtab** | app.jsx 27966–28750 | inline (95%) | Warfarin/DOAC reversal, post-lytic ICH, ECASS HT, angioedema, ABC/2, MIE/ENRICH, hematoma expansion, IVH, disposition, seizure, anticoag restart, supportive bundle. Only imports: `ICH_INITIAL_EVALUATION_ALGORITHM` (module, 27983–28042); drug modal text via inline `protocolDetailMap` |
| **Protocols: Ischemic subtab** | app.jsx 28758–30435 | inline + module | `AIS_COMMAND_CENTER_CARDS` from management-guidance.js (module, 28808–28996 — **frozen**); everything else inline: EVT eligibility flowchart, post-EVT BP guardrail, pediatric, AF/DOAC timing, BP titration tables, NBO, post-lytic ICH, ECASS (2nd copy), angioedema (2nd copy), antiplatelet loading, statin, large-core trial matrix, MeVO, contrast allergy (inline CrCl), ICAD, posterior circ, CAD, seizure ppx; `PocketCards` (module, 30420–30435) |
| **Protocols: SAH subtab** | app.jsx 30441–30719 | inline | first-hour, Fisher/Modified Fisher, rebleed timeline, BP by phase, vasospasm/DCI, CSW-vs-SIADH, ICU bundle |
| **Protocols: TIA subtab** | app.jsx 30724–31027 | inline | disposition engine, ABCD2 risk table, imaging, DAPT + CYP2C19 + phenotype matrix, workup, carotid, secondary prevention |
| **Protocols: CVT subtab** | app.jsx 31030–31358 | inline | richest CVT prose: acute checklist, timeline/escalation, risk factors, imaging, EVT, long-term anticoag table, special populations |
| **Protocols: Calculators subtab** | app.jsx 31360–33565 | inline strings + imported math | ~25 calculator cards; math split imported (ABCD2/GCS/ICH/CHADS/HASBLED/ROPE/RCVS2/PHASES/ICHVol/Andexanet/CrCl/Enox/Alteplase) vs **inline-computed** (FUNC/ASPECTS/PC-ASPECTS/SPAN-100/SEDAN/DRAGON/mTICI/embedded ABC-2); ALL display/interp/citation strings inline |
| Encounter form (phone + video) | app.jsx 17206–22400 | inline | Entire form duplicated by `consultationType`; 3 independent inline TNK-eligibility rule systems; AHA/ASA 2026 Table 8 (40-item, 21065–21362) is canonical encounter contraindication list |
| Encounter guideline recs panel | app.jsx 21975–22115 | data-driven | via `getContextualRecommendations` + atlas; `MANAGEMENT_REC_TO_ATLAS_REC` map hardcoded inline in render (22051–22063) |
| Encounter trial matcher | app.jsx 22117–22323 | data-driven | over `evidenceActiveTrials`; coexists with static `<ul>` trial lists (20958–20983) that can contradict it |
| Documentation templates | app.jsx 8629–12314 | inline | `DOC_TEMPLATES` + 7 note branches + 3 summarizers; ~20 clinical sections re-implemented 4–8× each |
| Guidelines subtab | app.jsx 33618–33651 | data-driven | `GUIDELINE_LIBRARY_INDEX` → 17 `src/guidelines/*.json` |
| Reference Library | app.jsx 33653–35698 | mixed | data-driven: Major Trials (evidence atlas), Guideline Recs (recommendations.js claim-chain), Guideline Library (guidelines JSON). **inline prose**: HINTS (33901), CVT monitoring (33936), prognostication (33984), pearls/pitfalls (34029/34084), imaging FU (34157), code-stroke/RACE (34242), mimics (34306), spinal cord (34347), CTP (34382), chameleons (34444), admission orders (34480); ~20 hardcoded `documents/*` PDF paths (34806–35698) |
| Trials tab | app.jsx 35710–35789 | external iframes | `rkalani1.github.io/stroke-trials-screener` + `/stroke-eligibility-tables-embed`; no local data |
| Education tab | src/education.jsx | inline (SVG/JSX prose) | 17 modules + 17 pocket cards + 5 calculators + guideline UI |
| Simulators | src/simulators/* | inline constants | self-contained; own physiology/classifier constants; each has a test |
| Eligibility tables / Trial screener | src/components/* over src/evidence/* | data-driven | **GOOD PATTERN** to emulate |
| Landmark trials | src/guidelines/landmark-trials.json → teaching.js | module | domain-keyed; overlaps completedTrials.js |
| Evidence Atlas | src/evidence/* | schema-validated data | §6 |

---

## 4. Duplication matrix

For each concept: authoring locations, key divergences, recommended canonical home. Full detail per topic in the named `scratchpad/audit/dup-*.json`.

### 4.1 ICP / EVD / osmotherapy (`dup-icp-evd.json`)
- **Locations:** app.jsx 4261–5655 (management-guidance data), 13572–13584 (crisis order set), 24746–24991 (telestroke osmo calculator); protocols prose 28451–31207 / 33879–34570 (**frozen**); education.jsx 2498–2608 (herniation card); `EvdIcpSimulator.jsx` 105–790; `PupillometrySimulator.jsx` 109–130; guideline JSONs (verbatim). **5 independent app copies + verbatim guideline JSON.**
- **Divergences:** mannitol osmolar-gap hold: `>20` everywhere **except EvdIcpSimulator.jsx:783 = `>55` (likely a genuine content bug)**; mannitol dose 0.5–1 g/kg vs 1 g/kg fixed; HTS 3% bolus 250 vs 150–250 vs 250–500 mL; CPP target `>60` vs implied `≥70`. 23.4% HTS 30 mL is consistent (good baseline).
- **Canonical home:** one `/content/osmotherapy` record (dosing + hold thresholds + CPP target), seeded from app.jsx 5654–5655 reconciled with 13572–13584 and education.jsx 2505–2507; centralize interactive osmolality/gap logic into `src/calculators*.js`. **Fix EvdIcpSimulator.jsx:783 `>55`→`>20` first.** Do NOT rewrite frozen protocols prose.

### 4.2 HINTS / posterior circulation (`dup-hints-posterior.json`)
- **Locations:** `HintsSimulator.jsx` (richest logic, `classifyHints` 141–164); app.jsx ref-hints 33901–33936 (only holder of sens 96.8%/spec 98.5% + Kattah 2009/Newman-Toker 2008); protocols posterior-circ 30229–30306 (**frozen**); app.jsx mimics 34284/34322/34456; encounter 18980–19263; teaching.js 182/267–268.
- **Divergences:** **teaching.js:182 is clinically wrong** ("normal HIT + direction-changing nystagmus → peripheral" — those are CENTRAL signs; contradicts its own flashcard at 268); sens/spec numbers only in one copy; HINTS+ hearing component only in simulator.
- **Canonical home:** keep `classifyHints()` as canonical LOGIC; extract `content/exams/hints-avs.json` (4 components, isCentral rule, INFARCT mnemonic, stats, citation ids); re-point ref-hints (research, refactor-safe) + teaching.js + encounter. **Fix teaching.js:182.** Protocols posterior-circ stays byte-identical.

### 4.3 CVT (`dup-cvt.json`)
- **Locations:** protocols/cvt 31029–31358 (**frozen**, richest); encounter 22698–22815; anticoag-phases 25952–26001; clinical-decision entries 4763–4900; order-set 13683–13716; patient-ed 10708–10786; helper `getCvtSpecialPopulationPlan` 6606–6662 (the one centralized bit); guideline `cvt-2024.json`; evidence citations/guidelines/topics.
- **Divergences:** **seizure prophylaxis contradiction** — protocol (31082) "routine prophylaxis NOT recommended" vs order-set (13716) "Levetiracetam 500–1000 mg q12h if supratentorial"; anticoag duration phrased ≥5 ways; attribution AHA vs CSBP inconsistent.
- **Canonical home:** `/content/cvt.json` seeded from protocols wording, using `getCvtSpecialPopulationPlan` as data-shape model; re-point 4 encounter surfaces + patient-ed. Reconcile seizure contradiction. Only render protocols subtab from it if snapshot proves byte-identical; else keep literal.

### 4.4 Prognosis scores (`dup-prognosis.json`)
- **Locations:** `calculators.js:103` `calculateICHScore` (canonical) vs `education.jsx:2865` `calculateIchScore` (DUP, incompatible gcs signature); protocols ICH-Score/FUNC/SPAN-SEDAN-DRAGON 31779–33580 (**frozen**, FUNC authored ONLY here); encounter SEDAN/SPAN 7192/19096; ASTRAL/PLAN orphaned in education.jsx 2786–2864; `calculateSPI2` in calculators-extended.
- **Divergences:** ICH score-4 mortality: app.jsx **97%** (Hemphill, correct) vs education.jsx **94%** (outlier); ICH input contract mismatch (enum vs numeric); FUNC volume-tier inconsistency (code 4 tiers vs label 3 tiers).
- **Canonical home:** promote `calculators.js:calculateICHScore`, delete education dup, fix 94%→97%; extract FUNC/DRAGON/SEDAN/SPAN-100 into calculators.js and have encounter + (eventually) protocols call shared fns; register ASTRAL/PLAN in calculators-index. Frozen protocols ranges stay literal.

### 4.5 Calculators (`dup-calculators.json`)
- **Locations:** `calculators.js` (17–487) + `calculators-extended.js` (16–1332) = canonical compute layer. **3 catalog copies:** generate-agent-assets.mjs 99–124 (24 rows), data/calculators-index.json (generated), app.jsx palette/search/deep-link (8100–8130, 14009, 14735). UI wording inline in app.jsx (nihssItems 6415, score bands, dosing prose 33198) and protocols (frozen).
- **Divergences:** catalog completeness drift (24 catalogued vs ~60 fns); display-name drift ("ABCD² Score" vs "ABCD² (TIA risk)"); enoxaparin numbers stated in code AND prose; two legitimate CHA2DS2 variants (`calculateCHADS2VascScore` legacy w/ sex vs `calculateCHADS2VA` 2024 ESC — **must NOT merge**).
- **Canonical home:** compute already centralized (keep). Export one `CALCULATOR_CATALOG` from compute modules; derive generator + palette + data index from it. Extract display wording to `/content` keyed by calc id. Migrate inline-computed logic (FUNC/ASPECTS/PC-ASPECTS/SPAN-100/SEDAN/DRAGON/mTICI/embedded ABC-2) into calculators.js. Context switch filters the catalog by surface, not forks it.

### 4.6 BP targets / thrombolysis dosing / post-lytic monitoring (`dup-bp-tnk.json`)
- **Locations:** `bpPhaseTargets` (2700–2712, strongest canonical candidate) vs independent `getBPThresholdStatus` MAX_SBP=185 constants (6820–6870) vs GUIDELINE_RECOMMENDATIONS bp_* (3600–5503) vs getSanityChecks/getOrderBundles (12615–13560) vs DOC_TEMPLATES (8629–8635) vs protocols (frozen, incl inline TNK recompute 31384) vs `calculators.js:calculateTNKDose` (414) vs management-guidance.js (34–297) vs institutional-protocols.js (30–70) vs evidence/recommendations.js (105–128) vs completedTrials.js (safetyFindings) vs `ais-2026.json` (verbatim upstream).
- **Divergences:** AcT sICH "3.4% vs 3.2%" (app.jsx:673) not matched by completedTrials.js ("Similar to alteplase"); 185/110 hardcoded ≥5 independent spots; TNK 0.25 mg/kg math duplicated (calculators.js vs inline 31384); post-lytic cadence `q15×2h/q30×6h/q1h×16h` (dominant) vs `q30×4h` tail (10350) vs nursing flowsheet `q15×4/q30×4` — 3 cadence variants; post-EVT "72h" vs "24h" framing.
- **Canonical home:** 4 layers — BP targets → `bpPhaseTargets`→`/content`; TNK math → `calculateTNKDose` only (delete inline 31384); BP med/titration + ONE monitoring-schedule constant → institutional-protocols.js; trial sICH numbers → completedTrials.js/citations.js. Frozen protocols guarded by snapshot.

### 4.7 Anticoagulation reversal (`dup-reversal-anticoag.json`)
- **Locations:** `ANTICOAGULANT_INFO` (3382–3496, richest structured) vs `protocolDetailMap` (2725–2811) vs GUIDELINE_RECS reversal_* (4030–4133) vs `reversalOrders` order builder (13415–13513) vs **dead** `calculate4FPCC` (6884–6920) vs protocols reversal guides 28082–28203 **and** 28516–28580 (two frozen copies) + andexanet/PCC calc 32999–33056; `calculators.js` calculatePCCDose/calculateAndexanetDose (canonical math); evidence recommendations/claims/completedTrials; `ich-2022.json`.
- **Divergences:** warfarin INR→PCC-tier wording differs across 5 copies; two frozen protocols blocks disagree on sub-therapeutic band (28082 "INR 1.3–1.5" vs 28516 "INR 1.6–1.9 IIb/C"); PCC-for-DOAC dose fixed 50 vs "25–50 by INR" (INR meaningless for DOAC); fondaparinux reversal present in encounter but absent from protocols.
- **Canonical home:** `/content/anticoagulants` seeded from `ANTICOAGULANT_INFO`; dose math stays in calculators.js; **delete `calculate4FPCC`**; re-point 4 non-protocols consumers. Do NOT data-drive frozen protocols reversal JSX for v1 unless snapshot passes.

### 4.8 Secondary prevention / DAPT / AF timing (`dup-secondary-prevention.json`)
- **Locations:** `recommendAcuteDAPT` (calculators-extended.js 80–200, canonical engine) vs static copies in components.jsx (317–665), education.jsx (1507–2073), app.jsx encounter (3932–23937) and protocols (frozen 29909–32707); AF timing `calculators.js:6` `elan-optimas` vs recommendations.js rec-af-timing vs divergent strings.
- **Divergences:** **THALES labeled "90 days" at app.jsx:19446 (WRONG — should be 30d)**; CHANCE-2 collapsed to "90 days" (19448/23443); **4+ incompatible AF-timing schemes** (676 NIHSS-bucket, 34056 different buckets, 21780 "day 2-3", engine imaging-based, components/recommendations "across severities"); POINT attribution drift; clopidogrel load 300 vs 300–600.
- **Canonical home:** `recommendAcuteDAPT` sole DAPT source + `content/secondary-prevention/dapt.json` keyed by trial; one AF-timing model from calculators.js + recommendations.js (imaging/severity per ELAN); delete divergent NIHSS-bucket strings (676, 34056). Frozen protocols guarded by snapshot.

### 4.9 Cervical artery dissection (`dup-dissection.json`)
- **Locations:** education.jsx CervicalDissectionCard (3599–3860, richest/current/correct) vs app.jsx rec-engine 4939–5006 (CADISS only) vs encounter pathway/notes vs protocols CAD 30308–30388 / 34208–34217 (**frozen**) vs guideline JSONs vs components.jsx 535/543 vs institutional-protocols.js 539/554/564 (TNK-in-dissection authority).
- **Divergences:** **TREAT-CAD interpretation conflict** — education correctly says non-inferiority NOT met (23% vs 15%); `landmark-trials.json:398` and `components.jsx:543` wrongly say "ASA non-inferior"; evidence currency mismatch (education cites 4 trials/2024 vs rec-engine CADISS-2015 only); follow-up interval wording varies.
- **Canonical home:** education CervicalDissectionCard → canonical `/content` CeAD record + trials into citations.js; keep institutional-protocols.js as TNK-safety authority; fix landmark-trials.json:398 + components.jsx:543. Frozen protocols CAD stays byte-identical.

### 4.10 Stray citations (`dup-stray-citations.json`)
- **Canonical:** `src/evidence/citations.js` (76 `makeCitation` records, PMID/DOI-verified) + schema.js validator; `data/atlas/citations.json` is generated mirror.
- **Stray authoring:** education.jsx (87 hits, largest — {label,citation,pmid} arrays); calculators-extended.js (55, source strings); app.jsx (28, trial→DOI map 3524–3539 + narrative footnotes); calculators.js (7); completedTrials.js (43 acronyms); guideline-doc DOIs (a class absent from citations.js); management-guidance vs management-cards duplicate hrefs; `verified-pmids.json` cache.
- **Divergence:** **INSPIRES PMID 38157499 has 3 different citation strings** (education.jsx:230 "NEJM 2023;389:2413-2424" vs :417 "NEJM 2024;390:59-69" vs calc-extended "2023;389:2413-24"); ELAN PMID authored in ≥4 files; CATALYST DOI in 4.
- **Canonical home:** citations.js registry; route every literal in by citation id (education first). app.jsx line 31143 (ACTION-CVT PMID) is **inside frozen range** — snapshot-guard.

### 4.11 References-tab prose vs frozen protocols (cross-cutting)
Research/references inline prose (HINTS, CVT, CTP/DEFUSE-3/DAWN, order sets, RACE, mimics, chameleons) conceptually duplicates frozen protocols wording. **Rule:** when creating a canonical source, protocols is the frozen reference; the references tab consumes it — never the reverse.

### 4.12 Templates (documentation)
`generateTelestrokeNoteBody` (8779–12314) re-implements ~20 clinical sections 4–8× with renamed prefixes (fu/tx/sn/pr/dc/cn/so/ed). A **section registry** (section id + data selector + verbose/concise/patient renderers + per-template section list) collapses ~60–70%. Note templates already map cleanly to the context axis: telestroke = consult/transfer/signout/pulsara/smart-note; inpatient = progress/procedure/discharge/patient-ed/postTnk/postEvt/nursing; clinic = followup.

---

## 5. Hard-coded facts & citations census

Per-slice fact counts (from audit `hardcodedFactCount`):

| Region | Facts | Region | Facts |
|---|---|---|---|
| app.jsx 1–1200 (constants) | 17 | app.jsx 8630–12530 (doc templates) | 47 |
| app.jsx 1200–3600 (state) | 9 | app.jsx 12530–17205 (calc/palette) | ~230 |
| app.jsx 3501–6265 (guideline recs) | 124 | app.jsx 17206–22400 (encounter A) | ~130 |
| app.jsx 6500–8630 (nav) | 29 | **Protocols 27678–30600 (a)** | **~420** |
| **Protocols 30600–33582 (b)** | **~60** | research/trials/etc 33583–36224 | 9 |
| clinical modules | 11 | evidence atlas (well-governed) | ~220 |
| data/guidelines | 5 | education + sims | ~60 |

**Total inline clinical facts ≈ 1,370+**, heavily concentrated in the two protocols slices (~480) and the calc/palette + encounter slices (~360).

**Citations census (vs `src/evidence/citations.js` = canonical 76):**

| Source | Stray citation hits | Status |
|---|---|---|
| education.jsx | 87 | inline arrays + prose; INSPIRES already drifted 3 ways |
| calculators-extended.js | 55 | source strings/comments |
| completedTrials.js | 43 | acronyms (PMIDs only in comments) |
| app.jsx | 28 | trial→DOI map 3524–3539 + footnotes (31143 in frozen range) |
| calculators.js | 7 | ELAN/OPTIMAS/CATALYST/ANNEXA-I |
| institutional-protocols.js | 1 | header PMID |
| guideline JSONs | 18 doc-level DOIs | citation class absent from citations.js |

**Coverage today:** `scripts/validate-citations.mjs` (markdown source-of-truth), `scripts/evidence-validate.mjs` (atlas structure), **`scripts/validate-inline-citations.mjs`** (sweeps source for inline `PMID NNNNN`, malformed + tight-binding + optional `--check-identifiers`). **Gap:** education.jsx `references[]` structured arrays and `lastReviewed` currency stamps have no dedicated validator; inline-citation sweep catches PMIDs but not full citation-string drift.

---

## 6. Existing infrastructure assessment — the Evidence Atlas (`src/evidence/`)

The Atlas is **~80% of the target `/content` architecture already built** for the evidence/trials domain — adopt its pattern rather than invent a new one.

| Piece | File | What it provides |
|---|---|---|
| Schema | `schema.js` (475) | **The model.** 7 `make*()` factories (default-fill + deep-clone), 6 `validate*()` returning `{errors,warnings}` (no throw), enum arrays, PMID/DOI/NCT/kebab/ISO regexes, cross-ref integrity vs known-id Sets, semantic checks (Class-I unsupported, topic coherence, 24-month staleness). Imported by runtime AND `scripts/evidence-validate.mjs` |
| Citations | `citations.js` (76) | canonical bibliography, `cit-<slug>-<year>` |
| Completed trials | `completedTrials.js` (64) | structured results + `citationIds[]` |
| Active trials | `activeTrials.js` (10) | + declarative `matcherCriteria[]` |
| Recommendations | `recommendations.js` (11) | + `setting` enum (**prefigures context switch, goal d**), `supportingClaimIds` |
| Claims | `claims.js` (12) | de-dup layer: rec→claim→citation drill-through |
| Guidelines / Topics | `guidelines.js` (7) / `topics.js` (30) | registry + join-key taxonomy |
| Matcher engine | `matcher-engine.js` (464) | evaluates matcherCriteria; parallel-verification mode (localStorage `strokeApp:matcherEngineCheck`) — promotion path to canonical eligibility |
| Barrel | `index.js` (171) | single entrypoint + query/filter/label helpers; `index.d.ts` types |

**Build pipeline:** `scripts/generate-agent-assets.mjs` (deterministic, sha256-checksum not wall-clock) generates ALL of `data/*` from `src/*`. `data/guidelines/*.json` verified **byte-identical** to `src/guidelines/*.json`. **Never hand-edit `data/`.**

**GAPS to close in the refactor:**
1. Atlas covers only evidence+trials. Protocols tab, encounter drawers, calculators, and inline app.jsx/institutional-protocols citations are **not** sourced from it — generalizing the schema pattern to those is the bulk of the work.
2. **Same trials in 4 shapes:** `activeTrials.js` (matcher), `screenerTrials.json` (16, bedside), `eligibilityTables.js` (reference, no schema), `screener/*.js` (14, executable `check()` closures, **test-only, not wired to any live surface**). Collapse to one canonical source + derived views. `screener/*.js` closures won't serialize without a rule interpreter.
3. `data/calculators-index.json` catalog is a **hardcoded list inside the generator** (99–124), not derived from calculator exports → drift.
4. Topic taxonomy (30 ids) is **not** shared with protocols subtab routing keys (`ich/ischemic/sah/tia/cvt`) — unify for goal (b).
5. `getAIConfiguration()` (calculators-extended.js:1332) has **zero importers** and there is **no live LLM fetch anywhere** — provider/key is config-only plumbing (see §8).

---

## 7. Example Protocols lock plan (HARD CONSTRAINT)

**Frozen surface:** `app.jsx` **27678–33582**, `activeTab === 'protocols'`, subtabs `ich/ischemic/sah/tia/cvt/calculators`, routes `#/protocols/*`. **~99% of clinical wording is inline JSX string literals** in this range; only three module imports feed it:

| Imported into frozen range | Module | Render lines |
|---|---|---|
| `ICH_INITIAL_EVALUATION_ALGORITHM` | `src/institutional-protocols.js` | 27983–28042 |
| `AIS_COMMAND_CENTER_CARDS` + `AIS_SOURCE_LINKS` + `AIS_COMMAND_CENTER_LAST_REVIEWED` | `src/management-guidance.js` | 28808–28996 |
| `PocketCards` | `src/pocket-cards.jsx` | 30420–30435 |

**Also load-bearing but declared inline in app.jsx** (touch = wording risk): `protocolDetailMap` (drug modal text, useMemo 2725), `getOrderBundles` (order-set strings, 13292), `GUIDELINE_CLASS_COLORS` (3587).

### Subtab → precise frozen line ranges

| Subtab | Frozen ranges (app.jsx) |
|---|---|
| ich | 27966–28750 |
| ischemic | 28758–30435 (incl. large-core trial matrix 29967–30085; BP titration tables 29580–29742) |
| sah | 30441–30719 |
| tia | 30724–31027 |
| cvt | 31030–31358 |
| calculators | 31360–33565 (card wording 31376–33561; math imported OR inline) |

### The lock harness (already exists)

`scripts/snapshot-example-protocols.mjs` builds the app, launches Playwright/chromium against `app.js`, extracts **every visible text node under `#tabpanel-protocols`** for each of the 6 subtabs, normalizes, and compares against `tests/snapshots/example-protocols/`.
- `node scripts/snapshot-example-protocols.mjs` → CI gate (exit 1 on drift)
- `--update` → re-baseline (git diff of baselines IS the human review surface)

**Critical Phase-2 action:** the harness script itself is currently **untracked in git** (present on disk, not committed) and the baseline directory **`tests/snapshots/example-protocols/` does NOT yet exist**. Before any refactor commit touches shared surfaces: commit the script, run `--update` on the **current** build to create baselines, review/commit them, and wire the check into CI (it is not in the `test:protocol` npm script today). Every subsequent refactor commit must leave this check green; any legitimate protocols wording change is a separate, explicitly-reviewed `--update` commit.

**Internal duplications inside the frozen zone** (extract-but-freeze, or reconcile only as reviewed wording changes): ECASS HT classification (28291 **and** 29845), angioedema ladder (28330 **and** 29882), warfarin/DOAC reversal (28105–28212 **and** 28515–28583, which disagree on INR band), post-lytic ICH (28214 **and** 29820), ABC/2 volume UI (31885 embedded **and** 32946 standalone, divergent state keys), ABCD2 risk table (30794 **and** 32308), COR/LOE legend (31650). Inline `calculateCrCl` reimplemented in Contrast Allergy card (30165). NBO card badge says IIa but body IIb (29745/29751) — preserve as-is.

---

## 8. Risk notes — guardrails that must survive

| Guardrail | Where it lives | Must-preserve behavior |
|---|---|---|
| `PUBLIC_DEMO_MODE` | app.jsx 304–314 (detect: any `*.github.io`, `?publicDemo=1`, `window.__STROKE_PUBLIC_DEMO_MODE__`) | Disables ALL localStorage writes; wipes storage + IndexedDB on load (407–417) |
| Copy PHI guard | `copyToClipboard` 8636–8645 (`getPublicDemoPhiWarnings`) | Blocks PHI copy in demo mode |
| Demo note disclaimer | `generateTelestrokeNote` 12204–12211 (`PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX`) | Prefix on generated notes |
| Export gating | 8705/8711, 14482, 16408, 16870–16897 | PDF/JSON/Share hidden in demo mode |
| De-ID / PHI scan | effect 15871–15911 over 17 free-text fields; banner 17016–17031 | Active when `settings.deidMode` OR demo mode |
| Storage sanitizers | `sanitizeTelestrokeNoteForStorage` (8502–8569, ~150 allowedKeys), `sanitizeStrokeCodeFormForStorage` | Free text stripped unless `settings.allowFreeTextStorage` |
| Storage TTL | `applyStorageExpiration` (1006–1026), default 12h | 12h no-PII auto-wipe |
| "Verify against local protocol" language | doc-template disclaimer 17274; palette keyword "not local policy" (8096); `DOC_TEMPLATES` "institution-neutral" comment; tab label "Example Protocols" (17151) | Institution-neutral framing must remain |
| TNK safety hard-blocks | `tnkAutoBlocked` (15373–15445), `clearAllAndProceed` (21209–21223), diagnosis-switch auto-clear (20791–20796) | Hard-disable TNK on absolute CI; do not weaken |
| AI-provider abstraction | Settings form 35809–35906; storage keys `strokeApp:apiProvider`/`apiKey`; reader `getAIConfiguration()` (calculators-extended.js:1332, default `mock`) | **Zero importers, no live LLM call exists** — preserve the form, validation (`sk-`/`sk-ant-`), localStorage contract, and reader signature/defaults for future wiring |
| Compliance banners | `TrialScreener` COMPLIANCE_BANNER, `EligibilityTables` ELIGIBILITY_COMPLIANCE_NOTE, `PUBLIC_DEMO_AGENT_DISCLAIMER` (= generator DISCLAIMER, byte-identical, asserted by `public-demo-labels.test.js`) | Covered by leak-guard / no-institutional-identifiers / public-demo tests |

**Test suite to keep green** (from `npm test`): `check:leak-guard`, `test:protocol` (protocol-currency-guards, public-demo-labels, no-institutional-identifiers, leak-guard, lighthouse-workflow, service-worker), `validate:citations`, `validate:inline-citations`, `evidence:validate`, plus vitest units (calculators, calculators-extended, stroke-prognosis-calculator, 4 simulator tests, teaching, evidence atlas incl. 211-scenario `scenario-snapshot.test.js`). **Add the protocols snapshot check to CI (§7).**

---

## Proposed commit-by-commit refactor sequence (Phases 2–6)

Small, reviewable, each leaves all tests + the new protocols snapshot green. Content extraction precedes de-duplication; frozen protocols is data-driven LAST (only if snapshot proves byte-identical).

### Phase 2 — Lock & scaffold (no behavior change)
1. **Baseline the protocols lock:** run `snapshot-example-protocols.mjs --update`, commit `tests/snapshots/example-protocols/`, and add the check to `test:protocol` + CI. (Gate for everything after.)
2. **Content scaffold:** create `/content` + adopt the `src/evidence/schema.js` factory+validator+known-id-Set pattern; add a `content-validate.mjs` mirroring `evidence-validate.mjs`; wire into `npm test`. No content moved yet.
3. **Bug-fix commit (pre-canonicalization, non-frozen only):** EvdIcpSimulator.jsx:783 `>55`→`>20`; teaching.js:182 HINTS peripheral/central; education.jsx ICH score-4 94%→97%; app.jsx:19446 THALES 90d→30d; landmark-trials.json:398 + components.jsx:543 TREAT-CAD wording. Each with a regression test. (These are content bugs, not refactors — do first so canonical sources are correct.)

### Phase 3 — Centralize calculators & citations (goal c)
4. Migrate inline-computed scores (FUNC, ASPECTS, PC-ASPECTS, SPAN-100, SEDAN, DRAGON, mTICI, embedded ABC-2) + orphaned education scores (ASTRAL, PLAN, ICH-dup) into `src/calculators*.js`; delete `calculate4FPCC` (dead) and education `calculateIchScore` (dup). Callers import shared fns. Snapshot must stay green (protocols calc math is imported, wording untouched).
5. Export one `CALCULATOR_CATALOG` from the compute modules; derive `generate-agent-assets.mjs` list, palette entries, search index, and `data/calculators-index.json` from it. Fixes 24-vs-60 drift + display-name drift.
6. Route stray citations into `src/evidence/citations.js` by id, starting with education.jsx (87 hits, worst drift), then calculators-extended, then app.jsx trial→DOI map. Add guideline-doc DOI class. Extend `validate-inline-citations` coverage.

### Phase 4 — Extract clinical content to `/content` (goal a), non-frozen first
7. Extract encounter/note-template/order-bundle/sanity-check content to `/content` schema records, keeping predicate `conditions()` functions in code (reference content by id). Collapse note generators to a **section registry** (verbose/concise/patient renderers).
8. Extract the ~124 `GUIDELINE_RECOMMENDATIONS` cards to `/content` (prose separated from predicates); reconcile against `src/evidence/recommendations.js` (the cleaner spine).
9. Extract education pocket-card wording + module registry to `/content`.

### Phase 5 — De-duplicate to canonical sources (goal b)
10. One canonical record per concept, in `/content` or the designated module, re-pointing all non-frozen consumers: osmotherapy/ICP (§4.1), HINTS (§4.2), CVT (§4.3), prognosis bands (§4.4), BP targets + monitoring cadence (§4.6), anticoagulant reversal (§4.7), DAPT + AF-timing (§4.8), CeAD (§4.9). Reconcile documented contradictions (CVT seizure ppx, AF-timing schemes) as explicit reviewed changes.
11. Unify the 4 trial representations (activeTrials / screenerTrials / eligibilityTables / screener) to one canonical source + derived views; retire test-only `screener/*.js` closures behind the matcher engine. Merge the 4 search registries into one generated index.
12. Unify topic taxonomy with protocols subtab keys.

### Phase 6 — Context switch + frozen-protocols data-driving (goals d, then a-for-protocols)
13. **Telestroke/Inpatient/Clinic context switch:** generalize `clinicalContext` (17404) via `navigateTo`; drive it off `recommendations.js` `setting` + a `surface` field on content records; filter the single calculator catalog and note-template set by context (do not fork content). Avoid legacy `clinic`/`wards` alias tokens.
14. **LAST, and only per subtab that passes the snapshot byte-for-byte:** render frozen protocols subtabs from `/content`. Reconcile the intra-zone duplicates (§7) only as separately-reviewed `--update` commits. If any subtab can't reproduce byte-identical output, **leave it literal** and keep the `/content` record as a mirror the snapshot validates against.

---

*Generated from Phase-1 audit. Line numbers are HEAD-relative; re-grep before editing. `data/*` is generated — never hand-edit.*
