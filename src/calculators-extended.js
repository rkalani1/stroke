// Extended clinical calculators added in the P0/P1 expansion.
// Each function is pure, fully unit-testable, and carries its primary source
// citation in the function-level doc block. All inputs are permissive (strings
// from form fields); invalid input returns null.

// =====================================================================
// EVT eligibility — named calculators for late-window standard-core trials
// =====================================================================

// DAWN inclusion calculator (Nogueira et al., NEJM 2018;378:11-21)
// Window: 6-24h after last known well.
// Inclusion (any of three age/NIHSS/core-volume tiers):
//   Group A: age >=80, NIHSS >=10, core <21 mL
//   Group B: age <80, NIHSS >=10, core <31 mL
//   Group C: age <80, NIHSS >=20, core <51 mL
export const evaluateDAWN = ({ age, nihss, coreMl, timeFromLKWh }) => {
  const a = parseFloat(age);
  const n = parseFloat(nihss);
  const c = parseFloat(coreMl);
  const t = parseFloat(timeFromLKWh);
  if (![a, n, c].every(Number.isFinite)) return null;
  if (Number.isFinite(t) && (t < 6 || t > 24)) {
    return { eligible: false, tier: null, reason: `Outside DAWN window (6-24h); LKW ${t}h`, meetsImaging: false, meetsClinical: false };
  }
  let tier = null; let reason = '';
  if (a >= 80 && n >= 10 && c < 21) tier = 'A';
  else if (a < 80 && n >= 10 && c < 31) tier = 'B';
  else if (a < 80 && n >= 20 && c < 51) tier = 'C';
  else reason = `No tier met (age ${a}, NIHSS ${n}, core ${c} mL)`;
  return {
    eligible: tier !== null,
    tier,
    meetsImaging: Number.isFinite(c) && c < 51,
    meetsClinical: Number.isFinite(n) && n >= 10,
    reason: tier ? `DAWN Group ${tier} criteria met` : reason,
    window: '6-24h',
    endpointNNT: 2.8,
    source: 'Nogueira NEJM 2018;378:11-21 (NCT02142283)'
  };
};

// DEFUSE-3 inclusion calculator (Albers et al., NEJM 2018;378:708-18)
// Window: 6-16h after last known well.
// Inclusion: core <=70 mL, mismatch volume >=15 mL, mismatch ratio >=1.8.
export const evaluateDEFUSE3 = ({ coreMl, penumbraMl, timeFromLKWh, nihss, age }) => {
  const c = parseFloat(coreMl);
  const p = parseFloat(penumbraMl);
  const t = parseFloat(timeFromLKWh);
  const n = parseFloat(nihss);
  const a = parseFloat(age);
  if (![c, p].every(Number.isFinite)) return null;
  if (Number.isFinite(t) && (t < 6 || t > 16)) {
    return { eligible: false, reason: `Outside DEFUSE-3 window (6-16h); LKW ${t}h`, meetsCore: c <= 70, meetsMismatch: false };
  }
  const mismatchVolume = p - c;
  const mismatchRatio = c > 0 ? p / c : Infinity;
  const coreOk = c <= 70;
  const ratioOk = mismatchRatio >= 1.8;
  const volumeOk = mismatchVolume >= 15;
  const clinicalOk = (!Number.isFinite(n) || n >= 6) && (!Number.isFinite(a) || a >= 18);
  const eligible = coreOk && ratioOk && volumeOk && clinicalOk;
  return {
    eligible,
    meetsCore: coreOk,
    meetsMismatch: ratioOk && volumeOk,
    meetsClinical: clinicalOk,
    coreMl: c,
    penumbraMl: p,
    mismatchVolumeMl: mismatchVolume,
    mismatchRatio,
    reason: eligible
      ? 'DEFUSE-3 imaging + clinical criteria met'
      : `${!coreOk ? `Core ${c} mL > 70; ` : ''}${!ratioOk ? `Mismatch ratio ${mismatchRatio.toFixed(1)} < 1.8; ` : ''}${!volumeOk ? `Mismatch volume ${mismatchVolume.toFixed(1)} mL < 15; ` : ''}${!clinicalOk ? 'Clinical criteria unmet; ' : ''}`.trim(),
    window: '6-16h',
    endpointNNT: 3.6,
    source: 'Albers NEJM 2018;378:708-18 (NCT02586415)'
  };
};

// =====================================================================
// Minor-stroke / TIA DAPT duration
// =====================================================================

// CHANCE / POINT / THALES / CHANCE-2 / INSPIRES combined DAPT recommender.
// CHANCE (Wang NEJM 2013;369:11-19): clopidogrel+ASA x 21d for TIA/minor stroke (NIHSS <=3, ABCD2 >=4) within 24h.
// POINT (Johnston NEJM 2018;379:215-25): clopidogrel+ASA x 21d for NIHSS <=3 / ABCD2 >=4 within 12h.
// THALES (Johnston NEJM 2020;383:207-17): ticagrelor+ASA x 30d for NIHSS <=5 + atherosclerotic etiology or ABCD2 >=6, within 24h.
// CHANCE-2 (Wang NEJM 2021;385:2520-30): in CYP2C19 LOF carriers, ticagrelor+ASA superior to clopidogrel+ASA for NIHSS <=3 / ABCD2 >=4.
// INSPIRES (Gao NEJM 2023;389:2413-24, PMID 38157499): clopidogrel+ASA x 21d extended eligibility — NIHSS <=5 AND time-from-onset <=72h,
//   INCLUDING patients with symptomatic intra-/extracranial atherosclerotic stenosis >=50% (LVD). 7.3% vs 9.2% recurrent stroke (HR 0.79).
//   DAPT for high-risk TIA / minor stroke is Class 1 in the 2021 AHA/ASA secondary-prevention guideline;
//   INSPIRES extended the eligibility window/population (no 2024 AHA/ASA antiplatelet update exists).
//
// Inputs:
//   nihss            — admission NIHSS (number)
//   abcd2            — ABCD² for TIA (number)
//   strokeType       — 'tia' | 'ischemic'
//   atherosclerotic  — boolean: any atherosclerotic mechanism (carotid/intracranial)
//   lvdSymptomatic   — boolean: SYMPTOMATIC intra-/extracranial stenosis >=50% (INSPIRES qualifier)
//   cyp2c19LOF       — boolean: known *2/*3 LOF carrier (CHANCE-2)
//   ichRisk          — 'high' to suppress DAPT
//   timeFromOnsetH   — number of hours from symptom onset (default 24); INSPIRES requires <=72h
export const recommendAcuteDAPT = ({ nihss, abcd2, strokeType, atherosclerotic, lvdSymptomatic, cyp2c19LOF, ichRisk, timeFromOnsetH }) => {
  const n = parseFloat(nihss);
  const ab = parseFloat(abcd2);
  const tH = Number.isFinite(parseFloat(timeFromOnsetH)) ? parseFloat(timeFromOnsetH) : 24;
  const isTIA = strokeType === 'tia';
  const isMinor = Number.isFinite(n) && n <= 3;
  const isUpToModerate = Number.isFinite(n) && n <= 5;
  const inInspiresWindow = tH <= 72;
  const inLegacyWindow = tH <= 24;
  const highRisk = Number.isFinite(ab) && ab >= 4;
  const veryHighRisk = Number.isFinite(ab) && ab >= 6;
  const isAtherosclerotic = atherosclerotic === true || lvdSymptomatic === true;

  if (ichRisk === 'high') {
    return { regimen: 'single-antiplatelet', rationale: 'High hemorrhagic risk — DAPT not recommended.', duration: null, source: null };
  }

  // V3 — empty/invalid input guard. With no usable severity input (NIHSS for
  // ischemic stroke, or ABCD² for a TIA), the recommendation is undefined; do
  // NOT assert a conclusion ("DAPT not indicated") from non-existent input.
  // Show a neutral prompt instead. Once a valid NIHSS (or ABCD² for TIA) is
  // entered, the branches below compute normally.
  if (!Number.isFinite(n) && !Number.isFinite(ab)) {
    return {
      regimen: '—',
      rationale: 'Enter NIHSS (or ABCD² for a TIA) to assess DAPT eligibility.',
      duration: null,
      source: null
    };
  }

  // THALES: ticagrelor+ASA for moderate stroke w/ atherosclerotic etiology OR very-high-risk TIA, within 24h.
  if (((isUpToModerate && isAtherosclerotic) || veryHighRisk) && inLegacyWindow) {
    return {
      regimen: 'ticagrelor+ASA',
      duration: '30 days',
      dosing: 'Ticagrelor 180 mg load, then 90 mg BID + ASA 325 mg load then 75-100 mg daily',
      rationale: isAtherosclerotic
        ? `Atherosclerotic minor-to-moderate stroke (NIHSS ≤5) within 24h: THALES showed 17% RRR in stroke/death at 30 d. ${lvdSymptomatic ? 'Symptomatic LVD ≥50% → INSPIRES (clopi+ASA) is an alternative option (Gao NEJM 2023).' : ''}`.trim()
        : `Very-high-risk TIA (ABCD² ${ab} ≥6): escalate to ticagrelor+ASA × 30d.`,
      source: 'Johnston NEJM 2020;383:207-17 (THALES); INSPIRES NEJM 2023;389:2413-24 alternative for atherosclerotic LVD',
      class: 'Class 2a (AHA/ASA 2021 secondary prevention); atherosclerotic-LVD branch supported by INSPIRES (Gao NEJM 2023), not yet in an AHA/ASA guideline update'
    };
  }

  // INSPIRES branch: NIHSS 4-5 within 72h (extended window beyond CHANCE/POINT), or atherosclerotic LVD ≥50%.
  if (Number.isFinite(n) && n >= 4 && n <= 5 && inInspiresWindow) {
    const useTicagrelor = cyp2c19LOF === true;
    return {
      regimen: useTicagrelor ? 'ticagrelor+ASA (CYP2C19 LOF — CHANCE-2 extrapolation)' : 'clopidogrel+ASA',
      duration: '21 days',
      dosing: useTicagrelor
        ? 'Ticagrelor 180 mg load then 90 mg BID + ASA 75-100 mg daily (off-label INSPIRES extrapolation)'
        : 'Clopidogrel 300-600 mg load then 75 mg daily + ASA 75-100 mg daily',
      rationale: `INSPIRES eligibility: NIHSS ${n} (4-5) within ${tH}h (≤72h). DAPT × 21d reduces 90-d stroke recurrence (HR 0.79). ${lvdSymptomatic ? 'Includes symptomatic LVD ≥50% per INSPIRES.' : ''}`.trim(),
      source: 'Gao NEJM 2023;389:2413-24 (INSPIRES, PMID 38157499); CYP2C19 branch CHANCE-2 NEJM 2021',
      class: 'INSPIRES-supported (Gao NEJM 2023); DAPT for high-risk TIA/minor stroke is Class 1 in the 2021 AHA/ASA secondary-prevention guideline (no 2024 AHA/ASA antiplatelet update exists)'
    };
  }

  // CHANCE/POINT classic branch: high-risk TIA or NIHSS ≤3, within 24h (POINT was 12h; CHANCE was 24h).
  if (((isTIA && highRisk) || isMinor) && inLegacyWindow) {
    const useTicagrelor = cyp2c19LOF === true;
    return {
      regimen: useTicagrelor ? 'ticagrelor+ASA (CHANCE-2)' : 'clopidogrel+ASA',
      duration: '21 days',
      dosing: useTicagrelor
        ? 'Ticagrelor 180 mg load then 90 mg BID + ASA 75-100 mg daily'
        : 'Clopidogrel 300-600 mg load then 75 mg daily + ASA 75-100 mg daily',
      rationale: useTicagrelor
        ? 'Known CYP2C19 LOF carrier — CHANCE-2 showed ticagrelor+ASA superior to clopidogrel+ASA.'
        : `${isTIA ? `High-risk TIA (ABCD² ${ab} ≥4)` : `Minor stroke (NIHSS ${n} ≤3)`} within ${tH}h: CHANCE/POINT showed reduced 90-d stroke risk. Truncate DAPT at 21 d to minimize bleeding.`,
      source: useTicagrelor ? 'Wang NEJM 2021;385:2520-30 (CHANCE-2)' : 'Wang NEJM 2013;369:11-19 (CHANCE); Johnston NEJM 2018;379:215-25 (POINT)',
      class: 'Class 1 (AHA/ASA 2021 secondary prevention)'
    };
  }

  // Fall-throughs that signal "missed-window" or "above-threshold"
  if (((isTIA && highRisk) || isMinor || (Number.isFinite(n) && n <= 5)) && tH > 72) {
    return {
      regimen: 'single-antiplatelet',
      duration: 'long-term',
      dosing: 'ASA 81 mg daily OR clopidogrel 75 mg daily',
      rationale: `Outside DAPT initiation window (${tH}h > 72h). INSPIRES/CHANCE/POINT eligibility closed; transition to single antiplatelet for long-term secondary prevention.`,
      source: 'Kleindorfer AHA/ASA Stroke 2021; INSPIRES 2023 window guidance',
      class: 'Class 1'
    };
  }

  return {
    regimen: 'single-antiplatelet',
    duration: 'long-term',
    dosing: 'ASA 81 mg daily OR clopidogrel 75 mg daily',
    rationale: `${isTIA ? 'Low-risk TIA' : `NIHSS ${Number.isFinite(n) ? n : '?'} above DAPT inclusion (>5)`} — DAPT not indicated; single antiplatelet per secondary-prevention guidelines.`,
    source: 'Kleindorfer AHA/ASA Stroke 2021',
    class: 'Class 1'
  };
};

