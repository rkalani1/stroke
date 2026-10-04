// Preserved protocol surface extracted from the committed application.
// Clinical literals, source-defined rules, and modal wording are unchanged.
import React, { useEffect, useMemo, useState } from 'react';
import { useCurrentTime } from './use-current-time.js';
import { PocketCards, useProtocolCaseState } from './pocket-cards.jsx';
import { getLocalInstitutionalContent, GENERALIZABILITY_LIMITATIONS, ICH_INITIAL_EVALUATION_ALGORITHM, isSuccessfulEvtReperfusion } from './institutional-protocols.js';
import { AIS_COMMAND_CENTER_CARDS, AIS_SOURCE_LINKS, AIS_COMMAND_CENTER_LAST_REVIEWED } from './management-guidance.js';
import { recommendations, resolveClaimsWithCitations, citationLink } from './evidence-encounter.js';
import { elapsedEncounterTime } from './clinical/encounter-time.js';
import { createIcons, icons } from './lucide-subset.js';
import { revealProtocolElement, revealProtocolTarget } from './protocol-navigation.js';

// Scroll a protocol panel into view once React has mounted it; the new panel can take more than
// one frame to appear, and its id differs from the old panel's, so wait for it (about 0.5 s at most).
function revealManagementPanel(id) {
  let tries = 0;
  const step = () => {
    const panel = document.getElementById(`mgmt-tabpanel-${id}`);
    if (panel && typeof panel.scrollIntoView === 'function') panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (tries++ < 30) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export const TELESTROKE_MAP_LINK = Object.freeze({ label: 'Telestroke Map', url: 'https://rkalani1.github.io/telestroke-expansion-map/' });
const MANAGEMENT_SUBTABS = ['ich', 'ischemic'];
const evidenceRecommendationsMap = new Map(recommendations.map(record => [record.id, record]));
const getEvidenceRecommendationsMap = () => evidenceRecommendationsMap;
const DEFAULT_VOLUME = Object.freeze({ a: '', b: '', thicknessMm: '', numSlices: '' });
const DEFAULT_EVT = Object.freeze({ population: 'adult', occlusion: '', timeWindow: 'auto', aspects: '', mrs: '', nihss: '', pcAspects: '', age: '', massEffect: '', coreVolume: '', mismatchRatio: '', mismatchVolume: '', ctpMismatch: false, disablingDeficit: false });
          const GUIDELINE_CLASS_COLORS = {
            I: 'bg-ok-600 text-white',
            // cobalt-500 brightens to ~#149eb0 in dark → white drops to 3.2:1;
            // darken the IIa fill in dark so the white label clears AA (9.1:1).
            IIa: 'bg-cobalt-500 text-white dark:bg-cobalt-700',
            IIb: 'bg-warn-700 text-white',
            // III: Harm (crit red) is visually distinct from III: No Benefit
            // (slate) — the two carry different clinical meaning.
            III: 'bg-crit-600 text-white',
            'III-harm': 'bg-crit-600 text-white',
            'III-no-benefit': 'bg-slate-600 text-white',
            'N/A': 'bg-slate-500 text-white',
            Statement: 'bg-slate-500 text-white',
            // GRADE (ESO / NCS / WSO). Those bodies do not grade with ACC/AHA
            // classes; strength lives here and certainty renders beside it.
            Strong: 'bg-ok-600 text-white',
            'Strong-against': 'bg-crit-600 text-white',
            Conditional: 'bg-cobalt-500 text-white dark:bg-cobalt-700',
            'Conditional-against': 'bg-warn-700 text-white',
            'Expert Consensus': 'bg-slate-600 text-white'
          };
        const parseBloodPressure = (bpString) => {
          if (!bpString) return null;
          const match = bpString.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
          if (!match) return null;
          return {
            systolic: parseInt(match[1], 10),
            diastolic: parseInt(match[2], 10)
          };
        };

          function getPerfusionMetrics(source) {
            const coreRaw = source?.coreVolume ?? source?.ctpStructured?.coreVolume;
            const penumbraRaw = source?.penumbraVolume ?? source?.ctpStructured?.penumbraVolume;
            const ratioRaw = source?.mismatchRatio ?? source?.ctpStructured?.mismatchRatio;
            const core = parseFloat(coreRaw);
            const penumbra = parseFloat(penumbraRaw);
            const ratioDirect = parseFloat(ratioRaw);
            const mismatchVolume = !Number.isNaN(core) && !Number.isNaN(penumbra) ? penumbra - core : null;
            const ratioDerived = !Number.isNaN(core) && core > 0 && !Number.isNaN(penumbra) ? penumbra / core : null;
            const mismatchRatio = Number.isNaN(ratioDirect) ? ratioDerived : ratioDirect;
            return {
              coreVolume: Number.isNaN(core) ? null : core,
              penumbraVolume: Number.isNaN(penumbra) ? null : penumbra,
              mismatchVolume: mismatchVolume === null || Number.isNaN(mismatchVolume) ? null : mismatchVolume,
              mismatchRatio: mismatchRatio === null || Number.isNaN(mismatchRatio) ? null : mismatchRatio
            };
          }


// Keep this component mounted during ordinary navigation (hidden by the shell)
// so protocol-only builder inputs and PocketCards remain in session. Remount at
// an explicit New encounter boundary with the same case epoch as Encounter.
export default function ProtectedProtocols({
  telestrokeNote = {},
  nihssScore = 0, consultationType = 'telephone', pocketCardsCaseEpoch = 0, encounter,
  managementSubTab = 'ischemic', setManagementSubTab,
  ichVolumeParams: sharedVolumeParams, setIchVolumeParams: setSharedVolumeParams,
  navigateTo, setEncounterPhase = () => {}, setTrialsCategory = () => {},
  scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  timeFromLKW, ichVolumeEstimate: sharedVolumeEstimate, active = true,
}) {
  const [localVolumeParams, setLocalVolumeParams] = useState({ ...DEFAULT_VOLUME });
  const ichVolumeParams = sharedVolumeParams || localVolumeParams;
  const setIchVolumeParams = setSharedVolumeParams || setLocalVolumeParams;
  const exactScore = value => {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value.trim()))) return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  };
  const aspects = exactScore(encounter?.anterior?.aspectsScore);
  const mrs = exactScore(encounter?.anterior?.preMRS);
  const pcAspects = exactScore(encounter?.basilar?.pcAspects);
  const evtCanonical = encounter ? {
    age: encounter.anterior.age,
    nihss: encounter.anterior.nihss,
    aspects: aspects === null || aspects < 0 || aspects > 10 ? '' : aspects >= 6 ? '6-10' : aspects >= 3 ? '3-5' : '0-2',
    mrs: mrs === null || mrs < 0 || mrs > 6 ? '' : mrs <= 1 ? '0-1' : mrs === 2 ? '2' : mrs <= 4 ? '3-4' : '5-6',
    pcAspects: pcAspects === null || pcAspects < 0 || pcAspects > 10 ? '' : pcAspects >= 6 ? '>=6' : '<6',
    coreVolume: encounter.anterior.coreVolume,
    massEffect: encounter.anterior.massEffect === true ? 'present' : encounter.anterior.massEffect === false ? 'none' : '',
    disablingDeficit: encounter.ivt.disablingDeficit,
  } : {};
  const builderEncounter = encounter ? { ...encounter, onChange: (key, value) => {
    const aliases = { disablingDeficit: 'disablingDeficit', age: 'age', coreVolume: 'coreVolume', massEffect: 'massEffect' };
    if (aliases[key]) encounter.onChange?.(aliases[key], key === 'massEffect' ? value === '' ? null : value === 'present' : value);
  } } : undefined;
  const [evtDecisionInputs, setEvtField] = useProtocolCaseState({ ...DEFAULT_EVT }, builderEncounter, evtCanonical, ['nihss', 'aspects', 'mrs', 'pcAspects']);
  const setEvtDecisionInputs = update => {
    const next = typeof update === 'function' ? update(evtDecisionInputs) : update;
    for (const [key, value] of Object.entries(next)) {
      if (!Object.is(evtDecisionInputs[key], value)) setEvtField(key, value);
    }
  };
  const [protocolModal, setProtocolModal] = useState(null);
  // The BP phase and spot check are protocol-local reference inputs. Writing them
  // into the canonical note would change the shared source key and silently clear
  // pocket-card attestations and the generated note.
  const [bpPhase, setBpPhase] = useState('pre-tnk');
  const [bpProtocolCheck, setBpProtocolCheck] = useState(null);
  const [currentTime] = useCurrentTime(active && timeFromLKW === undefined);
  useEffect(() => {
    if (!encounter) setEvtDecisionInputs({ ...DEFAULT_EVT });
    setLocalVolumeParams({ ...DEFAULT_VOLUME });
    setProtocolModal(null);
    setBpPhase('pre-tnk');
    setBpProtocolCheck(null);
  }, [pocketCardsCaseEpoch]);
  const jumpToSection = (id) => {
    const element = document.getElementById(id);
    if (element) revealProtocolElement(element, { behavior: 'smooth' });
  };
  const calculateTimeFromLKW = () => {
    if (timeFromLKW !== undefined) return timeFromLKW;
    const prefix = telestrokeNote.lkwUnknown ? 'discovery' : 'lkw';
    const date = telestrokeNote[`${prefix}Date`];
    const clock = telestrokeNote[`${prefix}Time`];
    if (!date || !clock) return null;
    return elapsedEncounterTime({ time: new Date(`${date}T${clock}`), label: telestrokeNote.lkwUnknown ? 'Discovery' : 'LKW' }, new Date(currentTime));
  };
  const bpPhaseTargets = {
    'pre-tnk': { label: 'Pre-lysis', systolic: 185, diastolic: 110 },
    'post-tnk': { label: 'Post-TNK', systolic: 180, diastolic: 105 },
    'post-evt': { label: 'Post-EVT', systolic: 180, diastolic: 105, systolicLow: 140, systolicHigh: 180 },
  };
          const localVolumeEstimate = useMemo(() => {
            const { a, b, thicknessMm, numSlices } = ichVolumeParams;
            const aVal = parseFloat(a);
            const bVal = parseFloat(b);
            const tVal = parseFloat(thicknessMm);
            const nVal = parseFloat(numSlices);
            if ([a, b, thicknessMm, numSlices].some(value => String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) <= 0)) return null;
            if ([aVal, bVal, tVal, nVal].some(val => !Number.isFinite(val) || val <= 0)) return null;
            const cCm = (tVal / 10) * nVal;
            const vol = (aVal * bVal * cCm) / 2;
            if (!Number.isFinite(vol) || vol <= 0) return null;
            const oversized = aVal > 15 || bVal > 15 || cCm > 15 || vol > 500;
            return {
              value: vol,
              display: vol.toFixed(1),
              exceeds15: vol >= 15,
              exceeds30: vol >= 30,
              unitWarning: oversized
                ? '⚠ Inputs look unusually large — confirm dimensions are in CENTIMETERS (not mm). Verify before acting on the volume threshold.'
                : null
            };
          }, [ichVolumeParams]);
  const ichVolumeEstimate = sharedVolumeEstimate === undefined ? localVolumeEstimate : sharedVolumeEstimate;
          const ischemicBpPhaseKeys = ['pre-tnk', 'post-tnk', 'post-evt'];
          const currentBpPhase = ischemicBpPhaseKeys.includes(bpPhase) ? bpPhase : 'pre-tnk';
          const currentBpTarget = bpPhaseTargets[currentBpPhase] || bpPhaseTargets['pre-tnk'];
          // Prefill from the Encounter BP until the clinician enters a spot check.
          const bpCheckValue = bpProtocolCheck ?? (telestrokeNote.presentingBP || '');
          const currentBpReading = parseBloodPressure(bpCheckValue);
          const bpOrderInvalid = Boolean(currentBpReading) && currentBpReading.systolic <= currentBpReading.diastolic;
          const documentedPostEvtGrade = telestrokeNote.ticiScore || '';
          const postEvtSourceTargetApplies = isSuccessfulEvtReperfusion(documentedPostEvtGrade);
          // Post-EVT: every EVT keeps BP <=180/105 for 24 h (AHA/ASA 2026 COR 2a,
          // LOE B-NR); after documented mTICI >=2b the institutional SBP floor of 140
          // also applies (intensive lowering below 140 is harmful, COR 3: Harm, LOE A).
          const bpWithinTarget = currentBpReading && !bpOrderInvalid
            ? currentBpPhase === 'post-evt'
              ? currentBpReading.systolic <= currentBpTarget.systolicHigh && currentBpReading.diastolic <= currentBpTarget.diastolic && (!postEvtSourceTargetApplies || currentBpReading.systolic >= currentBpTarget.systolicLow)
              : currentBpReading.systolic < currentBpTarget.systolic && currentBpReading.diastolic < currentBpTarget.diastolic
            : null;
          const protocolDetailMap = useMemo(() => ({
            PCC: {
              title: '4F-PCC (Kcentra)',
              dosing: 'PCC (Kcentra) 2000 units IV — infuse immediately. Institutional fixed dose, not weight- or INR-tiered.',
              note: 'Give vitamin K 10 mg IV immediately. Check PT/INR at exactly 30 minutes, then every 6 hours for 24 hours. If INR >1.5 after the infusion, page hematology and consider PCC 500 units or plasma 2-4 units. If INR >1.5 at 24 hours, repeat vitamin K 10 mg IV. A fixed 2000-unit dose may underdose heavier or high-INR patients; Kcentra label dosing is INR 2-<4: 25 units/kg (max 2500); INR 4-6: 35 units/kg (max 3500); INR >6: 50 units/kg (max 5000).'
            },
            PCC_DOAC: {
              title: '4F-PCC for DOAC Reversal',
              dosing: 'PCC (Kcentra) 2000 units IV (institutional fixed dose; NCS/SCCM suggests 50 units/kg). Consider ONLY if no contraindications.',
              note: 'For dabigatran, use only if idarucizumab is unavailable. For rivaroxaban, apixaban, or edoxaban (institutional trigger): reverse if the last dose was <24 h ago, timing is unknown, or renal impairment is present, or if the anti-Xa/Xa screen is elevated (NCS/SCCM 2016: within 3–5 half-lives of the last dose); do not wait for the assay when ingestion is recent. Andexanet alfa (Andexxa) is no longer marketed in the US (withdrawn December 2025); the NCS/SCCM 2026 update suggests 4F-PCC rather than andexanet for factor Xa inhibitor-associated ICH (conditional recommendation, moderate certainty).'
            },
            VITK: {
              title: 'Vitamin K',
              dosing: '10 mg IV — give immediately for all warfarin patients.',
              note: 'Repeat 10 mg IV over 30 min if INR >1.5 at 24 h after PCC or plasma.'
            },
            IDA: {
              title: 'Idarucizumab (Praxbind)',
              dosing: '5 g IV total: two 2.5 g doses, ≤15 min apart, each infused over 5-10 min.',
              note: 'Specific reversal for dabigatran. If unavailable → consider 4F-PCC 2000 units IV.'
            },
            FFP: {
              title: 'Fresh Frozen Plasma (FFP)',
              dosing: 'If PCC is unavailable or contraindicated, prepare and transfuse 4 units emergency-release plasma immediately and request 4 additional units. The ideal plasma dose is 15 mL/kg; each unit is 250-300 mL.',
              note: 'Repeat the STAT emergency stroke panel after the infusion and INR every 6 hours for 24 hours. If INR remains >1.5, administer 4 more units of plasma and consult the hematology attending.'
            },
            CHARCOAL: {
              title: 'Activated Charcoal',
              dosing: 'One dose orally if DOAC ingestion <2 hours ago.',
              note: 'Use for dabigatran, rivaroxaban, apixaban, or edoxaban.'
            },
            CRYO: {
              title: 'Cryoprecipitate',
              dosing: '2 pre-pooled units of cryoprecipitate (each pool ≈5 single-donor units; total ≈10 units) IV over 10-30 minutes.',
              note: 'Follow the CT-result and delayed-CT branches in the institutional post-thrombolytic hemorrhage algorithm.'
            },
            TXA: {
              title: 'Tranexamic Acid (TXA)',
              dosing: 'Tranexamic acid 1000 mg IV over 10 min STAT',
              note: 'For post-thrombolytic ICH: confirm intracranial blood on CT with the ordering provider, then verbally confirm with the RN that administration is post-CT before giving TXA.'
            },
            METHYLPRED: {
              title: 'Methylprednisolone',
              dosing: '125 mg IV (for angioedema).',
              note: 'Part of the institutional orolingual-angioedema sequence.'
            },
            METHYLPRED_CONTRAST: {
              title: 'Methylprednisolone — Contrast Premedication',
              dosing: '40 mg IV immediately before the contrast study.',
              note: 'Use as the institutional alternative to hydrocortisone 200 mg IV, together with diphenhydramine 50 mg IV.'
            },
            DIPHEN: {
              title: 'Diphenhydramine',
              dosing: '50 mg IV.',
              note: 'For angioedema management and contrast allergy premedication.'
            },
            EPI: {
              title: 'Epinephrine',
              dosing: 'Epinephrine (0.1%, 1 mg/mL) 0.3 mL subcutaneously. Nebulized for upper airway edema: 0.5 mL of the same 0.1% solution.',
              note: 'Give when the edema further increases.'
            },
            ICATIBANT: {
              title: 'Icatibant',
              dosing: '30 mg subcutaneously, once (1 dose).',
              note: 'Standard step in the post-thrombolytic orolingual angioedema sequence. Attending approval is required; document the approving attending at the point of care.'
            },
            BERINERT: {
              title: 'C1 Esterase Inhibitor (Berinert)',
              dosing: '20 IU/kg IV. MUST be administered by slow IV push at a rate of 4 mL/min.',
              note: 'Plasma-derived C1 esterase inhibitor. Not part of the current post-thrombolytic orolingual angioedema sequence, which ends at icatibant 30 mg SC; use is restricted to pregnant or pediatric patients, or those intolerant to icatibant.'
            },
            HYDROCORT: {
              title: 'Hydrocortisone',
              dosing: '200 mg IV (OR Methylprednisolone 40 mg IV).',
              note: 'Institutional contrast-allergy premedication for suspected LVO. Give immediately before the contrast study with diphenhydramine 50 mg IV. Excludes known contrast-related anaphylaxis.'
            },
            FAMOTIDINE: {
              title: 'Famotidine',
              dosing: 'Famotidine 20 mg IV.',
              note: 'Give with diphenhydramine as part of the institutional orolingual-angioedema sequence.'
            },
            PROT1: {
              title: 'Protamine (UFH)',
              classOfRec: 'Class IIa',
              dosing: 'Protamine 1 mg per 100 units of UFH given in the prior 2-3 hours (max 50 mg) by slow IV injection over about 10 minutes. If the aPTT remains elevated, consider repeat protamine 0.5 mg per 100 units of UFH. (COR 2a, LOE C-LD)',
              note: 'Dosing per NCS/SCCM 2016 (PMID 26714677). Check aPTT/anti-Xa after infusion. If platelets <100K, send HIT antibodies and consult Hematology if positive.'
            },
            PROT2: {
              title: 'Protamine (LMWH)',
              classOfRec: 'Class IIb',
              dosing: 'Enoxaparin within 8 h: protamine 1 mg per 1 mg enoxaparin (max 50 mg). Enoxaparin 8-12 h: protamine 0.5 mg per 1 mg enoxaparin. Dalteparin or tinzaparin: protamine 1 mg per 100 anti-Xa units given within 3-5 half-lives (max 50 mg). (COR 2b, LOE C-LD; protamine only partially reverses LMWH)',
              note: 'Dosing per NCS/SCCM 2016 (PMID 26714677). After 3-5 half-lives protamine is probably not needed.'
            },
            NICARDIPINE: {
              title: 'Nicardipine (Cardene)',
              dosing: 'Start 5 mg/hr IV. Titrate by 2.5 mg/hr every 5-15 min. Max 15 mg/hr.',
              note: 'Preferred continuous infusion for stroke BP management. Onset 5-15 min. Avoid in severe aortic stenosis or advanced heart failure.'
            },
            LABETALOL: {
              title: 'Labetalol',
              dosing: '10-20 mg IV over 1-2 min. May repeat every 10-20 min. Max 300 mg total. Infusion: 2-8 mg/min.',
              note: 'Combined alpha/beta blocker. Avoid in asthma/COPD, bradycardia, 2nd/3rd-degree heart block, decompensated HF. Hold if HR <60.'
            },
            LEVETIRACETAM: {
              title: 'Levetiracetam (Keppra)',
              dosing: '500-1000 mg IV/PO q12h. Load: 1000-2000 mg IV for acute seizure; status epilepticus: 60 mg/kg IV (max 4500 mg).',
              note: 'For SAH seizure prophylaxis (if cortical SAH, IVH, poor-grade HH 3-5, or seizure at onset). Limit prophylaxis to 3-7 days; avoid prolonged routine use. Renal adjust: CrCl <30 → reduce dose 50%.'
            },
            NIMODIPINE: {
              title: 'Nimodipine (Nymalize)',
              dosing: '60 mg PO/NG q4h x 21 days. Start within 96h of SAH onset.',
              note: 'Calcium channel blocker for SAH vasospasm prevention. Only proven agent to improve outcomes. If hypotension: split the dose to 30 mg q2h (same 360 mg/day total while reducing peak levels). Do NOT give IV (risk of severe hypotension/cardiac arrest).'
            }
          }), []);

          const getEvtEligibilityRecommendation = (inputs, timeFromLKW) => {
            const occlusion = inputs.occlusion;
            const aspects = inputs.aspects;
            const mrs = inputs.mrs;
            const nihss = parseInt(inputs.nihss, 10);
            const pcAspects = inputs.pcAspects;
            const rawAge = String(inputs.age ?? '').trim();
            const age = /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(rawAge) ? Number(rawAge) : Number.NaN;
            const coreInput = parseFloat(inputs.coreVolume);
            const coreVolume = Number.isNaN(coreInput) ? null : coreInput;
            const noMassEffect = inputs.massEffect === 'none';
            const ctpMismatch = inputs.ctpMismatch === true;

            const resolveWindow = () => {
              if (inputs.timeWindow && inputs.timeWindow !== 'auto') return inputs.timeWindow;
              if (telestrokeNote.lkwUnknown) return 'unknown';
              if (!timeFromLKW) return 'unknown';
              if (timeFromLKW.futureWarning) return 'unknown';
              if (timeFromLKW.total <= 6) return '0-6';
              if (timeFromLKW.total <= 24) return '6-24';
              return '>24';
            };

            const window = resolveWindow();
            const result = { classOfRec: '—', label: 'No institutional EVT tier', color: 'slate', rationale: [] };

            if (!Number.isFinite(age)) {
              return {
                ...result,
                label: 'Enter adult age',
                color: 'amber',
                rationale: ['A valid adult age is required before this adult EVT evaluator can return a vessel-specific result.']
              };
            }

            if (age < 18) {
              return {
                ...result,
                label: 'Adult EVT algorithm does not apply',
                color: 'amber',
                rationale: ['Age is under 18. Use the separately governed pediatric pathway; this adult evaluator cannot return a vessel-specific result.']
              };
            }

            if (!occlusion) {
              return { ...result, label: 'Select occlusion', color: 'amber' };
            }
            if (window === 'unknown') {
              return { ...result, label: 'Set LKW or select time window', color: 'amber' };
            }

            if (['mvo-nondominant', 'aca', 'pca'].includes(occlusion)) {
              return {
                classOfRec: 'III: No Benefit / A',
                label: 'No EVT',
                color: 'rose',
                rationale: ['EVT is not recommended for nondominant M2, ACA, and PCA occlusions (AHA/ASA 2026, COR 3: No Benefit, LOE A).']
              };
            }

            if (occlusion === 'mvo-codominant') {
              return {
                classOfRec: 'III: No Benefit / A',
                label: 'No EVT',
                color: 'rose',
                rationale: ['EVT is not recommended for codominant M2 occlusion (AHA/ASA 2026, COR 3: No Benefit, LOE A; ESCAPE-MeVO and DISTAL showed no functional benefit). ORIENTAL-MeVO (2026, after the guideline) reported benefit with NIHSS ≥6; individualize only with the neurointerventional team.']
              };
            }

            if (occlusion === 'mvo-dominant') {
              if (Number.isNaN(nihss) || nihss < 0 || nihss > 42) {
                return { ...result, label: 'Enter valid NIHSS', color: 'amber', rationale: ['NIHSS must be between 0 and 42.'] };
              }
              if (mrs !== '0-1' || aspects !== '6-10' || Number.isNaN(nihss) || nihss < 6) {
                return { ...result, rationale: ['Dominant proximal M2 requires baseline mRS 0-1, ASPECTS ≥6, and NIHSS ≥6.'] };
              }
              if (window === '0-6') {
                return { classOfRec: 'IIa / B-NR', label: 'EVT', color: 'emerald', rationale: ['Dominant proximal M2 within 0-6 hours.'] };
              }
              if (window === '6-24') {
                if (!ctpMismatch) {
                  return { classOfRec: 'Pending', label: 'Confirm CTP mismatch', color: 'amber', rationale: ['The 6-24-hour dominant-M2 institutional tier also requires CTP hypoperfusion-hypodensity mismatch.'] };
                }
                return { classOfRec: 'Institutional tier', label: 'EVT', color: 'amber', rationale: ['Dominant proximal M2 at 6-24 hours with the required CTP hypoperfusion-hypodensity mismatch confirmed (institutional tier; no AHA/ASA 2026 grade for 6-24 h).'] };
              }
              return result;
            }

            if (occlusion === 'basilar') {
              if (Number.isNaN(nihss) || nihss < 0 || nihss > 42) {
                return { ...result, label: 'Enter valid NIHSS', color: 'amber', rationale: ['NIHSS must be between 0 and 42.'] };
              }
              if ((window === '0-6' || window === '6-24') && pcAspects === '>=6') {
                if (mrs === '0-1' && !Number.isNaN(nihss)) {
                  if (nihss >= 10) {
                    return { classOfRec: 'I / A', label: 'EVT', color: 'emerald', rationale: ['Basilar occlusion within 24 hours, PC-ASPECTS ≥6, NIHSS ≥10, baseline mRS 0-1.'] };
                  }
                  if (nihss >= 6) {
                    return { classOfRec: 'IIb / B-R', label: 'EVT effectiveness not well established', color: 'amber', rationale: ['Basilar occlusion within 24 hours, PC-ASPECTS ≥6, NIHSS 6-9, baseline mRS 0-1.'] };
                  }
                }
              }
              return result;
            }

            if (occlusion === 'lvo') {
              if (window === '>24') return result;
              if (Number.isNaN(nihss)) return { ...result, label: 'Enter NIHSS', color: 'amber', rationale: ['The institutional anterior-LVO pathway requires NIHSS ≥6.'] };
              if (nihss < 0 || nihss > 42) return { ...result, label: 'Enter valid NIHSS', color: 'amber', rationale: ['NIHSS must be between 0 and 42.'] };
              if (nihss < 6) return { ...result, rationale: ['The entered NIHSS does not meet the institutional NIHSS ≥6 gate.'] };

              if (window === '0-6') {
                if (aspects === '6-10') {
                  if (mrs === '0-1') return { classOfRec: 'I / A', label: 'EVT', color: 'emerald', rationale: ['0-6 hours, ASPECTS 6-10, baseline mRS 0-1.'] };
                  if (mrs === '2') return { classOfRec: 'IIa / B-NR', label: 'EVT', color: 'emerald', rationale: ['0-6 hours, ASPECTS 6-10, baseline mRS 2.'] };
                  if (mrs === '3-4') return { classOfRec: 'IIb / B-NR', label: 'EVT', color: 'amber', rationale: ['0-6 hours, ASPECTS 6-10, baseline mRS 3-4.'] };
                  return result;
                }
                if (aspects === '3-5') {
                  if (mrs === '0-1' && noMassEffect) return { classOfRec: 'I / A', label: 'EVT', color: 'emerald', rationale: ['0-6 hours, ASPECTS 3-5, no significant mass effect.'] };
                  if (inputs.massEffect === '') return { classOfRec: 'Pending', label: 'Confirm mass-effect status', color: 'amber', rationale: ['The ASPECTS 3-5 tier requires no significant mass effect.'] };
                  return result;
                }
                if (aspects === '0-2') {
                  const commonGates = mrs === '0-1' && Number.isFinite(age) && age >= 18 && age < 80 && noMassEffect && coreVolume !== null && coreVolume >= 0;
                  if (commonGates && coreVolume <= 70) return { classOfRec: 'IIa / B-R', label: 'EVT', color: 'amber', rationale: [`0-6 hours, ASPECTS 0-2, age ${age}, no significant mass effect, and CTP core ${coreVolume} mL at or below the unambiguous 70 mL boundary printed in the source.`] };
                  if (commonGates && coreVolume <= 100) return { classOfRec: 'Pending', label: 'Owner adjudication required', color: 'amber', rationale: ['The institutional flowchart prints a core range of ≤70-100 mL without an executable threshold for 71-100 mL. No eligibility result is selected.'] };
                  return { classOfRec: 'Pending', label: 'Complete low-ASPECTS qualifiers', color: 'amber', rationale: ['This tier requires baseline mRS 0-1, age <80, no significant mass effect, and the source-listed CTP core threshold of ≤70-100 mL.'] };
                }
              }

              if (window === '6-24') {
                if (aspects === '6-10' && mrs === '0-1') {
                  return { classOfRec: 'I / A', label: 'EVT', color: 'emerald', rationale: ['6-24 hours, ASPECTS 6-10, baseline mRS 0-1.'] };
                }
                if (aspects === '3-5' && mrs === '0-1') {
                  if (Number.isFinite(age) && age < 80 && noMassEffect) return { classOfRec: 'I / A', label: 'EVT', color: 'emerald', rationale: [`6-24 hours, ASPECTS 3-5, age ${age}, no significant mass effect.`] };
                  return { classOfRec: 'Pending', label: 'Complete large-core qualifiers', color: 'amber', rationale: ['This tier requires age <80 and no significant mass effect.'] };
                }
                return result;
              }
            }

            return result;
          };


  useEffect(() => { if (!active) setProtocolModal(null); }, [active]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => createIcons({ icons }));
    return () => cancelAnimationFrame(frame);
  }, [managementSubTab, protocolModal]);
  useEffect(() => {
    if (!protocolModal) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    const dialog = document.querySelector('[aria-labelledby="protocol-modal-title"]');
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setProtocolModal(null); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const controls = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (!dialog.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    const frame = requestAnimationFrame(() => dialog?.querySelector('button')?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [protocolModal]);
  return <>
              {protocolModal && (
                <div className="clinician-only fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="protocol-modal-title" onClick={() => setProtocolModal(null)}>
                  <div className="w-full max-w-lg bg-white rounded-md shadow-xl border border-line dark:bg-card" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-line">
                      <div>
                        <h3 id="protocol-modal-title" className="text-lg font-semibold text-slate-900 dark:text-ink">{protocolModal.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-mute">{protocolModal.classOfRec}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProtocolModal(null)}
                        className="text-slate-500 hover:text-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg focus:ring-2 focus:ring-cobalt-500 dark:text-mute dark:hover:text-ink"
                        aria-label="Close protocol"
                      >
                        <i aria-hidden="true" data-lucide="x" className="w-5 h-5"></i>
                      </button>
                    </div>
                    <div className="p-4 space-y-3 text-sm text-slate-700 dark:text-ink-2">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-ink">Dosing</p>
                        <p>{protocolModal.dosing}</p>
                      </div>
                      {protocolModal.classOfRec && (
                        <div className="text-xs text-cobalt-700 bg-cobalt-50 border border-cobalt-200 rounded-lg p-2 dark:text-cobalt-300 dark:bg-cobalt-900 dark:border-cobalt-700">
                          {protocolModal.classOfRec}
                        </div>
                      )}
                      {protocolModal.note && (
                        <div className="bg-slate-50 border border-line rounded-lg p-3 text-xs text-slate-600 dark:bg-paper-2 dark:text-ink-2">
                          {protocolModal.note}
                        </div>
                      )}
                    </div>
                    <div className="text-center text-xs text-slate-600 pb-2 dark:text-ink-2">Press Esc or click outside to close</div>
                  </div>
                </div>
              )}
                  <div id="tabpanel-protocols" role="region" aria-label="Protocols &amp; Algorithms" className="space-y-6">
                    <h1 className="sr-only">Protocols &amp; Algorithms</h1>
                    {/* ===== NON-PUBLIC EXTENSION LAYER =====
                        Rendered only when a local extension populates
                        window.__INSTITUTIONAL_LOCAL__ before app.js loads.
                        Zero output on the public/deployed build. */}
                    {(() => {
                      const localInst = getLocalInstitutionalContent();
                      if (!localInst) return null;
                      return (
                        <div className="border-2 border-warn-400 rounded-lg overflow-hidden" aria-label="Institutional protocols — local only">
                          {/* Header badge */}
                          <div className="bg-warn-400 px-4 py-2 flex items-center gap-2">
                            <i aria-hidden="true" data-lucide="lock" className="w-4 h-4 text-warn-900 flex-shrink-0 dark:text-warn-300"></i>
                            <span className="font-semibold text-warn-900 text-sm dark:text-warn-300">
                              Institutional (local — not public)
                            </span>
                            <span className="ml-2 text-warn-800 text-xs font-mono bg-warn-200 rounded px-1.5 py-0.5 dark:bg-warn-950 dark:text-warn-300">
                              {localInst.institutionName}
                            </span>
                            {localInst.lastUpdated && (
                              <span className="ml-auto text-warn-700 text-xs dark:text-warn-300">
                                Updated: {localInst.lastUpdated}
                              </span>
                            )}
                          </div>
                          {/* Sections */}
                          <div className="bg-warn-50 divide-y divide-warn-200 dark:bg-warn-950">
                            {localInst.sections.map((section) => (
                              <div key={section.id} className="px-4 py-3">
                                <h3 className="font-semibold text-warn-900 text-sm mb-2 dark:text-warn-300">{section.title}</h3>
                                {section.subsections && section.subsections.map((sub, si) => (
                                  <div key={si} className="mb-2 last:mb-0">
                                    {sub.heading && (
                                      <p className="text-xs font-semibold text-warn-800 uppercase tracking-wide mb-1 dark:text-warn-300">{sub.heading}</p>
                                    )}
                                    <ul className="space-y-0.5">
                                      {sub.items && sub.items.map((item, ii) => (
                                        <li key={ii} className="text-sm text-warn-900 flex gap-2 dark:text-warn-300">
                                          <span className="text-warn-500 flex-shrink-0 mt-0.5" aria-hidden="true">•</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            ))}
                            {/* Contacts */}
                            {Array.isArray(localInst.contacts) && localInst.contacts.length > 0 && (
                              <div className="px-4 py-3">
                                <h3 className="font-semibold text-warn-900 text-sm mb-2 dark:text-warn-300">On-Call Contacts</h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                  {localInst.contacts.map((c, ci) => (
                                    <div key={ci} className="flex gap-2 text-sm">
                                      <dt className="text-warn-700 font-medium flex-shrink-0 dark:text-warn-300">{c.role}:</dt>
                                      <dd className="text-warn-900 dark:text-warn-300">{c.contact}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            )}
                            {/* Disclaimer */}
                            {localInst.disclaimer && (
                              <div className="px-4 py-2 bg-warn-100 dark:bg-warn-900">
                                <p className="text-xs text-warn-700 italic dark:text-warn-300">{localInst.disclaimer}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Contextual guidance based on diagnosis */}
                    {!telestrokeNote.diagnosisCategory && (
                      <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between dark:bg-cobalt-900 dark:border-cobalt-700">
                        <div className="flex items-start gap-3">
                        <i aria-hidden="true" data-lucide="info" className="w-5 h-5 text-cobalt-600 mt-0.5 flex-shrink-0 dark:text-cobalt-300"></i>
                        <div className="text-sm text-cobalt-800 dark:text-cobalt-300">
                          <strong>No diagnosis set.</strong> Set a working diagnosis on the Encounter tab to activate pathway-specific management recommendations and auto-populate relevant protocols.
                        </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateTo('encounter')}
                          className="inline-flex shrink-0 items-center justify-center rounded-md bg-cobalt-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cobalt-700"
                        >
                          Set diagnosis
                        </button>
                      </div>
                    )}
                    {telestrokeNote.diagnosisCategory === 'ischemic' && managementSubTab === 'ich' && (
                      <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg px-4 py-2 text-sm text-cobalt-800 flex items-start gap-2 dark:bg-cobalt-900 dark:border-cobalt-700 dark:text-cobalt-300">
                        <i aria-hidden="true" data-lucide="arrow-right" className="w-4 h-4 mt-0.5 shrink-0"></i>
                        <span className="min-w-0">Current diagnosis is <strong>ischemic stroke</strong> — the <button onClick={() => setManagementSubTab('ischemic')} className="underline font-semibold hover:text-cobalt-900">Ischemic Stroke</button> tab may be more relevant.</span>
                      </div>
                    )}
                    {telestrokeNote.diagnosisCategory === 'ich' && managementSubTab === 'ischemic' && (
                      <div className="bg-crit-50 border border-crit-200 rounded-lg px-4 py-2 text-sm text-crit-800 flex items-start gap-2 dark:bg-crit-950 dark:border-crit-800 dark:text-crit-300">
                        <i aria-hidden="true" data-lucide="arrow-right" className="w-4 h-4 mt-0.5 shrink-0"></i>
                        <span className="min-w-0">Current diagnosis is <strong>ICH</strong> — the <button onClick={() => setManagementSubTab('ich')} className="underline font-semibold hover:text-crit-900">ICH Management</button> tab may be more relevant.</span>
                      </div>
                    )}
                    {/* v6.0-08: sticky breadcrumb on top of the management
                        sub-tab pill row. Renders Management › <Sub-tab> · the
                        active label, mono uppercase eyebrow style. The
                        sub-tab list below is also sticky and stacks
                        underneath. */}
                    {(() => {
                      const subTabLabels = {
                        ich: 'ICH', ischemic: 'Ischemic/TIA'
                      };
                      const activeLabel = subTabLabels[managementSubTab] || managementSubTab;
                      return (
                        <nav
                          className="protocol-breadcrumb bg-paper-2 border border-line border-b-0 rounded-md rounded-b-none px-3 h-9 flex items-center sticky top-[var(--case-bar-h,0px)] z-40"
                          aria-label="Protocols & Algorithms breadcrumb"
                        >
                          <p className="font-mono uppercase text-eyebrow text-mute">
                            Protocols & Algorithms <span aria-hidden="true">›</span> <span className="text-ink">{activeLabel}</span>
                          </p>
                        </nav>
                      );
                    })()}
                    <div className="protocol-subtabs !mt-0 bg-white border border-line rounded-md rounded-t-none p-2 flex flex-wrap gap-2 sticky top-[calc(var(--case-bar-h,0px)+2.25rem)] z-30 dark:bg-card " role="tablist" aria-label="Protocols & Algorithms sub-sections" onKeyDown={(e) => {
                      const subTabs = MANAGEMENT_SUBTABS;
                      const ci = subTabs.indexOf(managementSubTab);
                      let ni;
                      if (e.key === 'ArrowRight') { e.preventDefault(); ni = (ci + 1) % subTabs.length; }
                      else if (e.key === 'ArrowLeft') { e.preventDefault(); ni = (ci - 1 + subTabs.length) % subTabs.length; }
                      else if (e.key === 'Home') { e.preventDefault(); ni = 0; }
                      else if (e.key === 'End') { e.preventDefault(); ni = subTabs.length - 1; }
                      if (ni !== undefined) {
                        setManagementSubTab(subTabs[ni]);
                        const el = document.getElementById(`mgmt-tab-${subTabs[ni]}`);
                        if (el) el.focus();
                        // v6.0-08: snap-scroll the named protocol panel into view.
                        revealManagementPanel(subTabs[ni]);
                      }
                    }}>
                      {[
                        // v6.0-04: Management sub-tabs — labels only, no decorative icons.
                        // v7 phase-7: visual swap to V7SubTabs primitive (single-accent cobalt).
                        // The button-render below is kept structurally because the existing
                        // snap-scroll behavior + id="mgmt-tab-*" anchors are wired throughout
                        // the protocols section. v7 styling is applied via the SubTabs-equivalent
                        // pill/segmented bar tokens encoded in the className below.
                        { id: 'ich', label: 'ICH' },
                        { id: 'ischemic', label: 'Ischemic/TIA' }
                      ].map((tab) => {
                        const isActive = managementSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            id={`mgmt-tab-${tab.id}`}
                            onClick={() => {
                              setManagementSubTab(tab.id);
                              // v6.0-08: snap-scroll to named protocol panel once React has mounted it.
                              revealManagementPanel(tab.id);
                            }}
                            className={`px-3 h-9 rounded-md text-sm font-semibold transition-colors min-h-[44px] sm:min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 ${
                              isActive
                                ? 'bg-cobalt-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-paper-2 dark:text-ink-2 dark:hover:bg-line'
                            }`}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={isActive ? `mgmt-tabpanel-${tab.id}` : undefined}
                            aria-label={`${tab.label} protocol tab`}
                            tabIndex={isActive ? 0 : -1}
                          >
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* ICH Content */}
                    {managementSubTab === 'ich' && (
                      <div id="mgmt-tabpanel-ich" role="tabpanel" aria-labelledby="mgmt-tab-ich" className="bg-card border border-line border-t-4 border-t-crit-600 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                          <h2 className="text-xl font-semibold text-ink">ICH Management</h2>
                          <span className="text-xs text-mute font-medium">Algorithmic workflow</span>
                        </div>

                        <div className="space-y-4">
                          {/* Key Principles */}
                          <div className="border-l-4 border-crit-400 bg-slate-50 px-3 py-2 text-sm space-y-1 dark:bg-paper-2">
                            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide dark:text-ink">Key Principles</p>
                            <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5 dark:text-ink-2">
                              <li>Presenting SBP 150-219: target 140 and maintain 130-150. Presenting SBP &ge;220: reduce about 20%, never more than 25%, in the first hour, then gradually reduce to 140-160. Presenting SBP &lt;150: do not actively lower to 140.</li>
                              <li>Start BP treatment as soon as possible, ideally within 2 hours of onset, and reach the selected target about 1 hour after treatment begins.</li>
                              <li>Obtain rapid agent-specific assessment using INR, thrombin time, direct-Xa or anti-Xa testing, and last-dose timing; follow the applicable reversal gate below.</li>
                              <li>Use the source-defined Neurosurgery, hydrocephalus, mass-effect, MIE, and research screens below; do not infer an operative pathway from location, volume, or GCS alone.</li>
                            </ul>
                          </div>
                          <details className="bg-white border border-crit-300 border-l-4 border-l-crit-600 rounded-md dark:bg-card dark:border-crit-800">
                            <summary className="cursor-pointer p-4 font-semibold text-slate-900 hover:bg-crit-50 rounded-t-md flex flex-col gap-2 md:flex-row md:items-start md:justify-between dark:text-ink dark:hover:bg-crit-950">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-crit-700 dark:text-crit-300">Initial Non-Traumatic IPH Evaluation</p>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-ink">{ICH_INITIAL_EVALUATION_ALGORITHM.title}</h3>
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium dark:text-mute">Reviewed {ICH_INITIAL_EVALUATION_ALGORITHM.lastReviewed}</span>
                            </summary>
                            <div className="p-4 pt-0">
                            <p className="text-xs text-slate-600 mb-3 dark:text-ink-2">{ICH_INITIAL_EVALUATION_ALGORITHM.scope}</p>
                            <div className="bg-crit-50 border border-crit-200 rounded-lg p-3 mb-3 dark:bg-crit-950 dark:border-crit-800">
                              <p className="text-sm font-semibold text-crit-800 dark:text-crit-300">{ICH_INITIAL_EVALUATION_ALGORITHM.consultTrigger}</p>
                              <p className="text-xs text-crit-700 mt-1 dark:text-crit-300">ED clinicians or the stroke service may call Neurosurgery directly; prior approval is not required, but the plan must be closed-looped with the designated on-call stroke attending and other involved service.</p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {ICH_INITIAL_EVALUATION_ALGORITHM.decisionNodes.map((node) => (
                                <div key={node.title} className="bg-slate-50 border border-line rounded-lg p-3 dark:bg-paper-2">
                                  <h4 className="font-semibold text-slate-800 text-sm mb-2 dark:text-ink">{node.title}</h4>
                                  <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
                                    {node.items.map((item) => <li key={item}>&#x2022; {item}</li>)}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                              <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
                                <h4 className="font-semibold text-cobalt-800 text-sm mb-2 dark:text-cobalt-300">Surgery Screens</h4>
                                <div className="space-y-2">
                                  {ICH_INITIAL_EVALUATION_ALGORITHM.surgicalScreens.map((screen) => (
                                    <div key={screen.title}>
                                      <p className="text-xs font-semibold text-cobalt-800 dark:text-cobalt-300">{screen.title}</p>
                                      <p className="text-xs text-slate-700 dark:text-ink-2">{screen.criteria.join('; ')}. {screen.action}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-warn-50 border border-warn-200 rounded-lg p-3 dark:bg-warn-950 dark:border-warn-800">
                                <h4 className="font-semibold text-warn-800 text-sm mb-2 dark:text-warn-300">Trial and Registry Screens</h4>
                                <div className="space-y-2">
                                  {ICH_INITIAL_EVALUATION_ALGORITHM.researchScreens.map((screen) => (
                                    <div key={screen.title}>
                                      <p className="text-xs font-semibold text-warn-800 dark:text-warn-300">{screen.title}</p>
                                      <p className="text-xs text-slate-700 dark:text-ink-2">{screen.criteria.join('; ')}. {screen.action}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="bg-slate-900 text-white rounded-lg p-3 mt-3 dark:bg-paper-2">
                              <p className="text-sm font-semibold">{ICH_INITIAL_EVALUATION_ALGORITHM.safetyPause.title}</p>
                              <ul className="text-xs text-slate-100 space-y-1 mt-1">
                                {ICH_INITIAL_EVALUATION_ALGORITHM.safetyPause.items.map((item) => <li key={item}>&#x2022; {item}</li>)}
                              </ul>
                            </div>
                            <div className="bg-slate-50 border border-line rounded-lg p-3 mt-3 dark:bg-paper-2">
                              <p className="text-sm font-semibold text-slate-800 dark:text-ink">Documentation expectations</p>
                              <ul className="text-xs text-slate-700 space-y-1 mt-1 dark:text-ink-2">
                                {ICH_INITIAL_EVALUATION_ALGORITHM.documentation.map((item) => <li key={item}>&#x2022; {item}</li>)}
                              </ul>
                            </div>
                            </div>
                          </details>
                          {/* === ALL PATIENTS INITIAL STEPS === */}
                          <details className="bg-white border border-crit-300 border-l-4 border-l-red-600 rounded-md dark:bg-card dark:border-crit-800 ">
                            <summary className="cursor-pointer p-4 font-semibold text-crit-700 hover:bg-crit-50 rounded-t-md text-xs uppercase tracking-wide dark:text-crit-300 dark:hover:bg-crit-950">
                              All Patients — Initial Steps
                            </summary>
                            <div className="p-4 pt-0 space-y-2">
                              <div className="flex gap-2 items-start">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-crit-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                <p className="text-sm">Order <strong>STAT coagulation panel</strong> (PT/INR, PTT, thrombin time (TT), fibrinogen, CBC, platelets, and a direct Xa inhibitor screen)</p>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-crit-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                <p className="text-sm">Obtain <strong>antithrombotic history</strong> — agent, dose, last dose timing</p>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-crit-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                <p className="text-sm">Order <strong>Type & Screen</strong></p>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-crit-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                                <p className="text-sm">If <strong>surgery</strong> is being considered → contact the transfusion service and request <strong>2 units cross-matched RBCs</strong> (turnaround varies, and is longer without a current type &amp; screen or with red-cell antibodies). If <strong>crash craniotomy</strong> is being considered → request <strong>2 units emergency-release RBCs</strong> (place both prepare and transfuse orders)</p>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-crit-600 text-white text-xs flex items-center justify-center font-bold">5</span>
                                <p className="text-sm">If <strong>prolonged PTT is the only abnormality</strong> on the STAT panel → immediately consult the <strong>hematology attending</strong></p>
                              </div>
                            </div>
                          </details>

                          {/* === ICH FIRST-HOUR CRITICAL BUNDLE === */}
                          <details className="bg-crit-100 border border-crit-300 rounded-md dark:bg-crit-950 dark:border-crit-800 ">
                            <summary className="cursor-pointer p-4 font-semibold text-crit-800 hover:bg-crit-200/50 rounded-t-md flex items-center justify-between gap-2 flex-wrap text-xs uppercase tracking-wide dark:text-crit-300 dark:hover:bg-crit-900">
                              <span>ICH First-Hour Critical Bundle</span>
                              <span className="text-[11px] text-crit-700 font-medium normal-case dark:text-crit-300">Institutional rapid workflow</span>
                            </summary>
                            <div className="p-4 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="bg-white border border-crit-200 rounded-lg p-2 dark:bg-card dark:border-crit-800">
                                <p className="font-semibold text-crit-800 dark:text-crit-300">1. Airway and Neuro ICU Escalation</p>
                                <p className="text-slate-700 dark:text-ink-2">Escalate airway and ICU-level monitoring early when exam worsens or airway protection is uncertain.</p>
                              </div>
                              <div className="bg-white border border-crit-200 rounded-lg p-2 dark:bg-card dark:border-crit-800">
                                <p className="font-semibold text-crit-800 dark:text-crit-300">2. Blood Pressure Strategy</p>
                                <p className="text-slate-700 dark:text-ink-2">Use the presenting-SBP branches: 150-219 → target 140 and maintain 130-150; &ge;220 → reduce about 20% but never more than 25% in the first hour, then gradually reduce to 140-160; &lt;150 → do not actively lower to 140.</p>
                              </div>
                              <div className="bg-white border border-crit-200 rounded-lg p-2 dark:bg-card dark:border-crit-800">
                                <p className="font-semibold text-crit-800 dark:text-crit-300">3. Agent-Specific Reversal</p>
                                <p className="text-slate-700 dark:text-ink-2">Confirm the applicable INR, thrombin-time, direct-Xa, anti-Xa, and last-dose timing gate, then use the institutional agent-specific pathway below.</p>
                              </div>
                              <div className="bg-white border border-crit-200 rounded-lg p-2 md:col-span-2 dark:bg-card dark:border-crit-800">
                                <p className="font-semibold text-crit-800 dark:text-crit-300">4. Surgery and Research Screens</p>
                                <p className="text-slate-700 dark:text-ink-2">Symptomatic hydrocephalus → urgent EVD evaluation. Cerebellar ICH ≥15 mL, or with neurological deterioration, brainstem compression and/or hydrocephalus from ventricular obstruction → immediate surgical evacuation with or without EVD (ICH 2022, COR 1, LOE B-NR). Use the complete MIE, MINUTE, or other source-defined screen; do not gate on a single value.</p>
                              </div>
                            </div>
                            </div>
                          </details>

                          {/* === WARFARIN REVERSAL === */}
                          <details className="bg-white border border-crit-200 rounded-md dark:bg-card dark:border-crit-800 ">
                            <summary className="cursor-pointer px-4 py-3 font-semibold text-crit-800 hover:bg-crit-50 rounded-t-xl flex items-center gap-2 dark:text-crit-300">
                                                            Warfarin Reversal Guide
                            </summary>
                            <div className="p-4 space-y-3">
                              <div className="bg-warn-50 border border-warn-200 rounded-lg p-3 dark:bg-warn-950 dark:border-warn-800">
                                <p className="text-sm font-semibold text-warn-800 mb-1 dark:text-warn-300">Immediate — All Warfarin Patients:</p>
                                <p className="text-sm">Give <button onClick={() => setProtocolModal(protocolDetailMap.VITK)} className="text-cobalt-600 underline font-semibold hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">Vitamin K 10 mg IV</button> immediately. When PCC is indicated by the INR branch below, give it immediately.</p>
                              </div>

                              <div className="bg-crit-50 border border-crit-200 rounded-lg p-3 dark:bg-crit-950 dark:border-crit-800">
                                <p className="text-sm font-semibold text-crit-800 mb-1 dark:text-crit-300">INR ≥ 2.0 (COR/LOE 1/B):</p>
                                <p className="text-sm">Give <button onClick={() => setProtocolModal(protocolDetailMap.PCC)} className="text-cobalt-600 underline font-semibold hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">4F-PCC (Kcentra) 2000 units IV</button> (institutional fixed dose; may underdose heavier or high-INR patients — label dosing is 25-50 units/kg by INR)</p>
                                <ul className="text-sm mt-2 space-y-1 ml-4">
                                  <li>• Check PT/INR at <strong>30 min</strong>, then <strong>every 6h for 24h</strong> after PCC</li>
                                  <li>• If INR &gt;1.5 after infusion → <strong>page hematology</strong> and consider an additional <strong>500 units PCC</strong> or <strong>2-4 units plasma (FFP)</strong></li>
                                  <li>• If INR &gt;1.5 at 24h → repeat vitamin K 10 mg IV over 30 min</li>
                                </ul>
                              </div>

                              <div className="bg-warn-50 border border-warn-200 rounded-lg p-3 dark:bg-warn-950 dark:border-warn-800">
                                <p className="text-sm font-semibold text-warn-800 mb-1 dark:text-warn-300">INR 1.6-1.9 (COR 2b, LOE C-LD):</p>
                                <p className="text-sm">4F-PCC 2000 units IV may be reasonable</p>
                              </div>

                              <div className="bg-slate-50 border border-line rounded-lg p-3 dark:bg-paper-2">
                                <p className="text-sm font-semibold text-slate-700 mb-1 dark:text-ink-2">INR 1.3-1.5 (COR 2b, LOE C-LD):</p>
                                <p className="text-sm text-slate-600 dark:text-ink-2">4F-PCC 2000 units IV may be reasonable; decide case by case</p>
                              </div>

                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 dark:bg-orange-950 dark:border-orange-800">
                                <p className="text-sm font-semibold text-orange-800 mb-1 dark:text-orange-300">FFP Pathway (if PCC unavailable or contraindicated):</p>
                                <ol className="text-sm space-y-1 ml-4 list-decimal">
                                  <li>Give <button onClick={() => setProtocolModal(protocolDetailMap.FFP)} className="text-cobalt-600 underline font-semibold hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">4 units emergency-release plasma</button> immediately and request 4 additional units; ideal dose is 15 mL/kg</li>
                                  <li>Repeat the STAT emergency stroke panel after infusion and INR every 6 hours for 24 hours</li>
                                  <li>If INR remains &gt;1.5, administer 4 more units and consult the hematology attending</li>
                                </ol>
                              </div>

                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:bg-yellow-950 dark:border-yellow-800">
                                <p className="text-xs font-semibold text-yellow-800 mb-1 dark:text-yellow-300">Absolute Contraindications to PCC:</p>
                                <ul className="text-xs space-y-0.5 text-yellow-900 mb-2 dark:text-yellow-300">
                                  <li>• Disseminated intravascular coagulation (DIC)</li>
                                  <li>• Heparin-induced thrombocytopenia (HIT)</li>
                                </ul>
                                <p className="text-xs font-semibold text-yellow-800 mb-1 dark:text-yellow-300">Relative Contraindications to PCC/FFP:</p>
                                <ul className="text-xs space-y-0.5 text-yellow-900 dark:text-yellow-300">
                                  <li>• Thrombotic event in past 6 weeks</li>
                                  <li>• Prothrombotic condition</li>
                                  <li>• Major surgery in past 6 weeks</li>
                                  <li>• Mechanical circulatory support (involve cardiology)</li>
                                </ul>
                                <p className="text-xs text-yellow-900 mt-2 dark:text-yellow-300">Discuss any relative contraindication with the stroke service before proceeding.</p>
                              </div>
                            </div>
                          </details>

                          {/* === DOAC REVERSAL === */}
                          <details className="bg-white border border-crit-200 rounded-md dark:bg-card dark:border-crit-800 ">
                            <summary className="cursor-pointer px-4 py-3 font-semibold text-crit-800 hover:bg-crit-50 rounded-t-xl flex items-center gap-2 dark:text-crit-300">
                                                            DOAC Reversal Guide
                            </summary>
                            <div className="p-4 space-y-3">
                              {/* Dabigatran */}
                              <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
                                <p className="text-sm font-semibold text-cobalt-800 mb-2 dark:text-cobalt-300">Dabigatran (Direct Thrombin Inhibitor)</p>
                                <p className="text-xs text-cobalt-600 mb-2 dark:text-cobalt-300">Reverse if TT prolonged or unavailable</p>
                                <ul className="text-sm space-y-1.5">
                                  <li className="flex gap-2">
                                    <span className="shrink-0 font-bold text-cobalt-700 dark:text-cobalt-300">1.</span>
                                    <span>If ingestion &lt;2h → <button onClick={() => setProtocolModal(protocolDetailMap.CHARCOAL)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">activated charcoal</button></span>
                                  </li>
                                  <li className="flex gap-2">
                                    <span className="shrink-0 font-bold text-cobalt-700 dark:text-cobalt-300">2.</span>
                                    <span>Give <button onClick={() => setProtocolModal(protocolDetailMap.IDA)} className="text-cobalt-600 underline font-semibold hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">idarucizumab (Praxbind) 5 g IV</button> — two 2.5 g doses, ≤15 min apart, each over 5-10 min</span>
                                  </li>
                                  <li className="flex gap-2">
                                    <span className="shrink-0 font-bold text-cobalt-700 dark:text-cobalt-300">3.</span>
                                    <span>If idarucizumab unavailable → <button onClick={() => setProtocolModal(protocolDetailMap.PCC_DOAC)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">4F-PCC 2000 units IV</button></span>
                                  </li>
                                </ul>
                                <p className="text-xs text-cobalt-600 mt-2 dark:text-cobalt-300">Emergent dialysis option — dabigatran ~65% removed by dialysis (t½ = 14h, longer in renal impairment)</p>
                              </div>

                              {/* Factor Xa Inhibitors */}
                              <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
                                <p className="text-sm font-semibold text-cobalt-800 mb-2 dark:text-cobalt-300">Rivaroxaban / Apixaban / Edoxaban (Factor Xa Inhibitors)</p>
                                <p className="text-xs text-cobalt-600 mb-2 dark:text-cobalt-300">Institutional trigger: reverse if last dose &lt;24 h, timing unknown, or renal impairment, or if the anti-Xa/Xa screen is elevated (NCS/SCCM 2016: within 3–5 half-lives of the last dose); do not wait for the assay when ingestion is recent</p>
                                <ul className="text-sm space-y-1.5">
                                  <li className="flex gap-2">
                                    <span className="shrink-0 font-bold text-cobalt-700 dark:text-cobalt-300">1.</span>
                                    <span>If ingestion &lt;2h → <button onClick={() => setProtocolModal(protocolDetailMap.CHARCOAL)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">activated charcoal</button></span>
                                  </li>
                                  <li className="flex gap-2">
                                    <span className="shrink-0 font-bold text-cobalt-700 dark:text-cobalt-300">2.</span>
                                    <span>Give <button onClick={() => setProtocolModal(protocolDetailMap.PCC_DOAC)} className="text-cobalt-600 underline font-semibold hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">4F-PCC 2000 units IV</button> (andexanet alfa is no longer marketed in the US; NCS/SCCM 2026 suggests 4F-PCC rather than andexanet)</span>
                                  </li>
                                </ul>
                                <p className="text-xs text-cobalt-600 mt-2 dark:text-cobalt-300"><strong>Drug-removal limits:</strong> Rivaroxaban is not dialyzable. Hemodialysis does not appear to substantially affect apixaban exposure and does not significantly contribute to edoxaban clearance. Follow the approved agent-specific reversal pathway and specialist assessment.</p>
                              </div>

                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:bg-yellow-950 dark:border-yellow-800">
                                <p className="text-xs font-semibold text-yellow-800 mb-1 dark:text-yellow-300">Absolute Contraindications to PCC:</p>
                                <ul className="text-xs space-y-0.5 text-yellow-900 mb-2 dark:text-yellow-300">
                                  <li>• Disseminated intravascular coagulation (DIC)</li>
                                  <li>• Heparin-induced thrombocytopenia (HIT)</li>
                                </ul>
                                <p className="text-xs font-semibold text-yellow-800 mb-1 dark:text-yellow-300">Relative Contraindications to PCC:</p>
                                <ul className="text-xs space-y-0.5 text-yellow-900 dark:text-yellow-300">
                                  <li>• Thrombotic event in past 6 weeks</li>
                                  <li>• Prothrombotic condition</li>
                                  <li>• Major surgery in past 6 weeks</li>
                                  <li>• Mechanical circulatory support (involve cardiology)</li>
                                </ul>
                              </div>
                            </div>
                          </details>

                          {/* === POST-THROMBOLYTIC ICH SUSPICION === */}
                          <details className="bg-white border border-crit-200 rounded-md dark:bg-card dark:border-crit-800 ">
                            <summary className="cursor-pointer px-4 py-3 font-semibold text-crit-800 hover:bg-crit-50 rounded-t-xl flex items-center gap-2 dark:text-crit-300">
                              <i aria-hidden="true" data-lucide="alert-triangle" className="w-4 h-4 text-crit-600 dark:text-crit-300"></i>
                              Post-Thrombolytic ICH Suspicion Algorithm
                            </summary>
                            <div className="p-4 space-y-3">
                              <div className="bg-crit-100 border border-crit-300 rounded-lg p-3 dark:bg-crit-950 dark:border-crit-800">
                                <p className="text-xs font-semibold text-crit-800 mb-1 dark:text-crit-300">Triggered by:</p>
                                <p className="text-sm text-crit-700 dark:text-crit-300">Sudden neurological deterioration, new headache, acute hypertension, nausea/vomiting</p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex gap-2 items-start">
                                  <span className="shrink-0 w-6 h-6 rounded-full bg-crit-700 text-white text-xs flex items-center justify-center font-bold">1</span>
                                  <p className="text-sm"><strong>STOP thrombolytic</strong> if still running</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                  <span className="shrink-0 w-6 h-6 rounded-full bg-crit-700 text-white text-xs flex items-center justify-center font-bold">2</span>
                                  <div className="text-sm">
                                    <p><strong>STAT non-contrast CT Head</strong> + <strong>STAT blood draw:</strong></p>
                                    <ul className="ml-4 mt-1 text-xs space-y-0.5">
                                      <li>• STAT hemorrhage panel: PT/INR, platelets, fibrinogen</li>
                                      <li>• Coag screen: PTT, TT, D-dimers</li>
                                      <li>• CBC, Type & Cross</li>
                                    </ul>
                                  </div>
                                </div>
                                <div className="flex gap-2 items-start">
                                  <span className="shrink-0 w-6 h-6 rounded-full bg-crit-700 text-white text-xs flex items-center justify-center font-bold">3</span>
                                  <p className="text-sm">Contact <strong>blood bank/transfusion services</strong>; immediately order <button onClick={() => setProtocolModal(protocolDetailMap.CRYO)} className="text-cobalt-600 underline font-semibold hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">2 pre-pooled units of cryoprecipitate</button> (each pool ≈5 single-donor units; total ≈10 units)</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                  <span className="shrink-0 w-6 h-6 rounded-full bg-crit-700 text-white text-xs flex items-center justify-center font-bold">4</span>
                                  <p className="text-sm"><strong>Notify family</strong></p>
                                </div>
                              </div>

                              {/* Decision tree */}
                              <div className="bg-warn-50 border border-warn-200 rounded-lg p-3 dark:bg-warn-950 dark:border-warn-800">
                                <p className="text-sm font-semibold text-warn-800 mb-2 dark:text-warn-300">CT scan delayed &gt;30 min?</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-white border border-warn-300 rounded p-2 dark:bg-card dark:border-warn-800">
                                    <p className="text-xs font-semibold text-warn-700 mb-1 dark:text-warn-300">YES — CT delayed:</p>
                                    <p className="text-sm">If fibrinogen is &lt;200 mg/dL, empirically administer the 2 pre-pooled units of cryoprecipitate (≈10 units) IV over 10-30 minutes</p>
                                  </div>
                                  <div className="bg-white border border-warn-300 rounded p-2 dark:bg-card dark:border-warn-800">
                                    <p className="text-xs font-semibold text-warn-700 mb-1 dark:text-warn-300">NO — CT available:</p>
                                    <p className="text-sm">Wait for CT results</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-crit-50 border border-crit-300 rounded-lg p-3 dark:bg-crit-950 dark:border-crit-800">
                                <p className="text-sm font-semibold text-crit-800 mb-2 dark:text-crit-300">Intracranial blood on CT?</p>
                                <div className="space-y-2">
                                  <div className="bg-white border border-crit-300 rounded p-2 dark:bg-card dark:border-crit-800">
                                    <p className="text-xs font-semibold text-crit-700 mb-1 dark:text-crit-300">YES — Blood confirmed:</p>
                                    <ol className="text-sm space-y-1 ml-4 list-decimal">
                                      <li>Give <button onClick={() => setProtocolModal(protocolDetailMap.CRYO)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">2 pre-pooled units of cryoprecipitate</button> (each pool ≈5 single-donor units; total ≈10 units) IV over 10-30 minutes, or continue if already started</li>
                                      <li>Confirm intracranial blood on CT with the ordering provider, then verbally confirm with the RN that administration is post-CT; after both confirmations, give <button onClick={() => setProtocolModal(protocolDetailMap.TXA)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">tranexamic acid 1000 mg IV over 10 minutes</button></li>
                                      <li>Repeat the emergency hemorrhage panel STAT, every 30 minutes twice, then every 4 hours until normal</li>
                                      <li>Call Stroke/Neuro attending</li>
                                      <li>Consult Neurosurgery if needed</li>
                                    </ol>
                                    <p className="text-xs text-crit-600 mt-1 italic dark:text-crit-300">If Cryo already started + infusing and CT shows NO ICH → STOP infusion</p>
                                  </div>
                                  <div className="bg-white border border-ok-300 rounded p-2 dark:bg-card dark:border-ok-800">
                                    <p className="text-xs font-semibold text-ok-700 mb-1 dark:text-ok-300">NO — No intracranial blood:</p>
                                    <ul className="text-sm space-y-1">
                                      <li>• Do <strong>NOT</strong> restart lytic</li>
                                      <li>• Consider other causes: extending infarct, seizure, hypoxia, hypercarbia, hypoglycemia, electrolyte abnormalities</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>



                              <div className="bg-slate-50 border border-line rounded-lg p-3 dark:bg-paper-2">
                                <p className="text-xs font-semibold text-slate-700 mb-1 dark:text-ink-2">Follow-up & Management:</p>
                                <ul className="text-xs space-y-0.5 text-slate-600 dark:text-ink-2">
                                  <li>• Notify the provider for SBP &gt;180 or DBP &gt;105, a new neurologic deficit, or a GCS decrease of at least 2 points</li>
                                  <li>• Use fibrinogen &lt;200 mg/dL as the action threshold</li>
                                  <li>• If labs abnormal or uncontrolled bleeding → consult Hematology</li>
                                  <li>• Repeat the emergency hemorrhage panel STAT, every 30 minutes twice, then every 4 hours until normal</li>
                                  <li>• Neuro checks q15 min x 2h → q30 min x 6h → q1h x 16h; notify provider for new deficits or GCS drop ≥2 points</li>
                                  <li>• Update the family</li>
                                </ul>
                              </div>
                            </div>
                          </details>

                          {/* === ANGIOEDEMA MANAGEMENT === */}
                          <details className="bg-white border border-crit-200 rounded-md dark:bg-card dark:border-crit-800 ">
                            <summary className="cursor-pointer px-4 py-3 font-semibold text-crit-800 hover:bg-crit-50 rounded-t-xl flex items-center gap-2 dark:text-crit-300">
                              <i aria-hidden="true" data-lucide="shield-alert" className="w-4 h-4 text-orange-600 dark:text-orange-300"></i>
                              Angioedema Management
                            </summary>
                            <div className="p-4 space-y-3">
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 dark:bg-orange-950 dark:border-orange-800">
                                <p className="text-xs text-orange-700 mb-2 dark:text-orange-300">Post-thrombolytic orolingual angioedema</p>
                                <div className="space-y-2">
                                  <div className="flex gap-2 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-orange-700 text-white dark:bg-orange-700 text-xs flex items-center justify-center font-bold">1</span>
                                    <p className="text-sm"><strong>Maintain airway</strong> — intubation may not be necessary if edema is limited to the anterior tongue and lips. Edema involving the larynx, palate, floor of mouth, or oropharynx with rapid progression within 30 minutes poses higher risk of requiring intubation. Awake fiberoptic intubation is optimal.</p>
                                  </div>
                                  <div className="flex gap-2 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-orange-700 text-white dark:bg-orange-700 text-xs flex items-center justify-center font-bold">2</span>
                                    <p className="text-sm"><strong>Hold ACE inhibitors</strong> — stop the thrombolytic infusion <em>if alteplase is being administered</em></p>
                                  </div>
                                  <div className="flex gap-2 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-orange-700 text-white dark:bg-orange-700 text-xs flex items-center justify-center font-bold">3</span>
                                    <p className="text-sm"><button onClick={() => setProtocolModal(protocolDetailMap.METHYLPRED)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">Methylprednisolone 125 mg IV</button></p>
                                  </div>
                                  <div className="flex gap-2 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-orange-700 text-white dark:bg-orange-700 text-xs flex items-center justify-center font-bold">4</span>
                                    <p className="text-sm"><button onClick={() => setProtocolModal(protocolDetailMap.DIPHEN)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">Diphenhydramine 50 mg IV</button></p>
                                  </div>
                                  <div className="flex gap-2 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-orange-700 text-white dark:bg-orange-700 text-xs flex items-center justify-center font-bold">5</span>
                                    <p className="text-sm"><button onClick={() => setProtocolModal(protocolDetailMap.FAMOTIDINE)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">Famotidine 20 mg IV</button></p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-crit-50 border border-crit-200 rounded-lg p-3 dark:bg-crit-950 dark:border-crit-800">
                                <p className="text-sm font-semibold text-crit-800 mb-1 dark:text-crit-300">Complete the institutional sequence:</p>
                                <ul className="text-sm space-y-1">
                                  <li>• If edema further increases: <button onClick={() => setProtocolModal(protocolDetailMap.EPI)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">epinephrine (0.1%) 0.3 mL SC</button> or 0.5 mL by nebulizer</li>
                                  <li>• Next standard step: <button onClick={() => setProtocolModal(protocolDetailMap.ICATIBANT)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">icatibant 30 mg SC once</button>; attending approval is required</li>
                                  <li>• End with supportive care</li>
                                </ul>
                                <p className="text-xs text-crit-700 mt-2 dark:text-crit-300"><strong>Restricted alternative, not part of the active adult sequence:</strong> C1 esterase inhibitor may be used for pregnancy, pediatric patients, or icatibant intolerance under the institutional restriction.</p>
                              </div>
                            </div>
                          </details>
                          <details className="bg-white border border-crit-200 rounded-md dark:bg-card dark:border-crit-800 ">
                            <summary className="cursor-pointer p-4 font-semibold text-crit-700 hover:bg-crit-50 rounded-t-md flex items-center justify-between text-sm dark:text-crit-300 dark:hover:bg-crit-950">
                              <span>ABC/2 ICH Volume Calculator</span>
                              {ichVolumeEstimate && (
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ichVolumeEstimate.exceeds30 ? 'bg-crit-100 text-crit-700 dark:bg-crit-950 dark:text-crit-300' : ichVolumeEstimate.exceeds15 ? 'bg-warn-100 text-warn-800 dark:bg-warn-950 dark:text-warn-300' : 'bg-ok-100 text-ok-700 dark:bg-ok-900 dark:text-ok-300'}`}>
                                  {ichVolumeEstimate.display} mL
                                </span>
                              )}
                            </summary>
                            <div className="p-4 pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <label htmlFor="ich-abc2-a" className="block text-xs text-slate-500 mb-1 dark:text-mute">A (cm)</label>
                                <input
                                  id="ich-abc2-a"
                                  type="number" min="0.1" max="20" step="0.1"
                                  value={ichVolumeParams.a}
                                  onChange={(e) => setIchVolumeParams(prev => ({ ...prev, a: e.target.value }))}
                                  className="w-full px-2 py-1.5 border border-line rounded-lg"
                                  placeholder="e.g. 4.2"
                                />
                              </div>
                              <div>
                                <label htmlFor="ich-abc2-b" className="block text-xs text-slate-500 mb-1 dark:text-mute">B (cm)</label>
                                <input
                                  id="ich-abc2-b"
                                  type="number" min="0.1" max="20" step="0.1"
                                  value={ichVolumeParams.b}
                                  onChange={(e) => setIchVolumeParams(prev => ({ ...prev, b: e.target.value }))}
                                  className="w-full px-2 py-1.5 border border-line rounded-lg"
                                  placeholder="e.g. 3.6"
                                />
                              </div>
                              <div>
                                <label htmlFor="ich-abc2-thickness" className="block text-xs text-slate-500 mb-1 dark:text-mute">Slice thickness (mm)</label>
                                <input
                                  id="ich-abc2-thickness"
                                  type="number" min="1" max="10" step="0.5"
                                  value={ichVolumeParams.thicknessMm}
                                  onChange={(e) => setIchVolumeParams(prev => ({ ...prev, thicknessMm: e.target.value }))}
                                  className="w-full px-2 py-1.5 border border-line rounded-lg"
                                  placeholder="e.g. 5"
                                />
                              </div>
                              <div>
                                <label htmlFor="ich-abc2-slices" className="block text-xs text-slate-500 mb-1 dark:text-mute">Slices w/ ICH</label>
                                <input
                                  id="ich-abc2-slices"
                                  type="number" min="1" max="100" step="1"
                                  value={ichVolumeParams.numSlices}
                                  onChange={(e) => setIchVolumeParams(prev => ({ ...prev, numSlices: e.target.value }))}
                                  className="w-full px-2 py-1.5 border border-line rounded-lg"
                                  placeholder="e.g. 6"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-3 dark:text-mute">
                              For confirmed non-traumatic IPH, volume ≥15 mL prompts early Neurosurgery + stroke-service evaluation. A 30-80 mL lobar volume is only one component of the complete MIE screen and is not a standalone prognostic rule.
                            </p>
                            {ichVolumeEstimate?.unitWarning && (
                              <p className="text-xs font-semibold text-crit-800 bg-crit-50 border border-crit-200 rounded-md p-2 mt-2 dark:bg-crit-950 dark:border-crit-800 dark:text-crit-300">
                                {ichVolumeEstimate.unitWarning}
                              </p>
                            )}
                            {ichVolumeEstimate?.exceeds15 && !ichVolumeEstimate.unitWarning && (
                              <p className="text-xs font-semibold text-warn-800 bg-warn-50 border border-warn-200 rounded-md p-2 mt-2 dark:bg-warn-950 dark:border-warn-800 dark:text-warn-300">
                                Confirmed non-traumatic IPH volume ≥15 mL by ABC/2 meets the June 2026 early Neurosurgery + stroke-service evaluation threshold.
                              </p>
                            )}
                            </div>
                          </details>
                          <details className="bg-white border border-crit-200 rounded-md dark:bg-card dark:border-crit-800">
                            <summary className="cursor-pointer p-4 font-semibold text-crit-700 hover:bg-crit-50 rounded-t-md text-sm dark:text-crit-300 dark:hover:bg-crit-950">
                              Telestroke rapid actions (phone or video)
                            </summary>
                            <div className="p-4 pt-0">
                              <ul className="text-sm space-y-1 text-slate-700 dark:text-ink-2">
                                <li>Confirm antithrombotic agent, last-dose timing, duration, indication, relevant renal/hepatic comorbidity or interactions, and the applicable INR, thrombin-time, direct-Xa, or anti-Xa gate before reversal.</li>
                                <li>Use the presenting-SBP branches: 150-219 → target 140 and maintain 130-150; &ge;220 → reduce about 20% but never more than 25% in the first hour, then gradually reduce to 140-160; &lt;150 → do not actively lower to 140. Use IV nicardipine or IV labetalol. Spontaneous ICH only — not for vascular-malformation hemorrhage or post-operative neurosurgical cases.</li>
                                <li>Screen for early Neurosurgery + stroke-service evaluation triggers: non-traumatic IPH &ge;15 mL by ABC/2, IVH/hydrocephalus, cerebellar hemorrhage, vascular lesion concern, life-threatening mass effect, neurologic decline, multicompartmental hemorrhage, ED attending discretion, or clinician concern.</li>
                                <li>Plan repeat imaging and close neuro checks.</li>
                              </ul>
                              <p className="text-xs text-slate-500 mt-2 dark:text-mute">
                                {consultationType === 'telephone'
                                  ? 'Telephone: confirm NIHSS and exam details with the bedside team.'
                                  : 'Video: perform a focused remote NIHSS and confirm imaging review.'}
                              </p>
                            </div>
                          </details>
                          <details className="bg-white border border-crit-200 rounded-md dark:bg-card dark:border-crit-800">
                            <summary className="cursor-pointer p-4 font-semibold text-crit-700 hover:bg-crit-50 rounded-t-md text-sm dark:text-crit-300 dark:hover:bg-crit-950">
                              Inpatient priorities
                            </summary>
                            <div className="p-4 pt-0">
                              <ul className="text-sm space-y-1 text-slate-700 dark:text-ink-2">
                                <li>Continue the applicable agent-specific reversal and common reversal monitoring pathway.</li>
                                <li>Evaluate symptomatic hydrocephalus for urgent EVD. Cerebellar ICH ≥15 mL, or with neurological deterioration, brainstem compression and/or hydrocephalus from ventricular obstruction → immediate surgical evacuation with or without EVD (ICH 2022, COR 1, LOE B-NR).</li>
                                <li>Use generic head-of-bed elevation and the admitting ICU team's workflow; no fixed angle or broader rehabilitation/goals-of-care bundle is supplied by the institutional ICH sources.</li>
                              </ul>
                            </div>
                          </details>
                        </div>

                        <details className="mt-5 bg-white border border-crit-200 rounded-lg dark:bg-card dark:border-crit-800">
                          <summary className="cursor-pointer px-4 py-3 font-semibold text-crit-800 hover:bg-crit-50 rounded-lg dark:text-crit-300">ICH protocol details</summary>
                          <div className="p-4 space-y-6">
                      <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-4 mb-6 dark:bg-cobalt-900 dark:border-cobalt-700">
                        <h3 className="text-lg font-semibold text-cobalt-800 mb-3 dark:text-cobalt-300">Minimally Invasive Evacuation (MIE)</h3>

                        <div className="bg-white p-3 rounded border mb-4 dark:bg-card">
                          <h4 className="font-semibold text-cobalt-700 mb-2 dark:text-cobalt-300">Surgical Selection</h4>
                          <ul className="text-sm space-y-1">
                            <li>June 2026 operational MIE screen: lobar IPH 30-80 mL, NIHSS &gt;5, GCS 5-14, age 18-80, and no underlying lesion.</li>
                            <li>Use the complete conjunctive screen below and confirm the current institutional pathway with Neurosurgery.</li>
                            <li>Do not infer eligibility, outcome, or prognosis from volume, GCS, location, or another single criterion.</li>
                          </ul>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white p-3 rounded border dark:bg-card">
                            <h4 className="font-semibold text-ok-600 mb-2 dark:text-ok-300">June 2026 Institutional MIE Screen</h4>
                            <ul className="text-sm space-y-1">
                              <li>• Spontaneous <strong>lobar</strong> IPH — no underlying lesion</li>
                              <li>• ICH volume 30-80 cc</li>
                              <li>• Age 18-80 years</li>
                              <li>• NIHSS &gt;5</li>
                              <li>• GCS 5-14</li>
                            </ul>
                            <p className="text-xs text-ok-700 mt-2 italic dark:text-ok-300">Confirm operative timing, detailed exclusions, and pathway activation with neurosurgery and the active local protocol.</p>
                          </div>

                          <div className="bg-white p-3 rounded border dark:bg-card">
                            <h4 className="font-semibold text-crit-600 mb-2 dark:text-crit-300">Pathway Boundary</h4>
                            <p className="text-sm">The accepted institutional source supplies only the complete screen shown here, including absence of an underlying vascular lesion. It does not publish the broader literature-derived exclusion list.</p>
                            <div className="mt-3 bg-cobalt-50 border border-cobalt-200 rounded p-2 dark:bg-cobalt-900 dark:border-cobalt-700">
                              <p className="text-xs font-semibold text-cobalt-800 dark:text-cobalt-300">For MIE candidates:</p>
                              <p className="text-xs text-cobalt-700 dark:text-cobalt-300">Use the approved current pathway and confirm the operative approach with Neurosurgery.</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-100 p-3 rounded dark:bg-paper-2">
                          <p className="text-sm font-semibold mb-2">ICH Volume Calculation:</p>
                          <p className="text-sm"><strong>ABC/2 Method:</strong></p>
                          <ul className="text-sm ml-4">
                            <li>A = largest ICH diameter (cm)</li>
                            <li>B = largest diameter 90 degrees to A on same slice (cm)</li>
                            <li>C = (# CT slices with ICH) x (slice thickness)</li>
                          </ul>
                          <p className="text-sm mt-2 font-semibold">Volume = A x B x C / 2</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-crit-700 mb-4 dark:text-crit-300">Anticoagulation Reversal</h3>

                        {/* Warfarin */}
                        <div className="bg-white p-4 rounded border mb-4 dark:bg-card">
                          <h4 className="font-semibold text-cobalt-700 mb-3 dark:text-cobalt-300">Warfarin</h4>
                          <ul className="text-sm space-y-1">
                            <li><strong>Immediate:</strong> Vitamin K 10 mg IV for all warfarin patients.</li>
                            <li><strong>INR ≥2.0 (COR/LOE 1/B):</strong> 4F-PCC (Kcentra) 2000 units IV immediately. Vitamin K 10 mg IV is also given immediately.</li>
                            <li><strong>INR 1.6-1.9 (COR 2b, LOE C-LD):</strong> 4F-PCC 2000 units IV may be reasonable.</li>
                            <li><strong>INR 1.3-1.5 (COR 2b, LOE C-LD):</strong> 4F-PCC 2000 units IV may be reasonable; decide case by case.</li>
                            <li><strong>Fixed-dose caveat:</strong> the institutional 2000-unit dose may underdose heavier or high-INR patients. Kcentra label dosing: INR 2-&lt;4, 25 units/kg (max 2500); INR 4-6, 35 units/kg (max 3500); INR &gt;6, 50 units/kg (max 5000).</li>
                            <li><strong>Check INR:</strong> at 30 min, then every 6h for 24h after PCC.</li>
                            <li><strong>INR &gt;1.5 after PCC:</strong> page hematology and consider an additional 500 units PCC or 2-4 units plasma (FFP).</li>
                            <li><strong>INR &gt;1.5 at 24h:</strong> repeat vitamin K 10 mg IV over 30 min.</li>
                            <li><strong>FFP pathway (if PCC unavailable or contraindicated):</strong> 4 units emergency-release plasma immediately and request an additional 4 units (ideal plasma dose 15 mL/kg; each unit is 250-300 mL, so some patients need additional units) → recheck INR → if &gt;1.5 administer 4 more units → if still &gt;1.5 consult hematology. If INR is &gt;1.5 at 24 hours, repeat vitamin K 10 mg IV over 30 min. Consider concurrent furosemide if history of CHF.</li>
                          </ul>
                        </div>

                        {/* Direct Oral Anticoagulants (DOACs) */}
                        <div className="bg-white p-4 rounded border mb-4 dark:bg-card">
                          <h4 className="font-semibold text-cobalt-700 mb-3 dark:text-cobalt-300">Direct Oral Anticoagulants (DOACs)</h4>

                          <div className="mb-3">
                            <p className="text-sm font-semibold text-slate-700 dark:text-ink-2">Dabigatran (Direct Thrombin Inhibitor) — COR/LOE 2a/B:</p>
                            <ul className="text-sm space-y-1">
                              <li><strong>Assessment:</strong> thrombin time (TT) — a normal TT excludes significant dabigatran effect; reverse if TT is prolonged or not readily available.</li>
                              <li><strong>Idarucizumab (Praxbind):</strong> 5 g IV — two 2.5 g doses, ≤15 min apart, each over 5-10 min.</li>
                              <li><strong>If unavailable:</strong> 4F-PCC 2000 units IV.</li>
                              <li><strong>Activated charcoal:</strong> if ingestion &lt;2 hours.</li>
                              <li><strong>Dialysis:</strong> ~65% removed (t½ = 14h, longer in renal impairment).</li>
                            </ul>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-ink-2">Rivaroxaban / Apixaban / Edoxaban (Factor Xa Inhibitors) — 4F-PCC: ICH 2022 COR 2b, LOE B-NR; NCS/SCCM 2026 conditional recommendation for 4F-PCC rather than andexanet:</p>
                            <ul className="text-sm space-y-1">
                              <li><strong>Assessment:</strong> Direct Xa Inhibitor screen — a normal screen excludes significant anticoagulant effect. For edoxaban the screen is not a calibrated drug-specific assay, so interpret it together with last-dose timing and renal function.</li>
                              <li><strong>When to reverse (institutional trigger):</strong> last dose &lt;24 h, timing unknown, or renal impairment, or an elevated anti-Xa/Xa screen (NCS/SCCM 2016: within 3–5 half-lives of the last dose). Do not wait for the assay when ingestion is recent.</li>
                              <li><strong>4F-PCC:</strong> 2000 units IV (institutional fixed dose; NCS/SCCM suggests 50 units/kg) if no contraindications.</li>
                              <li><strong>Andexanet alfa:</strong> no longer marketed in the US (withdrawn December 2025); NCS/SCCM 2026 suggests 4F-PCC rather than andexanet.</li>
                              <li><strong>Activated charcoal:</strong> if ingestion &lt;2 hours.</li>
                              <li><strong>Drug-removal limits:</strong> Rivaroxaban is not dialyzable. Hemodialysis does not appear to substantially affect apixaban exposure and does not significantly contribute to edoxaban clearance. Follow the approved agent-specific reversal pathway and specialist assessment.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded border mb-4 dark:bg-card">
                          <h4 className="font-semibold text-cobalt-700 mb-3 dark:text-cobalt-300">Heparins</h4>
                          <ul className="text-sm space-y-1">
                            <li><strong>Treatment-dose UFH (COR 2a, LOE C-LD):</strong> protamine 1 mg per 100 units of UFH given in the prior 2-3 hours (max 50 mg) by slow IV injection; if the aPTT remains elevated, consider 0.5 mg per 100 units (NCS/SCCM 2016).</li>
                            <li><strong>UFH — HIT screen:</strong> if platelets &lt;100 K/µL, send heparin-induced platelet antibodies; if positive, consult hematology.</li>
                            <li><strong>Treatment-dose LMWH — enoxaparin, dalteparin, or tinzaparin (COR 2b, LOE C-LD):</strong> enoxaparin within 8 h → protamine 1 mg per 1 mg enoxaparin (max 50 mg); 8-12 h → 0.5 mg per 1 mg enoxaparin; dalteparin/tinzaparin → 1 mg per 100 anti-Xa units given within 3-5 half-lives (max 50 mg). Protamine only partially reverses LMWH (NCS/SCCM 2016).</li>
                          </ul>
                        </div>

                        <div className="bg-white p-4 rounded border mb-4 dark:bg-card">
                          <h4 className="font-semibold text-cobalt-700 mb-3 dark:text-cobalt-300">Fondaparinux and Parenteral Direct Thrombin Inhibitors</h4>
                          <ul className="text-sm space-y-1">
                            <li>Stop fondaparinux, bivalirudin, or argatroban and obtain STAT hematology-attending consultation.</li>
                            <li>No specific antidote is available for these agents.</li>
                            <li>For bivalirudin or argatroban, repeat the DTI level at 60 minutes after stopping; if it remains prolonged, consult the hematology attending.</li>
                          </ul>
                        </div>

                        <div className="bg-white p-4 rounded border mb-4 dark:bg-card">
                          <h4 className="font-semibold text-cobalt-700 mb-3 dark:text-cobalt-300">Common Reversal Monitoring</h4>
                          <ul className="text-sm space-y-1">
                            <li>Laboratory testing: baseline emergency stroke panel; repeat the STAT panel 15-30 minutes after reversal including the agent-specific assay (PT/INR for warfarin, thrombin time for dabigatran, anti-Xa for factor-Xa inhibitors); PT/INR and CBC at 6 hours; PT/INR, CBC and fibrinogen at 24 hours.</li>
                            <li>CT head: baseline, 6 hours or sooner for clinical deterioration, and 24 hours.</li>
                            <li>Neurologic checks every hour for 24 hours; blood pressure per the ICH protocol; monitor for thrombotic complications.</li>
                          </ul>
                        </div>

                        {/* Blood-product replacement thresholds — institutional reversal protocol */}
                        <div className="bg-white p-4 rounded border mb-4 dark:bg-card">
                          <h4 className="font-semibold text-cobalt-700 mb-3 dark:text-cobalt-300">Blood-Product Replacement Thresholds</h4>
                          <p className="text-xs text-cobalt-600 mb-2 dark:text-cobalt-300">Request these products, if not already ordered under a pathway above, based on the STAT results and assuming an average-sized adult.</p>
                          <ul className="text-sm space-y-1">
                            <li><strong>Fibrinogen &lt;125 mg/dL:</strong> prepare and transfuse 2 pre-pooled units of cryoprecipitate (each pool ≈5 single-donor units; total ≈10 units).</li>
                            <li><strong>Platelets &lt;50 K/µL:</strong> prepare and transfuse 2 units of platelets.</li>
                            <li><strong>Platelets 50-100 K/µL:</strong> prepare and transfuse 1 unit of platelets.</li>
                            <li><strong>INR &gt;1.5:</strong> use the 4F-PCC or plasma pathway above.</li>
                          </ul>
                          <p className="text-xs text-cobalt-600 mt-2 dark:text-cobalt-300">These thrombocytopenia thresholds are distinct from antiplatelet-associated hemorrhage, where routine platelet transfusion is not recommended.</p>
                        </div>

                        {/* Relative Contraindications */}

                        <div className="bg-white p-4 rounded border mb-4 dark:bg-card">
                          <h4 className="font-semibold text-slate-700 mb-3 dark:text-ink-2">Absolute contraindications to PCC:</h4>
                          <ul className="text-sm space-y-1 mb-3">
                            <li>• Disseminated intravascular coagulation (DIC)</li>
                            <li>• Heparin-induced thrombocytopenia (HIT)</li>
                          </ul>
                          <h4 className="font-semibold text-slate-700 mb-3 dark:text-ink-2">Relative contraindications to PCC/FFP:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Thrombotic event &lt;6 weeks</li>
                            <li>• Major surgery ≤6 weeks</li>
                            <li>• Known prothrombotic disorder</li>
                            <li>• Mechanical circulatory support (involve cardiology)</li>
                          </ul>
                          <p className="text-xs text-slate-600 mt-2 dark:text-ink-2">Discuss relative contraindications with the stroke service before proceeding.</p>
                        </div>
                      </div>

                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-crit-700 mb-4 dark:text-crit-300">Antiplatelet-Associated ICH</h3>
                          <div className="bg-white p-4 rounded border dark:bg-card">
                          <ul className="text-sm space-y-1">
                            <li>Discontinue antiplatelet agent(s). Platelet transfusion is <strong>potentially harmful</strong> for aspirin-associated ICH when emergency surgery is not planned (ICH 2022, COR 3: Harm, LOE B-R); NCS/SCCM 2026 also suggests against platelet transfusion for antiplatelet-associated spontaneous IPH not requiring neurosurgery (conditional, low certainty).</li>
                            <li>Aspirin + emergency neurosurgery: platelet transfusion may be considered (ICH 2022, COR 2b, LOE C-LD; NCS/SCCM 2026 conditional recommendation for transfusion in spontaneous IPH on aspirin undergoing neurosurgery).</li>
                            <li>Desmopressin efficacy is uncertain for antiplatelet-associated hemorrhage (COR/LOE 2b/C-LD); the institutional source does not provide a dose.</li>
                            </ul>
                          </div>
                        </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-crit-700 mb-4 dark:text-crit-300">Hematoma Expansion Prevention</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border dark:bg-card">
                            <h4 className="font-semibold text-crit-600 mb-2 dark:text-crit-300">Blood Pressure Target</h4>
                            <p className="text-xs text-slate-500 mb-2 dark:text-mute">Spontaneous ICH only. Not for hemorrhage from a vascular malformation or for post-operative neurosurgical cases.</p>
                            <ul className="text-sm space-y-1">
                              <li><strong>Presenting SBP 150-219:</strong> target 140 and maintain 130-150.</li>
                              <li><strong>Presenting SBP ≥220:</strong> reduce by about 20%, never more than 25%, in the first hour; then gradually reduce to 140-160, and after at least 6 hours with a repeat head CT transition to the 130-150 target.</li>
                              <li><strong>Presenting SBP &lt;150:</strong> do not actively lower to 140.</li>
                              <li><strong>Timing:</strong> start as soon as possible, ideally within 2 hours of onset, and reach the selected target about 1 hour after treatment begins.</li>
                              <li><strong>Process:</strong> use smooth, sustained control and avoid peaks or variability.</li>
                              <li><strong>Lower boundary:</strong> avoid iatrogenic SBP &lt;130 during the first 24 hours. Spontaneous autoregulation below 130 is acceptable without symptomatic hypotension; vasopressors require agreement from the stroke and neurocritical-care attendings.</li>
                              <li><strong>Large/severe ICH or decompression:</strong> individualize and consider an initial SBP 160-180, reassessing after about 6 hours or repeat CT.</li>
                              <li><strong>Renal/ICP considerations:</strong> use caution with aggressive lowering in moderate-severe renal dysfunction and maintain CPP &gt;60 mmHg, especially with elevated ICP.</li>
                              <li><strong>Agents named by the institutional source:</strong> IV nicardipine or IV labetalol; no doses are supplied.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-crit-700 mb-4 dark:text-crit-300">IVH &amp; Hydrocephalus Management</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border dark:bg-card">
                            <h4 className="font-semibold text-orange-700 mb-2 dark:text-orange-300">EVD Indications</h4>
                            <ul className="text-sm space-y-1">
                              <li>Symptomatic hydrocephalus: urgent EVD evaluation.</li>
                              <li>Large IVH with impaired level of consciousness: EVD over medical management alone to reduce mortality (ICH 2022, COR 1, LOE B-NR).</li>
                              <li>Cerebellar ICH ≥15 mL, or with neurological deterioration, brainstem compression and/or hydrocephalus from ventricular obstruction → immediate surgical evacuation with or without EVD (ICH 2022, COR 1, LOE B-NR).</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-crit-700 mb-4 dark:text-crit-300">ICH Disposition &amp; Goals of Care</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border dark:bg-card">
                            <h4 className="font-semibold text-cobalt-600 mb-2 dark:text-cobalt-300">Surgical Indications</h4>
                            <ul className="text-sm space-y-1">
                              <li><strong>Cerebellar ICH ≥15 mL, or with neurological deterioration, brainstem compression and/or hydrocephalus from ventricular obstruction</strong>: immediate surgical evacuation with or without EVD (ICH 2022, COR 1, LOE B-NR); obtain urgent Neurosurgery evaluation.</li>
                              <li><strong>Life-threatening mass effect:</strong> evaluate for decompression; Neurosurgery leads the operative approach.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-crit-700 mb-4 dark:text-crit-300">ICH Supportive Care Bundle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border dark:bg-card">
                            <h4 className="font-semibold text-slate-700 mb-2 dark:text-ink-2">Standard Orders</h4>
                            <ul className="text-sm space-y-1">
                              <li>Use generic head-of-bed elevation.</li>
                              <li>Follow the admitting ICU team's workflow.</li>
                            </ul>
                          </div>
                          <div className="bg-white p-4 rounded border dark:bg-card">
                            <h4 className="font-semibold text-slate-700 mb-2 dark:text-ink-2">Monitoring</h4>
                            <ul className="text-sm space-y-1">
                              <li>• For anticoagulant reversal: neurologic checks every hour for 24 hours</li>
                              <li>• For anticoagulant reversal: CT at baseline, 6 hours or sooner for deterioration, and 24 hours</li>
                              <li>• For anticoagulant reversal: labs at baseline, 15-30 minutes, 6 hours, and 24 hours</li>
                              <li>• Blood pressure per the institutional ICH branches; monitor for thrombotic complications</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                          </div>
                        </details>
                      </div>
                    )}
                    {/* End of ICH Content */}

                    {/* Ischemic Stroke Management Content */}
                    {managementSubTab === 'ischemic' && (
                      <div id="mgmt-tabpanel-ischemic" role="tabpanel" aria-labelledby="mgmt-tab-ischemic" className="space-y-6">
                        {/* ============================================================
                            Acute Stroke Pathways — evidence-bound, de-identified cards.
                            Static import (src/management-guidance.js), bundled offline.
                            Renders ABOVE the existing Ischemic content (additive only).
                            Reuses: GUIDELINE_CLASS_COLORS badges, the
                            MANAGEMENT_REC_TO_ATLAS_REC → resolveClaimsWithCitations
                            evidence drawer, and navigateTo(tab,{subTab}) deep-links.
                           ============================================================ */}
                        {(() => {
                          // Map each command-center card's recommendationId to an
                          // Evidence Atlas recommendation id (mirrors the
                          // MANAGEMENT_REC_TO_ATLAS_REC pattern at ~app.jsx:21455).
                          // Only clinically faithful matches are mapped; unmapped
                          // cards fall back to a PubMed source-search link.
                          const COMMAND_CENTER_REC_TO_ATLAS_REC = {
                            'rec-ais-ivt-within-45h': 'rec-tnk-first-line',
                            'rec-late-window-ivt': 'rec-late-window-ivt',
                            'rec-evt-large-core': 'rec-evt-large-core'
                          };

                          // Reuse the existing navigate-then-scroll deep-link idiom
                          // (cf. navigateTo + scrollToSection at ~app.jsx:35058).
                          const goToCalculator = (calc) => {
                            if (!calc) return;
                            // Route known targets through the app's deep links, which reveal, scroll and focus them.
                            const CALC_ROUTES = { 'isch-evt': '#/protocols/ischemic/evt', 'isch-bp': '#/protocols/ischemic/bp', 'isch-postlytic': '#/protocols/ischemic/post-lytic', 'calc-nihss': '#/encounter/nihss', 'calc-aspects': '#/encounter/aspects', 'calc-pc-aspects': '#/encounter/pc-aspects', 'calc-alteplase': '#/encounter/alteplase', 'treatment-decision': '#/encounter/tnk' };
                            const href = CALC_ROUTES[calc.anchor];
                            if (href) { if (location.hash === href) { const key = href.split('/')[3]; if (href.startsWith('#/protocols/') && key) revealProtocolTarget(key); } else location.hash = href; return; }
                            if (calc.tab === 'encounter') {
                              navigateTo('encounter');
                              if (calc.anchor === 'treatment-decision') setEncounterPhase('phase-decision');
                              if (calc.anchor) window.setTimeout(() => scrollToSection(calc.anchor), 140);
                              return;
                            }
                            if (calc.tab === 'trials') {
                              setTrialsCategory('ischemic');
                              navigateTo('trials');
                              return;
                            }
                            // Default: a Protocols sub-tab anchor (management/protocols).
                            navigateTo(calc.tab || 'protocols', { subTab: calc.subTab || 'ischemic' });
                            if (calc.anchor) {
                              window.setTimeout(() => {
                                const el = document.getElementById(calc.anchor);
                                if (el) {
                                  if (el.tagName === 'DETAILS') el.open = true;
                                  scrollToSection(calc.anchor);
                                }
                              }, 160);
                            }
                          };

                          return (
                        <details id="acute-stroke-pathways" aria-labelledby="acute-stroke-pathways-heading" className="bg-white border border-line rounded-lg dark:bg-card">
                          <summary className="cursor-pointer p-4 font-semibold text-slate-900 hover:bg-slate-50 rounded-t-lg flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 dark:text-ink dark:hover:bg-paper-2">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt-600 dark:text-cobalt-300">Acute ischemic stroke</p>
                              <h2 id="acute-stroke-pathways-heading" className="text-lg font-semibold text-slate-900 dark:text-ink">Acute Stroke Pathways</h2>
                            </div>
                          </summary>
                          <div className="p-4 pt-0 space-y-3">

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {AIS_COMMAND_CENTER_CARDS.map((card) => {
                              const corClass = GUIDELINE_CLASS_COLORS[card.classOfRecommendation] || 'bg-slate-500 text-white';
                              const atlasRecId = COMMAND_CENTER_REC_TO_ATLAS_REC[card.recommendationId];
                              const atlasRec = atlasRecId ? getEvidenceRecommendationsMap().get(atlasRecId) : null;
                              const claimsExpanded = atlasRec ? resolveClaimsWithCitations(atlasRec.supportingClaimIds || []) : [];
                              const hasEvidenceDrawer = claimsExpanded.length > 0;
                              const pubmedUrl = card.evidenceQuery
                                ? `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(card.evidenceQuery)}`
                                : null;
                              return (
                                <article key={card.id} id={`aiscc-${card.id}`} className="v7-card bg-white border border-line rounded-lg p-4 flex flex-col gap-3 dark:bg-card">
                                  {/* Header: eyebrow urgency + title/shortLabel + COR/LOE badges */}
                                  <div className="flex flex-col gap-1.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cobalt-600 dark:text-cobalt-300">{card.urgency}</p>
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <h3 className="text-base font-semibold text-slate-900 leading-tight dark:text-ink">{card.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-mute">{card.shortLabel}</p>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {card.classOfRecommendation ? <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${corClass}`} title={`Class of Recommendation ${card.classOfRecommendation}`}>COR {card.classOfRecommendation}</span> : null}
                                        {card.levelOfEvidence ? <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-line dark:bg-paper-2 dark:text-ink-2" title={`Level of Evidence ${card.levelOfEvidence}`}>LOE {card.levelOfEvidence}</span> : null}
                                      </div>
                                    </div>
                                    {card.changedSinceLastGuideline ? (
                                      <details className="mt-0.5">
                                        <summary className="inline-flex items-center gap-1 cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-warn-700 bg-warn-50 border border-warn-200 rounded-full px-2 py-0.5 hover:bg-warn-100 dark:text-warn-300 dark:bg-warn-950 dark:border-warn-800 dark:hover:bg-warn-900">
                                          <i aria-hidden="true" data-lucide="sparkles" className="w-3 h-3"></i>
                                          What changed
                                        </summary>
                                        <p className="text-xs text-slate-700 mt-1.5 pl-1 dark:text-ink-2">{card.changedSinceLastGuideline}</p>
                                      </details>
                                    ) : null}
                                  </div>

                                  {/* Summary */}
                                  <p className="text-sm text-slate-700 dark:text-ink-2">{card.summary}</p>

                                  {/* Actions — ordered steps */}
                                  {card.actions && card.actions.length > 0 ? (
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1 dark:text-mute">Do now</p>
                                      <ol className="list-decimal list-outside pl-5 space-y-1 text-xs text-slate-700 marker:text-cobalt-500 marker:font-semibold dark:text-ink-2">
                                        {card.actions.map((step, i) => (
                                          <li key={i} className="pl-0.5">{step}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  ) : null}

                                  {/* Pathway — compact decision table */}
                                  {card.pathway && card.pathway.length > 0 ? (
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1 dark:text-mute">Decision pathway</p>
                                      <div className="overflow-x-auto -mx-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2" tabIndex={0} role="region" aria-label={`Scrollable table: ${card.shortLabel || card.title}`}>
                                        <table className="w-full text-xs border-collapse">
                                          <thead>
                                            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 dark:text-mute">
                                              <th scope="col" className="font-semibold px-1 py-1">Scenario</th>
                                              <th scope="col" className="font-semibold px-1 py-1">Decision</th>
                                              <th scope="col" className="font-semibold px-1 py-1 whitespace-nowrap">COR / LOE</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {card.pathway.map((row, i) => (
                                              <tr key={i} className="border-t border-line align-top">
                                                <td className="px-1 py-1.5 text-slate-700 font-medium dark:text-ink-2">{row.label}</td>
                                                <td className="px-1 py-1.5 text-slate-600 dark:text-ink-2">{row.decision}</td>
                                                <td className="px-1 py-1.5 whitespace-nowrap">
                                                  {row.cor ? <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${GUIDELINE_CLASS_COLORS[row.cor] || 'bg-slate-500 text-white'}`}>{row.cor}</span> : null}
                                                  {row.loe ? <span className="text-[10px] text-slate-500 ml-1 dark:text-mute">{row.loe}</span> : null}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ) : null}

                                  {/* Calculator deep-links */}
                                  {card.calculators && card.calculators.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {card.calculators.map((calc, i) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => goToCalculator(calc)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-cobalt-50 text-cobalt-700 border border-cobalt-200 hover:bg-cobalt-100 hover:border-cobalt-300 transition-colors min-h-[32px] dark:bg-cobalt-900 dark:text-cobalt-300 dark:border-cobalt-700 dark:hover:bg-cobalt-800"
                                        >
                                          <i aria-hidden="true" data-lucide="calculator" className="w-3 h-3"></i>
                                          {calc.label}
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}

                                  {/* Pitfalls — caution styling */}
                                  {card.pitfalls && card.pitfalls.length > 0 ? (
                                    <div className="bg-warn-50 border border-warn-200 rounded-md p-2.5 dark:bg-warn-950 dark:border-warn-800">
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-warn-800 mb-1 flex items-center gap-1 dark:text-warn-300">
                                        <i aria-hidden="true" data-lucide="alert-triangle" className="w-3 h-3"></i>
                                        Pitfalls
                                      </p>
                                      <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-warn-900 dark:text-warn-300">
                                        {card.pitfalls.map((p, i) => (
                                          <li key={i}>{p}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : null}

                                  {/* Teaching pearl — subtle callout */}
                                  {card.teachingPearl ? (
                                    <div className="border-l-4 border-cobalt-300 bg-cobalt-50 px-3 py-1.5 rounded-r dark:border-cobalt-700 dark:bg-cobalt-900">
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-cobalt-700 mb-0.5 dark:text-cobalt-300">Teaching pearl</p>
                                      <p className="text-xs text-slate-700 italic dark:text-ink-2">{card.teachingPearl}</p>
                                    </div>
                                  ) : null}

                                  {/* Evidence link: atlas drawer if resolvable, else PubMed fallback */}
                                  {card.id === 'ais-pediatric' && hasEvidenceDrawer ? (
                                    <details className="border border-cobalt-200 bg-white rounded dark:border-cobalt-700 dark:bg-card">
                                      <summary className="cursor-pointer px-2 py-1 text-xs font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded flex items-center gap-1.5 dark:text-cobalt-300 dark:hover:bg-cobalt-900">
                                        <i aria-hidden="true" data-lucide="link" className="w-3 h-3"></i>
                                        Why this recommendation? ({claimsExpanded.length} supporting claim{claimsExpanded.length === 1 ? '' : 's'})
                                      </summary>
                                      <div className="px-2 pb-2 pt-1 space-y-1.5">
                                        {claimsExpanded.map((cl) => (
                                          <div key={cl.id} className="bg-slate-50 border border-line rounded p-2 dark:bg-paper-2">
                                            <p className="text-xs text-slate-800 italic dark:text-ink">{cl.statement}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 dark:text-mute">Certainty: <span className="font-semibold">{cl.certainty}</span>{cl.conflictNotes ? ` · Conflict: ${cl.conflictNotes}` : ''}</p>
                                            {cl.citationRecords && cl.citationRecords.length > 0 ? (
                                              <ul className="mt-1 list-disc list-inside text-[11px] text-slate-700 dark:text-ink-2">
                                                {cl.citationRecords.map((c) => (
                                                  <li key={c.id}>
                                                    {c.title} ({c.journal}{c.year ? ` ${c.year}` : ''})
                                                    {citationLink(c) ? (
                                                      <> · <a href={citationLink(c)} target="_blank" rel="noopener noreferrer" className="text-cobalt-700 underline hover:underline dark:text-cobalt-300">{c.pmid ? `PMID ${c.pmid}` : (c.doi ? `DOI ${c.doi}` : 'link')}</a></>
                                                    ) : null}
                                                  </li>
                                                ))}
                                              </ul>
                                            ) : null}
                                          </div>
                                        ))}
                                        {atlasRec && atlasRec.caveats && atlasRec.caveats.length > 0 ? (
                                          <div className="bg-warn-50 border border-warn-200 rounded p-1.5 text-[11px] text-warn-900 dark:bg-warn-950 dark:border-warn-800 dark:text-warn-300">
                                            <span className="font-semibold">Caveats:</span> {atlasRec.caveats.join(' · ')}
                                          </div>
                                        ) : null}
                                      </div>
                                    </details>
                                  ) : card.id === 'ais-pediatric' && pubmedUrl ? (
                                    <a href={pubmedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-link-600 dark:text-link-400 hover:text-link-700 hover:underline">
                                      <i aria-hidden="true" data-lucide="external-link" className="w-3 h-3"></i>
                                      Search the evidence (PubMed)
                                    </a>
                                  ) : card.sourceNote ? (
                                    <details className="border border-cobalt-200 bg-white rounded dark:border-cobalt-700 dark:bg-card">
                                      <summary className="cursor-pointer px-2 py-1 text-xs font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded dark:text-cobalt-300 dark:hover:bg-cobalt-900">Institutional source basis</summary>
                                      <p className="px-2 pb-2 pt-1 text-xs text-slate-700 dark:text-ink-2">{card.sourceNote}</p>
                                    </details>
                                  ) : null}
                                </article>
                              );
                            })}
                          </div>

                          {/* Footer — last reviewed + source links */}
                          <div className="text-xs text-slate-500 border-t border-line pt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 dark:text-mute">
                            <span>Adult cards last reviewed {AIS_COMMAND_CENTER_LAST_REVIEWED} · Public-safe adult institutional source labels:</span>
                            {AIS_SOURCE_LINKS.map((src, i) => (
                              <span key={i} className="inline-flex items-center">
                                <span className="inline-flex items-center gap-0.5 text-slate-600 dark:text-ink-2">{src.label}</span>
                                {i < AIS_SOURCE_LINKS.length - 1 ? <span className="text-slate-300" aria-hidden="true">·</span> : null}
                              </span>
                            ))}
                          </div>
                          </div>
                        </details>
                          );
                        })()}

                        {/* Section TOC */}
                        <div className="bg-slate-50 border border-line rounded-lg p-3 dark:bg-paper-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 dark:text-mute">Jump to Section</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              ['isch-evt', 'EVT Eligibility'],
                              ['isch-bp', 'BP Management'],
                              ['isch-swallow', 'Swallow Screen'],
                              ['isch-postlytic', 'Post-Lytic ICH'],
                              ['isch-angioedema', 'Angioedema'],
                              ['isch-largecore', 'Large Core'],
                              ['isch-postevt', 'Post-EVT'],
                              ['isch-mevo', 'MeVO'],
                              ['isch-contrast', 'Contrast Allergy'],
                              ['isch-posterior', 'Posterior Circ'],
                            ].map(([id, label]) => (
                              <button key={id} type="button" onClick={() => jumpToSection(id)}
                                className="px-2.5 py-1.5 text-xs rounded-full bg-white border border-slate-300 text-slate-600 hover:bg-cobalt-50 hover:border-cobalt-300 hover:text-cobalt-700 transition-colors dark:bg-card dark:border-strong dark:text-ink-2 dark:hover:bg-cobalt-900 dark:hover:text-cobalt-300">
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Key Principles */}
                        <div className="border-l-4 border-cobalt-400 bg-slate-50 px-3 py-2 text-sm space-y-1 dark:bg-paper-2">
                          <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide dark:text-ink">Key Principles</p>
                          <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5 dark:text-ink-2">
                            <li>For IV thrombolysis, establish a disabling deficit, time from last known well, noncontrast CT findings, blood pressure, glucose, and the source-listed exclusions.</li>
                            <li>For EVT, apply the institutional vessel, time, ASPECTS or PC-ASPECTS, NIHSS, baseline mRS, and low-ASPECTS qualifiers shown below.</li>
                            <li>After documented successful EVT recanalization (mTICI ≥2b), maintain the institutional SBP guardrail of 140-180 mmHg.</li>
                            <li>For every EVT, keep BP ≤180/105 during the procedure and for 24 hours afterward.</li>
                          </ul>
                        </div>
                        <details id="isch-evt" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700">
                          <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-100/50 rounded-t-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2 dark:text-cobalt-300 dark:hover:bg-cobalt-800">
                            <h2 className="text-lg font-semibold text-cobalt-800 dark:text-cobalt-300">EVT Eligibility — Quick Reference</h2>
                          </summary>
                          <div className="p-4 pt-0">

                          {/* Adult EVT Flowchart */}
                          <div className="space-y-3 mb-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-cobalt-700 dark:text-cobalt-300">Adult AIS — EVT Eligibility</p>
                            <div className="bg-white rounded-md border-l-4 border-cobalt-600 p-3 dark:bg-card ">
                              <p className="font-semibold text-cobalt-800 text-sm dark:text-cobalt-300">Anterior ICA / proximal M1 LVO</p>
                              <p className="text-xs text-slate-600 mt-1 dark:text-ink-2">NIHSS ≥6. Baseline mRS 0-1 is assumed unless another tier is stated.</p>
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-ink-2">
                                <div>
                                  <p className="font-bold text-cobalt-600 dark:text-cobalt-300">0-6 hours</p>
                                  <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>ASPECTS 6-10, mRS 0-1: EVT, COR I / LOE A.</li>
                                    <li>ASPECTS 6-10, mRS 2: EVT, COR IIa / LOE B-NR.</li>
                                    <li>ASPECTS 6-10, mRS 3-4: EVT, COR IIb / LOE B-NR.</li>
                                    <li>ASPECTS 3-5 with no significant mass effect: EVT, COR I / LOE A.</li>
                                    <li>ASPECTS 0-2, age &lt;80, no significant mass effect, and CTP core ≤70 mL: EVT, COR IIa / LOE B-R.</li>
                                    <li>Same branch with CTP core 71-100 mL: pending protocol-owner adjudication; the source prints ≤70-100 mL without one executable cutoff.</li>
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-bold text-cobalt-600 dark:text-cobalt-300">6-24 hours</p>
                                  <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>ASPECTS 6-10: EVT, COR I / LOE A.</li>
                                    <li>ASPECTS 3-5, age &lt;80, and no significant mass effect: EVT, COR I / LOE A.</li>
                                  </ul>
                                  <p className="mt-2 text-slate-500 dark:text-mute">The institutional flowchart supplies no adult anterior-circulation tier beyond 24 hours.</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-md border-l-4 border-cobalt-500 p-3 dark:bg-card ">
                              <p className="font-semibold text-cobalt-800 text-sm mb-2 dark:text-cobalt-300">Basilar Artery</p>
                              <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1 dark:text-ink-2">
                                <li>Within 24 hours, PC-ASPECTS ≥6, NIHSS ≥10: EVT, COR I / LOE A.</li>
                                <li>Within 24 hours, PC-ASPECTS ≥6, NIHSS 6-9: EVT effectiveness is not well established, COR IIb / LOE B-R.</li>
                              </ul>
                            </div>
                            <div className="bg-white rounded-md border-l-4 border-slate-400 p-3 dark:bg-card ">
                              <p className="font-semibold text-slate-800 text-sm mb-2 dark:text-ink">M2 / Distal Vessels</p>
                              <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1 dark:text-ink-2">
                                <li>Dominant proximal M2 (≤1 cm from the bifurcation and supplying ≥50% of MCA territory), 0-6 hours, ASPECTS ≥6, NIHSS ≥6: EVT, COR IIa / LOE B-NR.</li>
                                <li>The same dominant-M2 criteria at 6-24 hours also require CTP hypoperfusion-hypodensity mismatch: EVT, institutional tier; no AHA/ASA 2026 grade for 6-24 h.</li>
                                <li>Nondominant or codominant M2, distal MCA, ACA, or PCA: no EVT, COR III: No Benefit / LOE A (AHA/ASA 2026).</li>
                              </ul>
                            </div>
                            <div className="bg-white rounded-md border-l-4 border-warn-500 p-3 dark:bg-card ">
                              <p className="font-semibold text-slate-800 text-sm mb-2 dark:text-ink">Generalizability limited for</p>
                              <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1 dark:text-ink-2">
                                {GENERALIZABILITY_LIMITATIONS.map((limitation, i) => (
                                  <li key={i}>{limitation}</li>
                                ))}
                              </ul>
                              <p className="text-xs text-slate-600 mt-2 dark:text-ink-2">The institutional flowchart prints these as limits on how far its recommendations generalize; they are not separate exclusion criteria.</p>
                            </div>
                          </div>

                          {/* Pediatric EVT Flowchart */}
                          <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-cobalt-700 dark:text-cobalt-300">Pediatric AIS — EVT Eligibility</p>

                            <div className="bg-white rounded-md border-l-4 border-sky-500 p-3 dark:bg-card ">
                              <p className="font-semibold text-sky-800 text-sm mb-2 dark:text-sky-300">Pediatric LVO</p>
                              <div className="ml-2 pl-3 border-l-2 border-sky-200 dark:border-sky-800">
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-slate-700 dark:text-ink-2">Age 6-17y, 0-24h, salvageable tissue</span>
                                    <span className="text-slate-500 dark:text-mute">→</span>
                                    <span className="px-2 py-0.5 rounded-full bg-ok-100 text-ok-800 font-semibold border border-ok-300 dark:bg-ok-900 dark:text-ok-300 dark:border-ok-800">Reasonable</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-slate-700 dark:text-ink-2">Age 28d-5y, 0-24h, salvageable tissue</span>
                                    <span className="text-slate-500 dark:text-mute">→</span>
                                    <span className="px-2 py-0.5 rounded-full bg-warn-100 text-warn-800 font-semibold border border-warn-300 dark:bg-warn-900 dark:text-warn-300 dark:border-warn-800">May be considered</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-slate-500 dark:text-mute">Neonates (0-28d) / &gt;24h</span>
                                    <span className="text-slate-500 dark:text-mute">→</span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-300 dark:bg-paper-2 dark:text-ink-2 dark:border-strong">Individualized</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-ink-2">
                              <span><span className="inline-block w-3 h-3 rounded-full bg-ok-600 align-middle mr-1"></span>Recommended</span>
                              <span><span className="inline-block w-3 h-3 rounded-full bg-ok-100 border border-ok-300 align-middle mr-1 dark:bg-ok-900 dark:border-ok-800"></span>Reasonable</span>
                              <span><span className="inline-block w-3 h-3 rounded-full bg-warn-100 border border-warn-300 align-middle mr-1 dark:bg-warn-900 dark:border-warn-800"></span>May be considered / Uncertain</span>
                              <span><span className="inline-block w-3 h-3 rounded-full bg-crit-100 border border-crit-300 align-middle mr-1 dark:bg-crit-950 dark:border-crit-800"></span>Not recommended</span>
                              <span><span className="inline-block w-3 h-3 rounded-full bg-slate-100 border border-slate-300 align-middle mr-1 dark:bg-paper-2 dark:border-strong"></span>Individualized decision</span>
                            </div>
                          </div>
                          </div>
                        </details>

                        <details className="bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700">
                          <summary className="cursor-pointer px-4 py-3 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-lg dark:text-cobalt-300 dark:hover:bg-cobalt-900">Ischemic protocol details</summary>
                          <div className="p-4 space-y-6">
                        <details className="bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700">
                          <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-t-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2 dark:text-cobalt-300 dark:hover:bg-cobalt-900">
                            <div>
                              <h2 className="text-lg font-semibold text-cobalt-800 dark:text-cobalt-300">EVT Eligibility Builder</h2>
                              <p className="text-xs text-slate-500 font-normal dark:text-mute">Institutional adult EVT flowchart. Pediatric criteria remain separate and unchanged.</p>
                            </div>
                            <span className="text-xs text-slate-500 font-normal dark:text-mute">
                              Auto time: {calculateTimeFromLKW() ? `${calculateTimeFromLKW().label}: ${calculateTimeFromLKW().hours}h ${calculateTimeFromLKW().minutes}m` : 'Set LKW'}
                            </span>
                          </summary>
                          <div className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <label htmlFor="evt-occlusion" className="block text-xs text-slate-500 mb-1 dark:text-mute">Occlusion</label>
                              <select
                                id="evt-occlusion"
                                value={evtDecisionInputs.occlusion}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, occlusion: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                              >
                                <option value="">Not assessed</option>
                                <option value="lvo">LVO (ICA / proximal M1)</option>
                                <option value="mvo-dominant">MVO (dominant M2)</option>
                                <option value="mvo-codominant">MVO (codominant M2)</option>
                                <option value="mvo-nondominant">MVO (nondominant M2)</option>
                                <option value="aca">ACA</option>
                                <option value="pca">PCA</option>
                                <option value="basilar">Basilar artery</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="evt-time-window" className="block text-xs text-slate-500 mb-1 dark:text-mute">Time window</label>
                              <select
                                id="evt-time-window"
                                value={evtDecisionInputs.timeWindow}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, timeWindow: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                              >
                                <option value="auto">Auto (from LKW)</option>
                                <option value="0-6">0-6 h</option>
                                <option value="6-24">6-24 h</option>
                                <option value=">24">&gt;24 h</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="evt-aspects" className="block text-xs text-slate-500 mb-1 dark:text-mute">ASPECTS</label>
                              <select
                                id="evt-aspects"
                                disabled={!!encounter}
                                value={evtDecisionInputs.aspects}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, aspects: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                              >
                                <option value="">Not assessed</option>
                                <option value="6-10">6-10</option>
                                <option value="3-5">3-5</option>
                                <option value="0-2">0-2</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="evt-prestroke-mrs" className="block text-xs text-slate-500 mb-1 dark:text-mute">Pre-stroke mRS</label>
                              <select
                                id="evt-prestroke-mrs"
                                disabled={!!encounter}
                                value={evtDecisionInputs.mrs}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, mrs: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                              >
                                <option value="">Not assessed</option>
                                <option value="0-1">0-1</option>
                                <option value="2">2</option>
                                <option value="3-4">3-4</option>
                                <option value="5-6">5-6 (no source tier)</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="evt-nihss-basilar" className="block text-xs text-slate-500 mb-1 dark:text-mute">NIHSS</label>
                              <input
                                id="evt-nihss-basilar"
                                readOnly={!!encounter}
                                type="number"
                                value={evtDecisionInputs.nihss}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, nihss: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                                placeholder="e.g. 12"
                              />
                            </div>
                            <div>
                              <label htmlFor="evt-pc-aspects-basilar" className="block text-xs text-slate-500 mb-1 dark:text-mute">PC-ASPECTS (Basilar)</label>
                              <select
                                id="evt-pc-aspects-basilar"
                                disabled={!!encounter}
                                value={evtDecisionInputs.pcAspects}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, pcAspects: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                              >
                                <option value="">Not assessed</option>
                                <option value=">=6">≥6</option>
                                <option value="<6">&lt;6</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="evt-age" className="block text-xs text-slate-500 mb-1 dark:text-mute">Age</label>
                              <input
                                id="evt-age"
                                type="number"
                                min="18"
                                max="120"
                                value={evtDecisionInputs.age}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, age: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                                placeholder="Required for selected low-ASPECTS tiers"
                              />
                            </div>
                            <div>
                              <label htmlFor="evt-mass-effect" className="block text-xs text-slate-500 mb-1 dark:text-mute">Significant mass effect</label>
                              <select
                                id="evt-mass-effect"
                                disabled={encounter?.compatible === false}
                                value={evtDecisionInputs.massEffect}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, massEffect: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                              >
                                <option value="">Not assessed</option>
                                <option value="none">Absent</option>
                                <option value="present">Present</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="evt-ctp-core" className="block text-xs text-slate-500 mb-1 dark:text-mute">CTP Core (mL)</label>
                              <input
                                id="evt-ctp-core"
                                disabled={encounter?.compatible === false}
                                type="number"
                                min="0"
                                max="500"
                                value={evtDecisionInputs.coreVolume}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, coreVolume: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                                placeholder="Auto or manual"
                              />
                            </div>
                            <div>
                              <label htmlFor="evt-mismatch-ratio" className="block text-xs text-slate-500 mb-1 dark:text-mute">Mismatch ratio</label>
                              <input
                                id="evt-mismatch-ratio"
                                type="number"
                                min="0"
                                step="0.1"
                                max="20"
                                value={evtDecisionInputs.mismatchRatio}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, mismatchRatio: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                                placeholder="e.g. 1.8"
                              />
                            </div>
                            <div>
                              <label htmlFor="evt-mismatch-volume" className="block text-xs text-slate-500 mb-1 dark:text-mute">Mismatch volume (mL)</label>
                              <input
                                id="evt-mismatch-volume"
                                type="number"
                                min="-200"
                                max="500"
                                value={evtDecisionInputs.mismatchVolume}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, mismatchVolume: e.target.value }))}
                                className="w-full px-2 py-2 border border-line rounded-lg"
                                placeholder="Penumbra - core"
                              />
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-700 mt-5 dark:text-ink-2">
                              <input
                                type="checkbox"
                                checked={!!evtDecisionInputs.disablingDeficit}
                                disabled={encounter?.compatible === false}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, disablingDeficit: e.target.checked }))}
                                className="rounded border-slate-300 text-cobalt-600 dark:border-strong dark:text-cobalt-300"
                              />
                              Disabling deficit present (documentation; not an institutional EVT-tier substitute)
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 mt-5 dark:text-ink-2">
                              <input
                                type="checkbox"
                                checked={!!evtDecisionInputs.ctpMismatch}
                                onChange={(e) => setEvtDecisionInputs(prev => ({ ...prev, ctpMismatch: e.target.checked }))}
                                className="rounded border-slate-300 text-cobalt-600 dark:border-strong dark:text-cobalt-300"
                              />
                              CTP hypoperfusion-hypodensity mismatch confirmed (late dominant M2)
                            </label>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const perf = getPerfusionMetrics(telestrokeNote);
                                setEvtDecisionInputs(prev => ({
                                  ...prev,
                                  coreVolume: !encounter && perf.coreVolume !== null ? String(Math.round(perf.coreVolume)) : prev.coreVolume,
                                  mismatchRatio: perf.mismatchRatio !== null ? perf.mismatchRatio.toFixed(1) : prev.mismatchRatio,
                                  mismatchVolume: perf.mismatchVolume !== null ? String(Math.round(perf.mismatchVolume)) : prev.mismatchVolume
                                }));
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-cobalt-300 text-cobalt-700 text-xs font-semibold hover:bg-cobalt-50 dark:border-cobalt-700 dark:text-cobalt-300 dark:hover:bg-cobalt-900"
                            >
                              Pull from Encounter CTP
                            </button>
                            <span className="text-xs text-slate-500 dark:text-mute">CTP core is used only for the source-listed early ASPECTS 0-2 tier. Mismatch ratio and volume remain documentation inputs; they do not create an EVT tier in the institutional flowchart.</span>
                          </div>
                          {(() => {
                            const result = getEvtEligibilityRecommendation(evtDecisionInputs, calculateTimeFromLKW());
                            return (
                              <div className={`mt-4 rounded-lg border p-3 ${
                                result.color === 'emerald'
                                  ? 'bg-ok-50 border-ok-200 text-ok-800 dark:bg-ok-950 dark:border-ok-800 dark:text-ok-300'
                                  : result.color === 'amber'
                                    ? 'bg-warn-50 border-warn-200 text-warn-800 dark:bg-warn-950 dark:border-warn-800 dark:text-warn-300'
                                    : result.color === 'rose'
                                      ? 'bg-crit-50 border-crit-200 text-crit-800 dark:bg-crit-950 dark:border-crit-800 dark:text-crit-300'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-paper-2 dark:border-line dark:text-ink-2'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs uppercase tracking-wide">Class of Recommendation</p>
                                    <p className="text-lg font-semibold">{result.classOfRec}</p>
                                  </div>
                                  <p className="text-sm font-medium">{result.label}</p>
                                </div>
                                {result.rationale && result.rationale.length > 0 && (
                                  <ul className="text-xs mt-2 space-y-1">
                                    {result.rationale.map((item, idx) => (
                                      <li key={idx}>• {item}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })()}
                          </div>
                        </details>



                        <details className="bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700">
                          <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-t-lg flex items-center justify-between dark:text-cobalt-300 dark:hover:bg-cobalt-900">
                            <h2 className="text-lg font-semibold text-cobalt-800 dark:text-cobalt-300">Pediatric Reperfusion (28 days–18 years)</h2>
                          </summary>
                          <div className="p-4 pt-0">
                          <ul className="text-sm space-y-1 text-slate-700 dark:text-ink-2">
                            <li>• MRI is preferred for diagnostic imaging when feasible.</li>
                            <li>• IV thrombolysis may be considered within 4.5h in select children at experienced centers (Class IIb).</li>
                            <li>• EVT for LVO is reasonable for age ≥6 years (Class IIa).</li>
                            <li>• EVT may be considered for age 28 days–6 years with experienced neurointerventionalist (Class IIb).</li>
                          </ul>
                          </div>
                        </details>

                        <details id="isch-bp" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700">
                          <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-100/50 rounded-t-lg flex items-center justify-between dark:text-cobalt-300 dark:hover:bg-cobalt-800">
                            <h2 className="text-lg font-semibold text-cobalt-800 dark:text-cobalt-300">Blood Pressure Management</h2>
                          </summary>
                          <div className="p-4 pt-0">

                          <div className="bg-white border border-cobalt-200 rounded-lg p-3 mb-4 dark:bg-card dark:border-cobalt-700">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold text-cobalt-800 dark:text-cobalt-300">Phase-aware BP target</h3>
                                <p className="text-xs text-slate-500 dark:text-mute">Toggles update the target and highlight current BP status.</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {ischemicBpPhaseKeys.map((key) => {
                                  const value = bpPhaseTargets[key];
                                  return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setBpPhase(key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                      currentBpPhase === key
                                        ? 'bg-cobalt-600 text-white border-cobalt-600'
                                        : 'bg-cobalt-50 text-cobalt-700 border-cobalt-200 hover:bg-cobalt-100 dark:bg-cobalt-900 dark:text-cobalt-300 dark:border-cobalt-700 dark:hover:bg-cobalt-800'
                                    }`}
                                  >
                                    {value.label}
                                  </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                              <div className="bg-cobalt-50 border border-cobalt-100 rounded-lg p-2 dark:bg-cobalt-900">
                                <p className="text-xs uppercase tracking-wide text-cobalt-600 dark:text-cobalt-300">Target</p>
                                <p className="text-sm font-semibold text-cobalt-800 dark:text-cobalt-300">
                                  {currentBpPhase === 'post-evt'
                                    ? postEvtSourceTargetApplies
                                      ? `SBP ${currentBpTarget.systolicLow}-${currentBpTarget.systolicHigh} and ≤${currentBpTarget.systolic}/${currentBpTarget.diastolic} (mTICI ≥2b)`
                                      : `BP ≤${currentBpTarget.systolic}/${currentBpTarget.diastolic} for 24 h (all EVT)`
                                    : `BP <${currentBpTarget.systolic}/${currentBpTarget.diastolic}`}
                                </p>
                              </div>
                              <div className="bg-slate-50 border border-line rounded-lg p-2 dark:bg-paper-2">
                                <label htmlFor="protocol-bp-check" className="block text-xs uppercase tracking-wide text-slate-500 dark:text-mute">Current BP</label>
                                <input
                                  id="protocol-bp-check"
                                  type="text"
                                  value={bpCheckValue}
                                  onChange={(e) => setBpProtocolCheck(e.target.value)}
                                  className="w-full mt-1 px-2 py-1 border border-line rounded text-sm"
                                  placeholder="e.g. 172/98"
                                />
                                <p className="text-xs text-slate-500 mt-1 dark:text-mute">Compared only with the selected ischemic treatment phase. Prefilled from the Encounter BP until edited; not saved to the note.</p>
                              </div>
                              <div className={`rounded-lg p-2 border ${bpWithinTarget === null ? 'bg-slate-50 border-slate-200 dark:bg-paper-2 dark:border-line' : bpWithinTarget ? 'bg-ok-50 border-ok-200 dark:bg-ok-950 dark:border-ok-800' : 'bg-crit-50 border-crit-200 dark:bg-crit-950 dark:border-crit-800'}`}>
                                <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-mute">Status</p>
                                <p className="text-sm font-semibold">
                                  {bpOrderInvalid
                                    ? 'Check BP order (systolic must exceed diastolic)'
                                    : bpWithinTarget === null
                                      ? 'Enter BP to check'
                                      : bpWithinTarget
                                        ? 'Within target'
                                        : 'Outside target'}
                                </p>
                                {bpWithinTarget === false && (
                                  <p className="text-xs text-crit-600 mt-1 dark:text-crit-300">The entered value does not meet the selected institutional threshold.</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded border dark:bg-card">
                              <h3 className="font-semibold text-ok-700 mb-2 dark:text-ok-300">BP Goals</h3>
                              <ul className="text-sm space-y-1">
                                <li><strong>Before lytics:</strong> SBP &lt;185, DBP &lt;110</li>
                                <li><strong>After lytics:</strong> SBP &lt;180, DBP &lt;105</li>
                                <li><strong>After documented successful thrombectomy recanalization (mTICI ≥2b):</strong> SBP 140-180</li>
                                <li><strong>All EVT:</strong> maintain BP ≤180/105 during and for 24 hours after the procedure (AHA/ASA 2026, COR 2a, LOE B-NR)</li>
                                <li><strong>After successful reperfusion (mTICI ≥2b):</strong> intensive SBP lowering to &lt;140 is harmful (AHA/ASA 2026, COR 3: Harm, LOE A)</li>
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded border dark:bg-card">
                              <h3 className="font-semibold text-cobalt-700 mb-2 dark:text-cobalt-300">Quick Reference</h3>
                              <ul className="text-sm space-y-1">
                                <li><strong>Before IVT:</strong> Labetalol IV push per the source-listed sequence</li>
                              </ul>
                            </div>
                          </div>

                          </div>
                        </details>

                        <details id="isch-swallow" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700">
                          <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-t-lg flex items-center justify-between dark:text-cobalt-300 dark:hover:bg-cobalt-900">
                            <h2 className="text-lg font-semibold text-cobalt-800 dark:text-cobalt-300">Stroke-Specific Nursing Swallow Screen</h2>
                          </summary>
                          <div className="p-4 pt-0 space-y-3 text-sm text-slate-700 dark:text-ink-2">
                            <p>Only a competency-validated registered nurse performs this stroke-specific screen.</p>
                            <ol className="list-decimal pl-5 space-y-1">
                              <li>Check whether GCS is &lt;13 or whether lower-facial, tongue, or palatal asymmetry/weakness is present.</li>
                              <li>If any answer is yes: stop the screen, document failure, keep the patient NPO including medications, request Speech-Language Pathology evaluation, and notify the treating team.</li>
                              <li>If all answers are no: administer 3 ounces of water by uninterrupted drinking and observe for throat clearing, cough, or voice-quality change immediately and for 1 minute.</li>
                              <li>If any water-step sign occurs: document failure, keep NPO including medications, request Speech-Language Pathology evaluation, and notify the treating team. Otherwise document pass and use the appropriate diet/medication pathway.</li>
                            </ol>
                            <p className="text-xs text-slate-600 dark:text-mute">A repeat RN screen within 24 hours after thrombolysis and/or thrombectomy requires significant neurologic improvement (NIHSS ≤5; no facial droop, tongue/palatal asymmetry, or airway concern), an authorized attending request, documented rationale, and team notification. Do not repeat the RN screen after an SLP evaluation has already been completed. If the patient’s clinical condition subsequently worsens, reconsider the need for further assessment.</p>
                          </div>
                        </details>

                        <details id="isch-postlytic" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-crit-50 border border-crit-200 rounded-lg dark:bg-crit-950 dark:border-crit-800">
                          <summary className="cursor-pointer p-4 font-semibold text-crit-800 hover:bg-crit-100/50 rounded-t-lg flex items-center justify-between dark:text-crit-300 dark:hover:bg-crit-900">
                            <h2 className="text-lg font-semibold text-crit-800 dark:text-crit-300">Post-Lytic ICH Protocol</h2>
                          </summary>
                          <div className="p-4 pt-0">

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border dark:bg-card">
                              <h3 className="font-semibold mb-2">Immediate Actions</h3>
                              <ol className="text-sm space-y-1 list-decimal list-inside">
                                <li>Stop thrombolytic if still running</li>
                                <li>STAT non-contrast CT head + STAT blood draw (PT/INR, platelets, fibrinogen, PTT, TT, D-dimers, CBC, Type &amp; Cross)</li>
                                <li>Contact blood bank/transfusion services and order 2 pre-pooled units of cryoprecipitate (each pool ≈5 single-donor units; total ≈10 units)</li>
                                <li>Notify the patient’s family of the change in status</li>
                                <li>If CT will be delayed &gt;30 minutes and fibrinogen is &lt;200 mg/dL, empirically administer the 2 pre-pooled units (≈10 units) IV over 10-30 minutes</li>
                              </ol>
                            </div>
                            <div className="bg-white p-3 rounded border dark:bg-card">
                              <h3 className="font-semibold mb-2">CT Result Branch</h3>
                              <ul className="text-sm space-y-1">
                                <li><strong>Intracranial blood on CT:</strong> confirm the CT result with the ordering provider and administer 2 pre-pooled units of cryoprecipitate (each pool ≈5 single-donor units; total ≈10 units) IV over 10-30 minutes</li>
                                <li><strong>Before TXA:</strong> verbally confirm with the RN that administration is post-CT; after both confirmations, give tranexamic acid 1,000 mg IV over 10 minutes</li>
                                <li><strong>Then:</strong> repeat the emergency hemorrhage panel STAT, every 30 minutes twice, then every 4 hours until normal; contact the Stroke/Neurology attending, consult Neurosurgery if needed, and update the family again</li>
                                <li><strong>No intracranial blood on CT:</strong> do <strong>NOT</strong> restart the lytic; consider other causes — extending infarct, seizure, hypoxia, hypercarbia, hypoglycemia, or electrolyte abnormalities</li>
                                <li><strong>No ICH on CT while empiric cryoprecipitate is infusing:</strong> stop cryoprecipitate and do not restart the thrombolytic</li>
                              </ul>
                            </div>
                          </div>
                          <div className="mt-3 bg-white p-3 rounded border dark:bg-card">
                            <h3 className="font-semibold mb-2">Monitoring and Escalation</h3>
                            <ul className="text-sm space-y-1">
                              <li>• Neurologic checks and vital signs every 15 minutes for 2 hours, every 30 minutes for 6 hours, then every hour for 16 hours</li>
                              <li>• Notify the provider for SBP &gt;180 or DBP &gt;105, a new neurologic deficit, or a GCS decrease of at least 2 points</li>
                              <li>• Repeat the emergency hemorrhage panel STAT, every 30 minutes twice, then every 4 hours until normal; if abnormalities persist or bleeding remains uncontrolled, consult the Hematology attending</li>
                            </ul>
                          </div>
                          </div>
                        </details>

                        <details id="isch-angioedema" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-warn-50 border border-warn-300 rounded-lg dark:bg-warn-950 dark:border-warn-800">
                          <summary className="cursor-pointer p-4 font-semibold text-warn-800 hover:bg-warn-100/50 rounded-t-lg flex items-center justify-between dark:text-warn-300 dark:hover:bg-warn-900">
                            <h2 className="text-lg font-semibold text-warn-800 dark:text-warn-300">Orolingual Angioedema Protocol</h2>
                          </summary>
                          <div className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border dark:bg-card">
                              <h3 className="font-semibold text-warn-700 mb-2 dark:text-warn-300">Airway Assessment and Plan</h3>
                              <ul className="text-sm space-y-1">
                                <li><strong>Maintain airway</strong> — intubation may not be necessary if edema is limited to the anterior tongue and lips.</li>
                                <li>Edema involving the larynx, palate, floor of mouth, or oropharynx with rapid progression within 30 minutes poses higher risk of requiring intubation.</li>
                                <li>Awake fiberoptic intubation is optimal. Nasal-tracheal intubation may be required but poses epistaxis risk after IV thrombolysis; cricothyroidotomy is rarely needed and is also problematic after IV thrombolysis.</li>
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded border dark:bg-card">
                              <h3 className="font-semibold text-warn-700 mb-2 dark:text-warn-300">Medication and Supportive Care</h3>
                              <ul className="text-sm space-y-1">
                                <li><strong>Hold ACE inhibitors</strong> — stop the thrombolytic infusion <em>if alteplase is being administered</em></li>
                                <li><strong>Methylprednisolone:</strong> 125 mg IV</li>
                                <li><strong>Diphenhydramine:</strong> 50 mg IV</li>
                                <li><strong>Famotidine:</strong> 20 mg IV</li>
                                <li><strong>If edema further increases: Epinephrine</strong> (0.1%) 0.3 mL subcutaneously or 0.5 mL by nebulizer</li>
                                <li><strong>Icatibant:</strong> 30 mg SC once; attending approval is required</li>
                                <li><strong>Supportive care</strong></li>
                              </ul>
                              <p className="text-xs text-warn-700 mt-2 dark:text-warn-300"><strong>Restricted alternative, not part of the active adult sequence:</strong> C1 esterase inhibitor may be used for pregnancy, pediatric patients, or icatibant intolerance under the institutional restriction.</p>
                            </div>
                          </div>
                          </div>
                        </details>

                        <details id="isch-largecore" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700">
                          <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-100/50 rounded-t-lg flex items-center justify-between dark:text-cobalt-300 dark:hover:bg-cobalt-800">
                            <h2 className="text-lg font-semibold text-cobalt-800 dark:text-cobalt-300">Large Core EVT Selection</h2>
                          </summary>
                          <div className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border dark:bg-card">
                              <h3 className="font-semibold text-cobalt-700 mb-2 dark:text-cobalt-300">Early Window (0-6h)</h3>
                              <ul className="text-sm space-y-1">
                                <li>• ICA or proximal M1 occlusion, NIHSS ≥6; baseline mRS 0-1 unless another tier is stated</li>
                                <li>• ASPECTS 3-5 with no significant mass effect: EVT, COR I / LOE A</li>
                                <li>• ASPECTS 0-2, age &lt;80, no significant mass effect, CTP core ≤70 mL: EVT, COR IIa / LOE B-R</li>
                                <li>• Same branch with CTP core 71-100 mL: pending protocol-owner adjudication; the source prints ≤70-100 mL without one executable cutoff</li>
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded border dark:bg-card">
                              <h3 className="font-semibold text-cobalt-700 mb-2 dark:text-cobalt-300">Late Window (6-24h)</h3>
                              <ul className="text-sm space-y-1">
                                <li>• ICA or proximal M1 occlusion, NIHSS ≥6, baseline mRS 0-1</li>
                                <li>• ASPECTS 3-5, age &lt;80, and no significant mass effect: EVT, COR I / LOE A</li>
                                <li>• The institutional flowchart supplies no 6-24-hour ASPECTS 0-2 tier</li>
                              </ul>
                            </div>
                          </div>
                          </div>
                        </details>

                        <details id="isch-postevt" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700">
                          <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-100/50 rounded-t-lg flex items-center justify-between dark:text-cobalt-300 dark:hover:bg-cobalt-800">
                            <h2 className="text-lg font-semibold text-cobalt-800 dark:text-cobalt-300">Post-EVT Management</h2>
                          </summary>
                          <div className="p-4 pt-0">
                          <div className="bg-white p-3 rounded border dark:bg-card">
                            <h3 className="font-semibold text-cobalt-700 mb-2 dark:text-cobalt-300">Post-Procedure Care</h3>
                            <ul className="text-sm space-y-1">
                              <li>• Admit to the Neuro ICU for 24 hours after EVT; attend the post-thrombectomy huddle on admission for handoff with the ICU and anesthesiology teams</li>
                              <li>• During the procedure, maintain SBP 140-180 mmHg and BP ≤180/105 (neuroanesthesia responsible)</li>
                              <li>• Follow-up brain CT or MRI at 24 hours ±6 hours; confirm dual-energy CT timing with the on-call stroke clinician</li>
                            </ul>
                            <p className="text-xs text-slate-600 mt-2 dark:text-mute">After documented successful recanalization (mTICI ≥2b), use the BP Management section for the institutional SBP 140-180 guardrail. For every EVT, keep BP ≤180/105 for 24 hours (AHA/ASA 2026, COR 2a, LOE B-NR); after mTICI ≥2b, intensive SBP lowering to &lt;140 is harmful (COR 3: Harm, LOE A). The current source set does not supply a post-EVT nursing cadence.</p>
                          </div>
                          </div>
                        </details>

                        <details id="isch-mevo" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-slate-50 border border-slate-300 rounded-lg dark:bg-paper-2 dark:border-strong">
                          <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-100 rounded-t-lg flex items-center justify-between dark:text-ink dark:hover:bg-card">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-ink">Medium Vessel Occlusion (MeVO) EVT</h2>
                          </summary>
                          <div className="p-4 pt-0">
                          <div className="bg-white p-3 rounded border dark:bg-card">
                            <p className="text-sm font-semibold mb-2 text-slate-800 dark:text-ink">Institutional M2 / distal-vessel branches</p>
                            <ul className="text-sm space-y-1">
                              <li>• Dominant proximal M2, 0-6 hours, ASPECTS ≥6, NIHSS ≥6: EVT, COR IIa / LOE B-NR</li>
                              <li>• Dominant proximal M2, 6-24 hours, ASPECTS ≥6, NIHSS ≥6, and CTP hypoperfusion-hypodensity mismatch: EVT, institutional tier; no AHA/ASA 2026 grade for 6-24 h</li>
                              <li>• Nondominant or codominant M2, distal MCA, ACA, or PCA: no EVT, COR III: No Benefit / LOE A (AHA/ASA 2026; ESCAPE-MeVO and DISTAL)</li>
                            </ul>
                            <p className="text-xs text-slate-600 mt-2 dark:text-mute">ORIENTAL-MeVO (2026), published after the guideline, reported benefit for medium-vessel occlusion with NIHSS ≥6 and more symptomatic ICH; individualize only with the neurointerventional team.</p>
                          </div>
                          </div>
                        </details>

                        <details id="isch-contrast" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-teal-50 border border-teal-200 rounded-lg dark:bg-teal-950 dark:border-teal-800">
                          <summary className="cursor-pointer p-4 font-semibold text-teal-800 hover:bg-teal-100/50 rounded-t-lg flex items-center justify-between dark:text-teal-300 dark:hover:bg-teal-900">
                            <h2 className="text-lg font-semibold text-teal-800 dark:text-teal-300">Contrast Allergy + Suspected LVO Protocol</h2>
                          </summary>
                          <div className="p-4 pt-0">
                          <div className="bg-white p-3 rounded border mb-3 dark:bg-card">
                            <p className="text-sm font-semibold text-teal-700 mb-2 dark:text-teal-300">Eligibility:</p>
                            <ul className="text-sm space-y-1">
                              <li>• CT contrast allergy (mild/moderate/unknown severity) AND suspected LVO</li>
                              <li>• <strong>Excludes:</strong> known contrast-related anaphylaxis</li>
                              <li>• <strong>Severe contrast allergy</strong> (cannot follow this hyperacute CTA pathway) with suspected LVO → obtain non-contrast <strong>TOF MRA</strong> as a limited hyperacute stroke MRI</li>
                            </ul>
                          </div>
                          <div className="bg-white p-3 rounded border mb-3 dark:bg-card">
                            <p className="text-sm font-semibold text-teal-700 mb-2 dark:text-teal-300">Requirements:</p>
                            <ul className="text-sm space-y-1">
                              <li>• Consent from patient and/or LNOK whenever possible</li>
                              <li>• Pre-administration approval from the on-call stroke clinician, emergency clinician, and neuroradiology</li>
                              <li>• Document in the neurology note the consent discussion and the clinicians who approved/agreed to the plan</li>
                            </ul>
                          </div>
                          <div className="bg-white p-3 rounded border dark:bg-card">
                            <p className="text-sm font-semibold text-teal-700 mb-2 dark:text-teal-300">Pre-medication (immediately prior to the contrast study):</p>
                            <ul className="text-sm space-y-1">
                              <li>• <button onClick={() => setProtocolModal(protocolDetailMap.HYDROCORT)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">Hydrocortisone 200 mg IV</button> <strong>OR</strong> <button onClick={() => setProtocolModal(protocolDetailMap.METHYLPRED_CONTRAST)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">Methylprednisolone 40 mg IV</button></li>
                              <li>• <strong>PLUS</strong> <button onClick={() => setProtocolModal(protocolDetailMap.DIPHEN)} className="text-cobalt-600 underline hover:text-cobalt-800 dark:text-cobalt-300 dark:hover:text-cobalt-300">Diphenhydramine 50 mg IV</button></li>
                            </ul>
                          </div>
                          <div className="bg-white p-3 rounded border dark:bg-card">
                            <p className="text-sm font-semibold text-teal-700 mb-2 dark:text-teal-300">Limited Hyperacute Stroke MRI</p>
                            <ul className="text-sm space-y-1">
                              <li>• Use only for an acute emergent treatment decision: wake-up or unknown-LKW disabling suspected AIS, or suspected LVO with known severe contrast allergy</li>
                              <li>• For the severe-contrast-allergy LVO branch, obtain TOF MRA</li>
                              <li>• Obtain DWI/ADC, T2-FLAIR, and T2*/SWI on the first available scanner, regardless of magnet strength</li>
                              <li>• Do not add sequences or studies during the code-stroke MRI</li>
                              <li>• Complete the MRI safety checklist with the patient when possible; otherwise obtain STAT screening films</li>
                            </ul>
                          </div>
                          </div>
                        </details>

                        <details id="isch-posterior" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700">
                          <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-100/50 rounded-t-lg flex items-center justify-between dark:text-cobalt-300 dark:hover:bg-cobalt-800">
                            <h2 className="text-lg font-semibold text-cobalt-800 dark:text-cobalt-300">Posterior Circulation Stroke</h2>
                          </summary>
                          <div className="p-4 pt-0">
                          <div className="bg-white p-3 rounded border dark:bg-card">
                            <h3 className="font-semibold text-crit-700 mb-2 dark:text-crit-300">Basilar Artery Occlusion</h3>
                            <ul className="text-sm space-y-1">
                              <li>• Within 24 hours, PC-ASPECTS ≥6, NIHSS ≥10: EVT, COR I / LOE A</li>
                              <li>• Within 24 hours, PC-ASPECTS ≥6, NIHSS 6-9: EVT effectiveness is not well established, COR IIb / LOE B-R</li>
                              <li>• For an otherwise eligible patient within 4.5 hours, TNK may be started before or on the way to thrombectomy</li>
                            </ul>
                          </div>
                          </div>
                        </details>

                          </div>
                        </details>

                        {/* Pocket Cards — interactive IVT/EVT/BP/contraindication decision aids
                            (formerly its own sub-tab; folded into Ischemic since the cards
                            are AIS-acute-phase decision support). */}
                        <PocketCards key={`case-${pocketCardsCaseEpoch}`} encounter={encounter} defaults={{
                          hoursFromLKW: (() => {
                            try {
                              if (telestrokeNote.lkwUnknown === true) return '';
                              if (!telestrokeNote.lkwDate || !telestrokeNote.lkwTime) return '';
                              const lkw = new Date(`${telestrokeNote.lkwDate}T${telestrokeNote.lkwTime}:00`);
                              const hrs = (Date.now() - lkw.getTime()) / 3600000;
                              return hrs > 0 && hrs < 48 ? hrs.toFixed(1) : '';
                            } catch (_) { return ''; }
                          })(),
                          nihss: telestrokeNote.nihss || '',
                          weight: telestrokeNote.weight || '',
                          age: telestrokeNote.age || '',
                          glucose: telestrokeNote.glucose || '',
                          aspects: telestrokeNote.aspects || '',
                          preMRS: telestrokeNote.premorbidMRS || '',
                          wakeUpOrUnknownOnset: telestrokeNote.lkwUnknown === true
                        }} />
                      </div>
                    )}
                    {/* End of Ischemic Stroke Management Content */}



                  </div>

  </>;
}
