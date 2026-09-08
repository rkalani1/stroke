import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'esbuild';
import { calculateROPEScore } from '../src/calculators.js';
import { evaluatePASCAL } from '../src/calculators-extended.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const start = source.indexOf('<details id="calc-rope"');
const end = source.indexOf('{/* RCVS2 Score */}', start);
if (start < 0 || end < 0) throw new Error('PASCAL panel boundaries not found');
const panelSource = source.slice(start, end).trim();
const compiled = transformSync(`const panel = (${panelSource});`, { loader: 'jsx', jsx: 'transform' }).code;
const renderPanel = new Function('React', 'ropeItems', 'setRopeItems', 'getCalculatorOrder', 'calculateROPEScore', 'evaluatePASCAL', `${compiled}\nreturn panel;`);

const defaultsMatch = source.match(/const \[ropeItems, setRopeItems\] = useState\(loadFromStorage\('ropeItems', (\{[\s\S]*?\})\)\);/);
if (!defaultsMatch) throw new Error('RoPE defaults not found');
const defaults = () => new Function(`return (${defaultsMatch[1]});`)();
const ageStart = source.indexOf('const ropeAge = hasValidAge');
const ageEnd = source.indexOf('setRcvs2Items', ageStart);
if (ageStart < 0 || ageEnd < 0) throw new Error('RoPE age-sync boundaries not found');
const syncAge = new Function('hasValidAge', 'age', 'setRopeItems', source.slice(ageStart, ageEnd));

function nodesOfType(node, type) {
  if (!React.isValidElement(node)) return [];
  return [
    ...(node.type === type ? [node] : []),
    ...React.Children.toArray(node.props.children).flatMap(child => nodesOfType(child, type)),
  ];
}

function fixture(initial = defaults()) {
  let state = initial;
  const setState = update => { state = typeof update === 'function' ? update(state) : update; };
  const tree = () => renderPanel(React, state, setState, (_, fallback) => fallback, calculateROPEScore, evaluatePASCAL);
  return {
    state: () => state,
    html: () => renderToStaticMarkup(tree()),
    choices: () => nodesOfType(tree(), 'select').map(node => node.props.value),
    choose: (index, value) => nodesOfType(tree(), 'select')[index].props.onChange({ target: { value } }),
    syncAge: age => syncAge(Number.isFinite(age) && age >= 18, age, setState),
  };
}

describe('PASCAL anatomy input state in the actual calculator panel', () => {
  it('keeps default and automatically synced anatomy unknown', () => {
    const panel = fixture();
    expect(panel.choices()).toEqual(['unknown', 'unknown']);
    expect(panel.html()).toContain('Enter age');
    panel.syncAge(55);
    expect(panel.choices()).toEqual(['unknown', 'unknown']);
    expect(panel.html()).toContain('PASCAL category: Incomplete.');
    expect(panel.html()).not.toContain('routine closure is generally discouraged');
  });

  it('requires both absent observations before assigning the low-RoPE Unlikely category', () => {
    const panel = fixture({ ...defaults(), age: '55' });
    panel.choose(0, 'absent');
    expect(panel.state().largeShunt).toBe(false);
    expect(panel.html()).toContain('PASCAL category: Incomplete.');
    panel.choose(1, 'absent');
    expect(panel.state().atrialSeptalAneurysm).toBe(false);
    expect(panel.html()).toContain('PASCAL category: Unlikely.');
    panel.choose(0, 'unknown');
    expect(panel.state().largeShunt).toBeNull();
    expect(panel.html()).toContain('PASCAL category: Incomplete.');
  });

  it('accepts a documented high-risk feature and preserves positive/negative values after age sync and restore', () => {
    const panel = fixture({ ...defaults(), age: '55' });
    panel.choose(0, 'present');
    expect(panel.state().largeShunt).toBe(true);
    expect(panel.html()).toContain('PASCAL category: Possible.');
    panel.choose(1, 'absent');
    panel.syncAge(56);
    const restored = fixture(JSON.parse(JSON.stringify(panel.state())));
    expect(restored.choices()).toEqual(['present', 'absent']);
    expect(restored.html()).toContain('PASCAL category: Possible.');
  });

  it('preserves unknown across serialization, reset defaults, and clearing age', () => {
    const panel = fixture({ ...defaults(), age: '55', largeShunt: null, atrialSeptalAneurysm: false });
    const restored = fixture(JSON.parse(JSON.stringify(panel.state())));
    expect(restored.choices()).toEqual(['unknown', 'absent']);
    restored.syncAge(NaN);
    expect(restored.html()).toContain('Enter age');
    expect(restored.choices()).toEqual(['unknown', 'absent']);
    expect(fixture(defaults()).choices()).toEqual(['unknown', 'unknown']);
  });
});
