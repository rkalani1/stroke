// Trials screener: Encounter import invariants under random edit sequences (r3-trials §9, 2026-10-24).
// Port of the third verifier's fuzzer. Seeded, deterministic sequences of user edits (every control
// that writes an importable fact), Encounter edits and imports/reapplies run on ICH, ischemic and TIA
// screens. After every step the screen is compared with a reference model of the import rule written
// here from its statement, not from the implementation:
//   U = the user's latest explicit answer (the screen at the first import, then whatever each edit
//   writes); E = what the Encounter says now. On every import, for each weighed fact: U and E known and
//   different → conflict (exclusion present, other fact unknown, listed); otherwise the known one, else
//   unknown. An Encounter AF against a "No" to AF or flutter is a conflict over AF or flutter (and over
//   AF unless AF was answered Yes). An Encounter anticoagulant/OAC answer the user contradicted supplies
//   only present exclusions. Other facts (classification, age) take the Encounter's value when it has
//   one, which replaces a different U; otherwise U, so an imported value the user never answered returns
//   to unknown. An edit writes only its own keys and settles their conflicts. Choosing a classification
//   ends the import; each fact the new screen shows keeps the user's own answer, except that a conflict
//   over a fact the new screen still shows is not settled by the click: the fact stays unknown and listed,
//   and the next import weighs the user's answer again. The anticoagulant, OAC and exclusion answers restart.
// Also checked after every step: an immediate second reapply changes nothing, the copied summary carries
// exactly the banner's stale and conflict sentences, no text contains undefined/null/NaN, no study is
// a potential match while a fact it reads is unknown, and (independently of the reference model) no
// weighed answer the last import's Encounter contradicts is shown unlisted unless the user answered it since.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { newEncounter } from '../src/workspace-state.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import {
  buildScreenerParams, conflictNote, createInitialScreenerState, evaluateAll, EXCLUSION_ITEMS, ONSET_PRESETS, potentialMatches, refinerItems,
  STALE_IMPORT_NOTE, STALE_UNMODELED_NOTE, VISIBLE_FACTS, withClassification
} from '../src/evidence/screener-eval.js';
import { answerFacts, applyAnticoagulant, applyEncounterPrefill, importChanged, screenerPrefillFromEncounter } from '../src/evidence/screener-prefill.js';
import { TrialScreener } from '../src/components/TrialScreener.jsx';

