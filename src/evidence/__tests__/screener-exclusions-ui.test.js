import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

// Render the actual private refiner rather than a second implementation of its state rules.
const source = readFileSync(new URL('../../components/TrialScreener.jsx', import.meta.url), 'utf8');
const start = source.indexOf('function ExclusionRefiner(');
const end = source.indexOf('\n}\n', start) + 2;
const compiled = transformSync(source.slice(start, end), { loader: 'jsx', jsx: 'transform' }).code;
const ExclusionRefiner = new Function('React', 'cx', 'IconChevron', 'IconCheck', `${compiled}; return ExclusionRefiner;`)(React, (...classes) => classes.filter(Boolean).join(' '), () => null, () => null);
const render = (checked, items = [{ id: 'priorICH', label: 'Prior intracranial hemorrhage' }]) => renderToStaticMarkup(React.createElement(ExclusionRefiner, { checked, items, onToggle() {}, onClear() {} }));

describe('tri-state exclusion reset visibility', () => {
  it('allows an absent assessment to reset to unknown without a positive badge', () => {
    const html = render({ priorICH: false });
    expect(html).toContain('Absent');
    expect(html).toContain('Reset exclusions to unknown');
    expect(html).not.toContain('bg-crit-600 px-2');
  });
  it('allows a present assessment to reset and displays its positive badge', () => {
    const html = render({ priorICH: true });
    expect(html).toContain('Present');
    expect(html).toContain('Reset exclusions to unknown');
    expect(html).toContain('bg-crit-600 px-2');
  });
  it('keeps hidden documented assessments resettable', () => {
    expect(render({ filteredOut: false }, [])).toContain('Reset exclusions to unknown');
  });
  it('does not offer reset for wholly unknown or malformed assessment values', () => {
    for (const checked of [{}, { priorICH: null }, { priorICH: 'false' }]) {
      const html = render(checked);
      expect(html).not.toContain('Reset exclusions to unknown');
      expect(html).not.toContain('bg-crit-600 px-2');
    }
  });
});
