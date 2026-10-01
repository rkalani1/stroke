import { describe, it, expect } from 'vitest';
import { classifyHints, DEFAULT_FINDINGS } from '../src/simulators/HintsSimulator.jsx';

const PERIPHERAL_FINDINGS = { hit: 'abnormal', nystagmus: 'uni', skew: 'none', hearing: 'normal' };

describe('HINTS+ reference — classifier', () => {
  it('starts with an incomplete exam instead of a reassuring result', () => {
    const r = classifyHints(DEFAULT_FINDINGS);
    expect(r.complete).toBe(false);
    expect(r.tone).toBe('warn');
    expect(r.profile).toContain('INCOMPLETE');
  });

  it('classifies a fully documented peripheral pattern', () => {
    const r = classifyHints(PERIPHERAL_FINDINGS);
    expect(r.isCentral).toBe(false);
    expect(r.tone).toBe('ok');
    expect(r.profile).toBe('PERIPHERAL VESTIBULAR PROFILE');
    expect(r.reasons).toEqual([]);
  });

  it('treats the bilaterally normal HIT key as a central warning', () => {
    const r = classifyHints({ ...DEFAULT_FINDINGS, hit: 'normal' });
    expect(r.isCentralHIT).toBe(true);
    expect(r.isCentral).toBe(true);
    expect(r.profile).toBe('CENTRAL WARNING PATTERN - URGENT STROKE EVALUATION');
    expect(r.reasons).toEqual(['Bilaterally normal HIT (no corrective saccade to either side)']);
  });

  it('does NOT flag central when the head-impulse is abnormal (peripheral)', () => {
    const r = classifyHints({ ...PERIPHERAL_FINDINGS, hit: 'abnormal' });
    expect(r.isCentralHIT).toBe(false);
    expect(r.isCentral).toBe(false);
  });

  it('flags the pathologic direction-changing / vertical / pure torsional key as central', () => {
    const r = classifyHints({ ...DEFAULT_FINDINGS, nystagmus: 'bi' });
    expect(r.isCentralNystagmus).toBe(true);
    expect(r.isCentral).toBe(true);
    expect(r.reasons).toEqual(['Pathologic direction-changing, vertical or purely torsional nystagmus']);
  });

  it('flags skew deviation present as central', () => {
    const r = classifyHints({ ...DEFAULT_FINDINGS, skew: 'skew' });
    expect(r.isCentralSkew).toBe(true);
    expect(r.isCentral).toBe(true);
  });

  it('flags new unilateral hearing loss (HINTS+) as central (AICA)', () => {
    const r = classifyHints({ ...DEFAULT_FINDINGS, hearing: 'loss' });
    expect(r.isCentralHearing).toBe(true);
    expect(r.isCentral).toBe(true);
  });

  it('is central when ANY single finding is central (OR, not AND)', () => {
    // Only one central finding among four → still central.
    const single = classifyHints({ hit: 'abnormal', nystagmus: 'uni', skew: 'skew', hearing: 'normal' });
    expect(single.isCentral).toBe(true);
    expect(single.reasons).toHaveLength(1);
  });

  it('lists every triggering central finding in reasons', () => {
    const r = classifyHints({ hit: 'normal', nystagmus: 'bi', skew: 'skew', hearing: 'loss' });
    expect(r.isCentral).toBe(true);
    expect(r.reasons).toHaveLength(4);
  });

  // Preserve every assessed/unassessed combination when changing presentation.
  // These are behavior checks, not validation of HINTS diagnostic performance.
  const combinations = [];
  for (const hit of ['', 'abnormal', 'normal']) {
    for (const nystagmus of ['', 'uni', 'bi']) {
      for (const skew of ['', 'none', 'skew']) {
        for (const hearing of ['', 'normal', 'loss']) {
          combinations.push({ hit, nystagmus, skew, hearing });
        }
      }
    }
  }
  it.each(combinations)('preserves missing and warning findings: %j', (findings) => {
    const result = classifyHints(findings);
    const warningCount = [findings.hit === 'normal', findings.nystagmus === 'bi',
      findings.skew === 'skew', findings.hearing === 'loss'].filter(Boolean).length;
    const complete = Object.values(findings).every(Boolean);
    expect(result.complete).toBe(complete);
    expect(result.isCentral).toBe(warningCount > 0);
    expect(result.reasons).toHaveLength(warningCount);
    if (warningCount) {
      expect(result.profile).toBe('CENTRAL WARNING PATTERN - URGENT STROKE EVALUATION');
      expect(result.tone).toBe('crit');
    } else if (complete) {
      expect(findings).toEqual(PERIPHERAL_FINDINGS);
      expect(result.profile).toBe('PERIPHERAL VESTIBULAR PROFILE');
      expect(result.tone).toBe('ok');
    } else {
      expect(result.profile).toBe('EXAM INCOMPLETE — NO CLASSIFICATION');
      expect(result.tone).toBe('warn');
    }
  });
});
