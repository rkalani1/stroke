import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import {
  PupillometrySimulator,
  interpretPupillometry,
  contralateralInitialSize
} from '../src/simulators/PupillometrySimulator.jsx';

describe('Pupillometry clinical quarantine', () => {
  it.each([
    undefined,
    { npi: 4.5, cv: 1.5, change: 20, diff: 0 },
    { npi: 0, cv: 0, change: 0, diff: 2 }
  ])('does not provide clinical action instructions for any profile', (profile) => {
    const result = interpretPupillometry(profile);
    expect(result.status).toBe('INTERPRETATION UNAVAILABLE');
    expect(result.steps).toEqual([]);
  });

  it('does not convert an NPi difference into a pupil diameter', () => {
    expect(contralateralInitialSize(4, 1)).toBeNull();
  });

  it('renders retained evidence without the quarantined controls or advice', () => {
    const markup = renderToStaticMarkup(React.createElement(PupillometrySimulator));
    expect(markup).toContain('Pupillometry simulator temporarily unavailable');
    expect(markup).toContain('ORANGE Study');
    expect(markup).toContain('Petrosino');
    expect(markup).toContain('Kim et al.');
    expect(markup).not.toMatch(/<input|<button|npi-pupil|Actionable next steps|NPi action thresholds|urgent non-contrast head CT|Du 2026/i);
  });
});
