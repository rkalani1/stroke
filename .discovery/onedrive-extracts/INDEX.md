# OneDrive Stroke Center — Discovery Extract Index

**Source root:** `/Users/rizwankalani/Library/CloudStorage/OneDrive-UW/Stroke Center/`
**Output root:** `/Users/rizwankalani/code/stroke/.discovery/onedrive-extracts/`
**Extraction date:** 2026-05-02
**Tools used:** `markitdown` (with `[docx,pptx,pdf]` extras installed via `pip3.11 install --user`); `pdftotext -layout` for the HMC Rx Algorithm PDF; embedded image extraction (zip → PNG) for image-only docs; multimodal Read for OCR-equivalent transcription.

---

## Successfully Extracted (Priority)

### 1. `acute-stroke-algorithm-aug-2025.md`
- **Source:** `Stroke algorithm updates/Acute Stroke Algorithm Aug 2025.docx` (Aug 2025; ~497 KB)
- **Title:** Acute Stroke Evaluation and Treatment — UW Medicine CSC at Harborview, August 2025
- **Scope:** One-page master flow chart from Code Stroke / PULSARA activation through ED first-15-minute checklist, NCCT triage gate (blood vs no blood), branched IPH / SAH / IVT / EVT pathways, and final swallow + admit. Stroke phone 206-744-6789 visible on chart.
- **Extraction note:** Source docx is image-only (1 PNG, no text runs). Manually transcribed from image; original PNG saved to `images/acute-stroke-algorithm-aug-2025-01.png`.

### 2. `hmc-rx-algorithm-7-2025.md`
- **Source:** `Stroke algorithm updates/HMC_Rx_Algorithm 7_2025.pdf` (July 2025; ~764 KB)
- **Title:** Acute Stroke Evaluation and Treatment (updated June 2023, revised July 2025)
- **Scope:** Earlier text-based version of the same master flow. Two-column ED key elements (first 15 min) on left, IPH / SAH / IVT / EVT branches on right, with TODO annotations for editors (e.g. "edited and in folder", "needs EDITS", "add bullet to document ICH score / H&H score", "bullet for safety pause", post-EVT timing of dual antiplatelet links).
- **Extraction note:** Re-extracted with `pdftotext -layout` (markitdown produced fragmented column flow). Editor-side TODO annotations are part of source document — useful signal for what content app should make canonical.

### 3. `reverse-coag-9-2025.md`
- **Source:** `ReverseCoag 9_2025 FINAL combined edits 9.23 rk.docx` (Sept 24 2025; ~63 KB)
- **Title:** Guidelines for Reversing Coagulopathies in Patients with Symptomatic Spontaneous Intraparenchymal Hemorrhage
- **Scope:** Full reversal protocol with sub-protocols by anticoagulant class — Warfarin, Heparin/LMWH, Argatroban/Bivalirudin, DOACs (apixaban/rivaroxaban with andexanet alfa decision tree, dabigatran with idarucizumab), antiplatelets, fibrinolytics. Includes lab thresholds, 4-factor PCC dosing tables, and andexanet alfa low/high-dose criteria.
- **Extraction note:** ~12 KB markdown; tables and dosing preserved. ~1 leading image preserved as base64 stub.

### 4. `inpatient-code-stroke-checklist-nov-2024.md`
- **Source:** `NEW Inpatient Code Stroke Checklist and Flow Chart_Nov.2024.AKC.pdf` (Dec 11 2024; ~666 KB)
- **Title:** Step-by-Step Inpatient Code Stroke Checklist (BEFAST trigger → x222 page → bedside → CT → orders)
- **Scope:** Roles for primary RN, primary team provider, neuro team, STAT/ICU RN through to post-imaging flow. Includes BEFAST defining criteria (focal, disabling, new, last known well ≤24h) and inclusion criteria for the Inpatient Code Stroke order set. Authored/maintained by Anna Kwak-Callen, Stroke Program Manager.
- **Extraction note:** Clean text from markitdown; 86 lines.

### 5. `pulsara-use-stroke-call.md`
- **Source:** `Pulsara Use during Stroke Call.pptx` (Nov 2024; ~43 KB)
- **Title:** PULSARA — Stroke Call Responsibilities
- **Scope:** Short slide deck describing on-call provider Pulsara responsibilities, login workflow, the canned "mix TNK. ED, confirm order placed" pre-typed message, and acute reperfusion-therapy communication. Brief — single focus on Pulsara.

### 6. `telestroke-partner-hospital-checklist-2024.md`
- **Source:** `Telestroke Partner Hospital Checklist_2024.docx` (Aug 5 2024; ~649 KB)
- **Title:** Checklist for Telestroke Consult Requests
- **Scope:** Procedure for partner-hospital providers — identify telestroke need, call the Transfer Center stroke phone, prep imaging/labs, assemble information for vascular neurologist consult, IVT/EVT decision support.