// =====================================================================
// Recurrent-stroke risk scores used in clinic
// =====================================================================

// ESSEN stroke risk score (Diener, Lancet Neurol 2009)
// Points: age 65-74 = 1, age ≥75 = 2, HTN = 1, DM = 1, prior MI = 1, other CV disease = 1,
//         PAD = 1, current smoker = 1, prior TIA/stroke = 1. Max 9.
// >=3 = high annual recurrent-stroke risk (≈4%/yr vs 2%/yr overall).
export const calculateESSEN = ({ age, hypertension, diabetes, priorMI, otherCV, pad, smoker, priorTIA }) => {
  let score = 0;
  const a = parseFloat(age);
  if (Number.isFinite(a)) {
    // Published brackets: 65-75 = 1 point, >75 = 2 points — age exactly 75
    // falls in the 65-75 bracket (Weimar Stroke 2009, PMID 19023098).
    if (a > 75) score += 2; else if (a >= 65) score += 1;
  }
  if (hypertension) score += 1;
  if (diabetes) score += 1;
  if (priorMI) score += 1;
  if (otherCV) score += 1;
  if (pad) score += 1;
  if (smoker) score += 1;
  if (priorTIA) score += 1;
  return {
    score,
    risk: score >= 3 ? 'high' : score >= 2 ? 'moderate' : 'low',
    annualRecurrence: score >= 3 ? '~4%/yr' : score >= 2 ? '~2-3%/yr' : '~1-2%/yr',
    source: 'Diener Lancet Neurol 2009'
  };
};

// SPI-II (Kernan WN et al., Stroke 2000;31:456-62; PMID 10657422)
// Seven items, total 0-15: CHF = 3; diabetes = 3; prior stroke = 3;
// age >70 = 2; stroke (not TIA) as the index event = 2; hypertension = 1;
// coronary artery disease = 1.
// Risk groups (pooled 2-year stroke-or-death across 3 validation cohorts):
// Group I = 0-3 (10%), Group II = 4-7 (19%), Group III = 8-15 (31%).
export const calculateSPI2 = ({ age, hypertension, diabetes, cad, priorStroke, chf, indexEventStroke }) => {
  let score = 0;
  const a = parseFloat(age);
  if (chf) score += 3;
  if (diabetes) score += 3;
  if (priorStroke) score += 3;
  if (Number.isFinite(a) && a > 70) score += 2;
  if (indexEventStroke) score += 2; // index event is stroke (not TIA)
  if (hypertension) score += 1;
  if (cad) score += 1;
  return {
    score,
    tier: score <= 3 ? 'low' : score <= 7 ? 'moderate' : 'high',
    riskGroup: score <= 3 ? 'I' : score <= 7 ? 'II' : 'III',
    twoYearRisk: score <= 3 ? '10%' : score <= 7 ? '19%' : '31%',
    outcome: 'stroke or death within 2 years (TIA or nondisabling ischemic stroke cohort)',
    source: 'Kernan WN et al. Stroke 2000;31:456-62 (SPI-II, PMID 10657422)'
  };
};

// =====================================================================
// ICH expansion scores
// =====================================================================

// BAT score (Morotti A et al., Stroke 2018;49:1163-1169; PMID 29669875)
// Blend sign on NCCT: +1; Any intrahematoma hypodensity: +2; Timing of NCCT
// from onset <2.5 h: +2. Range 0-5. Published dichotomization: BAT ≥3
// predicts hematoma expansion with sensitivity 0.50 and specificity 0.89
// (c-statistic 0.77 development; 0.65/0.70 in validation cohorts).
export const calculateBAT = ({ blendSign, hypodensity, timeToCTHours }) => {
  let score = 0;
  const t = parseFloat(timeToCTHours);
  if (blendSign) score += 1;
  if (hypodensity) score += 2;
  if (Number.isFinite(t) && t < 2.5) score += 2;
  return {
    score,
    risk: score >= 3 ? 'high' : 'low',
    threshold: 'BAT ≥3 = high expansion risk (sensitivity 0.50, specificity 0.89)',
    source: 'Morotti A et al. Stroke 2018;49:1163-1169 (BAT score, PMID 29669875)'
  };
};

// BRAIN score (Wang X et al., Stroke 2015;46:376-381; PMID 25503550).
// Predicts clinically significant (≥6 mL) hematoma expansion at 24 h. Derived in
// INTERACT2 (n=964), validated in INTERACT1 (n=346); C-statistic 0.73. Range 0-24.
//   B = Baseline ICH volume: ≤10 mL = 0, 10-20 = 5, >20 = 7
//   R = Recurrent ICH: 4
//   A = Anticoagulation (warfarin) at onset: 6
//   I = Intraventricular haemorrhage: 2
//   N = Number of hours onset→baseline CT: ≤1 = 5, 1-2 = 4, 2-3 = 3, 3-4 = 2, 4-5 = 1, >5 = 0
// Predicted probability of growth ranges 3.4% (0 pts) to 85.8% (24 pts).
export const calculateBRAIN = ({ volumeMl, recurrentICH, anticoagulated, ivh, onsetToCTHours }) => {
  let score = 0;
  const v = parseFloat(volumeMl);
  const t = parseFloat(onsetToCTHours);
  if (Number.isFinite(v)) score += v <= 10 ? 0 : (v <= 20 ? 5 : 7);
  if (recurrentICH) score += 4;
  if (anticoagulated) score += 6;
  if (ivh) score += 2;
  if (Number.isFinite(t)) {
    if (t <= 1) score += 5;
    else if (t <= 2) score += 4;
    else if (t <= 3) score += 3;
    else if (t <= 4) score += 2;
    else if (t <= 5) score += 1;
    // >5 h = 0 points
  }
  return {
    score,
    // Coarse label over the 0-24 range (source reports a continuous probability,
    // not named bands): low <8, moderate 8-15, high >15.
    risk: score > 15 ? 'high' : score >= 8 ? 'moderate' : 'low',
    expansionNote: 'Predicts ≥6 mL hematoma growth at 24 h; probability rises from ~3.4% (0 pts) to ~85.8% (24 pts)',
    source: 'Wang X et al. Stroke 2015;46:376-381 (BRAIN score; PMID 25503550)'
  };
};

// Nine-point (Brouwers) ICH hematoma-expansion prediction score
// (Brouwers HB et al., JAMA Neurol 2014;71:158-64; PMID 24366060)
// Warfarin use: yes = 2. Time from symptom onset to initial CT: ≤6 h = 2.
// CTA spot sign: present = 3, CTA unavailable = 1, absent = 0.
// Baseline ICH volume: <30 mL = 0, 30-60 mL = 1, >60 mL = 2. Max 9.
// Risk strata: 0 = low (5.7% expansion), 1-3 = medium (12.4%), 4-9 = high
// (36.4%; 80% at score 9). Expansion = >6 mL or >33% growth.
export const calculateNinePoint = ({ warfarin, spotSign, volumeMl, onsetToCTHours }) => {
  let score = 0;
  const v = parseFloat(volumeMl);
  const t = parseFloat(onsetToCTHours);
  if (warfarin) score += 2;
  if (Number.isFinite(t) && t <= 6) score += 2;
  // spotSign is tri-state: true = present (3), false = absent (0),
  // 'unavailable' / undefined / null = no baseline CTA performed (1).
  if (spotSign === true) score += 3;
  else if (spotSign !== false) score += 1;
  if (Number.isFinite(v)) {
    if (v > 60) score += 2;
    else if (v >= 30) score += 1;
  }
  return {
    score,
    risk: score >= 4 ? 'high' : score >= 1 ? 'medium' : 'low',
    expansionIncidence: score >= 4 ? '36.4% (80% at score 9)' : score >= 1 ? '12.4%' : '5.7%',
    source: 'Brouwers HB et al. JAMA Neurol 2014;71:158-64 (9-point expansion score, PMID 24366060)'
  };
};

// =====================================================================
// SAH / DCI scores
// =====================================================================

// VASOGRADE (de Oliveira Manoel Stroke 2015;46:1826-31; PMID 25977276)
// Green: mFisher 1-2 AND WFNS 1-2; Yellow: mFisher 3-4 AND WFNS 1-3;
// Red: WFNS 4-5 (any mFisher). WFNS 3 + mFisher 1-2 satisfies NONE of the
// published categories — a recognized gap in the original scheme — and is
// returned as 'Unclassified' rather than silently coerced to Yellow.
export const calculateVASOGRADE = ({ wfns, modifiedFisher }) => {
  const w = parseFloat(wfns);
  const m = parseFloat(modifiedFisher);
  if (!Number.isFinite(w) || !Number.isFinite(m)) return null;
  let grade; let risk;
  if (w >= 4) { grade = 'Red'; risk = 'high'; }
  else if (w <= 2 && m <= 2) { grade = 'Green'; risk = 'low'; }
  else if (w <= 3 && m >= 3) { grade = 'Yellow'; risk = 'moderate'; }
  else {
    grade = 'Unclassified';
    risk = 'indeterminate';
    return { grade, risk, note: 'WFNS 3 with modified Fisher 1-2 is not classified by the published VASOGRADE definitions — use clinical judgment and full DCI risk assessment.', source: 'de Oliveira Manoel Stroke 2015;46:1826-31 (PMID 25977276)' };
  }
  return { grade, risk, source: 'de Oliveira Manoel Stroke 2015;46:1826-31 (PMID 25977276)' };
};

// Ogilvy-Carter grading for aneurysmal SAH (0-5)
// (Ogilvy CS, Carter BS. Neurosurgery 1998;42:959-68; PMID 9588539)
// Factors, 1 point each: age >50; Hunt-Hess IV-V; Fisher 3-4; aneurysm size
// >10 mm; GIANT (≥25 mm) POSTERIOR-circulation lesion (both conditions
// combined — not either alone; the >10 mm size point is separate).
export const calculateOgilvyCarter = ({ age, huntHess, fisher, size, giantPosterior, posteriorCirculation }) => {
  const a = parseFloat(age);
  const hh = parseFloat(huntHess);
  const f = parseFloat(fisher);
  const sz = parseFloat(size);
  let score = 0;
  if (Number.isFinite(a) && a > 50) score += 1;
  if (Number.isFinite(hh) && hh >= 4) score += 1;
  if (Number.isFinite(f) && f >= 3) score += 1;
  if (Number.isFinite(sz) && sz > 10) score += 1;
  // Accept either an explicit combined flag, or derive it from size ≥25 mm
  // plus a posterior-circulation flag.
  const isGiantPosterior = giantPosterior === true || (posteriorCirculation === true && Number.isFinite(sz) && sz >= 25);
  if (isGiantPosterior) score += 1;
  return { score, source: 'Ogilvy CS, Carter BS. Neurosurgery 1998;42:959-68 (PMID 9588539)' };
};

// =====================================================================
// Cognitive / mood screens (clinic)
// =====================================================================

// PHQ-9 interpretation
export const interpretPHQ9 = (score) => {
  const s = parseFloat(score);
  if (!Number.isFinite(s) || s < 0 || s > 27) return null;
  let severity, action;
  if (s <= 4) { severity = 'none'; action = 'No treatment needed; monitor.'; }
  else if (s <= 9) { severity = 'mild'; action = 'Watchful waiting; repeat PHQ-9 at follow-up.'; }
  else if (s <= 14) { severity = 'moderate'; action = 'Consider treatment (psychotherapy and/or SSRI; sertraline 50 mg daily is first-line in post-stroke depression).'; }
  else if (s <= 19) { severity = 'moderately-severe'; action = 'Active treatment with pharmacotherapy and psychotherapy.'; }
  else { severity = 'severe'; action = 'Immediate initiation of antidepressant and/or psychotherapy; assess for suicidality.'; }
  return { score: s, severity, action, source: 'Kroenke JGIM 2001;16:606-13' };
};

