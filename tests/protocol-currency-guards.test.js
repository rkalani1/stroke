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
  'src/management-guidance.js', 'src/institutional-protocols.js', 'src/calculators-extended.js',
  'src/ProtectedProtocols.jsx', 'src/Encounter.jsx', 'src/app.jsx', 'app.js',
  'src/evidence/recommendations.js', 'data/generic-protocols.json'
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

    expect(texts['src/ProtectedProtocols.jsx']).toMatch(/ED clinicians or the stroke service may call Neurosurgery directly; prior approval is not required/i);
    expect(texts['src/ProtectedProtocols.jsx']).toMatch(/plan must be closed-looped with the designated on-call stroke attending and other involved service/i);
    expect(texts['src/ProtectedProtocols.jsx']).toMatch(/Cerebellar ICH with mass effect/);

    // The accepted institutional source does not state a separate negative policy
    // about attending-of-record notification, so that invented operational claim
    // must not appear anywhere in the source application.
    expect(texts['src/ProtectedProtocols.jsx']).not.toMatch(/attending-of-record notification is not default/i);

    const obsoleteHits = offendingLines(
      /Neurology\/stroke attending should approve neurosurgery consultations|discusses with stroke attending before consulting neurosurgery|prior approval is required|dual-consult|immediate evacuation \+\/- EVD/i,
      { files: ['src/ProtectedProtocols.jsx', 'src/institutional-protocols.js', 'data/generic-protocols.json'] }
    );
    expect(obsoleteHits, `Obsolete neurosurgery wording found:\n${obsoleteHits.join('\n')}`).toEqual([]);
  });

  it('keeps the institutional MIE screen complete without the old ENRICH-based heading', () => {
    expect(texts['src/ProtectedProtocols.jsx']).toMatch(/June 2026 Institutional MIE Screen/);
    expect(texts['src/ProtectedProtocols.jsx']).not.toMatch(/June 2026 MIE Screen \(ENRICH-Based\)/);
    expect(texts['src/ProtectedProtocols.jsx']).toMatch(/GCS 5-14/);
    expect(texts['src/institutional-protocols.js']).toMatch(/GCS 5-14/);
    expect(texts['data/generic-protocols.json']).toMatch(/GCS 5-14/);

    const hits = [
      ...offendingLines(/ENRICH[^\n]{0,160}GCS 5-15/i),
      ...offendingLines(/GCS 5-15[^\n]{0,160}ENRICH/i),
      ...offendingLines(/MIE[^\n]{0,160}GCS 5-15/i),
      ...offendingLines(/MIE[^\n]{0,240}GCS 5-12/i),
      ...offendingLines(/GCS 5-12[^\n]{0,240}MIE/i),
      ...offendingLines(/Surgical Selection[^\n]{0,400}GCS 5-12/i),
      ...offendingLines(/Pre-morbid mRS 0-1/i, { files: ['src/ProtectedProtocols.jsx', 'app.js'] }),
      ...offendingLines(/Premorbid mRS 0-1[^\n]{0,240}(MIE|ENRICH)/i, { files: ['src/ProtectedProtocols.jsx', 'app.js'] }),
      ...offendingLines(/(MIE|ENRICH)[^\n]{0,240}Premorbid mRS 0-1/i, { files: ['src/ProtectedProtocols.jsx', 'app.js'] }),
      ...offendingLines(/(≤|<=)24 hours of symptom onset/i, { files: ['src/ProtectedProtocols.jsx', 'app.js'] }),
      ...offendingLines(/24-72h after onset/i, { files: ['src/ProtectedProtocols.jsx', 'app.js'] }),
      ...offendingLines(/mRS 0-1[^\n]{0,160}ENRICH/i),
      ...offendingLines(/ENRICH[^\n]{0,160}mRS 0-1/i),
      ...offendingLines(/ENRICH[^\n]{0,240}(≤|<=)\s*24\s*(h|hours?)/i, { files: ['src/ProtectedProtocols.jsx', 'app.js'] }),
      ...offendingLines(/ENRICH[^\n]{0,240}20-50\s*mL/i, { files: ['src/ProtectedProtocols.jsx', 'app.js'] }),
      ...offendingLines(/20-50\s*mL[^\n]{0,240}ENRICH/i, { files: ['src/ProtectedProtocols.jsx', 'app.js'] })
    ];
    expect(hits, `Obsolete ENRICH/MIE criterion found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('keeps institutional ICH BP branches source-specific and free of literature grades', () => {
    const app = texts['src/ProtectedProtocols.jsx'];
    expect(app).toMatch(/Presenting SBP 150-219:[\s\S]{0,80}target 140 and maintain 130-150/);
    expect(app).toMatch(/Presenting SBP (?:&ge;|≥)220:[\s\S]{0,120}reduce (?:by )?about 20%[\s\S]{0,100}never more than 25%[\s\S]{0,100}gradually reduce to 140-160/);
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


  it('does not publish private service-line sentinels on public surfaces', () => {
    const privateServiceLine = new RegExp(`\\b${sentinel('PRIVATE', 'SERVICE', 'LINE', 'SENTINEL')}\\b`, 'i');
    const hits = offendingLines(privateServiceLine, { files: CONTENT_FILES });
    expect(hits, `Private service-line sentinel found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('keeps service-worker updates explicit on the claim-and-reload path', () => {
    const shell = read('src/app.jsx');
    const controller = read('src/design/sw-controller.js');
    expect(shell).toMatch(/onClick=\{\(\) => acceptUpdate\(\)/);
    expect(shell).toContain('Reload to update');
    expect(shell).toContain('Later');
    expect(controller).toMatch(/postMessage\(\{ type: 'CLAIM_AND_RELOAD' \}\)/);
    expect(controller).toContain('if (!updateAccepted || reloading) return;');
    expect(shell).not.toContain("postMessage({ type: 'SKIP_WAITING' })");
    const worker = read('service-worker.js');
    expect(worker).toMatch(/includeUncontrolled:\s*true/);
    expect(worker).toMatch(/clients\.claim\(\)/);
    expect(worker).toMatch(/sw-claimed-reload/);
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