### 7. `when-to-call-ip-stroke-codes-flowchart.md`
- **Source:** `when to call IP stroke codes flow chart 11_1 edits.pptx` (Dec 13 2024; ~4.7 MB)
- **Title:** Comprehensive Stroke Center — Inpatient Code Stroke Process
- **Scope:** PowerPoint flowchart on when to call an IP code stroke (BEFAST screen, last known well ≤24h, focal/disabling/new). Includes presenter notes and additional educational frames. Authored by Anna Kwak-Callen.

### 8. `potential-workflow-ip-code-stroke-hmc-csc.md`
- **Source:** `Potential Workflow for IP Code Stroke HMC CSC.pptx` (Dec 12 2024; ~553 KB)
- **Title:** Potential Workflow — Inpatient Code Stroke at HMC CSC
- **Scope:** Companion deck to #7 sketching proposed inpatient code stroke workflow, including triggers, paging, response team, and imaging path. Includes BEFAST recap slide.

### 9. `mission-vision.md`
- **Source:** `Mission & Vision 8_14 combined edits RK.docx` (Aug 15 2024; ~22 KB)
- **Title:** Comprehensive Stroke Center — Mission & Vision
- **Scope:** Working draft of mission statement, vision, and values for the UW Medicine CSC. Includes placeholder/template language ("[One concise sentence that captures the most authentic and compelling reason for being]") indicating this is unfinished prose.

### 10. (DUPLICATE) — see #1 above
- Listed in priority list as `Stroke Center/Acute Stroke Algorithm Aug 2025.docx`, but the file does **not exist at the top level of `Stroke Center/`**. Only copy is in `Stroke algorithm updates/`. Treat as same as #1.

### 11. `evt-eligibility-flowchart.md`
- **Source:** `Stroke algorithm updates/EVT Eligibility Flowchart.docx` (Nov 24 2024; ~580 KB)
- **Title:** EVT Eligibility Criteria
- **Scope:** Branched flowchart by vessel occlusion type (basilar / anterior LVO / medium-vessel) and time window (early 0-6h vs late 6-24h), with NIHSS, ASPECTS, mRS thresholds. Notes age >90 caution and Neuro-IR concurrence requirement.
- **Extraction note:** Source docx is image-only (1 PNG, no text). Transcribed from `images/evt-eligibility-flowchart-01.png`.

### 12. `extended-window-thrombolytic-trials.md`
- **Source:** `Stroke algorithm updates/extended window thrombolytic trials.docx` (Nov 25 2025; ~38 KB)
- **Title:** Extended Window Thrombolytic Trials (summary table)
- **Scope:** Comparison table — trial, year, agent, window, selection modality, core criteria, mismatch criteria (ratio), population, EVT rate, n, primary result + sICH rate. Designed for quick at-bedside extended-window decision support.

### 13. (DUPLICATE) — see #2 above
- Listed in priority list as `Stroke Center/HMC_Rx_Algorithm 7_2025.pdf`, but the file does **not exist at top level of `Stroke Center/`**. Only copy is in `Stroke algorithm updates/`. Treat as same as #2. (A second August 2025 copy exists in `Stroke algorithm updates/Stroke Algorithm Updates June 2025/HMC_Rx_Algorithm 7_2025.pdf` at ~711 KB — also same.)

### 14. `late-window-lytic-selection-slide.md`
- **Source:** `Stroke algorithm updates/late window lytic selection slide.pptx` (Apr 7 2026; ~1.4 MB)
- **Title:** Imaging Selection for Unknown / Wake-up or 4.5-9h
- **Scope:** Two-slide deck mapping imaging-modality choices to trial provenance: MRI DWI/FLAIR mismatch (WAKE-UP, THAWS, ROSE-TNK), CTP (EXTEND, TRACE III, ECASS-4, HOPE). Notes mismatch volume thresholds (10cc/1.2 mismatch for EXTEND, ECASS-4, HOPE; 15/1.8 for TRACE III). Strong preference for MRI in small-vessel, posterior circulation, or contrast-allergic patients.
- **Extraction note:** Slide is mostly an image; markitdown captured the text block + presenter notes.

### 15. `tnk-for-ais.md`
- **Source:** `Stroke algorithm updates/TNK for AIS.docx` (Nov 25 2025; ~43 KB)
- **Title:** Intravenous Tenecteplase (TNK) for Acute Ischemic Stroke — Protocol for HMC & UWMC
- **Scope:** Comprehensive TNK protocol — dosing (0.25 mg/kg, max 25 mg), administration (single bolus IV push over 5 sec), inclusion/exclusion criteria, post-TNK monitoring, BP targets pre/post, ICH complications, and angioedema management. ~14 KB of clean markdown.

