// Protocol-currency safety guards for the PUBLIC educational stroke site.
//
// These regression tests lock in the highest-risk clinical-wording invariants
// identified during the 2026 protocol-currency review (2026-07-03). They scan the
// public clinical-content source surfaces and fail if a future edit reintroduces a
// known-dangerous phrasing. Each guard targets a SPECIFIC error while allowing the
// legitimate, correctly-caveated wording that already ships.
//
// Run with `npm run test:unit` (vitest). Pure file scans — no build required.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

// Public clinical-content surfaces this guard protects.
const CONTENT_FILES = [
  'src/management-guidance.js',
  'src/institutional-protocols.js',
  'src/calculators-extended.js',
  'src/app.jsx',
  'app.js',
  'src/evidence/screener/minute.js',
  'src/evidence/screenerTrials.json',
  'src/evidence/eligibilityTables.js',
  'data/generic-protocols.json'
];
const MINUTE_FILES = [
  'src/app.jsx',
  'src/institutional-protocols.js',
  'src/evidence/screener/minute.js',
  'src/evidence/screenerTrials.json',
  'src/evidence/eligibilityTables.js',
  'data/generic-protocols.json',
  'app.js'
];
const texts = Object.fromEntries(CONTENT_FILES.map((f) => [f, read(f)]));
const linesOf = Object.fromEntries(CONTENT_FILES.map((f) => [f, texts[f].split('\n')]));

