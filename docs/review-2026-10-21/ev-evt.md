# ev-evt review — EVT and systems-of-care Evidence cards (2026-10-21)

Unit: ev-evt · Branch: `worktree-agent-acc434811ff6dbe0b` · Base: `af21b07` (7.8.0)

Access scope used throughout:

- **AHA/ASA 2026 AIS guideline (PMID 41582814)**: the full text was not reachable. Every AHA wording and COR/LOE check below is against the app's archived transcription (`git show 4f8e99d:data/guidelines/ais-2026.json`, 202 statements; `src/guidelines/ais-2026.json` holds the 56-statement subset). This is archive scope (secondary), and the AHA source `checkedAt` was not changed.
- **PubMed primary abstracts**: read today for every trial whose `checkedAt` moved to 2026-10-21.
- **PMC full text**: read today for SVIN large core 2025 (PMC12671639), SVIN MeVO 2026 (PMC13331429), ESO/ESMINT BAO 2024 (PMC11569583, synoptic table), ESO BP 2025 update (PMC13151662), and the AHA writing-group response (PMC13491549). The ESO-ESMINT 2019 PMC record (PMC6533858) has no body text, so only its abstract was read.
- **ClinicalTrials.gov registries**: NCT04551664, NCT03876457, NCT03805308, NCT03702413, NCT03094715, NCT03811769 and NCT04751708.
- WebSearch was not used as a basis for any edit.

## 1. Scope inventory

| Topic / record | File | Content reviewed |
|---|---|---|
| acute-reperfusion | src/reference/acute-topics.json | summary, 4 consider, caution, 4 AHA recommendation chips, 24 sources |
| code-stroke-activation (prehospital LVO scales, MSU) | src/reference/acute-topics.json | summary, 4 consider, caution, 2 AHA chips, 4 sources |
| evt-selection | src/reference/expanded-vascular.json | summary, 3 consider, caution, 4 AHA chips, 25 sources, related links |
| large-core-evt | src/reference/expanded-vascular.json | summary, 4 consider, caution, 3 AHA chips, 12 sources |
| basilar-occlusion | src/reference/expanded-vascular.json | summary, 3 consider, caution, 2 AHA chips, 10 sources |
| medium-distal-evt | src/reference/expanded-vascular.json | summary, 3 consider, caution, 2 AHA and 2 SVIN chips, 8 sources |
| neurointerventional-care | src/reference/expanded-vascular.json | summary, 4 consider, caution, 26 sources |
| in-hospital-stroke, rural-telestroke, transitions-care, stroke-program-quality | src/reference/expanded-care.json | summaries, consider, cautions, sources |
| evidence-interpretation | src/reference/expanded-care.json | summary and consider. Unchanged: its only source (CEBM) returned 403 and no clinical claim depends on it. |
| Study cards | src/reference/studies.json | angel-aspect, rescue-japan-limit, tension, laste, select2, hermes, dawn, defuse-3, ninds-tpa, ecass-3, baoche, attention, trace-5, attention-late, distal, escape-mevo, discount, oriental-mevo, swift-direct, mr-clean-no-iv, direct-mt, bridge-tnk |
| Study sources | src/reference/study-sources.json | entries whose topicIds include an ev-evt topic: 61 re-read today; the rest were left unchanged |
| Coverage | src/reference/coverage.json | every mapping to an ev-evt topic. None was wrong, so the file is unchanged. |
| Audit only (not edited) | src/encounter-clinical-review.js (`evaluateVideoTreatment` EVT branch, lines 224–246), src/calculators-extended.js (`evaluateDAWN`, `evaluateDEFUSE3`, `evaluateLargeCoreEVT`), src/encounter-details.js (post-reperfusion fields), src/supplementary-calculator-definitions.js | see "Cross-area patches for the lead" |

## 2. Findings

| # | Severity | Finding | Location | Resolution |
|---|---|---|---|---|
| F1 | High | "EVT is indicated within 24 h for anterior LVO" generalized the graded ICA/M1, NIHSS ≥6, prestroke mRS 0–1, window-specific ASPECTS population (ais-2026-114/-115/-116) to all anterior LVO. | acute-reperfusion summary | Corrected |
| F2 | High | "Prestroke mRS 2 (2a); mRS 3–4 within 6 h (2b)" dropped the ICA/M1, ≤6 h, NIHSS ≥6 and ASPECTS ≥6 limits of ais-2026-118/-119. | evt-selection consider[0] | Corrected |
| F3 | High | "Transfers: go straight to angiography..." was worded as a directive. ais-2026-57 is 2b ("may be considered"), and the companion ais-2026-56 (2b, prefacility LVO scale, flat-panel CT) was missing. DIRECT ANGIO (2026) was stopped early for harm. | evt-selection consider[1] | Corrected and added |
| F4 | High | The IA lytic line said ANGEL-TNK and PEARL "postdate" AHA 2026. Both were published in 2025, before the January 2026 guideline, whose 2b recommendation already names tenecteplase. Only CHOICE-2 and IAT-TOP postdate it. (This error was introduced and fixed within this unit.) | neurointerventional-care consider[3] | Corrected |
| F5 | Medium | The MSU line omitted the population of ais-2026-20 (thrombolytic-eligible patients, where available) and its LOE. | code-stroke-activation consider[2] | Corrected |
| F6 | Medium | Direct transport to a thrombectomy center (2a) was stated without its local-access condition and without the COR 3: No Benefit counterpart for bypassing a proficient local center (ais-2026-18). | rural-telestroke summary | Corrected |
| F7 | Medium | The large-core caution read "Trials mostly enrolled ≤80": wrong for SELECT2/TESLA (≤85) and for RESCUE-Japan LIMIT, TENSION and LASTE (no upper limit), and it missed TENSION's mRS ≤2. | large-core-evt caution | Corrected |
| F8 | Medium | The bridging caution read "DIRECT-MT (China) noninferior, European trials did not": DEVT (China) was also noninferior, and SKIP (Japan) and DIRECT-SAFE (Australasia/Asia) were not European. | evt-selection caution | Corrected |
| F9 | Medium | RACE accuracy came only from its 2013 single-region derivation (85%/68%). The 2026 EMS meta-analysis pools 75%/76%. RACECAT applies to nonurban Catalonia. | code-stroke-activation summary | Corrected |
| F10 | Medium | "PRISMS showed no benefit" omitted that the trial stopped very early ("precludes any definitive conclusions"). | acute-reperfusion summary | Corrected |
| F11 | Medium | ATTENTION limits said "most patients had severe deficits". The registry required NIHSS ≥10. | studies.json attention.limits | Corrected |
| F12 | Low | Tirofiban was labeled "COR 3"; ais-2026-132 is COR 3: No Benefit, not Harm. | neurointerventional-care summary | Corrected |
| F13 | Low | "Avoid SBP drops during the procedure (ESO 2026)" mislabeled the source. The ESO 2025 BP update cites earlier ESO advice and states that no study defines a safe drop. | neurointerventional-care consider[2] | Corrected |
| F14 | Low | The in-hospital card attached the AHA 2026 COR 1 grade to staff-activation wording that comes from the ungraded AHA 2022 statement. | in-hospital-stroke summary | Corrected |
| F15 | Low | Study-source designs were wrong: DISTAL, TESLA and PEARL were "Report" (all randomized); BEST-MSU was "Report" (observational, alternating weeks). | study-sources.json | Corrected |
| F16 | Low | DIRECT ANGIO was mapped to stroke-program-quality, which makes no claim from it, and not to evt-selection, which now does. | study-sources.json | Mapping moved |
| F17 | Info | The SVIN 2026 ACA/PCA and M3/M4 statements were ungraded on the card. | medium-distal-evt consider[1] | Grades added (2b; COR 3: No Benefit) |
| F18 | Info | Post-guideline evidence was missing: ATLAS IPD (Lancet 2026), TESLA, writing-group response (July 2026), DISTAL 12 months, ANGEL-REBOOT, CHOICE-2, IAT-TOP. | large-core, evt-selection, neurointerventional, studies | Added with labels |
| F19 | Medium (cross-area) | The EVT screen's mRS >1 message implies a recommendation exists for every vessel and window. | src/encounter-clinical-review.js:231 | Patch X1 proposed |
| F20 | Medium (cross-area) | The EVT screen's ICA/M1 ASPECTS <6 message cites age and mass-effect criteria that do not apply to ≤6 h ASPECTS 3–5 (ais-2026-114), and it gives no window-specific tier. | src/encounter-clinical-review.js:238 | Patch X2 proposed |
| F21 | Low (cross-area) | SVIN wording is ambiguous for a "codominant proximal" M2 (r1 "proximal and/or dominant" 2a vs r2 "codominant" 2b). | src/encounter-clinical-review.js:244 | Report only (X3) |
| F22 | Low (cross-area) | The large-core screen models RESCUE-Japan LIMIT only at ≤6 h. Its 6–24 h DWI-ASPECTS 3–5 / no-FLAIR subset is not named in `modeledSubsets`. | src/calculators-extended.js:326–329, 357 | Optional note (X4) |

