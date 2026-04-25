// src/evidence/matcher-helpers.js
//
// Lightweight, framework-free helpers for trial-eligibility criterion
// evaluators. Extracted so the matcher's field bindings are unit-testable in
// isolation. The same helpers are mirrored inside src/app.jsx (as inline
// arrow functions) for the bundled-iife build path; this module is the
// canonical reference and the surface the regression tests exercise.

export const tryInt = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

export const pickEncounterField = (...values) => {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    return v;
  }
  return undefined;
};

export const trialGte = (v, threshold) => {
  const n = tryInt(v);
  return n === null ? null : n >= threshold;
};

export const trialLte = (v, threshold) => {
  const n = tryInt(v);
  return n === null ? null : n <= threshold;
};

export const ageOf = (data) => pickEncounterField(data?.telestrokeNote?.age, data?.strokeCodeForm?.age);
export const nihssOf = (data) => pickEncounterField(data?.telestrokeNote?.nihss, data?.strokeCodeForm?.nihss, data?.nihssScore);
export const premorbidOf = (data) => pickEncounterField(data?.telestrokeNote?.premorbidMRS);
