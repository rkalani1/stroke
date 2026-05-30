import { describe, it, expect } from 'vitest';
import { classifyHints, DEFAULT_FINDINGS } from '../src/simulators/HintsSimulator.jsx';

describe('HINTS+ simulator — classifier', () => {
  it('classifies the peripheral defaults as PERIPHERAL (no central finding)', () => {
    const r = classifyHints(DEFAULT_FINDINGS);
    expect(r.isCentral).toBe(false);
    expect(r.tone).toBe('ok');
    expect(r.profile).toBe('PERIPHERAL VESTIBULAR PROFILE');
    expect(r.reasons).toEqual([]);
  });

  it('treats a NORMAL/intact head-impulse as the CENTRAL sign (counterintuitive — do not "fix")', () => {
    const r = classifyHints({ ...DEFAULT_FINDINGS, hit: 'normal' });
    expect(r.isCentralHIT).toBe(true);
    expect(r.isCentral).toBe(true);
    expect(r.profile).toBe('CENTRAL STROKE PROFILE (INFARCT ALARM)');
  });

  it('does NOT flag central when the head-impulse is abnormal (peripheral)', () => {
    const r = classifyHints({ ...DEFAULT_FINDINGS, hit: 'abnormal' });
    expect(r.isCentralHIT).toBe(false);
    expect(r.isCentral).toBe(false);
  });

  it('flags direction-changing / vertical nystagmus as central', () => {
    const r = classifyHints({ ...DEFAULT_FINDINGS, nystagmus: 'bi' });
    expect(r.isCentralNystagmus).toBe(true);
    expect(r.isCentral).toBe(true);
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
});
