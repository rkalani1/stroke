// Registry ↔ implementation ↔ DOM reconciliation for calculators.
// content/calculators/registry.json is the machine-readable inventory the
// agent assets and content pipeline expose; this locks it to reality:
//   1. every registry entry's `fn` is actually exported by its `module`;
//   2. every calculator card rendered in the Research → Calculators panel
//      maps to a registry id (via the explicit alias table below);
//   3. registry entries with no DOM card are the documented console-level
//      calculators (exposed via window.strokeP0), not silent omissions.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as calculators from '../src/calculators.js';
import * as calculatorsExtended from '../src/calculators-extended.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(readFileSync(join(repoRoot, 'content', 'calculators', 'registry.json'), 'utf8'));
const appSource = readFileSync(join(repoRoot, 'src', 'app.jsx'), 'utf8');

const MODULES = { calculators, 'calculators-extended': calculatorsExtended };

// DOM card id → registry id, where the two spellings differ.
const DOM_TO_REGISTRY = {
  'calc-chads2vasc': 'chadsvasc',
  'calc-pc-aspects': 'aspects-pc',
  'calc-aspects': 'aspects-pc',
  'calc-alteplase': 'alteplase-dose',
  'calc-ich-score': 'ich-score',
  'calc-ich-volume': 'ich-volume',
};

// DOM cards with no registry entry (documented UI-only reference cards).
const DOM_ONLY_CARDS = new Set([
  'calc-func', // FUNC score card (registry gap — tracked in PR notes)
  'calc-mrs', // mRS reference card (registry carries mrs-9q, the questionnaire)
  'calc-hunt-hess', // Hunt & Hess / WFNS reference card
  'calc-tici', // mTICI grading reference
  'calc-dragon', // DRAGON reference card
  'calc-sedan', // SEDAN reference card (if present)
  'calc-span', // SPAN-100 reference card (if present)
  'calc-risk-scores', // composite pointer card
]);

// Registry entries that intentionally have no DOM card: console-level
// calculators exposed on window.strokeP0 (see the app.jsx debug surface).
const CONSOLE_ONLY_REGISTRY = new Set([
  'tnk-dose', 'doac-start', 'pcc-dose', 'dawn', 'defuse3', 'acute-dapt',
  'essen', 'spi2', 'vasograde', 'chadsva', 'nascet', 'havoc', 'boston-caa',
  'bat', 'brain', 'nine-point', 'ogilvy-carter', 'phq9', 'mrs-9q'
]);

describe('calculator registry ↔ DOM ↔ implementation', () => {
  it('every registry fn is exported by its module', () => {
    const missing = [];
    for (const entry of registry) {
      const mod = MODULES[entry.module];
      if (!mod) { missing.push(`${entry.id}: unknown module '${entry.module}'`); continue; }
      if (typeof mod[entry.fn] !== 'function' && typeof mod[entry.fn] !== 'object') {
        missing.push(`${entry.id}: '${entry.fn}' not exported by ${entry.module}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every rendered calc-* card maps to a registry id or a documented UI-only card', () => {
    const registryIds = new Set(registry.map((r) => r.id));
    const domIds = [...appSource.matchAll(/<details id="(calc-[a-z0-9-]+)"/g)].map((m) => m[1]);
    expect(domIds.length).toBeGreaterThan(15);
    const unmapped = [];
    for (const domId of new Set(domIds)) {
      if (DOM_ONLY_CARDS.has(domId)) continue;
      const regId = DOM_TO_REGISTRY[domId] || domId.replace(/^calc-/, '');
      if (!registryIds.has(regId)) unmapped.push(`${domId} → '${regId}' not in registry`);
    }
    expect(unmapped).toEqual([]);
  });

  it('registry entries without a DOM card are the documented console-level set', () => {
    const domIds = new Set(
      [...appSource.matchAll(/<details id="(calc-[a-z0-9-]+)"/g)].map((m) =>
        (Object.entries(DOM_TO_REGISTRY).find(([d]) => d === m[1])?.[1]) || m[1].replace(/^calc-/, '')
      )
    );
    const uncovered = registry
      .map((r) => r.id)
      .filter((id) => !domIds.has(id) && !CONSOLE_ONLY_REGISTRY.has(id));
    expect(uncovered).toEqual([]);
  });
});