### 16. `stroke-pocket-cards-v4.md` (LATEST — May 1 2026)
- **Source:** `Stroke Pocket Card Updates 2026/Stroke Pocket Cards v4.docx` (May 1 2026; ~1.05 MB)
- **Title:** Stroke Pocket Cards v4 (5-card set)
- **Scope:** (1) IVT eligibility decision algorithm with TNK 0.25 mg/kg dosing; (2) IVT contraindication tables (absolute / relative / "consider"); (3) DOAC-exposed IVT pathway with HMC-specific anti-Xa undetectable rule and patient-discussion script; (4) EVT eligibility matrix by vessel × time × ASPECTS × mRS with COR/LOE; (5) COR/LOE legend + BP management table (pre-IVT, post-IVT 24h, post-EVT 24h, SBP <140 harm warning, ischemic-no-reperfusion).
- **Extraction note:** Source docx contains only 5 PNG images (zero text runs). All five PNGs extracted to `images/stroke-pocket-cards-v4-{01..05}.png`; full content manually transcribed from images. **This is the gold-source pocket card content for the CDS app.**

### 17. `evt-eligibility-flowchart-v3.md` (LATEST — May 1 2026)
- **Source:** `Stroke Pocket Card Updates 2026/EVT Eligibility Flowchart v3.pptx` (May 1 2026; ~445 KB)
- **Title:** EVT Eligibility Flowchart v3
- **Scope:** Same matrix as Card 4 of Pocket Cards v4 — anterior LVO / M2 distal / nondominant M2-MCA-ACA-PCA / basilar, by time × ASPECTS × additional criteria, with COR + LOE columns.
- **Extraction note:** Pptx is image-only. Transcribed from `images/evt-eligibility-flowchart-v3-01.png`. **Content duplicates Card 4 of Pocket Cards v4** — they are the same artifact in different containers; use Pocket Cards v4 as canonical source.

### 18. Drafts subfolder (`Stroke Pocket Card Updates 2026/draftts/`)
Contents inventoried — these are intermediate drafts; v4 (May 1 2026) is canonical:
- `EVT Eligibility Flowchart.pptx` (Apr 26) — earlier version
- `EVT Eligibility Flowchart v2.pptx` (Apr 29) — earlier version
- `EVT Eligibility Flowchart v3.pptx` (Apr 30) — same as the published v3 in parent folder (same byte count would indicate hard link or copy)
- `Stroke Pocket Cards v3.docx` (Apr 29) — earlier version (~1.5 MB)
- `Stroke Pocket Cards v4.docx` (Apr 30) — same as parent folder's v4 (slightly different size: 1,079,746 vs 1,079,814 bytes — near-identical)
- `stroke pocket cards 4_29.docx` (Apr 26) — earlier version
- `stroke pocket cards v2.docx` (Apr 21) — earlier version
- `stroke pocket card updates.xlsx` (Mar 17) — change log spreadsheet (not extracted; xlsx)

**Drafts NOT separately extracted** — v4 in parent folder is the latest. Note: the v4 docx in `draftts/` is 68 bytes smaller than the one in the parent folder (likely a final pass).

---

## Successfully Extracted (Bonus — small/highly-relevant inventoried docs)

### `note-template-is-tia.md`
- **Source:** `Note templates/IS - TIA.docx` (Mar 31 2026; ~37 KB) — 276 lines
- Ischemic stroke / TIA admit + progress note template (dot-phrase style).

### `note-template-ich.md`
- **Source:** `Note templates/ICH.docx` (Mar 9 2026; ~22 KB) — 243 lines
- ICH admit + progress note template.

### `pediatric-acute-ischemic-stroke-may-2026.md`
- **Source:** `Pediatric Stroke/Acute Ischemic Stroke in Children 5_2026.docx` (May 1 2026; ~44 KB) — 165 lines
- Pediatric AIS protocol — most current version.

### `stroke-call-checklist-uw-providers.md`
- **Source:** `Checklists UW and OSH/Stroke Call Checklist for UW Providers.docx` (Nov 15 2024; ~390 KB) — 62 lines
- UW provider stroke-call checklist.

### `stroke-phone-checklist.md`
- **Source:** `Checklists UW and OSH/StrokePhone Checklist 12_23.docx` (Dec 23 2024; ~22 KB) — 62 lines
- Stroke-phone vascular-neurology call-taker checklist.

### `direct-to-angio-protocol.md`
- **Source:** `Direct to angio/Direct to Angio for LVO pts without lytics and within 3h of last neuroimaging.docx` (Oct 30 2025; ~17 KB) — 16 lines
- Direct-to-angio LVO criteria (no lytics, within 3h of last neuroimaging).

### `dapt-minor-stroke-tia-trials.md`
- **Source:** `Clinical Reference & Summaries/DAPT Minor Stroke-TIA Trials.docx` (Apr 2024; ~18 KB) — 19 lines
- Dual antiplatelet therapy minor-stroke / TIA trial summary.

