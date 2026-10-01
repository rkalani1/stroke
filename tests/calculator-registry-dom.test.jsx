import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as calculators from '../src/calculators.js';
import * as calculatorsExtended from '../src/calculators-extended.js';
import * as supplementary from '../src/supplementary-calculators.js';
import Tools from '../src/Tools.jsx';
import Encounter from '../src/Encounter.jsx';
import { newEncounter } from '../src/workspace-state.js';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';

const registry = JSON.parse(readFileSync(new URL('../content/calculators/registry.json', import.meta.url), 'utf8'));
const modules = { calculators, 'calculators-extended': calculatorsExtended, 'supplementary-calculators': supplementary };
const contexts = ['ischemic', 'ich', 'tia'].map(diagnosisCategory => {
  const state = newEncounter();
  state.note.diagnosisCategory = diagnosisCategory;
  return renderToStaticMarkup(<Encounter state={state} update={() => {}} now={Date.now()} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
});

const toolsHtml = renderToStaticMarkup(<Tools state={newEncounter()} update={() => {}} mapUrl="https://example.com" />);

describe('maintained calculator registry describes mounted tools', () => {
  it.each(registry)('$id advertises an actual exported function and a retained, rendered destination', entry => {
    expect(typeof modules[entry.module]?.[entry.fn]).toBe('function');
    const route = parseWorkspaceRoute(entry.route);
    expect(['encounter','tools']).toContain(route.surface);
    expect(route.tool).toBeTruthy();
    expect([...contexts, toolsHtml].some(html => html.includes(`id="calc-${route.tool}"`)), `${entry.id}: no actual retained destination`).toBe(true);
  });
  it('advertises only explicitly maintained calculator destinations', () => {
    expect(registry.length).toBeGreaterThan(0);
    expect(new Set(registry.map(entry => entry.id)).size).toBe(registry.length);
    for (const entry of registry) expect(entry.route).toMatch(/^#\/(encounter|tools)\//);
    for (const id of ['rcvs2', 'stroke-prognosis', 'evd', 'npi']) expect(registry.map(entry => entry.id)).not.toContain(id);
  });
  it.each(['rcvs2', 'stroke-prognosis', 'evd', 'npi', 'pcc-dose', 'andexanet', 'enoxaparin', 'doac-start', 'select', 'edema', 'func'])('%s resolves to an explicit retirement surface instead of an unrelated retained calculator', id => {
    for (const route of [`#/encounter/${id}`, `#/calculators/${id}`, `#/research/calculators/${id}`, `#/protocols/calculators/${id}`]) expect(parseWorkspaceRoute(route)).toMatchObject({ surface: 'retired' });
  });
  it('does not export the withdrawn arithmetic and prognosis directory under hidden helper names', () => {
    for (const name of ['calculateRCVS2Score', 'calculatePCCDose', 'calculateAndexanetDose', 'calculateEnoxaparinDose', 'calculateDOACStart', 'calculateABCD2Score', 'calculateROPEScore']) expect(calculators[name]).toBeUndefined();
    for (const name of ['calculateSeLECTScore', 'calculateEDEMAScore', 'evaluateCRAOTreatment', 'getAIConfiguration']) expect(calculatorsExtended[name]).toBeUndefined();
  });
});
