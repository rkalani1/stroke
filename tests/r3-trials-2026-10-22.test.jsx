// Round-3 Trials fixes, 2026-10-22. Registry expectations quote the ClinicalTrials.gov
// records re-read on 2026-10-22 (full eligibility text via the registry API); timing,
// provenance and import expectations follow the screener's own definitions (tri-state,
// unknown stays unknown, the copied summary matches the screen). None are copied from
// implementation output.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import React from 'react';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { newEncounter, nihssWithBulkZero } from '../src/workspace-state.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import {
  buildScreenerParams, createInitialScreenerState, evaluateAll, evaluateTrialEligibility, EXCLUSION_ITEMS, onsetSummary,
  potentialMatches, refinerItems, STUDY_FACTS, toConfirm, withClassification
} from '../src/evidence/screener-eval.js';
import { applyEncounterPrefill, importChanged, screenerPrefillFromEncounter } from '../src/evidence/screener-prefill.js';
import { buildSearchIndex, searchIndex } from '../src/quick-search-index.js';
import { SEARCH_TRIALS } from '../src/components/QuickSearch.jsx';

const trial = acronym => screenerTrials.find(t => t.acronym === acronym);
const S = patch => ({ ...createInitialScreenerState(), ...patch });
const fresh = () => createInitialScreenerState();
const evaluate = (acronym, patch, nowMs = null) => evaluateTrialEligibility(trial(acronym), buildScreenerParams(S(patch), nowMs));
const encounter = (note = {}, rest = {}) => { const s = newEncounter(); Object.assign(s.note, note); return Object.assign(s, rest); };
const pad = n => String(n).padStart(2, '0');
const lkwAt = ms => { const d = new Date(ms); return { lkwDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, lkwTime: `${pad(d.getHours())}:${pad(d.getMinutes())}` }; };
const localIso = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const item = id => EXCLUSION_ITEMS.find(entry => entry.id === id);
function inZone(zone, run) {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try { run(); } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
}
const HOUR = 3600000;

describe('a stale Encounter import is never presented as current (e2e#0)', () => {
  const now = new Date(2026, 9, 22, 12).getTime();
  const base = { diagnosisCategory: 'ischemic', age: '70', ...lkwAt(now - 3 * HOUR) };

  it('detects a changed LKW, NIHSS or pre-stroke mRS, but not the passage of time', () => {
    const e = encounter(base, { nihssSource: 'reported', reportedNihss: '4' });
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(e, now), fresh());
    // Elapsed time alone changes only the onset snapshot; the anchor and every fact are unchanged.
    expect(importChanged(state, screenerPrefillFromEncounter(e, now + 2 * HOUR))).toBe(false);
    for (const [label, changed] of [
      ['LKW', encounter({ ...base, ...lkwAt(now - 30 * HOUR) }, { nihssSource: 'reported', reportedNihss: '4' })],
      ['NIHSS', encounter(base, { nihssSource: 'reported', reportedNihss: '12' })],
      ['pre-mRS', encounter({ ...base, premorbidMRS: '0' }, { nihssSource: 'reported', reportedNihss: '4' })],
      ['diagnosis', encounter({ ...base, diagnosisCategory: 'cvt' }, { nihssSource: 'reported', reportedNihss: '4' })]
    ]) expect(importChanged(state, screenerPrefillFromEncounter(changed, now)), label).toBe(true);
    // A screen that was never imported, or was restarted, has nothing to go stale.
    expect(importChanged(fresh(), screenerPrefillFromEncounter(e, now))).toBe(false);
    expect(importChanged(withClassification(state, 'ich'), screenerPrefillFromEncounter(e, now))).toBe(false);
  });

  it('marks the copied summary as based on an earlier import and never calls the imported LKW the current one', () => {
    const e = encounter(base);
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(e, now), fresh());
    const current = evaluateAll(state, screenerTrials, now).briefingNote;
    expect(current).not.toMatch(/Caution|at import/);
    expect(current).toMatch(/LKW 3\.0 h \(Encounter LKW \d{2}:\d{2}, as of 12:00\)/);
    const stale = evaluateAll(state, screenerTrials, now, { staleImport: true }).briefingNote;
    expect(stale).toContain('Caution: the Encounter changed after import; reapply before relying on this screen.');
    expect(stale).toMatch(/LKW 3\.0 h \(Encounter LKW at import \d{2}:\d{2}, as of 12:00\)/);
    // The tri-state is unchanged: a stale screen still has no definitive result.
    expect(evaluateAll(state, screenerTrials, now, { staleImport: true }).eligible).toEqual([]);
  });
});

