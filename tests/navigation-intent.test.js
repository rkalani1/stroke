import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { createNavigationIntents, revealNavigationTarget, calculatorAnchorFor, CALCULATOR_TARGET_IDS, CALCULATOR_ALIASES } from '../src/navigation-intent.js';

describe('navigation intent', () => {
  it('cancels delayed work for newer requests and same-route user navigation', () => {
    const intent = createNavigationIntents();
    const first = intent.begin();
    const second = intent.begin();
    expect(intent.isCurrent(first)).toBe(false);
    expect(intent.isCurrent(second)).toBe(true);
    intent.cancel(); // Clicking the current top-level tab is still new intent.
    expect(intent.isCurrent(second)).toBe(false);
  });

  it('preserves its own pending destination but cancels after away-and-back history', () => {
    const intent = createNavigationIntents();
    const token = intent.begin();
    intent.expectHash(token, '#/research/references', '#/encounter');
    intent.onHashChange('#/research/references');
    expect(intent.isCurrent(token)).toBe(true);
    intent.onHashChange('#/trials');
    intent.onHashChange('#/research/references');
    expect(intent.isCurrent(token)).toBe(false);
  });

  it('does not reserve a future hash event when already at the requested hash', () => {
    const intent = createNavigationIntents();
    const token = intent.begin();
    intent.expectHash(token, '#/research/references', '#/research/references');
    intent.onHashChange('#/research/references');
    expect(intent.isCurrent(token)).toBe(false);
  });

  it('cannot let an older request reserve a newer action’s hash change', () => {
    const intent = createNavigationIntents();
    const first = intent.begin();
    const second = intent.begin();
    intent.expectHash(first, '#/research/references', '#/encounter');
    intent.onHashChange('#/research/references');
    expect(intent.isCurrent(second)).toBe(false);
  });

  it('does not cancel a newer intent when an older internal hash event is delivered late', () => {
    const intent = createNavigationIntents();
    const first = intent.begin();
    intent.expectHash(first, '#/research/references', '#/encounter');
    const second = intent.begin();
    intent.expectHash(second, '#/research/references', '#/research/references');
    intent.onHashChange('#/research/references', '#/encounter');
    expect(intent.isCurrent(second)).toBe(true);
    intent.onHashChange('#/trials', '#/research/references');
    intent.onHashChange('#/research/references', '#/trials');
    expect(intent.isCurrent(second)).toBe(false);
  });
});

describe('calculator search destinations', () => {
  it('has a rendered details card for every supported target and every alias', () => {
    const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
    for (const id of CALCULATOR_TARGET_IDS) expect(source, id).toContain(`<details id="calc-${id}"`);
    for (const [alias, id] of Object.entries(CALCULATOR_ALIASES)) {
      expect(CALCULATOR_TARGET_IDS, alias).toContain(id);
      expect(calculatorAnchorFor(alias)).toBe(`calc-${id}`);
    }
  });

  it('resolves real calculator aliases without inventing missing panels', () => {
    expect(calculatorAnchorFor('abcd2')).toBe('calc-abcd2');
    expect(calculatorAnchorFor('ABCD² Score')).toBe('calc-abcd2');
    expect(calculatorAnchorFor('chadsvasc')).toBe('calc-chads2vasc');
    expect(calculatorAnchorFor('aspects-pc')).toBe('calc-pc-aspects');
    expect(calculatorAnchorFor('alteplase-dose')).toBe('calc-alteplase');
    expect(calculatorAnchorFor('nonexistent')).toBeNull();
    expect(calculatorAnchorFor('essen')).toBeNull();
  });

  it('routes every resolvable projected calculator to an existing rendered card', () => {
    const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
    const entries = JSON.parse(fs.readFileSync(new URL('../content/search-index.json', import.meta.url), 'utf8'));
    let checked = 0;
    for (const entry of entries.filter(item => item.domain === 'calculator')) {
      const anchor = calculatorAnchorFor(entry.id);
      if (!anchor) continue;
      expect(source, entry.id).toContain(`<details id="${anchor}"`);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(12);
  });
});

describe('navigation target reveal', () => {
  function harness() {
    const frames = [];
    const intent = createNavigationIntents();
    const token = intent.begin();
    const reveal = vi.fn();
    let target = null;
    revealNavigationTarget({ isCurrent: () => intent.isCurrent(token), findTarget: () => target, reveal, requestFrame: frame => frames.push(frame), maxFrames: 4 });
    return { intent, reveal, frames, setTarget: next => { target = next; }, tick: () => frames.shift()?.() };
  }

  it('waits for mounted and filter-visible content before revealing it once', () => {
    const h = harness();
    h.tick();
    const card = { hidden: true, getClientRects: () => [1] };
    h.setTarget(card);
    h.tick();
    expect(h.reveal).not.toHaveBeenCalled();
    card.hidden = false;
    h.tick();
    expect(h.reveal).toHaveBeenCalledOnce();
    expect(h.reveal).toHaveBeenCalledWith(card);
    expect(h.frames).toHaveLength(0);
  });

  it('never reveals or focuses a target after a later same-route intent', () => {
    const h = harness();
    h.tick();
    h.intent.cancel();
    h.setTarget({ hidden: false, getClientRects: () => [1] });
    h.tick();
    expect(h.reveal).not.toHaveBeenCalled();
    expect(h.frames).toHaveLength(0);
  });

  it('stops after the bounded render window when the target does not exist', () => {
    const h = harness();
    for (let i = 0; i < 4; i++) h.tick();
    expect(h.reveal).not.toHaveBeenCalled();
    expect(h.frames).toHaveLength(0);
  });
});
