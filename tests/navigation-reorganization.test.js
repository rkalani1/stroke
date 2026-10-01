import { describe, it, expect } from 'vitest';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';
import { newEncounter } from '../src/workspace-state.js';
describe('Encounter-first navigation and explicit retirement', () => {
  it('defaults to Encounter and preserves protected routes', () => {
    expect(parseWorkspaceRoute('')).toEqual({ surface: 'encounter' });
    expect(parseWorkspaceRoute('#/protocols/ich')).toEqual({ surface: 'protocols', sub: 'ich' });
    expect(parseWorkspaceRoute('#/protocols/ischemic')).toEqual({ surface: 'protocols', sub: 'ischemic' });
  });
  it.each(['education','education/icu','curriculum/nursing','simulators','trials','trials/tables','research/guidelines','research/references','guidelines','references','settings','protocols/sah','protocols/cvt'])('retires %s explicitly', route => expect(parseWorkspaceRoute('#/'+route)).toEqual({ surface: 'retired', path: route }));
  it.each(['nihss','gcs','ich-score','ich-volume','crcl','aspects','pc-aspects','alteplase','tnk','mrs','dawn','defuse3','dapt'])('maps retained deep links to %s', tool => {
    expect(parseWorkspaceRoute('#/research/calculators/'+tool)).toEqual({ surface: 'encounter', tool });
    expect(parseWorkspaceRoute('#/encounter/'+tool)).toEqual({ surface: 'encounter', tool });
  });
  it.each(['rcvs2','func','phases','dragon','hasbled','unknown'])('never substitutes an unrelated tool for %s', tool => expect(parseWorkspaceRoute('#/calculators/'+tool).surface).toBe('retired'));
  it('routing does not read or mutate encounter state', () => {const s=newEncounter();s.rationale='synthetic retained rationale';const before=JSON.stringify(s);for(const hash of ['#/protocols/ich','#/tools','#/encounter','#/trials'])parseWorkspaceRoute(hash);expect(JSON.stringify(s)).toBe(before);});
});
