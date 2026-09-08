import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'esbuild';
import { hasRecordedTreatmentAdministration, treatmentAdministrationTime } from '../src/encounter-decision-status.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
function between(startText, endText) {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end < start) throw new Error(`Post-TNK source block not found: ${startText}`);
  return source.slice(start, end);
}

// Exercise the authored post-care blocks, including their complementary non-TNK
// branches, without copying gate logic or rendering the rest of the application.
const blocks = {
  transfer: between('// Post-TNK Status', '// ICH-specific data'),
  signout: between('              // Post-TNK monitoring', '// ICH-specific (concise)'),
  consult: between('// Add post-thrombolysis complications', '// Cardiac workup')
};
const output = (name, telestrokeNote) => new Function('telestrokeNote', 'hasRecordedTreatmentAdministration',
  `let note = ''; ${blocks[name]} return note;`)(telestrokeNote, hasRecordedTreatmentAdministration);
const jsx = between('{/* ===== POST-THROMBOLYSIS MONITORING ===== */}', '{/* ===== POST-EVT MONITORING ===== */}');
const code = transformSync(`const content = <>${jsx}</>;`, { loader: 'jsx' }).code;
const renderMonitoring = (telestrokeNote) => renderToStaticMarkup(new Function('React', 'telestrokeNote',
  'hasRecordedTreatmentAdministration', `${code}; return content;`)(React, telestrokeNote, hasRecordedTreatmentAdministration));

function authoredFunction(name, context) {
  const start = source.indexOf(`const ${name} = () => {`);
  const indent = source.slice(source.lastIndexOf('\n', start) + 1, start);
  const end = source.indexOf(`\n${indent}};`, start);
  if (start < 0 || end < start) throw new Error(`Authored function missing: ${name}`);
  return new Function(...Object.keys(context), source.slice(start, end + indent.length + 4) + `; return ${name}();`)(...Object.values(context));
}
const safeParseDt = new Function(between('const safeParseDt = (val) => {', 'const safeFormatTime =') + '; return safeParseDt;')();
const metrics = (telestrokeNote) => authoredFunction('calculateDTNMetrics', { telestrokeNote, safeParseDt, treatmentAdministrationTime });
const dtnOutput = (kind, telestrokeNote) => {
  const block = kind === 'transfer'
    ? between('const transferTnkTime =', 'const transferBp =')
    : between('// Add DTN metrics if TNK was administered', '// Add contraindication review status');
  const formatDTNForNote = () => authoredFunction('formatDTNForNote', {
    calculateDTNMetrics: () => metrics(telestrokeNote), getDTNBenchmark: () => null
  });
  return new Function('telestrokeNote', 'treatmentAdministrationTime', 'formatDTNForNote',
    `let note = ''; ${block}; return note;`)(telestrokeNote, treatmentAdministrationTime, formatDTNForNote);
};

const timerStart = source.indexOf("{hasRecordedTreatmentAdministration(telestrokeNote, 'tnk') && (() => {", source.indexOf('htmlFor="input-tnk-admin-time"'));
const timerEnd = source.indexOf('})()}', timerStart) + '})()}'.length;
if (timerStart < 0 || timerEnd < timerStart) throw new Error('Post-TNK elapsed timer missing');
const timerCode = transformSync(`const content = <>${source.slice(timerStart, timerEnd)}</>;`, { loader: 'jsx' }).code;
const renderTimer = (telestrokeNote, currentTime) => renderToStaticMarkup(new Function('React', 'telestrokeNote',
  'currentTime', 'hasRecordedTreatmentAdministration', 'treatmentAdministrationTime', `${timerCode}; return content;`)(
  React, telestrokeNote, currentTime, hasRecordedTreatmentAdministration, treatmentAdministrationTime));

const bpStart = source.indexOf('// Auto-switch BP phase to post-TNK');
const bpEnd = source.lastIndexOf('          useEffect(() => {', source.indexOf("debouncedSave('telestrokeTemplate'", bpStart));
const runBpEffects = (note) => {
  let result = { bpPhase: 'pre-tnk', ...note };
  new Function('useEffect', 'telestrokeNote', 'setTelestrokeNote', 'hasRecordedTreatmentAdministration', source.slice(bpStart, bpEnd))(
    (effect) => effect(), result, (update) => { result = update(result); }, hasRecordedTreatmentAdministration);
  return result;
};

