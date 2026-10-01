import fs from 'node:fs';
import vm from 'node:vm';
import { describe, it, expect } from 'vitest';
import * as reviewed from '../src/encounter-clinical-review.js';
import * as decisions from '../src/encounter-decision-status.js';
import * as calculators from '../src/calculators.js';
import { buildTnkConsentDocumentation } from '../src/clinical/consent-documentation.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const between = (start, end) => {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  if (a < 0 || b < a) throw new Error(`Missing actual app boundary: ${start}`);
  return source.slice(a, b);
};
const itemsStart = source.indexOf('const nihssItems = [');
const nihssItems = vm.runInNewContext(source.slice(itemsStart, source.indexOf('];', itemsStart) + 2) + '\nnihssItems');
const normal = Object.fromEntries(nihssItems.map(item => [item.id, item.options[0]]));
const completeFour = { ...normal, consciousness: 'Coma (3)', loc_questions: 'One correct (1)' };
const code = [
  between('const getDocumentedNihss =', 'const buildEncounterTemplateContext ='),
  between('const getCurrentPatientSummary =', '// Count trials by eligibility status'),
  between('const buildTransferDecisionText =', 'const getCancerMechanismLabel ='),
  between('const generatePulsaraSummary =', '// Generate telestroke documentation note')
].join('\n');
function environment(note, patientData = {}) {
  return {
    ...reviewed, ...decisions, ...calculators,
    telestrokeNote: { age: '60', ...note }, patientData, nihssItems,
    nihssScore: calculators.calculateNIHSS(patientData),
    isNIHSSComplete: () => nihssItems.every(item => item.options.includes(patientData[item.id])),
    calculateTimeFromLKW: () => null, getReferenceTime: () => null,
    formatDateTimeDisplay: value => String(value), lkwTime: null,
    isValidAspectsScore: () => false, aspectsScore: null, gcsItems: {}
  };
}
function output(note, patientData = {}) {
  return vm.runInNewContext(code + `\n({
    documented: getDocumentedNihss(),
    patient: getCurrentPatientSummary().shortLabel,
    transfer: buildTransferDecisionText('accept', 'synthetic test'),
    handoff: buildHandoffSummary(),
    pulsara: generatePulsaraSummary(),
    preview: generatePulsaraPreview(),
    complete: getSafetyChecks().find(row => row.id === 'nihss').complete
  })`, environment(note, patientData));
}
const scenarios = [
  { name: 'blank', note: {}, data: {}, value: '' },
  { name: 'one positive item', note: {}, data: { consciousness: 'Drowsy (1)' }, value: '' },
  { name: 'manual negative', note: { nihss: '-1' }, data: {}, value: '' },
  { name: 'manual fraction', note: { nihss: '1.9' }, data: {}, value: '' },
  { name: 'manual above range', note: { nihss: '43' }, data: {}, value: '' },
  { name: 'invalid manual with prior complete exam', note: { nihss: '1.9' }, data: completeFour, value: '' },
  { name: 'explicit manual zero', note: { nihss: '0' }, data: {}, value: '0' },
  { name: 'complete zero exam', note: {}, data: normal, value: '0' },
  { name: 'complete nonzero exam', note: {}, data: completeFour, value: '4' }
];

describe('actual Encounter summary and transfer generators', () => {
  for (const scenario of scenarios) {
    for (const field of ['patient', 'transfer', 'handoff', 'pulsara', 'preview']) {
      it(`${field}: ${scenario.name} preserves documented versus unresolved assessment`, () => {
        const result = output(scenario.note, scenario.data);
        expect(result.documented).toBe(scenario.value);
        const actual = result[field].match(/NIHSS(?: score)?:? ([^.\n-]+)/)?.[1].trim();
        expect(actual).toBe(scenario.value || (field === 'pulsara' || field === 'preview' ? '[not documented]' : 'not documented'));
      });
    }
    it(`documentation status: ${scenario.name}`, () => expect(output(scenario.note, scenario.data).complete).toBe(scenario.value !== ''));
  }
});

