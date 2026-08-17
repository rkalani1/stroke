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
const texts = Object.fromEntries(CONTENT_FILES.map((f) => [f, read(f)]));
const linesOf = Object.fromEntries(CONTENT_FILES.map((f) => [f, texts[f].split('\n')]));
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

describe('2026 protocol-currency safety guards (public educational site)', () => {
  it('never describes standard-window thrombolysis as given "after 4.5h"', () => {
    // Extended-window phrasing ("beyond 4.5 hours", "4.5-24h", "4.5-9h") is legitimate;
    // the banned regression is a standard-window lytic framed as given AFTER 4.5h
    // (the pocket-card page-12 error the review flagged).
    const hits = offendingLines(/\bafter\s+4\.?5\s*(h\b|hours?\b)/i);
    expect(hits, `Standard-window "after 4.5h" phrasing found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('never implies routine tenecteplase up to 24h and keeps extended-window decisions fail-closed', () => {
    const guidance = texts['src/management-guidance.js'];
    expect(guidance).toMatch(/known 4\.5-9-hour interval[\s\S]{0,500}MRI DWI-FLAIR mismatch or the full numeric CTP mismatch criteria/i);
    expect(guidance).toMatch(/Wake-up or unknown-onset treatment requires MRI DWI-FLAIR mismatch/i);
    expect(guidance).toMatch(/9-24h with qualifying CTP selection[\s\S]{0,160}consent required/i);
    expect(guidance).toMatch(/Missing imaging, mRS, or EVT-candidacy gate[\s\S]{0,180}Do not return an affirmative extended-window result/i);

    // The institutional card need not carry a literature-era rebuttal sentence; it
    // must simply avoid publishing routine/standard TNK across the whole 24h window.
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

  it('keeps the institutional post-EVT SBP 140-180 range without importing a trial harm rule', () => {
    for (const f of ['src/management-guidance.js', 'src/institutional-protocols.js', 'data/generic-protocols.json']) {
      expect(texts[f], `${f} lost the source-listed post-EVT SBP range`).toMatch(/SBP 140-180/);
      expect(texts[f]).not.toMatch(/successful EVT[^\n]{0,100}(harm|Class III)|avoid\s+SBP\s*<\s*140/i);
    }
  });

  it('never recommends ranitidine (only a withdrawn-from-market caveat is allowed)', () => {
    // Ranitidine was withdrawn (FDA, 2020, NDMA). It may appear ONLY inside a negative/
    // withdrawal caveat, never as a recommended H2 blocker for angioedema.
    const allow = /withdrawn|ndma|no longer|removed|do not use|not (be )?(used|available|recommended)/i;
    const hits = offendingLines(/\branitidine\b/i, { allow });
    expect(hits, `Ranitidine used outside a withdrawn-drug caveat:\n${hits.join('\n')}`).toEqual([]);
  });

  it('locks in the source-supported non-traumatic IPH consultation workflow', () => {
    const protocolFiles = ['src/institutional-protocols.js', 'data/generic-protocols.json'];
    for (const f of protocolFiles) {
      expect(texts[f]).toMatch(/Non-traumatic IPH >=15 mL by ABC\/2/);
      expect(texts[f]).toMatch(/ED clinicians or the stroke service may consult Neurosurgery directly; prior approval is not required/i);
      expect(texts[f]).toMatch(/closes the loop with the designated on-call stroke attending and other involved service/i);
      expect(texts[f]).toMatch(/Consult earlier at any size[\s\S]{0,300}multicompartmental hemorrhage[\s\S]{0,180}clinician concern/i);
      expect(texts[f]).toMatch(/Neurosurgery\/neurointerventional pathway leads admission/);
      expect(texts[f]).toMatch(/Life-threatening mass effect/);
      expect(texts[f]).not.toMatch(/Life-threatening or significant mass effect|pupillometry/i);
    }

    expect(texts['src/app.jsx']).toMatch(/ED clinicians or the stroke service may call Neurosurgery directly; prior approval is not required/i);
    expect(texts['src/app.jsx']).toMatch(/plan must be closed-looped with the designated on-call stroke attending and other involved service/i);
    expect(texts['src/app.jsx']).toMatch(/Cerebellar ICH with mass effect/);

    // The accepted institutional source does not state a separate negative policy
    // about attending-of-record notification, so that invented operational claim
    // must not appear anywhere in the source application.
    expect(texts['src/app.jsx']).not.toMatch(/attending-of-record notification is not default/i);

    const obsoleteHits = offendingLines(
      /Neurology\/stroke attending should approve neurosurgery consultations|discusses with stroke attending before consulting neurosurgery|prior approval is required|dual-consult|immediate evacuation \+\/- EVD/i,
      { files: ['src/app.jsx', 'src/institutional-protocols.js', 'data/generic-protocols.json'] }
    );
    expect(obsoleteHits, `Obsolete neurosurgery wording found:\n${obsoleteHits.join('\n')}`).toEqual([]);
  });

  it('keeps the institutional MIE screen complete without the old ENRICH-based heading', () => {
    expect(texts['src/app.jsx']).toMatch(/June 2026 Institutional MIE Screen/);
    expect(texts['src/app.jsx']).not.toMatch(/June 2026 MIE Screen \(ENRICH-Based\)/);
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

  it('keeps institutional ICH BP branches source-specific and free of literature grades', () => {
    const app = texts['src/app.jsx'];
    expect(app).toMatch(/Presenting SBP 150-219:[\s\S]{0,80}target 140 and maintain 130-150/);
    expect(app).toMatch(/Presenting SBP (?:&ge;|≥)220:[\s\S]{0,120}reduce (?:by )?about 20%[\s\S]{0,100}never more than 25%[\s\S]{0,100}target 140-160/);
    expect(app).toMatch(/Presenting SBP (?:&lt;|<)150:[\s\S]{0,80}do not actively lower to 140/);

    // Literature recommendations and their COR/LOE metadata live under Guidelines
    // & References, not in the reusable institutional Protocols data module.
    for (const f of ['src/institutional-protocols.js', 'data/generic-protocols.json']) {
      expect(texts[f]).not.toMatch(/ATACH-2|ENCHANTED2|OPTIMAL-BP|Class IIa|Class IIb|III-harm/i);
    }
  });

  it('does not reintroduce the older MINUTE spot-sign/glibenclamide description into Protocols', () => {
    for (const f of ['src/institutional-protocols.js', 'data/generic-protocols.json']) {
      expect(texts[f]).toMatch(/Spontaneous non-traumatic supratentorial non-thalamic basal-ganglia IPH/);
      expect(texts[f]).not.toMatch(/glibenclamide|spot sign|Persistent systolic blood pressure >140 mmHg/i);
    }
  });

  it('keeps the institutional MINUTE screen at >=20 mL and <=15 hours without an inferred near-threshold branch', () => {
    const source = texts['src/institutional-protocols.js'];
    const start = source.indexOf("title: 'MINUTE screen'");
    const end = source.indexOf("title: 'MIRROR registry screen'", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const sourceMinute = source.slice(start, end);
    expect(sourceMinute).toMatch(/Basal-ganglia IPH volume >=20 mL by ABC\/2/);
    expect(sourceMinute).toMatch(/Arrival <=15 hours since last known well/);
    expect(sourceMinute).not.toMatch(/>=15 mL|or close|Pre-ICH mRS|GCS\s*</i);

    const generic = readJson('data/generic-protocols.json');
    const genericMinute = generic.data.ichInitialEvaluation.researchScreens.find((screen) => screen.title === 'MINUTE screen');
    expect(genericMinute).toBeDefined();
    expect(genericMinute.criteria).toContain('Basal-ganglia IPH volume >=20 mL by ABC/2');
    expect(genericMinute.criteria).toContain('Arrival <=15 hours since last known well');
    expect(JSON.stringify(genericMinute)).not.toMatch(/>=15 mL|or close|Pre-ICH mRS|GCS\s*</i);
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
    expect(texts['src/management-guidance.js']).toMatch(/0\.25\s*mg\/kg[^\n]{0,40}maximum\s*25\s*mg/i);
    // The institutional source need not add a literature-era warning sentence; the
    // unsupported 0.4 mg/kg dose must simply be absent from Protocols content.
    for (const f of ['src/institutional-protocols.js', 'src/management-guidance.js', 'data/generic-protocols.json']) {
      expect(texts[f]).not.toMatch(/0\.4\s*mg\/kg/i);
    }
  });
});
