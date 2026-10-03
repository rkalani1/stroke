import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuickReferenceDefault, { QuickReference, QUICK_REFERENCE_DOSE_WEIGHTS, thrombolyticDoseRow, thrombolyticDoseTable, highlightedDoseRowKey } from '../src/components/QuickReference.jsx';

const render = props => renderToStaticMarkup(<QuickReference {...props} />);
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

describe('quick reference dose arithmetic', () => {
  it('tabulates 40-120 kg in 5 kg steps plus a >120 kg row', () => {
    expect(QUICK_REFERENCE_DOSE_WEIGHTS[0]).toBe(40);
    expect(QUICK_REFERENCE_DOSE_WEIGHTS.at(-1)).toBe(120);
    expect(QUICK_REFERENCE_DOSE_WEIGHTS).toHaveLength(17);
    expect(thrombolyticDoseTable().map(row => row.key).at(-1)).toBe('>120');
  });
  it.each([
    // kg, TNK mg, TNK mL, alteplase total, bolus, 60-min infusion (independently computed)
    [40, 10, 2, 36, 3.6, 32.4],
    [80, 20, 4, 72, 7.2, 64.8],
    [85, 21.25, 4.25, 76.5, 7.7, 68.8],
    [100, 25, 5, 90, 9, 81],
    [110, 25, 5, 90, 9, 81]
  ])('%s kg → TNK %s mg / %s mL; alteplase %s / %s / %s mg', (kg, tnkMg, tnkMl, total, bolus, infusion) => {
    expect(thrombolyticDoseRow(kg)).toMatchObject({ tnkMg, tnkMl, alteplaseTotal: total, alteplaseBolus: bolus, alteplaseInfusion: infusion });
    const row = thrombolyticDoseRow(kg);
    expect(row.alteplaseBolus + row.alteplaseInfusion).toBeCloseTo(row.alteplaseTotal, 10);
  });
  it('caps TNK at 25 mg and alteplase at 90 mg above 100 kg', () => {
    expect(thrombolyticDoseRow(110)).toMatchObject({ tnkCapped: true, alteplaseCapped: true });
    expect(thrombolyticDoseTable().at(-1)).toMatchObject({ tnkMg: 25, tnkMl: 5, alteplaseTotal: 90, alteplaseBolus: 9, alteplaseInfusion: 81 });
  });
  it('highlights the nearest 5-kg row and the >120 row', () => {
    expect(highlightedDoseRowKey(80)).toBe('80');
    expect(highlightedDoseRowKey(82)).toBe('80');
    expect(highlightedDoseRowKey(83)).toBe('85');
    expect(highlightedDoseRowKey(30)).toBe('40');
    expect(highlightedDoseRowKey(130)).toBe('>120');
    for (const invalid of ['', 'x', 0, -5, 400]) expect(highlightedDoseRowKey(invalid)).toBeNull();
  });
});

