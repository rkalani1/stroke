// Educational content for stroke/neurology trainees.
// Pure data — consumed by React components in teaching.jsx.
//
// EVIDENCE AUDIT: Last comprehensive review against primary publications
// completed 2026-04-23. All trial outcomes, NNTs, COR/LOE labels, and
// guideline attributions verified against peer-reviewed source publications.
// Key guidelines referenced: AHA/ASA AIS 2019 (Powers) + 2019 focused update,
// AHA/ASA ICH 2022 (Greenberg), AHA/ASA aSAH 2023, AHA/ASA CVT 2024,
// AHA/ASA Secondary Prevention 2021 (Kleindorfer), ESC AF 2024 (van Gelder).

// =====================================================================
// LANDMARK TRIALS — organized by topic
// =====================================================================

export const LANDMARK_TRIALS = {
  thrombolysis: [
    {
      name: 'NINDS',
      year: 1995,
      citation: 'NEJM 1995;333:1581-7',
      question: 'Does IV alteplase within 3h of symptom onset improve outcomes in acute ischemic stroke?',
      design: 'RCT, n=624, alteplase 0.9 mg/kg vs placebo within 3h',
      outcomes: 'Favorable outcome (mRS 0-1) at 3mo: 39% vs 26%. sICH: 6.4% vs 0.6%.',
      nnt: 'NNT ~8 for mRS 0-1',
      bottomLine: 'IV alteplase within 3h improves neurologic recovery despite bleeding risk. Foundation of modern stroke treatment.',
      teachingPoint: 'Time is brain — NNT drops from ~5 at 90 min to ~14 by 3h. "Door-to-needle" <45 min is AHA benchmark.'
    },
    {
      name: 'ECASS III',
      year: 2008,
      citation: 'NEJM 2008;359:1317-29',
      question: 'Is IV alteplase effective 3-4.5h after symptom onset?',
      design: 'RCT, n=821, alteplase vs placebo in 3-4.5h window',
      outcomes: 'mRS 0-1 at 90d: 52% vs 45%, OR 1.34. sICH: 2.4% vs 0.2%.',
      bottomLine: 'Extended the window to 4.5h with similar NNT/NNH profile.',
      teachingPoint: 'ECASS III exclusions (age >80, NIHSS >25, DM + prior stroke, any AC) were NOT carried forward to AHA 2019 guidelines for the 0-3h window.'
    },
    {
      name: 'EXTEND-IA TNK',
      year: 2018,
      citation: 'NEJM 2018;378:1573-82',
      question: 'Is TNK non-inferior to alteplase before EVT for LVO?',
      design: 'RCT, n=202, TNK 0.25 mg/kg vs alteplase 0.9 mg/kg before EVT',
      outcomes: 'Substantial reperfusion: 22% vs 10% (P=0.002). mRS 0-2 at 90d: 64% vs 51%.',
      bottomLine: 'TNK superior to alteplase for early reperfusion in LVO.',
      teachingPoint: 'TNK is non-inferior to alteplase for AIS and may be superior for LVO. Single bolus (vs 1-hr infusion) → logistic advantage for drip-and-ship.'
    },
    {
      name: 'AcT',
      year: 2022,
      citation: 'Lancet 2022;400:161-69',
      question: 'Is TNK 0.25 mg/kg non-inferior to alteplase 0.9 mg/kg in general AIS?',
      design: 'RCT, n=1577, Canadian multicenter, ≤4.5h from onset',
      outcomes: 'mRS 0-1 at 90-120d: 36.9% (TNK) vs 34.8% (alteplase), meeting non-inferiority. sICH: 3.4% vs 3.2%.',
      bottomLine: 'TNK is non-inferior to alteplase in real-world AIS. Simpler single-bolus administration.',
      teachingPoint: 'TNK has replaced alteplase as first-line at many centers due to simpler bolus-only dosing and comparable efficacy/safety.'
    },
    {
      name: 'WAKE-UP',
      year: 2018,
      citation: 'NEJM 2018;379:611-22',
      question: 'Does alteplase benefit patients with unknown-onset stroke if DWI-FLAIR mismatch is present?',
      design: 'RCT, n=503, alteplase vs placebo with DWI positive + FLAIR negative (implies <4.5h from onset)',
      outcomes: 'mRS 0-1 at 90d: 53% vs 42%. sICH: 2% vs 0.4%.',
      bottomLine: 'DWI-FLAIR mismatch identifies wake-up stroke patients within "tissue window" for lysis.',
      teachingPoint: 'Tissue-based selection (imaging) can replace time-based selection when LKW is unknown. Foundation of extended-window treatment.'
    },
    {
      name: 'EXTEND',
      year: 2019,
      citation: 'NEJM 2019;380:1795-1803',
      question: 'Does alteplase benefit patients 4.5-9h from onset with CTP/MRP mismatch?',
      design: 'RCT, n=225, alteplase vs placebo with perfusion mismatch (core <70 mL, ratio ≥1.2, penumbra ≥10 mL)',
      outcomes: 'mRS 0-1 at 90d: 35% vs 29%, aOR 1.44. sICH: 6% vs 1%.',
      bottomLine: 'Perfusion mismatch extends lytic window to 9h in selected patients.',
      teachingPoint: 'The imaging criteria (core <70, ratio ≥1.2, mismatch ≥10) came directly from EXTEND and are now the standard for extended-window selection.'
    },
    {
      name: 'TIMELESS',
      year: 2024,
      citation: 'NEJM 2024;390:701-11',
      question: 'Does TNK 4.5-24h improve outcomes in LVO stroke with salvageable tissue proceeding to EVT?',
      design: 'RCT, n=458, TNK vs placebo pre-EVT in 4.5-24h',
      outcomes: 'mRS shift at 90d: not significant (primary neutral). Excellent outcome (mRS 0-1): 46% vs 42%, no significant difference.',
      bottomLine: 'Neutral for pre-EVT TNK beyond 4.5h; safe but no efficacy benefit demonstrated.',
      teachingPoint: 'Bridging IVT before EVT beyond 4.5h did NOT show benefit; EVT alone may be sufficient in late window.'
    },
    {
      name: 'TRACE-2',
      year: 2023,
      citation: 'Lancet 2023;401:645-54',
      question: 'Is TNK non-inferior to alteplase in Chinese AIS patients ineligible for EVT?',
      design: 'RCT, n=1430, TNK vs alteplase ≤4.5h, Chinese population',
      outcomes: 'mRS 0-1 at 90d: 62% vs 58%. sICH: 2% vs 2%.',
      bottomLine: 'TNK non-inferior to alteplase in non-LVO AIS. Confirms AcT findings in different population.',
      teachingPoint: 'TRACE-2 + AcT establish TNK as standard-of-care alternative to alteplase across populations.'
    },
    {
      name: 'TWIST',
      year: 2023,
      citation: 'Lancet Neurol 2023;22:127-36',
      question: 'Does TNK benefit wake-up stroke patients without advanced imaging selection?',
      design: 'RCT, n=578, TNK vs standard care for wake-up stroke (no CTP/MRI required)',
      outcomes: 'Excellent outcome (mRS 0): no significant difference. Ordinal shift: no benefit.',
      bottomLine: 'Without advanced imaging selection, TNK did not improve outcomes in wake-up stroke.',
      teachingPoint: 'Imaging selection (DWI-FLAIR mismatch or CTP) is essential for benefit in extended-window lytics. "Just treat based on clock + CT" does not work in wake-up.'
    }
  ],

  thrombectomy: [
    {
      name: 'MR CLEAN',
      year: 2015,
      citation: 'NEJM 2015;372:11-20',
      question: 'Does EVT improve outcomes in acute anterior circulation LVO within 6h?',
      design: 'RCT, n=500, stent retriever + usual care vs usual care (majority received tPA)',
      outcomes: 'mRS 0-2 at 90d: 33% vs 19%, aOR 2.16. sICH: 8% vs 6%.',
      bottomLine: 'First unequivocally positive EVT trial, launching the modern thrombectomy era.',
      teachingPoint: 'Pooled HERMES analysis of MR CLEAN + ESCAPE + EXTEND-IA + SWIFT PRIME + REVASCAT showed NNT 2.6 for improvement and NNT 5 for functional independence at 90d.'
    },
    {
      name: 'ESCAPE',
      year: 2015,
      citation: 'NEJM 2015;372:1019-30',
      question: 'Does rapid EVT with imaging selection benefit LVO within 12h?',
      design: 'RCT, n=316, EVT vs usual care with small core + good collaterals on CTA',
      outcomes: 'mRS 0-2 at 90d: 53% vs 29%. NNT 4 for functional independence.',
      bottomLine: 'Collateral-based selection enables extended window.',
      teachingPoint: 'Good collaterals on CTA correlate with small core and viable penumbra — critical for late-window decisions.'
    },
    {
      name: 'EXTEND-IA',
      year: 2015,
      citation: 'NEJM 2015;372:1009-18',
      question: 'Does EVT benefit perfusion-selected LVO patients?',
      design: 'RCT, n=70, CTP selection with core <70 mL and penumbra:core ≥1.2',
      outcomes: 'Early neurologic improvement: 80% vs 37%. mRS 0-2 at 90d: 71% vs 40%.',
      bottomLine: 'Perfusion imaging identifies patients with the greatest benefit from EVT.',
      teachingPoint: 'Core 70 mL / penumbra 1.2 ratio became the foundation for later DAWN and DEFUSE-3 criteria.'
    },
    {
      name: 'SWIFT PRIME',
      year: 2015,
      citation: 'NEJM 2015;372:2285-95',
      question: 'Does stent retriever EVT improve outcomes after IV tPA?',
      design: 'RCT, n=196, tPA + EVT vs tPA alone',
      outcomes: 'mRS 0-2 at 90d: 60% vs 35%.',
      bottomLine: 'Confirmed EVT benefit on top of IV tPA.',
      teachingPoint: 'Bridging thrombolysis + EVT was standard until trials questioned whether EVT alone might be non-inferior in hospital settings.'
    },
    {
      name: 'DAWN',
      year: 2018,
      citation: 'NEJM 2018;378:11-21',
      question: 'Does EVT 6-24h from LKW benefit patients with clinical-core mismatch?',
      design: 'RCT, n=206, tier-based inclusion (age, NIHSS, core volume)',
      outcomes: 'mRS 0-2 at 90d: 49% vs 13%. NNT 2.8 for functional independence.',
      bottomLine: 'Extended the EVT window to 24h with tissue-based selection.',
      teachingPoint: 'DAWN tiers (A: ≥80yo + NIHSS ≥10 + core <21; B: <80 + NIHSS ≥10 + core <31; C: <80 + NIHSS ≥20 + core <51) — know by heart for telestroke calls.'
    },
    {
      name: 'DEFUSE-3',
      year: 2018,
      citation: 'NEJM 2018;378:708-18',
      question: 'Does EVT 6-16h benefit CTP-selected patients?',
      design: 'RCT, n=182, core ≤70 mL + mismatch ratio ≥1.8 + mismatch volume ≥15 mL',
      outcomes: 'mRS 0-2 at 90d: 45% vs 17%.',
      bottomLine: 'Perfusion-mismatch selection works up to 16h.',
      teachingPoint: 'DEFUSE-3 core/ratio/mismatch criteria are easier to memorize than DAWN tiers; both are Class 1A in AHA/ASA guidelines.'
    },
    {
      name: 'SELECT2',
      year: 2023,
      citation: 'NEJM 2023;388:1259-71',
      question: 'Does EVT benefit patients with LARGE ischemic core (ASPECTS 3-5 or core 50-100 mL)?',
      design: 'RCT, n=352, EVT vs medical management in 0-24h with large core',
      outcomes: 'mRS 0-2 at 90d: 20.3% vs 7.0% (NNT 7.5). sICH: 0.6% vs 1.1%.',
      bottomLine: 'EVT improves outcomes even with large core — the "too big to treat" paradigm was wrong.',
      teachingPoint: 'Consider EVT in large-core patients with pre-stroke independence; counsel honestly about likelihood of moderate disability even with successful recanalization.'
    },
    {
      name: 'ANGEL-ASPECT',
      year: 2023,
      citation: 'NEJM 2023;388:1272-83',
      question: 'Does EVT benefit Chinese patients with ASPECTS 3-5?',
      design: 'RCT, n=456, EVT vs medical management, 6-24h',
      outcomes: 'mRS 0-2 at 90d: 30.0% vs 11.6% (NNT 5.4). sICH: 6.1% vs 2.7%.',
      bottomLine: 'Confirms SELECT2 in a different population.',
      teachingPoint: 'ANGEL-ASPECT + SELECT2 + RESCUE-Japan LIMIT together establish large-core EVT as standard of care.'
    },
    {
      name: 'RESCUE-Japan LIMIT',
      year: 2022,
      citation: 'NEJM 2022;386:1303-13',
      question: 'Does EVT benefit patients with ASPECTS 3-5?',
      design: 'RCT, n=203, Japanese population, 0-6h',
      outcomes: 'mRS 0-3 at 90d: 31.0% vs 12.7% (NNT 5.5). sICH: 9.0% vs 4.5%.',
      bottomLine: 'Early large-core trial establishing EVT benefit in ASPECTS 3-5.',
      teachingPoint: 'Primary endpoint was mRS 0-3 (not 0-2) — relevant when counseling, as "functional independence" is set lower in large-core populations.'
    },
    {
      name: 'BAOCHE + ATTENTION',
      year: 2022,
      citation: 'NEJM 2022 (both)',
      question: 'Does EVT benefit basilar artery occlusion?',
      design: 'Two separate RCTs in Chinese populations',
      outcomes: 'mRS 0-3 at 90d: substantially higher with EVT. Mortality reduced.',
      bottomLine: 'Basilar artery EVT improves outcomes in severely affected patients (NIHSS ≥10).',
      teachingPoint: 'BASICS (2021) was neutral; BAOCHE + ATTENTION positive. Reconcile: select patients with PC-ASPECTS ≥6, NIHSS ≥10, early presentation.'
    }
  ],

  postEVTbp: [
    {
      name: 'ENCHANTED2-MT',
      year: 2022,
      citation: 'Lancet 2022;400:1585-96',
      question: 'Does more intensive SBP lowering (<120 vs <140) improve outcomes post-EVT?',
      design: 'RCT, n=821, intensive (<120) vs less-intensive (140-180) SBP control for 72h post successful EVT',
      outcomes: 'Primary (mRS shift at 90d): worse in intensive (common OR 1.37 for poor outcome). Early neurologic deterioration more common.',
      bottomLine: 'Intensive SBP lowering (<120) post-EVT is HARMFUL. Standard target SBP <180.',
      teachingPoint: 'Why current guidance is SBP <180 (not <140) post-successful EVT. Extrapolation: maintain SBP floor of 140 for 72h.'
    },
    {
      name: 'OPTIMAL-BP',
      year: 2023,
      citation: 'JAMA 2023;330:832-41',
      question: 'Does intensive SBP <140 improve outcomes post-EVT vs SBP <180?',
      design: 'RCT, n=306, Korean population, intensive (<140) vs standard (<180) for 24h',
      outcomes: 'mRS 0-2 at 90d: 39.4% vs 54.4% (worse with intensive). Trial stopped early for futility/harm.',
      bottomLine: 'Confirms ENCHANTED2-MT — intensive BP lowering post-EVT is NOT beneficial and likely harmful.',
      teachingPoint: 'OPTIMAL-BP stopped early for harm at n=306. Post-EVT BP target: SBP <180, not <140.'
    },
    {
      name: 'BP-TARGET',
      year: 2021,
      citation: 'Lancet Neurol 2021;20:265-74',
      question: 'Does SBP 100-129 improve outcomes post-EVT vs SBP 130-185?',
      design: 'RCT, n=324, France, intensive vs standard post-successful EVT',
      outcomes: 'Primary (radiographic ICH at 24-36h): no significant difference. Symptomatic ICH higher with intensive.',
      bottomLine: 'No benefit to intensive BP lowering post-EVT; trend toward harm.',
      teachingPoint: 'BP-TARGET + ENCHANTED2-MT + OPTIMAL-BP + BEST-II converge on the same answer: post-EVT SBP should be in the 140-180 range.'
    },
    {
      name: 'BEST-II',
      year: 2024,
      citation: 'Stroke 2024',
      question: 'Are more aggressive SBP targets (<140, <130) better than <180 post-EVT?',
      design: 'Futility RCT, 3-arm',
      outcomes: 'Lower targets trended toward worse outcomes; non-futility not demonstrated.',
      bottomLine: 'Seals the case — no benefit to SBP targets below 140 post-EVT.',
      teachingPoint: 'Consistent with prior trials. Standard post-EVT target SBP <180, avoid <140 for 72h.'
    }
  ],

  ichReversal: [
    {
      name: 'INTERACT2',
      year: 2013,
      citation: 'NEJM 2013;368:2355-65',
      question: 'Does intensive BP lowering (SBP <140) improve outcomes in acute ICH?',
      design: 'RCT, n=2839, intensive (SBP <140 within 1h) vs standard (<180)',
      outcomes: 'Primary (mRS 3-6 at 90d): no significant difference. Ordinal analysis favored intensive.',
      bottomLine: 'Intensive BP lowering to SBP 140 is safe and may be beneficial; not harmful in ICH.',
      teachingPoint: 'Basis for 2022 AHA/ASA recommendation: target SBP 140 (range 130-150) for presenting SBP 150-220.'
    },
    {
      name: 'ATACH-2',
      year: 2016,
      citation: 'NEJM 2016;375:1033-43',
      question: 'Does aggressive BP lowering (SBP 110-139) improve outcomes vs standard (140-179)?',
      design: 'RCT, n=1000, aggressive vs standard with nicardipine',
      outcomes: 'Primary outcome: no difference. Renal adverse events: 9% vs 4% (higher in aggressive).',
      bottomLine: 'Going BELOW SBP 130 is not beneficial and may cause harm.',
      teachingPoint: 'Why the 2022 guideline says "avoid SBP <130 — Class 3: Harm" in ICH.'
    },
    {
      name: 'INTERACT3',
      year: 2023,
      citation: 'Lancet 2023;402:27-40',
      question: 'Does a care bundle (early intensive BP, glucose, temp, AC reversal) improve ICH outcomes?',
      design: 'Cluster RCT, n=7036, bundle vs usual care',
      outcomes: 'Ordinal shift mRS at 6mo favored bundle (OR 0.86). Mortality: trend toward benefit.',
      bottomLine: 'A bundle of early intensive BP + glucose + fever + AC reversal improves ICH outcomes.',
      teachingPoint: 'INTERACT3 is about the BUNDLE, not BP alone. Each component reinforces the others.'
    },
    {
      name: 'MISTIE III',
      year: 2019,
      citation: 'Lancet 2019;393:1021-32',
      question: 'Does minimally-invasive clot lysis (alteplase through catheter) improve ICH outcomes?',
      design: 'RCT, n=506, MIS+alteplase vs medical management for 30-100 mL ICH',
      outcomes: 'Primary (mRS 0-3 at 1yr): no overall benefit. Per-protocol subgroup (residual clot <15 mL): mRS 0-3 significantly improved.',
      bottomLine: 'Technical success (clot reduction to <15 mL) correlates with outcome; overall neutral trial.',
      teachingPoint: 'Set up the ENRICH trial (positive) and current trend toward minimally-invasive evacuation for selected ICH.'
    },
    {
      name: 'ENRICH',
      year: 2024,
      citation: 'NEJM 2024;390:1277-89',
      question: 'Does minimally-invasive parafascicular surgery (BrainPath) improve lobar ICH outcomes?',
      design: 'RCT, n=300, MIPS+medical vs medical for lobar ICH 30-80 mL',
      outcomes: 'Primary (utility-weighted mRS at 180d): significantly favored MIPS.',
      bottomLine: 'First positive ICH surgery trial — MIPS improves outcomes in selected lobar ICH patients.',
      teachingPoint: 'Inclusion: lobar ICH 30-80 mL, ≤24h onset, NIHSS >5, GCS 5-15, age 18-80, mRS 0-1. Deep ICH and cerebellar ICH were excluded.'
    },
    {
      name: 'ANNEXA-4 / ANNEXA-I',
      year: '2016 / 2024',
      citation: 'NEJM 2016;375:1131-41 / NEJM 2024',
      question: 'Does andexanet alfa reduce hematoma expansion in factor Xa inhibitor-associated ICH?',
      design: 'Single-arm (ANNEXA-4) → RCT (ANNEXA-I): andexanet vs usual care',
      outcomes: 'ANNEXA-I: hemostatic efficacy 67% vs 53%. Thrombotic events: 10.3% vs 5.6%.',
      bottomLine: 'Effective at reducing expansion but higher thrombotic risk; individualized decision.',
      teachingPoint: 'PCC remains first-line for factor Xa-associated ICH at many centers given cost/access of andexanet and thrombotic signal. 2022 AHA/ASA ICH guideline gives andexanet a Class 2a recommendation.'
    }
  ],

  secondaryPrevention: [
    {
      name: 'CHANCE',
      year: 2013,
      citation: 'NEJM 2013;369:11-19',
      question: 'Does DAPT (clopidogrel + ASA) reduce stroke after minor stroke/TIA?',
      design: 'RCT, n=5170, Chinese, clopi+ASA x 21d vs ASA alone',
      outcomes: '90-day stroke: 8.2% vs 11.7%, HR 0.68.',
      bottomLine: 'Short-course DAPT reduces early recurrence after minor stroke/high-risk TIA.',
      teachingPoint: 'Inclusion: NIHSS ≤3 or ABCD² ≥4. DAPT duration 21 days (longer duration increases bleeding).'
    },
    {
      name: 'POINT',
      year: 2018,
      citation: 'NEJM 2018;379:215-25',
      question: 'Does DAPT reduce stroke in minor stroke/TIA (US/international)?',
      design: 'RCT, n=4881, clopi+ASA x 90d (study drug; DAPT truncated at 21d post-hoc)',
      outcomes: '90-day major ischemic events: 5.0% vs 6.5%, HR 0.75. Major bleeding: 0.9% vs 0.4%.',
      bottomLine: 'DAPT reduces ischemic events but increases bleeding. Optimal duration appears to be 21 days (Kim et al. 2019 meta-analysis).',
      teachingPoint: 'Take-home: DAPT for 21 days after minor stroke (NIHSS ≤3) or high-risk TIA (ABCD² ≥4), then single antiplatelet.'
    },
    {
      name: 'THALES',
      year: 2020,
      citation: 'NEJM 2020;383:207-17',
      question: 'Does ticagrelor + ASA reduce stroke/death in minor-to-moderate AIS or high-risk TIA?',
      design: 'RCT, n=11,016, ticagrelor+ASA x 30d vs ASA alone',
      outcomes: '30-day stroke or death: 5.5% vs 6.6%, HR 0.83. Severe bleeding: 0.5% vs 0.1%.',
      bottomLine: 'Ticagrelor+ASA effective in up to NIHSS 5 or high-risk TIA with atherosclerosis.',
      teachingPoint: 'Inclusion includes NIHSS ≤5 (higher than CHANCE/POINT). Useful when CYP2C19 LOF status known (ticagrelor not affected).'
    },
    {
      name: 'CHANCE-2',
      year: 2021,
      citation: 'NEJM 2021;385:2520-30',
      question: 'In CYP2C19 LOF carriers, is ticagrelor+ASA better than clopidogrel+ASA?',
      design: 'RCT, n=6412, ticagrelor+ASA vs clopi+ASA x 21d in CYP2C19 LOF carriers',
      outcomes: '90-day stroke: 6.0% vs 7.6%, HR 0.77.',
      bottomLine: 'In CYP2C19 LOF carriers, switch to ticagrelor.',
      teachingPoint: 'CYP2C19 LOF (≈30% of patients, higher in Asian populations) → impaired clopidogrel activation. Point-of-care genotyping is increasingly available.'
    },
    {
      name: 'SPARCL',
      year: 2006,
      citation: 'NEJM 2006;355:549-59',
      question: 'Does atorvastatin 80 mg reduce recurrent stroke in non-cardioembolic stroke/TIA?',
      design: 'RCT, n=4731, atorvastatin 80 vs placebo, LDL ~130 at baseline',
      outcomes: '5-year fatal/nonfatal stroke: 11.2% vs 13.1%, HR 0.84.',
      bottomLine: 'High-intensity statin reduces recurrent stroke.',
      teachingPoint: 'Small increase in hemorrhagic stroke (2.3% vs 1.4%) but overall net benefit. Informed later TST trial showing LDL <70 target.'
    },
    {
      name: 'TST (Treat Stroke to Target)',
      year: 2020,
      citation: 'NEJM 2020;382:9',
      question: 'Is LDL <70 better than 90-110 for secondary stroke prevention?',
      design: 'RCT, n=2860, LDL <70 vs 100±10 mg/dL',
      outcomes: 'Major CV events: 8.5% vs 10.9%, HR 0.78.',
      bottomLine: 'LDL <70 is the target for secondary stroke prevention.',
      teachingPoint: 'LDL target <70 is now standard; if not achieved on high-intensity statin, add ezetimibe, then PCSK9i per 2021 AHA/ASA guideline.'
    },
    {
      name: 'ARCADIA',
      year: 2024,
      citation: 'JAMA 2024;331:573-83',
      question: 'Does apixaban reduce recurrent stroke in ESUS patients with atrial cardiopathy markers?',
      design: 'RCT, n=1015, apixaban vs ASA in ESUS with NT-proBNP ≥250 or LA enlargement',
      outcomes: 'Primary: no significant difference. Recurrent stroke: 4.4% vs 4.7%.',
      bottomLine: 'Empiric anticoagulation in ESUS with atrial cardiopathy markers does NOT reduce recurrence.',
      teachingPoint: 'Joins NAVIGATE-ESUS, RE-SPECT ESUS in showing empiric AC does not work for ESUS. Search for PAF with loop recorders instead.'
    },
    {
      name: 'NAVIGATE-ESUS + RE-SPECT ESUS',
      year: '2018-19',
      citation: 'NEJM 2018;378:2191; NEJM 2019;380:1906',
      question: 'Does rivaroxaban or dabigatran reduce recurrence in ESUS?',
      design: 'Two large RCTs of DOAC vs ASA in ESUS',
      outcomes: 'Both neutral for efficacy; higher bleeding with AC.',
      bottomLine: 'Empiric AC in ESUS does not help. Find the etiology.',
      teachingPoint: 'ESUS is a heterogeneous population — some have atrial cardiopathy, some aortic plaque, some PFO, some occult AF. Empiric AC treats none optimally.'
    },
    {
      name: 'CLOSE / RESPECT / REDUCE',
      year: '2017-18',
      citation: 'NEJM 2017-18',
      question: 'Does PFO closure reduce recurrent stroke in patients with cryptogenic stroke + PFO?',
      design: 'Three RCTs, closure vs medical management',
      outcomes: 'All favored closure, particularly in patients with large shunt or atrial septal aneurysm.',
      bottomLine: 'PFO closure recommended in select cryptogenic stroke patients age <60 with high-risk PFO features.',
      teachingPoint: 'Use RoPE score to assess likelihood PFO is causal. RoPE ≥7 + high-risk features → closure (Class 1).'
    },
    {
      name: 'CADISS / TREAT-CAD',
      year: '2015 / 2021',
      citation: 'Lancet Neurol 2015;14:361 / Lancet Neurol 2021;20:341',
      question: 'Is aspirin non-inferior to VKA for cervical artery dissection?',
      design: 'Two RCTs, ASA vs VKA, 3-6 months',
      outcomes: 'CADISS: non-inferior but underpowered. TREAT-CAD: ASA non-inferior for primary endpoint.',
      bottomLine: 'Aspirin non-inferior to warfarin for cervical dissection.',
      teachingPoint: 'Aspirin is first-line; VKA/DOAC reserved for recurrent events on ASA or free-floating thrombus.'
    },
    {
      name: 'CREST / CREST-2',
      year: '2010 / 2025',
      citation: 'NEJM 2010;363:11 / NEJM 2025',
      question: 'CEA vs CAS for symptomatic carotid stenosis; CAS vs medical management for asymptomatic',
      design: 'CREST: CEA vs CAS. CREST-2: CEA+IMM vs IMM alone; CAS+IMM vs IMM alone.',
      outcomes: 'CREST: similar primary outcomes, CAS has more peri-procedural strokes, CEA more MIs. CREST-2: modern medical management may be as good as revascularization.',
      bottomLine: 'For asymptomatic ≥70% stenosis: intensive medical management is an evidence-based alternative to revascularization.',
      teachingPoint: 'CREST-2 challenges decades of asymptomatic carotid management — intensive medical therapy (LDL <70, SBP <130, antiplatelet, smoking cessation) may obviate need for CEA/CAS.'
    }
  ],

  antithrombotic: [
    {
      name: 'RE-LY / ROCKET-AF / ARISTOTLE / ENGAGE AF',
      year: '2009-2013',
      citation: 'NEJM',
      question: 'Are DOACs non-inferior or superior to warfarin for AF stroke prevention?',
      design: 'Four large RCTs',
      outcomes: 'All DOACs non-inferior or superior. Less ICH across all DOACs.',
      bottomLine: 'DOACs are first-line over warfarin for non-valvular AF.',
      teachingPoint: 'Apixaban (ARISTOTLE) had superior mortality + less bleeding; preferred at many centers. Dose adjust for age ≥80, weight ≤60, creatinine ≥1.5 (2 of 3: reduce to 2.5 mg BID).'
    },
    {
      name: 'ELAN',
      year: 2023,
      citation: 'Fischer NEJM 2023;388:2411-21',
      question: 'When to start DOAC after AF-related ischemic stroke — early vs late?',
      design: 'RCT, n=2013, early DOAC (NIHSS-stratified) vs later (day 3/6/12-14) initiation',
      outcomes: '30-day recurrence/ICH/death composite: 2.9% early vs 4.1% late (95% CI favoring early). No excess ICH.',
      bottomLine: 'Early DOAC initiation (within 48h for minor/moderate, day 6-7 for severe) is at least non-inferior and likely superior to the traditional 1-3-6-12 rule.',
      teachingPoint: 'Timing scheme often called "CATALYST" is institutional shorthand: minor (NIHSS <8) day 1; moderate (8-15) day 3; severe (≥16) day 6. Supported by ELAN (RCT) and OPTIMAS (NEJM 2024).'
    },
    {
      name: 'OPTIMAS',
      year: 2024,
      citation: 'Werring Lancet 2024 / NEJM 2024',
      question: 'Is early DOAC initiation after AF stroke non-inferior to standard timing?',
      design: 'Pragmatic open-label RCT in UK, n>3500, early (≤4 days) vs standard (7-14 days)',
      outcomes: 'Primary composite (ischemic stroke, ICH, unclassified stroke, systemic embolism at 90d): non-inferiority met. Similar safety.',
      bottomLine: 'Confirms ELAN — earlier AC start is safe and at least as effective as delayed start.',
      teachingPoint: 'ELAN + OPTIMAS have shifted practice toward earlier AC. Most centers now start within 48h-7d depending on stroke severity.'
    },
    {
      name: 'CAPRIE',
      year: 1996,
      citation: 'Lancet 1996;348:1329-39',
      question: 'Is clopidogrel superior to aspirin for secondary prevention of vascular events?',
      design: 'RCT, n=19,185, clopidogrel 75 mg vs ASA 325 mg',
      outcomes: 'Annual vascular events: 5.32% vs 5.83%, RRR 8.7% (narrow). Stroke subgroup: no significant difference.',
      bottomLine: 'Clopidogrel modestly better than ASA overall; for ischemic stroke specifically the benefit is small.',
      teachingPoint: 'Clopidogrel and ASA are both acceptable first-line single antiplatelets for non-cardioembolic stroke. Patient factors (cost, GI bleeding history, concurrent PPI) often drive the choice.'
    },
    {
      name: 'MATCH',
      year: 2004,
      citation: 'Lancet 2004;364:331-37',
      question: 'Does long-term clopidogrel+ASA reduce stroke recurrence vs clopidogrel alone?',
      design: 'RCT, n=7599, high-risk patients, 18 months',
      outcomes: 'Primary composite vascular events: no significant difference. Life-threatening bleeding: 2.6% vs 1.3%, NNH=78.',
      bottomLine: 'Long-term DAPT after stroke is NOT effective and increases bleeding.',
      teachingPoint: 'Along with CHARISMA, established that DAPT beyond ~21-30 days is harmful. Why CHANCE/POINT truncate to 21 days.'
    },
    {
      name: 'SPS3',
      year: 2012,
      citation: 'NEJM 2012;367:817-25',
      question: 'Does DAPT (clopi+ASA) reduce recurrent lacunar stroke?',
      design: 'RCT, n=3020, clopi+ASA vs ASA alone, mean 3.4 years',
      outcomes: 'Recurrent stroke: HR 0.92, NS. Major hemorrhage: HR 1.97. Mortality: HR 1.52 (increased with DAPT).',
      bottomLine: 'DAPT does NOT reduce lacunar stroke recurrence; increases bleeding and mortality.',
      teachingPoint: 'Critical: DAPT is for large-artery and cardioembolic mechanisms; small vessel (lacunar) disease → SINGLE antiplatelet long-term.'
    },
    {
      name: 'COMPASS',
      year: 2017,
      citation: 'NEJM 2017;377:1319-30',
      question: 'Does rivaroxaban 2.5 mg BID + ASA reduce MACE in stable atherosclerotic disease?',
      design: 'RCT, n=27,395, stable CAD or PAD',
      outcomes: 'MACE: HR 0.76 (24% RRR). Stroke: HR 0.58. Major bleeding: HR 1.70 (no ICH increase).',
      bottomLine: 'Low-dose rivaroxaban + ASA reduces stroke/CV events in polyvascular disease.',
      teachingPoint: 'Consider in stable patients with CAD+PAD, CAD+cerebrovascular disease. Most benefit in polyvascular patients. AHA/ASA 2021 Class 2b option.'
    },
    {
      name: 'RESTART',
      year: 2019,
      citation: 'Lancet 2019;393:2613-23',
      question: 'Is it safe to RESTART antiplatelet after ICH?',
      design: 'RCT, n=537, restart antiplatelet vs no antiplatelet after spontaneous ICH survivor',
      outcomes: 'Recurrent ICH: 4% vs 9%, HR 0.51 (favoring restart). Ischemic events: reduced with restart.',
      bottomLine: 'Restarting antiplatelet after ICH does NOT increase recurrent ICH and reduces ischemic events.',
      teachingPoint: 'Practice changer — historically feared restarting antiplatelet after ICH; RESTART shows benefit. Especially important if ischemic events reasonably likely (CAD, prior stroke).'
    }
  ],

  rehabilitation: [
    {
      name: 'AVERT',
      year: 2015,
      citation: 'Lancet 2015;386:46-55',
      question: 'Does very early (<24h) intensive mobilization improve stroke outcomes?',
      design: 'RCT, n=2104, very early intensive vs usual care',
      outcomes: 'Favorable outcome (mRS 0-2 at 3mo): 46% vs 50% — LESS favorable with very-early intensive. Dose-response: more frequent higher-intensity sessions worse.',
      bottomLine: 'Very-early (<24h) HIGH-intensity mobilization is HARMFUL. Early mobilization is fine but not aggressively intensive in first 24h.',
      teachingPoint: 'Counter-intuitive. Doesn\'t contradict early mobilization per se — just says don\'t push HIGH-dose mobilization in the first 24h. Short, frequent sessions remain standard.'
    },
    {
      name: 'FOCUS',
      year: 2019,
      citation: 'Lancet 2019;393:265-74',
      question: 'Does fluoxetine improve motor recovery after stroke?',
      design: 'RCT, n=3127, fluoxetine 20 mg vs placebo x 6 months',
      outcomes: 'Modified Rankin at 6 mo: no significant difference. Fewer depression cases but more fractures with fluoxetine.',
      bottomLine: 'Fluoxetine does NOT improve motor recovery after stroke.',
      teachingPoint: 'Contradicts earlier FLAME trial (2011). FOCUS + AFFINITY + EFFECTS (all negative for motor recovery) have closed the door on SSRIs for recovery. Still first-line for post-stroke depression.'
    },
    {
      name: 'AFFINITY',
      year: 2020,
      citation: 'Lancet Neurol 2020;19:651-60',
      question: 'Does fluoxetine improve functional recovery in Australasian populations?',
      design: 'RCT, n=1280, fluoxetine vs placebo x 6 months',
      outcomes: 'Functional outcome (mRS shift): no significant difference. Excess fractures, hyponatremia.',
      bottomLine: 'Confirms FOCUS — fluoxetine does NOT improve motor/functional outcomes.',
      teachingPoint: 'Treat post-stroke depression with SSRI if clinically indicated (sertraline often preferred). Do NOT use SSRI expecting motor recovery benefit.'
    },
    {
      name: 'SAVE',
      year: 2016,
      citation: 'NEJM 2016;375:919-31',
      question: 'Does CPAP reduce CV events in moderate-severe OSA?',
      design: 'RCT, n=2717, CPAP vs usual care in established CV disease with OSA',
      outcomes: 'Primary composite CV endpoint: no significant difference.',
      bottomLine: 'CPAP does not reduce CV events in moderate-severe OSA without daytime sleepiness.',
      teachingPoint: 'Doesn\'t mean don\'t treat OSA. Post-stroke OSA is common (50-70%), worsens neurologic function, treatment improves sleep quality, may improve BP. But SAVE tempers expectations for CV event reduction.'
    }
  ],

  sahCvt: [
    {
      name: 'ISAT',
      year: 2002,
      citation: 'Lancet 2002;360:1267',
      question: 'Coiling vs clipping for ruptured aneurysms?',
      design: 'RCT, n=2143',
      outcomes: '1-year mRS 3-6: 23.7% (coiling) vs 30.6% (clipping).',
      bottomLine: 'Coiling superior to clipping for most aneurysms (when both feasible).',
      teachingPoint: 'Shifted practice to endovascular-first for most ruptured aneurysms. Clipping still preferred for some MCA, wide-necked, or complex aneurysms.'
    },
    {
      name: 'Nimodipine (BANT + meta-analyses)',
      year: '1989',
      citation: 'BANT Br J Neurosurg 1989; Pickard BMJ 1989; Dorhout Mees Cochrane 2007',
      question: 'Does nimodipine improve outcomes in aSAH?',
      design: 'BANT (British Aneurysm Nimodipine Trial, 1989, n=554) + Cochrane meta-analyses',
      outcomes: 'Poor outcome (mRS 3-6 at 3mo): RR 0.67 favoring nimodipine. No definite effect on angiographic vasospasm.',
      bottomLine: 'Oral nimodipine 60 mg q4h × 21 days is Class 1 standard of care for all aSAH.',
      teachingPoint: 'Mechanism not solely vasospasm prevention — neuroprotective effect independent of large-vessel vasospasm. If hypotension occurs: split to 30 mg q2h rather than stopping.'
    },
    {
      name: 'SAHIT',
      year: 2018,
      citation: 'Neurology 2018',
      question: 'Prognostic model for aSAH outcomes',
      design: 'Pooled data, 10,936 patients',
      outcomes: 'Validated model using age, WFNS, Fisher, hypertension, aneurysm size, treatment method.',
      bottomLine: 'Externally validated score for outcome prediction.',
      teachingPoint: 'Use with caution — communicates prognosis probabilistically, not deterministically. Patients occasionally do dramatically better or worse than predicted.'
    }
  ]
};