describe('anchored LKW across a daylight-saving change prints the offset (trials-code#0)', () => {
  it('fall back: the LKW offset is printed so the clock times agree with the interval', () => inZone('America/Los_Angeles', () => {
    // 00:30 PDT (UTC−07:00) to 03:00 PST (UTC−08:00) is 3.5 h.
    const state = S({ classification: 'ich', onsetVal: 3.5, onsetUnit: 'hours', onsetAnchorMs: Date.parse('2026-11-01T07:30:00Z') });
    expect(onsetSummary(state, Date.parse('2026-11-01T11:00:00Z'))).toBe('LKW 3.5 h (Encounter LKW 00:30 (UTC−07:00), as of 03:00)');
  }));
  it('spring forward: 01:30 PST to 03:30 PDT is 1.0 h', () => inZone('America/Los_Angeles', () => {
    const state = S({ classification: 'ischemic', onsetVal: 1, onsetUnit: 'hours', onsetAnchorMs: Date.parse('2026-03-08T09:30:00Z') });
    expect(onsetSummary(state, Date.parse('2026-03-08T10:30:00Z'))).toBe('LKW 1.0 h (Encounter LKW 01:30 (UTC−08:00), as of 03:30)');
  }));
});

describe('ASPIRE atrial flutter can be answered (trials-code#1)', () => {
  // NCT03907046 inclusion: "Non-valvular AF (defined as atrial fibrillation or atrial flutter), documented by
  // electrocardiography or a physician-confirmed history of prior AF"; randomization 14–180 days after ICH onset.
  const facts = { classification: 'ich', onsetVal: 30, onsetUnit: 'days', age: 70,
    exclusions: { exPriorIch12m: false, exClearAnticoagulationIndication: false, exClearAntiplateletIndication: false } };
  it('offers the fact on the ICH screen, read by ASPIRE', () => {
    expect(STUDY_FACTS.ich.find(([key]) => key === 'afOrFlutterHistory')?.[3]).toEqual(['ASPIRE']);
    expect(STUDY_FACTS.ischemic.some(([key]) => key === 'afOrFlutterHistory')).toBe(false);
  });
  it('flutter without AF reaches a potential match; neither AF nor flutter does not meet', () => {
    expect(evaluate('ASPIRE', { ...facts, afibHistory: false, afOrFlutterHistory: true }).completeness).toBe('potential-match');
    const neither = evaluate('ASPIRE', { ...facts, afibHistory: false, afOrFlutterHistory: false });
    expect(neither.status).toBe('excluded');
    expect(neither.exclusionReasons).toContain('Requires documented non-valvular atrial fibrillation or flutter');
    // Documented AF still establishes the broader criterion when flutter is not answered.
    expect(evaluate('ASPIRE', { ...facts, afibHistory: true }).completeness).toBe('potential-match');
  });
  it('prints the answer in the copied summary', () => {
    expect(evaluateAll(S({ ...facts, afOrFlutterHistory: true })).briefingNote).toContain('non-valvular AF or atrial flutter: Yes');
  });
});