### `basilar-artery-occlusion-evt-trials.md`
- **Source:** `Clinical Reference & Summaries/Basilar Artery Occlusion EVT Trials.docx` (Nov 2025; ~18 KB) — 15 lines
- BAO EVT trial summary.

### `large-core-lvo-evt-trials.md`
- **Source:** `Clinical Reference & Summaries/Large Core Anteior Circulation LVO EVT Trials.docx` (Feb 2023; ~25 KB) — 16 lines
- Large-core anterior circulation LVO EVT trial summary.

### `communication-with-neurosurgery.md`
- **Source:** `Institutional Guidelines, Protocols/Communication with Neurosurgery.docx` (Dec 2 2024; ~21 KB) — 15 lines
- Stroke→neurosurgery communication SOP.

---

## Failed Extractions

**None of the priority items failed.** Initial dependency issue (markitdown installed without `[docx,pptx]` extras) was resolved in-session by `pip3.11 install --user 'markitdown[docx,pptx,pdf]'`.

**Caveats** for items that required image transcription rather than text extraction:
- `acute-stroke-algorithm-aug-2025.docx` — image-only (1 PNG); transcribed via multimodal Read.
- `EVT Eligibility Flowchart.docx` — image-only (1 PNG); transcribed.
- `Stroke Pocket Cards v4.docx` — image-only (5 PNGs); transcribed.
- `EVT Eligibility Flowchart v3.pptx` — image-only (1 PNG); transcribed.

These transcriptions are high-fidelity but should be spot-checked against the source images before downstream use. Original images preserved in `images/`.

**Items NOT extracted (intentional, see Inventory below):**
- Most files in inventory subfolders (Checklists drafts, Clinical Reference, Direct to angio, Institutional Guidelines, etc.) — listed but not converted, per instructions ("inventory only, no extraction unless trivially small/obviously relevant").
- xlsx files — markitdown does support xlsx but they were inventory-only items.

---

## Subfolder Inventory (no extraction unless flagged "EXTRACTED")

### `Checklists UW and OSH/`
```
.
├── Stroke Call Checklist for UW Providers.docx          (Nov 15 2024, 390 KB)  [EXTRACTED]
├── StrokePhone Checklist 12_23.docx                     (Dec 23 2024, 22 KB)   [EXTRACTED]
├── Telestroke Checklist for OSH Providers_revised 12_19 APD.pptx  (Dec 19 2024, 98 KB)
├── Telestroke Checklist for OSH Providers.pptx          (Nov 15 2024, 92 KB)
└── drafts/
    ├── StrokePhone Checklists 11_15 APD edits.docx      (Aug 8 2024, 390 KB)
    ├── StrokePhone Checklists 9_2024 for Telestroke Partners.docx  (Sep 12 2024, 25 KB)
    └── Telestroke Checklist for OSH Providers.pptx      (Oct 25 2024, 47 KB)
```

### `Clinical Reference & Summaries/`
```
.
├── Acute Ischemic Stroke in Children 1.docx             (Oct 27 2024, 49 KB)   # superseded by Pediatric Stroke/ files
├── Acute Ischemic Stroke in Children.docx               (Oct 27 2024, 49 KB)   # exact dup of above (same byte count)
├── Basilar Artery Occlusion EVT Trials.docx             (Nov 16 2025, 18 KB)   [EXTRACTED]
├── checklists-documentation.docx                        (Jan 14 2022, 502 KB)  # very old
├── DAPT Minor Stroke-TIA Trials.docx                    (Apr 10 2024, 18 KB)   [EXTRACTED]
├── Large Core Anteior Circulation LVO EVT Trials.docx   (Feb 12 2023, 25 KB)   [EXTRACTED]  # spelling: "Anteior"
├── Thrombolytic Therapy AIS 4.5-24h RCTs.xlsx           (Feb 10 2026, 14 KB)
└── WSO Hyperacute Essential Stroke Care Checklist.pdf   (Feb 5 2024, 157 KB)
```

### `Direct to angio/`
```
.
├── Direct to Angio for LVO pts without lytics and within 3h of last neuroimaging.docx  (Oct 30 2025, 17 KB)  [EXTRACTED]
└── Direct to Angio notes and prior communications.docx  (Oct 30 2025, 71 KB)
```

