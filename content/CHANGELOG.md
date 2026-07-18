# Content changelog

Material changes to the `/content` clinical data layer. Per-entry provenance is
recorded in each record's `provenance` field; this file records batch changes,
re-verifications, and schema evolution. Dates are absolute (ISO).

Format: newest first. Each entry: what changed, why, and the source it was
verified against.

## 2026-07-18 — 12 new neurovascular education modules

New bedside teaching cards added to the Education section (authored in
`src/education.jsx`; metadata projected to `content/education/*.md` by
`content:seed`). Each card follows the existing static pocket-card / interactive
simulator templates and cites its primary sources (PMIDs verified against
PubMed). No change to the frozen Example Protocols zone.

- **`cerebral-venous-sinus-thrombosis`** — CVST: presentation/risk factors,
  CTV/MRV diagnosis, anticoagulation despite venous hemorrhage, DOAC transition,
  ISCVT prognosis. Sources: ISCVT (14976332), RE-SPECT CVT (31479105),
  ACTION-CVT (35143325), TO-ACT (32421159), AHA/ASA statement (21293023).
- **`large-core-thrombectomy`** — EVT for large ischemic core (low ASPECTS /
  large core volume): the six 2022–2024 RCTs and the mRS-shift benefit vs
  higher symptomatic hemorrhage. Sources: SELECT2 (36762865), ANGEL-ASPECT
  (36762852), TENSION (37837989), LASTE (38718358), TESLA (39374319),
  RESCUE-Japan LIMIT (35138767), 2026 AIS guideline (41582814).

## 2026-07-11 — Clinical corrections (audit-flagged, clinician-directed)

Factual corrections to non-frozen clinical content, each verified against the
authoritative source already in the repo. None touched the frozen Example
Protocols zone (snapshot lock green). Locked by `tests/clinical-corrections.test.js`.

- **THALES DAPT duration** (`src/app.jsx` DAPT-duration selector): the 90-day
  option no longer attributes THALES (a 30-day trial) to it; 90 days → CHANCE-2,
  30 days → THALES. Consistent with every other THALES reference in the app.
- **ICH Score 4 mortality** (`src/education.jsx` card): 94% → **97%** (Hemphill
  2001), matching the canonical table in `src/app.jsx` (0/13/26/72/97/100%).
- **HINTS peripheral/central** (`src/teaching.js` cranial-nerve card): corrected
  to peripheral = abnormal head impulse (corrective saccade) + unidirectional
  nystagmus + normal skew; central if normal HIT, direction-changing nystagmus,
  or abnormal skew. Now consistent with the module's own HINTS flashcard.
- **TREAT-CAD** (`src/guidelines/landmark-trials.json`, `src/components.jsx`):
  corrected the overstated "aspirin non-inferior" claim — TREAT-CAD did NOT meet
  non-inferiority (more events with ASA, 23% vs 15%); antiplatelet and
  anticoagulation are both reasonable, individualized (CADISS Class IIa).
- **Mannitol osmolar-gap hold** (`src/simulators/EvdIcpSimulator.jsx`): Osm Gap
  hold threshold 55 → **20** (mannitol accumulation), consistent with the
  osmotherapy guidance elsewhere in the repo.
- **AF-timing pearl** (`src/app.jsx` CLINICAL_PEARLS): aligned to the canonical
  ELAN/OPTIMAS/CATALYST model (`calculators.js` `elan-optimas` + `recommendations.js`)
  — early DOAC ≤4 days across severities; tiered day 1/3/6/7+ by severity.

Reviewed, no change (guideline-consistent, not errors):
- **CVT seizure prophylaxis**: the order-set conditions levetiracetam on
  "supratentorial parenchymal lesion" and the clinical-decision entry says
  prophylaxis is "reasonable with supratentorial parenchymal lesions" — both
  match AHA/ASA 2024. The frozen protocol's "seizure treatment (not
  prophylaxis)" is the routine-case summary; not contradictory. Frozen text
  untouched.

## 2026-07-11 — Initial `/content` data layer

- Established the schema-validated `/content` data layer (guidelines, trials,
  education, calculators, references) with build-time validation
  (`scripts/validate-content.mjs`) and a currency report
  (`scripts/check-currency.mjs`).
- Seeded 137 records by faithful derivation from existing canonical sources
  (no clinical value hand-typed):
  - `guidelines/` (11) ← `src/evidence/recommendations.js` (+ claims→citations
    drill-through for PMIDs/DOIs).
  - `trials/` (64) ← `src/evidence/completedTrials.js`.
  - `calculators/registry.json` (24) ← verified compute-module exports; now the
    single source the agent-asset generator derives from.
  - `education/` (16) ← `EDUCATION_MODULES` in `src/education.jsx` (metadata:
    title, summary, tags, contexts, references, lastReviewed).
  - `references/` (18) ← `documents/*` reference PDFs cited in `src/app.jsx`.
- All records validated against the single citations registry
  (`src/evidence/citations.js`). `lastReviewed` dates carried over from the
  source modules (2026-04-25 / 2026-05-30); see `npm run content:currency`.