const HOUR = 3600000;
const now = new Date(2026, 9, 22, 12).getTime();
const pad = n => String(n).padStart(2, '0');
const localDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const lkwAt = ms => { const d = new Date(ms); return { lkwDate: localDate(d), lkwTime: `${pad(d.getHours())}:${pad(d.getMinutes())}` }; };
const localIso = ms => { const d = new Date(ms); return `${localDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const CONFLICT_HEAD = 'Encounter and screener entries differed: ';
const CONFLICT_TAIL = '. Exclusions are set to present, other answers to unknown; confirm them.';

// The facts the rule weighs, in the order the conflict sentence lists them, and the other tracked keys.
// (The OAC-within-7-days and Xa/DTI-within-48-h exclusions left with FASTEST-2 and SISTER on 2026-11-01;
// DOAC/LMWH at ICH onset is the one anticoagulant exclusion the Encounter still answers.)
const WEIGHED = ['afibHistory', 'afOrFlutterHistory', 'anticoagulant', 'takingOac', 'exDoacLmwhAtOnset'];
const OAC_EXCLUSIONS = ['exDoacLmwhAtOnset'];
const REPLACED = ['classification', 'age'];
const TRACKED = [...WEIGHED, ...REPLACED, 'exPregnancy'];
const isExclusion = key => key.startsWith('ex');
const UNKNOWN = key => isExclusion(key) ? undefined : 'unselected';
const known = v => v === true || v === false || typeof v === 'number' || (typeof v === 'string' && v !== '' && v !== 'unselected');
// Names the conflict sentence uses for the tracked facts (exclusions use their refiner label).
const FACT_NAME = { afibHistory: 'documented clinical atrial fibrillation', afOrFlutterHistory: 'atrial fibrillation or flutter', anticoagulant: 'anticoagulant at onset', takingOac: 'oral anticoagulant at the index stroke' };
// Tracked facts each screen shows a control for (key facts plus ASPIRE's AF-or-flutter study fact on ICH).
const VISIBLE = { ich: ['age', 'anticoagulant', 'afibHistory', 'afOrFlutterHistory'], ischemic: ['age', 'afibHistory', 'takingOac'], tia: ['age', 'afibHistory', 'takingOac'] };
// What each "Anticoagulant at onset" option states, from its label: None means no anticoagulant at onset;
// DOAC is oral anticoagulation at onset; VKA is oral but neither DOAC nor LMWH; LMWH is parenteral and says
// nothing about oral use.
const SELECT = {
  none: { takingOac: false, exDoacLmwhAtOnset: false },
  doac: { takingOac: true, exDoacLmwhAtOnset: true },
  vka: { takingOac: true, exDoacLmwhAtOnset: false },
  lmwh: { takingOac: 'unselected', exDoacLmwhAtOnset: true },
  unselected: { takingOac: 'unselected', exDoacLmwhAtOnset: undefined }
};

/* ── Reference model ─────────────────────────────────────────────── */
const refNew = () => ({ screen: Object.fromEntries(TRACKED.map(key => [key, UNKNOWN(key)])), record: null });
function refEdit(model, written) {
  Object.assign(model.screen, written);
  if (model.record) for (const key of Object.keys(written)) { model.record.U[key] = written[key]; model.record.conflicts.delete(key); }
}
// Answers a classification choice restarts (the exclusions restart too).
const RESTARTED = ['anticoagulant', 'takingOac'];
// The import ends; each fact the new screen shows keeps the user's own answer, everything else is unknown.
// A conflict over a shown fact that does not restart stands: unknown, listed, its U kept for the next import
// of the same classification (another classification starts a clean screen; see r3-trials.md §9.6.1).
function refClassify(model, cls) {
  const U = model.record?.U;
  const standing = [...(model.record?.conflicts || [])].filter(key => VISIBLE[cls].includes(key) && !RESTARTED.includes(key));
  for (const key of ['age', 'afibHistory', 'afOrFlutterHistory']) {
    model.screen[key] = !VISIBLE[cls].includes(key) || standing.includes(key) ? 'unselected' : !U ? model.screen[key] : key in U ? U[key] : 'unselected';
  }
  Object.assign(model.screen, { classification: cls, anticoagulant: 'unselected', takingOac: 'unselected' });
  for (const key of TRACKED) if (isExclusion(key)) model.screen[key] = undefined;
  model.record = standing.length ? { U: { ...model.screen, ...Object.fromEntries(standing.map(key => [key, U[key]])) }, conflicts: new Set(standing) } : null;
}
// E: the tracked facts of the Encounter prefill (the Encounter → fact mapping is not under test here).
const encounterFacts = prefill => { const { exclusions = {}, ...facts } = prefill.patch; return { ...facts, ...exclusions }; };
function refImport(model, E) {
  if (E.classification && E.classification !== model.screen.classification) Object.assign(model, refNew());
  const U = model.record ? { ...model.record.U } : { ...model.screen };
  const screen = {}, conflicts = new Set();
  for (const key of REPLACED) {
    if (E[key] !== undefined && String(E[key]) !== String(U[key])) { screen[key] = E[key]; delete U[key]; }
    else screen[key] = key in U ? U[key] : 'unselected';
  }
  screen.exPregnancy = U.exPregnancy;
  const differs = key => known(U[key]) && known(E[key]) && U[key] !== E[key];
  const contradicted = differs('anticoagulant') || differs('takingOac');
  for (const key of WEIGHED) {
    const afAgainstNo = E.afibHistory === true && U.afOrFlutterHistory === false && (key === 'afOrFlutterHistory' || (key === 'afibHistory' && U.afibHistory !== true));
    if (differs(key) || afAgainstNo) { conflicts.add(key); screen[key] = isExclusion(key) ? true : 'unselected'; continue; }
    let e = E[key];
    if (contradicted && (key === 'anticoagulant' || key === 'takingOac' || (OAC_EXCLUSIONS.includes(key) && e !== true))) e = undefined;
    screen[key] = known(U[key]) ? U[key] : known(e) ? e : UNKNOWN(key);
  }
  model.screen = screen;
  model.record = { U, conflicts };
}

/* ── The implementation, driven through the same calls as TrialScreener's controls ───────── */
const init = () => createInitialScreenerState();
const asBoolean = v => v === 'unselected' ? v : v === 'true';
const value = (state, key) => isExclusion(key) ? state.exclusions?.[key] : state[key];
const view = state => Object.fromEntries(TRACKED.map(key => [key, value(state, key)]));
const conflictKeys = state => Object.keys(state.imported?.conflicts || {}).sort();

// Every read field of a potential match must be known (an `or` needs one fully known branch).
const missing = v => v === undefined || v === null || v === '' || v === 'unselected' || (typeof v === 'number' && !Number.isFinite(v));
const knownCriterion = (c, p) => c.operator === 'or' ? c.branches.some(b => b.criteria.every(cc => knownCriterion(cc, p))) : !missing(p[c.field]);

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function checkScreen(state, model, trace) {
  expect(view(state), trace()).toEqual(model.screen);
  expect(conflictKeys(state), trace()).toEqual([...(model.record?.conflicts || [])].sort());
}

// Banner/summary agreement and text hygiene; returns the evaluation for further checks.
function checkTexts(state, encounter, trace) {
  const prefill = screenerPrefillFromEncounter(encounter, now);
  const evalNow = typeof state.onsetAnchorMs === 'number' ? now : null;
  const stale = importChanged(state, prefill) && (prefill.patch ? STALE_IMPORT_NOTE : STALE_UNMODELED_NOTE);
  const note = conflictNote(state, evalNow);
  const r = evaluateAll(state, screenerTrials, evalNow, { staleImport: stale });
  // The conflict sentence lists exactly the standing conflicts this screen shows, in rule order.
  const asked = refinerItems(state, evalNow).map(item => item.id);
  const names = conflictKeys(state).length ? WEIGHED.filter(key => key in state.imported.conflicts && (isExclusion(key) ? asked.includes(key) : VISIBLE_FACTS[state.classification]?.includes(key)))
    .map(key => isExclusion(key) ? EXCLUSION_ITEMS.find(item => item.id === key).label : FACT_NAME[key]) : [];
  expect(note, trace()).toBe(names.length ? CONFLICT_HEAD + names.join('; ') + CONFLICT_TAIL : '');
  if (r.ready) {
    const lines = r.briefingNote.split('\n');
    expect(lines.filter(line => line === STALE_IMPORT_NOTE || line === STALE_UNMODELED_NOTE), trace()).toEqual(stale ? [stale] : []);
    expect(lines.filter(l => l.startsWith(CONFLICT_HEAD)), trace()).toEqual(note ? [note] : []);
  }
  expect(`${r.briefingNote} ${note} ${prefill.summary.join(' ')}`, trace()).not.toMatch(/undefined|NaN|\bnull\b/);
  // While a conflict over AF or flutter stands, it is not derived from AF.
  if (state.imported?.conflicts && 'afOrFlutterHistory' in state.imported.conflicts) expect(buildScreenerParams(state, evalNow).afOrFlutterHistory, trace()).toBe('unselected');
  for (const item of potentialMatches(r)) {
    const { criteria = [], exclusions = [] } = item.trial.eligibility;
    expect([...criteria, ...exclusions].every(c => knownCriterion(c, r.params)), trace(`${item.trial.acronym} is a potential match with an unknown fact`)).toBe(true);
  }
  return { prefill, stale, note, r };
}

// Every other fact of the screen answered (all other exclusions absent), so studies can reach a potential
// match once the tracked facts are known. None of these keys is imported.
const OTHER_FACTS = {
  ich: { nihss: 10, gcs: 12, preMrs: 0, ichLocation: 'bg', ichVolume: 25, statin: false, ueWeakness: true, self_consent: true, rehab: 'yes' },
  ischemic: { nihss: 10, preMrs: 0, aspects: 8, vessel: 'ica_m1', presentedWithin24h: true, unilateralSymptomatic: true, ueWeakness: true, self_consent: true, language: 'english', currentMrs: 3, availability_54w: true, rehab: 'yes', antithromboticSoc: true },
  tia: { abcd2: 5, antithromboticSoc: true }
};
const otherExclusions = cls => Object.fromEntries(EXCLUSION_ITEMS.filter(item => item.classifications.includes(cls) && !TRACKED.includes(item.id)).map(item => [item.id, false]));

function run(seed, steps, rendered) {
  const rand = rng(seed), pick = list => list[Math.floor(rand() * list.length)];
  const cls = pick(['ich', 'ischemic', 'tia']);
  let state = init(), model = refNew();
  state = withClassification(state, cls); refClassify(model, cls);
  if (rand() < 0.8) state = answerFacts(state, { ...OTHER_FACTS[cls], exclusions: otherExclusions(cls) });
  // Usually the user has answered the tracked facts before the first import (these become U), and the
  // Encounter already records some of them, so the two often meet.
  const tri = () => pick([true, false, 'unselected']);
  const early = {
    ich: () => ({ ...(rand() < 0.6 && { afOrFlutterHistory: tri() }), exclusions: { exPregnancy: pick([false, false, undefined]) } }),
    // The ischemic screen asks no Encounter-answered exclusion since SISTER's Xa/DTI item left (2026-11-01);
    // its OAC answer is still weighed, and the Encounter's DOAC/LMWH answer is still held (hidden) and weighed.
    ischemic: () => ({ takingOac: tri(), exclusions: { exPregnancy: pick([false, false, undefined]) } }),
    tia: () => ({ takingOac: tri(), exclusions: { exPregnancy: pick([false, false, undefined]) } })
  }[cls];
  if (rand() < 0.7) {
    const patch = { afibHistory: tri(), ...early() }, { exclusions, ...facts } = patch;
    state = answerFacts(state, patch); refEdit(model, { ...facts, ...exclusions });
    if (cls === 'ich' && rand() < 0.7) { const kind = pick(['none', 'doac', 'vka', 'lmwh']); state = applyAnticoagulant(state, kind); refEdit(model, { anticoagulant: kind, ...SELECT[kind] }); }
  }
  const lkw = pick([1, 8, 30 * 24, null]);
  let note = { diagnosisCategory: cls, ...(lkw === null ? {} : lkwAt(now - lkw * HOUR)), lastDOACType: pick(['', 'none', 'apixaban', 'warfarin', 'lmwh']) };
  let details = { afDetected: pick(['', 'yes', 'no']) };
  const encounter = () => { const e = newEncounter(); Object.assign(e.note, note); e.details = { ...details }; return e; };
  const log = [`seed ${seed}: ${cls}, LKW ${lkw ?? 'none'} h`];
  log.push(`before the first import: ${JSON.stringify(view(state))}; Encounter ${JSON.stringify({ lastDOACType: note.lastDOACType, afDetected: details.afDetected })}`);
  const trace = extra => [...log, extra].filter(Boolean).join('\n  ');
  // The Encounter facts of the last import, and the keys the user has answered since it.
  let lastE = null, answered = new Set();
  for (let step = 0; step < steps; step += 1) {
    const screenCls = state.classification;
    // An unclassified screen shows no fact controls, only the classification buttons.
    const op = ['ich', 'ischemic', 'tia'].includes(screenCls) || rand() < 0.5 ? pick(['edit', 'edit', 'edit', 'encounter', 'encounter', 'import', 'import', 'import', 'classify']) : 'classify';
    if (op === 'edit' && !['ich', 'ischemic', 'tia'].includes(screenCls)) log.push('(no controls on an unclassified screen)');
    else if (op === 'edit') {
      const before = view(state), beforeConflicts = conflictKeys(state);
      // DOAC/LMWH at onset (ICH) and the OAC answer (ischemic) are listed twice: they take the draws of the removed
      // FASTEST-2 OAC-within-7-days and SISTER Xa/DTI items, so anticoagulant conflicts are edited as often as before.
      const controls = { ich: ['anticoagulant', 'afibHistory', 'afOrFlutterHistory', 'exDoacLmwhAtOnset', 'exDoacLmwhAtOnset', 'exPregnancy', 'reset', 'age'], ischemic: ['afibHistory', 'takingOac', 'takingOac', 'exPregnancy', 'reset', 'age'], tia: ['afibHistory', 'takingOac', 'exPregnancy', 'reset', 'age'] }[screenCls];
      // Often the user answers a fact the conflict sentence lists, as it asks.
      const listed = conflictKeys(state).filter(key => controls.includes(key));
      const control = listed.length && rand() < 0.4 ? pick(listed) : pick(controls);
      let written;
      if (control === 'anticoagulant') {
        const kind = pick(['none', 'doac', 'vka', 'lmwh', 'unselected']);
        state = applyAnticoagulant(state, kind);
        written = { anticoagulant: kind, ...SELECT[kind] };
      } else if (control === 'reset') {
        written = Object.fromEntries(TRACKED.filter(key => isExclusion(key) && value(state, key) !== undefined).map(key => [key, undefined]));
        state = answerFacts(state, { exclusions: Object.fromEntries(Object.keys(state.exclusions).map(id => [id])) });
      } else if (isExclusion(control)) {
        const v = pick([true, false, undefined]);
        state = answerFacts(state, { exclusions: { [control]: v } });
        written = { [control]: v };
      } else if (control === 'age') {
        const v = pick(['55', '60', '72', 'unselected']);
        state = answerFacts(state, { age: v });
        written = { age: v };
      } else {
        const v = String(tri());
        state = answerFacts(state, { [control]: asBoolean(v) });
        written = { [control]: asBoolean(v) };
      }
      log.push(`user ${control} → ${JSON.stringify(written)}`);
      refEdit(model, written);
      for (const key of Object.keys(written)) answered.add(key);
      // An edit changes no key it does not write, and settles only conflicts over keys it writes.
      for (const key of TRACKED) if (!(key in written)) expect(value(state, key), trace(`edit changed ${key}`)).toBe(before[key]);
      expect(conflictKeys(state), trace()).toEqual(beforeConflicts.filter(key => !(key in written)));
    } else if (op === 'encounter') {
      const field = pick(['lastDOACType', 'lastDOACDose', 'afDetected', 'age', 'medications', 'diagnosis']);
      if (field === 'lastDOACType') note = { ...note, lastDOACType: pick(['', 'none', 'apixaban', 'dabigatran', 'warfarin', 'lmwh']) };
      if (field === 'lastDOACDose') note = { ...note, lastDOACDose: pick(['', localIso(now - 10 * HOUR), localIso(now - 30 * HOUR), localIso(now - 60 * HOUR), localIso(now - 200 * HOUR)]) };
      if (field === 'afDetected') details = { afDetected: pick(['', 'yes', 'no']) };
      if (field === 'age') note = { ...note, age: pick(['', '60', '72']) };
      if (field === 'medications') note = { ...note, medications: pick(['', 'apixaban 5 mg twice daily']) };
      // Rarely, the diagnosis changes: to another modeled one, to none recorded, or to one not modeled.
      if (field === 'diagnosis' && rand() < 0.3) note = { ...note, diagnosisCategory: pick(['ich', 'ischemic', 'tia', '', 'sah']) };
      log.push(`Encounter ${field} → ${JSON.stringify(field === 'afDetected' ? details.afDetected : field === 'diagnosis' ? note.diagnosisCategory : note[field])}`);
    } else if (op === 'import') {
      const prefill = screenerPrefillFromEncounter(encounter(), now);
      state = applyEncounterPrefill(state, prefill, init());
      if (prefill.patch) { refImport(model, encounterFacts(prefill)); lastE = encounterFacts(prefill); answered = new Set(); }
      log.push(prefill.patch ? 'import' : 'import (no facts: unchanged)');
    } else {
      const to = rand() < 0.75 && screenCls !== 'unselected' ? screenCls : pick(['ich', 'ischemic', 'tia']);
      state = withClassification(state, to); refClassify(model, to);
      log.push(`classification → ${to}`);
      // Often the user then re-enters what the click restarted (onset, age, the other facts, pregnancy and the
      // other exclusions absent), so a fact the click showed as answered could reach a potential match (round 4).
      if (rand() < 0.5) {
        const preset = pick(ONSET_PRESETS), age = pick([60, 72]);
        state = answerFacts(state, { ...OTHER_FACTS[to], age, onsetVal: preset.val, onsetUnit: preset.unit, onsetRangeHours: preset.rangeHours, onsetAnchorMs: null, exclusions: { ...otherExclusions(to), exPregnancy: false } });
        refEdit(model, { age, exPregnancy: false }); answered.add('age').add('exPregnancy');
        log.push(`user re-enters onset ${preset.name}, age ${age}, pregnancy absent and the other facts`);
      }
    }
    checkScreen(state, model, trace);
    // Independent of the reference model: a weighed answer that the last import's Encounter contradicts is
    // never shown as current without being listed, unless the user answered it since (a conflict stands until
    // the user answers it or the next import weighs it; nothing in between settles it).
    if (lastE) for (const key of WEIGHED) {
      const shown = value(state, key);
      if (known(shown) && known(lastE[key]) && shown !== lastE[key] && !answered.has(key)) expect(key in (state.imported?.conflicts || {}), trace(`${key} ${JSON.stringify(shown)} is shown unlisted; the last import's Encounter says ${JSON.stringify(lastE[key])}`)).toBe(true);
    }
    // A reapply with the Encounter unchanged, repeated, changes nothing.
    const prefill = screenerPrefillFromEncounter(encounter(), now);
    const once = applyEncounterPrefill(state, prefill, init());
    expect(applyEncounterPrefill(once, prefill, init()), trace('second reapply differs')).toEqual(once);
    const texts = checkTexts(state, encounter(), trace);
    // Sampled: the rendered banner status says exactly what the copied summary says.
    if (rendered && step === steps - 1) {
      const html = renderToStaticMarkup(React.createElement(TrialScreener, { initialState: state, encounter: encounter(), now }));
      const banner = html.match(/<section aria-label="Encounter facts".*?<\/section>/s)?.[0] || '';
      const status = (banner.match(/<p role="status"[^>]*>(.*?)<\/p>/s)?.[1] || '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
      expect(status, trace('banner')).toBe([texts.stale, texts.note].filter(Boolean).join(' '));
      expect(banner.replace(/<[^>]+>/g, ' '), trace('banner text')).not.toMatch(/undefined|NaN|\bnull\b/);
    }
  }
}

describe('Encounter import invariants over random edit and import sequences (r3-trials §9)', () => {
  beforeAll(() => { vi.useFakeTimers({ now, toFake: ['Date'] }); });
  afterAll(() => { vi.useRealTimers(); });

  it('the reference visibility table matches the screen\'s controls', () => {
    for (const cls of ['ich', 'ischemic', 'tia']) expect(VISIBLE[cls].every(key => VISIBLE_FACTS[cls].includes(key))).toBe(true);
    for (const cls of ['ich', 'ischemic', 'tia']) for (const key of ['age', 'anticoagulant', 'afibHistory', 'afOrFlutterHistory', 'takingOac']) expect(VISIBLE_FACTS[cls].includes(key)).toBe(VISIBLE[cls].includes(key));
  });

  // 12 seed blocks × 80 sequences × 14 steps; every 10th sequence also renders the screener for the banner check.
  it.each(Array.from({ length: 12 }, (_, i) => i + 1))('seed block %i holds every invariant', block => {
    for (let i = 0; i < 80; i += 1) run(block * 1000 + i, 14, i % 10 === 0);
  }, 20000);
});
