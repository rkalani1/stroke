// Maintained Encounter arithmetic/source screens only. Full historical helpers are at the archival Git ref.
// Reviewed helpers accept complete finite numbers, never partial strings or booleans.
import { reviewedNumber } from './reviewed-number.js';
import { parseTimestamp } from './clinical/timestamp.js';

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


export const evaluateDAWN = ({ age, nihss, coreMl, timeFromLKWh } = {}) => {
  const a = reviewedNumber(age);
  const n = reviewedNumber(nihss);
  const c = reviewedNumber(coreMl);
  const t = reviewedNumber(timeFromLKWh);
  if (![a, n, c, t].every(Number.isFinite) || a <= 0 || a > 120 || !Number.isInteger(n) || n < 0 || n > 42 || c < 0 || t < 0) return null;
  if (Number.isFinite(t) && (t < 6 || t > 24)) {
    return { eligible: false, tier: null, reason: `Outside DAWN window (6-24h); LKW ${t}h`, meetsImaging: false, meetsClinical: false };
  }
  let tier = null; let reason = '';
  if (a >= 80 && n >= 10 && c < 21) tier = 'A';
  else if (a >= 18 && a < 80 && n >= 10 && c < 31) tier = 'B';
  else if (a >= 18 && a < 80 && n >= 20 && c < 51) tier = 'C';
  else reason = `No tier met (age ${a}, NIHSS ${n}, core ${c} mL)`;
  return {
    eligible: tier !== null,
    tier,
    meetsImaging: Number.isFinite(c) && c < 51,
    meetsClinical: Number.isFinite(n) && n >= 10,
    reason: tier ? `DAWN Group ${tier} age/severity/core screen met. Confirm ICA/proximal MCA occlusion, baseline function, and remaining trial criteria; this is not complete EVT eligibility.` : `${reason}. Failure to meet DAWN does not exclude EVT under newer evidence.`,
    window: '6-24h',
    endpointNNT: 2.8,
    source: 'Nogueira NEJM 2018;378:11-21 (NCT02142283)'
  };
};

export const evaluateDEFUSE3 = ({ coreMl, penumbraMl, hypoperfusedMl, timeFromLKWh, nihss, age } = {}) => {
  const c = reviewedNumber(coreMl);
  const p = reviewedNumber(hypoperfusedMl ?? penumbraMl);
  const t = reviewedNumber(timeFromLKWh);
  const n = reviewedNumber(nihss);
  const a = reviewedNumber(age);
  if (![c, p, t, n, a].every(Number.isFinite) || c < 0 || p < c || t < 0 || !Number.isInteger(n) || n < 0 || n > 42 || a <= 0 || a > 120) return null;
  if (Number.isFinite(t) && (t < 6 || t > 16)) {
    return { eligible: false, reason: `Outside DEFUSE-3 window (6-16h); LKW ${t}h`, meetsCore: c < 70, meetsMismatch: false };
  }
  const mismatchVolume = p - c;
  const mismatchRatio = c > 0 ? p / c : Infinity;
  const coreOk = c < 70;
  const ratioOk = mismatchRatio >= 1.8;
  const volumeOk = mismatchVolume >= 15;
  const clinicalOk = n >= 6 && a >= 18 && a <= 90;
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
      ? 'DEFUSE-3 age/severity/perfusion screen met. Confirm ICA/proximal MCA occlusion, baseline function, and all exclusions; this is not complete EVT eligibility.'
      : `${!coreOk ? `Core ${c} mL ≥70; ` : ''}${!ratioOk ? `Mismatch ratio ${mismatchRatio.toFixed(1)} < 1.8; ` : ''}${!volumeOk ? `Mismatch volume ${mismatchVolume.toFixed(1)} mL < 15; ` : ''}${!clinicalOk ? 'Age 18–90 and NIHSS ≥6 required; ' : ''}Failure to meet DEFUSE-3 does not exclude EVT under newer evidence.`.trim(),
    window: '6-16h',
    endpointNNT: 3.6,
    source: 'Albers NEJM 2018;378:708-18 (NCT02586415)'
  };
};

