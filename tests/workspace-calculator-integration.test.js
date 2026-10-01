import { describe, it, expect } from 'vitest';
import { newEncounter, updateEncounter, setEncounterReviewedScore, protocolEncounter } from '../src/workspace-state.js';
import { updateSupplementaryField, supplementaryResult, supplementaryReviewed, applySupplementaryScore, ASPECTS_REGIONS } from '../src/supplementary-calculators.js';
const change = (state,id,key,value) => updateEncounter(state, previous => updateSupplementaryField(previous,id,key,value));
function reviewed(state,id,data) {
  for (const [key,value] of Object.entries(data)) state=change(state,id,key,value);
  return change(state,id,'reviewed',true);
}
function imaging() {
  let state = newEncounter();state.note.diagnosisCategory='ischemic';
  state=reviewed(state,'aspects-regions',{hemisphere:'left',regions:Object.fromEntries(ASPECTS_REGIONS.map(r=>[r.key,false]))});
  return updateEncounter(state, previous=>applySupplementaryScore(previous,'aspects-regions'));
}
describe('canonical worksheet/Encounter integration',()=>{
  it('clears an applied score and invalidates draft/protocol after source imaging changes',()=>{
    let state=imaging();expect(state.aspects).toBe(10);expect(protocolEncounter(state).anterior.aspectsScore).toBe(10);
    state.draft={text:'previous',stale:false};const revision=state.revision;
    state=updateEncounter(state, previous=>({...previous,note:{...previous.note,ctResults:'New imaging findings'}}));
    expect(state.aspects).toBe('');expect(protocolEncounter(state).anterior.aspectsScore).toBe('');expect(state.draft.stale).toBe(true);expect(state.revision).toBe(revision+1);
    state=updateEncounter(state, previous=>({...previous,note:{...previous.note,ctResults:''}}));
    expect(supplementaryReviewed(state,'aspects-regions')).toBe(false);expect(state.aspects).toBe('');
  });
  it('preserves a separately reviewed manual score even with the same numeric value',()=>{
    let state=updateEncounter(imaging(),previous=>setEncounterReviewedScore(previous,'aspects','10'));
    expect(state.supplementary.applied['aspects-regions']).toBeUndefined();
    state=updateEncounter(state, previous=>({...previous,note:{...previous.note,ctResults:'New imaging findings'}}));
    expect(state.aspects).toBe('10');
  });
  it('invalidates ABCD2 review and application across shared inputs or diagnosis changes',()=>{
    let state=newEncounter();state.note={...state.note,diagnosisCategory:'tia',age:'60',presentingBP:'140/90'};
    state=reviewed(state,'abcd2',{tiaConfirmed:true,initialSystolic:'140',initialDiastolic:'90',clinicalFeatures:'weakness',duration:'60plus',diabetes:false});
    state=updateEncounter(state,previous=>applySupplementaryScore(previous,'abcd2'));expect(state.dapt.abcd2).toBe(6);
    state=updateEncounter(state,previous=>({...previous,note:{...previous.note,age:'61'}}));expect(state.dapt.abcd2).toBe('');
    state=updateEncounter(state,previous=>({...previous,note:{...previous.note,age:'60'}}));expect(supplementaryResult(state,'abcd2')).toBeNull();
    state=change(state,'abcd2','reviewed',true);state=updateEncounter(state,previous=>applySupplementaryScore(previous,'abcd2'));
    state=updateEncounter(state,previous=>({...previous,note:{...previous.note,diagnosisCategory:'ischemic'}}));expect(state.dapt.abcd2).toBe('');
  });
  it('requires PASCAL re-review after any RoPE worksheet change, even if RoPE is re-reviewed',()=>{
    let state=newEncounter();state.note.age='45';
    state=reviewed(state,'rope',{cryptogenicStrokeWithPfo:true,hypertension:false,diabetes:false,priorStrokeTia:false,smoker:false,corticalInfarct:true});
    state=reviewed(state,'pascal',{largeShunt:true,atrialSeptalAneurysm:false});expect(supplementaryResult(state,'pascal').category).toBe('Probable');
    state=change(state,'rope','hypertension',true);expect(supplementaryResult(state,'pascal')).toBeNull();
    state=change(state,'rope','reviewed',true);expect(supplementaryResult(state,'rope')).not.toBeNull();expect(supplementaryReviewed(state,'pascal')).toBe(false);expect(supplementaryResult(state,'pascal')).toBeNull();
  });
  it('scores the first TIA BP independently of later treatment measurements',()=>{
    let state=newEncounter();state.note={...state.note,diagnosisCategory:'tia',age:'59',presentingBP:'180/110'};
    const inputs={tiaConfirmed:true,clinicalFeatures:'other',duration:'under10',diabetes:false};
    state=reviewed(state,'abcd2',inputs);
    expect(supplementaryResult(state,'abcd2')).toBeNull();
    state=reviewed(state,'abcd2',{initialSystolic:'140',initialDiastolic:'90'});
    state=updateEncounter(state,previous=>applySupplementaryScore(previous,'abcd2'));
    expect(state.dapt.abcd2).toBe(1);
    state=updateEncounter(state,previous=>({...previous,note:{...previous.note,presentingBP:'120/70'}}));
    expect(supplementaryReviewed(state,'abcd2')).toBe(true);
    expect(supplementaryResult(state,'abcd2').score).toBe(1);
    expect(state.dapt.abcd2).toBe(1);
    state=change(state,'abcd2','initialSystolic','139');
    expect(state.dapt.abcd2).toBe('');expect(supplementaryResult(state,'abcd2')).toBeNull();
    state=change(state,'abcd2','initialDiastolic','89');state=change(state,'abcd2','reviewed',true);
    expect(supplementaryResult(state,'abcd2').score).toBe(0);
    state=change(state,'abcd2','initialDiastolic','');state=change(state,'abcd2','reviewed',true);
    expect(supplementaryResult(state,'abcd2')).toBeNull();
  });
});
