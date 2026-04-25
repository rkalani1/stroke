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

// ----- tri-state criterion helpers -----
//
// Each returns one of true / false / null. Null = "unknown" — the source
// data isn't entered yet. Using these consistently is what guarantees
// parity between the engine and the legacy evaluator.

// Boolean equality. Returns null when the value is undefined or null,
// so an unentered tnkRecommended / evtRecommended decision shows as
// missing rather than as a not-met criterion.
export const boolEq = (v, expected) => {
  if (v === undefined || v === null) return null;
  return v === expected;
};

// Numeric range with inclusive bounds. Returns null when source is
// unparseable.
export const numInRange = (v, lo, hi) => {
  const n = tryInt(v);
  if (n === null) return null;
  return n >= lo && n <= hi;
};

// Numeric strict-less-than with null on missing.
export const numLt = (v, threshold) => {
  const n = tryInt(v);
  if (n === null) return null;
  return n < threshold;
};

// Hours-from-LKW range. The source field is `data.hoursFromLKW` (a
// number or null when LKW hasn't been entered).
export const hoursInRange = (hours, lo, hi) => {
  if (hours === null || hours === undefined) return null;
  if (typeof hours !== 'number' || Number.isNaN(hours)) return null;
  return hours >= lo && hours <= hi;
};
export const hoursLte = (hours, threshold) => {
  if (hours === null || hours === undefined) return null;
  if (typeof hours !== 'number' || Number.isNaN(hours)) return null;
  return hours <= threshold;
};
export const hoursLt = (hours, threshold) => {
  if (hours === null || hours === undefined) return null;
  if (typeof hours !== 'number' || Number.isNaN(hours)) return null;
  return hours < threshold;
};

// String-contains-any with case-insensitive match. Returns null when
// the source string is empty / undefined; false when present but
// doesn't match any needle; true when at least one needle matches.
export const stringContainsAny = (s, needles) => {
  if (s === undefined || s === null) return null;
  if (typeof s !== 'string') return null;
  if (s.trim() === '') return null;
  if (!Array.isArray(needles) || needles.length === 0) return null;
  const hay = s.toLowerCase();
  return needles.some((n) => hay.includes(String(n).toLowerCase()));
};

// Array-contains-any: at least one resolved value is in `needles`.
// Returns null when the resolved array is empty (data not entered).
export const arrayContainsAny = (arr, needles) => {
  if (!Array.isArray(arr)) return null;
  if (arr.length === 0) return null;
  if (!Array.isArray(needles) || needles.length === 0) return null;
  return arr.some((v) => needles.includes(v));
};