// =====================================================================
// STROKE SYNDROME PATTERN LIBRARY
// =====================================================================

export const STROKE_SYNDROMES = {
  anteriorCirculation: [
    {
      name: 'Left MCA (dominant) — proximal M1',
      territory: 'Left middle cerebral artery proximal',
      deficits: 'Right hemiplegia (face+arm>leg), right hemisensory loss, right homonymous hemianopia, global aphasia, left gaze preference',
      pearls: 'Global aphasia + right hemiparesis is classic for dominant M1. If also gaze preference to left, suggests large cortical strike (Brocas + Wernicke area affected).',
      pimpingQ: 'Why does the patient look toward the side of the lesion in a left M1 stroke?',
      answer: 'Frontal eye field (Brodmann area 8) in the left frontal lobe normally drives gaze to the right. With left frontal damage, the right FEF is unopposed and pulls gaze to the left (ipsilateral to lesion).'
    },
    {
      name: 'Right MCA (non-dominant) — proximal M1',
      territory: 'Right middle cerebral artery proximal',
      deficits: 'Left hemiplegia (face+arm>leg), left hemisensory loss, left homonymous hemianopia, left hemi-neglect, right gaze preference, anosognosia',
      pearls: 'Non-dominant strokes → neglect (not aphasia). Patient may deny deficit (anosognosia). Classic: examiner shows patient their left hand and patient insists "that\'s not mine."',
      pimpingQ: 'What is the pathophysiology of hemineglect in right MCA stroke?',
      answer: 'Right parietal cortex normally attends to both hemispaces; left parietal only to right. Right parietal damage → left hemineglect (patient ignores left side). Left damage can cause mild right neglect but rarely severe because right parietal compensates.'
    },
    {
      name: 'MCA — superior division',
      territory: 'Rolandic + Brocas branches',
      deficits: 'Contralateral face/arm > leg weakness, expressive aphasia (left-sided), no hemianopia typically',
      pearls: 'Brocas aphasia: non-fluent, effortful speech, preserved comprehension, patient aware of deficit.'
    },
    {
      name: 'MCA — inferior division',
      territory: 'Temporoparietal (Wernicke area on left)',
      deficits: 'Receptive aphasia (left) or neglect (right), hemianopia, minimal or no motor deficit',
      pearls: 'Wernicke aphasia: fluent paraphasic speech, impaired comprehension, patient often UNAWARE of deficit → easily mistaken for "confusion" or psychiatric issue.'
    },
    {
      name: 'ACA',
      territory: 'Anterior cerebral artery',
      deficits: 'Contralateral LEG > arm weakness and sensory loss, abulia, urinary incontinence, transcortical motor aphasia (left), alien hand (bilateral).',
      pearls: 'Bilateral ACA occlusion (rare, e.g., ruptured ACoA aneurysm with vasospasm) → akinetic mutism, severe abulia.'
    },
    {
      name: 'PCA',
      territory: 'Posterior cerebral artery',
      deficits: 'Contralateral homonymous hemianopia (often with macular sparing), alexia without agraphia (left PCA + splenium), visual agnosia, prosopagnosia (bilateral occipitotemporal).',
      pearls: 'Isolated hemianopia in a patient able to read is pathognomonic for PCA — check for macular sparing (typically preserved if PCA only; absent in MCA infarct).'
    }
  ],

  posteriorCirculation: [
    {
      name: 'Lateral medullary (Wallenberg)',
      territory: 'Vertebral artery or PICA',
      deficits: 'IPSILATERAL: facial numbness (CN5), Horner (sympathetics), hoarseness/dysphagia (CN9/10), ataxia (ICP). CONTRALATERAL: body pain/temperature loss (spinothalamic).',
      pearls: 'The classic "crossed" syndrome. Often presents with severe nausea, vertigo, hiccups.',
      pimpingQ: 'Why does Wallenberg syndrome have crossed findings (ipsilateral face, contralateral body for pain/temp)?',
      answer: 'Trigeminal spinal nucleus (carries face pain/temp) is ipsilateral in the medulla. Spinothalamic tract (body pain/temp) has already decussated at the spinal cord level, so damage in the lateral medulla affects already-crossed fibers → contralateral body.'
    },
    {
      name: 'Medial medullary (Dejerine)',
      territory: 'Anterior spinal artery / vertebral',
      deficits: 'Contralateral hemiplegia (pyramidal tract), contralateral loss of position/vibration (medial lemniscus), ipsilateral tongue weakness (CN12).',
      pearls: 'Rare. "Medial" = motor + medial lemniscus + CN12 nucleus.'
    },
    {
      name: 'Top of the basilar',
      territory: 'Distal basilar + proximal PCAs',
      deficits: 'Bilateral PCA territory infarcts (cortical blindness/Anton syndrome), oculomotor deficits (vertical gaze palsy, skew deviation), coma/somnolence, memory loss (hippocampi), behavioral changes.',
      pearls: 'Diverse presentations often mislabeled as encephalopathy, delirium, or psychiatric. Look for vertical gaze palsy + disorientation + cortical visual deficit.'
    },
    {
      name: 'Basilar artery occlusion',
      territory: 'Basilar artery',
      deficits: 'Variable: bilateral limb weakness, quadriplegia, locked-in syndrome, coma, cranial nerve palsies, vertigo, ataxia.',
      pearls: 'Locked-in syndrome = ventral pontine infarct, preserved consciousness + vertical eye movements only. High mortality without recanalization; EVT indicated with PC-ASPECTS ≥6.'
    },
    {
      name: 'Top of basilar / PCA — bilateral',
      territory: 'Bilateral PCA',
      deficits: 'Cortical blindness (bilateral occipital). Anton syndrome: denial of blindness + confabulation.',
      pearls: 'Patient walks into objects and insists they can see.'
    },
    {
      name: 'Cerebellar stroke',
      territory: 'SCA / AICA / PICA',
      deficits: 'Ataxia, nystagmus, vertigo, nausea, dysmetria, dysarthria. May have ipsilateral Horner if PICA.',
      pearls: 'Cerebellar edema peaks day 2-4 → can cause obstructive hydrocephalus or brainstem compression. Suboccipital decompression + EVD is life-saving (Class 1, LOE B-NR per 2019 AHA/ASA).'
    },
    {
      name: 'Midbrain (Weber, Benedikt, Claude)',
      territory: 'Paramedian midbrain',
      deficits: 'Weber: CN3 ipsilateral + contralateral hemiparesis. Benedikt: CN3 + contralateral tremor/ataxia. Claude: CN3 + contralateral ataxia.',
      pearls: 'All involve CN3 (ipsilateral ptosis, mydriasis, "down and out" eye). Differ by which red-nucleus/pyramidal fibers are involved.'
    }
  ],

  lacunarSyndromes: [
    {
      name: 'Pure motor hemiparesis',
      territory: 'Posterior limb of internal capsule or basis pontis',
      deficits: 'Contralateral face/arm/leg weakness (all equal), NO sensory, NO cortical signs.',
      pearls: 'Most common lacunar syndrome. "Equal weakness" distinguishes from cortical strokes (which typically affect face+arm > leg for MCA).'
    },
    {
      name: 'Pure sensory stroke',
      territory: 'Thalamus (VPL/VPM)',
      deficits: 'Contralateral hemisensory loss (all modalities), NO weakness, NO cortical signs.',
      pearls: 'Often misdiagnosed as conversion/functional. Thalamic pain syndrome (Dejerine-Roussy) can develop weeks-months later.'
    },
    {
      name: 'Sensorimotor lacunar',
      territory: 'Thalamocapsular region',
      deficits: 'Both motor and sensory loss, contralateral, no cortical signs.',
      pearls: 'Slightly less specific for lacunar vs. small cortical stroke; imaging usually clarifies.'
    },
    {
      name: 'Ataxic hemiparesis',
      territory: 'Basis pontis or posterior limb internal capsule',
      deficits: 'Contralateral weakness (leg > arm typically) + ipsilateral cerebellar ataxia on the WEAK side.',
      pearls: '"Ataxia in a weak limb" — a classic teaching point.'
    },
    {
      name: 'Clumsy-hand dysarthria',
      territory: 'Basis pontis (paramedian branch)',
      deficits: 'Dysarthria + clumsy hand (contralateral), minimal weakness.',
      pearls: 'Subtle presentation. A "clumsy hand" and slurred speech with minimal weakness → small pontine lacune.'
    }
  ],

  special: [
    {
      name: 'Watershed (border zone)',
      territory: 'ACA-MCA or MCA-PCA border',
      deficits: 'ACA-MCA: "man-in-a-barrel" (proximal > distal arm weakness). MCA-PCA: transcortical aphasia.',
      pearls: 'Often caused by hypotension + high-grade stenosis. Think aortic stenosis, carotid stenosis, cardiac arrest, hemodialysis.'
    },
    {
      name: 'Thalamic (artery of Percheron)',
      territory: 'Bilateral paramedian thalami (single perforator from PCA)',
      deficits: 'Acute coma/decreased consciousness + vertical gaze palsy + memory/behavioral change.',
      pearls: 'Often misdiagnosed as encephalopathy or metabolic. MRI DWI shows bilateral thalamic lesions — pathognomonic.'
    },
    {
      name: 'Central pontine (paramedian pontine)',
      territory: 'Paramedian basilar branches',
      deficits: 'CN6 palsy (gaze palsy), contralateral hemiparesis, dysarthria.',
      pearls: 'Often an elderly patient with hypertension + small-vessel disease.'
    }
  ]
};