const postProtocolLine = between('{/* Post-TNK Monitoring Protocol */}', '<div className="bg-white border-2 border-ok-300');
const postProtocolExpression = postProtocolLine.match(/\{(hasRecordedTreatmentAdministration[^\n]+) && \(/)?.[1];
if (!postProtocolExpression) throw new Error('Post-TNK protocol gate missing');
const showPostProtocol = (telestrokeNote) => new Function('telestrokeNote', 'hasRecordedTreatmentAdministration',
  `return ${postProtocolExpression};`)(telestrokeNote, hasRecordedTreatmentAdministration);

describe('recorded administration opens the authored post-TNK care sections', () => {
  const timeFields = [
    ['tnkAdminTime', '15:30'],
    ['needleTime', '15:30'],
    ['dtnTnkAdministered', '2026-09-06T15:30:00Z']
  ];
  it.each(timeFields)('retains post-care for %s with no positive recommendation', (field, time) => {
    const note = { tnkRecommended: false, [field]: time, postTnkNeuroChecksStarted: true };
    expect(output('transfer', note)).toContain('Post-TNK Status:');
    expect(output('signout', note)).toContain('Post-TNK:');
    expect(output('consult', note)).toContain('Post-TNK Monitoring: neuro checks');
    expect(renderMonitoring(note)).toContain('Post-Thrombolysis Monitoring');
  });

  it.each(timeFields)('includes recorded complications once for %s', (field, time) => {
    const note = { [field]: time, sichDetected: true,
      hemorrhagicTransformation: { detected: true, classification: 'PH2', symptomatic: true } };
    const transfer = output('transfer', note);
    const consult = output('consult', note);
    expect(transfer).toContain('sICH DETECTED');
    expect(transfer.match(/PH2/g)).toHaveLength(1);
    expect(consult).toContain('Post-Thrombolysis Complications: symptomatic ICH');
    expect(consult.match(/PH2/g)).toHaveLength(1);
  });

  it.each([{}, { tnkRecommended: true }, { tnkRecommended: true, tnkAdminTime: '25:70' },
    { needleTime: 'unknown' }, { dtnTnkAdministered: true }])('does not infer post-care from an unrecorded administration: %j', (note) => {
    for (const block of Object.keys(blocks)) expect(output(block, note)).toBe('');
    expect(renderMonitoring(note)).toBe('');
  });

  it('keeps hemorrhagic transformation documentation for patients without recorded TNK', () => {
    const note = { tnkRecommended: true, hemorrhagicTransformation: { detected: true, classification: 'PH1' } };
    expect(output('transfer', note)).toContain('Hemorrhagic Transformation:');
    expect(output('consult', note)).toContain('Hemorrhagic Transformation: PH1');
    expect(output('transfer', note)).not.toContain('Post-TNK Status');
    expect(output('consult', note)).not.toContain('Post-Thrombolysis Complications');
  });
});

describe('timestamp-aware post-care callers', () => {
  const arrival = '2026-09-06T23:45:00Z';
  const administered = '2026-09-07T00:15:00Z';
  const now = new Date('2026-09-07T00:45:00Z');
  it.each(['tnkAdminTime', 'needleTime', 'dtnTnkAdministered'])('uses a recorded ISO %s across midnight without requiring a recommendation', (field) => {
    const note = { tnkRecommended: false, diagnosisCategory: 'ischemic', dtnEdArrival: arrival,
      dtnCtRead: '2026-09-06T23:50:00Z', [field]: administered };
    expect(metrics(note)).toMatchObject({ doorToNeedle: 30, ctToNeedle: 25 });
    for (const kind of ['transfer', 'consult']) expect(dtnOutput(kind, note)).toContain('Door-to-Needle (DTN): 30 minutes');
    expect(renderTimer(note, now)).toContain('30 min since TNK');
    expect(runBpEffects(note).bpPhase).toBe('post-tnk');
    expect(showPostProtocol(note)).toBe(true);
  });

  it.each(['tnkAdminTime', 'needleTime', 'dtnTnkAdministered'])('never invents a date for clock-only %s, while preserving clock-pair DTN rollover', (field) => {
    const note = { doorTime: '23:45', dtnEdArrival: arrival, [field]: '00:15' };
    expect(metrics(note).doorToNeedle).toBeNull();
    expect(renderTimer(note, now)).toContain('Elapsed time unavailable');
    expect(dtnOutput('transfer', note)).toContain('DTN: 30 min');
    expect(dtnOutput('consult', note)).toContain('Door-to-Needle: 30 min');
  });

  it('retains the prior elapsed-timer limit and rejects reversed or invalid chronological metrics', () => {
    expect(renderTimer({ tnkAdminTime: administered }, new Date('2026-09-06T23:00:00Z'))).toBe('');
    expect(renderTimer({ tnkAdminTime: administered }, new Date('2026-09-08T01:00:00Z'))).toBe('');
    expect(metrics({ dtnEdArrival: administered, needleTime: arrival }).doorToNeedle).toBeNull();
    expect(metrics({ dtnEdArrival: arrival, needleTime: '25:70' }).doorToNeedle).toBeNull();
    expect(dtnOutput('consult', { doorTime: '25:70', needleTime: '00:15' })).toBe('');
  });

  it('does not switch care phase or display completed-treatment monitoring from recommendations or mTICI alone', () => {
    const planned = { diagnosisCategory: 'ischemic', tnkRecommended: true, evtRecommended: true, ticiScore: '2b' };
    expect(runBpEffects(planned).bpPhase).toBe('pre-tnk');
    expect(showPostProtocol(planned)).toBe(false);
    expect(runBpEffects({ ...planned, reperfusionTime: '00:30' }).bpPhase).toBe('post-evt');
    expect(runBpEffects({ ...planned, reperfusionTime: '00:30', needleTime: '00:15' }).bpPhase).toBe('post-tnk');
    expect(runBpEffects({ needleTime: '00:15', bpPhase: 'ich' }).bpPhase).toBe('ich');
  });

  it.each(['tnkAdminTime', 'needleTime', 'dtnTnkAdministered'])('keeps the recorded %s intact in consent-copy pre-treatment attribution', (field) => {
    const note = { [field]: administered, tnkRecommended: false };
    const block = between('const cdTnkAdminTime =', 'const cdMrs =');
    const text = new Function('telestrokeNote', 'treatmentAdministrationTime', `${block}; return cdTnk;`)(note, treatmentAdministrationTime);
    expect(text).toBe(`IV TNK administered at ${administered}`);
  });
});