describe('NIHSS bulk-entry provenance travels with the import (trials-code#2, e2e#7)', () => {
  // Encounter: 1a = 1 and 5a = 2 scored, then "Set unentered items to 0": 13 items bulk-filled, total 3.
  const scored = encounter({ diagnosisCategory: 'ischemic' }, { nihss: { consciousness: 'Drowsy (1)', motor_arm_left: 'Some effort against gravity (2)' } });
  it('carries the bulk-zero count into the banner, the state and the copied summary', () => {
    const e = nihssWithBulkZero(scored);
    const prefill = screenerPrefillFromEncounter(e, Date.now());
    expect(prefill.summary).toContain('NIHSS 3 (13 items set to 0 by bulk entry, not individually scored)');
    const state = applyEncounterPrefill(fresh(), prefill, fresh());
    expect([state.nihss, state.nihssBulkZero]).toEqual([3, 13]);
    expect(evaluateAll(state).briefingNote).toContain('NIHSS 3 (13 items set to 0 by bulk entry, not individually scored)');
  });
  it('drops the note once the NIHSS is no longer the imported one, or hidden by classification', () => {
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(nihssWithBulkZero(scored), Date.now()), fresh());
    expect(withClassification(state, 'tia').nihssBulkZero).toBe(0);
    const first = { ...state, nihss: 5, nihssUntestable: 0, nihssBulkZero: 0 };
    expect(evaluateAll(first).briefingNote).not.toContain('bulk entry');
    // An individually scored exam has no bulk entries.
    const all = encounter({ diagnosisCategory: 'ischemic' }, { nihss: Object.fromEntries(Object.entries(nihssWithBulkZero(scored).nihss)) });
    expect(screenerPrefillFromEncounter(all, Date.now()).summary.join(' ')).not.toContain('bulk entry');
  });
});

describe('MR-PICS reports only what was answered (trials-code#3)', () => {
  // NCT06506279: "Levels of hemiparesis that warrant surgical intervention (upper limb impairment)"; UEFM 25-45.
  it('does not claim unilateral weakness from a generic upper-limb deficit', () => {
    const r = evaluate('MR-PICS', { classification: 'ischemic', onsetVal: 8, onsetUnit: 'months', age: 60, currentMrs: 3, ueWeakness: true, availability_54w: true,
      exclusions: { exTherapeuticAnticoagulation: false, exHistoryDvtPe: false, exSeizures: false, exSpontaneousHemorrhagicStroke: false, exPregnancy: false, exMrPicsCommunication: false } });
    expect(r.completeness).toBe('potential-match');
    expect(r.matchedCriteria).toContain('Upper-limb motor deficit recorded (confirm unilateral hemiparesis and UEFM 25–45)');
    expect(r.matchedCriteria.join(' ')).not.toContain('Unilateral upper extremity weakness confirmed');
  });
});

describe('the copied summary reports only exclusion answers the refiner shows (trials-code#4)', () => {
  it('drops an answer once its only study is excluded by timing, and restores it when the study returns', () => {
    const at = hours => S({ classification: 'ischemic', onsetVal: hours, onsetUnit: 'hours', exclusions: { exIvtGivenOrPlanned: true } });
    expect(refinerItems(at(10)).map(i => i.id)).toContain('exIvtGivenOrPlanned');
    expect(evaluateAll(at(10)).briefingNote).toContain('Exclusions recorded: IV thrombolysis given or planned: present');
    // SISTER (the item's only study) is outside 4.5–24 h at 30 h, so the refiner no longer asks.
    expect(refinerItems(at(30)).map(i => i.id)).not.toContain('exIvtGivenOrPlanned');
    expect(evaluateAll(at(30)).briefingNote).not.toContain('IV thrombolysis given or planned');
  });
});

describe('global search finds trials by condition and synonym (e2e#1)', () => {
  const index = buildSearchIndex({ trials: SEARCH_TRIALS });
  const trials = query => searchIndex(index, query, Infinity).filter(r => r.group === 'Trials').map(r => r.title);
  it.each([
    // NCT03907046 conditions: Intracerebral Hemorrhage, Atrial Fibrillation; interventions apixaban vs aspirin.
    ['atrial fibrillation', 'ASPIRE'], ['ICH atrial fibrillation', 'ASPIRE'], ['apixaban ICH', 'ASPIRE'],
    // NCT06722755 conditions include "OSA - Obstructive Sleep Apnea".
    ['sleep apnea', 'SCOUTS-3'], ['OSA', 'SCOUTS-3'], ['atrial fibrillation', 'INTERCEPT']
  ])('"%s" lists %s', (query, acronym) => expect(trials(query)).toContain(acronym));
  it('opens the chosen study in the database', () => {
    expect(searchIndex(index, 'INTERCEPT').find(r => r.group === 'Trials').href).toBe('#/trials/database?q=INTERCEPT');
  });
});

