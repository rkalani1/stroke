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
import { recommendations as sourceEvidenceRecommendations } from '../src/evidence/recommendations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));

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
  'src/evidence/recommendations.js',
  'src/guidelines/ich-2022.json',
  'data/atlas/recommendations.json',
  'data/generic-protocols.json',
  'data/guidelines/ich-2022.json'
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
const sourceRecommendationById = new Map(sourceEvidenceRecommendations.map((r) => [r.id, r]));
const generatedRecommendationById = new Map(readJson('data/atlas/recommendations.json').data.map((r) => [r.id, r]));
const sentinel = (...parts) => parts.join('_');

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

function appRecommendationMeta(text, id) {
  const start = text.indexOf(id);
  expect(start, `${id} missing from app recommendation metadata`).toBeGreaterThanOrEqual(0);
  const chunk = text.slice(start, start + 2500);
  return {
    classOfRec: chunk.match(/classOfRec\s*:\s*["']([^"']+)["']/)?.[1],
    levelOfEvidence: chunk.match(/levelOfEvidence\s*:\s*["']([^"']+)["']/)?.[1]
  };
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
    expect(texts['app.js']).toMatch(/ED clinicians or the stroke service may call Neurosurgery directly/);
    expect(texts['src/app.jsx']).toMatch(/prior approval is not required/i);
    expect(texts['app.js']).toMatch(/prior approval is not required/i);
    expect(texts['src/institutional-protocols.js']).toMatch(/designated on-call stroke attending/);
    expect(texts['src/app.jsx']).toMatch(/designated on-call stroke attending/);
    expect(texts['app.js']).toMatch(/designated on-call stroke attending/);
    expect(texts['src/institutional-protocols.js']).toMatch(/attending-of-record notification is not default/i);
    expect(texts['src/app.jsx']).toMatch(/attending-of-record notification is not default/i);
    expect(texts['app.js']).toMatch(/attending-of-record notification is not default/i);
    expect(texts['src/institutional-protocols.js']).toMatch(/IVH, hydrocephalus/);
    expect(texts['src/institutional-protocols.js']).toMatch(/Neurosurgery\/neurointerventional pathway leads admission/);
    for (const f of ['src/app.jsx', 'app.js']) {
      expect(texts[f]).toMatch(/IVH\/hydrocephalus/);
      expect(texts[f]).toMatch(/cerebellar hemorrhage/);
      expect(texts[f]).toMatch(/mass effect/);
      expect(texts[f]).toMatch(/vascular lesion concern/);
      expect(texts[f]).toMatch(/neurologic decline/);
      expect(texts[f]).toMatch(/early Neurosurgery \+ stroke-service evaluation(?: threshold| triggers)?:[\s\S]{0,360}pupillometry trend\/asymmetry/i);
      expect(texts[f]).toMatch(/multicompartmental hemorrhage/);
      expect(texts[f]).toMatch(/ED attending discretion/);
      expect(texts[f]).toMatch(/clinician concern/);
      expect(texts[f]).toMatch(/Screen for early Neurosurgery \+ stroke-service evaluation triggers:[\s\S]{0,360}clinician concern/i);
      expect(texts[f]).toMatch(/volume (?:≥|\\u2265|>=)\s*15 mL for early Neurosurgery \+ stroke-service evaluation/i);
      expect(texts[f]).toMatch(/confirmed non-traumatic IPH[\s\S]{0,120}(?:≥|\\u2265|>=)\s*15 mL[\s\S]{0,120}early Neurosurgery \+ stroke-service evaluation threshold/i);
      expect(texts[f]).not.toMatch(/ICH volume (?:≥|\\u2265|>=)\s*15 mL by ABC\/2 meets the June 2026 early dual-consult threshold/i);
    }
    expect(texts['data/generic-protocols.json']).toMatch(/multicompartmental hemorrhage/);
    expect(texts['data/generic-protocols.json']).toMatch(/ED attending discretion/);
    expect(texts['data/generic-protocols.json']).toMatch(/Consult earlier at any size[\s\S]{0,260}pupillometry trend\/asymmetry[\s\S]{0,260}clinician concern/i);
    expect(texts['src/institutional-protocols.js']).toMatch(/Consult earlier at any size[\s\S]{0,260}pupillometry trend\/asymmetry[\s\S]{0,260}clinician concern/i);
    expect(texts['src/app.jsx']).toMatch(/Screen for MIE only when spontaneous lobar IPH 30-80cc, NIHSS >5, GCS 5-14, age 18-80, and no underlying vascular lesion are confirmed/i);
    expect(texts['src/app.jsx']).toMatch(/Do not infer suboccipital decompression from cerebellar location or volume alone/i);
    expect(texts['src/institutional-protocols.js']).toMatch(/pupillometry/i);
    expect(texts['data/generic-protocols.json']).toMatch(/pupillometry/i);
    expect(texts['src/institutional-protocols.js']).toMatch(/Life-threatening mass effect/);
    expect(texts['data/generic-protocols.json']).toMatch(/Life-threatening mass effect/);
    expect(texts['src/institutional-protocols.js']).not.toMatch(/Life-threatening or significant mass effect/);
    expect(texts['data/generic-protocols.json']).not.toMatch(/Life-threatening or significant mass effect/);
    expect(texts['src/app.jsx']).toMatch(/Cerebellar ICH with mass effect/);
    expect(texts['src/app.jsx']).toMatch(/obstructive hydrocephalus and\/or brainstem compression commonly increase urgency/i);
    expect(texts['src/app.jsx']).toMatch(/posterior-fossa mass effect/);
    expect(texts['app.js']).toMatch(/Cerebellar ICH with mass effect/);
    expect(texts['app.js']).toMatch(/obstructive hydrocephalus and\/or brainstem compression commonly increase urgency/i);
    expect(texts['app.js']).toMatch(/posterior-fossa mass effect/);
    expect(texts['src/guidelines/ich-2022.json']).toMatch(/does not use cerebellar volume alone as an operative trigger/i);
    expect(texts['data/guidelines/ich-2022.json']).toMatch(/does not use cerebellar volume alone as an operative trigger/i);

    const obsoleteHits = [
      ...offendingLines(/Neurology\/stroke attending should approve neurosurgery consultations/i),
      ...offendingLines(/discusses with stroke attending before consulting neurosurgery/i),
      ...offendingLines(/prior approval is required/i),
      ...offendingLines(/dual-consult/i, { files: ['src/app.jsx', 'app.js', 'src/institutional-protocols.js', 'data/generic-protocols.json'] }),
      ...offendingLines(/IVH\/hydrocephalus, mass effect, vascular lesion concern, or clinician concern/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/(?:^|['"`>])Meets (?:≥|\\u2265|>=)\s*15 mL early Neurosurgery \+ stroke-service evaluation threshold/, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/Cerebellar ICH (?:>|>=|&gt;=?|\\u003e=?)\s*15/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/cerebellar\s*>15mL/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/cerebellarGt15mL/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/Cerebellar ICH with mass effect<\/strong>\s+and obstructive hydrocephalus/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/immediate evacuation \+\/- EVD/i, { files: ['src/app.jsx', 'app.js'] }),
      ...offendingLines(/cerebellar ICH volume\s*>=\s*15 mL/i, { files: ['src/guidelines/ich-2022.json', 'data/guidelines/ich-2022.json', 'app.js'] })
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
    const recClassPattern = (id, cls) => new RegExp(`${id}[\\s\\S]{0,1400}classOfRec\\s*:\\s*["']${cls}["']`);
    for (const f of ['src/app.jsx', 'app.js']) {
      expect(texts[f]).toMatch(/smooth, sustained BP control and timely treatment are Class IIa/i);
      expect(texts[f]).toMatch(/target 140 \(range 130-150\) is Class IIb/i);
      expect(texts[f]).toMatch(/Smooth, sustained BP control and timely treatment/i);
      expect(texts[f]).toMatch(/target SBP 140\/range 130-150 when appropriate/i);
      expect(texts[f]).toMatch(recClassPattern('bp_ich_acute', 'IIa'));
      expect(texts[f]).toMatch(recClassPattern('bp_ich_target_range', 'IIb'));
      expect(texts[f]).toMatch(recClassPattern('bp_ich_avoid_low', 'III-harm'));
      expect(texts[f]).toMatch(/older\/general guideline framing kept broad functional-outcome benefit uncertain/i);
      expect(texts[f]).toMatch(/ENRICH supports selected lobar 30-80 mL patients/i);
      expect(texts[f]).not.toMatch(/Class I, LOE A for SBP reduction to 140/i);
      expect(texts[f]).not.toMatch(/Functional outcome benefit remains uncertain\./i);
      expect(texts[f]).not.toMatch(/Target SBP <140 mmHg within 2h of onset \(Class IIa/i);
      expect(texts[f]).not.toMatch(/BP management initiated \(target SBP <140 \(Class IIa/i);
      expect(texts[f]).not.toMatch(/Rapid BP reduction to SBP ~140 within 1 hour/i);
      expect(texts[f]).not.toMatch(/rapid[^.\n]{0,80}BP reduction/i);
    }
    for (const f of ['src/evidence/recommendations.js', 'data/atlas/recommendations.json']) {
      expect(texts[f]).toMatch(/Smooth, sustained BP control and timely treatment are Class IIa/i);
      expect(texts[f]).toMatch(/SBP 140\/range 130-150 target is Class IIb/i);
      expect(texts[f]).toMatch(/Avoid acute SBP <130 mmHg/i);
      expect(texts[f]).not.toMatch(/reasonable to improve functional outcome/i);
      expect(texts[f]).not.toMatch(/lowering systolic BP to a target of 140 mmHg[^.\n]*reasonable/i);
    }
    for (const byId of [sourceRecommendationById, generatedRecommendationById]) {
      expect(byId.get('rec-ich-bp-smooth-control')?.classOfRecommendation).toBe('IIa');
      expect(byId.get('rec-ich-bp-target')?.classOfRecommendation).toBe('IIb');
      expect(byId.get('rec-ich-bp-avoid-low')?.classOfRecommendation).toBe('III-harm');
    }
    const appToAtlasIds = {
      bp_ich_acute: 'rec-ich-bp-smooth-control',
      bp_ich_target_range: 'rec-ich-bp-target',
      bp_ich_avoid_low: 'rec-ich-bp-avoid-low'
    };
    for (const [appId, atlasId] of Object.entries(appToAtlasIds)) {
      const atlasRec = generatedRecommendationById.get(atlasId);
      for (const f of ['src/app.jsx', 'app.js']) {
        const appMeta = appRecommendationMeta(texts[f], appId);
        expect(appMeta.classOfRec).toBe(atlasRec.classOfRecommendation);
        expect(appMeta.levelOfEvidence).toBe(atlasRec.levelOfEvidence);
      }
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

  it('does not publish private service-line sentinels on public surfaces', () => {
    const privateServiceLine = new RegExp(`\\b${sentinel('PRIVATE', 'SERVICE', 'LINE', 'SENTINEL')}\\b`, 'i');
    const hits = offendingLines(privateServiceLine, { files: CONTENT_FILES });
    expect(hits, `Private service-line sentinel found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('keeps the visible service-worker update banner on the claim-and-reload path', () => {
    expect(texts['src/app.jsx']).toMatch(/postMessage\(\{ type: 'CLAIM_AND_RELOAD' \}\)/);
    expect(texts['src/app.jsx']).toMatch(/setPendingUpdateAction\(\(\) => \(\) =>/);
    expect(texts['src/app.jsx']).toMatch(/setUpdateAvailable\(true\)/);
    expect(texts['src/app.jsx']).toMatch(/sw\.acceptUpdate\(\)\.catch\(\(\) => window\.location\.reload\(\)\)/);
    expect(texts['src/app.jsx']).toMatch(/pendingUpdateAction\(\)/);
    const staleUpdateHits = offendingLines(/postMessage\(\{ type: 'SKIP_WAITING' \}\)/, { files: ['src/app.jsx', 'app.js'] });
    expect(staleUpdateHits, `Visible update banner still posts stale service-worker message:\n${staleUpdateHits.join('\n')}`).toEqual([]);
    const serviceWorker = read('service-worker.js');
    expect(serviceWorker).toMatch(/includeUncontrolled:\s*true/);
    expect(serviceWorker).toMatch(/clients\.claim\(\)/);
    expect(serviceWorker).toMatch(/sw-claimed-reload/);
    expect(serviceWorker).toMatch(/event\.data\.type === 'CLAIM_AND_RELOAD' \|\| event\.data\.type === 'SKIP_WAITING'/);
  });

  it('keeps MINUTE priority over MIRROR in the reusable ICH algorithm export', () => {
    expect(texts['src/institutional-protocols.js']).toMatch(/MINUTE has operational priority over MIRROR/);
    expect(texts['data/generic-protocols.json']).toMatch(/MINUTE has operational priority over MIRROR/);
    expect(texts['src/institutional-protocols.js']).toMatch(/thresholds are version-sensitive and must be checked against the active registry protocol/);
    expect(texts['data/generic-protocols.json']).toMatch(/thresholds are version-sensitive and must be checked against the active registry protocol/);
  });

  it('keeps the reviewed content files free of private sentinels / PHI-shaped tokens', () => {
    // Focused belt-and-suspenders guard on the two content files updated this pass
    // (the repo-wide leak guard covers the built bundle + all tracked files).
    const GUARDED = ['src/management-guidance.js', 'src/institutional-protocols.js'];
    const banned = [
      new RegExp(sentinel('PUBLIC', 'PRIVATE', 'INSTITUTION', 'SENTINEL')),
      new RegExp(sentinel('PUBLIC', 'PRIVATE', 'IDENTITY', 'SENTINEL')),
      new RegExp(sentinel('PUBLIC', 'PRIVATE', 'LITERAL', 'SENTINEL')),
      new RegExp(sentinel('PRIVATE', 'SOURCE', 'ATTACHMENT', 'SENTINEL')),
      new RegExp(sentinel('PRIVATE', 'LOCAL', 'CONTACT', 'SENTINEL')),
      /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/ // US phone number
    ];
    for (const f of GUARDED) {
      for (const re of banned) {
        expect(re.test(texts[f]), `${f} contains banned identifier ${re}`).toBe(false);
      }
    }
  });

  it('locks in the 2026-07-06 evidence refresh (new trials present + PubMed-verified)', () => {
    const trials = readJson('data/atlas/completed-trials.json').data;
    const byName = new Map(trials.map((t) => [t.shortName, t]));
    const cites = readJson('data/atlas/citations.json').data;
    const citeById = new Map(cites.map((c) => [c.id, c]));
    const expected = {
      'BRIDGE-TNK': { pmid: '40396577', doi: '10.1056/NEJMoa2503867', cid: 'cit-bridge-tnk-2025' },
      HOPE: { pmid: '40773205', doi: '10.1001/jama.2025.12063', cid: 'cit-hope-2025' },
      EXPECTS: { pmid: '40174223', doi: '10.1056/NEJMoa2413344', cid: 'cit-expects-2025' },
      MIND: { pmid: '40892424', doi: '10.1001/jamaneurol.2025.3151', cid: 'cit-mind-2025' }
    };
    for (const [name, exp] of Object.entries(expected)) {
      const t = byName.get(name);
      expect(t, `completed trial ${name} missing from atlas`).toBeTruthy();
      expect(t.verificationStatus, `${name} not PubMed-verified`).toBe('verified-pubmed');
      expect(t.citationIds, `${name} missing citation ${exp.cid}`).toContain(exp.cid);
      const c = citeById.get(exp.cid);
      expect(c, `citation ${exp.cid} missing`).toBeTruthy();
      expect(c.pmid, `${name} PMID drifted`).toBe(exp.pmid);
      expect(c.doi, `${name} DOI drifted`).toBe(exp.doi);
    }
    // MIND must stay represented as a NEGATIVE trial — never imply MIS efficacy.
    expect(byName.get('MIND').primaryEndpoint.result).toMatch(/no significant benefit|negative|did not|no benefit/i);
    // Extended-window alteplase trials must keep the "emerging / not routine" framing.
    expect(byName.get('HOPE').applicabilityNotes).toMatch(/emerging|not a standard/i);
    expect(byName.get('EXPECTS').applicabilityNotes).toMatch(/emerging|not a standard/i);
  });

  it('keeps the corrected TEMPO-2 DOI (caught by independent PubMed verification)', () => {
    const cites = readJson('data/atlas/citations.json').data;
    const tempo2 = cites.find((c) => c.id === 'cit-tempo-2-2024');
    expect(tempo2, 'TEMPO-2 citation missing').toBeTruthy();
    expect(tempo2.doi).toBe('10.1016/S0140-6736(24)00921-8');
    // The wrong DOI copied from the local source doc must never reappear.
    expect(tempo2.doi).not.toBe('10.1016/S0140-6736(24)00827-2');
  });

  it('keeps adult AIS tenecteplase dose at 0.25 mg/kg (max 25 mg) and forbids the 0.4 mg/kg dose', () => {
    // Positive: correct AIS dose ships in the institutional example algorithm.
    expect(texts['src/institutional-protocols.js']).toMatch(/0\.25\s*mg\/kg[^\n]{0,40}max\s*25\s*mg/i);
    // Positive: the 0.4 mg/kg stroke dose is explicitly prohibited, not recommended.
    expect(texts['src/management-guidance.js']).toMatch(/do not use the 0\.4\s*mg\/kg/i);
  });
});