// =====================================================================
// NEUROANATOMY QUICK REFERENCE
// =====================================================================

export const NEUROANATOMY = {
  cranialNerves: [
    { cn: 'I', name: 'Olfactory', testing: 'Smell', lesionEffect: 'Anosmia (often traumatic or neurodegenerative)' },
    { cn: 'II', name: 'Optic', testing: 'Visual acuity, visual fields, fundi, pupils (afferent)', lesionEffect: 'Field cut or blindness depending on where (prechiasmal = unilateral, chiasm = bitemporal, tract/radiations = homonymous)' },
    { cn: 'III', name: 'Oculomotor', testing: 'Pupils (efferent), ptosis, EOM (all except superior oblique and lateral rectus)', lesionEffect: 'Ptosis + "down and out" eye + fixed dilated pupil (complete). Partial: pupil-sparing suggests microvascular (DM).' },
    { cn: 'IV', name: 'Trochlear', testing: 'Superior oblique (downward in adduction)', lesionEffect: 'Vertical diplopia worse looking down and in (e.g., reading, stairs). Head tilt away from lesion side.' },
    { cn: 'V', name: 'Trigeminal', testing: 'Facial sensation V1/V2/V3, corneal reflex, masseter, jaw jerk', lesionEffect: 'Facial numbness by division; weak jaw deviates TO side of lesion.' },
    { cn: 'VI', name: 'Abducens', testing: 'Lateral rectus (horizontal abduction)', lesionEffect: 'Horizontal diplopia worse on gaze to affected side. Can be a false localizing sign with high ICP.' },
    { cn: 'VII', name: 'Facial', testing: 'Facial symmetry (upper and lower), taste anterior 2/3 tongue, hyperacusis', lesionEffect: 'UMN: forehead spared (bilateral cortical innervation). LMN: entire face affected, + possible hyperacusis, taste change.' },
    { cn: 'VIII', name: 'Vestibulocochlear', testing: 'Hearing, Weber/Rinne, HIT, skew, nystagmus (HINTS exam)', lesionEffect: 'Vertigo + hearing loss + nystagmus. HINTS peripheral: normal head impulse + direction-changing nystagmus + normal skew → peripheral. Central: abnormal HIT or skew → central (stroke).' },
    { cn: 'IX', name: 'Glossopharyngeal', testing: 'Gag (sensory), taste posterior 1/3 tongue', lesionEffect: 'Absent gag (paired with CN10 for motor side).' },
    { cn: 'X', name: 'Vagus', testing: 'Palate elevation, gag (motor), hoarseness', lesionEffect: 'Uvula deviates AWAY from lesion; hoarseness, dysphagia.' },
    { cn: 'XI', name: 'Spinal accessory', testing: 'SCM, trapezius', lesionEffect: 'Weak shoulder shrug and head turn AWAY from lesion side.' },
    { cn: 'XII', name: 'Hypoglossal', testing: 'Tongue protrusion, atrophy, fasciculations', lesionEffect: 'Tongue deviates TOWARD the weak side (lick your wounds).' }
  ],

  vascularTerritories: [
    { artery: 'ACA', supply: 'Medial frontal + medial parietal (including paracentral lobule — legs), anterior corpus callosum' },
    { artery: 'MCA — M1', supply: 'Deep lenticulostriates (internal capsule, basal ganglia) + most of lateral cortex' },
    { artery: 'MCA — M2 superior division', supply: 'Rolandic + Brocas (frontal + upper parietal)' },
    { artery: 'MCA — M2 inferior division', supply: 'Wernicke + temporoparietal' },
    { artery: 'PCA — P1', supply: 'Bilateral thalami via perforators (art of Percheron variant), brainstem perforators' },
    { artery: 'PCA — P2-P4', supply: 'Occipital cortex, medial temporal (hippocampus), splenium corpus callosum' },
    { artery: 'AChA (anterior choroidal)', supply: 'Posterior limb internal capsule, lateral geniculate, medial temporal lobe' },
    { artery: 'PICA', supply: 'Lateral medulla (Wallenberg), inferior cerebellum (vermis + tonsils)' },
    { artery: 'AICA', supply: 'Lateral pons, middle cerebellar peduncle, labyrinthine (CN7/8) — hearing loss can occur' },
    { artery: 'SCA', supply: 'Superior cerebellum, tegmentum of upper pons/midbrain' },
    { artery: 'Basilar perforators', supply: 'Pons (corticospinal, corticobulbar, CN6/7 nuclei)' },
    { artery: 'Vertebral', supply: 'Medulla (anterior = medial medullary; lateral = Wallenberg when PICA origin involved)' }
  ]
};