## 3. Changes and why

Commits: `de1157f` (main edits and tests) and `4dbc769` (trims). Content files:

- **acute-topics.json**
  - acute-reperfusion: PRISMS now reads "(stopped early)" (F10), and the EVT sentence is restricted to the graded ICA/M1 population (F1).
  - code-stroke-activation: RACE 2013 vs pooled EMS accuracy and the RACECAT setting (F9). MSU population and LOE (F5). Added the JAHA 2026 meta-analysis source. The creatinine rule now appears once, as "CTA/CTP" (trim).
  - Re-dated: PRISMS, RACE and RACECAT sources.
- **expanded-vascular.json**
  - evt-selection: consider[0] (F2), consider[1] (F3, with DIRECT ANGIO), consider[2] (the writing group declined the downgrade of 6–24 h ASPECTS ≥6 COR 1; observational mortality signal; NO-SELECT ongoing), caution (F8). Added the writing-group source. Added Basilar and MeVO related links, which replace the old "see the dedicated cards" consider line. Summary trimmed, with BRIDGE-TNK labeled China, ≤4.5 h.
  - large-core-evt: TESLA result added to the summary; ATLAS added as consider[3]; caution rewritten (F7). The SVIN source access now records that the 6–24 h table did not render.
  - basilar-occlusion: the ESO BAO source access now records that the synoptic table was read.
  - medium-distal-evt: SVIN grades added (F17).
  - neurointerventional-care: tirofiban subtype (F12), ANGEL-REBOOT (F18), ESO attribution (F13), and the IA lytic trials with correct post-guideline labeling (F4).
- **expanded-care.json**
  - rural-telestroke: 2a condition and COR 3: No Benefit counterpart (F6). The virtual-networks source access notes that correction 41871197 was not read.
  - in-hospital-stroke: attribution split between the AHA 2022 statement and AHA 2026 COR 1 (F14).
  - Sources re-dated: transitions and program-quality.
- **studies.json**
  - attention.limits (F11) and distal.limits (12-month result).
  - `checkedAt` updated to 2026-10-21 on 18 abstract-scope study cards re-read today. SELECT2, HERMES, DAWN, DEFUSE-3, ENCHANTED2/MT, OPTIMAL-BP and HOPE keep their dates because their access notes record notice or correction checks that were not redone today.
- **study-sources.json**
  - 61 entries re-read today: `checkedAt` 2026-10-21, and `access` rewritten to "Primary abstract verified via PubMed; bibliographic record checked[; summarized in its study card]." Every correction-notice and secondary-analysis note was kept.
  - 4 type corrections (F15) and the DIRECT ANGIO mapping (F16).
  - Entries not read today keep their old date: INTERACT4, MR CLEAN-LATE, MR CLEAN, ESCAPE, EXTEND-IA, SWIFT PRIME, REVASCAT, SIESTA, GOLIATH, AnStroke, CANVAS II, CERES-TANDEM, IRIS tandem, TENSION antithrombotic, ANGEL-ASPECT HMCAS, EVA-TRISP.
- **Tests**: see section 5.

Byte delta:

| Measure | Before | After | Change |
|---|---|---|---|
| src/reference/*.json (pretty-printed) | 579,128 | 582,375 | +3,247 bytes |
| Generated data/clinical-reference.json (measured after `npm run agent:assets`, then reverted) | 511,632 | 514,686 | +3,054 bytes |
| Service-worker precache | 2,335,485 (96.84% of 2,411,724.8) | 2,338,539 (96.97%) | +3,054 bytes |

All JS and CSS budgets are unchanged (initial gzip 97.18%, all-JS gzip 97.24%).

## 4. Evidence ledger

| claim / feature | location | status (verified/corrected/added/flagged/unresolved) | source title — URL or DOI/PMID/NCT — publication date | accessed 2026-10-21, scope | supporting passage (short quote) | limitations / resolution |
|---|---|---|---|---|---|---|
| Faster IVT improves outcome, COR 1/LOE A (ais-2026-84) | acute-reperfusion rec chip | verified | AHA/ASA 2026 AIS guideline — PMID 41582814, DOI 10.1161/STR.0000000000000513 — Jan 2026 | archived transcription, p. 38 | "faster treatment is recommended as it improves functional outcomes" | Full text not reachable; archive scope; source not re-dated |
| TNK 0.25 mg/kg (max 25) or alteplase 0.9 mg/kg (max 90) within 4.5 h, COR 1/A (ais-2026-98) | acute-reperfusion summary + chip | verified | AHA/ASA 2026 — PMID 41582814 — Jan 2026 | archived transcription, p. 42 | "tenecteplase 0.25 mg/kg (max 25 mg) or alteplase 0.9 mg/kg (max 90 mg) is recommended" | Archive scope |
| Mild non-disabling deficit: IVT not recommended, COR 3: No Benefit/B-R (ais-2026-91) | acute-reperfusion consider[0] + chip | verified | AHA/ASA 2026 — PMID 41582814 — Jan 2026 | archived transcription, p. 38 | "IVT is not recommended as it has not shown superiority over dual antiplatelet treatment" | Archive scope |
| DAPT COR 1 for noncardioembolic minor stroke NIHSS ≤3 within 24 h; NIHSS 4–5 lower grades | acute-reperfusion consider[0] | verified | AHA/ASA 2026 ais-2026-147 (1/A), -148 (2b/B-R), -149 (2a/B-R) — PMID 41582814 | archived transcription, p. 62 | "minor noncardioembolic AIS (NIHSS 3 or less) ... DAPT ... is recommended to be initiated within 24 hours" | Archive scope |
| Do not wait for coagulation results or MRI microbleed count | acute-reperfusion consider[1] | verified | AHA/ASA 2026 ais-2026-93 (2a/B-NR), -94 (1/B-NR) | archived transcription, p. 38 | "reasonable not to delay IVT while waiting for hematologic or coagulation testing"; "without first obtaining MRI to exclude CMBs" | Two different grades, stated ungraded on the card; left as is |
| IVT as rapidly as possible without delaying EVT, COR 1/A (ais-2026-113) | acute-reperfusion summary + chip | verified | AHA/ASA 2026 — PMID 41582814 | archived transcription, p. 48 | "without waiting to observe clinical response or delaying EVT initiation" | Archive scope |
| EVT within 24 h graded for ICA/M1, NIHSS ≥6, prestroke mRS 0–1, window-specific ASPECTS | acute-reperfusion summary | corrected | AHA/ASA 2026 ais-2026-114, -115, -116 — PMID 41582814 | archived transcription, p. 53 | "anterior circulation proximal LVO (ICA or M1) ... NIHSS 6 or greater, prestroke mRS 0-1, and ASPECTS 3-10" | Was "indicated within 24 h for anterior LVO" |
| Basilar: NIHSS ≥10, mRS 0–1, PC-ASPECTS ≥6 within 24 h, COR 1/A; NIHSS 6–9 2b/B-R | acute-reperfusion, basilar summary + chips | verified | AHA/ASA 2026 ais-2026-122, -123 — PMID 41582814 | archived transcription, pp. 56–57 | "baseline mRS 0-1, NIHSS 10 or greater, and PC-ASPECTS 6 or greater ... EVT within 24 hours ... is recommended" | Archive scope |
| TNK noninferior to alteplase in AcT, TRACE-2, ORIGINAL, ATTEST-2 | acute-reperfusion summary | verified | AcT — PMID 35779553 — 2022-06-29; TRACE-2 — PMID 36774935 — 2023-02-09; ORIGINAL — PMID 39264623 — 2024-11; ATTEST-2 — PMID 39424558 — 2024-11 | PubMed abstracts | AcT "meeting the prespecified non-inferiority threshold"; ORIGINAL "noninferiority threshold met"; ATTEST-2 "Tenecteplase was non-inferior" | IVT unit owns detailed IVT content |
| PRISMS stopped early; sICH 3.2 vs 0% | acute-reperfusion summary | corrected | PRISMS, JAMA — PMID 29998337, DOI 10.1001/jama.2018.8496 — 2018-07-10 | PubMed abstract | "the very early study termination precludes any definitive conclusions"; "Five alteplase-treated patients (3.2%) vs 0 aspirin-treated patients had sICH" | Added "(stopped early)" |
| ARAMIS: DAPT noninferior to alteplase (minor nondisabling) | acute-reperfusion summary | verified | ARAMIS, JAMA — PMID 37367978 — 2023-06-27 | PubMed abstract | "DAPT was noninferior to intravenous alteplase with regard to excellent functional outcome" | Chinese population |
| TEMPO-2: no benefit, more deaths (5 vs 1%) | acute-reperfusion consider[2] | verified | TEMPO-2, Lancet — PMID 38768626 — 2024-05-17 | PubMed abstract | "More patients died in the tenecteplase group (20 deaths [5%]) than in the control group (five deaths [1%]" | PubMed lists 1 correction; not reconciled |
| IVT after DOAC within 48 h: observational only | acute-reperfusion caution | flagged | — | not re-read | — | IVT/anticoagulant unit scope; unchanged |
| EMS validated scale (1/A), prenotification (1/B-NR), closest stroke-capable facility (1/B-NR) | code-stroke-activation summary + chips | verified | AHA/ASA 2026 ais-2026-9, -10, -15 — PMID 41582814 | archived transcription, pp. 12–14 | "advance facility notification by prefacility personnel is recommended"; "EMS transport is recommended to the closest appropriate stroke-capable facility" | Archive scope |
| Check glucose; do not delay CTA/CTP for creatinine; image within ~25 min | code-stroke-activation summary, consider[0] | verified (trimmed) | AHA/ASA 2026 ais-2026-88 (1/B-NR), -49 (1/B-NR), -48 (1/B-NR) | archived transcription, pp. 26, 38 | "emergent vascular imaging with CTA and/or CTP is recommended not to be delayed to obtain serum creatinine" | Duplicate removed from consider[0] |
| RACE items and 2013 accuracy (≥5: sens 85%, spec 68%) | code-stroke-activation summary | corrected (framing) | RACE derivation/validation, Stroke — PMID 24281224, DOI 10.1161/STROKEAHA.113.003071 — 2013-11-26 | PubMed abstract | "facial palsy (scored 0-2), arm motor function (0-2), leg motor function (0-2), gaze (0-1), and aphasia or agnosia (0-2)"; "RACE scale≥5 had sensitivity 0.85, specificity 0.68" | PPV/NPV removed (prevalence-dependent) |
| RACE ≥5 pooled EMS accuracy 75%/76% (2026 meta-analysis) | code-stroke-activation summary + new source | added | Stroke Scales for LVO in the Prehospital Emergency Setting, J Am Heart Assoc — PMID 42333681, DOI 10.1161/JAHA.125.048588 — 2026-06-23 | PubMed abstract | "Rapid Arterial Occlusion Evaluation score (≥5) showed pooled sensitivity of 0.75 ... and specificity of 0.76" | 43 studies, Oct 2016–Jul 2024 |
| RACECAT: nonurban Catalonia, cOR 1.03, IVT 47.5 vs 60.4%, EVT 48.8 vs 39.4% | code-stroke-activation summary | corrected (population) | RACECAT, JAMA — PMID 35510397, DOI 10.1001/jama.2022.4404 — 2022-05-10 | PubMed abstract | "In nonurban areas in Catalonia, Spain, there was no significant difference in 90-day neurological outcomes" | PubMed lists 1 correction; not reconciled |
| MSU over EMS where available for thrombolytic-eligible patients, COR 1/LOE A | code-stroke-activation consider[2] | corrected | AHA/ASA 2026 ais-2026-20 — PMID 41582814 | archived transcription, p. 16 | "MSUs are recommended over conventional EMS (where available) for transport and management of thrombolytic-eligible patients" | Was "improve outcome where available (COR 1)" |
| BEST-MSU is observational (alternating weeks) | rural-telestroke source type | corrected | BEST-MSU, NEJM — PMID 34496173, DOI 10.1056/NEJMoa2103879 — 2021-09-09 | PubMed abstract | "In an observational, prospective, multicenter, alternating-week trial" | Type "Report" → "Observational study" |
| Children: sudden focal deficit including first seizure | code-stroke-activation consider[1] | flagged | — | not re-read | — | Pediatric unit scope; unchanged |
| ICA/M1, NIHSS ≥6, mRS 0–1: ≤6 h ASPECTS 3–10 COR 1; 6–24 h ASPECTS ≥6 COR 1 | evt-selection summary + chips | verified | AHA/ASA 2026 ais-2026-114, -115 (1/A) | archived transcription, p. 53 | "presenting 6-24 hours from symptom onset, with NIHSS 6 or greater, prestroke mRS 0-1, and ASPECTS 6 or greater, EVT is recommended" | Archive scope |
| HERMES: 5 RCTs within 12 h, cOR 2.49 | evt-selection summary | verified | HERMES, Lancet — PMID 26898852, DOI 10.1016/S0140-6736(16)00163-X — 2016-02-18 | PubMed abstract | "endovascular thrombectomy within 12 h"; "adjusted cOR 2.49, 95% CI 1.76-3.53" | — |
| DAWN 49 vs 13%; DEFUSE 3 45 vs 17% | evt-selection summary | verified | DAWN, NEJM — PMID 29129157 — 2017-11-11; DEFUSE 3, NEJM — PMID 29364767 — 2018-01-24 | PubMed abstracts | "49% in the thrombectomy group as compared with 13%"; "(45% vs. 17%, P<0.001)" | — |
| BRIDGE-TNK (China, ≤4.5 h): functional independence 52.9 vs 44.1% | evt-selection summary | corrected (population label) | BRIDGE-TNK, NEJM — PMID 40396577, DOI 10.1056/NEJMoa2503867 — 2025-05-21 | PubMed abstract | "In this open-label trial conducted in China ... presented within 4.5 hours"; "147 patients (52.9%) ... 120 patients (44.1%)" | Population label added |
| Prestroke mRS 2 (2a/B-NR) or 3–4 (2b/B-NR): only ICA/M1, ≤6 h, NIHSS ≥6, ASPECTS ≥6 | evt-selection consider[0] + chips | corrected | AHA/ASA 2026 ais-2026-118, -119 | archived transcription, p. 53 | "presenting within 6 hours, NIHSS 6 or greater, ASPECTS 6 or greater, and prestroke mRS of 3-4, EVT might be reasonable" | Population restored |
| Direct to angiography 2b: transfers (B-NR) and LVO-scale-positive EMS arrivals with flat-panel CT (B-R) | evt-selection consider[1] | corrected | AHA/ASA 2026 ais-2026-57, -56 | archived transcription, p. 27 | "may be considered without repeat brain imaging ... unless there is clinical change or transfer delay"; "direct triage to the angiography suite for flat-panel head CT may be considered" | Was a directive |
| DIRECT ANGIO stopped early for safety: sICH 15 vs 0%, no functional benefit | evt-selection consider[1] + source mapping | added | DIRECT ANGIO, Lancet Neurol — PMID 41864232, DOI 10.1016/S1474-4422(26)00056-6 — 2026-04 | PubMed abstract | "permanently stopped the trial ... for safety reasons"; "five [15%] of 34 vs zero [0%] of 42"; "without evidence of a beneficial effect" | Labeled as postdating AHA 2026; small sample |
| 6–24 h ASPECTS ≥6 keeps COR 1; DAWN/DEFUSE investigators' request to downgrade to 2b declined; mortality signal; NO-SELECT | evt-selection consider[2] + new source | added | Response to Request for Modification of the 2026 AHA/ASA AIS Guidelines, Stroke — PMID 42535264, DOI 10.1161/STROKEAHA.126.056726 — 2026-07-31 | PMC full text PMC13491549 | "correspondence received from the investigators associated with the DEFUSE and DAWN trials"; "requests downgrading ... to Class 2b / Level C-LD"; "respectfully declines the request" | Response dates the print edition both "July 2026" and "March 2026" |
| Bridging: only DIRECT-MT and DEVT noninferior; SWIFT DIRECT, MR CLEAN-NO IV, SKIP, DIRECT-SAFE, IRIS not | evt-selection caution | corrected | DIRECT-MT — PMID 32374959 — 2020-05; DEVT — PMID 33464335 — 2021-01; SKIP — PMID 33464334 — 2021-01; MR CLEAN-NO IV — PMID 34758251 — 2021-11; SWIFT DIRECT — PMID 35810756 — 2022-07; DIRECT-SAFE — PMID 35810757 — 2022-07; IRIS — PMID 37640037 — 2023-08 | PubMed abstracts | DEVT "met the prespecified statistical threshold for noninferiority"; SKIP "failed to demonstrate noninferiority"; DIRECT-SAFE "We did not show non-inferiority"; IRIS "We did not establish non-inferiority" | "wide margins" not used: MR CLEAN-NO IV (0.8) and DIRECT-SAFE (−10%) used the same margins and SWIFT DIRECT a wider one (12%); SKIP correction notice not reconciled |
| Within 6 h, ASPECTS 3–5 falls under COR 1 ASPECTS 3–10 with no age criterion; ASPECTS 0–2 2a/B-R with age <80, mRS 0–1, no mass effect; 6–24 h ASPECTS 3–5 COR 1 with age <80 | large-core summary + chips | verified | AHA/ASA 2026 ais-2026-114, -116, -117 | archived transcription, p. 53 | "age under 80, NIHSS 6 or greater, prestroke mRS 0-1, ASPECTS 0-2, and without significant mass effect, EVT is reasonable" | Archive scope |
| SELECT2 GOR 1.51, mRS 0–2 20 vs 7% | large-core summary | verified | SELECT2, NEJM — PMID 36762865 — 2023-02-10 | PubMed abstract | "generalized odds ratio ... was 1.51"; "20% ... and 7%" | Correction notice not re-read; card date kept |
| ANGEL-ASPECT GOR 1.37; sICH 6.1 vs 2.7% | large-core summary | verified | ANGEL-ASPECT, NEJM — PMID 36762852 — 2023-02-10 | PubMed abstract | "generalized odds ratio, 1.37"; "14 of 230 patients (6.1%) ... 6 of 225 patients (2.7%)" | — |
| RESCUE-Japan LIMIT mRS 0–3 31.0 vs 12.7% | large-core summary | verified | RESCUE-Japan LIMIT, NEJM — PMID 35138767 — 2022-02-09 | PubMed abstract | "31.0% in the endovascular-therapy group and 12.7%" | — |
| TENSION cOR 2.58, lower mortality | large-core summary | verified | TENSION, Lancet — PMID 37837989 — 2023-10-11 | PubMed abstract | "adjusted common OR 2·58"; "lower mortality (hazard ratio 0·67" | — |
| LASTE mortality 36.1 vs 55.5%; median mRS 4 vs 6 | large-core summary, consider[1] | verified | LASTE, NEJM — PMID 38718358 — 2024-05-09 | PubMed abstract | "median modified Rankin scale score at 90 days was 4 ... and 6"; "36.1% ... and in 55.5%" | — |
| TESLA (NCCT ASPECTS 2–5, ≤24 h) missed its primary endpoint | large-core summary | added | TESLA, JAMA — PMID 39374319, DOI 10.1001/jama.2024.13933 — 2024-09-23 | PubMed abstract | "posterior probability for superiority of thrombectomy, .96" vs required ".975 or more"; "did not demonstrate improvement" | Type corrected to Randomized trial |
| SVIN 2025: 0–6 h, age 18–80, mRS 0–1, ICA/M1, ASPECTS 0–5 → Class 1/A | large-core consider[2] | verified | SVIN large-infarct guideline — PMID 41573174, DOI 10.1161/SVIN.124.001581 — 2025 | PMC full text PMC12671639 | "within 0–6 h ... baseline mRS score 0–1, age 18–80 y old ... ASPECTS of 0–5 ... EVT is recommended ... 1 A" | — |
| SVIN 2025: ASPECTS 0–2 at 6–24 h benefit uncertain (2b) | large-core consider[2] | flagged | SVIN — PMID 41573174 | PMC full text: 6–24 h table did not render | narrative covers only ASPECTS 3–5 at 6–24 h | Wording kept from the archived transcription; access note says so |
| ATLAS IPD (6 RCTs, n=1886): aGenOR 1.63; mortality 31.1 vs 37.3%; limited evidence for core ≥150 mL beyond 6 h | large-core consider[3] | added | ATLAS, Lancet — PMID 42107392, DOI 10.1016/S0140-6736(26)00876-7 — 2026-05-07 | PubMed abstract | "aGenOR 1·63 [95% CI 1·42-1·88]"; "292 [31·1%] ... 347 [37·3%]"; "except for those with an estimated ischaemic core volume of 150 mL or greater" | Labeled as postdating AHA 2026 and SVIN 2025 |
| Trial age limits: ANGEL-ASPECT ≤80; SELECT2, TESLA ≤85; none in RESCUE-Japan LIMIT, TENSION, LASTE; TENSION mRS ≤2 | large-core caution | corrected | NCT04551664 (max 80); NCT03876457 (max 85); NCT03805308 (max 85); NCT03702413, NCT03094715, NCT03811769 (no max); SVIN 2025 special considerations | registries + PMC full text | SVIN: "ANGEL ASPECT (18–80 years old), TESLA (18–85 years old), and SELECT2 (18–85 years old) had upper thresholds"; "The TENSION trial allowed patients with baseline mRS score 0–2" | LASTE ≥80 ASPECTS rule left out (see §7) |
| ATTENTION ≤12 h: mRS 0–3 46 vs 23%, mortality 37 vs 55% (China) | basilar summary | verified | ATTENTION, NEJM — PMID 36239644 — 2022-10-13 | PubMed abstract | "within 12 hours"; "104 patients (46%) ... 26 (23%)"; "37% ... and 55%" | — |
| ATTENTION required NIHSS ≥10 | studies.json attention.limits | corrected | ATTENTION registry — NCT04751708 | registry | "NIHSS score ≥10 at the time of neuroimaging" | Was "most patients had severe deficits" |
| BAOCHE 6–24 h: 46 vs 24% | basilar summary | verified | BAOCHE, NEJM — PMID 36239645 — 2022-10-13 | PubMed abstract | "51 patients (46%) ... 26 (24%)" | — |
| TRACE-5 (China): mRS 0–1 or baseline 38 vs 29% | basilar summary | verified | TRACE-5, Lancet — PMID 41655588 — 2026-02-05 | PubMed abstract | "83 (38%) ... 66 (29%)" | — |
| ATTENTION LATE: no gain from TNK before EVT at 4.5–24 h (30 vs 30%) | basilar summary | verified | ATTENTION LATE, JAMA — PMID 42776543 — 2026-09-23 | PubMed abstract | "50 of 165 (30%) ... 50 of 164 (30%)" | — |
| ESO: BMT over EVT for NIHSS <10; IVT+EVT over direct EVT; aspiration first (weak); rescue PTA/stenting (consensus); no reperfusion for extensive bilateral/brainstem change | basilar summary, consider[1–2] | verified | ESO/ESMINT BAO guideline — PMID 38752743, DOI 10.1177/23969873241257223 — 2024 | PMC full text PMC11569583 (synoptic table) | "For patients presenting with mild-to-moderate symptoms (NIHSS < 10) ... We suggest BMT only over EVT+BMT"; "we suggest combined IVT and EVT treatment over direct EVT"; "Based on limited evidence, we suggest direct aspiration" | Certainty symbols did not render |
| AHA 2026 dominant proximal M2 2a/B-NR; nondominant/codominant M2, distal MCA, ACA, PCA COR 3: No Benefit/A | medium-distal summary + chips | verified | AHA/ASA 2026 ais-2026-120, -121 | archived transcription, pp. 53–54 | "EVT is not recommended as it does not improve functional outcomes" | Archive scope |
| SVIN 2026 r1 2a/B-NR and r2 2b/B-R verbatim | medium-distal chips | verified | SVIN DMVO focused guideline — PMID 42404835, DOI 10.1161/SVIN.125.002314 — 2026 | PMC full text PMC13331429 | "EVT may be considered in distal, codominant, or nondominant M2 occlusions who present with disabling deficits and an NIHSS score ≥6 (class IIb; LOE B-randomized)" | — |
| SVIN 2026 ACA/PCA case by case 2b; M3/M4 COR 3: No Benefit | medium-distal consider[1] | corrected (grades added) | SVIN DMVO — PMID 42404835 | PMC full text | "EVT may be considered on a case-by-case basis (class IIb"; "not recommended as a standard treatment for occlusions of the M3/M4 MCA branches (class III: no benefit; LOE B-randomized)" | Routine ACA/PCA EVT is class III |
| DISTAL n=543, no benefit | medium-distal summary | verified | DISTAL, NEJM — PMID 39908430 — 2025-02-05 | PubMed abstract | "A total of 543 participants"; "no significant difference in the distribution of modified Rankin scale scores" | Type corrected to Randomized trial |
| DISTAL 12 months: acOR 0.81 (0.59–1.12) | studies.json distal.limits | added | DISTAL 12-month, Lancet Neurol — PMID 42105785 — 2026-05-06 | PubMed abstract | "adjusted common odds ratio for better functional outcome 0·81, 95% CI 0·59-1·12" | — |
| ESCAPE-MeVO n=530; mortality 13.3 vs 8.4% | medium-distal summary | verified | ESCAPE-MeVO, NEJM — PMID 39908448 — 2025-02-05 | PubMed abstract | "Mortality at 90 days was 13.3% in the EVT group and 8.4%" | — |
| DISCOUNT n=244, stopped for futility and excess sICH; sICH 11 vs 3% among treated | medium-distal summary | verified | DISCOUNT, JAMA — PMID 42485024 — 2026-09-01 | PubMed abstract | "stopped ... for futility and increased rate of symptomatic intracranial hemorrhage"; "(11% vs 3%, P = .008)" | sICH comparison is as-treated |
| ORIENTAL-MeVO (China, NIHSS ≥6, ≤24 h): 58.6 vs 46.6%; sICH 4.7 vs 2.2% | medium-distal summary | verified | ORIENTAL-MeVO, NEJM — PMID 42127389 — 2026-05-14 | PubMed abstract | "58.6% ... 46.6%"; "4.7% ... 2.2%" | — |
| eTICI 2b–3 early with stent retriever/aspiration (1/A); GA or sedation (1/B-R); tandem 2b; IA lytic 2b/B-R; rescue angioplasty 2b | neurointerventional summary | verified | AHA/ASA 2026 ais-2026-124, -125, -126, -129, -131, -130 | archived transcription, pp. 57–58 | "either general anesthesia or procedural sedation is recommended"; "adjunctive intra-arterial thrombolytics (urokinase, alteplase, or tenecteplase) may be reasonable" | Archive scope |
| Preprocedural tirofiban COR 3: No Benefit/B-R | neurointerventional summary | corrected | AHA/ASA 2026 ais-2026-132 | archived transcription, p. 58 | "preoperative tirofiban administration before EVT is not useful" | Subtype added |
| ANGEL-REBOOT (China): bailout angioplasty/stenting did not improve outcome; sICH 5 vs 1% | neurointerventional summary | added | ANGEL-REBOOT, Lancet Neurol — PMID 38914085 — 2024-06-21 | PubMed abstract | "BAOS did not improve clinical outcome at 90 days"; "eight [5%] of 175 vs one [1%] of 169" | Population: failed recanalization or reocclusion risk |
| Avoid SBP drops during MT: prior ESO advice; no study defines a safe drop | neurointerventional consider[2] | corrected | 2025 ESO BP guideline update — PMID 42095756, DOI 10.1093/esj/aakag004 — 2026 | PMC full text PMC13151662 | "previous ESO guidelines advise that SBP drops during MT should be avoided; however, no dedicated studies provide evidence on what degree of BP reduction is clinically relevant" | Was "(ESO 2026)" |
| IA lytic after successful EVT: ANGEL-TNK, PEARL, CHOICE-2 improved mRS 0–1; CHOICE-2 mortality 12.1 vs 6.4%; POST-UK, POST-TNK, ATTENTION-IA, IAT-TOP neutral; only CHOICE-2 and IAT-TOP postdate AHA 2026 | neurointerventional consider[3] | added + corrected | ANGEL-TNK, JAMA — PMID 40616323 — 2025-08-19; PEARL, JAMA — PMID 42262770, DOI 10.1001/jama.2025.16876 — 2025-10-13; CHOICE-2, JAMA — PMID 42096239 — 2026-06-02; IAT-TOP, JAMA Neurol — PMID 42026933 — 2026-07-01; POST-UK — PMID 39804674 — 2025-02; POST-TNK — PMID 39804681 — 2025-02; ATTENTION-IA, BMJ — PMID 39809509 — 2025-01 | PubMed abstracts | CHOICE-2 "57.5% ... vs 42.5%"; "Mortality at 90 days was 12.1% ... vs 6.4%"; IAT-TOP "was not associated with improvement of functional outcomes"; PEARL "44.8% ... vs 30.2%" | ANGEL-TNK and PEARL predate the January 2026 guideline; PEARL type corrected |
| Anesthesia: SEGA and 2026 Bayesian meta-analysis lean toward GA | neurointerventional (not added) | flagged | SEGA, JAMA Neurol — PMID 41082222 — 2025-12-01; Bayesian MA, Neurology — PMID 42462185 — 2026-07-16 | PubMed abstracts | SEGA "81% posterior probability of GA superiority"; MA "GA may be preferred but confirmatory evidence is needed" | Not added: AHA keeps either approach COR 1; evidence not definitive |
| Telestroke for IVT decisions (1/B-R); teleradiology (1/B-NR); closest stroke-capable hospital; transfer protocols to cut door-in-door-out (1/B-NR) | rural-telestroke summary | verified | AHA/ASA 2026 ais-2026-31, -30, -15, -19 | archived transcription, pp. 14–20 | "telestroke systems are recommended over usual ED care for IVT decision-making"; "transfer agreements and protocols ... to reduce door-in door-out times" | Archive scope |
| Direct transport to TSC reasonable where local access exists (2a/B-NR); bypassing a proficient local center for a distant TSC: COR 3: No Benefit/B-R | rural-telestroke summary | corrected | AHA/ASA 2026 ais-2026-16, -18 | archived transcription, pp. 14–15 | "In areas with local access to thrombectomy-capable centers ... can be beneficial"; "bypassing a local stroke center to transport suspected LVO patients to a distant TSC (e.g., 45-60 minutes away) does not improve 3-month clinical outcomes" | ais-2026-17 (2b, uncoordinated systems) not added |
| Rural best practices; virtual networks | rural-telestroke sources | verified | AHA rural statement — PMID 39665145 — 2024-12-12; Virtual stroke networks — PMID 41342129 — 2025-12-04 | PubMed abstracts | "the role of telehealth and improved transfer processes" | Correction 41871197 (2026-03-23) identified, not read |
| Train all staff to activate in-hospital alerts; responders with immediate neurological expertise (AHA 2022 statement); organized protocol for all ages (AHA 2026, COR 1/B-NR) | in-hospital-stroke summary | corrected | In-hospital stroke statement, Stroke — PMID 35137601, DOI 10.1161/STR.0000000000000402 — 2022-02-09; AHA/ASA 2026 ais-2026-24 | PubMed abstract; archived transcription p. 18 | "Deliver stroke training to all hospital staff, including how to activate in-hospital stroke alerts"; "immediate access to neurological expertise"; "An organized protocol ... is recommended for patients of all ages" | Grade attribution split |
| Transitions: priorities, medication plan, follow-up owner, usable information | transitions-care summary | flagged | Person-centered care domains in stroke transitions, Stroke — PMID 38557155 — 2024-04-01 | PubMed abstract | "alignment of care with patients' values, preferences, and needs; coordination of care; information and education ... smooth transition and continuity of care" | Medication plan and named follow-up owner are not explicit in the abstract; unchanged |
| Staffing/expertise must match services; certification alone does not establish capability | stroke-program-quality summary, caution | verified | Ideal Foundational Requirements for Stroke Program Development, Stroke — PMID 36748462 — 2023-02-07; AHA PAC standards — PMID 40408522 — 2025-05-23 | PubMed abstracts | "lack of guidance on structural components such as workforce, staffing, and unit operations has resulted in heterogeneous services among hospitals credentialed at the same stroke center level" | AHA 2026 also recommends external certification (ais-2026-added-6-1, COR 1); not added |
| ESO-ESMINT 2019 MT guideline (source date only) | evt-selection, neurointerventional sources | verified | ESO-ESMINT MT guideline — PMID 31165090, DOI 10.1177/2396987319832140 — 2019 | PubMed abstract (PMC body empty) | "We found high quality evidence to recommend MT plus best medical management" | Re-dated; no claim depends on it alone |
| Currency: no new completed basilar EVT RCT | basilar card | verified (search) | PubMed search 2025/01–2026/10/21 (BAO/vertebrobasilar thrombectomy RCT) | search + abstracts | trial protocols only (ATTENTION IV, ANGEL-BAO, BEST-BAO, ANGEL-COAST) | — |
| Currency: DISTALS not published in PubMed; no completed tandem-lesion RCT; WE-TRUST not in PubMed | MeVO, neurointerventional | unresolved | PubMed searches to 2026-10-21 | search | DISTALS appears only as cited in SVIN 2026 | Recheck at next review |
| Currency: TNK-PLUS (4.5–24 h TNK before EVT) | evt-selection source | verified | TNK-PLUS, JAMA — PMID 42099212 — 2026-06-02 | PubMed abstract | — | Covered on extended-window-ivt (other unit) |
| Currency: AHA 2026 correction proposals letter | — | unresolved | Proposed Corrections to the 2026 Guideline, Stroke — PMID 42535283, DOI 10.1161/STROKEAHA.126.056478 — 2026-07-31 | PubMed record only (no abstract, no PMC) | — | Content unknown; may concern EVT recommendations |

## 5. Tests and results

New file: `tests/ev-evt-2026-10-21.test.js` (8 tests). Expected values are hardcoded from the sources named beside each assertion, not read back from the cards. The tests check:

- the contract validates at 2026-10-21;
- exact AHA 2026 COR/LOE for 16 recommendation ids across 6 cards, with exact recommendation-id order per card;
- SVIN 2026 r1/r2 verbatim with grades;
- population limits (F1, F2, F3, F5, F6, F7, F11, F12, F14);
- post-guideline labels for ATLAS, DIRECT ANGIO and CHOICE-2/IAT-TOP, and that ANGEL-TNK/PEARL are not labeled as postdating;
- the trial results as stated in the abstracts;
- that each new trial is cited on the card that summarizes it;
- study-design corrections, retained correction notices, and that the AHA 2026 source was not re-dated today.

Deliberately updated existing assertions (identical one-line date changes):

- `tests/clinical-reference-data.test.js`: review cutoff `now` 2026-10-17T23:59:59Z → 2026-10-21T23:59:59Z, plus its comment.
- `tests/ich-sah-evidence-review-2026-10-17.test.js` and `tests/evidence-ivt-bp-antiplatelet-content.test.js`: the "validates ... at the review date" `now`, same change.

Why: the validator rejects future `checkedAt` dates, and sources re-read today carry 2026-10-21, so validation at 2026-10-17 fails by design (7 failures observed before the change). Other units re-dating sources today will need the identical change, which should merge cleanly.

Results (all run 2026-10-21 in this worktree):

| Check | Result |
|---|---|
| `npm run check:clinical-claims` | PASS (exit 0) |
| `npm run content:validate` | PASS: 92 topics, 88 studies |
| `npm run evidence:validate` | PASS |
| `npm run validate:citations` | PASS: 43 rows |
| `npm run validate:inline-citations` | PASS: 15 PMIDs |
| `npm run check:leak-guard` | PASS |
| `npm run test:protocol-source` | PASS |
| `npx vitest run` (final state; needs `PLAYWRIGHT_BROWSERS_PATH`/`STROKE_CHROMIUM_PATH` from the scratchpad env) | 113 files passed; 2004 passed, 3 skipped, 0 failed. Baseline: 112 files, 1996 passed, 3 skipped. |

Without the browser environment variables, the 11 DOM test files cannot launch Chromium. That is an environment issue, not a regression.

Generated-data note: `data/clinical-reference.json` is reverted before commit as the brief requires. Run on its own before regeneration, `tests/clinical-reference-data.test.js` fails only its checksum test, and `npm run agent:assets` clears it. The full suite rewrites the file during the run, and I reverted it again afterwards. No lock was run with `--update`. `test:protocol-tab` was not needed: no shared module, global CSS or app shell was changed.

## 6. Protocols observations (report only)

- **P1.** In the frozen Protocols EVT quick reference (`src/ProtectedProtocols.jsx` ≈ lines 430–431, 1747–1748, 2275–2276), the 0–6 h tier reads "ASPECTS 3-5 with no significant mass effect: EVT, COR I / LOE A".
  - The AHA text for that tier (ais-2026-114, ASPECTS 3–10) has no mass-effect or age criterion.
  - Likewise, "ASPECTS 0-2, age <80, no significant mass effect, and CTP core ≤70 mL: COR IIa / LOE B-R" adds a CTP-core qualifier that ais-2026-117 does not contain.
  - The page frames these as institutional qualifiers, so they may be intended local policy. If so, the owner may want each labeled as "AHA grade with institutional qualifier".
- **P2.** No other EVT-tier wording in Protocols conflicted with the archived AHA 2026 text that was checked: basilar (NIHSS ≥10 COR I; NIHSS 6–9 IIb), mRS 2 (IIa) and mRS 3–4 (IIb), and 6–24 h ASPECTS 3–5 with age <80.

## 7. Unresolved uncertainties

1. **AHA/ASA 2026 full text** remains unreachable; every AHA grade here is archive scope.
   - The writing-group response says the final print edition adds supporting text to 4.7.2 #2, and gives both "July 2026" and "March 2026" for it.
   - Other print-edition changes, the July correction notice (42507797; partially recovered in the archive), and the "Proposed Corrections" letter (42535283; no abstract or PMC) were not verified.
2. **SVIN 2025 6–24 h table** did not render in PMC; the 2b for 6–24 h ASPECTS 0–2 relies on the archived transcription.
3. **LASTE in patients over 80**: the ASPECTS requirement is 4–5 per SVIN 2025 but 3–5 per my earlier registry reading. It was left off the card; resolve from the LASTE protocol.
4. **Correction notices not reconciled**: SELECT2, TEMPO-2, RACECAT, BEST-MSU, SKIP and the ATTENTION 1-year analysis. Notes were kept and none were cleared. The RACECAT topic-level source on code-stroke-activation lacks the note that its study-source entry carries.
5. **Virtual-networks correction** 41871197 was not read.
6. **transitions-care**: the summary's "medication plan" and "named follow-up owner" are not explicit in the cited statement's abstract. Left unchanged and flagged.
7. **Not yet published in PubMed**: DISTALS, WE-TRUST, the tandem-lesion RCTs, and the basilar EVT RCTs ATTENTION IV, ANGEL-BAO, BEST-BAO and ANGEL-COAST (protocols only). Recheck at the next review.
8. **Anesthesia**: newer data (SEGA; 2026 Bayesian meta-analysis) lean toward GA but are not definitive. Not added, since AHA 2026 keeps both approaches at COR 1.
9. **evidence-interpretation**: its CEBM source returned 403, so the card is unchanged and its source is not re-dated.

## Cross-area patches for the lead

These are exact proposed patches for files owned by other units. I did not edit these files. X1 and X2 were exercised on a temporary copy that was then deleted (`patch-probe.mjs` in the scratchpad). The copy's outputs are summarized under each patch. Neither patch changes a tier (all affected branches stay `review`): only the message changes.

### X1 — `src/encounter-clinical-review.js:231` (premorbid mRS >1)

Evidence:

- ais-2026-118 (2a/B-NR): "In AIS patients with anterior circulation proximal LVO (ICA or M1) presenting within 6 hours, NIHSS 6 or greater, ASPECTS 6 or greater, and prestroke mRS of 2, EVT is reasonable".
- ais-2026-119 (2b/B-NR): the same criteria for mRS 3–4, "might be reasonable".
- No AHA 2026 recommendation covers mRS >1 beyond 6 h, for basilar or M2 occlusion, or for mRS 5.

The current message ("use the separate baseline-disability recommendation") implies coverage that does not exist.

```js
// old
  else if (mrs > 1) evt = review(`Premorbid mRS ${mrs}: use the separate baseline-disability recommendation and individualized goals; disability is not an automatic exclusion.`);
// new
  else if (mrs > 1) evt = review(mrs <= 4 && hours <= 6 && vessels.some(v => ['ICA', 'M1'].includes(v))
    ? `Premorbid mRS ${mrs}: per AHA/ASA 2026, EVT ${mrs === 2 ? 'is reasonable (COR 2a, LOE B-NR)' : 'might be reasonable (COR 2b, LOE B-NR)'} for ICA/M1 occlusion within 6 h with NIHSS ≥6 and ASPECTS ≥6; confirm NIHSS, ASPECTS and individualized goals.`
    : `Premorbid mRS ${mrs}: no AHA/ASA 2026 recommendation covers this baseline disability with this vessel or time window; individualized neurointerventional review. Disability is not an automatic exclusion.`);
```

Probe outputs:

| Case | Message |
|---|---|
| M1, 3 h, mRS 2 | "...EVT is reasonable (COR 2a, LOE B-NR)..." |
| ICA, 5 h, mRS 4 | "...might be reasonable (COR 2b, LOE B-NR)..." |
| M1, 8 h, mRS 2 | "no AHA/ASA 2026 recommendation covers..." |
| Basilar, mRS 3 | "no AHA/ASA 2026 recommendation covers..." |
| M1, 3 h, mRS 5 | "no AHA/ASA 2026 recommendation covers..." |

No existing test pins the old message.

### X2 — `src/encounter-clinical-review.js:238` (ICA/M1 with ASPECTS <6)

Evidence:

- ais-2026-114 (1/A) covers ASPECTS 3–10 within 6 h with no age or mass-effect criterion.
- ais-2026-117 (2a/B-R): within 6 h, ASPECTS 0–2, "age under 80 ... and without significant mass effect".
- ais-2026-116 (1/A): 6–24 h, ASPECTS 3–5, "age under 80 ... without significant mass effect".
- No AHA 2026 recommendation covers ASPECTS 0–2 beyond 6 h.

```js
// old
    else evt = review('Large-core assessment requires the complete age, timing, imaging and mass-effect pathway; ASPECTS alone cannot establish eligibility.');
// new
    else if (hours <= 6 && aspects >= 3) evt = review('ICA/M1 within 6 h, NIHSS ≥6, ASPECTS 3–5, premorbid mRS 0–1: covered by the AHA/ASA 2026 ASPECTS 3–10 recommendation (COR 1, LOE A), which has no age criterion. Expect more hemorrhage; confirm the complete assessment with the neurointerventional team.');
    else if (hours <= 6) evt = review(age < 80 ? 'ICA/M1 within 6 h, ASPECTS 0–2: EVT is reasonable only with age <80, NIHSS ≥6, premorbid mRS 0–1 and no significant mass effect (AHA/ASA 2026 COR 2a, LOE B-R); confirm mass effect on imaging.' : 'ICA/M1 within 6 h, ASPECTS 0–2, age ≥80: outside the AHA/ASA 2026 COR 2a criteria (age <80); individualized neurointerventional review.');
    else if (aspects >= 3) evt = review(age < 80 ? 'ICA/M1 at 6–24 h, ASPECTS 3–5: EVT is recommended only with age <80, NIHSS ≥6, premorbid mRS 0–1 and no significant mass effect (AHA/ASA 2026 COR 1, LOE A); confirm mass effect on imaging.' : 'ICA/M1 at 6–24 h, ASPECTS 3–5, age ≥80: outside the AHA/ASA 2026 COR 1 criteria (age <80); individualized neurointerventional review.');
    else evt = review('ICA/M1 at 6–24 h, ASPECTS 0–2: no AHA/ASA 2026 recommendation covers this core size beyond 6 h; individualized neurointerventional review.');
```

Probe outputs:

| Case | Message |
|---|---|
| Age 85, 3 h, ASPECTS 4 | "...COR 1, LOE A), which has no age criterion" |
| Age 82, 3 h, ASPECTS 1 | "outside ... COR 2a criteria (age <80)" |
| Age 81, 10 h, ASPECTS 4 | "outside ... COR 1 criteria (age <80)" |
| 10 h, ASPECTS 2 | "no AHA/ASA 2026 recommendation covers this core size beyond 6 h" |
| Missing ASPECTS | still `pending('Document assessed ASPECTS.')` |

The lead may prefer `matched` for ≤6 h ASPECTS 3–5, because it is the same COR 1 tier as the matched ASPECTS ≥6 branch. I kept `review` so that no screen tier changes.

Suggested regression tests for the owning unit:

```js
const screen = (note, hours, aspects) => evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', age: '70', nihss: '12', premorbidMRS: '0', ctHemorrhageStatus: 'absent', vesselOcclusion: ['M1'], ...note }, clock: { total: hours, label: 'LKW' }, aspects, now: new Date('2026-10-21T12:00:00') }).evt;
expect(screen({ premorbidMRS: '2' }, 8, '8').reason).toContain('no AHA/ASA 2026 recommendation covers this baseline disability');
expect(screen({ premorbidMRS: '3' }, 3, '8').reason).toContain('might be reasonable (COR 2b, LOE B-NR)');
expect(screen({ age: '85' }, 3, '4').reason).toContain('(COR 1, LOE A), which has no age criterion');
expect(screen({ age: '81' }, 10, '4').reason).toContain('outside the AHA/ASA 2026 COR 1 criteria (age <80)');
```

### X3 — report only: codominant proximal M2 (`src/encounter-clinical-review.js:244`)

SVIN 2026 (PMC13331429) r1 covers "proximal and/or dominant M2" (2a), while r2 covers "distal, codominant, or nondominant M2" (2b). A codominant proximal M2 fits both. The screen maps codominant to the 2b/COR 3 message. That is defensible, but the source wording is ambiguous. No patch is proposed; this is an owner decision.

### X4 — optional low-severity note: `src/calculators-extended.js` `evaluateLargeCoreEVT`

RESCUE-Japan LIMIT is modeled only at ≤6 h. SVIN 2025 lists its eligibility as "ASPECTS 3—5 using CT or MRI within 6 h | ASPECTS 3—5 and no FLAIR changes within 6—24 h". To make the partial model explicit, add to `modeledSubsets`:

```js
    modeledSubsets: { LASTE: 'Only the age <80, ASPECTS 0–2, ≤6.5h subset is modeled here. Other LASTE age/imaging profiles and MRI-selected unknown onset are not evaluated; a missing match is not a trial exclusion.', 'RESCUE-Japan LIMIT': 'Only the ≤6 h ASPECTS 3–5 subset is modeled; its 6–24 h DWI-ASPECTS 3–5 without FLAIR change subset is not evaluated.' },
```

The other checked thresholds agree with the registries and SVIN read today:

- SELECT2 and TESLA ages 18–85;
- ANGEL-ASPECT ≤80 and NIHSS 6–30;
- TENSION mRS ≤2;
- the TESLA branch does not set `eligible`.

`evaluateDAWN` (age/NIHSS/core tiers, 6–24 h) and `evaluateDEFUSE3` (core <70 mL, ratio ≥1.8, 6–16 h) agree with the DAWN and DEFUSE 3 abstracts. The 15 mL mismatch volume and the age 18–90 limit come from the trial protocol and were not re-read today.

`src/encounter-details.js` post-reperfusion fields and `src/supplementary-calculator-definitions.js` gave no EVT findings. mTICI is captured in `Encounter.jsx`.
