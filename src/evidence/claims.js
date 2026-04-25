// src/evidence/claims.js
//
// Atomic evidence claims that recommendations cite. A claim is a single
// auditable statement supported by ≥1 citations. Recommendations are then
// composed of claims, giving the UI the ability to drill from a guideline
// recommendation through claims to primary sources without rewriting prose
// each time.

import { makeClaim } from './schema.js';

const lr = '2026-04-25'; // last-reviewed for this seed batch

export const claims = [
  makeClaim({
    id: 'cl-tnk-noninferior-alteplase',
    statement: 'Tenecteplase 0.25 mg/kg is non-inferior to alteplase 0.9 mg/kg for 90-day functional outcome in eligible AIS within 4.5 h.',
    topic: 'tnk-vs-alteplase',
    citationIds: ['cit-act-2022', 'cit-trace2-2023', 'cit-original-2024', 'cit-eso-tnk-2023'],
    certainty: 'high',
    conflictNotes: '',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-tnk-late-window-non-lvo',
    statement: 'TNK 0.25 mg/kg in the 4.5-24 h window with perfusion-imaging selection improves outcomes vs standard care in patients without LVO/EVT (TIMELESS, TRACE-III).',
    topic: 'extended-window-ivt',
    citationIds: ['cit-timeless-2024', 'cit-trace-iii-2024'],
    certainty: 'moderate',
    conflictNotes: 'TIMELESS primary endpoint did not reach statistical significance for the overall population; pre-specified subgroups suggest benefit. TRACE-III demonstrated benefit in the LVO-only late-window population without EVT.',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-evt-large-core',
    statement: 'EVT improves functional outcomes vs medical therapy in selected patients with large-core infarct (ASPECTS 3-5 or core 50-100 mL).',
    topic: 'evt-large-core',
    citationIds: ['cit-select2-2023', 'cit-rescue-japan-2022', 'cit-angel-aspect-2023', 'cit-tension-2023'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-evt-late-window',
    statement: 'EVT improves functional outcomes 6-24 h from LKW with imaging-based selection (clinical-core mismatch on DAWN, perfusion mismatch on DEFUSE-3).',
    topic: 'evt-late-window',
    citationIds: ['cit-dawn-2018', 'cit-defuse3-2018'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-ich-bp-bundle',
    statement: 'A care bundle of intensive BP lowering, glycemic and temperature control, and rapid anticoagulant reversal improves functional outcome after acute ICH (INTERACT3).',
    topic: 'ich-bp-management',
    citationIds: ['cit-interact3-2023', 'cit-aha-ich-2022'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-ich-andexanet-fxa',
    statement: 'Andexanet alfa achieves better hemostatic efficacy than usual care (predominantly 4F-PCC) in factor Xa inhibitor-associated ICH, with monitoring required for thrombotic events (ANNEXA-I).',
    topic: 'ich-anticoag-reversal',
    citationIds: ['cit-annexa-i-2024', 'cit-aha-ich-2022'],
    certainty: 'moderate',
    conflictNotes: 'Hemostatic efficacy improved, but thrombotic complications were higher with andexanet vs usual care; AHA/ASA 2022 lists andexanet as Class IIa.',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-ich-mis-evacuation',
    statement: 'Early minimally invasive evacuation of moderate-volume lobar ICH improves functional outcome at 6 months (ENRICH).',
    topic: 'ich-surgery',
    citationIds: ['cit-enrich-2024'],
    certainty: 'moderate',
    conflictNotes: 'ENRICH adaptive design enriched for lobar location after early stop for futility in deep ICH; generalization to deep ICH not supported.',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-dapt-minor-stroke',
    statement: 'Short-course DAPT (aspirin + clopidogrel x 21 days, or aspirin + ticagrelor x 30 days) reduces 90-day recurrent stroke vs aspirin alone in minor stroke or high-risk TIA, with bleeding cost.',
    topic: 'dapt-minor-stroke',
    citationIds: ['cit-chance-2013', 'cit-point-2018', 'cit-thales-2020', 'cit-inspires-2024', 'cit-chance2-2021'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-af-early-anticoag',
    statement: 'Early DOAC initiation (within 4 days for minor and 6-7 days for major stroke per ELAN) is non-inferior or favorable vs delayed initiation for the composite of recurrent stroke / systemic embolism / major bleeding (ELAN, TIMING).',
    topic: 'af-anticoag-timing',
    citationIds: ['cit-elan-2023', 'cit-timing-2022'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-late-window-ivt-non-lvo',
    statement: 'In the 4.5-24 h window without EVT eligibility, perfusion- or DWI-FLAIR-mismatch-selected IVT (alteplase or TNK) improves functional outcome vs standard care (WAKE-UP, EXTEND, TIMELESS, TWIST mixed, TRACE-III).',
    topic: 'extended-window-ivt',
    citationIds: ['cit-wake-up-2018', 'cit-extend-2019', 'cit-timeless-2024', 'cit-twist-2023', 'cit-trace-iii-2024'],
    certainty: 'moderate',
    conflictNotes: 'TWIST (unselected wake-up TNK) was negative; benefit requires imaging-based mismatch selection.',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-bp-post-evt-conventional',
    statement: 'Conventional BP control (target 140-180 mmHg systolic) after successful EVT is associated with better functional outcome than intensive lowering (<140 systolic) (ENCHANTED2/MT, OPTIMAL-BP, BP-TARGET).',
    topic: 'evt-late-window',
    citationIds: ['cit-enchanted2-mt-2022', 'cit-optimal-bp-2023', 'cit-bp-target-2021'],
    certainty: 'moderate',
    conflictNotes: 'BP-TARGET found no harm or benefit of intensive lowering; ENCHANTED2/MT and OPTIMAL-BP both favor conventional targets after EVT.',
    lastReviewed: lr
  })
];

const byId = new Map(claims.map((c) => [c.id, c]));

export function getClaim(id) {
  return byId.get(id) || null;
}

export function getAllClaimIds() {
  return new Set(byId.keys());
}