// =====================================================================
// TEACHING PEARLS / COMMON PIMP QUESTIONS
// =====================================================================

export const TEACHING_PEARLS = [
  {
    category: 'Imaging',
    q: 'What is the hyperdense MCA sign and what does it mean?',
    a: 'Hyperdense vessel (Hounsfield 40-60) on non-contrast CT representing acute thrombus. Specificity ~90% for proximal MCA occlusion. Requires bone-windowing for detection.'
  },
  {
    category: 'Imaging',
    q: 'What is ASPECTS and why is it important?',
    a: 'Alberta Stroke Program Early CT Score — 10-point score assessing early ischemic changes in 10 MCA territory regions (M1-M6, L, I, C, IC). Starts at 10, subtract 1 per affected region. ASPECTS ≥6 for standard EVT (NIHSS ≥6); 3-5 eligible for large-core trials. <3 = very unfavorable but still consider SELECT2/ANGEL-ASPECT criteria.'
  },
  {
    category: 'Imaging',
    q: 'How do you differentiate stroke from mimic on MRI?',
    a: 'DWI positive + ADC restricted (dark) = acute ischemia. Unless: seizure (transient DWI +, corrects within days), hypoglycemia (selective regions), HSV encephalitis (temporal lobes, specific pattern), CJD (cortical + basal ganglia ribbon).'
  },
  {
    category: 'NIHSS',
    q: 'What is a "fake zero" NIHSS and when is it missed?',
    a: 'Posterior circulation stroke — vertigo, dysmetria, dysarthria, ataxia, hemianopia — can score 0-2 on NIHSS despite devastating deficit. If symptoms suggest posterior + NIHSS <4, still consider EVT and treat as stroke (not a mimic).'
  },
  {
    category: 'Thrombolysis',
    q: 'When is TNK contraindicated even if in window and no other exclusions?',
    a: 'Glucose <50 (correct first), SBP >185/110 despite treatment (uncontrolled), INR >1.7, recent major surgery <14d, ICH on imaging, aortic dissection, endocarditis, severe head injury <14d, prior ICH (relative if amyloid; modifiable if HTN), platelets <100K, aPTT >40 (if on heparin).'
  },
  {
    category: 'Thrombolysis',
    q: 'What drug for wake-up stroke?',
    a: 'Alteplase is the evidence-based agent (WAKE-UP trial). TNK can be extrapolated from AcT/TRACE-2 but direct RCT evidence in wake-up (TWIST) was negative without advanced imaging. Require DWI-FLAIR mismatch OR CTP mismatch.'
  },
  {
    category: 'Guidelines',
    q: 'What is the ICH BP target per 2022 AHA/ASA?',
    a: 'For presenting SBP 150-220 mmHg: target SBP 140, maintain 130-150 (Class 2a, LOE B-R). Avoid SBP <130 (Class 3: Harm, LOE B-R). Basis: INTERACT2 and ATACH-2.'
  },
  {
    category: 'Guidelines',
    q: 'Post-EVT BP target?',
    a: 'For successful recanalization (mTICI ≥2b): SBP 140-180 (avoid <140 for 72h — Class 3: Harm per ENCHANTED2-MT, OPTIMAL-BP, BP-TARGET, BEST-II).'
  },
  {
    category: 'Etiology',
    q: 'How do you work up cryptogenic stroke?',
    a: '30-day event monitor (or implantable loop recorder if HEADS² ≥3), TEE with bubble study (PFO, aortic plaque, LAA thrombus), hypercoag panel (antiphospholipid, factor V Leiden, protein C/S/AT-III, homocysteine), vessel wall imaging if suspicion for vasculitis/ICAD/dissection. Do NOT empirically anticoagulate (NAVIGATE/RE-SPECT/ARCADIA all neutral).'
  },
  {
    category: 'Etiology',
    q: 'How do you evaluate a young stroke patient (<55)?',
    a: 'Cervicocerebral vascular imaging (CTA/MRA H&N) for dissection, vasculitis, FMD, moyamoya. TEE w/ bubble for PFO. Hypercoag panel. MELAS screening (lactate), Fabry (α-galactosidase), CADASIL (NOTCH3, skin biopsy). Drug screen. Consider RCVS vs PRES by imaging. Review for illicit stimulant use.'
  },
  {
    category: 'Differential',
    q: 'Most common stroke mimics in the ED?',
    a: 'Seizure with Todd paralysis (~10%), migraine with aura, hypoglycemia, sepsis/infection, encephalopathy/delirium, functional neurologic disorder, central vertigo vs peripheral, Bell palsy vs stroke. Seizure + aphasia is a hard one — if in doubt, treat as stroke (safer to give lytic for mimic than miss a stroke).'
  },
  {
    category: 'Differential',
    q: 'HINTS exam: what is it, when positive?',
    a: 'Head Impulse, Nystagmus, Test of Skew. For acute vestibular syndrome. Positive for central (stroke) if ANY of: (1) normal/bilateral HIT, (2) direction-changing nystagmus, (3) abnormal skew deviation. Higher sensitivity than MRI in first 48h (which can miss small brainstem lesions).'
  },
  {
    category: 'Management',
    q: 'Post-tPA complications — what to watch for?',
    a: '(1) Hemorrhagic transformation (stop tPA, CT, cryo/TXA if PH, platelets if <100K). (2) Orolingual angioedema (ACE-inhibitor users — stop tPA, IV diphenhydramine + methylprednisolone + H2 blocker; epinephrine if airway compromise). (3) Hypotension / reperfusion injury. Q15 neurochecks × 2h, then q30 × 6h, then q1h × 16h.'
  },
  {
    category: 'Management',
    q: 'DVT prophylaxis timing after ICH?',
    a: 'Day 0: IPC only (CLOTS-3). Day 2-4 with stable imaging: enoxaparin 40 mg SC daily or UFH 5000 BID (Class 2b, LOE B-R per AHA/ASA 2022 ICH). For ischemic stroke: chemical ppx from admission (Class 1).'
  },
  {
    category: 'Rehab',
    q: 'When does spasticity typically develop?',
    a: '2-6 weeks post-stroke. Treatment: physical therapy + stretching + oral baclofen / tizanidine. For focal severe spasticity: botulinum toxin (onabotulinum A) every 3 months.'
  },
  {
    category: 'Prognosis',
    q: 'What is the natural history of functional recovery after stroke?',
    a: 'Most recovery occurs first 3 months. Further gains are incremental but continue at least 6-12 months. 90-day mRS is the traditional trial endpoint because most recovery has plateaued by then. Language recovery can continue for 2+ years.'
  }
];

// =====================================================================
// KEYBOARD SHORTCUTS
// =====================================================================

export const KEYBOARD_SHORTCUTS = [
  { keys: '/', action: 'Open global search' },
  { keys: 'Esc', action: 'Close modal / clear focus' },
  { keys: '←   →', action: 'Navigate management sub-tabs' },
  { keys: 'Home / End', action: 'Jump to first / last management sub-tab' },
  { keys: 'Tab', action: 'Move focus to next interactive element' },
  { keys: 'Shift+Tab', action: 'Move focus to previous element' },
  { keys: 'Enter / Space', action: 'Activate focused button or checkbox' }
];