describe('Encounter anticoagulant facts (e2e#5, e2e#6)', () => {
  const now = new Date(2026, 9, 22, 12).getTime();
  it('a DOAC last dose more than 48 h before LKW leaves use at ICH onset unknown, never present', () => {
    // NCT07260916 (MINUTE) exclusion 6: "Concurrent use of direct oral anticoagulants or low molecular weight heparin at ICH onset".
    const e = encounter({ diagnosisCategory: 'ich', age: '65', ...lkwAt(now - 1.5 * HOUR), lastDOACType: 'apixaban', lastDOACDose: localIso(now - 72 * HOUR) });
    const p = screenerPrefillFromEncounter(e, now);
    expect(p.patch.exclusions).toMatchObject({ exOacWithin7d: true, exXaDtiWithin48h: false });
    expect(p.patch.exclusions.exDoacLmwhAtOnset).toBeUndefined();
    expect(p.summary).toContain('DOAC, last dose 71 h before LKW (use at onset unknown)');
    const state = applyEncounterPrefill(fresh(), p, fresh());
    const minute = evaluateAll(state, screenerTrials, now).excluded.find(i => i.trial.acronym === 'MINUTE');
    expect(minute?.exclusionReasons.join(' ') || '').not.toContain('DOAC or LMWH');
    // A dose 20 h before LKW is still use at onset.
    const recent = screenerPrefillFromEncounter(encounter({ ...e.note, lastDOACDose: localIso(now - 21.5 * HOUR) }), now);
    expect(recent.patch.exclusions.exDoacLmwhAtOnset).toBe(true);
  });

  it('keeps conflicting screener answers instead of overwriting them, and lists them', () => {
    const manual = S({ classification: 'ischemic', takingOac: true, exclusions: { exXaDtiWithin48h: true } });
    const prefill = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', lastDOACType: 'none' }), now);
    expect(prefill.patch.exclusions.exXaDtiWithin48h).toBe(false);
    const state = applyEncounterPrefill(manual, prefill, fresh());
    expect(state.exclusions.exXaDtiWithin48h).toBe(true);
    expect(state.takingOac).toBe(true);
    expect(state.imported.conflicts).toEqual(['takingOac', 'exXaDtiWithin48h']);
    // SISTER stays not met for the recorded Xa inhibitor.
    expect(evaluateAll(state).excluded.find(i => i.trial.acronym === 'SISTER').exclusionReasons).toContain('Factor Xa inhibitor or direct thrombin inhibitor within 48 h');
    // The kept answers do not make the import look stale.
    expect(importChanged(state, prefill)).toBe(false);
  });
});

