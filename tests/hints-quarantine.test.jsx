import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const selected = vi.hoisted(() => ({ key: 'skew-present', index: 0 }));
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [selected.index++ === 0 ? selected.key : initial, () => {}]
  };
});
import { HintsSimulator } from '../src/simulators/HintsSimulator.jsx';

beforeEach(() => { selected.index = 0; });
describe('HINTS cover-test animation quarantine', () => {
  it('withholds the faulty eye stage when positive skew is selected', () => {
    selected.key = 'skew-present';
    const markup = renderToStaticMarkup(<HintsSimulator />);
    expect(markup).toContain('Positive-skew animation is temporarily unavailable');
    expect(markup).not.toContain('class="hint-head"');
    expect(markup).toContain('Skew Deviation Present (Central)');
    expect(markup).toContain('Bedside Diagnostic Assistant');
    expect(markup).not.toContain('No Skew (Peripheral)');
    expect(markup).not.toContain('Hearing Intact (Peripheral)');
    expect(markup).not.toContain('Peripheral (benign)');
    expect(markup).not.toContain('Central (stroke)');
    expect(markup).toContain('Peripheral-compatible pattern');
    expect(markup).toContain('Central warning signs');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('role="status" aria-live="polite" aria-atomic="true"');
  });

  it('withholds the misplaced no-skew cover stage while retaining its explanation', () => {
    selected.key = 'skew-none';
    const markup = renderToStaticMarkup(<HintsSimulator />);
    expect(markup).toContain('No-skew animation is temporarily unavailable');
    expect(markup).not.toContain('class="hint-head"');
    expect(markup).toContain('Bedside Diagnostic Assistant');
    expect(markup).toContain('No Skew');
  });

  it('retains the non-cover eye demonstrations', () => {
    selected.key = 'hit-normal';
    const markup = renderToStaticMarkup(<HintsSimulator />);
    expect(markup).toContain('class="hint-head"');
    expect(markup).not.toContain('animation is temporarily unavailable');
  });
});