export const recommendAcuteDAPT = ({ age, anticoagulationExcluded, nihss, abcd2, strokeType, atherosclerotic, lvdSymptomatic, cyp2c19LOF, ichRisk, timeFromOnsetH, noncardioembolicConfirmed, hemorrhageExcluded, reperfusionExcluded, antiplateletContraindicationsReviewed } = {}) => {
  const a = reviewedNumber(age);
  const n = reviewedNumber(nihss);
  const ab = reviewedNumber(abcd2);
  const tH = reviewedNumber(timeFromOnsetH);
  const elapsed = Number.isFinite(tH) ? `${Math.floor(Math.round(tH * 60) / 60)} h ${String(Math.round(tH * 60) % 60).padStart(2, '0')} min` : '';
  const isTIA = strokeType === 'tia';
  const isMinor = strokeType === 'ischemic' && Number.isInteger(n) && n >= 0 && n <= 3;
  const isUpToModerate = strokeType === 'ischemic' && Number.isInteger(n) && n >= 0 && n <= 5;
  const inInspiresWindow = tH <= 72;
  const inLegacyWindow = tH <= 24;
  const highRisk = Number.isFinite(ab) && ab >= 4;
  const isAtherosclerotic = atherosclerotic === true || lvdSymptomatic === true;

  if (ichRisk === 'high') {
    return { regimen: 'individualized-review', rationale: 'High hemorrhagic risk requires an individualized antithrombotic plan. This does not establish that even single antiplatelet therapy is safe.', duration: null, dosing: null, source: null };
  }

  // These modeled DAPT sources enrolled adults (POINT: age >=18; other
  // source populations are narrower). Missing age cannot imply applicability.
  // POINT primary manuscript: https://pmc.ncbi.nlm.nih.gov/articles/PMC6193486/
  if (a === null || a < 18 || a > 120) return {
    regimen: '—', duration: null, dosing: null,
    rationale: a !== null && a >= 0 && a < 18
      ? 'Pediatric stroke/TIA: use specialist antithrombotic assessment; these adult DAPT source screens do not apply.'
      : 'Document a valid adult age before applying these DAPT source screens.',
    source: 'POINT (PMID 29766750); AHA/ASA 2026 AIS §4.7'
  };

  if (anticoagulationExcluded !== true) return {
    regimen: anticoagulationExcluded === false ? 'individualized-review' : '—', duration: null, dosing: null,
    rationale: 'Review current anticoagulation and any continuing indication. Unresolved or ongoing/indicated anticoagulation cannot select a regimen here; prior exposure alone is not a permanent exclusion.',
    source: 'POINT (NCT00991029 anticoagulation exclusion); AHA/ASA 2021 secondary prevention'
  };

  // V3 — empty/invalid input guard. With no usable severity input (NIHSS for
  // ischemic stroke, or ABCD² for a TIA), the recommendation is undefined; do
  // NOT assert a conclusion ("DAPT not indicated") from non-existent input.
  // Show a neutral prompt instead. Once a valid NIHSS (or ABCD² for TIA) is
  // entered, the branches below compute normally.
  const severityValid = isTIA ? Number.isInteger(ab) && ab >= 0 && ab <= 7 : Number.isInteger(n) && n >= 0 && n <= 42;
  if (!['ischemic', 'tia'].includes(strokeType) || !severityValid || !Number.isFinite(tH) || tH < 0) {
    return {
      regimen: '—',
      rationale: 'Enter valid NIHSS (0–42) for stroke or ABCD² (0–7) for TIA and hours since onset. Confirm noncardioembolic mechanism, hemorrhage exclusion, and reperfusion/bleeding considerations separately.',
      duration: null,
      source: null
    };
  }

  if (![noncardioembolicConfirmed, hemorrhageExcluded, reperfusionExcluded, antiplateletContraindicationsReviewed].every(v => v === true)) return { regimen: '—', duration: null, dosing: null, rationale: 'Confirm noncardioembolic mechanism, hemorrhage exclusion, no reperfusion treatment, and antiplatelet contraindication review before selecting a modeled DAPT regimen.', source: 'AHA/ASA 2026 AIS §4.7' };

  // AHA/ASA 2026 AIS recommendations carry no age limit for these DAPT tiers. When
  // age falls outside a source trial's enrollment, report the guideline tier and
  // disclose the trial-population gap instead of withholding the regimen.
  const guidelineTier = (result, trial, population, grade) => ({
    ...result,
    rationale: `${result.rationale} Guideline tier: ${trial} enrolled ${population}; age ${a} is outside that trial population, but the AHA/ASA 2026 recommendation is not age-restricted. Weigh bleeding risk individually.`,
    class: `${grade} (guideline tier; age outside the ${trial} trial population)`
  });

  // THALES: ticagrelor+ASA x 30d (Class 2b, 2021) for NIHSS 4-5 noncardioembolic stroke without a presumed atherosclerotic cause, within 24h.
  // NIHSS 0-3 and high-risk TIA fall through to CHANCE/POINT (Class 1 clopidogrel+ASA); atherosclerotic NIHSS 4-5 falls through to the INSPIRES branch (clopidogrel+ASA).
  if (isUpToModerate && n >= 4 && !isAtherosclerotic && inLegacyWindow) {
    const thales = {
      regimen: 'ticagrelor+ASA',
      duration: '30 days',
      dosing: 'Ticagrelor 180 mg load, then 90 mg BID + ASA 300-325 mg load then 75-100 mg daily',
      rationale: `Minor-to-moderate noncardioembolic stroke (NIHSS ${n}) within 24h: THALES (NIHSS ≤5 or high-risk TIA; patients treated with thrombolysis or thrombectomy excluded) reported stroke or death at 30 d in 5.5% vs 6.6% (HR 0.83) with more severe bleeding (0.5% vs 0.1%).`,
      source: 'Johnston NEJM 2020;383:207-17 (THALES); AHA/ASA 2026 AIS §4.7; INSPIRES NEJM 2023;389:2413-24 alternative for atherosclerotic LVD',
      class: 'COR 2b, LOE B-R (AHA/ASA 2026 AIS) for selected ticagrelor-aspirin patients; discuss bleeding risk and alternatives'
    };
    if (a < 40) return guidelineTier(thales, 'THALES', 'patients age ≥40', 'COR 2b, LOE B-R (AHA/ASA 2026 AIS)');
    return thales;
  }

  // INSPIRES branch: NIHSS 4-5 within 72h (extended window beyond CHANCE/POINT), or atherosclerotic LVD ≥50%.
  if (isAtherosclerotic && inInspiresWindow && ((isUpToModerate && n >= 4) || (tH > 24 && (isMinor || (isTIA && highRisk))))) {
    const inspires = {
      regimen: 'clopidogrel+ASA', duration: '21 days',
      dosing: 'Clopidogrel 300 mg load then 75 mg daily; aspirin 100–300 mg on day 1 then 100 mg daily for 21 days (INSPIRES trial regimen)',
      rationale: `INSPIRES-style screen: ${isTIA ? `high-risk TIA (ABCD² ${ab})` : `NIHSS ${n}`} within ${elapsed} and presumed atherosclerotic cause. Verify qualifying stenosis/multiple infarcts, age 35–80, and all exclusions. Clopidogrel continued through day 90; bleeding increased. A CYP2C19 result does not validate substituting the CHANCE-2 regimen in this extended population.`,
      source: 'Gao NEJM 2023;389:2413–24 (INSPIRES, PMID 38157499); AHA/ASA 2026 AIS §4.7',
      class: 'COR 2a, LOE B-R (AHA/ASA 2026 AIS) for selected noncardioembolic minor stroke or high-risk TIA with presumed atherosclerotic cause; a partial screen, not complete treatment eligibility'
    };
    if (a < 35 || a > 80) return guidelineTier(inspires, 'INSPIRES', 'patients age 35–80', 'COR 2a, LOE B-R (AHA/ASA 2026 AIS)');
    return inspires;
  }

  // CHANCE/POINT classic branch: high-risk TIA or NIHSS ≤3, within 24h (POINT was 12h; CHANCE was 24h).
  if (((isTIA && highRisk) || isMinor) && inLegacyWindow) {
    const useTicagrelor = cyp2c19LOF === true;
    const classic = {
      regimen: useTicagrelor ? 'ticagrelor+ASA (CHANCE-2)' : 'clopidogrel+ASA',
      duration: '21 days',
      dosing: useTicagrelor
        ? 'Ticagrelor 180 mg load, then 90 mg BID through day 90 + ASA 75-100 mg daily for the first 21 days only (CHANCE-2: ASA 75-300 mg on day 1, then 75 mg daily on days 2-21)'
        : 'Clopidogrel load (300 mg in CHANCE; 600 mg in POINT) then 75 mg daily + aspirin (CHANCE 75-300 mg on day 1, then 75 mg daily; POINT 50-325 mg daily, with 162 mg daily for 5 days then 81 mg daily recommended)',
      rationale: useTicagrelor
        ? 'Known CYP2C19 LOF carrier — CHANCE-2 showed ticagrelor+ASA superior to clopidogrel+ASA.'
        : `${isTIA ? `High-risk TIA (ABCD² ${ab} ≥4)` : `Minor stroke (NIHSS ${n} ≤3)`} within ${elapsed}: ${a < 40 ? 'POINT enrolled adults ≥18 within 12h; CHANCE enrolled age ≥40 within 24h.' : 'CHANCE/POINT showed reduced 90-d stroke risk.'} Short-course guidance favors 21 d of DAPT to limit bleeding; confirm the full applicable source.`,
      source: useTicagrelor ? 'Wang NEJM 2021;385:2520-30 (CHANCE-2); AHA/ASA 2026 AIS §4.7' : 'Wang NEJM 2013;369:11-19 (CHANCE); Johnston NEJM 2018;379:215-25 (POINT); AHA/ASA 2026 AIS §4.7',
      class: useTicagrelor ? 'Class 2b/B-R, 2026 AHA/ASA AIS §4.7; CHANCE-2 postdates the 2021 secondary-prevention guideline' : 'COR 1, LOE A (AHA/ASA 2026 AIS): DAPT with loading dose within 24 h for 21 days, then single antiplatelet therapy'
    };
    if (useTicagrelor && a < 40) return guidelineTier(classic, 'CHANCE-2', 'patients age ≥40', 'COR 2b, LOE B-R (AHA/ASA 2026 AIS)');
    if (!useTicagrelor && a < 40 && tH > 12) return guidelineTier(classic, 'CHANCE / POINT', 'patients age ≥40 within 24h (CHANCE), or age ≥18 within 12h (POINT)', 'COR 1, LOE A (AHA/ASA 2026 AIS)');
    return classic;
  }

  // Fall-throughs that signal "missed-window" or "above-threshold"
  if (((isTIA && highRisk) || isUpToModerate) && tH > 72) {
    return {
      regimen: 'individualized-review',
      duration: null,
      rationale: `Outside the trial windows modeled here (${elapsed} > 72 h). This is not a blanket DAPT contraindication: the 2021 secondary-prevention guideline allows initiation within 7 days for selected minor noncardioembolic stroke/high-risk TIA. Review current guidance, mechanism, and bleeding risk.`,
      source: 'AHA/ASA 2021 secondary-prevention guideline (doi: 10.1161/STR.0000000000000375); INSPIRES 2023',
      class: 'Trial screen limitation; individualized clinical review'
    };
  }

  return {
    regimen: 'individualized-review',
    duration: null,
    dosing: null,
    rationale: `No DAPT trial branch modeled here is met (${isTIA ? `TIA ABCD² ${ab}` : `NIHSS ${n}`}, ${elapsed}). Review the complete mechanism-specific guidance, timing and bleeding risk; failure to match these branches does not select single antiplatelet therapy or establish a DAPT contraindication.`,
    source: 'Kleindorfer AHA/ASA Stroke 2021',
    class: 'Modeled screen not met; individualized clinical review'
  };
};