describe('registry wording re-read on 2026-10-22', () => {
  it('SISTER targets patients who are not standard reperfusion candidates (NCT05948566)', () => {
    // Detailed description: "... and are not a candidate for standard of care reperfusion therapies."
    const t = trial('SISTER');
    expect(t.conciseBedsideSummary).toContain('who are not candidates for standard reperfusion (no IV thrombolysis given or planned; no EVT with clot engagement)');
    const r = evaluate('SISTER', { classification: 'ischemic', onsetVal: 8, age: 70, nihss: 14, aspects: 8, preMrs: 0, vessel: 'ica_m1',
      exclusions: { exXaDtiWithin48h: false, exIvtGivenOrPlanned: false, exPregnancy: false } });
    expect(r.completeness).toBe('potential-match');
    expect(toConfirm(r)).toContain('Confirm the patient is not a candidate for standard-of-care reperfusion therapy, IVT or EVT (registry primary objective)');
    // The card headline carries the restriction too, so it is visible without opening the list.
    expect(evaluateAll(S({ classification: 'ischemic', onsetVal: 8, age: 70, nihss: 14, aspects: 8, preMrs: 0, vessel: 'ica_m1' })).briefingNote).toContain('registry primary objective');
  });

  it('SISTER lists the bleeding-risk and thrombosis exclusions for confirmation (NCT05948566 exclusions 4, 9-12, 14-20, 24-26)', () => {
    const t = trial('SISTER');
    const exc = t.exactExclusionCriteria.join(' ');
    for (const re of [/Within 30 days: surgery or biopsy of a parenchymal organ/, /severe head trauma within 90 days/, /or serious systemic hemorrhage; severe head trauma/, /suggestive of SAH even with a normal CT/,
      /hematocrit < 25%/, /aPTT above normal/, /creatinine > 4 mg\/dL or dialysis/, /concurrent MI, PE, DVT or other thrombosis/, /Prior TS23/, /another research drug protocol/]) expect(exc).toMatch(re);
    const confirm = toConfirm(evaluate('SISTER', { classification: 'ischemic' })).join(' ');
    for (const re of [/surgery\/biopsy, trauma or serious systemic hemorrhage within 30 days/, /severe head trauma within 90 days/, /dialysis or concurrent thrombosis needing antithrombotics/, /INR, platelet, hematocrit, aPTT, creatinine, LMWH, GP IIb\/IIIa and BP limits/]) expect(confirm).toMatch(re);
    expect(t.sourceGaps).toContain('Perfusion imaging, EVT clot engagement and the remaining CT.gov exclusions are listed for confirmation, not modeled.');
  });

  it('SISTER and TESTED ask for the MRI ASPECTS threshold; SISTER asks for a disabling deficit at NIHSS 4–5', () => {
    // SISTER: "ASPECTS of 6 or more on CT (or ASPECTS of ≥7 on MRI)"; "clearly disabling deficit if NIHSS is 4-5".
    // TESTED (NCT05911568): "CT ... ASPECT score ≥3 or MRI ASPECT score ≥4".
    const sister = toConfirm(evaluate('SISTER', { classification: 'ischemic', nihss: 4, aspects: 6 }));
    expect(sister).toContain('If ASPECTS was scored on MRI (DWI), confirm MRI ASPECTS ≥ 7');
    expect(sister).toContain('If NIHSS is 4–5, confirm a clearly disabling deficit');
    expect(toConfirm(evaluate('TESTED', { classification: 'ischemic', aspects: 3 }))).toContain('If ASPECTS was scored on MRI (DWI), confirm MRI ASPECTS ≥ 4');
    const note = evaluateAll(S({ classification: 'ischemic', onsetVal: 10, age: 60, nihss: 4, aspects: 8, preMrs: 0, exclusions: { exIvtGivenOrPlanned: false, exXaDtiWithin48h: false, exPregnancy: false } })).briefingNote;
    expect(note).toContain('If NIHSS is 4–5, confirm a clearly disabling deficit');
  });

  it('STEP reads presentation to the enrolling hospital, not hours at screening (NCT06289985)', () => {
    // EVT expansion domain inclusion 3: "Presentation to enrolling hospital within 24 hours of last known well/stroke onset".
    const facts = { classification: 'ischemic', onsetVal: 24.5, age: 70, nihss: 3, vessel: 'ica_m1', aspects: 9, preMrs: 0 };
    const presented = evaluate('STEP', { ...facts, presentedWithin24h: true });
    expect(presented.status).not.toBe('excluded');
    expect(presented.matchedCriteria).toContain('Presented to the enrolling hospital ≤ 24 h from LKW');
    expect(evaluate('STEP', { ...facts, presentedWithin24h: false }).exclusionReasons).toContain('Did not present to the enrolling hospital within 24 h of LKW');
    const unknown = evaluate('STEP', facts);
    expect([unknown.status, unknown.completeness]).toEqual(['pending', 'insufficient-information']);
    expect(toConfirm(unknown)).toContain('Confirm presentation to the enrolling hospital ≤ 24 h from LKW');
    // Puncture ≤ 2 h from qualifying imaging stays a to-confirm item whatever the timing.
    expect(toConfirm(unknown)).toContain('Confirm enrolling-hospital presentation and arterial puncture timing per STEP protocol');
    expect(STUDY_FACTS.ischemic.find(([key]) => key === 'presentedWithin24h')[3]).toEqual(['STEP', 'TESTED']);
    // Within 24 h at screening still meets the timing criterion without the presentation fact.
    expect(evaluate('STEP', { ...facts, onsetVal: 3 }).matchedCriteria).toContain('Within 24 h of LKW at screening (registry: presentation ≤ 24 h; confirm arrival time)');
  });

  it('FASTEST-2 states the thrombocytopenia exclusion as registered (NCT07227246 exclusion 10)', () => {
    // "Known or suspected thrombocytopenia (unless current platelet count documented above 50,000/μL)".
    expect(trial('FASTEST-2').exactExclusionCriteria.join(' ')).toContain('known or suspected thrombocytopenia unless a current platelet count above 50,000/µL is documented');
    expect(trial('FASTEST-2').exactExclusionCriteria.join(' ')).not.toContain('platelets < 50,000');
  });

  it('INTERCEPT does not call a TIA imaging-positive before imaging is entered (NCT05723926 inclusion 2)', () => {
    expect(evaluate('INTERCEPT', { classification: 'tia' }).matchedCriteria).toContain('Ischemic stroke or TIA classification selected (positive neuroimaging still required)');
  });

  it('STEP ICAD, ASPIRE prior ICH, SCOUTS-3 PAP and VERIFY paretic side follow the registry wording', () => {
    // STEP: "Known or high suspicion for underlying intracranial atherosclerotic disease (ICAD)".
    expect(item('exSuspectedIcad').label).toBe('Known or highly suspected underlying intracranial atherosclerosis (ICAD) at the occlusion');
    // ASPIRE: "History of earlier ICH within 12 months preceding index event".
    expect(item('exPriorIch12m').label).toBe('Earlier ICH within the 12 months before the index ICH');
    const aspire = trial('ASPIRE').eligibility.exclusions.find(e => e.field === 'exPriorIch12m');
    expect(aspire.pendingLabel).toBe('Confirm no earlier ICH within the 12 months before the index ICH');
    expect(aspire.error).toBe('Excludes an earlier ICH within the 12 months before the index ICH');
    // SCOUTS-3 exclusion 5: "Use of positive airway pressure within 14 days prior to stroke".
    expect(item('exCpapUse14d').label).toBe('Positive airway pressure (e.g., CPAP) use within 14 days before the stroke');
    expect(trial('SCOUTS-3').eligibility.exclusions.find(e => e.field === 'exCpapUse14d').pendingLabel).toBe('Confirm no positive airway pressure use (CPAP or other PAP) within 14 days before the stroke');
    // VERIFY exclusion 1: "UE injury or conditions on paretic side that limited use prior to the stroke".
    expect(item('exPriorUeCondition').label).toBe('Prior paretic-side upper extremity condition limiting use');
    expect(trial('VERIFY').exactExclusionCriteria[0]).toBe('Upper extremity injury or condition on the paretic side that limited use before the stroke');
    // TELE-REHAB-2 exclusion 9 ("a separate stroke occurred within 30 days prior to the index stroke") is not limited to symptomatic strokes.
    expect(item('exRecentStroke30d').label).toBe('Separate stroke within the 30 days before the index stroke (VERIFY: symptomatic, any location)');
  });

  it('SCOUTS-3 tests for OSA itself and keeps its history and pneumocephalus exclusions (NCT06722755)', () => {
    // Description: patients "will be recruited upon IPR admission ... and tested for OSA through a simple, portable cardiorespiratory study".
    const t = trial('SCOUTS-3');
    expect(t.conciseBedsideSummary).toMatch(/at inpatient rehabilitation admission: tests for obstructive sleep apnea \(OSA\), then randomizes those with OSA/);
    expect(t.conciseBedsideSummary).toMatch(/Known OSA is not required; positive airway pressure use within 14 days before the stroke excludes/);
    // Exclusions 6 and 11: "History of pneumothorax, bullous emphysema ..."; "... CSF leak or pneumocephalus within past 3 months".
    const confirm = toConfirm(evaluate('SCOUTS-3', { classification: 'ich' })).join(' ');
    expect(confirm).toMatch(/no history of pneumothorax or bullous emphysema/);
    expect(confirm).toMatch(/known or possible CSF leak or pneumocephalus/);
  });

  it('SATURN reads its own secondary-cause list, not the shared one that adds coagulopathy (NCT03936361 exclusion 1)', () => {
    const facts = { classification: 'ich', onsetVal: 3, onsetUnit: 'days', ichLocation: 'lobar', age: 72, statin: true, preMrs: 1 };
    expect(evaluate('SATURN', { ...facts, exclusions: { exSecondaryIch: true } }).status).not.toBe('excluded');
    expect(evaluate('SATURN', { ...facts, exclusions: { exSaturnSecondaryCause: true } }).exclusionReasons).toContain('Excludes a suspected secondary cause for the qualifying ICH');
    expect(item('exSecondaryIch').trials).not.toContain('SATURN');
    expect(refinerItems(S(facts)).map(i => i.id)).toContain('exSaturnSecondaryCause');
  });

  it('MR-PICS lists every remaining registry exclusion and the 90-day assessment window (NCT06506279)', () => {
    const confirm = toConfirm(evaluate('MR-PICS', { classification: 'ischemic' })).join(' ');
    for (const re of [/cardiac morbidity judged an increased safety risk/, /major active neurological, psychiatric or medical comorbidity/, /active infection requiring antimicrobial therapy/,
      /inability to take part in the study rehabilitation/, /assessed within 90 days before implantation/]) expect(confirm).toMatch(re);
  });
});

