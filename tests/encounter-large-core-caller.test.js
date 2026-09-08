import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'esbuild';
import { evaluateLargeCoreEVT } from '../src/calculators-extended.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const start = source.indexOf('const largeCoreArgs =');
const end = source.indexOf('// Only show if we have some data to work with', start);
if (start < 0 || end < start) throw new Error('Encounter EVT recommendation block not found');
const evaluatePanel = new Function('telestrokeNote', 'occlusions', 'nihss', 'aspects', 'wakeEval',
  'hoursFromLKW', 'hasMeVOOnly', 'hasLVO', 'nihssKnown', 'basilarOnly', 'evaluateLargeCoreEVT',
  `let evtRec; ${source.slice(start, end)} return evtRec;`);

const badgeStart = source.indexOf('{evtRec.eligible ? (', end);
const badgeEnd = source.indexOf('\n                                      )}', badgeStart) + '\n                                      )}'.length;
if (badgeStart < 0 || badgeEnd < badgeStart) throw new Error('Encounter EVT status badge not found');
const badgeCode = transformSync(`const badge = <>${source.slice(badgeStart, badgeEnd)}</>;`, { loader: 'jsx' }).code;
const badge = (evtRec) => renderToStaticMarkup(new Function('React', 'evtRec', `${badgeCode}; return badge;`)(React, evtRec));

function recommendation({ vessel = 'ICA', hours = 3, age = 65, premorbidMRS = 1, aspects = 4 } = {}) {
  const occlusions = vessel ? [vessel] : [];
  const evaluator = vi.fn(evaluateLargeCoreEVT);
  const result = evaluatePanel({ age, premorbidMRS }, occlusions, 15, aspects, {}, hours,
    false, occlusions.some(v => ['ICA', 'M1', 'Basilar'].includes(v)), true, vessel === 'Basilar', evaluator);
  return { result, evaluator, html: badge(result) };
}

describe('encounter large-core caller and displayed assessment state', () => {
  it.each([['ICA', 3], ['M1', 3], ['ICA', 12], ['M1', 12]])('passes documented %s at %s hours to the actual evaluator', (vessel, hours) => {
    const { result, evaluator, html } = recommendation({ vessel, hours });
    expect(evaluator).toHaveBeenCalledWith(expect.objectContaining({ lvoLocation: vessel }));
    expect(result.eligible).toBe(true);
    expect(result.reason).toContain('partial large-core screen');
    expect(result.reason).toContain('does not establish complete trial or EVT eligibility');
    expect(html).toContain('CONSIDER');
  });

  it('keeps missing vessel status pending without inventing an ICA/M1 target', () => {
    const { result, evaluator, html } = recommendation({ vessel: '' });
    expect(evaluator).not.toHaveBeenCalled();
    expect(result.reason).toContain('No target vessel occlusion documented');
    expect(html).toContain('PENDING');
    expect(html).not.toContain('NOT INDICATED');
  });

  it.each([3, 12])('shows an incomplete baseline assessment as pending at %s hours', (hours) => {
    const { result, html } = recommendation({ hours, premorbidMRS: '' });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Incomplete large-core assessment');
    expect(result.reason).not.toContain('screen not met');
    expect(html).toContain('PENDING');
  });

  it('separates a complete unmatched trial screen from missing inputs and does not label it an EVT contraindication', () => {
    const { result, html } = recommendation({ premorbidMRS: 4 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('partial large-core screen not met');
    expect(result.reason).toContain('not a contraindication to EVT');
    expect(html).toContain('REVIEW');
    expect(html).not.toMatch(/PENDING|NOT INDICATED/);
  });
});