### `Institutional Guidelines, Protocols/`
```
.
├── 2026 Internalizing AIS guidelines/
│   └── 2026 Acute Ischemic guidelines internalized APD draft.docx  (Apr 7 2026, 1.5 MB)  # large draft of internalized AIS guideline
├── Acute BP Mgmt in sICH - review of evidence.docx      (Apr 2 2026, 343 KB)
├── Code stroke MRI/
│   ├── hyperacute stroke MRI process.pptx               (Apr 10 2026, 37 KB)
│   ├── Limited Hyperacute Stroke MRI process 2_11_26.docx  (Apr 10 2026, 228 KB)
│   ├── LVO and contrast allergy.pdf                     (Nov 5 2024, 53 KB)
│   ├── Notes from 12_10_25 MRI meeting.docx             (Mar 20 2026, 15 KB)
│   └── Stroke code MRI EPIC, Pulsara rev 2_11_2026.docx (Apr 10 2026, 36 KB)
├── Communication with Neurosurgery.docx                 (Dec 2 2024, 21 KB)    [EXTRACTED]
├── EVT for AIS w large infarct - comparison HMC protocol and SVIN guideline.docx  (Apr 22 2025, 18 KB)
├── Extended window lytics/
│   ├── 2026_SFGH_IV_Thrombolysis_for_Acute_Ischemic_Stroke_Guidelines.pdf (Mar 19 2026, 769 KB)
│   ├── Thrombolytic Therapy AIS 4.5-24h RCTs.xlsx       (Apr 12 2026, 23 KB)
│   └── trials/  (10 trial PDFs: CHABLIS-T II, EPITHET, EXPECTS, EXTEND, HOPE, OPTION, TIMELESS, TRACE-III, TWIST, WAKE-UP)
├── IPH BP order sets/
│   ├── ED Stroke Followup IPH.pdf                       (Jul 3 2025, 277 KB)
│   ├── FInal ICH BP mgmt slide 3_2026.pptx              (Mar 25 2026, 49 KB)
│   ├── ICH Acute BP Management f.pptx                   (Mar 17 2026, 22 KB)
│   ├── ICH BP Guidance.pdf                              (Apr 7 2026, 128 KB)
│   ├── July 2025 sICH BP mgmt - EPIC-IT discussion.docx (Sep 17 2025, 42 KB)
│   ├── Neuro Acute Care Stroke IPH Admit Order Set 304217.pdf  (Jul 3 2025, 4.4 MB)
│   ├── NEURO ICU Admit Stroke IPH 304038 (1).pdf        (Jul 3 2025, 5.1 MB)
│   └── sICH BP mgmt - EPIC-IT discussion.docx           (Jul 17 2025, 30 KB)
├── Minimally invasive surgery/
│   ├── ENRICH criteria RK.pptx                          (Nov 15 2024, 295 KB)
│   ├── Minimally Invasive Evacuation.pptx               (Nov 15 2024, 294 KB)
│   ├── Minimally Invasive Surgery 2_10.docx             (Feb 10 2026, 19 KB)
│   ├── MINUTE Intro Synopsis SOA_11.19.2025.docx.pdf    (Dec 10 2025, 225 KB)
│   └── Stroke Didactics Review Deck v2 (review).pptx    (Dec 10 2025, 40 KB)
└── NCCS feedback on ICH BP mgmt algorithm - 6.11.25.docx  (Jun 11 2025, 21 KB)
```

### `Note templates/`
```
.
├── clean Dec 2025/
│   ├── ICH.docx                                         (Dec 9 2025, 29 KB)
│   └── IS - TIA.docx                                    (Mar 9 2026, 30 KB)
├── DQ - QI Stroke note templates suggestions.docx       (Jan 20 2026, 17 KB)
├── DQ - Stroke dotphrases from residency.pdf            (Jan 20 2026, 706 KB)
├── ICH_Discharge_Summary_Template.rtf                   (Sep 4 2025, 44 KB)
├── ICH.docx                                             (Mar 9 2026, 21 KB)    [EXTRACTED as note-template-ich.md]
├── IS - TIA.docx                                        (Mar 31 2026, 36 KB)   [EXTRACTED as note-template-is-tia.md]
├── IS_TIA_Discharge_Summary_Template.rtf                (Sep 4 2025, 45 KB)
├── older versions/
│   ├── ICH note templates.docx                          (Nov 19 2024, 24 KB)
│   ├── IS note templates.docx                           (Dec 16 2024, 54 KB)
│   └── Ischemic Stroke & TIA evaluation & mgmt.docx     (Oct 21 2024, 18 KB)
└── stroke templates - rk/
    ├── ICH admit, progress note templates.docx          (Nov 5 2025, 22 KB)
    ├── ICH Discharge Summary.docx                       (Dec 2 2025, 22 KB)
    ├── IS-TIA admit, progress note templates.docx       (Dec 2 2025, 26 KB)
    └── IS-TIA Discharge Summary.docx                    (Dec 2 2025, 23 KB)
```

### `Pediatric Stroke/`
```
.
├── Acute Ischemic Stroke in Childhood TNK.docx          (Sep 6 2024, 43 KB)
├── Acute Ischemic Stroke in Children 11_15 version with flow sheet.docx  (May 1 2026, 52 KB)  # appears to be older version, recently re-saved
├── Acute Ischemic Stroke in Children 5_2026.docx        (May 1 2026, 43 KB)    [EXTRACTED]    # latest
└── Pediatric Stroke Totals.xlsx                         (Mar 21 2025, 24 KB)
```