describe('Encounter import and global-search pick in a browser', () => {
  let browser, page, script, css;
  beforeAll(async () => {
    css = await readFile(new URL('../tailwind.css', import.meta.url), 'utf8');
    const result = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: {
      resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
        import React, { useState } from 'react';
        import { createRoot } from 'react-dom/client';
        import Trials from './src/Trials.jsx';
        import { newEncounter } from './src/workspace-state.js';
        window.newEncounter = newEncounter;
        function Harness() {
          const [encounter, setEncounter] = useState(null), [sub, setSub] = useState('screener');
          window.setEncounter = setEncounter; window.setSub = setSub;
          return <Trials sub={sub} onNavigate={setSub} active encounter={encounter} now={Date.now()} />;
        }
        createRoot(document.getElementById('root')).render(<Harness />);
      ` } });
    script = result.outputFiles[0].text;
    browser = await chromium.launch();
  });
  afterAll(async () => { await browser?.close(); });
  const open = async () => {
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(10000);
    await page.clock.install({ time: new Date(2026, 9, 22, 12) });
    await page.setContent('<div id="root"></div>');
    await page.addStyleTag({ content: css });
    await page.evaluate(() => { window.copies = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copies.push(text); } } }); });
    await page.addScriptTag({ content: script });
    await page.getByRole('heading', { name: 'Trials', exact: true }).waitFor();
  };
  const setEncounter = (note, rest = {}) => page.evaluate(([n, r]) => { const s = window.newEncounter(); Object.assign(s.note, n); Object.assign(s, r); window.setEncounter(s); }, [note, rest]);
  const banner = () => page.getByRole('region', { name: 'Encounter facts' });
  const timingNote = () => page.locator('#trial-exact-onset').locator('xpath=ancestor::section[1]').locator('p.mt-2').innerText();
  const copied = async () => { await page.getByRole('button', { name: 'Copy screening summary', exact: true }).click(); await page.waitForFunction(n => window.copies.length === n, 1 + await page.evaluate(() => window.copies.length) - 1); return page.evaluate(() => window.copies.at(-1)); };

  it('withdraws "Applied" and "live" when the Encounter LKW changes, and reapplies on request', async () => {
    await open();
    try {
      await setEncounter({ diagnosisCategory: 'ischemic', age: '70', lkwDate: '2026-10-22', lkwTime: '09:00' });
      await banner().getByRole('button', { name: 'Use these facts', exact: true }).click();
      expect(await banner().getByRole('button').innerText()).toBe('Applied ✓ · reapply');
      expect(await timingNote()).toMatch(/^Live from the Encounter LKW time/);
      // The Encounter LKW moves back 27 h; nothing in the screener is edited.
      await setEncounter({ diagnosisCategory: 'ischemic', age: '70', lkwDate: '2026-10-21', lkwTime: '06:00' });
      await banner().getByRole('button', { name: 'Reapply Encounter facts', exact: true }).waitFor();
      const text = await banner().innerText();
      expect(text).toContain('The Encounter changed after these facts were applied; the screen still uses the earlier import.');
      expect(text).not.toMatch(/Applied ✓|timing live/);
      expect(await timingNote()).toBe('Counting from the earlier imported LKW; the Encounter LKW has since changed.');
      expect(await page.getByRole('status').filter({ hasText: 'potential match' }).innerText()).toMatch(/ · based on an earlier Encounter import$/);
      const note = await copied();
      expect(note).toContain('Caution: the Encounter changed after import');
      expect(note).toContain('LKW 3.0 h (Encounter LKW at import 09:00, as of 12:00)');
      await banner().getByRole('button', { name: 'Reapply Encounter facts', exact: true }).click();
      expect(await banner().getByRole('button').innerText()).toBe('Applied ✓ · reapply');
      expect(Number(await page.getByLabel('Exact hours from LKW').inputValue())).toBeCloseTo(30, 1);
      const notMet = page.locator('#trials-screener-panel details').filter({ has: page.locator('summary', { hasText: /^Does not meet documented criteria/ }) });
      await notMet.locator('summary').click();
      expect(await notMet.innerText()).toContain('Outside 4.5–24 h from LKW');
      expect(await copied()).not.toMatch(/Caution|at import/);
    } finally { await page.close(); }
  }, 30000);

  it('flags changed NIHSS and pre-stroke mRS, and lists kept screener answers', async () => {
    await open();
    try {
      // Pre-stroke mRS 1 keeps SISTER (mRS ≤ 2) possible, so its Xa/DTI refiner item stays on screen.
      await setEncounter({ diagnosisCategory: 'ischemic', age: '70', premorbidMRS: '1', lastDOACType: 'none' }, { nihssSource: 'reported', reportedNihss: '4' });
      await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
      await page.locator('summary', { hasText: 'Optional exclusion review' }).click();
      await page.getByLabel('Factor Xa inhibitor or direct thrombin inhibitor within 48 h', { exact: true }).selectOption('true');
      await banner().getByRole('button', { name: 'Use these facts', exact: true }).click();
      expect(await banner().innerText()).toContain('Kept your entry where the Encounter differs: Factor Xa inhibitor or direct thrombin inhibitor within 48 h.');
      expect(await page.getByLabel('Factor Xa inhibitor or direct thrombin inhibitor within 48 h', { exact: true }).inputValue()).toBe('true');
      await setEncounter({ diagnosisCategory: 'ischemic', age: '70', premorbidMRS: '0', lastDOACType: 'none' }, { nihssSource: 'reported', reportedNihss: '12' });
      await banner().getByRole('button', { name: 'Reapply Encounter facts', exact: true }).waitFor();
      expect(await copied()).toMatch(/NIHSS 4 · pre-mRS 1/);
      await banner().getByRole('button', { name: 'Reapply Encounter facts', exact: true }).click();
      expect(await copied()).toMatch(/NIHSS 12 · pre-mRS 0/);
    } finally { await page.close(); }
  }, 30000);

  it('shows the study chosen in global search even when an earlier database search hid it (e2e#3)', async () => {
    await open();
    try {
      await page.evaluate(() => window.setSub('database'));
      await page.getByLabel('Search the study database by acronym, name or NCT number').fill('STEP');
      expect(await page.locator('#trials-database-panel article[data-trial="INTERCEPT"]').count()).toBe(0);
      await page.evaluate(() => { location.hash = '#/trials/database?q=INTERCEPT'; });
      await page.locator('#trials-database-panel article[data-trial="INTERCEPT"]').waitFor();
      expect(await page.getByLabel('Search the study database by acronym, name or NCT number').inputValue()).toBe('INTERCEPT');
      expect(await page.locator('#trials-database-panel article').evaluateAll(cards => cards.map(c => c.dataset.trial))).toEqual(['INTERCEPT']);
    } finally { await page.close(); }
  }, 30000);
});
