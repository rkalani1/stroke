import { describe, it, expect } from 'vitest';
import {
  computeMeasuredICP,
  computeActiveTier,
  computeComplianceBadge,
  computeDripInterval
} from '../src/simulators/EvdIcpSimulator.jsx';

const base = {
  trueMeanICP: 12,
  transducerOffset: 0,
  stopcockPosition: 0,
  isKinked: false,
  isClotted: false,
  hasAirBubble: false
};

describe('EVD/ICP simulator — measuredICP', () => {
  it('reads the true mean ICP when the line is clean and level', () => {
    expect(computeMeasuredICP(base)).toBe(12);
  });

  it('reads 0 when the stopcock is closed to the patient', () => {
    expect(computeMeasuredICP({ ...base, stopcockPosition: 1 })).toBe(0);
  });

  it('reads a falsely low ~2 mmHg when kinked or clotted', () => {
    expect(computeMeasuredICP({ ...base, isKinked: true })).toBe(2);
    expect(computeMeasuredICP({ ...base, isClotted: true })).toBe(2);
  });

  it('applies the leveling error of 0.74 mmHg per cm below the tragus', () => {
    // +10 cm below tragus → +7.4 mmHg
    expect(computeMeasuredICP({ ...base, transducerOffset: 10 })).toBe(19.4);
    // -10 cm above tragus → -7.4 mmHg
    expect(computeMeasuredICP({ ...base, transducerOffset: -10 })).toBe(4.6);
  });

  it('adds +1.5 mmHg for an air bubble', () => {
    expect(computeMeasuredICP({ ...base, hasAirBubble: true })).toBe(13.5);
  });
});

describe('EVD/ICP simulator — tiers', () => {
  it('maps true mean ICP to the active escalation tier', () => {
    expect(computeActiveTier(12)).toBe(0);
    expect(computeActiveTier(16)).toBe(1);
    expect(computeActiveTier(22)).toBe(2);
    expect(computeActiveTier(24)).toBe(3);
    expect(computeActiveTier(40)).toBe(3);
  });
});

describe('EVD/ICP simulator — compliance badge', () => {
  it('flags CRITICAL at measured ICP ≥ 22', () => {
    expect(computeComplianceBadge(22, 2).level).toBe('CRITICAL');
  });
  it('flags COMPROMISED at ICP ≥ 16 or low compliance', () => {
    expect(computeComplianceBadge(16, 2).level).toBe('COMPROMISED');
    expect(computeComplianceBadge(12, 0).level).toBe('COMPROMISED');
  });
  it('flags NORMAL otherwise', () => {
    expect(computeComplianceBadge(12, 2).level).toBe('NORMAL');
  });
});

describe('EVD/ICP simulator — drip dynamics', () => {
  it('drips only when open, unobstructed, and driving pressure is positive', () => {
    const r = computeDripInterval({ trueMeanICP: 12, evdHeight: 10, transducerOffset: 0, stopcockPosition: 0, isKinked: false, isClotted: false });
    expect(r.drips).toBe(true);
    expect(r.intervalMs).toBeGreaterThanOrEqual(400);
    expect(r.intervalMs).toBeLessThanOrEqual(3000);
  });

  it('does not drip when the stopcock is not fully open', () => {
    expect(computeDripInterval({ trueMeanICP: 12, evdHeight: 10, transducerOffset: 0, stopcockPosition: 2, isKinked: false, isClotted: false }).drips).toBe(false);
  });

  it('does not drip when driving pressure is non-positive', () => {
    // High drip-chamber height swallows the driving pressure.
    expect(computeDripInterval({ trueMeanICP: 12, evdHeight: 25, transducerOffset: 0, stopcockPosition: 0, isKinked: false, isClotted: false }).drips).toBe(false);
  });

  it('shortens the interval as driving pressure rises', () => {
    const low = computeDripInterval({ trueMeanICP: 14, evdHeight: 10, transducerOffset: 0, stopcockPosition: 0, isKinked: false, isClotted: false });
    const high = computeDripInterval({ trueMeanICP: 30, evdHeight: 5, transducerOffset: 0, stopcockPosition: 0, isKinked: false, isClotted: false });
    expect(high.intervalMs).toBeLessThan(low.intervalMs);
  });
});
