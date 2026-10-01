import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { gcsDocumentation, reviewedGcs } from '../src/encounter-clinical-review.js';
import { buildSummary, newEncounter, outputWarnings, updateEncounter } from '../src/workspace-state.js';

const now = Date.parse('2026-10-01T18:00:00Z');
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} />);

describe('GCS assessment and documentation', () => {
  it('presents response descriptions with no default score', () => {
    const html = render(newEncounter());
    for (const label of ['4 — Spontaneous', '3 — To sound', '2 — To pressure', '5 — Oriented', '4 — Confused', '6 — Obeys commands', '5 — Localising', '4 — Normal flexion', '3 — Abnormal flexion', '2 — Extension']) expect(html).toContain(label);
    expect(html).toContain('No total: incomplete / not testable');
    expect(html).not.toContain('GCS assessment limitation (optional)');
  });
  it.each(['', 'ischemic', 'tia', 'ich', 'sah', 'cvt', 'mimic', 'other'])('exports only entered GCS for diagnosis %s in either consultation format', diagnosis => {
    const state = newEncounter(); state.note.diagnosisCategory = diagnosis;
    for (const format of ['phone', 'video']) {
      state.consultationType = format;
      expect(buildSummary(state, now)).not.toContain('GCS');
      state.gcs = { eye:'4', verbal:'5', motor:'6' };
      expect(buildSummary(state, now)).toContain('GCS E4 V5 M6 = 15/15; eye: Spontaneous; verbal: Oriented; motor: Obeys commands');
      state.gcs = {};
    }
  });
  it('exports incomplete and untestable findings without imputing a total', () => {
    const state = newEncounter(); state.gcs = { eye:'4', verbal:'UN', motor:'6', notTestableReason:'Intubation' };
    expect(render(state)).toContain('GCS assessment limitation (optional)');
    const text = buildSummary(state, now);
    expect(text).toContain('GCS E4 VNT M6; total not reported (incomplete or not testable)');
    expect(text).toContain('verbal: not testable');
    expect(text).toContain('limitation: Intubation');
    expect(reviewedGcs(state.gcs)).toBeNull();
    state.gcs.verbal = '';
    expect(buildSummary(state, now)).toContain('GCS E4 V? M6; total not reported');
    expect(buildSummary(state, now)).not.toContain('limitation: Intubation');
    expect(render(state)).not.toContain('GCS assessment limitation (optional)');
  });
  it('keeps a prior limitation out of a newly testable examination and invalidates the draft', () => {
    const state = newEncounter(); state.gcs = { eye:'4', verbal:'UN', motor:'6', notTestableReason:'Intubation' };
    state.draft = { text:buildSummary(state, now), stale:false };
    const changed = updateEncounter(state, prev => ({ ...prev, gcs:{ ...prev.gcs, verbal:'5' } }));
    expect(changed.draft.stale).toBe(true);
    expect(gcsDocumentation(changed.gcs)).toContain('= 15/15');
    expect(buildSummary(changed, now)).not.toContain('limitation: Intubation');
  });
  it('applies the existing free-text output guard to a recorded limitation', () => {
    const state = newEncounter(); state.gcs = { verbal:'UN', notTestableReason:'user@example.invalid' };
    expect(outputWarnings(state)).toContain('Possible email address');
  });
});
