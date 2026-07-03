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
  'data/generic-protocols.json'
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

    const obsoleteHits = [
      ...offendingLines(/Neurology\/stroke attending should approve neurosurgery consultations/i),
      ...offendingLines(/discusses with stroke attending before consulting neurosurgery/i),
      ...offendingLines(/prior approval is required/i)
    ];
    expect(obsoleteHits, `Obsolete neurosurgery approval-gate wording found:\n${obsoleteHits.join('\n')}`).toEqual([]);
  });

  it('keeps ENRICH/MIE criteria aligned to GCS 5-14', () => {
    expect(texts['src/app.jsx']).toMatch(/ENRICH MIE Inclusion/);
    expect(texts['src/app.jsx']).toMatch(/GCS 5-14/);

    const hits = [
      ...offendingLines(/ENRICH[^\n]{0,160}GCS 5-15/i),
      ...offendingLines(/GCS 5-15[^\n]{0,160}ENRICH/i),
      ...offendingLines(/MIE[^\n]{0,160}GCS 5-15/i),
      ...offendingLines(/mRS 0-1[^\n]{0,160}ENRICH/i),
      ...offendingLines(/ENRICH[^\n]{0,160}mRS 0-1/i)
    ];
    expect(hits, `Obsolete ENRICH/MIE criterion found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('does not reintroduce the older MINUTE spot-sign/glibenclamide description', () => {
    expect(texts['src/app.jsx']).toMatch(/Basal-ganglia IPH &(gt;|ge;)15 mL, NIHSS &(gt;|ge;)6, &(lt;|le;)15h screen/);
    expect(texts['src/app.jsx']).toMatch(/Spontaneous non-traumatic supratentorial non-thalamic basal-ganglia IPH/);
    expect(texts['src/app.jsx']).not.toMatch(/glibenclamide/i);
    expect(texts['src/app.jsx']).not.toMatch(/Persistent systolic blood pressure >140 mmHg/);
  });

  it('does not publish stale MIRROR registry mRS/GCS thresholds as settled criteria', () => {
    expect(texts['src/app.jsx']).toMatch(/Premorbid mRS threshold must be verified against the active registry protocol/);
    expect(texts['src/app.jsx']).toMatch(/GCS range must be verified against the active registry protocol/);
    expect(texts['src/app.jsx']).not.toMatch(/Baseline mRS ≤2/);
    expect(texts['src/app.jsx']).not.toMatch(/GCS ≥5/);
  });

  it('does not publish local Stroke Phone labels on public surfaces', () => {
    const hits = offendingLines(/\bstroke\s+phone\b/i, { files: CONTENT_FILES });
    expect(hits, `Local Stroke Phone label found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('keeps MINUTE priority over MIRROR in the reusable ICH algorithm export', () => {
    expect(texts['src/institutional-protocols.js']).toMatch(/MINUTE has operational priority over MIRROR/);
    expect(texts['data/generic-protocols.json']).toMatch(/MINUTE has operational priority over MIRROR/);
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
