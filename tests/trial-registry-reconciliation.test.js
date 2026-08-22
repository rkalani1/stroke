// Reconciliation lock across the three trial registries in the app:
//   src/evidence/activeTrials.js   (Evidence Atlas / encounter matcher)
//   src/evidence/screenerTrials.json (bedside Trial Screener)
//   src/evidence/eligibilityTables.js (Trials-tab eligibility tables)
// Any acronym shared between sources must carry the same NCT id, and the
// enrollment statuses must be coherent — a trial closed in one source must
// never render as enrolling in another (that is how a withdrawn study ends
// up printed as ELIGIBLE in a clinical note).

import { describe, it, expect } from 'vitest';
import { activeTrials } from '../src/evidence/activeTrials.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { eligibilityTables } from '../src/evidence/eligibilityTables.js';

// Normalizes each source into { acronym → { nct, enrolling } }.
const ENROLLING_ACTIVE_STATUSES = new Set(['recruiting', 'enrolling-by-invitation']);
const ENROLLING_SCREENER_STATUSES = new Set(['enrolling']);

function activeTrialIndex() {
  const out = new Map();
  for (const t of activeTrials) {
    const acronym = (t.legacyMatcherKey || t.shortName || '').toUpperCase();
    if (!acronym) continue;
    out.set(acronym, { nct: t.nctId || '', enrolling: ENROLLING_ACTIVE_STATUSES.has(t.status), status: t.status });
  }
  return out;
}

function screenerIndex() {
  const out = new Map();
  for (const t of screenerTrials) {
    const acronym = String(t.acronym || '').toUpperCase();
    if (!acronym) continue;
    out.set(acronym, {
      nct: (t.externalMetadata && t.externalMetadata.nct) || '',
      enrolling: ENROLLING_SCREENER_STATUSES.has(t.status),
      status: t.status
    });
  }
  return out;
}

function eligibilityIndex() {
  const out = new Map();
  for (const table of eligibilityTables) {
    for (const row of table.trials || []) {
      const acronym = String(row.acronym || '').toUpperCase();
      if (!acronym) continue;
      out.set(acronym, { nct: row.nct || '', enrolling: ENROLLING_SCREENER_STATUSES.has(row.status), status: row.status });
    }
  }
  return out;
}

describe('trial registry reconciliation (activeTrials / screenerTrials / eligibilityTables)', () => {
  const sources = {
    activeTrials: activeTrialIndex(),
    screenerTrials: screenerIndex(),
    eligibilityTables: eligibilityIndex()
  };
  const names = Object.keys(sources);
  const allAcronyms = new Set(names.flatMap((n) => [...sources[n].keys()]));

  it('shared acronyms carry the same NCT id in every source', () => {
    const mismatches = [];
    for (const acr of allAcronyms) {
      const ncts = names
        .map((n) => ({ source: n, rec: sources[n].get(acr) }))
        .filter((x) => x.rec && x.rec.nct);
      const unique = new Set(ncts.map((x) => x.rec.nct));
      if (unique.size > 1) {
        mismatches.push(`${acr}: ${ncts.map((x) => `${x.source}=${x.rec.nct}`).join(', ')}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('a trial not actively enrolling in one source never shows as enrolling in another', () => {
    const conflicts = [];
    for (const acr of allAcronyms) {
      const present = names
        .map((n) => ({ source: n, rec: sources[n].get(acr) }))
        .filter((x) => x.rec);
      if (present.length < 2) continue;
      const states = new Set(present.map((x) => x.rec.enrolling));
      if (states.size > 1) {
        conflicts.push(`${acr}: ${present.map((x) => `${x.source}=${x.rec.status}`).join(', ')}`);
      }
    }
    expect(conflicts).toEqual([]);
  });

  it('closed/withdrawn/halted records are pinned to their verified registry state', () => {
    const rhapsody = sources.activeTrials.get('RHAPSODY');
    expect(rhapsody).toBeDefined();
    expect(rhapsody.status).toBe('withdrawn');
    expect(rhapsody.nct).toBe('NCT05484154'); // NOT the Sinovac COVID trial NCT04953325
    const most = sources.activeTrials.get('MOST');
    expect(most.status).toBe('completed');
    const captiva = sources.activeTrials.get('CAPTIVA');
    expect(captiva.status).toBe('active-not-recruiting');
  });
});
