import { describe, expect, it } from 'vitest';
import { newEncounter, updateEncounter, nihssAssessment, activeNote, buildSummary, encounterTiming, validTimestamp, outputWarnings, encounterVolume, copySummary } from '../src/workspace-state.js';
import { evaluateWakeUpScreen } from '../src/encounter-clinical-review.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
const NOW = new Date('2026-10-01T12:00:00').getTime();
describe('canonical state and honest documentation', () => {
  it('never imputes zero from an incomplete or untestable NIHSS', () => {
    expect(nihssAssessment({}).total).toBeNull();
    const entries = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
    expect(nihssAssessment(entries).total).toBe(0);
    entries.dysarthria='Intubated/other (UN)';expect(nihssAssessment(entries).total).toBeNull();
    entries.dysarthria='';expect(nihssAssessment(entries).total).toBeNull();
  });
  it('invalidates a draft after every source group changes or clears', () => {
    const s=newEncounter();s.draft={text:buildSummary(s,NOW),stale:false};
    for(const key of Object.keys(s).filter(k=>!['draft','revision'].includes(k))) {
      const next=updateEncounter(s,{[key]:s[key]});expect(next.draft.stale,key).toBe(true);expect(next.revision).toBe(s.revision+1);
    }
    expect(updateEncounter(s,{rationale:''}).draft.stale).toBe(true);
  });
  it('preserves entered rationale with explicit synthetic labeling and no recursive draft', () => {
    const s=newEncounter();s.rationale='Synthetic manually entered rationale';s.draft={text:'OLD GENERATED SENTENCE'};
    const text=buildSummary(s,NOW);expect(text).toContain(s.rationale);expect(text).not.toContain(s.draft.text);
    expect(text).toContain('SYNTHETIC EDUCATIONAL DEMO');expect(text).toContain('NIHSS incomplete');expect(text).not.toContain('Informed consent');
  });
  it('retains incompatible inputs without projecting them into outputs', () => {
    const s=newEncounter();s.note.diagnosisCategory='ich';s.note.vesselOcclusion=['Basilar'];s.actions.administered=true;s.actions.administrationTime='2026-10-01T11:00';s.drug='TNK';
    expect(activeNote(s).vesselOcclusion).toEqual([]);expect(s.note.vesselOcclusion).toEqual(['Basilar']);expect(buildSummary(s,NOW)).not.toContain('IVT administration');
    s.context='follow-up';s.note.diagnosisCategory='ischemic';expect(buildSummary(s,NOW)).not.toContain('IVT administration');
  });
  it('does not populate discovery or turn it into onset', () => {
    const s=newEncounter();s.note.lkwUnknown=true;s.note.lkwDate='2026-10-01';s.note.lkwTime='10:00';
    expect(encounterTiming(s.note,NOW).clock).toBeNull();expect(encounterTiming(s.note,NOW).hours).toBeNull();
    s.note.discoveryDate='2026-10-01';s.note.discoveryTime='11:00';expect(encounterTiming(s.note,NOW).clock.elapsedMinutes).toBe(60);expect(encounterTiming(s.note,NOW).hours).toBeNull();
  });
  it('requires explicit administration and valid time independently of recommendation or consent', () => {
    const s=newEncounter();s.note.diagnosisCategory='ischemic';s.drug='Alteplase';s.decisions.ivt='Recommended';s.actions.consent='Informed consent';
    expect(buildSummary(s,NOW)).toContain('IVT administration: not documented');s.actions.administrationTime='2026-10-01T11:00';expect(buildSummary(s,NOW)).toContain('IVT administration: not documented');
    s.actions.administered=true;expect(buildSummary(s,NOW)).toContain('Alteplase at 2026-10-01T11:00');s.actions.administrationTime='2026-10-01T13:00';expect(buildSummary(s,NOW)).toContain('IVT administration: not documented');
  });
  it('rejects future/invalid times and recomputes elapsed time after suspension and midnight', () => {
    expect(validTimestamp('2026-02-30T11:00',NOW)).toBeNull();expect(validTimestamp('2026-10-01T13:00',NOW)).toBeNull();
    const note={lkwDate:'2026-09-30',lkwTime:'23:50'};
    expect(encounterTiming(note,new Date('2026-10-01T00:10').getTime()).clock.elapsedMinutes).toBe(20);
    expect(encounterTiming(note,new Date('2026-10-01T02:10').getTime()).clock.elapsedMinutes).toBe(140);
  });
  it('detects possible identifiers in free text', () => {const s=newEncounter();s.rationale='synthetic user@example.invalid';expect(outputWarnings(s)).toContain('Possible email address');s.rationale='synthetic review';expect(outputWarnings(s)).toEqual([]);});
  it('guards the blood-pressure free-text copy sink as well as manual narratives', () => {
    const s=newEncounter();s.note.presentingBP='synthetic user@example.invalid';
    expect(outputWarnings(s)).toContain('Possible email address');
  });
  it('does not project hidden GCS into ischemic summaries or validate future consent time', () => {
    const s=newEncounter();s.note.diagnosisCategory='ischemic';s.gcs={eye:'4',verbal:'5',motor:'6'};
    s.actions.consent='Informed consent';s.actions.consentTime='2026-10-01T13:00';
    expect(buildSummary(s,NOW)).not.toContain('GCS: 15');expect(buildSummary(s,NOW)).toContain('Consent time: invalid or future');
  });
  it('uses the same strict calendar validator for partial imaging-selected screens', () => {
    const n={age:'65',nihss:'0',ctHemorrhageStatus:'absent',lkwUnknown:true,discoveryDate:'2026-02-30',discoveryTime:'02:30',wakeUpStrokeWorkflow:{dwi:{positiveForLesion:true},flair:{noMarkedHyperintensity:true},mriLesionExtentReviewed:true}};
    expect(evaluateWakeUpScreen(n,new Date('2026-03-02T05:00')).autoWakeUp).toBe(false);
    expect(evaluateWakeUpScreen({...n,discoveryDate:'2026-03-02'},new Date('2026-03-02T05:00')).autoWakeUp).toBe(true);
  });
  it.each(['resolve','reject'])('suppresses superseded clipboard %s after edit, regeneration or reset', async outcome => {
    for (const mutation of ['edit','regenerate','reset']) {
      const s=newEncounter();s.draft={text:'SYNTHETIC old draft',stale:false};const ref={current:s};let settle;
      const request=copySummary(ref,s.draft.text,()=>new Promise((resolve,reject)=>{settle=outcome==='resolve'?resolve:reject;}));
      ref.current=mutation==='reset'?newEncounter():mutation==='edit'?updateEncounter(s,{rationale:'new value'}):{...s,draft:{text:'SYNTHETIC new draft',stale:false}};
      settle();expect(await request).toBe('superseded');
    }
  });
  it('copies only explicit current safe drafts, with a current failure fallback', async () => {
    const s=newEncounter(),ref={current:s};let writes=0;
    expect(await copySummary(ref,'text',async()=>writes++)).toBe('blocked');expect(writes).toBe(0);
    s.draft={text:'SYNTHETIC draft',stale:false};expect(await copySummary(ref,s.draft.text,async()=>writes++)).toBe('copied');
    expect(await copySummary(ref,s.draft.text,async()=>{throw Error('denied');})).toBe('denied');
    s.note.presentingBP='synthetic user@example.invalid';expect(await copySummary(ref,s.draft.text,async()=>writes++)).toBe('blocked');expect(writes).toBe(1);
  });
  it('preserves subminute precision at source-screen boundaries', () => {
    const n={age:'65',nihss:'0',ctHemorrhageStatus:'absent',lkwUnknown:true,discoveryDate:'2026-10-01',discoveryTime:'00:00',wakeUpStrokeWorkflow:{dwi:{positiveForLesion:true},flair:{noMarkedHyperintensity:true},mriLesionExtentReviewed:true}};
    const boundary=new Date('2026-10-01T04:30').getTime();
    expect(evaluateWakeUpScreen(n,new Date(boundary)).autoWakeUp).toBe(true);
    for(const delta of [1,30000,59999]) expect(evaluateWakeUpScreen(n,new Date(boundary+delta)).autoWakeUp).toBe(false);
    const known={lkwDate:n.discoveryDate,lkwTime:n.discoveryTime};
    expect(encounterTiming(known,boundary+30000).hours).toBeCloseTo(4.5083333333333,10);
    const perfusion={...n,lkwUnknown:false,lkwDate:n.discoveryDate,lkwTime:n.discoveryTime,nihss:'4',premorbidMRS:'0',coreVolume:'20',penumbraVolume:'50'};
    const extend=new Date('2026-10-01T09:00').getTime();
    expect(evaluateWakeUpScreen(perfusion,new Date(extend)).autoExtend).toBe(true);
    expect(evaluateWakeUpScreen(perfusion,new Date(extend+1)).autoExtend).toBe(false);
  });
  it('shares strict ABC/2 dimensions and clears stale arithmetic', () => {
    const v={a:'4.2',b:'3.6',thicknessMm:'5',numSlices:'6'};expect(encounterVolume(v).volume).toBeCloseTo(22.7,1);
    expect(encounterVolume({...v,a:''})).toBeNull();expect(encounterVolume({...v,numSlices:'1.5'})).toBeNull();expect(encounterVolume({...v,thicknessMm:'5mm'})).toBeNull();
  });
  it('reset clears all source groups, draft and timers without reusing nested state', () => {
    const s=newEncounter();s.note.age='80';s.actions.administered=true;s.draft={text:'old'};
    const fresh=newEncounter();expect(fresh.note.age).toBe('');expect(fresh.actions.administrationTime).toBe('');expect(fresh.draft).toBeNull();expect(fresh.revision).toBe(0);expect(fresh.note).not.toBe(s.note);
  });
});