### `practice-informing studies, guidelines/`
```
.
├── ESOC 2025.docx                                       (May 27 2025, 1.9 MB)
└── IA thrombolysis trials.docx                          (May 24 2025, 511 KB)
```

### `Stroke algorithm updates/Stroke Algorithm Updates June 2025/`
```
.
├── 2025 Acute Stroke Algorithm.pptx                     (Dec 2 2025, 54 KB)
├── 2025 Stroke Order Sets/
│   ├── Contrast Allergy Premedication Order.pdf
│   ├── ED Stroke.pdf
│   ├── GEN Inpatient Code Stroke.pdf
│   ├── Life-Threatening Angioedema Treatment Prevention (for post-thrombolytic angioedema).pdf
│   ├── NCCS NSURG Acute Care SAH and Vascular (HMC).pdf
│   ├── NCCS NSURG SAH Vasular Post-Procedure Panel.pdf
│   ├── NCCS NSURG Spontaneous SAH ICU Admit (HMC).pdf
│   ├── NEURO Acute Care Stroke IPH Admit.pdf
│   ├── Neuro Acute Care Stroke Ischemic Admit Order Set 304037.pdf
│   ├── NEURO ICU Admit Non-Stroke (UWMC & HMC).pdf
│   ├── NEURO ICU Admit Stroke IPH.pdf
│   ├── NEURO ICU Admit Stroke Ischemic Thrombolytic Given or Thrombectomy Done 304039.pdf  # appears duplicate-ish of:
│   ├── NEURO ICU Admit Stroke Ischemic Thrombolytic Given or Thrombectomy Done.pdf
│   ├── NEURO ICU Admit Stroke Ischemic Thrombolytic NOT Given or Thrombectomy NOT Done.pdf
│   ├── NEURO Post Thrombectomy (UWMC & HMC).pdf
│   ├── NEURO Post Thrombolytic Hemorrhage (ICH) Reversal.pdf
│   ├── NEURO Tenecteplase (TNK) for STROKE.pdf
│   ├── ref_AHA_Ischemic_ICU_BP_Rx.pdf
│   └── Reversing Coagulopathies.pdf
├── 2025-2026 Acute Stroke Algorithm w:active links.pdf  (Apr 23 2026, 368 KB)
├── 2026 Stroke Club Flyer.pdf                           (Jan 5 2026, 145 KB)
├── Acute Stroke Algorithm_2025_ RK.docx                 (Oct 15 2025, 491 KB)
├── AHA Guidelines link for algorithm/
│   ├── bushnell 2024 Primary Prevention of Stroke.pdf
│   ├── kleindorfer 2021 Prevention of Stroke after Stroke/TIA.pdf
│   ├── ref_AIS.pdf
│   ├── ref_IPH.pdf
│   └── ref_SAH.pdf
├── AY25-26 Neuro Resident & Fellow Contact Sheet 1.pdf  (Jan 6 2026, 5.4 MB)
├── Coagulopathy reversal versions/
│   ├── Coagulopathy reversal for website.docx
│   ├── ReverseCoag 9_2025 FINAL combined edits.docx     # earlier version of #3 above
│   ├── Spontaneous IPH - Reversal Guide for DOAC 9_2025 Final.pptx
│   ├── Spontaneous IPH_Reversal Guide for Warfarin_9_2025 Final.pptx
│   └── old versions/
├── Document Upload and Edit list_HMC OCCAM Stroke Ref Kit_Jan 2026.docx  (Jan 26 2026, 99 KB)
├── Document Upload list_HMC OCCAM Stroke Ref Kit_Oct 2025.docx
├── DRAFT_2025 HMC_Rx_Algorithm.pdf                      (Aug 11 2025, 530 KB)  # earlier draft of HMC algo
├── extended window thrombolytic trials.docx             (Jan 6 2026, 23 KB)    # earlier version of priority #12
├── FINAL_Jan 2025_Nursing Stroke Swallow algorithm AKC.pdf
├── FINAL_pocket cards 6.17.2025.pdf                     (Feb 19 2026, 3.0 MB)  # earlier pocket cards version
├── HMC OCCAM Stroke Reference Kit Initial Intake.docx
├── HMC Stroke Code SOP.pdf                              (Oct 5 2025, 181 KB)
├── HMC_Rx_Algorithm 7_2025.pdf                          (Aug 12 2025, 711 KB)  # near-duplicate of priority #2
├── IPH BP .pptx                                         (Aug 1 2025, 44 KB)
├── IV_TNK_incl_excl 7_2025.pdf                          (Jul 31 2025, 582 KB)
├── Neurology Algorithm Page Resource Documents/
│   ├── EVT_information_sheet.pdf
│   ├── FINAL_Jan 2025_Nursing Stroke Swallow algorithm AKC.pdf
│   ├── IV thrombolytic Info Form 8_2025.pdf
│   ├── LVO and contrast allergy.pdf
│   ├── NEEDS UPDATE IA_LysisProtocol.pdf
│   ├── NEEDS UPDATE IV_tPA_incl_excl.pdf
│   ├── Orolingual-Angioedema-Associated-with-IV-Thrombolytic-Administration-for-AIS-.pdf
│   ├── Post TNK_hemorr_prot.pdf
│   ├── ref_AHA_Ischemic_BP Management.pdf
│   └── U3197 Updated NIHSS Form.pdf
├── Post thrombectomy imaging_DECT 2025.pdf              (Jan 6 2026, 63 KB)
├── ref_AHA_Ischemic_ICU_BP_Rx.pdf
├── Submitted_Document Upload list_HMC OCCAM Stroke Ref Kit_Nov 2025.docx
└── TNK for AIS.docx                                     (Jan 6 2026, 41 KB)    # earlier version of priority #15
```

