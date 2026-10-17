import React from 'react';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CaseBar, { caseSummary } from '../src/components/CaseBar.jsx';
import QuickSearch from '../src/components/QuickSearch.jsx';
import { EligibilityTables } from '../src/components/EligibilityTables.jsx';
import { newEncounter } from '../src/workspace-state.js';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const shell = read('../src/design/shell.css');
const tokens = read('../src/design/tokens.css');
const now = new Date('2026-10-01T12:00:00').getTime();
const encounter = patch => { const base = newEncounter(); return { ...base, ...patch, note: { ...base.note, ...patch.note } }; };
const bar = (state, props = {}) => renderToStaticMarkup(<CaseBar state={state} documentLabel="Pulsara summary" blocked={0} onCopy={() => {}} copyStatus="" {...props} />);

describe('type scale and weights', () => {
  it('sets every shell font size from the scale (16px phone inputs excepted)', () => {
    const sizes = [...shell.matchAll(/font-size:\s*([^;}]+)/g)].map(match => match[1].trim());
    expect(sizes.filter(value => !/^(var\(--(text|display)-[a-z0-9]+\)|max\(\.75em, var\(--text-2xs\)\))$/.test(value))).toEqual(['16px !important']);
    const shorthands = [...shell.matchAll(/\bfont:\s*([^;}]+)/g)].map(match => match[1]);
    expect(shorthands.filter(value => /\d(rem|px)\b/.test(value))).toEqual([]);
  });
  it('uses only shipped weights and keeps the 11px floor as the smallest step', () => {
    expect(shell).not.toMatch(/\b650\b/);
    const steps = [...tokens.matchAll(/--(?:text|display)-[a-z0-9]+:\s*([\d.]+)rem/g)].map(match => Number(match[1]));
    expect(Math.min(...steps)).toBe(0.6875);
    expect(shell).not.toMatch(/\.625rem/);
  });
  it('defines one selected-fill text token per theme', () => {
    expect(tokens.match(/--c-on-accent:/g)).toHaveLength(2);
  });
});

describe('case bar', () => {
  it('says "partial" in text for a partial itemized NIHSS', () => {
    const state = encounter({ note: { diagnosisCategory: 'ischemic' }, nihss: { consciousness: 'Drowsy (1)', loc_questions: 'One correct (1)' } });
    const summary = caseSummary(state, now);
    expect(summary).toMatchObject({ nihss: '2', nihssPartial: true, nihssDocumented: 2 });
    const html = bar(state);
    expect(html).toMatch(/data-flag="partial" data-detail="" title="Partial itemized sum: 2 of 15 items documented">/);
    expect(html).toMatch(/>2<small>partial<\/small>/);
  });
  it('keeps the blocked count with its noun on a two-line phone button', () => {
    expect(bar(encounter({ note: { age: '70' } }), { blocked: 2 })).toContain('Review 2 flags');
  });
});

describe('names that include the visible label (WCAG 2.5.3)', () => {
  it('names the search close button from its visible text', () => {
    const html = renderToStaticMarkup(<QuickSearch open={false} onClose={() => {}} version="test" />);
    expect(html).not.toContain('aria-label="Close search"');
    expect(html).toContain('<span class="quick-search__close-key">Esc<span class="sr-only">, close search</span></span>');
    expect(html).toContain('<span class="quick-search__close-touch">Close<span class="sr-only"> search</span></span>');
  });
});

describe('trial criteria tables', () => {
  it('labels phases in sentence case and gives each phase an h2 above the study h3s', () => {
    const html = renderToStaticMarkup(<EligibilityTables />);
    expect(html).toContain('<h2 class="sr-only">Acute (onset ≤ 24 hours)</h2>');
    expect(html).toContain('Outpatient (day 14 onward) · ');
    // Table titles (accessible names, copied HTML/Markdown) keep their stored wording.
    expect(html).not.toMatch(/<(summary|h2)[^>]*>[^<]*(Hours|Onward|Admission)/);
    expect(html).toMatch(/role="group" aria-label="[^"]+ study cards"/);
  });
});
