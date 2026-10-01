import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const selected = vi.hoisted(() => ({ key: null, index: 0 }));
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [selected.index++ === 0 ? selected.key : initial, () => {}]
  };
});
import { HintsSimulator } from '../src/simulators/HintsSimulator.jsx';

const examples = [
  ['hit-peripheral', 'Unilateral VOR Deficit', 'an abnormal HIT alone does not exclude stroke'],
  ['hit-central', 'VOR Intact Bilaterally', 'A normal response in only one direction does not establish a bilaterally normal HIT'],
  ['nys-uni', 'Unidirectional Horizontal', 'alone does not exclude a central cause'],
  ['nys-bi', 'Gaze-Evoked / Direction-Changing', 'a few low-amplitude beats only at extreme lateral gaze, which may be physiologic'],
  ['nys-vert', 'Vertical', 'positional vertical-torsional nystagmus from BPPV is a separate episodic syndrome'],
  ['skew-none', 'No Skew', 'Horizontal refixation alone is not skew deviation'],
  ['skew-present', 'Skew Present', 'specific but insensitive sign of a central'],
  ['hear-normal', 'No New Hearing Loss', 'This isolated finding does not establish a peripheral diagnosis or exclude stroke'],
  ['hear-loss', 'New Unilateral Hearing Loss', 'can also occur with peripheral inner-ear disorders']
];

beforeEach(() => { selected.index = 0; selected.key = null; });
describe('HINTS written reference after movement withdrawal', () => {
  it.each(examples)('retains %s as a written example without a movement rendering', (key, label, qualification) => {
    selected.key = key;
    const markup = renderToStaticMarkup(<HintsSimulator />);
    expect(markup).toContain('Eye-movement animations are unavailable');
    expect(markup).toContain(qualification);
    expect(markup).toMatch(/<div aria-live="polite" aria-atomic="true"[^>]*>/);
    expect(markup).toContain('Pattern checklist');
    expect(markup).toContain('HINTS+ findings');
    expect(markup).not.toMatch(/Bedside Diagnostic Assistant|HINTS\+ classifier/);
    expect(markup).toMatch(new RegExp(`<button[^>]*aria-pressed="true"[^>]*>${label}</button>`));
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(markup.match(/<button\b/g)).toHaveLength(18); // Nine examples, eight findings and reset.
    expect(markup).not.toMatch(/hint-(?:head|eye|pupil|cover|stage|anim)|<style|<svg|role="img"|@keyframes/);
    expect(markup).not.toMatch(/Interactive Eye Simulator|animate the|restart|replay|temporarily unavailable/i);
    expect(markup).toContain('EXAM INCOMPLETE — NO CLASSIFICATION');
    expect(markup).toContain('role="status" aria-live="polite" aria-atomic="true"');
    expect(markup).toContain('Clear exam findings');
    expect(markup).toContain('Peripheral-compatible pattern');
    expect(markup).toContain('Central warning signs');
    expect(markup).not.toMatch(/No Skew \(Peripheral\)|Hearing Intact \(Peripheral\)|Peripheral \(benign\)|Central \(stroke\)/);
  });

  it('opens as a reference with unassessed findings and no motion affordance', () => {
    const markup = renderToStaticMarkup(<HintsSimulator />);
    expect(markup).toContain('Select a finding below to read its explanation');
    expect(markup).toContain('EXAM INCOMPLETE — NO CLASSIFICATION');
    expect(markup).toContain('when performed by trained clinicians');
    expect(markup).toContain('not a stand-alone diagnosis');
    expect(markup).not.toContain('aria-pressed="true"');
    expect(markup).not.toContain('Eye Simulator');
  });

  it('removes dormant geometry, movement styles and replay state from the shipped module source', () => {
    const source = readFileSync(new URL('../src/simulators/HintsSimulator.jsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/@keyframes|\banimation\s*:|hint-(?:head|eye|pupil|cover|stage|anim)|animNonce|stageAnimClass|coverMode/);
    expect(source).not.toMatch(/\b(?:anim|cover)\s*:/);
  });

  it('keeps primary-source distinctions in the checklist, mnemonic and table', () => {
    const markup = renderToStaticMarkup(<HintsSimulator />);
    expect(markup).toContain('Bilaterally normal VOR');
    expect(markup).toContain('Unilateral abnormal VOR (saccade)');
    expect(markup).toContain('Unilateral corrective saccade, concordant with horizontal nystagmus');
    expect(markup).toContain('bilaterally abnormal, untestable or equivocal HIT, neither option applies');
    expect(markup).toContain('leave HIT unselected and seek clinical reassessment');
    expect(markup).toContain('in adult patients with the');
    expect(markup).toContain('Impulse Normal (both sides)');
    expect(markup).toContain('Bilaterally normal — no corrective saccade to either side');
    expect(markup).toContain('Unidirectional Horizontal');
    expect(markup).toContain('Unidirectional horizontal (may have slight torsion)');
    expect(markup).toContain('Pathologic direction-changing / vertical / pure torsional');
    expect(markup).toContain('Pathologic direction-changing horizontal, vertical or purely torsional');
    expect(markup).toContain('No vertical refixation');
    expect(markup).toContain('href="https://doi.org/10.1111/acem.14728"');
    expect(markup).not.toContain('Stable — no vertical movement');
    const source = readFileSync(new URL('../src/simulators/HintsSimulator.jsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/finger-rub or whisper|eyes stay conjugate and horizontally aligned|the head rotates right/);
  });
});