### `To be added to Telestroke website/`
```
.
├── Acute Ischemic Stroke in Children 11_15 version with flow sheet.docx  (Nov 15 2024, 50 KB)
├── Communication with Neurosurgery.docx                 (Nov 26 2024, 18 KB)   # newer than Inst Guidelines copy in some respects (date)
├── Including ADAMTS13 testing in crytogenic stroke evaluation.docx  (Sep 11 2024, 87 KB)  # spelling: "crytogenic"
├── Minimally Invasive Evacuation.pptx                   (Nov 15 2024, 294 KB)
├── Nov 2025 additions/
│   ├── Coagulopathy reversal for website.docx
│   ├── Coagulopathy reversal for website.pdf
│   ├── Direct to Angio for LVO pts without lytics and within 3h of last neuroimaging.pdf
│   ├── LVO and contrast allergy.pdf
│   ├── Orolingual-Angioedema-Associated-with-IV-Thrombolytic-Administration-for-AIS-.pdf
│   └── Post TNK_hemorr_prot.pdf
├── Pulsara Use during Stroke Call.pptx                  # same as priority #5 (different folder copy)
├── StrokePhone Checklist 11_15 APD clean.docx           (Nov 15 2024, 22 KB)
└── Telestroke Checklist for OSH Providers[81].pptx
```

### `Stroke Measures/`
```
.
├── GWTG, TJC/
│   ├── 2025 CSC TJC Standards Gap Analysis & Documents Review .xlsx  (Aug 9 2025, 55 KB)
│   ├── Disease Specific Care Organization RPG.pdf       (Aug 9 2025, 2.0 MB)
│   ├── GWTG_Stroke_Quality_Measures.pdf                 (Aug 9 2025, 309 KB)
│   └── GWTG_Stroke_Reporting_Measures.pdf               (Aug 9 2025, 765 KB)
└── Stroke Measures.xlsx                                 (Aug 10 2025, 17 KB)
```

---

## Things noticed (duplicates, stale, conflicting versions, drafts that supersede)

### Source-of-truth conflicts / candidates to canonicalize

1. **HMC_Rx_Algorithm 7_2025.pdf** appears in **three** locations with slightly different sizes (711–764 KB). All are dated July 2025 with "updated June 2023" caption. The version inside `Stroke algorithm updates/` (~764 KB) is treated as canonical; an earlier `DRAFT_2025_HMC_Rx_Algorithm.pdf` (~530 KB) and a copy in the `June 2025` archive subfolder confirm this is the master flow chart. **Recommendation:** treat the `Stroke algorithm updates/` copy as canonical; flag the two extra copies as pinned snapshots.

2. **Extended window thrombolytic trials.docx** appears in two places:
   - `Stroke algorithm updates/extended window thrombolytic trials.docx` (Nov 25 2025, 38 KB) — newer, more complete table.
   - `Stroke algorithm updates/Stroke Algorithm Updates June 2025/extended window thrombolytic trials.docx` (Jan 6 2026 mtime but 23 KB, 15 KB smaller) — appears to be earlier/abridged version despite later mtime (mtime likely reflects last touch, not content).
   **Recommendation:** the 38 KB Nov 25 file is the gold copy; the smaller 23 KB version was extracted to priority #12.

