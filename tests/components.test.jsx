import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DAPTDurationCalculator } from '../src/components.jsx';
import * as calculatorsExtended from '../src/calculators-extended.js';

vi.mock('../src/calculators-extended.js', async () => {
  const actual = await vi.importActual('../src/calculators-extended.js');
  return {
    ...actual,
    recommendAcuteDAPT: vi.fn(),
  };
});

describe('DAPTDurationCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders and calls recommendAcuteDAPT with default values', () => {
    calculatorsExtended.recommendAcuteDAPT.mockReturnValue({
      rationale: 'Test rationale',
      duration: '21 days',
      class: 'Class I',
      dosing: 'Load 300mg clopidogrel, then 75mg daily.',
      source: 'CHANCE trial',
      regimen: 'Clopidogrel 75mg daily + Aspirin 81mg daily'
    });

    const html = renderToStaticMarkup(<DAPTDurationCalculator />);

    expect(html).toContain('Acute DAPT Duration (CHANCE / POINT / THALES)');
    expect(html).toContain('Test rationale');
    expect(html).toContain('21 days');
    expect(html).toContain('Load 300mg clopidogrel');
    expect(html).toContain('CHANCE trial');
    expect(html).toContain('Clopidogrel 75mg daily + Aspirin 81mg daily');

    expect(calculatorsExtended.recommendAcuteDAPT).toHaveBeenCalledWith({
      strokeType: 'ischemic',
      nihss: '',
      abcd2: '',
      atherosclerotic: false,
      lvdSymptomatic: false,
      cyp2c19LOF: false,
      ichRisk: 'normal',
      timeFromOnsetH: ''
    });
  });

  it('initializes with provided defaults', () => {
    calculatorsExtended.recommendAcuteDAPT.mockReturnValue({
      rationale: 'Test rationale with defaults'
    });

    const html = renderToStaticMarkup(<DAPTDurationCalculator defaults={{
      strokeType: 'tia',
      nihss: '3',
      ichRisk: 'high',
      atherosclerotic: true
    }} />);

    // Check it calls recommendAcuteDAPT with the defaults immediately
    expect(calculatorsExtended.recommendAcuteDAPT).toHaveBeenCalledWith(expect.objectContaining({
      strokeType: 'tia',
      nihss: '3',
      ichRisk: 'high',
      atherosclerotic: true
    }));
  });

  it('renders correctly when recommendAcuteDAPT returns empty object', () => {
    calculatorsExtended.recommendAcuteDAPT.mockReturnValue({});

    const html = renderToStaticMarkup(<DAPTDurationCalculator />);

    expect(html).toContain('Acute DAPT Duration');
    expect(html).not.toContain('Test rationale');
    expect(html).not.toContain('Class I');
  });
});