export const computeNeurocheckSchedule = (tpaGivenIsoTime) => {
  const start = parseTimestamp(tpaGivenIsoTime);
  if (!start) return null;
  const checks = [];
  for (let i = 1; i <= 8; i += 1) checks.push({ label: `q15 check #${i}`, at: new Date(start.getTime() + i * 15 * 60 * 1000) });
  for (let i = 1; i <= 12; i += 1) checks.push({ label: `q30 check #${i}`, at: new Date(start.getTime() + (2 * 60 + i * 30) * 60 * 1000) });
  for (let i = 1; i <= 16; i += 1) checks.push({ label: `q1h check #${i}`, at: new Date(start.getTime() + (8 * 60 + i * 60) * 60 * 1000) });
  return { start, checks, end: checks[checks.length - 1].at };
};

export const computeLKWCountdown = (lkwIso, nowMs = Date.now()) => {
  const parsed = parseTimestamp(lkwIso);
  if (!parsed || !Number.isFinite(nowMs) || !Number.isFinite(new Date(nowMs).getTime())) return null;
  const lkw = parsed.getTime();
  if (lkw > nowMs) return null;
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

export const evaluateLargeCoreEVT = (input = {}) => {
  const { age, nihss, aspects, coreMl, timeFromLKWh, premorbidMRS, lvoLocation } = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const [a, n, asp, c, t, pm] = [age, nihss, aspects, coreMl, timeFromLKWh, premorbidMRS].map(reviewedNumber);
  const supplied = value => value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '');
  const malformedImaging = (supplied(aspects) && asp === null) || (supplied(coreMl) && c === null);
  const loc = typeof lvoLocation === 'string' ? lvoLocation.trim().toUpperCase() : '';
  if (![a, n, t, pm].every(Number.isFinite) || t < 0 || a < 18 || !Number.isInteger(n) || n < 0 || n > 42 || !Number.isInteger(pm) || pm < 0 || pm > 6 || !loc || malformedImaging || (!Number.isFinite(asp) && !Number.isFinite(c)) || (Number.isFinite(asp) && (!Number.isInteger(asp) || asp < 0 || asp > 10)) || (Number.isFinite(c) && c < 0)) {
    return { eligible: false, status: 'incomplete', matchingTrials: [], rationale: 'Enter valid age, NIHSS, time, premorbid mRS, vessel, and ASPECTS or core volume before applying this partial large-core trial screen.' };
  }
  if (!['ICA', 'M1', 'ICA-TERMINUS'].includes(loc)) return { eligible: false, status: 'outside-modeled-anatomy', matchingTrials: [], rationale: 'This large-core trial screen models ICA/M1 occlusion. Other vessels require their own evidence and clinical assessment.' };

  const trial = [];
  let eligible = false;
  let bestMatch = null;
  const reasons = [];

  // SELECT2/TESLA used an upper age limit; do not apply it to RESCUE-Japan LIMIT or TENSION.
  const ageOk = a >= 18 && a <= 85;

  // Final publication threshold: NIHSS ≥6 (including LASTE/TESLA). Their registry >6 wording differs; retain the adjudicated final-publication threshold. TENSION used NIHSS <26.
  const nihssOk = n >= 6;
  if (!nihssOk) reasons.push(`NIHSS ${n} <6 (below trial thresholds)`);

  // Premorbid mRS (RESCUE-Japan LIMIT, SELECT2, ANGEL-ASPECT and LASTE ≤1; TENSION ≤2, applied separately below)
  const pmOk = pm <= 1;

  // ASPECTS / core volume tiers
  const aspects35 = Number.isFinite(asp) && asp >= 3 && asp <= 5;
  const aspects02 = Number.isFinite(asp) && asp >= 0 && asp <= 2;
  const core50_70 = Number.isFinite(c) && c >= 50 && c < 70;
  const core70_100 = Number.isFinite(c) && c >= 70 && c <= 100;
  const coreGT100 = Number.isFinite(c) && c > 100;

  // LASTE — ASPECTS 0-2 within 6.5h
  if (aspects02 && t <= 6.5 && nihssOk && a < 80 && pmOk) {
    trial.push('LASTE'); bestMatch = 'LASTE'; eligible = true;
  }
  // RESCUE-Japan LIMIT — ASPECTS 3-5, ≤6h
  if (aspects35 && t <= 6 && nihssOk && a >= 18 && pmOk) {
    trial.push('RESCUE-Japan LIMIT'); bestMatch = bestMatch || 'RESCUE-Japan LIMIT'; eligible = true;
  }
  // TENSION — ASPECTS 3-5, ≤12h
  if (aspects35 && t <= 12 && n < 26 && a >= 18 && pm <= 2) {
    trial.push('TENSION'); bestMatch = bestMatch || 'TENSION'; eligible = true;
  }
  // SELECT-2 — ASPECTS 3-5 OR core ≥50, ≤24h
  if ((aspects35 || (Number.isFinite(c) && c >= 50)) && t <= 24 && nihssOk && ageOk && pmOk) {
    trial.push('SELECT-2'); bestMatch = bestMatch || 'SELECT-2'; eligible = true;
  }
  // ANGEL-ASPECT — ASPECTS 3-5 OR core 70-100, ≤24h
  if ((aspects35 || (aspects02 && core70_100) || (asp > 5 && core70_100 && t >= 6)) && t <= 24 && nihssOk && n <= 30 && a <= 80 && pmOk) {
    trial.push('ANGEL-ASPECT'); bestMatch = bestMatch || 'ANGEL-ASPECT'; eligible = true;
  }
  // TESLA — ASPECTS 2-5 NCCT, ≤24h (note: primary missed Bayesian threshold, trend favorable)
  if (Number.isFinite(asp) && asp >= 2 && asp <= 5 && t <= 24 && nihssOk && ageOk && pmOk) {
    trial.push('TESLA'); bestMatch = bestMatch || 'TESLA';
  }

  // SELECT2 and LASTE did not impose a universal 100-mL upper core limit.
  const beyondTrialRange = false;

  return {
    eligible,
    bestMatch,
    matchingTrials: trial,
    modeledSubsets: { LASTE: 'Only the age <80, ASPECTS 0–2, ≤6.5h subset is modeled here. Other LASTE age/imaging profiles and MRI-selected unknown onset are not evaluated; a missing match is not a trial exclusion.' },
    nihssSourceNote: 'NIHSS ≥6 follows the final LASTE/TESLA publications; registry >6 wording was adjudicated separately.',
    beyondTrialRange,
    aspects: Number.isFinite(asp) ? asp : null,
    coreMl: Number.isFinite(c) ? c : null,
    nihss: Number.isFinite(n) ? n : null,
    timeFromLKWh: t,
    status: eligible ? 'partial-screen-met' : 'screen-not-met',
    rationale: eligible
      ? 'Partial age/severity/imaging/time screen overlaps ' + trial.join(', ') + '. Confirm all remaining imaging exclusions, time definitions, baseline function, and 2026 guideline criteria with the stroke team. This does not establish complete trial or EVT eligibility.' + (coreGT100 ? ' A core above 100 mL is not outside all trial evidence; uncertainty increases with very extensive injury.' : '')
      : 'No modeled positive-trial branch is met. ' + reasons.join('; ') + ' This partial screen is not a contraindication to EVT; review the 2026 guideline and complete imaging.',
    sichCounseling: 'Large-core EVT improves disability outcomes in selected patients, while substantial disability may persist. Symptomatic-hemorrhage rates and definitions differ across trials; use trial-specific absolute risks instead of a pooled 6–7% assumption.',
    guidelineClass: 'Use the 2026 AHA/ASA AIS guideline section 4.7.2 and complete patient criteria; no single recommendation class applies to every large-core profile.',
    sources: 'NEJM 2022 (LIMIT, PMID 35138767); NEJM 2023 (SELECT-2 36762865; ANGEL-ASPECT 36762852); Lancet 2023 (TENSION 37837989); JAMA 2024 (TESLA, PMID 39374319); NEJM 2024 (LASTE 38718358)'
  };
};
