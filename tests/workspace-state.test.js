import { describe, expect, it } from 'vitest';
import { newEncounter, updateEncounter, nihssAssessment, activeNote, buildSummary, encounterTiming, validTimestamp, outputWarnings, encounterVolume, protocolVolumeEstimate, protocolEncounter, copySummary } from '../src/workspace-state.js';
import { evaluateWakeUpScreen } from '../src/encounter-clinical-review.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
const NOW = new Date('2026-10-01T12:00:00').getTime();
describe('canonical state and honest documentation', () => {
  it('never imputes zero from an incomplete NIHSS and totals documented UN items per NIHSS rules', () => {
    expect(nihssAssessment({}).total).toBeNull();
    const entries = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
    expect(nihssAssessment(entries)).toMatchObject({ total: 0, untestable: 0 });
    // UN (untestable) is a documented finding: all 15 items documented, UN not scored.
    entries.dysarthria='Intubated/other (UN)';expect(nihssAssessment(entries)).toMatchObject({ complete: true, total: 0, untestable: 1 });
    entries.motor_arm_left='Amputation/joint fusion (UN)';entries.motor_arm_right='No movement (4)';
    expect(nihssAssessment(entries)).toMatchObject({ complete: true, total: 4, untestable: 2 });
    // An item that is simply not assessed still withholds the total.
    entries.dysarthria='';expect(nihssAssessment(entries)).toMatchObject({ complete: false, total: null });
  });
  it('offers UN only on NIHSS items whose rules allow it', () => {
    const withUn = NIHSS_ITEMS.filter(item => item.options.some(option => option.includes('(UN)'))).map(item => item.id);
    expect(withUn).toEqual(['motor_arm_left', 'motor_arm_right', 'motor_leg_left', 'motor_leg_right', 'limb_ataxia', 'dysarthria']);
    for (const id of ['motor_arm_left', 'motor_arm_right', 'motor_leg_left', 'motor_leg_right', 'limb_ataxia']) expect(NIHSS_ITEMS.find(item => item.id === id).options).toContain('Amputation/joint fusion (UN)');
  });
  it('invalidates a draft after every source group changes or clears', () => {
    const s=newEncounter();s.draft={text:buildSummary(s,NOW),stale:false};
    for(const key of Object.keys(s).filter(k=>!['draft','revision'].includes(k))) {
      const next=updateEncounter(s,{[key]:s[key]});expect(next.draft.stale,key).toBe(true);expect(next.revision).toBe(s.revision+1);
    }
    expect(updateEncounter(s,{rationale:''}).draft.stale).toBe(true);
  });
  it('preserves entered rationale in the restored paragraph without old labels or recursive draft', () => {
    const s=newEncounter();s.rationale='Synthetic manually entered rationale';s.draft={text:'OLD GENERATED SENTENCE'};
    const text=buildSummary(s,NOW);expect(text).toContain(s.rationale);expect(text).not.toContain(s.draft.text);
    expect(text).not.toMatch(/SYNTHETIC EDUCATIONAL DEMO|NOT A REAL CLINICAL NOTE|NO PHI/);expect(text).toContain('NIHSS score: incomplete');expect(text).not.toContain('Informed consent');
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
    s.actions.administered=true;expect(buildSummary(s,NOW)).toContain('Alteplase at 2026-10-01 11:00');s.actions.administrationTime='2026-10-01T13:00';expect(buildSummary(s,NOW)).toContain('IVT administration: not documented');
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
  it('projects entered GCS into ischemic summaries without validating a future consent time', () => {
    const s=newEncounter();s.note.diagnosisCategory='ischemic';s.gcs={eye:'4',verbal:'5',motor:'6'};
    s.actions.consent='Informed consent';s.actions.consentTime='2026-10-01T13:00';
    expect(buildSummary(s,NOW)).toContain('GCS E4 V5 M6 = 15/15');expect(buildSummary(s,NOW)).toContain('Consent time: invalid or future');
  });
  it('uses the same strict calendar validator for partial imaging-selected screens', () => {
    const n={age:'65',nihss:'0',ctHemorrhageStatus:'absent',lkwUnknown:true,discoveryDate:'2026-02-30',discoveryTime:'02:30',wakeUpStrokeWorkflow:{dwi:{positiveForLesion:true},flair:{noMarkedHyperintensity:true},mriLesionExtentReviewed:true,dwiLesionUnderOneThirdMCA:true}};
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
    const n={age:'65',nihss:'0',ctHemorrhageStatus:'absent',lkwUnknown:true,discoveryDate:'2026-10-01',discoveryTime:'00:00',wakeUpStrokeWorkflow:{dwi:{positiveForLesion:true},flair:{noMarkedHyperintensity:true},mriLesionExtentReviewed:true,dwiLesionUnderOneThirdMCA:true}};
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
  it.each([['5.99', '1', false, false], ['6', '1', true, false], ['6.01', '1', true, false], ['5.99', '2', true, false], ['6', '2', true, true], ['6.01', '2', true, true]])('preserves independent unrounded 15/30 mL protocol flags for %s by %s slices', (a, numSlices, exceeds15, exceeds30) => {
    // One 1 cm slice yields 2.5A mL; two yield 5A mL.
    const volume = encounterVolume({ a, b: '5', thicknessMm: '10', numSlices });
    expect(protocolVolumeEstimate(volume)).toMatchObject({ exceeds15, exceeds30 });
    expect(protocolVolumeEstimate(null)).toBeNull();
  });
  it('projects current protocol measurements, complete zero, exact hours and intentional clears', () => {
    const s = newEncounter();
    s.note = { ...s.note, diagnosisCategory: 'ischemic', age: '65', weight: '83', glucose: '100', presentingBP: '140/80', lkwDate: '2026-10-01', lkwTime: '10:00' };
    s.nihss = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));s.aspects = '0';
    const first = protocolEncounter(s, NOW);
    expect(first.anterior).toMatchObject({ nihss: 0, aspectsScore: '0', timeFromLKWh: 2 });
    expect(first.ivt).toMatchObject({ weight: '83', glucose: '100', bpSystolic: '140', bpDiastolic: '80' });
    const resumed = protocolEncounter(s, NOW + 30000);
    expect(resumed.sourceKey).toBe(first.sourceKey);expect(resumed.ivt.hoursFromLKW).toBeCloseTo(2.0083333333, 9);
    s.note.weight = '';s.nihss.dysarthria = '';s.aspects = '';
    const cleared = protocolEncounter(s, NOW);
    expect(cleared.sourceKey).not.toBe(first.sourceKey);expect(cleared.ivt.weight).toBe('');expect(cleared.anterior.nihss).toBe('');expect(cleared.anterior.aspectsScore).toBe('');
    s.note.lkwUnknown = true;expect(protocolEncounter(s, NOW).ivt.hoursFromLKW).toBe('');
    s.note.diagnosisCategory = 'ich';expect(protocolEncounter(s, NOW)).toMatchObject({ compatible: false, anterior: { nihss: '', aspectsScore: '', coreVolume: '', massEffect: null } });
  });
  it('uses existing concern distinctions for protocol safety review without classifying blue-tier flags as exclusions', () => {
    const s = newEncounter();s.note.diagnosisCategory = 'ischemic';
    s.note.tnkContraindicationChecklist = { aceInhibitor: true, dualAntiplatelet: true, seizureAtOnset: true };
    // Anticoagulant exposure must be explicitly "none" for a clean protocol card.
    expect(protocolEncounter(s, NOW).safetyReviewRequired).toBe(true);
    s.note.lastDOACType = 'none';
    expect(protocolEncounter(s, NOW).safetyReviewRequired).toBe(false);
    const before = protocolEncounter(s, NOW).sourceKey;
    s.note.tnkContraindicationChecklist.priorICH = true;
    expect(protocolEncounter(s, NOW).sourceKey).not.toBe(before);expect(protocolEncounter(s, NOW).safetyReviewRequired).toBe(true);
  });
  it('reset clears all source groups, draft and timers without reusing nested state', () => {
    const s=newEncounter();s.note.age='80';s.actions.administered=true;s.draft={text:'old'};
    const fresh=newEncounter();expect(fresh.note.age).toBe('');expect(fresh.actions.administrationTime).toBe('');expect(fresh.draft).toBeNull();expect(fresh.revision).toBe(0);expect(fresh.note).not.toBe(s.note);
  });
});
