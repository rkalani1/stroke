import { describe, it, expect } from 'vitest';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';
import { newEncounter } from '../src/workspace-state.js';
describe('Encounter-first navigation and explicit retirement', () => {
  it('defaults to Encounter and preserves protected routes', () => {
    expect(parseWorkspaceRoute('')).toEqual({ surface: 'encounter' });
    expect(parseWorkspaceRoute('#/protocols/ich')).toEqual({ surface: 'protocols', sub: 'ich' });
    expect(parseWorkspaceRoute('#/protocols/ischemic')).toEqual({ surface: 'protocols', sub: 'ischemic' });
  });
  it.each(['education','education/icu','curriculum/nursing','simulators','trials/unknown','settings','protocols/sah','protocols/cvt'])('retires %s explicitly', route => expect(parseWorkspaceRoute('#/'+route)).toEqual({ surface: 'retired', path: route }));
  it.each([['trials', 'screener'], ['trials/active','screener'], ['trials/tables','tables'], ['trials/database','database'], ['research/trials/studies','database']])('restores %s without unrelated portal routes', (path, sub) => expect(parseWorkspaceRoute('#/'+path)).toEqual({surface:'trials',sub}));
  it.each(['nihss','gcs','ich-score','ich-volume','crcl','aspects','pc-aspects','alteplase','tnk','mrs','dawn','defuse3','dapt'])('maps retained deep links to %s', tool => {
    expect(parseWorkspaceRoute('#/research/calculators/'+tool)).toEqual({ surface: 'encounter', tool });
    expect(parseWorkspaceRoute('#/encounter/'+tool)).toEqual({ surface: 'encounter', tool });
  });
  it.each(['rcvs2','func','dragon','unknown'])('never substitutes an unrelated tool for %s', tool => expect(parseWorkspaceRoute('#/calculators/'+tool).surface).toBe('retired'));
  it.each(['abcd2', 'chadsvasc', 'has-bled', 'rope', 'pascal', 'phases', 'hunt-hess', 'wfns', 'aspects-regions', 'pc-aspects-regions'])('restores supported supplemental %s routes', tool => { for (const prefix of ['tools', 'encounter', 'calculators', 'research/calculators']) expect(parseWorkspaceRoute(`#/${prefix}/${tool}`)).toEqual({ surface: 'tools', tool }); });
  it.each(['evidence', 'guidelines', 'references', 'research/guidelines', 'research/references'])('opens curated evidence for %s', route => expect(parseWorkspaceRoute('#/'+route)).toEqual({surface:'evidence'}));
  it('routes bounded reference and protocol deep links', () => {
    expect(parseWorkspaceRoute('#/evidence/af-timing')).toEqual({surface:'evidence',focusId:'af-timing'});
    expect(parseWorkspaceRoute('#/trials/completed/topic-af-timing')).toEqual({surface:'trials',sub:'completed',focusId:'topic-af-timing'});
    expect(parseWorkspaceRoute('#/protocols/ich/reversal')).toEqual({surface:'protocols',sub:'ich',target:'reversal'});
    expect(parseWorkspaceRoute('#/protocols/ischemic/reversal').surface).toBe('retired');
    expect(parseWorkspaceRoute('#/encounter/section/diagnosis-details')).toEqual({surface:'encounter',section:'diagnosis-details'});
    for (const route of ['evidence/abc%22', 'trials/completed/abc%22', 'protocols/ich/not-real', 'encounter/section/not-real']) expect(parseWorkspaceRoute('#/'+route).surface).toBe('retired');
  });
  it('routing does not read or mutate encounter state', () => {const s=newEncounter();s.rationale='synthetic retained rationale';const before=JSON.stringify(s);for(const hash of ['#/protocols/ich','#/tools','#/encounter','#/trials'])parseWorkspaceRoute(hash);expect(JSON.stringify(s)).toBe(before);});
});