3. **TNK for AIS.docx** also has two copies (43 KB vs 41 KB). The Nov 25 2025 version (43 KB) is canonical (priority #15).

4. **Acute Stroke Algorithm**: `Acute Stroke Algorithm Aug 2025.docx` (priority #1) is **image-only** — there is no editable text source. Its companion `Acute Stroke Algorithm.pptx` (Nov 29 2025, 54 KB) and `Acute Stroke Algorithm_2025_ RK.docx` (Oct 15 2025, 491 KB) in the `June 2025` subfolder are likely the editable source. **For the CDS app cross-walk, the Aug 2025 image is the published artifact, but the app should align to the underlying logic in HMC_Rx_Algorithm (priority #2) which is text-based and editable.**

5. **EVT Eligibility Flowchart** — three files all encode the same matrix:
   - `Stroke algorithm updates/EVT Eligibility Flowchart.docx` (Nov 24 2024, 580 KB) — image-only
   - `Stroke algorithm updates/EVT eligibility flowchart.png` (Nov 24 2024, 324 KB) — same image, raw
   - `Stroke Pocket Card Updates 2026/EVT Eligibility Flowchart v3.pptx` (May 1 2026) — current version, image-only
   - **Card 4** of `Stroke Pocket Cards v4.docx` (May 1 2026) — same content embedded in pocket-card set
   **Recommendation:** Card 4 of Pocket Cards v4 is canonical (latest, May 1 2026); transcription in `evt-eligibility-flowchart-v3.md` is faithful to that. The Nov 2024 docx is stale.

6. **ReverseCoag 9_2025**: priority file in root (Sept 24 2025) is the latest. An earlier `ReverseCoag 9_2025 FINAL combined edits.docx` (Mar 17 2026 mtime but smaller size) lives in `Stroke algorithm updates/Stroke Algorithm Updates June 2025/Coagulopathy reversal versions/` — likely a snapshot.

7. **Pulsara Use during Stroke Call.pptx** — exact-same file in two places: `Stroke Center/` and `Stroke Center/To be added to Telestroke website/`. Same byte count (43,640 bytes) — confirmed copy.

8. **Telestroke Checklist for OSH Providers** lives in 4 locations with slightly different filenames; likely all converging on the same content. Most recent = `Checklists UW and OSH/Telestroke Checklist for OSH Providers_revised 12_19 APD.pptx` (Dec 19 2024).

9. **`AKC.pdf` Inpatient Code Stroke checklist** (priority #4, Nov 2024) — clean, single canonical version. Anna Kwak-Callen is listed author/maintainer and appears throughout.

10. **Pediatric AIS** — three coexisting candidates:
    - `Pediatric Stroke/Acute Ischemic Stroke in Children 5_2026.docx` (May 1 2026) — **latest**, extracted.
    - `Pediatric Stroke/Acute Ischemic Stroke in Children 11_15 version with flow sheet.docx` (May 1 2026 mtime, but content from Nov 2024) — older content, recent re-save.
    - `Clinical Reference & Summaries/Acute Ischemic Stroke in Children.docx` and `Acute Ischemic Stroke in Children 1.docx` (Oct 27 2024, identical 49,730 bytes — exact duplicates).

11. **Drafts subfolder typo**: `Stroke Pocket Card Updates 2026/draftts/` (note the doubled `t`) contains all in-progress versions. v4 is the canonical published version (in parent folder, May 1 2026); v2/v3 should be considered superseded.

### Stale-dated documents
- `checklists-documentation.docx` (Jan 2022) in `Clinical Reference & Summaries/` — 4 years stale.
- `Large Core Anteior Circulation LVO EVT Trials.docx` (Feb 2023) — has predated DEVT/RESCUE-Japan-LIMIT/SELECT2; reviewed status unclear; misspelled "Anteior".
- `Acute Ischemic Stroke in Children 1.docx` & `.docx` in Clinical Reference (Oct 2024) — duplicates, both predate the 5/2026 pediatric file.
- `NEEDS UPDATE` prefix on two PDFs in `Stroke Algorithm Updates June 2025/Neurology Algorithm Page Resource Documents/`: `NEEDS UPDATE IA_LysisProtocol.pdf` and `NEEDS UPDATE IV_tPA_incl_excl.pdf` — explicitly flagged by the source folder owner as stale.

### Annotation-as-content signal
The HMC_Rx_Algorithm PDF (priority #2) contains visible inline editor TODO annotations: "needs EDITS", "Edited and in folder", "add bullet to document ICH score", "verify order set links all most recent", "add bullet for safety pause", "bullet for link to post-EVT timing of dual energy". These reveal the protocol author's known gaps — useful for prioritizing what content the CDS app should make canonical and well-versioned.

### Spelling / quality issues to flag for the CDS team
- `Anteior Circulation` (should be Anterior) — file in Clinical Reference & Summaries.
- `crytogenic stroke` (should be cryptogenic) — file in To be added to Telestroke website.
- `draftts/` (folder name, should be drafts).
- `Vasular Post-Procedure Panel` (should be Vascular) — order set PDF.
- `7-2025.pdf` `(updated June 2023)` — the master HMC_Rx algorithm carries a **2-year-old** "last updated" date despite a July-2025 filename; either the date should be updated or document drift acknowledged.
