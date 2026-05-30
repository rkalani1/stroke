import { describe, it, expect } from 'vitest';
import { classifyAphasia, APHASIA_MAP } from '../src/simulators/NeuroExamsTool.jsx';

describe('Neuro-Exams — Aphasia Classifier (8-way lookup)', () => {
  it('returns Global Aphasia for nonfluent + impaired + impaired', () => {
    const r = classifyAphasia('nonfluent', 'impaired', 'impaired');
    expect(r.name).toBe('Global Aphasia');
    expect(r.localization).toMatch(/MCA/i);
  });

  it("returns Broca's Aphasia for nonfluent + preserved + impaired", () => {
    const r = classifyAphasia('nonfluent', 'preserved', 'impaired');
    expect(r.name).toBe("Broca's Aphasia");
    expect(r.localization).toMatch(/inferior frontal/i);
  });

  it('returns Transcortical Motor Aphasia for nonfluent + preserved + preserved', () => {
    const r = classifyAphasia('nonfluent', 'preserved', 'preserved');
    expect(r.name).toBe('Transcortical Motor Aphasia');
    expect(r.localization).toMatch(/prefrontal|supplementary/i);
  });

  it('returns Transcortical Mixed Aphasia for nonfluent + impaired + preserved', () => {
    const r = classifyAphasia('nonfluent', 'impaired', 'preserved');
    expect(r.name).toBe('Transcortical Mixed Aphasia');
    expect(r.localization).toMatch(/watershed/i);
  });

  it("returns Wernicke's Aphasia for fluent + impaired + impaired", () => {
    const r = classifyAphasia('fluent', 'impaired', 'impaired');
    expect(r.name).toBe("Wernicke's Aphasia");
    expect(r.localization).toMatch(/superior temporal/i);
  });

  it('returns Conduction Aphasia for fluent + preserved + impaired', () => {
    const r = classifyAphasia('fluent', 'preserved', 'impaired');
    expect(r.name).toBe('Conduction Aphasia');
    expect(r.localization).toMatch(/arcuate|supramarginal/i);
  });

  it('returns Transcortical Sensory Aphasia for fluent + impaired + preserved', () => {
    const r = classifyAphasia('fluent', 'impaired', 'preserved');
    expect(r.name).toBe('Transcortical Sensory Aphasia');
    expect(r.localization).toMatch(/temporal-parietal-occipital/i);
  });

  it('returns Anomic Aphasia for fluent + preserved + preserved', () => {
    const r = classifyAphasia('fluent', 'preserved', 'preserved');
    expect(r.name).toBe('Anomic Aphasia');
    expect(r.localization).toMatch(/temporal-parietal|angular/i);
  });

  it('returns the atypical/subcortical fallback for an unknown combination', () => {
    const r = classifyAphasia('unknown', 'unknown', 'unknown');
    expect(r.name).toMatch(/atypical|subcortical/i);
  });

  it('covers all 8 cells of the lookup table (no missing entries)', () => {
    expect(Object.keys(APHASIA_MAP)).toHaveLength(8);
  });

  it('every APHASIA_MAP entry has name, localization, and desc fields', () => {
    for (const [key, entry] of Object.entries(APHASIA_MAP)) {
      expect(entry.name, `${key} missing name`).toBeTruthy();
      expect(entry.localization, `${key} missing localization`).toBeTruthy();
      expect(entry.desc, `${key} missing desc`).toBeTruthy();
    }
  });
});