// mRS-9Q structured interpretation (Bruno Stroke 2010;41:1048-50).
// Order matches the published mRS scale:
//   mRS 5 = bedridden / requires constant care
//   mRS 4 = unable to walk without assistance (q4 cannot walk OR q5 walks only with aid)
//   mRS 3 = walks unaided BUT needs some help with bowel/bladder or self-care
//   mRS 2 = independent in ADLs but cannot resume all previous work / chores / hobbies
//   mRS 1 = symptoms present but able to carry out all usual duties
//   mRS 0 = no symptoms
// Earlier implementation incorrectly mapped q5WalkingUnaided=false to mRS 3 even
// though the mRS 3 description requires walking unassisted — fixed in v5.33.0.
export const interpretMRS9Q = ({ q1Symptoms, q2BowelBladder, q3Dressing, q4Walking, q5WalkingUnaided, q6Work, q7Chores, q8Hobbies, q9NeedsHelp }) => {
  if (q9NeedsHelp === 'bedridden') return { mrs: 5, description: 'Severe disability: bedridden, requires constant nursing care.' };
  if (q9NeedsHelp === 'constant') return { mrs: 4, description: 'Moderately severe disability: unable to walk unaided and unable to attend to own bodily needs.' };
  // mRS 4 — cannot walk without assistance (regardless of bowel/bladder or dressing status).
  if (q4Walking === false || q5WalkingUnaided === false) {
    return { mrs: 4, description: 'Moderately severe disability: unable to walk without assistance; requires help with most ADLs.' };
  }
  // mRS 3 — walks unaided but needs some help (bowel/bladder, dressing, etc.).
  if (q2BowelBladder === true || q3Dressing === true) {
    return { mrs: 3, description: 'Moderate disability: requires some help (bowel/bladder or dressing) but able to walk unassisted.' };
  }
  if (q6Work === false || q7Chores === false || q8Hobbies === false) return { mrs: 2, description: 'Slight disability: unable to carry out all previous activities but able to look after own affairs without assistance.' };
  if (q1Symptoms === true) return { mrs: 1, description: 'No significant disability despite symptoms: able to carry out all usual duties.' };
  return { mrs: 0, description: 'No symptoms at all.' };
};

// =====================================================================
// Carotid and PFO
// =====================================================================

// NASCET stenosis percentage (residual diameter at stenosis, distal normal ICA diameter)
export const calculateNASCET = ({ stenosisDiameterMm, distalICADiameterMm }) => {
  const s = parseFloat(stenosisDiameterMm);
  const d = parseFloat(distalICADiameterMm);
  if (!Number.isFinite(s) || !Number.isFinite(d) || d <= 0) return null;
  const pct = Math.round((1 - s / d) * 100);
  return {
    percent: pct,
    tier: pct >= 70 ? 'severe' : pct >= 50 ? 'moderate' : 'mild',
    revasc: pct >= 70
      ? 'CEA highly effective (NASCET NNT=5 at 2y). Timing: within 2 weeks for maximum benefit.'
      : pct >= 50
        ? 'CEA benefit modest (NNT ~20) and limited to men with recent symptoms. Individualized decision.'
        : 'Medical management (no surgical benefit demonstrated).',
    source: 'NASCET NEJM 1991/1998'
  };
};

// CHA2DS2-VA (2024 ESC update — dropped sex)
export const calculateCHADS2VA = ({ chf, hypertension, age, diabetes, strokeTia, vascular }) => {
  let score = 0;
  const a = parseFloat(age);
  if (chf) score += 1;
  if (hypertension) score += 1;
  if (Number.isFinite(a)) { if (a >= 75) score += 2; else if (a >= 65) score += 1; }
  if (diabetes) score += 1;
  if (strokeTia) score += 2;
  if (vascular) score += 1;
  return {
    score,
    anticoagulate: score >= 2 ? 'recommended' : score === 1 ? 'consider' : 'not indicated by score alone',
    source: 'ESC 2024 AF guideline (van Gelder, Eur Heart J 2024)'
  };
};

// =====================================================================
// HAVOC — AF detection risk after cryptogenic stroke/TIA
// =====================================================================
// Kwong et al., Cardiology 2017 (PMID 28654919).
// HTN 2, age ≥75 2, valvular disease 2, peripheral vascular disease 1,
// obesity 1, CHF 4, CAD 2. Risk bands: low 0-4, medium 5-9, high 10-14.
export const calculateHAVOC = ({ hypertension, age, valvularDisease, peripheralVascularDisease, obesity, heartFailure, coronaryArteryDisease }) => {
  let score = 0;
  const a = parseFloat(age);
  if (hypertension) score += 2;
  if (Number.isFinite(a) && a >= 75) score += 2;
  if (valvularDisease) score += 2;
  if (peripheralVascularDisease) score += 1;
  if (obesity) score += 1;
  if (heartFailure) score += 4;
  if (coronaryArteryDisease) score += 2;
  const riskBand = score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low';
  return {
    score,
    riskBand,
    monitoringStrategy: riskBand === 'high'
      ? 'High HAVOC risk: prolonged rhythm monitoring; consider implantable cardiac monitor when external monitoring is negative or rapid ICM access is available.'
      : riskBand === 'medium'
        ? 'Medium HAVOC risk: at least 30-day external monitoring; escalate to ICM when suspicion remains high or monitoring is unrevealing.'
        : 'Low HAVOC risk: standard telemetry plus outpatient monitoring guided by cryptogenic/ESUS mechanism and clinical suspicion.',
    source: 'HAVOC score, Kwong et al. Cardiology 2017 (PMID 28654919)'
  };
};

// =====================================================================
// Post-stroke driving / return-to-activity (heuristic — not a validated score)
// =====================================================================
export const recommendDriving = ({ strokeType, severity, cognitiveDeficit, visualField, motorDeficit, seizure }) => {
  const blockers = [];
  if (seizure) blockers.push('Post-stroke seizure within past 6 months');
  if (cognitiveDeficit) blockers.push('Persistent cognitive deficit (MoCA <26 or attention/executive deficit)');
  if (visualField) blockers.push('Visual field cut (hemianopia or quadrantanopia)');
  if (motorDeficit === 'severe') blockers.push('Severe motor deficit of dominant hand or either leg');
  const waitWeeks = strokeType === 'tia' ? 2 : severity === 'minor' ? 4 : 8;
  return {
    mayDrive: blockers.length === 0,
    blockers,
    minWait: `${waitWeeks} weeks minimum`,
    guidance: blockers.length === 0
      ? `Patient may resume driving after minimum ${waitWeeks}-week observation if symptom-free. Recommend formal driving evaluation for any residual deficit or commercial drivers.`
      : `Driving NOT recommended until: ${blockers.join('; ')}. Refer to rehabilitation medicine / occupational therapy for formal driving evaluation.`,
    commercialDriver: 'Commercial drivers (CDL) must meet FMCSA criteria: minimum 1-year seizure-free off AED, no residual deficit compromising driving safety.',
    source: 'AAN practice parameter (Neurology 2007); AHA/ASA secondary prevention 2021'
  };
};

// =====================================================================
// Dysphagia screens (simple decision logic)
// =====================================================================
export const interpretBarnesJewishDysphagia = ({ gcs15, canSitUpright, lowerFacialAsymmetry, tongueAsymmetry, palatalAsymmetry, throatClearing, coughOnWater3oz, voiceChange }) => {
  if (!gcs15) return { pass: false, reason: 'GCS <15 — NPO, defer screen', action: 'Strict NPO; SLP consult when GCS 15.' };
  if (!canSitUpright) return { pass: false, reason: 'Unable to sit upright', action: 'Strict NPO; reassess when mobility allows.' };
  if (lowerFacialAsymmetry || tongueAsymmetry || palatalAsymmetry) return { pass: false, reason: 'Lower facial, tongue, or palatal asymmetry/weakness — stop screen before any water is given', action: 'Patient fails: keep NPO including medications (arrange non-oral medication routes with pharmacy); order speech pathology evaluation; notify the primary team the patient remains NPO.' };
  if (throatClearing || coughOnWater3oz || voiceChange) return { pass: false, reason: 'Throat clearing, cough, and/or vocal quality change immediately after and for 1 minute following the 3-oz sequential-drink water swallow', action: 'Keep NPO including medications (arrange non-oral medication routes with pharmacy); order speech pathology evaluation; notify the primary team the patient remains NPO.' };
  return { pass: true, reason: 'Screen passed', action: 'Place patient on an appropriate diet; notify the primary team to order any needed oral medications.' };
};

// =====================================================================
// VTE prophylaxis timing (CLOTS-3 / AHA-ASA 2022 ICH)
// =====================================================================
export const recommendVTEProphylaxis = ({ diagnosis, days, hematomaStable, immobile }) => {
  if (diagnosis === 'ich') {
    if (days < 1) return { modality: 'mechanical (IPC) only', agent: 'Sequential compression devices', rationale: 'Day 0-1 ICH: IPC reduces DVT (CLOTS-3 Lancet 2013).' };
    if (days >= 1 && days <= 4 && hematomaStable) return { modality: 'chemical + mechanical', agent: 'Enoxaparin 40 mg SC daily (or UFH 5000 U BID) + IPC', rationale: 'Day 2-4 ICH with stable imaging: chemical VTE ppx is Class 2b, LOE B-R per AHA/ASA 2022 ICH.' };
    if (!hematomaStable) return { modality: 'mechanical only', agent: 'IPC', rationale: 'Unstable hematoma — defer chemical ppx; re-image and reassess.' };
  }
  if (diagnosis === 'ischemic' && immobile) return { modality: 'chemical ± mechanical', agent: 'Enoxaparin 40 mg SC daily (or UFH 5000 U TID) + IPC when possible', rationale: 'Ischemic stroke with immobility: chemical VTE ppx from admission (Class 1, AHA/ASA 2019).' };
  if (diagnosis === 'sah') return { modality: 'mechanical until secured, then chemical 24h post-securing', agent: 'IPC, then enoxaparin 40 mg SC daily 24h after clip/coil if no bleeding', rationale: 'AHA/ASA aSAH 2023: mechanical ppx initially; chemical ppx 24h post-aneurysm securing.' };
  return { modality: 'ambulate', agent: 'None required', rationale: 'Ambulatory patient; no VTE ppx needed.' };
};

// =====================================================================
// Post-stroke neurocheck timer schedule (post-tPA)
// =====================================================================
// AHA/ASA: q15 min x 2h → q30 min x 6h → q1h x 16h after tPA.
export const computeNeurocheckSchedule = (tpaGivenIsoTime) => {
  if (!tpaGivenIsoTime) return null;
  const start = new Date(tpaGivenIsoTime);
  if (Number.isNaN(start.getTime())) return null;
  const checks = [];
  for (let i = 1; i <= 8; i += 1) checks.push({ label: `q15 check #${i}`, at: new Date(start.getTime() + i * 15 * 60 * 1000) });
  for (let i = 1; i <= 12; i += 1) checks.push({ label: `q30 check #${i}`, at: new Date(start.getTime() + (2 * 60 + i * 30) * 60 * 1000) });
  for (let i = 1; i <= 16; i += 1) checks.push({ label: `q1h check #${i}`, at: new Date(start.getTime() + (8 * 60 + i * 60) * 60 * 1000) });
  return { start, checks, end: checks[checks.length - 1].at };
};

