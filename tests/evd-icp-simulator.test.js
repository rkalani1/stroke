import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { computeMeasuredICP, computeActiveTier, computeComplianceBadge, computeDripInterval, EvdIcpSimulator } from '../src/simulators/EvdIcpSimulator.jsx';

describe('Withheld EVD/ICP model', () => {
  it.each([undefined, {}, { trueMeanICP: 12 }, { isKinked: true }, { hasAirBubble: true }, { trueMeanICP: 40 }])('does not emit simulated clinical values for %j', (input) => {
    expect(computeMeasuredICP(input)).toBeNull();
    expect(computeActiveTier(input)).toBeNull();
    expect(computeComplianceBadge(input).level).toBe('UNAVAILABLE');
    expect(computeDripInterval(input)).toEqual({ available: false, drips: null, intervalMs: null, drivingPressure: null });
  });
  it('retains a source-linked reference without a device-control interface', () => {
    const html = renderToStaticMarkup(React.createElement(EvdIcpSimulator));
    expect(html).toContain('reference only');
    expect(html).toContain('10.1007/s12028-015-0224-8');
    expect(html).not.toMatch(/<input|<select|Tier 1|Tier 2|Tier 3/);
  });
});