describe('quick reference rendering', () => {
  it('exports the component by name and default, with the first card open and the rest collapsible', () => {
    expect(QuickReferenceDefault).toBe(QuickReference);
    const html = render({});
    const details = html.match(/<details[^>]*>/g);
    expect(details).toHaveLength(7);
    expect(details[0]).toContain('open');
    expect(details.slice(1).every(tag => !/\sopen/.test(tag))).toBe(true);
    for (const title of ['Thrombolytic dose by weight', 'BP targets by phase', 'Anticoagulant reversal (ICH)', 'Post-thrombolysis symptomatic ICH', 'Orolingual angioedema', 'Malignant edema and decompression', 'AIS supportive care']) expect(html).toContain(title);
    expect(text(html)).toContain('Enter weight in Encounter to see the exact dose.');
    expect(html).not.toContain('aria-current');
  });
  it('shows exact doses and highlights the row for a provided weight', () => {
    const html = render({ weightKg: 80 });
    expect(text(html)).toContain('80 kg: TNK 20 mg (4 mL at 5 mg/mL) · Alteplase 72 mg total: 7.2 mg bolus over 1 min, 64.8 mg over 60 min');
    expect(html).toMatch(/<tr data-weight="80" aria-current="true"/);
    const capped = text(render({ weightKg: 110 }));
    expect(capped).toContain('110 kg: TNK 25 mg (5 mL at 5 mg/mL), capped · Alteplase 90 mg total: 9 mg bolus over 1 min, 81 mg over 60 min, capped');
    expect(render({ weightKg: 135 })).toMatch(/<tr data-weight="&gt;120" aria-current="true"/);
  });
  it('shows guideline BP targets with verified grades and the post-reperfusion harm', () => {
    const content = text(render({}));
    expect(content).toContain('Before IVT <185/110 COR 1, B-NR');
    expect(content).toContain('After IVT (24 h) <180/105 COR 1, B-R');
    expect(content).toContain('Any EVT (during + 24 h) ≤180/105 COR 2a, B-NR');
    expect(content).toContain('Do not lower SBP to <140 (harm) COR 3: Harm, A');
    expect(content).toMatch(/avoid SBP <130 COR 3: Harm, B-R/);
    expect(content).toMatch(/nicardipine 5 mg\/h, titrate by 2\.5 mg\/h every 5–15 min, max 15 mg\/h; clevidipine 1–2 mg\/h, double every 2–5 min, max 21 mg\/h/);
  });
  it('makes 4F-PCC the factor Xa pathway and gives dose-proportional protamine', () => {
    const content = text(render({}));
    expect(content).toMatch(/Apixaban, rivaroxaban, edoxaban 4F-PCC 50 units\/kg/);
    expect(content).toMatch(/Andexanet was withdrawn from the US market in December 2025/);
    expect(content).toMatch(/INR 2–<4, 25 units\/kg \(max 2500\); 4–6, 35 units\/kg \(max 3500\); >6, 50 units\/kg \(max 5000\)/);
    expect(content).toMatch(/Protamine 1 mg per 100 units given in the prior 2–3 h, max 50 mg/);
    expect(content).toMatch(/Protamine 1 mg per 1 mg if ≤8 h \(max 50 mg\); 0\.5 mg per 1 mg if 8–12 h/);
    expect(content).toMatch(/Idarucizumab 5 g IV \(2 × 2\.5 g\)/);
  });
  it('uses the guideline cryoprecipitate dose and notes local protocol differences', () => {
    const content = text(render({}));
    expect(content).toMatch(/Cryoprecipitate 10 units \(≈2 pre-pooled units\) IV over 10–30 min; give more if fibrinogen <150 mg\/dL/);
    expect(content).toMatch(/Tranexamic acid 1000 mg IV over 10 min/);
    expect(content).toMatch(/local protocol may differ/i);
  });
  it('carries the verified decompression and supportive-care grades', () => {
    const content = text(render({}));
    expect(content).toMatch(/decompressive craniectomy with dural expansion COR 1, A/);
    expect(content).toMatch(/may be considered to reduce mortality COR 2b, B-R/);
    expect(content).toMatch(/infarct ≥35 mL: suboccipital decompressive craniectomy COR 1, B-NR/);
    expect(content).toMatch(/target 140–180 mg\/dL COR 2a, C-LD/);
    expect(content).toMatch(/No prophylactic antiseizure medication COR 3: No Benefit, C-LD/);
  });
  it('links every card to 1-3 sources and never recommends ranitidine', () => {
    const html = render({});
    const cards = html.split('<details').slice(1);
    for (const card of cards) {
      const links = card.match(/<a href="https:\/\//g) || [];
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links.length).toBeLessThanOrEqual(3);
    }
    expect(html).not.toMatch(/ranitidine/i);
  });
  it('wraps the dose table in a scroll region and avoids raw dark slate classes', () => {
    const html = render({ weightKg: 70 });
    expect(html).toMatch(/<div class="overflow-x-auto[^"]*" role="region" aria-label="Thrombolytic dose table" tabindex="0">/);
    expect(html).not.toMatch(/dark:bg-slate-|dark:text-slate-/);
  });
});