describe('actual copy bindings and duplicate display', () => {
  const exam = source.match(/let exam = `NIHSS: \$\{([^}]+)\}`;/)[1];

  for (const scenario of scenarios) {
    it(`exam copy score binding: ${scenario.name}`, () => {
      for (const expression of [exam]) {
        const actual = vm.runInNewContext(code + '\n' + expression, environment(scenario.note, scenario.data));
        expect(actual).toBe(scenario.value || 'not documented');
      }
    });
  }
  it('consent records use entered discussion fields without inferring a patient score or eligibility', () => {
    expect(source).toContain('const tnkDoc = buildTnkConsentDocumentation(telestrokeNote);');
    for (const scenario of scenarios) {
      const text = buildTnkConsentDocumentation(scenario.note);
      expect(text).not.toMatch(/NIHSS|within 4.5 hours|Risks discussed/);
      expect(text).toContain('Discussion: Not documented');
    }
  });
  it('the allowed inline display has a documented-score guard and getter', () => {
    const inline = between('{/* v6 inline strip', '{/* ===== CLINICIAN WORKBENCH');
    expect(inline).toContain("getDocumentedNihss() !== ''");
    expect(inline).toContain('NIHSS: {getDocumentedNihss()}');
    expect(inline).not.toContain('NIHSS: {telestrokeNote.nihss || nihssScore}');
  });
  it('protected Protocol content does not call the changed output adapter or generators', () => {
    const locked = between('{/* Protocols Tab (Ischemic, ICH, Calculators) */}', '{/* Calculators live under Guidelines & References. */}');
    for (const name of ['getDocumentedNihss','getDocumentedDischargeNihss','getCurrentPatientSummary','getHandoffSummaryFields','buildHandoffSummary','buildTransferDecisionText','generatePulsaraSummary','generatePulsaraPreview','getSafetyChecks','documentedExamScore']) expect(locked).not.toContain(name);
    expect(locked).toContain('NIHSS {telestrokeNote.nihss || nihssScore}');
  });
});

describe('actual discharge output bindings', () => {
  const dischargeLine = source.split('\n').find(line => line.includes('note += `DISCHARGE NIHSS:'));
  const followupBlock = between('if (getDocumentedDischargeNihss() !== null) {\n              const admNIHSS', '            {\n              const fuMRS');
  for (const discharge of ['', '1.9', '-1', '43', '2abc', '0', '2']) {
    it(`discharge ${JSON.stringify(discharge)} cannot borrow an admission score`, () => {
      const note = { nihss: '10', dischargeNIHSS: discharge };
      const text = vm.runInNewContext(code + '\nlet note = "";\n' + dischargeLine + '\nnote;', environment(note));
      const value = reviewed.numericInput(discharge, { min: 0, max: 42, integer: true });
      expect(text).toContain(`DISCHARGE NIHSS: ${value ?? 'not documented'} (admission: 10;`);
      expect(text).not.toContain('DISCHARGE NIHSS: 10');
    });
  }
  it('an unknown admission score cannot produce a spurious improvement comparison', () => {
    const text = vm.runInNewContext(code + '\nlet brief = "";\n' + followupBlock + '\nbrief;', environment({ dischargeNIHSS: '0' }, { consciousness: 'Drowsy (1)' }));
    expect(text).toContain('Discharge NIHSS: 0');
    expect(text).not.toMatch(/improved|worsened|unchanged/);
  });
  it('a complete documented admission exam retains a valid improvement comparison', () => {
    const text = vm.runInNewContext(code + '\nlet brief = "";\n' + followupBlock + '\nbrief;', environment({ dischargeNIHSS: '0' }, completeFour));
    expect(text).toContain('Discharge NIHSS: 0 (improved from 4)');
  });
});

describe('both actual Encounter NIHSS score panels', () => {
  const panels = [...source.matchAll(/>Score: \{(getDocumentedNihss\(\)[^}]+)\}/g)].map(match => match[1]);
  it('locates both Phone and Video score-panel expressions', () => expect(panels).toHaveLength(2));
  for (const [index, expression] of panels.entries()) {
    for (const scenario of scenarios) {
      it(`panel ${index + 1}: ${scenario.name} cannot resurrect a zero`, () => {
        const actual = vm.runInNewContext(code + '\n' + expression, environment(scenario.note, scenario.data));
        expect(actual).toBe(scenario.value || 'Incomplete');
      });
    }
  }
});
