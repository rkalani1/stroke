import { describe, it, expect } from 'vitest';
import { GUIDELINE_LIBRARY_INDEX } from '../src/guideline-library.js';
import { recommendations } from '../src/evidence/recommendations.js';
const doc = id => GUIDELINE_LIBRARY_INDEX.find(d => d.id === id);
const all = GUIDELINE_LIBRARY_INDEX.flatMap(d => d.recommendations);
const row = id => all.find(r => r.id === id);

describe('source-grounded safety qualifier repairs', () => {
  it('keeps dissection warning features on the vascular side of the TIA table', () => {
    expect(row('tia-ed-2023-8').text).toMatch(/headache with ptosis and miosis.*dissection/i);
    expect(row('tia-ed-2023-9').text).not.toMatch(/ptosis|miosis|dissection/);
  });
  it('retains exclusions and timing when recommending anticoagulant combinations', () => {
    expect(row('aha-af-guideline-2023-32').text).toMatch(/excluding patients with mechanical valves/);
    expect(row('aha-af-guideline-2023-148').text).toMatch(/risk of cardioversion and stroke/);
    for (const id of ['secondary-prevention-2021-91','secondary-prevention-2021-93']) expect(row(id).text).toContain('before valve replacement');
  });
  it('distinguishes acute GI bleeding from elective endoscopy and major CVT recurrence risks', () => {
    const gi = row('systemic-complications-2024-24').text;
    expect(gi).toMatch(/cardiac aspirin.*secondary prevention/);
    expect(gi).toMatch(/P2Y12.*elective endoscopy, not a blanket acute-bleeding instruction/);
    expect(row('cvt-2024-5').text).toContain('chronic major risk factors');
    expect(row('cvt-2024-34').text).toMatch(/59\/417.*14\.1%.*38\/297.*12\.8%/);
    expect(row('cvt-2024-34').text).toMatch(/resolved or nonocclusive thrombus at 6 weeks/);
  });
  it('restores risk strata, pediatric exception, sodium and pregnancy measurement qualifiers', () => {
    expect(row('aha-dyslipidemia-2026-4-2-3-6-2').text).toMatch(/intermediate-risk or selected borderline-risk/);
    expect(row('aha-dyslipidemia-2026-4-2-8-1-2').text).toMatch(/Homozygous FH.*at diagnosis.*infancy/);
    expect(row('aha-hypertension-guideline-2025-5-1-3').text).toContain('severe symptomatic orthostatic hypotension');
    expect(row('aha-hypertension-guideline-2025-5-5-4').text).toMatch(/two occasions at least 4 hours apart.*Severe hypertension.*do not delay/);
  });
  it('does not move the retinal BP target into the renal injury column', () => {
    expect(row('aha-acute-bp-management-2024-14').text).toMatch(/Retina.*MAP decline of 15%\. Kidney.*MAP decline 20%-25%/);
  });
});

describe('native recommendation identity and bounded source access', () => {
  it('identifies the corrected late-window population and the withdrawal requester', () => {
    const late = recommendations.find(r => r.id === 'rec-late-window-ivt');
    expect(late.text).toContain('patients ineligible for EVT');
    expect(late.sourceUrl).toBe('https://doi.org/10.1161/STR.0000000000000530');
    expect(late.caveats.join(' ')).toMatch(/item 13.*added EVT-ineligibility/);
    expect(late.caveats.join(' ')).toContain('not the separately described ESO expert consensus');
    const reversal = recommendations.find(r => r.id === 'rec-ich-anticoag-reversal-fxa');
    expect(reversal.caveats.join(' ')).toContain('AstraZeneca submitted a request for voluntary BLA withdrawal');
    expect(reversal.caveats.join(' ')).not.toContain('FDA concluded that US Andexxa risks outweighed benefits and requested');
  });
  it('does not convert NCS GRADE into an AHA class or generalize certainty across hemorrhage types', () => {
    const r = recommendations.find(r => r.id === 'rec-ich-anticoag-reversal-fxa');
    expect(r).toMatchObject({ gradingSystem:'GRADE', nativeStrength:'Conditional', nativeCertainty:'Moderate', classOfRecommendation:null, levelOfEvidence:null });
    expect(r.sourceUrl).toContain('s12028-026-02601-4');
    expect(r.caveats.join(' ')).toMatch(/traumatic.*very low certainty/);
    const ncs=doc('ncs-reversal-2026');
    expect(ncs.recommendations).toHaveLength(8);
    expect(ncs.recommendations.filter(r=>r.classOfRec==='No recommendation')).toHaveLength(3);
    expect(row('ncs-reversal-2026-2-2').text).toMatch(/aspirin.*neurosurgical/);
  });
  it('restores missing uncertainty without grading separate expert consensus as evidence', () => {
    expect(all.filter(r=>r.id.startsWith('eso2-my-missing-'))).toHaveLength(12);
    expect(all.filter(r=>r.id.startsWith('eso2-sp-missing-'))).toHaveLength(8);
    for(const r of all.filter(r=>r.id.startsWith('eso2-'))) expect(r).toMatchObject({classOfRec:'No recommendation',sourceStatementType:'recommendation'});
    expect(doc('eso-pfo-2024').coverage).toMatchObject({sourceRecommendationCount:10,sourceConsensusCount:14});
    expect(all.filter(r=>r.id.startsWith('ncs-ais-prognosis-mortality-'))).toHaveLength(9);
  });
  it('preserves native CAA strength and withholds conflicting DSA pressure or direction', () => {
    expect(doc('caa-icaa-wso-2025').recommendations.filter(r=>r.classOfRec==='Strong')).toHaveLength(26);
    expect(doc('caa-icaa-wso-2025').recommendations.filter(r=>r.classOfRec==='Weak')).toHaveLength(20);
    for(const id of ['svin-dsa-t1-c','svin-dsa-t2-g'])expect(row(id)).toMatchObject({classOfRec:'Statement',levelOfEvidence:'Ungraded',sourceConflict:true});
    expect(row('svin-dsa-t2-g').text).not.toMatch(/750|200 PSI|150 PSI/);
    expect(row('svin-dsa-collaterals-2025-9').text).not.toMatch(/150-750/);
    expect(row('svin-dsa-t2-f').levelOfEvidence).toBe('EO-V');
  });
  it('retains source-limited documents and separates extraction from corrected currency', () => {
    expect(GUIDELINE_LIBRARY_INDEX).toHaveLength(110);
    expect(all).toHaveLength(4171);
    expect(doc('aha-stroke-rehabilitation-2026').recommendationCount).toBe(0);
    expect(doc('ais-2026').coverageComplete).toBe(true);
    expect(doc('ais-2026').hasUnresolvedUpdates).toBe(true);
    expect(doc('aha-standards-postacute-rehabilitation-2025').documentType).toBe('report');
    expect(GUIDELINE_LIBRARY_INDEX.every(d=>d.sourceReview?.scope)).toBe(true);
  });
  it('keeps the 2026 updated recommendations distinct from their dated predecessors', () => {
    expect(row('ncs-sccm-antithrombotic-reversal-2016-69').currentEvidenceNote).toMatch(/no recommendation.*not a recommendation against/);
    expect(row('eso-dysphagia-2021-20').currentEvidenceNote).toMatch(/insufficient evidence.*separate expert consensus.*solely for prevention outside clinical trials/);
    expect(row('tia-ed-2023-57').currentEvidenceNote).toMatch(/<55.*<70.*ezetimibe and\/or/);
  });
});
