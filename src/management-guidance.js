// Structured, evidence-bound management cards for the fastest AIS workflow.
// Keep this file pure data so the same content can be reused by the Management
// tab, pocket-card exports, and future offline evidence refresh tooling.

export const AIS_COMMAND_CENTER_LAST_REVIEWED = '2026-05-08';

export const AIS_SOURCE_LINKS = [
  {
    label: '2026 AHA/ASA AIS Guideline',
    href: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000513'
  },
  {
    label: 'AHA 2026 AIS Hub',
    href: 'https://professional.heart.org/en/science-news/2026-guideline-for-the-early-management-of-patients-with-acute-ischemic-stroke'
  },
  {
    label: 'OPTION 2026',
    href: 'https://doi.org/10.1001/jama.2026.0210'
  },
  {
    label: 'HOPE-BP ESOC 2026',
    href: 'https://neuronewsinternational.com/reperfusion-guided-bp-management-strategy-hope-esoc-2026/'
  },
  {
    label: 'RAISE reteplase',
    href: 'https://doi.org/10.1056/NEJMoa2400314'
  }
];

export const AIS_COMMAND_CENTER_CARDS = [
  {
    id: 'ais-ivt-early',
    title: '0-4.5h IV Thrombolysis',
    shortLabel: 'TNK / alteplase',
    urgency: 'First decision after hemorrhage excluded',
    classOfRecommendation: 'I',
    levelOfEvidence: 'A',
    lastReviewed: AIS_COMMAND_CENTER_LAST_REVIEWED,
    recommendationId: 'rec-ais-ivt-within-45h',
    evidenceQuery: 'tenecteplase alteplase 4.5 h',
    anchor: 'isch-evt',
    summary:
      'If adult AIS has a disabling deficit and no exclusion, give IVT as fast as safely possible. Tenecteplase 0.25 mg/kg (max 25 mg) or alteplase 0.9 mg/kg are both Class I/A in the 2026 AHA/ASA guideline.',
    actions: [
      'Do not wait for CTA, CTP, MRI, ECG, troponin, or routine labs when there is no clinical suspicion of an abnormal result.',
      'Check glucose before IVT; correct severe hypo- or hyperglycemia, then treat if a disabling deficit persists.',
      'Lower BP to <185/110 before IVT and maintain <180/105 for at least 24h after treatment.',
      'Use TNK 0.25 mg/kg only; do not use the 0.4 mg/kg stroke dose.',
      'Do not add routine argatroban, eptifibatide, or other adjunctive antithrombotics to IVT outside a protocol/trial.'
    ],
    pathway: [
      { label: 'Disabling deficit, <=4.5h, no exclusion', decision: 'Give TNK 0.25 mg/kg IV bolus or alteplase 0.9 mg/kg', cor: 'I', loe: 'A' },
      { label: 'Mild but disabling symptom', decision: 'Treat; NIHSS alone should not block IVT', cor: 'I', loe: 'A' },
      { label: 'Non-disabling minor deficit', decision: 'Usually no IVT; start antiplatelet pathway if no lytic', cor: 'III', loe: 'B-R' },
      { label: 'TNK 0.4 mg/kg', decision: 'Do not use for AIS', cor: 'III', loe: 'A' }
    ],
    calculators: [
      { label: 'TNK dose from weight', tab: 'encounter', anchor: 'treatment-decision' },
      { label: 'Alteplase calculator', tab: 'management', subTab: 'calculators', anchor: 'calc-alteplase' },
      { label: 'NIHSS', tab: 'management', subTab: 'calculators', anchor: 'calc-nihss' }
    ],
    pitfalls: [
      'Treating "low NIHSS" as a reason to withhold IVT despite aphasia, hemianopia, severe neglect, dominant-hand weakness, gait-precluding ataxia, or disabling visual loss.',
      'Getting perfusion imaging before lysis in an otherwise eligible <=4.5h patient.',
      'Using a TNK STEMI-style 0.5 mg/kg dose or the older 0.4 mg/kg stroke dose.',
      'Treating RAISE as permission to substitute reteplase into routine US telestroke practice; the 2026 guideline notes benefit but also limited generalizability.'
    ],
    teachingPearl:
      'The 2026 shift is practical: TNK 0.25 mg/kg is no longer just an alternative; the guideline lists TNK or alteplase as recommended Class I/A options within 4.5h.',
    changedSinceLastGuideline:
      'Expanded TNK endorsement within 4.5h; stronger emphasis that extra imaging should not delay IVT in otherwise eligible patients. RAISE makes reteplase an evidence-watch item, not a default protocol agent.'
  },
  {
    id: 'ais-ivt-extended',
    title: 'Wake-Up and 4.5-24h IVT',
    shortLabel: 'Mismatch-selected lysis',
    urgency: 'Use only with tissue selection and expert review',
    classOfRecommendation: 'IIa',
    levelOfEvidence: 'B-R',
    lastReviewed: AIS_COMMAND_CENTER_LAST_REVIEWED,
    recommendationId: 'rec-late-window-ivt',
    evidenceQuery: 'extended-window IV thrombolysis OPTION HOPE TRACE-III',
    anchor: 'isch-evt',
    summary:
      'Late IVT is not a clock-only decision. Use MRI DWI-FLAIR mismatch, automated perfusion mismatch, or carefully selected no-EVT 4.5-24h pathways; counsel explicitly about higher sICH risk.',
    actions: [
      'Unknown onset: if within 4.5h of symptom recognition and MRI DWI lesion is <1/3 MCA territory without marked FLAIR change, IVT can be beneficial.',
      '4.5-9h or wake-up within 9h from sleep midpoint: automated perfusion mismatch makes IVT reasonable.',
      '4.5-24h LVO: prioritize EVT; consider IVT only if EVT cannot be provided or will be materially delayed.',
      '4.5-24h non-LVO with salvageable tissue: OPTION 2026 and HOPE 2025 support benefit but with higher sICH; use expert/shared decision-making.'
    ],
    pathway: [
      { label: 'Wake-up, MRI DWI+/FLAIR-negative', decision: 'IVT can be beneficial', cor: 'IIa', loe: 'B-R' },
      { label: '4.5-9h or wake-up <=9h, perfusion mismatch', decision: 'IVT may be reasonable', cor: 'IIa', loe: 'B-R' },
      { label: '4.5-24h LVO, EVT unavailable/delayed', decision: 'Expert-directed IVT may be beneficial', cor: 'IIb', loe: 'B-R' },
      { label: '4.5-24h non-LVO, salvageable tissue', decision: 'Post-guideline trial-supported option; document risk/benefit', cor: 'IIb', loe: 'B-R' }
    ],
    calculators: [
      { label: 'Late-window IVT calculator', tab: 'management', subTab: 'calculators', anchor: 'calc-risk-scores' },
      { label: 'ASPECTS', tab: 'management', subTab: 'calculators', anchor: 'calc-aspects' },
      { label: 'Evidence Atlas', tab: 'trials', view: 'atlas', query: 'OPTION HOPE TRACE-III TIMELESS' }
    ],
    pitfalls: [
      'Using NCCT alone to justify 4.5-24h thrombolysis.',
      'Giving late IVT to an LVO patient while slowing transfer for EVT.',
      'Ignoring the sICH tradeoff: OPTION and HOPE were positive but both increased symptomatic ICH.'
    ],
    teachingPearl:
      'Late-window IVT asks whether there is still salvageable brain and whether EVT is the better reperfusion tool. It is not simply "TNK up to 24h."',
    changedSinceLastGuideline:
      'The 2026 guideline incorporates WAKE-UP, EXTEND, TRACE-III, TIMELESS, and related mismatch trials; OPTION 2026 adds newer non-LVO TNK data after the guideline literature lock.'
  },
  {
    id: 'ais-evt-selection',
    title: 'EVT Selection',
    shortLabel: 'LVO / large core / basilar',
    urgency: 'Activate transfer while lysis is being decided',
    classOfRecommendation: 'I',
    levelOfEvidence: 'A',
    lastReviewed: AIS_COMMAND_CENTER_LAST_REVIEWED,
    recommendationId: 'rec-evt-large-core',
    evidenceQuery: 'EVT large core basilar DAWN DEFUSE-3 SELECT2',
    anchor: 'isch-evt',
    summary:
      'Large core and late-window status are no longer automatic EVT exclusions. Use vessel, time, premorbid mRS, ASPECTS/core, salvageable tissue, and local EVT speed.',
    actions: [
      'Anterior ICA/M1 LVO: activate EVT pathway immediately; do not wait for TNK response.',
      '0-6h: ASPECTS 3-10 with premorbid mRS 0-1 is guideline-supported; selected ASPECTS 0-2 patients may still benefit if no major mass effect.',
      '6-24h: treat DAWN/DEFUSE-3-eligible LVO and selected large-core patients with salvageable profile.',
      'Basilar occlusion: EVT within 24h is recommended when baseline mRS 0-1, NIHSS >=10, and PC-ASPECTS >=6.'
    ],
    pathway: [
      { label: 'ICA/M1, ASPECTS 3-10, mRS 0-1', decision: 'EVT recommended', cor: 'I', loe: 'A' },
      { label: 'Large core ASPECTS 3-5 or core 50-100 mL', decision: 'EVT recommended if otherwise eligible', cor: 'I', loe: 'A' },
      { label: 'ASPECTS 0-2, age <80, NIHSS >=6, mRS 0-1, no mass effect', decision: 'Selected EVT is reasonable', cor: 'IIa', loe: 'B-R' },
      { label: 'Basilar, NIHSS >=10, PC-ASPECTS >=6, mRS 0-1', decision: 'EVT recommended within 24h', cor: 'I', loe: 'B-R' }
    ],
    calculators: [
      { label: 'EVT builder', tab: 'management', subTab: 'ischemic', anchor: 'isch-evt' },
      { label: 'ASPECTS', tab: 'management', subTab: 'calculators', anchor: 'calc-aspects' },
      { label: 'PC-ASPECTS', tab: 'management', subTab: 'calculators', anchor: 'calc-pc-aspects' },
      { label: 'mTICI', tab: 'management', subTab: 'calculators', anchor: 'calc-tici' }
    ],
    pitfalls: [
      'Excluding large-core patients reflexively because "ASPECTS is low."',
      'Letting a reassuring low NIHSS mask dominant-hemisphere or posterior-circulation disability.',
      'Failing to start transfer before all perfusion details are finalized.'
    ],
    teachingPearl:
      'Modern EVT selection has moved from "small core only" to "will reperfusion still change this person\'s outcome?"',
    changedSinceLastGuideline:
      'Large-core EVT and posterior-circulation EVT moved into stronger guideline territory; dominant proximal M2 is separated from nondominant/distal occlusions.'
  },
  {
    id: 'ais-physiology',
    title: 'Physiology Guardrails',
    shortLabel: 'BP / glucose / oxygen',
    urgency: 'Prevents treatment-caused harm',
    classOfRecommendation: 'I',
    levelOfEvidence: 'B-R',
    lastReviewed: AIS_COMMAND_CENTER_LAST_REVIEWED,
    recommendationId: 'rec-ais-bp-targets',
    evidenceQuery: 'blood pressure glucose oxygen 2026 AIS guideline',
    anchor: 'isch-bp',
    summary:
      'Treat physiology that blocks reperfusion or causes harm, but avoid aggressive normalization that worsens ischemia or adds hypoglycemia risk.',
    actions: [
      'Pre-IVT: lower BP to <185/110. Post-IVT: maintain <180/105 for at least 24h.',
      'Post-EVT: maintain <=180/105 for 24h; after successful anterior LVO reperfusion, do not target SBP <140 for 72h unless another indication exists.',
      'HOPE-BP (ESOC 2026, conference-reported): reperfusion-guided targets improved 90-day mRS 0-2, but use only as attending-directed/protocolized care until peer-reviewed publication and guideline review.',
      'Glucose: treat hypoglycemia <60 mg/dL; treat persistent hyperglycemia toward 140-180 mg/dL; do not target 80-130 mg/dL with IV insulin.',
      'Oxygen: give supplemental oxygen for hypoxia to maintain SpO2 >94%; avoid routine oxygen in nonhypoxic AIS unless selected pre-EVT NBO pathway applies.'
    ],
    pathway: [
      { label: 'BP >185/110 and IVT otherwise eligible', decision: 'Lower before IVT', cor: 'I', loe: 'B-NR' },
      { label: 'Post-IVT BP', decision: 'Maintain <180/105 for >=24h', cor: 'I', loe: 'B-R' },
      { label: 'Successful EVT, anterior LVO', decision: 'Avoid SBP <140 target for 72h', cor: 'III', loe: 'A' },
      { label: 'HOPE-BP protocol context', decision: 'mTICI 2b: 140-160; mTICI 2c-3: 100-140; conference-only and not guideline-changing', cor: 'Evidence watch', loe: 'Low' },
      { label: 'Persistent hyperglycemia', decision: 'Treat toward 140-180, avoid hypoglycemia', cor: 'IIa', loe: 'C-LD' },
      { label: 'NBO before EVT, selected anterior LVO', decision: 'May be reasonable; not routine oxygen for everyone', cor: 'IIb', loe: 'B-R' }
    ],
    calculators: [
      { label: 'Post-EVT BP guardrail', tab: 'management', subTab: 'ischemic', anchor: 'isch-bp' },
      { label: 'mTICI', tab: 'management', subTab: 'calculators', anchor: 'calc-tici' }
    ],
    pitfalls: [
      'Driving SBP below 140 after successful EVT because "lower is safer."',
      'Applying HOPE-BP to incomplete reperfusion, posterior circulation, or non-protocol settings; the conference report enrolled successful anterior-circulation LVO thrombectomy patients.',
      'Using intensive insulin targets that increase severe hypoglycemia without improving outcome.',
      'Putting every nonhypoxic stroke patient on oxygen.'
    ],
    teachingPearl:
      'In acute ischemic stroke, normal numbers are not always physiologic. Preserve penumbral perfusion while meeting safety thresholds.',
    changedSinceLastGuideline:
      'The 2026 guideline adds explicit harm/no-benefit recommendations against intensive BP and glucose targets after newer RCTs. HOPE-BP is a May 2026 signal for future individualized post-EVT targets, not a replacement for the guideline guardrail.'
  },
  {
    id: 'ais-mevo',
    title: 'MeVO / Distal Occlusion',
    shortLabel: 'Trial-first exceptions',
    urgency: 'Avoid routine procedural harm',
    classOfRecommendation: 'III',
    levelOfEvidence: 'A',
    lastReviewed: AIS_COMMAND_CENTER_LAST_REVIEWED,
    recommendationId: 'rec-ais-mevo-no-routine-evt',
    evidenceQuery: 'MeVO distal vessel occlusion EVT ESCAPE-MeVO DISTAL DISCOUNT',
    anchor: 'isch-mevo',
    summary:
      'Dominant proximal M2 is a selective exception. Routine EVT for nondominant M2, distal MCA, ACA, or PCA occlusions is not recommended to improve functional outcomes.',
    actions: [
      'Dominant proximal M2 within 6h, NIHSS >=6, ASPECTS >=6, mRS 0-1: EVT is reasonable but benefit is uncertain.',
      'Nondominant/codominant M2, distal MCA, ACA, or PCA: default to medical management and trial enrollment.',
      'Treat disabling deficits with IVT if eligible; do not substitute routine distal EVT for thrombolysis.',
      'Escalate only for exceptional anatomy, severe disabling deficit, low procedural risk, and consensus with the neurointerventionalist.'
    ],
    pathway: [
      { label: 'Dominant proximal M2, high disability, favorable imaging', decision: 'EVT reasonable; benefit uncertain', cor: 'IIa', loe: 'B-NR' },
      { label: 'Nondominant M2, M3/M4, ACA, PCA', decision: 'Routine EVT not recommended', cor: 'III', loe: 'A' },
      { label: 'Active trial available', decision: 'Prefer trial enrollment over ad hoc EVT', cor: 'Statement', loe: 'C-EO' }
    ],
    calculators: [
      { label: 'STEP-EVT trial matcher', tab: 'trials', view: 'active', query: 'STEP' },
      { label: 'EVT builder', tab: 'management', subTab: 'ischemic', anchor: 'isch-evt' }
    ],
    pitfalls: [
      'Conflating dominant proximal M2 with all distal occlusions.',
      'Anchoring on the angiogram instead of clinical disability and procedural risk.',
      'Treating neutral MeVO RCTs as "no distal EVT ever" rather than "no routine EVT."'
    ],
    teachingPearl:
      'MeVO is where anatomy, deficit eloquence, and procedural risk matter most. The safest default is medical therapy plus trial enrollment.',
    changedSinceLastGuideline:
      '2025 MeVO RCTs and 2026 AHA/ASA recommendations moved routine distal EVT from enthusiasm to restraint.'
  },
  {
    id: 'ais-complications',
    title: 'Post-Treatment Complications',
    shortLabel: 'sICH / angioedema / antithrombotics',
    urgency: 'Have rescue orders ready before drug goes in',
    classOfRecommendation: 'I',
    levelOfEvidence: 'B-NR',
    lastReviewed: AIS_COMMAND_CENTER_LAST_REVIEWED,
    recommendationId: 'rec-ais-post-ivt-complications',
    evidenceQuery: 'post thrombolysis angioedema hemorrhage protocol AIS',
    anchor: 'isch-postlytic',
    summary:
      'The lytic decision is incomplete until the team has a rescue plan for neurological worsening, post-lytic ICH, angioedema, and antithrombotic timing.',
    actions: [
      'If severe headache, acute hypertension, nausea/vomiting, or worsening exam occurs: stop alteplase infusion if running, obtain emergent CT, and activate reversal protocol.',
      'For suspected post-lytic sICH: hold antithrombotics, send CBC/PT/INR/aPTT/fibrinogen/type-screen, give cryoprecipitate targeting fibrinogen >200 mg/dL, and involve neurosurgery/ICU.',
      'Monitor for orolingual angioedema, especially with ACE inhibitor use and insular/anterior circulation stroke; prepare airway early.',
      'No antiplatelet or anticoagulant for 24h after IVT until follow-up imaging excludes hemorrhage.'
    ],
    pathway: [
      { label: 'Post-IVT neurological worsening', decision: 'Emergency CT + labs + reversal pathway', cor: 'I', loe: 'B-NR' },
      { label: 'Orolingual angioedema', decision: 'Airway-first protocol; steroids/H1/H2, epinephrine if progressing', cor: 'I', loe: 'C-LD' },
      { label: 'Antithrombotic restart after IVT', decision: 'Hold 24h and image first', cor: 'I', loe: 'B-NR' }
    ],
    calculators: [
      { label: 'Post-lytic ICH protocol', tab: 'management', subTab: 'ischemic', anchor: 'isch-postlytic' },
      { label: 'Angioedema protocol', tab: 'management', subTab: 'ischemic', anchor: 'isch-angioedema' },
      { label: 'SEDAN/DRAGON', tab: 'management', subTab: 'calculators', anchor: 'calc-risk-scores' }
    ],
    pitfalls: [
      'Calling a worsening exam "expected evolution" after IVT without immediate imaging.',
      'Waiting for fibrinogen before giving cryoprecipitate in a clinically severe bleed.',
      'Treating tongue swelling with medications while delaying airway planning.'
    ],
    teachingPearl:
      'Good thrombolysis workflow is not just door-to-needle. It is door-to-needle with a rehearsed rescue pathway.',
    changedSinceLastGuideline:
      'The 2026 guideline emphasizes readiness for emergent bleeding and angioedema complications as part of safe IVT administration.'
  }
];