// Line-by-line scan (keeps `.` from spanning newlines; fast even on the app.jsx monolith).
function offendingLines(pattern, { allow, files = CONTENT_FILES } = {}) {
  const hits = [];
  for (const f of files) {
    linesOf[f].forEach((line, i) => {
      if (pattern.test(line) && !(allow && allow.test(line))) {
        hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 160)}`);
      }
    });
  }
  return hits;
}

describe('2026 protocol-currency safety guards (public educational site)', () => {
  it('never describes standard-window thrombolysis as given "after 4.5h"', () => {
    // Extended-window phrasing ("beyond 4.5 hours", "4.5-24h", "4.5-9h") is legitimate;
    // the banned regression is a standard-window lytic framed as given AFTER 4.5h
    // (the pocket-card page-12 error the review flagged).
    const hits = offendingLines(/\bafter\s+4\.?5\s*(h\b|hours?\b)/i);
    expect(hits, `Standard-window "after 4.5h" phrasing found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('never implies routine tenecteplase up to 24h, and keeps the guardrail', () => {
    // Positive: the extended-window card must keep the explicit "not simply TNK up to 24h" guardrail.
    expect(texts['src/management-guidance.js']).toMatch(/not simply\s+"?TNK up to 24\s*h/i);
    // Negative: no source may present routine/standard TNK across the whole 24h window.
    const hits = offendingLines(/\b(routine|routinely|standard|default)\b[^\n]{0,40}(tnk|tenecteplase)[^\n]{0,40}\b(up to |to |through )?24\s*h/i);
    expect(hits, `Routine-TNK-to-24h phrasing found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('never encodes a ">100 mL tissue-at-risk" DISTAL/M2 EVT eligibility threshold', () => {
    // The known error: porting the internal algorithm's "dominant proximal M2 perfusion
    // deficit >100 cc" (or a DISTAL ">100 mL tissue at risk") as an M2/MeVO EVT gate.
    // Large-core anterior EVT correctly uses core "<=70-100 mL" — that is NOT this pattern.
    const hits = [
      ...offendingLines(/\bM2\b[^\n]{0,80}>\s*100\s*(ml|cc)\b/i),
      ...offendingLines(/\bDISTAL\b[^\n]{0,80}>\s*100\s*(ml|cc)\b/i),
      ...offendingLines(/>\s*100\s*(ml|cc)\b[^\n]{0,40}tissue at risk/i)
    ];
    expect(hits, `Erroneous >100 mL M2/DISTAL eligibility threshold found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('preserves "avoid routine SBP <140 after successful EVT"', () => {
    expect(
      texts['src/management-guidance.js'],
      'management-guidance.js lost the post-EVT SBP<140 guardrail'
    ).toMatch(/(do not target|avoid)\s+SBP\s*<\s*140/i);
    expect(
      texts['src/institutional-protocols.js'],
      'institutional-protocols.js lost the post-EVT SBP<140 guardrail'
    ).toMatch(/below 140 mm Hg after successful endovascular therapy|SBP floor of 140/i);
  });

  it('never recommends ranitidine (only a withdrawn-from-market caveat is allowed)', () => {
    // Ranitidine was withdrawn (FDA, 2020, NDMA). It may appear ONLY inside a negative/
    // withdrawal caveat, never as a recommended H2 blocker for angioedema.
    const allow = /withdrawn|ndma|no longer|removed|do not use|not (be )?(used|available|recommended)/i;
    const hits = offendingLines(/\branitidine\b/i, { allow });
    expect(hits, `Ranitidine used outside a withdrawn-drug caveat:\n${hits.join('\n')}`).toEqual([]);
  });

  it('locks in the 2026 non-traumatic IPH direct-consult workflow', () => {
    expect(texts['src/institutional-protocols.js']).toMatch(/Non-traumatic IPH >=15 mL by ABC\/2/);
    expect(texts['src/app.jsx']).toMatch(/non-traumatic IPH >=15 mL by ABC\/2/);
    expect(texts['src/app.jsx']).toMatch(/ED clinicians or the stroke service may call Neurosurgery directly/);
    expect(texts['src/institutional-protocols.js']).toMatch(/designated on-call stroke attending/);
    expect(texts['src/app.jsx']).toMatch(/designated on-call stroke attending/);
    expect(texts['src/institutional-protocols.js']).toMatch(/attending-of-record notification is not default/i);
    expect(texts['src/app.jsx']).toMatch(/attending-of-record notification is not default/i);
    expect(texts['src/institutional-protocols.js']).toMatch(/IVH, hydrocephalus/);
    expect(texts['src/app.jsx']).toMatch(/IVH\/hydrocephalus/);
    expect(texts['data/generic-protocols.json']).toMatch(/multicompartmental hemorrhage/);
    expect(texts['data/generic-protocols.json']).toMatch(/ED attending discretion/);
    expect(texts['src/institutional-protocols.js']).toMatch(/pupillometry/i);
    expect(texts['data/generic-protocols.json']).toMatch(/pupillometry/i);

    const obsoleteHits = [
      ...offendingLines(/Neurology\/stroke attending should approve neurosurgery consultations/i),
      ...offendingLines(/discusses with stroke attending before consulting neurosurgery/i),
      ...offendingLines(/prior approval is required/i)
    ];
    expect(obsoleteHits, `Obsolete neurosurgery approval-gate wording found:\n${obsoleteHits.join('\n')}`).toEqual([]);
  });

  it('keeps ENRICH/MIE criteria aligned to GCS 5-14', () => {
    expect(texts['src/app.jsx']).toMatch(/June 2026 MIE Screen \(ENRICH-Based\)/);
    expect(texts['src/app.jsx']).toMatch(/GCS 5-14/);
    expect(texts['src/institutional-protocols.js']).toMatch(/GCS 5-14/);
    expect(texts['data/generic-protocols.json']).toMatch(/GCS 5-14/);

    const hits = [
      ...offendingLines(/ENRICH[^\n]{0,160}GCS 5-15/i),
      ...offendingLines(/GCS 5-15[^\n]{0,160}ENRICH/i),
      ...offendingLines(/MIE[^\n]{0,160}GCS 5-15/i),
      ...offendingLines(/MIE[^\n]{0,240}GCS 5-12/i),
      ...offendingLines(/GCS 5-12[^\n]{0,240}MIE/i),
      ...offendingLines(/Surgical Selection[^\n]{0,400}GCS 5-12/i),
      ...offendingLines(/Pre-morbid mRS 0-1/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/Premorbid mRS 0-1[^\n]{0,240}(MIE|ENRICH)/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/(MIE|ENRICH)[^\n]{0,240}Premorbid mRS 0-1/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/(≤|<=)24 hours of symptom onset/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/24-72h after onset/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/mRS 0-1[^\n]{0,160}ENRICH/i),
      ...offendingLines(/ENRICH[^\n]{0,160}mRS 0-1/i),
      ...offendingLines(/ENRICH[^\n]{0,240}(≤|<=)\s*24\s*(h|hours?)/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/ENRICH[^\n]{0,240}20-50\s*mL/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/20-50\s*mL[^\n]{0,240}ENRICH/i, { files: ['src/app.jsx', 'app.js'] })
    ];
    expect(hits, `Obsolete ENRICH/MIE criterion found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('keeps ICH BP class wording and June 2026 MIE framing precise', () => {
    for (const f of ['src/app.jsx', 'app.js']) {
      expect(texts[f]).toMatch(/smooth, sustained BP control and timely treatment are Class IIa/i);
      expect(texts[f]).toMatch(/target 140 \(range 130-150\) is Class IIb/i);
      expect(texts[f]).toMatch(/older\/general guideline framing kept broad functional-outcome benefit uncertain/i);
      expect(texts[f]).toMatch(/ENRICH supports selected lobar 30-80 mL patients/i);
      expect(texts[f]).not.toMatch(/Class I, LOE A for SBP reduction to 140/i);
      expect(texts[f]).not.toMatch(/Functional outcome benefit remains uncertain\./i);
      expect(texts[f]).not.toMatch(/Target SBP <140 mmHg within 2h of onset \(Class IIa/i);
      expect(texts[f]).not.toMatch(/BP management initiated \(target SBP <140 \(Class IIa/i);
    }
  });

  it('does not reintroduce the older MINUTE spot-sign/glibenclamide description', () => {
    expect(texts['src/app.jsx']).toMatch(/Basal-ganglia IPH &(gt;|ge;)15 mL, NIHSS &(gt;|ge;)6, &(lt;|le;)15h screen/);
    expect(texts['src/app.jsx']).toMatch(/Spontaneous non-traumatic supratentorial non-thalamic basal-ganglia IPH/);
    expect(texts['src/app.jsx']).not.toMatch(/glibenclamide/i);
    expect(texts['src/app.jsx']).not.toMatch(/Persistent systolic blood pressure >140 mmHg/);
  });

  it('keeps MINUTE screener criteria aligned to the June 2026 algorithm screen', () => {
    expect(texts['src/evidence/screener/minute.js']).toMatch(/>=15 mL \(or close by ABC\/2\)/);
    expect(texts['src/evidence/screener/minute.js']).toMatch(/<=15 hours from last known well/);
    expect(texts['src/evidence/screenerTrials.json']).toMatch(/Volume >=15 mL by ABC\/2/);
    expect(texts['src/evidence/eligibilityTables.js']).toMatch(/Arrival\/evaluation <=15 hours since LKW/);

    const staleHits = [
      ...offendingLines(/MINUTE[^\n]{0,260}(≥|>=)\s*20\s*mL/i, { files: MINUTE_FILES }),
      ...offendingLines(/(≥|>=)\s*20\s*mL[^\n]{0,260}MINUTE/i, { files: MINUTE_FILES }),
      ...offendingLines(/\b20mL\b/i, { files: MINUTE_FILES }),
      ...offendingLines(/MINUTE[^\n]{0,260}(≤|<=)\s*16\s*(h|hours?)/i, { files: MINUTE_FILES }),
      ...offendingLines(/(≤|<=)\s*16\s*(h|hours?)[^\n]{0,260}MINUTE/i, { files: MINUTE_FILES }),
      ...offendingLines(/Pre-ICH mRS/i, { files: MINUTE_FILES }),
      ...offendingLines(/GCS\s*<\s*7/i, { files: MINUTE_FILES })
    ];
    expect(staleHits, `Stale MINUTE criterion found:\n${staleHits.join('\n')}`).toEqual([]);
  });

  it('does not publish stale MIRROR registry mRS/GCS thresholds as settled criteria', () => {
    expect(texts['src/app.jsx']).toMatch(/Premorbid mRS threshold must be verified against the active registry protocol/);
    expect(texts['src/app.jsx']).toMatch(/GCS range must be verified against the active registry protocol/);
    expect(texts['src/app.jsx']).not.toMatch(/Baseline mRS ≤2/);
    expect(texts['src/app.jsx']).not.toMatch(/GCS ≥5/);
    expect(texts['src/institutional-protocols.js']).not.toMatch(/Premorbid mRS 0-1/);
    expect(texts['data/generic-protocols.json']).not.toMatch(/Premorbid mRS 0-1/);
    expect(texts['app.js']).not.toMatch(/Premorbid mRS 0-1/);
    expect(texts['src/institutional-protocols.js']).not.toMatch(/Baseline GCS:?\s*5-15/);
    expect(texts['data/generic-protocols.json']).not.toMatch(/Baseline GCS:?\s*5-15/);
    expect(texts['app.js']).not.toMatch(/Baseline GCS:?\s*5-15/);
    expect(texts['src/app.jsx']).not.toMatch(/ICH volume >20mL/);
    expect(texts['app.js']).not.toMatch(/ICH volume >20mL/);
    expect(texts['app.js']).not.toMatch(/Baseline mRS ≤2/);
    expect(texts['app.js']).not.toMatch(/GCS ≥5/);
    expect(texts['src/app.jsx']).toMatch(/Volume threshold is version-sensitive and must be checked against the active registry protocol/);
    expect(texts['app.js']).toMatch(/Volume threshold is version-sensitive and must be checked against the active registry protocol/);
  });

  it('does not publish local service-line labels on public surfaces', () => {
    const localServiceLine = new RegExp('\\b' + ['stroke', 'phone'].join('\\s+') + '\\b', 'i');
    const hits = offendingLines(localServiceLine, { files: CONTENT_FILES });
    expect(hits, `Local service-line label found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('keeps MINUTE priority over MIRROR in the reusable ICH algorithm export', () => {
    expect(texts['src/institutional-protocols.js']).toMatch(/MINUTE has operational priority over MIRROR/);
    expect(texts['data/generic-protocols.json']).toMatch(/MINUTE has operational priority over MIRROR/);
    expect(texts['src/institutional-protocols.js']).toMatch(/thresholds are version-sensitive and must be checked against the active registry protocol/);
    expect(texts['data/generic-protocols.json']).toMatch(/thresholds are version-sensitive and must be checked against the active registry protocol/);
  });

  it('keeps the reviewed content files free of institutional / PHI identifiers', () => {
    // Focused belt-and-suspenders guard on the two content files updated this pass
    // (the repo-wide leak guard covers the built bundle + all tracked files).
    const GUARDED = ['src/management-guidance.js', 'src/institutional-protocols.js'];
    const banned = [
      /harborview/i, /\bHMC\b/, /\bUWMC\b/, /\bUWML\b/, /\bUWNW\b/,
      /UW Medicine/i, /UW Medical Center/i, /montlake/i, /Seattle Children/i,
      /VA Puget Sound/i, /\bOCCAM\b/, /tactuum/i, /\bSmartSet\b/i, /dotphrase/i,
      /sharepoint/i, /zoom\.us/i, /teams\.microsoft/i,
      /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/ // US phone number
    ];
    for (const f of GUARDED) {
      for (const re of banned) {
        expect(re.test(texts[f]), `${f} contains banned identifier ${re}`).toBe(false);
      }
    }
  });
});
