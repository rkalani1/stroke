import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const appSource = readFileSync(join(repoRoot, 'src/app.jsx'), 'utf8');

/* The Guideline Library search was non-functional through v6.22.0.
 *
 * fuzzyScore is a RANKING function: it awards a point for each query character
 * found in order anywhere in the target. On ordinary prose that returns > 0 for
 * almost any query, so a `score > 0` filter predicate admitted every one of the
 * 862 recommendations — typing in the search box expanded all 397 accordions and
 * rendered the entire catalog while the header still read "862 recommendations".
 *
 * These tests lock the two halves of the fix: fuzzyScore keeps its ranking
 * behavior (the command palette depends on it), and matching is a separate,
 * strict predicate. */

// Mirrors src/app.jsx fuzzyScore — the ranking function, unchanged by the fix.
const fuzzyScore = (query, target) => {
  if (!query || !target) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q) return 100;
  let score = 0;
  if (t.startsWith(q)) score += 40;
  if (t.includes(q)) score += 25;
  let ti = 0;
  for (let qi = 0; qi < q.length; qi += 1) {
    const idx = t.indexOf(q[qi], ti);
    if (idx === -1) continue;
    score += idx === ti ? 4 : 1;
    ti = idx + 1;
  }
  return score;
};

// Mirrors src/app.jsx matchesTextQuery — the match predicate added by the fix.
const matchesTextQuery = (query, parts = []) => {
  const tokens = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const haystack = parts.filter(Boolean).join(' ').toLowerCase();
  return tokens.every((token) => haystack.includes(token));
};

const IRRELEVANT_RECS = [
  'Public educational programs on stroke recognition across all age groups and the importance of calling 9-1-1 are recommended.',
  'Intermittent pneumatic compression is recommended for venous thromboembolism prophylaxis in immobile patients.',
  'Patients should be screened for depression using a validated instrument before discharge.',
  'Early mobilization out of bed within 24 hours is reasonable for most patients.',
];

const TNK_REC = 'In adult AIS patients presenting within 4.5 hours of symptom onset or last known well who are eligible for IVT, tenecteplase 0.25 mg/kg (max 25 mg) or alteplase 0.9 mg/kg is recommended to improve functional outcomes.';

describe('Guideline Library search', () => {
  describe('the bug: fuzzyScore is not a match predicate', () => {
    it('scores plainly irrelevant recommendations above zero', () => {
      for (const rec of IRRELEVANT_RECS) {
        expect(fuzzyScore('tenecteplase', rec)).toBeGreaterThan(0);
      }
    });

    it('would therefore have admitted every recommendation under a score > 0 filter', () => {
      const admitted = IRRELEVANT_RECS.filter((rec) => fuzzyScore('tenecteplase', rec) > 0);
      expect(admitted).toHaveLength(IRRELEVANT_RECS.length);
    });
  });

  describe('the fix: matchesTextQuery', () => {
    it('rejects recommendations that do not contain the query', () => {
      for (const rec of IRRELEVANT_RECS) {
        expect(matchesTextQuery('tenecteplase', [rec])).toBe(false);
      }
    });

    it('accepts a recommendation that contains the query', () => {
      expect(matchesTextQuery('tenecteplase', [TNK_REC])).toBe(true);
    });

    it('requires every token of a multi-word query', () => {
      expect(matchesTextQuery('blood pressure', ['Blood pressure should be lowered below 140 mmHg.'])).toBe(true);
      expect(matchesTextQuery('blood pressure', ['Blood glucose should be kept in range.'])).toBe(false);
    });

    it('matches tokens across the separate searched fields', () => {
      // text, section, guideline title, short title are joined before matching
      expect(matchesTextQuery('tenecteplase 2026', [TNK_REC, 'Choice of Thrombolytic Agent', 'AHA/ASA Early Management of Acute Ischemic Stroke 2026', 'AIS 2026'])).toBe(true);
    });

    it('is case-insensitive and ignores surrounding whitespace', () => {
      expect(matchesTextQuery('  TENECTEPLASE  ', [TNK_REC])).toBe(true);
    });

    it('admits everything for an empty query', () => {
      for (const rec of [...IRRELEVANT_RECS, TNK_REC]) {
        expect(matchesTextQuery('', [rec])).toBe(true);
        expect(matchesTextQuery('   ', [rec])).toBe(true);
      }
    });
  });

  describe('wiring in src/app.jsx', () => {
    it('defines matchesTextQuery', () => {
      expect(appSource).toContain('const matchesTextQuery = (query, parts = []) => {');
    });

    it('filters the library with the match predicate, not the score', () => {
      expect(appSource).toContain('if (query && !matchesTextQuery(query, recSearchFields(rec, guideline))) return false;');
      expect(appSource).not.toContain('if (query && rec._score <= 0) return false;');
    });

    it('still ranks matches with rankText', () => {
      expect(appSource).toContain('return rankText(query, recSearchFields(rec, guideline));');
    });
  });

  describe('LazyDetails accordion mounting', () => {
    it('gates the accordion body behind a render function', () => {
      expect(appSource).toContain('const LazyDetails = ({ forceOpen = false, summary, className, summaryClassName, children }) => {');
      // A node would still be constructed on every render; only calling a
      // function on open avoids building the subtree at all.
      expect(appSource).toContain('{mounted ? children() : null}');
    });

    it('mounts immediately when a filter forces the accordion open', () => {
      expect(appSource).toContain('if (forceOpen) setMounted(true);');
    });

    it('mounts on manual expansion', () => {
      expect(appSource).toContain('if (event.currentTarget.open) setMounted(true);');
    });

    it('uses LazyDetails for both Guideline Library accordion levels', () => {
      const opens = appSource.match(/<LazyDetails\b/g) || [];
      expect(opens.length).toBeGreaterThanOrEqual(2);
      const closes = appSource.match(/<\/LazyDetails>/g) || [];
      expect(closes.length).toBe(opens.length);
    });
  });
});