// =====================================================================
// LKW countdown (for hub-and-spoke time-to-decision display)
// =====================================================================
export const computeLKWCountdown = (lkwIso, nowMs = Date.now()) => {
  if (!lkwIso) return null;
  const lkw = new Date(lkwIso).getTime();
  if (Number.isNaN(lkw)) return null;
  const elapsedMs = nowMs - lkw;
  const toLyticMs = (4.5 * 3600 * 1000) - elapsedMs;
  const toLateEvtMs = (24 * 3600 * 1000) - elapsedMs;
  const fmt = (ms) => {
    if (ms <= 0) return 'closed';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  return {
    elapsedMinutes: Math.floor(elapsedMs / 60000),
    toLytic: fmt(toLyticMs),
    toLyticClosed: toLyticMs <= 0,
    toLateEvt: fmt(toLateEvtMs),
    toLateEvtClosed: toLateEvtMs <= 0,
    toLyticMs,
    toLateEvtMs
  };
};

// =====================================================================
// Large-core EVT eligibility (ASPECTS 0-5 expanded window)
// =====================================================================
// Synthesis of:
//   RESCUE-Japan LIMIT (Yoshimura NEJM 2022;386:1303-13, PMID 35138767) — ASPECTS 3-5, ≤6h.
//   SELECT-2 (Sarraj NEJM 2023;388:1259-71, PMID 36762865) — ASPECTS 3-5 or core ≥50 mL, ≤24h. cOR 1.51.
//   ANGEL-ASPECT (Huo NEJM 2023;388:1272-83, PMID 36762852) — ASPECTS 3-5 or core 70-100 mL, ≤24h. mRS 0-3 30% vs 12%.
//   TENSION (Bendszus Lancet 2023;402:1753-63, PMID 37837989) — ASPECTS 3-5, ≤12h. cOR 2.58.
//   TESLA (Yoo JAMA 2024;332:1355-66, PMID 39374319) — ASPECTS 2-5 NCCT-only, ≤24h. Bayesian primary missed; trend favorable.
//   LASTE (Costalat NEJM 2024;390:1677-89, PMID 38718358) — ASPECTS 0-5 (incl 0-2), ≤6.5h. mRS 0-3 31% vs 12.5%, mortality 36% vs 55%.
// AHA/ASA 2024: Class IIa for ASPECTS 3-5 within 24h. SVIN 2025 Large-Core guideline endorses.
//
// Inputs:
//   age           — number
//   nihss         — number (most trials required NIHSS ≥6)
//   aspects       — 0-10 (NCCT) or null if CTP/MRI core used instead
//   coreMl        — CTP rCBF<30% or DWI core volume in mL (optional)
//   timeFromLKWh  — hours from last known well
//   premorbidMRS  — modified Rankin pre-stroke (most trials excluded mRS ≥3 except LASTE allowed up to 4)
//   lvoLocation   — 'ICA' | 'M1' | 'M2-prox' | other
export const evaluateLargeCoreEVT = ({ age, nihss, aspects, coreMl, timeFromLKWh, premorbidMRS, lvoLocation }) => {
  const a = parseFloat(age);
  const n = parseFloat(nihss);
  const asp = parseFloat(aspects);
  const c = parseFloat(coreMl);
  const t = parseFloat(timeFromLKWh);
  const pm = parseFloat(premorbidMRS);

  if (!Number.isFinite(t)) return null;

  const trial = [];
  let eligible = false;
  let bestMatch = null;
  const reasons = [];

  // Age gate (most trials 18-85; SELECT-2/ANGEL allowed up to 85)
  const ageOk = !Number.isFinite(a) || (a >= 18 && a <= 85);
  if (!ageOk) reasons.push(`Age ${a} outside 18-85`);

  // NIHSS gate (most trials required ≥6, ANGEL-ASPECT ≥6, SELECT-2 ≥6, TENSION ≥6, LASTE ≥6)
  const nihssOk = !Number.isFinite(n) || n >= 6;
  if (!nihssOk) reasons.push(`NIHSS ${n} <6 (below trial thresholds)`);

  // Premorbid mRS (most ≤2 except LASTE allowed ≤4)
  const pmOk = !Number.isFinite(pm) || pm <= 2;

  // ASPECTS / core volume tiers
  const aspects35 = Number.isFinite(asp) && asp >= 3 && asp <= 5;
  const aspects02 = Number.isFinite(asp) && asp >= 0 && asp <= 2;
  const core50_70 = Number.isFinite(c) && c >= 50 && c < 70;
  const core70_100 = Number.isFinite(c) && c >= 70 && c <= 100;
  const coreGT100 = Number.isFinite(c) && c > 100;

  // LASTE — ASPECTS 0-2 within 6.5h
  if (aspects02 && t <= 6.5 && nihssOk && ageOk && pmOk) {
    trial.push('LASTE'); bestMatch = 'LASTE'; eligible = true;
  }
  // RESCUE-Japan LIMIT — ASPECTS 3-5, ≤6h
  if (aspects35 && t <= 6 && nihssOk && ageOk && pmOk) {
    trial.push('RESCUE-Japan LIMIT'); bestMatch = bestMatch || 'RESCUE-Japan LIMIT'; eligible = true;
  }
  // TENSION — ASPECTS 3-5, ≤12h
  if (aspects35 && t <= 12 && nihssOk && ageOk && pmOk) {
    trial.push('TENSION'); bestMatch = bestMatch || 'TENSION'; eligible = true;
  }
  // SELECT-2 — ASPECTS 3-5 OR core ≥50, ≤24h
  if ((aspects35 || (Number.isFinite(c) && c >= 50)) && t <= 24 && nihssOk && ageOk && pmOk) {
    trial.push('SELECT-2'); bestMatch = bestMatch || 'SELECT-2'; eligible = true;
  }
  // ANGEL-ASPECT — ASPECTS 3-5 OR core 70-100, ≤24h
  if ((aspects35 || core70_100) && t <= 24 && nihssOk && ageOk && pmOk) {
    trial.push('ANGEL-ASPECT'); bestMatch = bestMatch || 'ANGEL-ASPECT'; eligible = true;
  }
  // TESLA — ASPECTS 2-5 NCCT, ≤24h (note: primary missed Bayesian threshold, trend favorable)
  if (Number.isFinite(asp) && asp >= 2 && asp <= 5 && t <= 24 && nihssOk && ageOk && pmOk) {
    trial.push('TESLA'); bestMatch = bestMatch || 'TESLA';
  }

  if (coreGT100) reasons.push(`Core volume ${c} mL >100 (above trial-supported range)`);

  // SELECT-2 had no explicit upper bound but was powered with median core ~80 mL;
  // core >100 mL is extrapolation. Surface the safety nuance in the rationale
  // (the eligible-branch was previously silent — `reasons` only printed in not-eligible).
  const beyondTrialRange = eligible && coreGT100;

  return {
    eligible,
    bestMatch,
    matchingTrials: trial,
    beyondTrialRange,
    aspects: Number.isFinite(asp) ? asp : null,
    coreMl: Number.isFinite(c) ? c : null,
    nihss: Number.isFinite(n) ? n : null,
    timeFromLKWh: t,
    rationale: eligible
      ? `Patient meets ${bestMatch} criteria (and ${trial.length > 1 ? trial.slice(1).join(', ') + ' also met' : 'no other trials'}). ASPECTS ${asp ?? '-'}, core ${c ?? '-'} mL, NIHSS ${n ?? '-'}, ${t}h from LKW. Counsel re: sICH risk (~6-7% in large-core trials, vs ~3% standard EVT).${beyondTrialRange ? ` ⚠ Core volume ${c} mL exceeds the ~100 mL upper end of trial-supported range — benefit is extrapolation; document shared decision-making and futility considerations.` : ''}`
      : `Not currently meeting large-core EVT trial criteria. ${reasons.length ? reasons.join('; ') : 'Verify ASPECTS/core, NIHSS, timing, premorbid mRS.'}`,
    sichCounseling: 'Large-core EVT trials reported sICH 6-7% (vs ~3% standard EVT) and futility-adjusted mortality benefit (LASTE 36% vs 55%). Discuss with family.',
    guidelineClass: 'AHA/ASA 2024: Class IIa for ASPECTS 3-5 within 24h; SVIN 2025 endorses LASTE for ASPECTS 0-2 ≤6h.',
    sources: 'NEJM 2022 (LIMIT, PMID 35138767); NEJM 2023 (SELECT-2 36762865; ANGEL-ASPECT 36762852); Lancet 2023 (TENSION 37837989); JAMA 2024 (TESLA, PMID 39374319); NEJM 2024 (LASTE 38718358)'
  };
};

// =====================================================================
// Late-window IV thrombolysis (TNK 4.5-24h LVO with mismatch, no EVT available)
// =====================================================================
// TRACE-III (Xiong NEJM 2024;391:203-12, PMID 38884324): Phase 3 RCT, n=516, China.
//   Inclusion: AIS with anterior LVO (ICA/M1), 4.5-24h from LKW, perfusion mismatch
//   (core <70 mL, mismatch ratio ≥1.8 OR mismatch volume ≥15 mL), NIHSS 6-25, age 18-80,
//   NO planned EVT (most spokes don't have it). TNK 0.25 mg/kg (max 25 mg) vs standard care.
//   Result: mRS 0-1 at 90d 33.0% vs 24.2% (RR 1.37). sICH 3.0% vs 0.8%.
// TIMELESS (NEJM 2024, PMID 38329148) was negative when most patients got EVT —
//   TRACE-III applies specifically to patients who CAN'T get EVT.
//
// Inputs:
//   timeFromLKWh — hours from LKW
//   evtAvailable — boolean: is mechanical thrombectomy available within reasonable transfer window?
//   lvo          — boolean: anterior LVO (ICA terminus or M1)
//   nihss        — number
//   age          — number
//   coreMl       — number, core volume (CTP rCBF<30% or DWI)
//   mismatchRatio — penumbra/core ratio
//   mismatchVolumeMl — penumbra - core
export const recommendLateWindowLytic = ({ timeFromLKWh, evtAvailable, lvo, nihss, age, coreMl, mismatchRatio, mismatchVolumeMl }) => {
  const t = parseFloat(timeFromLKWh);
  const n = parseFloat(nihss);
  const a = parseFloat(age);
  const c = parseFloat(coreMl);
  const r = parseFloat(mismatchRatio);
  const v = parseFloat(mismatchVolumeMl);

  if (!Number.isFinite(t)) return null;
  if (t <= 4.5) return { eligible: false, reason: 'Standard 0-4.5h window — use routine TNK 0.25 mg/kg (max 25 mg).', source: 'AHA/ASA 2026 AIS guideline' };
  if (t > 24) return { eligible: false, reason: 'Beyond 24h — outside any thrombolysis evidence.', source: null };
  if (lvo !== true) return { eligible: false, reason: 'TRACE-III enrolled only anterior LVO (ICA/M1). Non-LVO late-window IV lysis not supported by trial evidence.', source: 'TRACE-III NEJM 2024;391:203-12' };
  if (evtAvailable === true) return { eligible: false, reason: 'EVT is available — proceed to thrombectomy. TRACE-III applies only when EVT cannot be performed; TIMELESS was negative when most patients got EVT.', source: 'Xiong NEJM 2024 (TRACE-III); Albers NEJM 2024 (TIMELESS, PMID 38329148)' };

  const ageOk = !Number.isFinite(a) || (a >= 18 && a <= 80);
  const nihssOk = !Number.isFinite(n) || (n >= 6 && n <= 25);
  const coreOk = !Number.isFinite(c) || c < 70;
  const mismatchOk = (Number.isFinite(r) && r >= 1.8) || (Number.isFinite(v) && v >= 15) || (!Number.isFinite(r) && !Number.isFinite(v));
  const mismatchKnown = Number.isFinite(r) || Number.isFinite(v);

  const blockers = [];
  if (!ageOk) blockers.push(`Age ${a} outside 18-80`);
  if (!nihssOk) blockers.push(`NIHSS ${n} outside 6-25 (TRACE-III range)`);
  if (!coreOk) blockers.push(`Core ${c} mL ≥70 (TRACE-III excluded)`);
  if (!mismatchOk) blockers.push(`Mismatch insufficient (ratio ${r} <1.8 AND volume ${v} <15 mL)`);

  const eligible = blockers.length === 0 && mismatchKnown;

  return {
    eligible,
    regimen: eligible ? 'Tenecteplase 0.25 mg/kg IV bolus (max 25 mg)' : null,
    rationale: eligible
      ? `TRACE-III pathway: anterior LVO with perfusion mismatch, ${t}h from LKW, no EVT available. Single TNK bolus reduces 90-d disability (mRS 0-1 33% vs 24%). Counsel sICH ~3%.`
      : !mismatchKnown
        ? 'Need perfusion imaging (CTP or MRI DWI/PWI) to confirm mismatch before late-window TNK; defer until imaging.'
        : `Not meeting TRACE-III criteria: ${blockers.join('; ')}.`,
    sichRisk: '3.0% sICH per TRACE-III (vs 0.8% standard care).',
    source: 'Xiong NEJM 2024;391:203-12 (TRACE-III, PMID 38884324)',
    guidelineClass: 'Pending formal AHA/ASA classification; emerging Class IIa for spoke facilities 4.5-24h LVO mismatch when EVT unavailable.'
  };
};

// =====================================================================
// Post-EVT blood pressure target (after successful recanalization)
// =====================================================================
// ENCHANTED2/MT (Yang Lancet 2022;400:1585-96, PMID 36341753): RCT n=821 successful EVT
//   (mTICI ≥2b). Intensive SBP <120 vs standard <140-180. STOPPED FOR HARM — intensive arm
//   worse mRS shift (cOR 1.37). Concluded SBP <140 NOT recommended post-recan.
// OPTIMAL-BP (Nam JAMA 2023;330:832-42): Stopped early, intensive worse.
// AHA/ASA 2024: Maintain SBP 140-180 after successful recanalization (Class IIa).
//
// Inputs:
//   recanalized   — boolean (mTICI ≥2b)
//   currentSBP    — current systolic BP
//   ivLyticGiven  — boolean: did patient receive IV lytic (changes the rules for first 24h)
//   hasHemorrhage — boolean: post-procedure ICH on imaging?
export const recommendPostEVTBP = ({ recanalized, currentSBP, ivLyticGiven, hasHemorrhage }) => {
  const sbp = parseFloat(currentSBP);

  if (hasHemorrhage === true) {
    return {
      target: '<140 mmHg',
      lowerBound: null,
      upperBound: 140,
      rationale: 'Post-procedure ICH detected — apply ICH BP targeting (130-140) per AHA/ASA 2022 ICH (INTERACT3 bundle).',
      source: 'INTERACT3 (Lancet 2023, PMID 37245517); AHA/ASA 2022 ICH',
      class: 'Class 2a'
    };
  }

  if (recanalized === true) {
    if (ivLyticGiven === true) {
      return {
        target: '140-180 mmHg (do NOT drive SBP <140)',
        lowerBound: 140,
        upperBound: 180,
        rationale: 'Successful recanalization (mTICI ≥2b) WITH IV lytic — maintain SBP 140-180 to preserve perfusion of penumbra. Intensive lowering (<120 or <140) caused harm in ENCHANTED2/MT and OPTIMAL-BP. Sustain target ≥24h.',
        source: 'Yang Lancet 2022;400:1585-96 (ENCHANTED2/MT, PMID 36341753); Nam JAMA 2023;330:832-42 (OPTIMAL-BP)',
        class: 'Class 2a (AHA/ASA 2024)',
        currentBP: Number.isFinite(sbp) ? sbp : null,
        actionable: Number.isFinite(sbp) ? (sbp < 140 ? 'SBP <140 — permissive; consider stopping antihypertensive' : sbp > 180 ? 'SBP >180 — initiate gentle BP reduction (labetalol 10 mg IV; avoid >40-60 mmHg drop)' : 'SBP within target — continue current management') : null
      };
    }
    return {
      target: '140-180 mmHg post-recanalization',
      lowerBound: 140,
      upperBound: 180,
      rationale: 'Successful EVT recanalization without IV lytic — same 140-180 target. ENCHANTED2/MT showed harm with SBP <120; AHA/ASA 2024 endorses SBP 140-180 sustained ≥24h.',
      source: 'Yang Lancet 2022 (ENCHANTED2/MT, PMID 36341753)',
      class: 'Class 2a',
      currentBP: Number.isFinite(sbp) ? sbp : null
    };
  }

  // Failed/unsuccessful recanalization OR no EVT performed
  if (ivLyticGiven === true) {
    return {
      target: '<180/105 mmHg (post-IV-lytic standard, x 24h)',
      lowerBound: null,
      upperBound: 180,
      rationale: 'Post-IV lytic (no successful recan) — keep SBP <180 and DBP <105 for 24h to minimize sICH risk.',
      source: 'AHA/ASA 2019 AIS guideline (Powers, Stroke 2019; PMID 31662037)',
      class: 'Class 1'
    };
  }

  return {
    target: 'Permissive HTN <220/110 (no reperfusion therapy)',
    lowerBound: null,
    upperBound: 220,
    rationale: 'No IV lytic, no successful EVT — permissive HTN to <220/110 unless end-organ damage. Do not lower aggressively in first 24-48h.',
    source: 'AHA/ASA 2019 AIS guideline (Powers, Stroke 2019)',
    class: 'Class 2b'
  };
};

// =====================================================================
// Distal/medium-vessel occlusion (DMVO) thrombectomy advisory
// =====================================================================
// 2025 RCTs in DMVO have been NEGATIVE:
//   ESCAPE-MeVO (Goyal ISC 2025, n~530) — no benefit vs medical.
//   DISTAL (n~530) — negative for primary mRS shift in M2/M3/A2/A3/P2.
//   DISCOUNT (France, n~488) — negative; signal of harm in subgroups.
// Conclusion: routine EVT for distal occlusions NOT supported. Reserve for severely
// disabling deficits at expert centers, ideally in trial.
export const dmvoEVTAdvisory = ({ occlusionLocation, nihss, deficitDisabling }) => {
  const loc = (occlusionLocation || '').toUpperCase().replace(/[\s_]+/g, '-');
  // Accept common synonyms for distal-M2: M2-DIST, M2-DISTAL, M2D, DISTAL-M2.
  // M3/M4/A2/A3/P2/P3 are unambiguous segment names.
  const dmvoTokens = ['M2-DIST', 'M2-DISTAL', 'M2D', 'DISTAL-M2', 'M3', 'M4', 'A2', 'A3', 'P2', 'P3'];
  const isDmvo = dmvoTokens.some(x => loc.includes(x));
  const n = parseFloat(nihss);

  if (!isDmvo) {
    return {
      isDmvo: false,
      advisory: null,
      proceed: true
    };
  }

  return {
    isDmvo: true,
    advisory: '2025 RCTs (DISTAL, ESCAPE-MeVO, DISCOUNT) failed to show DMVO thrombectomy benefit. Routine EVT for M2-distal/M3/M4/A2/A3/P2/P3 occlusions is NOT supported. Reserve for severely disabling deficits (aphasia, hemianopia, dominant-hand weakness) where IV TNK fails and a low-risk catheter route is feasible — ideally in trial enrollment.',
    proceed: deficitDisabling === true && Number.isFinite(n) && n >= 6 ? 'consider-only-if-disabling' : 'no',
    nextSteps: 'Give IV TNK 0.25 mg/kg (max 25 mg) per standard ≤4.5h pathway. Reassess at 1h post-bolus; if neurological deterioration in territory of dominant function, re-discuss case-by-case with neurointervention.',
    sources: 'DISTAL/ESCAPE-MeVO/DISCOUNT — 2025 conference and primary publications; AHA/ASA position pending formal statement',
    class: 'No formal class; AHA/ASA & ESO position: routine DMVO EVT not recommended outside trials.'
  };
};

// =====================================================================
// MOST advisory — adjunctive antithrombotic (tirofiban/argatroban/eptifibatide) post-IV lytic
// =====================================================================
// MOST (Adeoye/Broderick NEJM 2024;391:810-20, PMID 39231343): Phase 3 RCT, n=514, AIS s/p IV lytic.
// Argatroban or eptifibatide as adjunct vs placebo. STOPPED for futility — neither improved
// outcome. MR CLEAN-MED (Lancet 2022, PMID 35202525) similarly showed periprocedural
// heparin/aspirin during EVT increases sICH (stopped for harm).
// NOTE: RESCUE BT2 (China, NEJM 2023;388:2025-36, PMID 37256974) showed tirofiban benefit in
  // ischemic stroke WITHOUT large- or medium-vessel occlusion (mostly small atherosclerotic infarcts) who
// were INELIGIBLE for lytic/EVT — different population; do NOT extrapolate to lytic-eligible.
export const adjunctiveAntithromboticAdvisory = ({ ivLyticGiven, evtPlanned, lyticIneligible }) => {
  if (ivLyticGiven === true) {
    return {
      recommend: 'No',
      drugs: ['argatroban', 'eptifibatide', 'tirofiban (post-lytic)', 'heparin'],
      rationale: 'MOST trial (Adeoye NEJM 2024, PMID 39231343) found NO benefit and possible harm from argatroban or eptifibatide added to IV lytic. Do not give adjunctive anticoagulants/antiplatelets in the first 24h post-lytic.',
      source: 'Adeoye NEJM 2024;391:810-20 (MOST, PMID 39231343); MR CLEAN-MED Lancet 2022 (PMID 35202525)',
      class: 'Class 3 (no benefit/possible harm)'
    };
  }
  if (evtPlanned === true) {
    return {
      recommend: 'No (periprocedural heparin/aspirin)',
      drugs: ['heparin', 'aspirin (periprocedural)'],
      rationale: 'MR CLEAN-MED stopped for harm (sICH excess) when heparin or aspirin added periprocedurally. Avoid adjunctive antithrombotics during EVT.',
      source: 'MR CLEAN-MED Lancet 2022 (PMID 35202525)',
      class: 'Class 3'
    };
  }
  if (lyticIneligible === true) {
    return {
      recommend: 'Tirofiban may be considered',
      drugs: ['tirofiban'],
      rationale: 'RESCUE BT2 (NEJM 2023) improved the primary endpoint of excellent outcome (mRS 0-1) at 90 days — 29.1% vs 22.2%, adjusted RR 1.26 (95% CI 1.04-1.53), p=0.02, though secondary endpoints were generally not consistent with the primary result — with tirofiban in non-cardioembolic AIS who could not receive IV lytic or EVT. Distinct population from MOST.',
      source: 'RESCUE BT2 NEJM 2023 (PMID 37256974)',
      class: 'Class 2b (selected non-cardioembolic, lytic/EVT-ineligible)'
    };
  }
  return { recommend: 'No specific adjunct', rationale: 'Standard ASA 81 mg PO/PR within 24-48h per routine.', source: 'AHA/ASA 2019 AIS' };
};

// =====================================================================
// ENRICH eligibility — minimally invasive surgery for lobar ICH 30-80 mL
// =====================================================================
// ENRICH (Pradilla NEJM 2024;390:1277-89, PMID 38598795): Adaptive RCT, n=300.
// June 2026 operational screen exposed on the public ICH page:
// spontaneous lobar ICH, 30-80 mL, age 18-80, NIHSS >5, GCS 5-14, no lesion.
// Minimally invasive parafascicular surgery (BrainPath/Myriad-Artemis) + medical vs medical alone.
// Primary: utility-weighted mRS at 180d. RESULT: 0.458 vs 0.374 (posterior prob superiority >0.999).
// Benefit DRIVEN BY LOBAR subgroup (basal ganglia stratum dropped after futility analysis).
// Implication: lobar ICH ≥30 mL → call neurosurgery early for MIS evaluation.
export const evaluateENRICHEligibility = ({ icHLocation, volumeMl, timeFromOnsetH, gcs, premorbidMRS, age }) => {
  const v = parseFloat(volumeMl);
  const g = parseFloat(gcs);
  const a = parseFloat(age);
  const loc = (icHLocation || '').toLowerCase();

  if (!Number.isFinite(v)) return null;

  const isLobar = loc.includes('lobar') || loc.includes('cortical');
  const volumeOk = v >= 30 && v <= 80;
  const ageOk = !Number.isFinite(a) || (a >= 18 && a <= 80);
  const gcsOk = !Number.isFinite(g) || (g >= 5 && g <= 14);

  const blockers = [];
  if (!volumeOk) blockers.push(`Volume ${v} mL outside 30-80`);
  if (!ageOk) blockers.push(`Age ${a} outside 18-80`);
  if (!gcsOk) blockers.push(`GCS ${g} outside 5-14`);

  const eligible = volumeOk && ageOk && gcsOk && isLobar;

  return {
    eligible,
    bestCandidate: isLobar,
    rationale: eligible
      ? `Lobar ICH ${v} mL — June 2026 MIE screen-positive. Lobar ENRICH subgroup drove benefit (utility-weighted mRS 0.458 vs 0.374). Call neurosurgery for MIS evaluation and confirm timing/detailed exclusions.`
      : isLobar && blockers.length === 0 ? 'Likely candidate — confirm with neurosurgery.'
        : `Not currently meeting the June 2026 MIE screen: ${blockers.join('; ')}.${!isLobar ? ' Location not lobar for this operational screen.' : ''}`,
    nextSteps: 'If screen-positive: consult neurosurgery; obtain CTA/MRA to rule out vascular lesion; verify operative timing and detailed exclusions against the active protocol.',
    source: 'Pradilla NEJM 2024;390:1277-89 (ENRICH, PMID 38598795)',
    class: 'AHA/ASA 2022 was Class 2b for MIS pre-ENRICH; updated guidance expected to elevate to Class 2a for lobar ≥30 mL.'
  };
};

// =====================================================================
// SWITCH eligibility — early decompressive craniectomy for deep ICH
// =====================================================================
// SWITCH (Beck Lancet 2024;403:2395-404, PMID 38761811): International RCT, n=201.
// Deep supratentorial ICH ≥30 mL with reduced consciousness (GCS 8-13), <66h.
// Early DC + best medical vs best medical alone. Primary mRS 0-4 at 6mo: 44% vs 30%
// (adjusted RR 1.50, 95% CI 1.04-2.18, p=0.024). Stopped early for funding/COVID.
// Caveat: more severe-disability survivors. Pending guideline integration.
export const evaluateSWITCHEligibility = ({ icHLocation, volumeMl, gcs, timeFromOnsetH, age, premorbidMRS, herniationRisk }) => {
  const v = parseFloat(volumeMl);
  const g = parseFloat(gcs);
  const t = parseFloat(timeFromOnsetH);
  const a = parseFloat(age);
  const pm = parseFloat(premorbidMRS);
  const loc = (icHLocation || '').toLowerCase();

  if (!Number.isFinite(v) || !Number.isFinite(g)) return null;

  const isDeep = loc.includes('basal') || loc.includes('thalamus') || loc.includes('deep') || loc.includes('putam');
  const volumeOk = v >= 30;
  const gcsOk = g >= 8 && g <= 13;
  const timeOk = !Number.isFinite(t) || t <= 66;
  const ageOk = !Number.isFinite(a) || (a >= 18 && a <= 75);
  const pmOk = !Number.isFinite(pm) || pm <= 1;

  const blockers = [];
  if (!isDeep) blockers.push('Not deep supratentorial (lobar → consider ENRICH MIS instead)');
  if (!volumeOk) blockers.push(`Volume ${v} mL <30`);
  if (!gcsOk) blockers.push(`GCS ${g} outside 8-13 (SWITCH range)`);
  if (!timeOk) blockers.push(`${t}h >66h`);
  if (!ageOk) blockers.push(`Age ${a} outside 18-75`);
  if (!pmOk) blockers.push(`Premorbid mRS ${pm} >1`);

  const eligible = blockers.length === 0;

  return {
    eligible,
    rationale: eligible
      ? `Deep supratentorial ICH ${v} mL, GCS ${g}, ${Number.isFinite(t) ? t + 'h' : 'time?'} — SWITCH-eligible. Decompressive craniectomy improves 6mo mRS 0-4 (44% vs 30%). ${herniationRisk === true ? 'Herniation risk elevated — escalate urgency.' : ''} COUNSEL FAMILY: more severe-disability survivors despite mortality reduction.`
      : `Not meeting SWITCH criteria: ${blockers.join('; ')}.`,
    nextSteps: 'If eligible: emergent neurosurgery consult; family discussion re: trade-off (survival vs disability burden); ICU bed/EVD readiness.',
    counseling: 'SWITCH showed improved survival but more severe disability among survivors. Frame discussion around quality-of-life expectations, not mortality alone.',
    source: 'Beck Lancet 2024;403:2395-404 (SWITCH, PMID 38761811)',
    class: 'Pending formal guideline upgrade; AHA/ASA 2022 Class 2b for DC in non-malignant ICH.'
  };
};

// =====================================================================
// INTERACT3 ICH care bundle compliance
// =====================================================================
// INTERACT3 (Ma Lancet 2023;402:27-40, PMID 37245517): Cluster-RCT n=7036.
// Care bundle within first hour: SBP <140 ≤1h, glucose 6.1-7.8 (non-DM)/7.8-10 (DM),
// Tmax <37.5°C, INR reversal <1.5 within 1h. cOR for mRS shift 0.86 (p=0.015); mortality HR 0.77.
// Single most cost-effective ICH update.
export const ichCareBundleCheck = ({ sbpAtArrival, sbpAt1h, glucose, glucoseUnit, isDiabetic, temp, inr, isOnWarfarin, anticoagReversed }) => {
  const sbp1 = parseFloat(sbpAt1h);
  const glu = parseFloat(glucose);
  const tmp = parseFloat(temp);
  const i = parseFloat(inr);

  const items = [];
  // BP target
  const bpDone = Number.isFinite(sbp1) && sbp1 < 140;
  items.push({
    item: 'SBP <140 within 1h',
    target: '<140 mmHg',
    current: Number.isFinite(sbp1) ? `${sbp1} mmHg` : 'not entered',
    met: bpDone,
    action: bpDone ? null : 'Initiate IV labetalol 10 mg or nicardipine drip; recheck q15 min until target met. Avoid SBP <120.'
  });
  // Glucose
  const glucoseTarget = isDiabetic ? '7.8-10 mmol/L (140-180 mg/dL)' : '6.1-7.8 mmol/L (110-140 mg/dL)';
  const glucoseLow = isDiabetic ? 7.8 : 6.1;
  const glucoseHigh = isDiabetic ? 10 : 7.8;
  // Explicit unit toggle: 'mg/dL' or 'mmol/L'. The old magnitude heuristic
  // (>30 means mg/dL) misread severe hypoglycemia — 28 mg/dL parsed as
  // 28 mmol/L (~500 mg/dL). Without an explicit unit the value is treated
  // as NOT interpretable rather than guessed.
  const unit = glucoseUnit === 'mg/dL' || glucoseUnit === 'mmol/L' ? glucoseUnit : null;
  const gluMmol = !Number.isFinite(glu) ? NaN : unit === 'mg/dL' ? glu / 18 : unit === 'mmol/L' ? glu : NaN;
  const glucoseDone = Number.isFinite(gluMmol) && gluMmol >= glucoseLow && gluMmol <= glucoseHigh;
  items.push({
    item: 'Glucose in target range',
    target: glucoseTarget,
    current: Number.isFinite(glu) && unit ? (unit === 'mg/dL' ? `${glu} mg/dL (${gluMmol.toFixed(1)} mmol/L)` : `${glu} mmol/L`) : Number.isFinite(glu) ? `${glu} (unit not specified — select mg/dL or mmol/L)` : 'not entered',
    met: glucoseDone,
    action: glucoseDone ? null : (gluMmol < glucoseLow ? 'Treat hypoglycemia (D50W 25 g IV).' : `Insulin scale; target ${glucoseTarget}.`)
  });
  // Temperature
  const tempDone = Number.isFinite(tmp) && tmp < 37.5;
  items.push({
    item: 'Tmax <37.5°C',
    target: '<37.5°C',
    current: Number.isFinite(tmp) ? `${tmp}°C` : 'not entered',
    met: tempDone,
    action: tempDone ? null : 'Acetaminophen 1 g PO/PR/IV; cooling blanket if persistent fever. Investigate source.'
  });
  // INR reversal (only if on warfarin)
  if (isOnWarfarin === true) {
    const inrDone = (Number.isFinite(i) && i < 1.5) || anticoagReversed === true;
    items.push({
      item: 'INR <1.5 within 1h (warfarin)',
      target: '<1.5',
      current: Number.isFinite(i) ? `INR ${i}` : (anticoagReversed === true ? 'reversed' : 'not entered'),
      met: inrDone,
      action: inrDone ? null : 'Give 4F-PCC weight-based + Vitamin K 10 mg IV. Recheck INR at 30 min and 6h.'
    });
  }

  const completed = items.filter(x => x.met).length;
  const total = items.length;
  const fullyCompliant = completed === total;

  return {
    fullyCompliant,
    completed,
    total,
    percentComplete: Math.round((completed / total) * 100),
    items,
    rationale: fullyCompliant
      ? 'INTERACT3 bundle fully achieved within 1h — best evidence-based ICH outcome trajectory.'
      : `INTERACT3 bundle incomplete (${completed}/${total} elements met). Bundle as a whole reduces mRS shift (cOR 0.86) and mortality (HR 0.77).`,
    source: 'Ma Lancet 2023;402:27-40 (INTERACT3, PMID 37245517)',
    class: 'Class 2a equivalent (bundle-based recommendation, ESO/WSO 2023 endorse)'
  };
};

// =====================================================================
// PASCAL classification — PFO closure attribution probability
// =====================================================================
// Kent JAMA 2021;326:2277-86 (PMID 34905030).
// Combines RoPE score with PFO morphology (large shunt or atrial septal aneurysm).
// Categories: Unlikely / Possible / Probable. Closure benefit concentrated in Probable.
export const evaluatePASCAL = ({ ropeScore, largeShunt, atrialSeptalAneurysm }) => {
  const rope = parseFloat(ropeScore);
  if (!Number.isFinite(rope)) return null;
  const highRiskMorphology = largeShunt === true || atrialSeptalAneurysm === true;
  let category, recommendation, nnt;

  if (rope >= 7 && highRiskMorphology) {
    category = 'Probable';
    recommendation = 'PFO closure recommended (Class 1) — closure benefit highest. NNT ~17 over 5 years. Discuss with structural cardiology.';
    nnt = '~17 over 5 years';
  } else if (rope >= 7 || highRiskMorphology) {
    category = 'Possible';
    recommendation = 'Shared decision-making — closure benefit modest (NNT ~37 over 5 years). Discuss alternatives (antiplatelets vs anticoagulation) and patient preferences.';
    nnt = '~37 over 5 years';
  } else {
    category = 'Unlikely';
    recommendation = 'Closure NOT recommended — PFO unlikely causal. Standard secondary prevention with antiplatelet therapy.';
    nnt = 'No demonstrated benefit';
  }

  return {
    category,
    ropeScore: rope,
    largeShunt: largeShunt === true,
    atrialSeptalAneurysm: atrialSeptalAneurysm === true,
    recommendation,
    nnt,
    ageEligibility: 'PFO closure trials enrolled age 18-60. For age >60, individualize with shared decision-making; data sparser.',
    source: 'Kent JAMA 2021;326:2277-86 (PASCAL, PMID 34905030); CLOSE/REDUCE/RESPECT/DEFENSE-PFO RCTs',
    class: 'Class 1 for Probable; Class 2a for Possible (AAN 2020 PFO practice advisory; 2021 AHA/ASA secondary-prevention guideline)'
  };
};

// =====================================================================
// Intracranial atherosclerotic disease (ICAD) medical regimen
// =====================================================================
// SAMMPRIS (NEJM 2011/2014, PMID 21899409), VISSIT (JAMA 2015), CASSISS (JAMA 2022, PMID 35943472)
// — stenting INFERIOR to aggressive medical for 70-99% intracranial stenosis.
// Aggressive medical = DAPT × 90d, LDL <70, SBP <140 (consider <130), intensive lifestyle.
// Cilostazol: TOSS-2 (Stroke 2011), CSPS.com (Lancet Neurol 2019, PMID 31122494) — adds benefit.
export const icadMedicalRegimen = ({ stenosisPercent, location, recurrentEvent, onCurrentDAPT }) => {
  const s = parseFloat(stenosisPercent);
  if (!Number.isFinite(s) || s < 50) {
    return { applicable: false, message: 'ICAD pathway applies to ≥50% intracranial stenosis.' };
  }

  const severe = s >= 70;
  const regimen = [
    { drug: 'Aspirin 81 mg PO daily', duration: 'lifelong' },
    { drug: 'Clopidogrel 75 mg PO daily (DAPT)', duration: '90 days, then drop to single antiplatelet' },
    { drug: 'High-intensity statin (atorvastatin 80 mg or rosuvastatin 40 mg)', duration: 'lifelong; LDL goal <70 mg/dL' },
    { drug: 'BP target <130/80 (SPS3, ESPRIT)', duration: 'lifelong; ACEi/ARB + thiazide first-line' },
    { drug: 'Lifestyle: smoking cessation, Mediterranean diet, ≥150 min/wk moderate exercise', duration: 'lifelong' }
  ];

  if (recurrentEvent === true) {
    regimen.push({ drug: 'Cilostazol 100 mg PO BID (add-on)', duration: 'long-term', evidence: 'CSPS.com (Lancet Neurol 2019, PMID 31122494) — HR 0.49 for recurrence' });
  }

  return {
    applicable: true,
    severe,
    regimen,
    avoidStenting: 'Stenting NOT recommended outside refractory cases. SAMMPRIS and VISSIT showed net harm; CASSISS showed no benefit even with experienced operators and delayed treatment (8.0% vs 7.2%, HR 1.10, 95% CI 0.52-2.35, P=.82).',
    submaximalAngioplasty: severe ? 'Submaximal angioplasty without stent — observational data only; consider only at high-volume center for refractory cases or in trial.' : null,
    source: 'SAMMPRIS NEJM 2011/2014 (PMID 21899409); CASSISS JAMA 2022 (PMID 35943472); CSPS.com Lancet Neurol 2019 (PMID 31122494)',
    class: 'DAPT 90d Class 1; LDL <70 Class 1; cilostazol Class 2a for refractory'
  };
};

// =====================================================================
// Post-stroke BP target (long-term secondary prevention)
// =====================================================================
// SPS3 (Lancet 2013, PMID 23726159), SPRINT-MIND (JAMA 2019, PMID 30688979),
// ESPRIT (Lancet 2024, PMID 38945140).
// AHA 2024 SPS focused update: <130/80 (Class 1); ESC 2024: <130/80, <120 SBP if tolerated.
export const bpTargetPostStroke = ({ strokeSubtype, age, orthostatic, ckd, currentSBP, currentDBP }) => {
  const a = parseFloat(age);
  const sbp = parseFloat(currentSBP);
  const dbp = parseFloat(currentDBP);

  const baseTarget = '<130/80 mmHg (Class 1, AHA 2024)';
  const aggressiveTarget = '<120/80 mmHg (consider in tolerated patients per ESPRIT 2024)';

  let target = baseTarget;
  let lowerLimit = null;
  let cautions = [];

  // SPS3: small-vessel/lacunar — intensive (<130) trended benefit; ICH HR 0.37
  if ((strokeSubtype || '').toLowerCase().includes('lacun') || (strokeSubtype || '').toLowerCase().includes('small')) {
    target = '<130/80 mmHg (consider <120 SBP per SPS3 lacunar-stroke subgroup; ICH HR 0.37)';
  }

  if (orthostatic === true) {
    cautions.push('Orthostatic hypotension — relax target (consider <140/80) to avoid falls');
    target = '<140/80 mmHg with orthostatic monitoring';
  }
  if (Number.isFinite(a) && a >= 80) {
    cautions.push('Age ≥80 — individualize; SPRINT/ESPRIT enrolled fewer very-elderly. Consider <140/80 if frail.');
  }
  if (ckd === true) {
    cautions.push('CKD — ATACH-2 showed renal AEs in intensive arm of acute ICH; same caution applies long-term.');
  }

  const firstLine = ['ACEi or ARB (lisinopril, losartan)', 'Thiazide diuretic (chlorthalidone preferred over HCTZ)', 'Calcium channel blocker (amlodipine)'];
  const drugClassNote = 'AHA 2024 SPS: ACEi/ARB + thiazide most evidence; avoid beta-blocker as first-line for stroke prevention unless other indication.';

  return {
    target,
    aggressiveTarget,
    cautions,
    firstLine,
    drugClassNote,
    currentBP: Number.isFinite(sbp) && Number.isFinite(dbp) ? `${sbp}/${dbp} mmHg` : null,
    actionable: Number.isFinite(sbp)
      ? sbp >= 140 ? 'Above target — initiate or escalate antihypertensive'
        : sbp >= 130 ? 'Approaching target — small uptitration if tolerated'
          : sbp >= 120 ? 'At target — continue current regimen'
            : 'SBP <120 — verify not hypotensive; consider de-escalation if symptomatic'
      : null,
    source: 'AHA 2024 SPS focused update; SPS3 Lancet 2013 (PMID 23726159); ESPRIT Lancet 2024 (PMID 38945140)',
    class: 'Class 1 for <130/80'
  };
};

// =====================================================================
// Post-stroke lipid target (LDL)
// =====================================================================
// TST (NEJM 2020, PMID 31738483): post-stroke LDL <70 vs 90-110, MACE HR 0.78.
// SPARCL: atorva 80 baseline. FOURIER (PCSK9): stroke HR 0.79; no ICH increase.
// CLEAR Outcomes (NEJM 2023, PMID 36876740): bempedoic acid stroke HR 0.85.
// ESC 2024: very-high-risk LDL <55; AHA 2024 SPS: LDL <70 Class 1, <55 reasonable for high-risk.
export const lipidsTargetPostStroke = ({ strokeSubtype, currentLDL, onStatin, statinIntolerant, additionalCV, ckd }) => {
  const ldl = parseFloat(currentLDL);
  const isAtherosclerotic = ['atherosclerotic', 'lvd', 'icad', 'carotid', 'stenosis'].some(x =>
    (strokeSubtype || '').toLowerCase().includes(x)
  );
  const veryHighRisk = isAtherosclerotic || additionalCV === true;
  const target = veryHighRisk ? '<55 mg/dL (very-high-risk)' : '<70 mg/dL (post-stroke standard)';

  const tier = [];
  tier.push({ step: 1, agent: 'High-intensity statin: atorvastatin 80 mg OR rosuvastatin 40 mg', evidence: 'SPARCL NEJM 2006 (PMID 16899775); TST NEJM 2020 (PMID 31738483)' });
  tier.push({ step: 2, agent: 'Add ezetimibe 10 mg PO daily', evidence: 'IMPROVE-IT NEJM 2015 (PMID 26040320)' });
  if (statinIntolerant) {
    tier.push({ step: 3, agent: 'Bempedoic acid 180 mg PO daily (statin-intolerant)', evidence: 'CLEAR Outcomes NEJM 2023 (PMID 36876740) — stroke HR 0.85' });
  }
  tier.push({ step: 4, agent: 'PCSK9 inhibitor: evolocumab 140 mg SC q2wk OR alirocumab 75-150 mg SC q2wk', evidence: 'FOURIER stroke subgroup Lancet Neurol 2020 (PMID 32702332)' });
  tier.push({ step: 5, agent: 'Inclisiran 284 mg SC twice yearly (after initial loading)', evidence: 'ORION-9/10/11 NEJM 2020' });

  return {
    target,
    veryHighRisk,
    currentLDL: Number.isFinite(ldl) ? ldl : null,
    atTarget: Number.isFinite(ldl) ? (veryHighRisk ? ldl < 55 : ldl < 70) : null,
    tier,
    rationale: `Post-stroke LDL goal ${target}. ${isAtherosclerotic ? 'Atherosclerotic mechanism and/or additional CV disease — pursue <55 mg/dL.' : 'Standard post-stroke target <70.'} Tiered escalation: statin → ezetimibe → PCSK9i/bempedoic acid/inclisiran.`,
    pcskISafetyInStroke: 'FOURIER showed no ICH increase with evolocumab; PCSK9i are SAFE in post-stroke patients with prior ICH.',
    source: 'TST NEJM 2020 (PMID 31738483); FOURIER Lancet Neurol 2020 (PMID 32702332); CLEAR Outcomes NEJM 2023 (PMID 36876740)',
    class: 'Class 1 for LDL <70; Class 2a for <55 in very-high-risk'
  };
};

// =====================================================================
// ARCADIA / ATTICUS advisory — atrial cardiopathy ≠ AC indication
// =====================================================================
// ARCADIA (Kamel JAMA 2024;331:573-81, PMID 38324415): n=1015 ESUS + atrial cardiopathy
// markers. Apixaban vs ASA. Recurrent stroke 4.4 vs 4.4 per 100 PY (HR 1.00) — NEUTRAL.
// ATTICUS (Geisler NEJM Evid 2023, PMID 38320511): n=352 ESUS + cardiopathy/PFO marker;
// apixaban not superior to ASA.
// Implication: don't anticoagulate empirically for "atrial cardiopathy" — pursue prolonged
// rhythm monitoring (ICM) instead.
export const arcadiaAdvisory = ({ ptfv1, ntProBNP, laVolumeIndex, laDiameterCmM2, currentRegimen }) => {
  const ptf = parseFloat(ptfv1);
  const bnp = parseFloat(ntProBNP);
  const lavi = parseFloat(laVolumeIndex);
  const lad = parseFloat(laDiameterCmM2);

  const cardiopathyMarker = (Number.isFinite(ptf) && ptf > 5000)
    || (Number.isFinite(bnp) && bnp > 250)
    || (Number.isFinite(lavi) && lavi >= 34)
    || (Number.isFinite(lad) && lad >= 3);

  return {
    cardiopathyPresent: cardiopathyMarker,
    recommendDOAC: false,
    rationale: cardiopathyMarker
      ? 'Atrial cardiopathy markers present (PTFV1 >5000 µV·ms, NT-proBNP >250 pg/mL, LAVI ≥34 mL/m², or LA diameter ≥3 cm/m²). HOWEVER ARCADIA (2024) and ATTICUS (2023) both showed NO benefit of empiric apixaban over aspirin. Markers indicate ICM/prolonged monitoring need, NOT direct OAC indication.'
      : 'No atrial cardiopathy markers documented.',
    nextSteps: cardiopathyMarker
      ? '1) Implant ICM (Reveal LINQ or equivalent) — STROKE-AF showed AF in 12.1% even of non-cardioembolic strokes. 2) Continue antiplatelet (aspirin 81 mg). 3) Switch to OAC ONLY if AF detected with burden >24h or daily episodes.'
      : 'Standard secondary prevention (antiplatelet + statin + BP). Consider ICM if other clinical features suggest paroxysmal AF (elevated HAVOC score, atrial cardiopathy, recurrent embolic pattern, frequent palpitations).',
    afBurdenThreshold: 'ARTESIA showed apixaban benefit in subclinical AF ≥6 min (mostly hours), but with bleeding cost. NOAH-AFNET 6 was neutral. Practical: trigger OAC at sustained AF >24h or daily episodes; shorter-burst subclinical AF = uncertain benefit.',
    source: 'ARCADIA JAMA 2024;331:573-81 (Kamel et al., PMID 38324415); ATTICUS NEJM Evid 2023 (PMID 38320511); STROKE-AF JAMA 2021 (PMID 34061145)',
    class: 'Class 3 (no benefit) for empiric OAC based on cardiopathy markers alone'
  };
};

// =====================================================================
// AF detection strategy — ICM vs Holter (HAVOC + clinical)
// =====================================================================
// Builds on HAVOC score when available; gives the actual recommendation in workflow terms.
export const afDetectionStrategy = ({ havocScore, strokeSubtype, hasICMAccess }) => {
  const score = parseFloat(havocScore);
  const isCryptogenic = (strokeSubtype || '').toLowerCase().includes('cryptogenic') || (strokeSubtype || '').toLowerCase().includes('esus');

  let strategy, evidence;
  if (Number.isFinite(score) && score >= 5) {
    strategy = 'Prolonged rhythm monitoring; consider ICM if external monitoring is negative or direct ICM access is available.';
    evidence = 'Medium/high HAVOC risk (5-14) predicts higher AF detection; CRYSTAL-AF, STROKE-AF, PER DIEM all showed ICM superior for AF detection.';
  } else if (isCryptogenic) {
    strategy = hasICMAccess === false
      ? '30-day external loop monitor or 14-day ECG patch (Zio); escalate to ICM if negative.'
      : 'ICM at 90 days post-stroke (Class 2a). Bridge with 30-d external monitor if delay.';
    evidence = 'CRYSTAL-AF (NEJM 2014, PMID 24963567) — 12.4% AF detection vs 2.0%; AHA 2024 SPS Class 2a for cryptogenic.';
  } else if (Number.isFinite(score) && score >= 1) {
    strategy = '30-day external monitor first; ICM if negative and clinical suspicion remains.';
    evidence = 'STROKE-AF (JAMA 2021, PMID 34061145) — even non-cardioembolic strokes show 12.1% AF.';
  } else {
    strategy = 'Standard inpatient telemetry + 24-48h Holter; ICM not routinely indicated.';
    evidence = 'Low HAVOC + non-cryptogenic mechanism — yield is lower; escalate only if clinical suspicion remains high.';
  }

  return {
    strategy,
    evidence,
    burdenThreshold: 'AF burden threshold for OAC initiation: sustained ≥24h or daily episodes (per ARTESIA/NOAH-AFNET 6 nuance). Shorter-burst subclinical AF = individualized.',
    nextSteps: 'If AF detected with burden ≥24h: initiate DOAC per ELAN/OPTIMAS timing (≤4d for minor/moderate stroke; 6-7d for major). Do not bridge with heparin.',
    source: 'CRYSTAL-AF NEJM 2014; STROKE-AF JAMA 2021; PER DIEM JAMA 2021; ARTESIA NEJM 2024 (PMID 37952132); NOAH-AFNET 6 NEJM 2023 (PMID 37622677)',
    class: 'Class 2a for ICM in cryptogenic (AHA 2024)'
  };
};

// =====================================================================
// Boston criteria v2.0 for cerebral amyloid angiopathy
// =====================================================================
// Charidimou A et al. Lancet Neurol 2022;21:714-25 (PMID 35841910).
// Applies to patients aged >=50 presenting with spontaneous ICH, cognitive
// impairment, or transient focal neurological episodes.
// PROBABLE CAA: >=2 strictly lobar hemorrhagic lesions (ICH, cerebral
// microbleeds, or cortical superficial siderosis foci — a lobar ICH is NOT
// required) OR >=1 strictly lobar hemorrhagic lesion + >=1 white-matter
// feature (severe CSO perivascular spaces or multispot WMH), with no other
// cause. POSSIBLE CAA: 1 strictly lobar hemorrhagic lesion OR 1 white-matter
// feature. vs autopsy: sensitivity 74.5% (65.4-82.4), specificity 95.0%
// (83.1-99.4) for probable CAA.
export const evaluateBostonCAA20 = ({ age, lobarICH, corticalSiderosis, lobarMicrobleeds, lobarHemorrhagicLesionCount, csoPVSSevere, multispotWMH, otherCause }) => {
  const a = parseFloat(age);
  const meetsAge = !Number.isFinite(a) || a >= 50;
  const hasOtherCause = otherCause === true;

  if (!meetsAge) {
    return {
      category: 'N/A',
      rationale: 'Boston v2.0 criteria apply to patients aged ≥50. Below this, consider alternative etiologies (vasculitis, hereditary CAA syndromes, vascular malformation).'
    };
  }

  if (hasOtherCause) {
    return {
      category: 'Excluded',
      rationale: 'Other clear cause for the hemorrhagic lesions identified — Boston criteria not applied.'
    };
  }

  // Count of strictly lobar hemorrhagic LESIONS (each ICH, each microbleed,
  // and each focus of cortical superficial siderosis counts individually).
  // Prefer the explicit count; otherwise derive a LOWER BOUND from the
  // boolean marker flags.
  const explicitCount = parseFloat(lobarHemorrhagicLesionCount);
  const derivedMinCount = (lobarICH === true ? 1 : 0) + (corticalSiderosis === true ? 1 : 0) + (lobarMicrobleeds === true ? 1 : 0);
  const lesionCount = Number.isFinite(explicitCount) ? explicitCount : derivedMinCount;
  const wmFeatures = (csoPVSSevere === true ? 1 : 0) + (multispotWMH === true ? 1 : 0);

  let category, action;
  if (lesionCount >= 2 || (lesionCount >= 1 && wmFeatures >= 1)) {
    // >=2 strictly lobar hemorrhagic lesions qualifies as Probable even
    // WITHOUT a symptomatic lobar ICH (e.g., two lobar microbleeds).
    category = 'Probable CAA';
    action = 'Meets Boston v2.0 Probable CAA. Anticoagulation decisions require caution — weigh recurrent-ICH risk; consider LAA occlusion for AF (shared decision); BP <130/80; statins were not associated with increased ICH in FOURIER.';
  } else if (lesionCount === 1 || wmFeatures >= 1) {
    category = 'Possible CAA';
    action = 'One strictly lobar hemorrhagic lesion OR one white-matter feature. Not diagnostic — document markers, obtain/repeat susceptibility-weighted MRI, and reassess.';
  } else {
    category = 'CAA Unlikely';
    action = 'No strictly lobar hemorrhagic lesions or CAA white-matter features; pursue alternative etiology workup.';
  }

  return {
    category,
    age: a,
    lobarHemorrhagicLesionCount: lesionCount,
    lesionCountIsLowerBound: !Number.isFinite(explicitCount),
    whiteMatterFeatures: wmFeatures,
    action,
    accuracy: 'Boston v2.0 probable CAA vs autopsy: sensitivity 74.5% (95% CI 65.4-82.4), specificity 95.0% (95% CI 83.1-99.4).',
    source: 'Charidimou A et al. Lancet Neurol 2022;21:714-25 (Boston criteria v2.0, PMID 35841910)',
    class: 'No formal class — diagnostic criteria used for prognostication and anticoagulation decision-making'
  };
};

// =====================================================================
// client-side BYOK configuration helper
// =====================================================================
// Single source of truth for which BYOK providers exist, and in what order.
// The Settings → API Configuration dropdown in src/app.jsx is derived from this
// list and only adds display metadata, so the two cannot drift apart.
// A provider outside this set — including the retired 'mock' demo entry —
// reads back as '' (unconfigured) so a caller can never dispatch on it.
export const AI_PROVIDERS = ['openai', 'anthropic', 'gemini', 'grok'];

export const getAIConfiguration = () => {
  const unconfigured = { provider: '', apiKey: '' };
  if (typeof window === 'undefined' || !window.localStorage) {
    return unconfigured;
  }
  try {
    const prefix = 'strokeApp:';
    const providerRaw = window.localStorage.getItem(prefix + 'apiProvider');
    try { window.localStorage.removeItem(prefix + 'apiKey'); } catch (e) {}
    const keyRaw = window.sessionStorage.getItem('apiKey');

    // localStorage stores JSON-stringified values if saved by setKey
    const stored = providerRaw ? JSON.parse(providerRaw) : '';
    const provider = AI_PROVIDERS.includes(stored) ? stored : '';
    const apiKey = keyRaw || '';
    return { provider, apiKey };
  } catch (e) {
    return unconfigured;
  }
};

// =====================================================================
// CRAO Acute Thrombolysis Decision Tool (AHA 2021 / THEIA 2025)
// =====================================================================
// Evaluates acute IV thrombolysis eligibility for Central Retinal Artery Occlusion.
// AHA Statement 2021 (Mac Grory, Stroke 2021;52:e282-e294, PMID 33677974);
// THEIA trial (Préterre et al., Lancet Neurol 2025;24:110-120, PMID 41109232).
export const evaluateCRAOTreatment = ({
  onsetHours,
  visualAcuity,
  fundusHemorrhage,
  ivtContraindicated,
  age
} = {}) => {
  const t = parseFloat(onsetHours);
  const a = Number.isFinite(parseFloat(age)) ? parseFloat(age) : 18;
  if (!Number.isFinite(t)) return null;

  const windowOk = t >= 0 && t <= 4.5;
  const ageOk = a >= 18;

  let visionOk = false;
  if (typeof visualAcuity === 'boolean') {
    visionOk = visualAcuity;
  } else if (typeof visualAcuity === 'string') {
    const v = visualAcuity.toLowerCase().trim();
    const snellenMatch = v.match(/20\/(\d+)/);
    if (snellenMatch) {
      const denom = parseInt(snellenMatch[1], 10);
      visionOk = denom >= 200;
    } else {
      visionOk = ['no-light-perception', 'light-perception', 'hand-motion', 'count-fingers', 'severe', 'nlp', 'lp', 'hm', 'cf'].some(k => v.includes(k));
    }
  } else {
    visionOk = true;
  }

  const noHemorrhage = fundusHemorrhage === false;
  const noContraindication = ivtContraindicated === false;

  const eligible = windowOk && ageOk && visionOk && noHemorrhage && noContraindication;

  const contraindications = [];
  if (!windowOk) contraindications.push(`Onset ${t}h exceeds 4.5h window`);
  if (!ageOk) contraindications.push(`Age ${a} < 18 years`);
  if (!visionOk) contraindications.push('Visual acuity not meeting severe vision loss criteria (<= 20/200 / count fingers / light perception)');
  if (!noHemorrhage) contraindications.push('Retinal hemorrhage present on fundoscopy / OCT');
  if (!noContraindication) contraindications.push('Systemic contraindications to IV thrombolysis present');

  return {
    eligible,
    onsetHours: t,
    age: a,
    visualAcuityOk: visionOk,
    noHemorrhage,
    noContraindications: noContraindication,
    contraindications,
    recommendation: eligible
      ? 'Eligible for acute IV thrombolysis (TNK 0.25 mg/kg max 25 mg OR alteplase 0.9 mg/kg max 90 mg) within 4.5h of sudden painless monocular vision loss. Perform urgent ophthalmology / fundoscopy consult to confirm CRAO and rule out retinal hemorrhage prior to lytic infusion.'
      : `Ineligible for IV thrombolysis in CRAO: ${contraindications.join('; ')}.`,
    dosingInfo: 'IV Tenecteplase 0.25 mg/kg (max 25 mg) single IV bolus OR Alteplase 0.9 mg/kg (10% bolus, remainder over 60 min, max 90 mg).',
    sources: 'AHA Scientific Statement (Mac Grory Stroke 2021, PMID 33677974); THEIA Trial (Préterre Lancet Neurol 2025, PMID 41109232)',
    class: 'Class IIa (AHA 2021 statement & 2025 THEIA trial evidence)'
  };
};

// =====================================================================
// SeLECT Post-Stroke Seizure & Epilepsy Risk Score
// =====================================================================
// Galovic M et al. Lancet Neurol 2018;17:143-152 (PMID 29413315).
// Predicts 1-year and 5-year risk of late post-stroke seizures / epilepsy.
// The 'L' item is LARGE-ARTERY ATHEROSCLEROTIC etiology (TOAST subtype),
// NOT large-vessel occlusion.
export const calculateSeLECTScore = ({
  nihss,
  corticalInvolvement,
  earlySeizure,
  largeArteryAtherosclerosis,
  lvoArtery, // deprecated alias retained for backward compatibility
  middleCerebralTerritory
} = {}) => {
  const n = parseFloat(nihss);
  if (!Number.isFinite(n)) return null;

  const toBool = (val) => val === true || String(val).toLowerCase() === 'true' || val === 1;

  const isCortical = toBool(corticalInvolvement);
  const isEarlySeizure = toBool(earlySeizure);
  const isLargeArtery = toBool(largeArteryAtherosclerosis !== undefined ? largeArteryAtherosclerosis : lvoArtery);
  const isMca = toBool(middleCerebralTerritory);

  const nihssPts = n >= 11 ? 2 : n >= 4 ? 1 : 0;
  const corticalPts = isCortical ? 2 : 0;
  const earlySeizurePts = isEarlySeizure ? 3 : 0;
  const largeArteryPts = isLargeArtery ? 1 : 0;
  const mcaPts = isMca ? 1 : 0;

  const score = nihssPts + corticalPts + earlySeizurePts + largeArteryPts + mcaPts;

  // Published anchors (Galovic 2018): score 0 = 0.7% (1 y) / 1.3% (5 y);
  // score 9 = 63% (95% CI 42-77) at 1 y and 83% (95% CI 62-93) at 5 y.
  // Intermediate rows are read from the publication's risk figure.
  const riskTable = {
    0: { y1: '0.7%', y5: '1.3%', numY1: 0.7, numY5: 1.3, tier: 'Low' },
    1: { y1: '1.2%', y5: '2.4%', numY1: 1.2, numY5: 2.4, tier: 'Low' },
    2: { y1: '2.1%', y5: '4.2%', numY1: 2.1, numY5: 4.2, tier: 'Low-Moderate' },
    3: { y1: '3.7%', y5: '7.3%', numY1: 3.7, numY5: 7.3, tier: 'Moderate' },
    4: { y1: '6.4%', y5: '12.4%', numY1: 6.4, numY5: 12.4, tier: 'Moderate-High' },
    5: { y1: '10.9%', y5: '20.3%', numY1: 10.9, numY5: 20.3, tier: 'High' },
    6: { y1: '17.9%', y5: '31.6%', numY1: 17.9, numY5: 31.6, tier: 'High' },
    7: { y1: '28.1%', y5: '46.0%', numY1: 28.1, numY5: 46.0, tier: 'Very High' },
    8: { y1: '41.3%', y5: '61.7%', numY1: 41.3, numY5: 61.7, tier: 'Very High' },
    9: { y1: '63%', y5: '83%', numY1: 63, numY5: 83, tier: 'Very High' }
  };

  const clampedScore = Math.min(Math.max(score, 0), 9);
  const risk = riskTable[clampedScore];

  return {
    score: clampedScore,
    oneYearRisk: risk.y1,
    fiveYearRisk: risk.y5,
    riskTier: risk.tier,
    recommendation: clampedScore >= 4
      ? `High risk of late post-stroke epilepsy (${risk.y5} at 5 years). Monitor closely and counsel patient/family on seizure precautions. Routine prophylactic ASM is NOT recommended, but initiate ASM promptly if an unprovoked seizure occurs >7 days post-stroke.`
      : `Low-to-moderate risk of post-stroke epilepsy (${risk.y5} at 5 years). Standard post-stroke follow-up without prophylactic ASM.`,
    breakdown: {
      nihssPoints: nihssPts,
      corticalPoints: corticalPts,
      earlySeizurePoints: earlySeizurePts,
      largeArteryAtherosclerosisPoints: largeArteryPts,
      mcaPoints: mcaPts
    },
    source: 'Galovic M et al. Lancet Neurol 2018;17:143-152 (SeLECT Score, PMID 29413315)'
  };
};

// =====================================================================
// EDEMA Score — potentially lethal malignant edema after anterior stroke
// =====================================================================
// Ong CJ et al. Stroke 2017;48:1969-1972 (PMID 28487333; PMC5487281).
// Items (from data within 24 h of ictus; derivation NIHSS >=8, anterior
// circulation): basal cistern effacement = 3; glucose >=150 mg/dL = 2;
// no tPA or thrombectomy = 1; midline shift at the septum pellucidum (mm):
// 0 = 0, >0-3 = 1, 3-6 = 2, 6-9 = 4, >9 = 7; no previous stroke = 1.
// Max 14. Score >=7: PPV 93%, specificity 99% for potentially lethal
// malignant edema (death with midline shift >=5 mm or hemicraniectomy).
// C-statistic 0.76 (derivation), 0.75 (bootstrap validation).
export const calculateEDEMAScore = ({
  basalCisternEffacement,
  glucoseMgDl,
  glucoseMmolL,
  noReperfusionTherapy,
  midlineShiftMm,
  noPreviousStroke
} = {}) => {
  const shift = parseFloat(midlineShiftMm);
  const gMg = parseFloat(glucoseMgDl);
  const gMmol = parseFloat(glucoseMmolL);
  // The score is defined only when its imaging inputs are assessable.
  if (!Number.isFinite(shift)) return null;

  const cisternPts = basalCisternEffacement === true ? 3 : 0;
  const glucosePts = ((Number.isFinite(gMg) && gMg >= 150) || (Number.isFinite(gMmol) && gMmol >= 8.3)) ? 2 : 0;
  const noTxPts = noReperfusionTherapy === true ? 1 : 0;
  let shiftPts = 0;
  if (shift > 9) shiftPts = 7;
  else if (shift >= 6) shiftPts = 4;
  else if (shift >= 3) shiftPts = 2;
  else if (shift > 0) shiftPts = 1;
  const noPriorPts = noPreviousStroke === true ? 1 : 0;

  const score = cisternPts + glucosePts + noTxPts + shiftPts + noPriorPts;
  const highRisk = score >= 7;

  return {
    score,
    highRiskForMalignantEdema: highRisk,
    riskTier: highRisk ? 'High' : score >= 3 ? 'Intermediate' : 'Low',
    recommendation: highRisk
      ? `EDEMA Score ${score} (>=7): high specificity (99%) and PPV (93%) for potentially lethal malignant edema. Trigger early neurosurgical consultation for decompressive hemicraniectomy evaluation (DESTINY/DECIMAL/HAMLET); Neuro-ICU monitoring with q1-2h neurochecks; prepare osmotherapy; avoid hypoventilation and hyperthermia.`
      : `EDEMA Score ${score} (<7): below the published high-risk threshold. Continue serial neurologic and imaging surveillance — the score is specific, not sensitive, so a low score does not exclude edema progression.`,
    breakdown: {
      basalCisternPoints: cisternPts,
      glucosePoints: glucosePts,
      noReperfusionPoints: noTxPts,
      midlineShiftPoints: shiftPts,
      noPreviousStrokePoints: noPriorPts
    },
    source: 'Ong CJ et al. Stroke 2017;48:1969-1972 (EDEMA Score, PMID 28487333)'
  };
};
