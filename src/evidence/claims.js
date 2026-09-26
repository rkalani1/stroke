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
    statement: 'TNK 0.25 mg/kg in the 4.5-24 h window with perfusion-imaging selection improves outcomes vs standard care in perfusion-selected patients not receiving EVT (TRACE-III: 100% LVO, <2% EVT, positive); benefit was NOT seen when EVT was also delivered (TIMELESS: 77% EVT, p=0.45).',
    topic: 'extended-window-ivt',
    citationIds: ['cit-timeless-2024', 'cit-trace-iii-2024'],
    certainty: 'moderate',
    conflictNotes: 'TIMELESS was neutral (adjusted common OR 1.13, 95% CI 0.82-1.57; p=0.45) with 77.3% of patients undergoing thrombectomy. TRACE-III showed benefit (mRS 0-1 33.0% vs 24.2%; p=0.03) in an LVO-only late-window population without EVT access; sICH appeared higher (3.0% vs 0.8%).',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-evt-large-core',
    statement: 'EVT improves functional outcomes vs medical therapy in selected patients with large-core infarct (ASPECTS 3-5, or perfusion/DWI core ≥50 mL in SELECT2 and 70-100 mL in ANGEL-ASPECT).',
    topic: 'evt-large-core',
    citationIds: ['cit-select2-2023', 'cit-rescue-japan-2022', 'cit-angel-aspect-2023', 'cit-tension-2023'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-evt-late-window',
    statement: 'EVT improves functional outcomes in the late window with imaging-based selection (DAWN: 6-24 h from LKW, clinical-core mismatch; DEFUSE-3: 6-16 h from LKW, perfusion mismatch).',
    topic: 'evt-late-window',
    citationIds: ['cit-dawn-2018', 'cit-defuse3-2018'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-ich-bp-bundle',
    statement: 'A care bundle of intensive BP lowering, glycemic and temperature control, and rapid anticoagulant reversal improves functional outcome after acute ICH (INTERACT3).',
    topic: 'ich-bp-management',
    citationIds: ['cit-interact3-2023'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-ich-andexanet-fxa',
    statement: 'Andexanet alfa achieves better hemostatic efficacy than usual care (predominantly 4F-PCC) in factor Xa inhibitor-associated ICH, with monitoring required for thrombotic events (ANNEXA-I).',
    topic: 'ich-anticoag-reversal',
    citationIds: ['cit-annexa-i-2024', 'cit-aha-ich-2022'],
    certainty: 'moderate',
    conflictNotes: 'Hemostatic efficacy improved (67.0% vs 53.1%), but thrombotic events (10.3% vs 5.6%), including ischemic stroke (6.5% vs 1.5%), were more frequent with andexanet, with no appreciable difference in modified Rankin scale score or death within 30 days. The AHA/ASA 2022 Class IIa recommendation predates the December 2025 FDA safety action that ended US sales of andexanet.',
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
    statement: 'Short-course DAPT reduces early recurrent stroke vs aspirin alone in minor stroke or high-risk TIA: aspirin + clopidogrel (CHANCE: 21 days of DAPT, 90-day stroke; POINT: 90 days of DAPT, 90-day major ischemic events; INSPIRES: 21 days of DAPT started up to 72 h in presumed atherosclerotic stroke/TIA, 90-day stroke) and aspirin + ticagrelor for 30 days (THALES, NIHSS <=5: 30-day stroke or death). Bleeding was higher with DAPT in POINT (major), THALES (severe) and INSPIRES (moderate-to-severe), but not in CHANCE. In CYP2C19 loss-of-function carriers, ticagrelor-aspirin reduced 90-day stroke vs clopidogrel-aspirin (CHANCE-2).',
    topic: 'dapt-minor-stroke',
    citationIds: ['cit-chance-2013', 'cit-point-2018', 'cit-thales-2020', 'cit-inspires-2024', 'cit-chance2-2021'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-af-early-anticoag',
    statement: 'Early DOAC initiation within ~4 days is non-inferior to delayed start across infarct sizes (OPTIMAS) and was superior to delayed start at 30 days in pooled individual-patient data (CATALYST IPDMA: OR 0.70, 95% CI 0.50-0.98, p=0.039) with no excess of symptomatic intracranial hemorrhage; earlier trials were consistent: TIMING showed early start non-inferior for the 90-day composite of recurrent ischemic stroke, symptomatic intracerebral hemorrhage, or all-cause death, and ELAN estimated a 30-day risk difference of -1.18 percentage points (95% CI -2.84 to 0.47) with early start for recurrent ischemic stroke, systemic embolism, major extracranial bleeding, symptomatic intracranial hemorrhage, or vascular death.',
    topic: 'af-anticoag-timing',
    citationIds: ['cit-optimas-2024', 'cit-catalyst-2025', 'cit-elan-2023', 'cit-timing-2022'],
    certainty: 'high',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-late-window-ivt-non-lvo',
    statement: 'Mismatch-selected IVT improved functional outcome vs placebo or standard care in patients not undergoing EVT: alteplase with DWI-FLAIR mismatch in unknown-onset stroke (WAKE-UP) and alteplase with perfusion mismatch at 4.5-9 h from onset or on waking within 9 h of the sleep midpoint (EXTEND); in ICA/MCA occlusion without EVT access, tenecteplase at 4.5-24 h improved mRS 0-1 (TRACE-III). TIMELESS (77% thrombectomy) and TWIST (non-contrast CT-selected wake-up) were neutral.',
    topic: 'extended-window-ivt',
    citationIds: ['cit-wake-up-2018', 'cit-extend-2019', 'cit-timeless-2024', 'cit-twist-2023', 'cit-trace-iii-2024'],
    certainty: 'moderate',
    conflictNotes: 'TWIST (NCCT-only wake-up TNK) was negative (adjusted OR 1.18, 95% CI 0.88-1.58; p=0.27); TIMELESS was negative in a 100% LVO population with 77% EVT (p=0.45). Benefit requires imaging-based mismatch selection and absence of EVT co-treatment.',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-bp-post-evt-conventional',
    statement: 'Conventional BP control (target 140-180 mmHg systolic) after successful EVT is associated with better functional outcome than intensive lowering (<140 systolic) (ENCHANTED2/MT, OPTIMAL-BP, BP-TARGET).',
    topic: 'bp-post-evt',
    citationIds: ['cit-enchanted2-mt-2022', 'cit-optimal-bp-2023', 'cit-bp-target-2021'],
    certainty: 'moderate',
    conflictNotes: 'BP-TARGET found no harm or benefit of intensive lowering; ENCHANTED2/MT and OPTIMAL-BP both favor conventional targets after EVT.',
    lastReviewed: lr
  }),
  makeClaim({
    id: 'cl-ich-warfarin-reversal-pcc-vk',
    statement: 'In warfarin-associated ICH, 4F-PCC dosed by INR/weight plus IV vitamin K achieves faster INR correction and is preferred over FFP, which is slower and carries volume-overload risk (AHA/ASA 2022 ICH guideline; Steiner INCH Lancet Neurol 2016).',
    topic: 'ich-anticoag-reversal',
    citationIds: ['cit-aha-ich-2022', 'cit-inch-2016'],
    certainty: 'high',
    conflictNotes: 'Vitamin K is required for sustained reversal; PCC alone is short-acting. FFP remains an alternative when PCC is unavailable.',
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
