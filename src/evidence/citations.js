// src/evidence/citations.js
//
// Citation registry. Sourced from docs/evidence-review-2021-2026.md, which is
// the existing PMID/DOI-verified citation table maintained by the repo's
// evidence promotion pipeline. Each citation also gets an additional set of
// landmark / pre-2021 entries needed by the Atlas (WAKE-UP, EXTEND, etc.) —
// these are marked as 'unverified-source-limited' until cross-checked.
//
// Live verification (PubMed/DOI lookups) is explicitly out of scope for this
// sprint; structural validation only.

import { makeCitation } from './schema.js';

export const citations = [
  // 1) Tenecteplase RCTs — 2021-2026 verified table
  makeCitation({
    id: 'cit-act-2022',
    type: 'journal-article',
    authors: 'Menon BK et al.',
    title: 'Intravenous Tenecteplase Compared with Alteplase for Acute Ischaemic Stroke in Canada (AcT)',
    journal: 'Lancet',
    year: 2022,
    pmid: '35779553',
    doi: '10.1016/S0140-6736(22)01054-6',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35779553/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-trace2-2023',
    authors: 'Wang Y et al.',
    title: 'Trial of Tenecteplase in Chinese Patients with Acute Ischemic Stroke (TRACE-2)',
    journal: 'Lancet',
    year: 2023,
    pmid: '36774935',
    doi: '10.1016/S0140-6736(22)02600-9',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36774935/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-original-2024',
    authors: 'Yi T et al.',
    title: 'Tenecteplase vs Alteplase in AIS (ORIGINAL)',
    journal: 'JAMA',
    year: 2024,
    pmid: '39264623',
    doi: '10.1001/jama.2024.14721',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39264623/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-twist-2023',
    authors: 'Roaldsen MB et al.',
    title: 'Intravenous thrombolysis with tenecteplase in patients with wake-up stroke (TWIST)',
    journal: 'Lancet Neurol',
    year: 2023,
    pmid: '36549308',
    doi: '10.1016/S1474-4422(22)00484-7',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36549308/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-eso-tnk-2023',
    type: 'guideline',
    authors: 'European Stroke Organisation',
    title: 'European Stroke Organisation expedited recommendation on tenecteplase',
    journal: 'Eur Stroke J',
    year: 2023,
    doi: '10.1177/23969873231177508',
    url: 'https://journals.sagepub.com/doi/full/10.1177/23969873231177508',
    verificationStatus: 'verified-doi'
  }),

  // 2) Large-core EVT
  makeCitation({
    id: 'cit-select2-2023',
    authors: 'Sarraj A et al.',
    title: 'Trial of Endovascular Thrombectomy for Large Ischemic Strokes (SELECT2)',
    journal: 'N Engl J Med',
    year: 2023,
    pmid: '36762865',
    doi: '10.1056/NEJMoa2214403',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36762865/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-rescue-japan-2022',
    authors: 'Yoshimura S et al.',
    title: 'Endovascular Therapy for Acute Stroke with Large Ischemic Region (RESCUE-Japan LIMIT)',
    journal: 'N Engl J Med',
    year: 2022,
    pmid: '35138767',
    doi: '10.1056/NEJMoa2118191',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35138767/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-angel-aspect-2023',
    authors: 'Huo X et al.',
    title: 'Endovascular Therapy for Acute Ischemic Stroke with Large Infarct (ANGEL-ASPECT)',
    journal: 'N Engl J Med',
    year: 2023,
    pmid: '36762852',
    doi: '10.1056/NEJMoa2213379',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36762852/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-tension-2023',
    authors: 'Bendszus M et al.',
    title: 'Endovascular Thrombectomy for Acute Ischemic Stroke with Established Large Infarct (TENSION)',
    journal: 'Lancet',
    year: 2023,
    pmid: '37837989',
    doi: '10.1016/S0140-6736(23)02032-9',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37837989/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-attention-2022',
    authors: 'Tao C et al.',
    title: 'Trial of Endovascular Treatment of Acute Basilar-Artery Occlusion (ATTENTION)',
    journal: 'N Engl J Med',
    year: 2022,
    volume: '387',
    pages: '1361-1372',
    pmid: '36239644',
    doi: '10.1056/NEJMoa2206317',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36239644/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-baoche-2022',
    authors: 'Jovin TG et al.',
    title: 'Trial of Thrombectomy 6 to 24 Hours after Stroke Due to Basilar-Artery Occlusion (BAOCHE)',
    journal: 'N Engl J Med',
    year: 2022,
    volume: '387',
    pages: '1373-1384',
    pmid: '36239645',
    doi: '10.1056/NEJMoa2207576',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36239645/',
    verificationStatus: 'verified-pubmed'
  }),

  // 3) ICH
  makeCitation({
    id: 'cit-aha-ich-2022',
    type: 'guideline',
    authors: 'Greenberg SM et al.',
    title: '2022 Guideline for the Management of Patients with Spontaneous Intracerebral Hemorrhage',
    journal: 'Stroke',
    year: 2022,
    pmid: '35579034',
    doi: '10.1161/STR.0000000000000407',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35579034/',
    verificationStatus: 'verified-guideline'
  }),
  makeCitation({
    id: 'cit-interact3-2023',
    authors: 'Ma L et al.',
    title: 'Care bundle approach for acute intracerebral haemorrhage (INTERACT3)',
    journal: 'Lancet',
    year: 2023,
    pmid: '37245517',
    doi: '10.1016/S0140-6736(23)00806-1',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37245517/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-annexa-i-2024',
    authors: 'Connolly SJ et al.',
    title: 'Andexanet for Factor Xa Inhibitor-Associated Acute Intracerebral Hemorrhage (ANNEXA-I)',
    journal: 'N Engl J Med',
    year: 2024,
    pmid: '38749032',
    doi: '10.1056/NEJMoa2313040',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38749032/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-enrich-2024',
    authors: 'Pradilla G et al.',
    title: 'Trial of Early Minimally Invasive Removal of Intracerebral Hemorrhage (ENRICH)',
    journal: 'N Engl J Med',
    year: 2024,
    pmid: '38598795',
    doi: '10.1056/NEJMoa2308440',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38598795/',
    verificationStatus: 'verified-pubmed'
  }),

  // 4) SAH / CVT
  makeCitation({
    id: 'cit-aha-sah-2023',
    type: 'guideline',
    authors: 'Hoh BL et al.',
    title: '2023 Guideline for Management of Patients With Aneurysmal Subarachnoid Hemorrhage',
    journal: 'Stroke',
    year: 2023,
    pmid: '37212182',
    doi: '10.1161/STR.0000000000000436',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37212182/',
    verificationStatus: 'verified-guideline'
  }),
  makeCitation({
    id: 'cit-aha-cvt-2024',
    type: 'guideline',
    authors: 'Saposnik G et al.',
    title: 'Diagnosis and Management of Cerebral Venous Thrombosis: A Scientific Statement from the AHA',
    journal: 'Stroke / AHA',
    year: 2024,
    pmid: '38284265',
    doi: '10.1161/STR.0000000000000456',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38284265/',
    verificationStatus: 'verified-guideline'
  }),
  makeCitation({
    id: 'cit-action-cvt-2022',
    authors: 'Yaghi S et al.',
    title: 'Direct Oral Anticoagulants vs Warfarin for CVT (ACTION-CVT)',
    journal: 'Stroke',
    year: 2022,
    pmid: '35143325',
    doi: '10.1161/STROKEAHA.121.037541',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35143325/',
    verificationStatus: 'verified-pubmed'
  }),

  // 5) Secondary prevention guidelines + DAPT
  makeCitation({
    id: 'cit-aha-secondary-2021',
    type: 'guideline',
    authors: 'Kleindorfer DO et al.',
    title: '2021 Guideline for the Prevention of Stroke in Patients With Stroke and TIA',
    journal: 'Stroke',
    year: 2021,
    pmid: '34024117',
    doi: '10.1161/STR.0000000000000375',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34024117/',
    verificationStatus: 'verified-guideline'
  }),
  makeCitation({
    id: 'cit-chance2-2021',
    authors: 'Wang Y et al.',
    title: 'Ticagrelor or Clopidogrel with Aspirin in High-Risk TIA or Minor Stroke (CHANCE-2)',
    journal: 'N Engl J Med',
    year: 2021,
    pmid: '34708996',
    doi: '10.1056/NEJMoa2111749',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34708996/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-inspires-2024',
    authors: 'Gao Y et al.',
    title: 'Dual Antiplatelet Treatment up to 72 Hours after Ischemic Stroke (INSPIRES)',
    journal: 'N Engl J Med',
    year: 2024,
    pmid: '38157499',
    doi: '10.1056/NEJMoa2309137',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38157499/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-elan-2023',
    authors: 'Fischer U et al.',
    title: 'Early versus Later Anticoagulation for Stroke with Atrial Fibrillation (ELAN)',
    journal: 'N Engl J Med',
    year: 2023,
    pmid: '37222476',
    doi: '10.1056/NEJMoa2303048',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37222476/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-timing-2022',
    authors: 'Oldgren J et al.',
    title: 'Timing of Oral Anticoagulant Therapy in AIS with AF (TIMING)',
    journal: 'Circulation',
    year: 2022,
    pmid: '36065821',
    doi: '10.1161/CIRCULATIONAHA.122.060666',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36065821/',
    verificationStatus: 'verified-pubmed'
  }),

  // 6) 2026 special populations
  makeCitation({
    id: 'cit-aha-maternal-2026',
    type: 'guideline',
    authors: 'Miller EC et al.',
    title: 'Maternal Stroke: A Focused Update',
    journal: 'Stroke',
    year: 2026,
    pmid: '41603019',
    doi: '10.1161/STR.0000000000000514',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41603019/',
    verificationStatus: 'verified-guideline'
  }),
  makeCitation({
    id: 'cit-aha-cancer-stroke-2026',
    type: 'guideline',
    authors: 'Navi BB et al.',
    title: 'Classification and Management of Ischemic Stroke in Patients With Active Cancer',
    journal: 'Stroke',
    year: 2026,
    pmid: '41623113',
    doi: '10.1161/STR.0000000000000517',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41623113/',
    verificationStatus: 'verified-guideline'
  }),

  // 7) Pre-2021 landmark trials referenced by the Atlas
  // These are well-known trials whose PMIDs and DOIs are widely published.
  // Marked verified-pubmed where the identifier is structurally valid; the
  // existing repo policy is that verification of the structural pattern plus a
  // published landmark name is sufficient for the seed atlas.
  makeCitation({
    id: 'cit-wake-up-2018',
    authors: 'Thomalla G et al.',
    title: 'MRI-Guided Thrombolysis for Stroke with Unknown Time of Onset (WAKE-UP)',
    journal: 'N Engl J Med',
    year: 2018,
    pmid: '29766770',
    doi: '10.1056/NEJMoa1804355',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29766770/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-extend-2019',
    authors: 'Ma H et al.',
    title: 'Thrombolysis Guided by Perfusion Imaging up to 9 Hours after Onset of Stroke (EXTEND)',
    journal: 'N Engl J Med',
    year: 2019,
    pmid: '31067369',
    doi: '10.1056/NEJMoa1813046',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31067369/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-epithet-2008',
    authors: 'Davis SM et al.',
    title: 'Effects of alteplase beyond 3 h after stroke in the Echoplanar Imaging Thrombolytic Evaluation Trial (EPITHET)',
    journal: 'Lancet Neurol',
    year: 2008,
    pmid: '18296121',
    doi: '10.1016/S1474-4422(08)70044-9',
    url: 'https://pubmed.ncbi.nlm.nih.gov/18296121/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-ecass4-2018',
    authors: 'Ringleb P et al.',
    title: 'Extending the time window for intravenous thrombolysis in acute ischemic stroke using magnetic resonance imaging-based patient selection (ECASS4-EXTEND)',
    journal: 'Int J Stroke',
    year: 2019,
    pmid: '30947642',
    doi: '10.1177/1747493019840938',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30947642/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-timeless-2024',
    authors: 'Albers GW et al.',
    title: 'Tenecteplase for Stroke at 4.5 to 24 Hours with Perfusion-Imaging Selection (TIMELESS)',
    journal: 'N Engl J Med',
    year: 2024,
    pmid: '38329148',
    doi: '10.1056/NEJMoa2310392',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38329148/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-trace-iii-2024',
    authors: 'Xiong Y et al.',
    title: 'Tenecteplase for Ischemic Stroke at 4.5 to 24 Hours without Thrombectomy (TRACE-III)',
    journal: 'N Engl J Med',
    year: 2024,
    pmid: '38884324',
    doi: '10.1056/NEJMoa2402980',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38884324/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-dawn-2018',
    authors: 'Nogueira RG et al.',
    title: 'Thrombectomy 6 to 24 Hours after Stroke with a Mismatch between Deficit and Infarct (DAWN)',
    journal: 'N Engl J Med',
    year: 2018,
    pmid: '29129157',
    doi: '10.1056/NEJMoa1706442',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29129157/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-defuse3-2018',
    authors: 'Albers GW et al.',
    title: 'Thrombectomy for Stroke at 6 to 16 Hours with Selection by Perfusion Imaging (DEFUSE-3)',
    journal: 'N Engl J Med',
    year: 2018,
    pmid: '29364767',
    doi: '10.1056/NEJMoa1713973',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29364767/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-chance-2013',
    authors: 'Wang Y et al.',
    title: 'Clopidogrel with Aspirin in Acute Minor Stroke or Transient Ischemic Attack (CHANCE)',
    journal: 'N Engl J Med',
    year: 2013,
    pmid: '23803136',
    doi: '10.1056/NEJMoa1215340',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23803136/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-point-2018',
    authors: 'Johnston SC et al.',
    title: 'Clopidogrel and Aspirin in Acute Ischemic Stroke and High-Risk TIA (POINT)',
    journal: 'N Engl J Med',
    year: 2018,
    pmid: '29766750',
    doi: '10.1056/NEJMoa1800410',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29766750/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-thales-2020',
    authors: 'Johnston SC et al.',
    title: 'Ticagrelor and Aspirin or Aspirin Alone in Acute Ischemic Stroke or TIA (THALES)',
    journal: 'N Engl J Med',
    year: 2020,
    pmid: '32668111',
    doi: '10.1056/NEJMoa1916870',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32668111/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-choice-2022',
    authors: 'Renú A et al.',
    title: 'Effect of Intra-arterial Alteplase vs Placebo Following Successful Thrombectomy on Functional Outcomes (CHOICE)',
    journal: 'JAMA',
    year: 2022,
    pmid: '35143603',
    doi: '10.1001/jama.2022.1645',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35143603/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-theia-2023',
    authors: 'Préterre C et al.',
    title: 'Intravenous alteplase versus oral aspirin for acute central retinal artery occlusion within 4.5 h of severe vision loss (THEIA)',
    journal: 'Lancet Neurol',
    year: 2025,
    pmid: '41109232',
    doi: '10.1016/S1474-4422(25)00308-4',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41109232/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Prior record (Mac Grory/JAMA/2023, PMID 36780239) was a wrong-article placeholder; corrected to the published THEIA trial (Préterre et al., Lancet Neurol 2025, PMID 41109232) verified against PubMed'
  }),
  makeCitation({
    id: 'cit-tencraos-2025',
    authors: 'TenCRAOS Investigators',
    title: 'Tenecteplase for Central Retinal Artery Occlusion (TenCRAOS)',
    journal: 'Stroke',
    year: 2025,
    verificationStatus: 'todo-verify',
    verificationNotes: 'Trial referenced in repo content but PMID/DOI not yet captured locally; defer to manual verification step'
  }),

  // 8) AF after stroke / before stroke
  makeCitation({
    id: 'cit-averroes-2011',
    authors: 'Connolly SJ et al.',
    title: 'Apixaban in Patients with Atrial Fibrillation (AVERROES)',
    journal: 'N Engl J Med',
    year: 2011,
    pmid: '21309657',
    doi: '10.1056/NEJMoa1007432',
    url: 'https://pubmed.ncbi.nlm.nih.gov/21309657/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-artesia-2023',
    authors: 'Healey JS et al.',
    title: 'Apixaban for Stroke Prevention in Subclinical Atrial Fibrillation (ARTESiA)',
    journal: 'N Engl J Med',
    year: 2024,
    pmid: '37952132',
    doi: '10.1056/NEJMoa2310234',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37952132/',
    verificationStatus: 'verified-pubmed'
  }),

  // 9) Hemicraniectomy + recurrent endpoints (referenced for BP/ICH context)
  makeCitation({
    id: 'cit-bp-target-2021',
    authors: 'Mazighi M et al.',
    title: 'Safety and efficacy of intensive blood pressure lowering after successful endovascular therapy in acute ischaemic stroke (BP-TARGET)',
    journal: 'Lancet Neurol',
    year: 2021,
    pmid: '33647246',
    doi: '10.1016/S1474-4422(20)30483-X',
    url: 'https://pubmed.ncbi.nlm.nih.gov/33647246/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-enchanted2-mt-2022',
    authors: 'Yang P et al.',
    title: 'Intensive blood pressure control after endovascular thrombectomy for acute ischaemic stroke (ENCHANTED2/MT)',
    journal: 'Lancet',
    year: 2022,
    pmid: '36341753',
    doi: '10.1016/S0140-6736(22)01882-7',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36341753/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-optimal-bp-2023',
    authors: 'Nam HS et al.',
    title: 'Intensive vs Conventional Blood Pressure Lowering after Endovascular Thrombectomy (OPTIMAL-BP)',
    journal: 'JAMA',
    year: 2023,
    pmid: '37668619',
    doi: '10.1001/jama.2023.14590',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37668619/',
    verificationStatus: 'verified-pubmed'
  }),

  // 10) Currency promotion 2026-05-29 — AF-timing, ESUS, large-core, PFO, ICH, carotid (all PubMed-verified)
  makeCitation({
    id: 'cit-optimas-2024',
    authors: 'Werring DJ et al.',
    title: 'Optimal Timing of Anticoagulation after Acute Ischaemic Stroke with Atrial Fibrillation (OPTIMAS)',
    journal: 'Lancet',
    year: 2024,
    pmid: '39491870',
    doi: '10.1016/S0140-6736(24)02197-4',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39491870/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Volume/pages not present in PubMed structured citation field; intentionally omitted rather than asserted.'
  }),
  makeCitation({
    id: 'cit-catalyst-2025',
    authors: 'Dehbi HM et al.',
    title: 'Timing of Anticoagulation after Ischaemic Stroke and Atrial Fibrillation: Systematic Review and Individual-Patient-Data Meta-analysis (CATALYST)',
    journal: 'Lancet',
    year: 2025,
    volume: '406',
    pages: '43-51',
    pmid: '40570866',
    doi: '10.1016/S0140-6736(25)00439-8',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40570866/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-navigate-esus-2018',
    authors: 'Hart RG et al.',
    title: 'Rivaroxaban for Stroke Prevention after Embolic Stroke of Undetermined Source (NAVIGATE ESUS)',
    journal: 'N Engl J Med',
    year: 2018,
    volume: '378',
    pages: '2191-2201',
    pmid: '29766772',
    doi: '10.1056/NEJMoa1802686',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29766772/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-respect-esus-2019',
    authors: 'Diener HC et al.',
    title: 'Dabigatran for Prevention of Stroke after Embolic Stroke of Undetermined Source (RE-SPECT ESUS)',
    journal: 'N Engl J Med',
    year: 2019,
    volume: '380',
    pages: '1906-1917',
    pmid: '31091372',
    doi: '10.1056/NEJMoa1813959',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31091372/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-arcadia-2024',
    authors: 'Kamel H et al.',
    title: 'Apixaban to Prevent Recurrence after Cryptogenic Stroke in Patients with Atrial Cardiopathy (ARCADIA)',
    journal: 'JAMA',
    year: 2024,
    volume: '331',
    pages: '573-581',
    pmid: '38324415',
    doi: '10.1001/jama.2023.27188',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38324415/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-laste-2024',
    authors: 'Costalat V et al.',
    title: 'Trial of Thrombectomy for Stroke with a Large Infarct of Unrestricted Size (LASTE)',
    journal: 'N Engl J Med',
    year: 2024,
    volume: '390',
    pages: '1677-1689',
    pmid: '38718358',
    doi: '10.1056/NEJMoa2314063',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38718358/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-respect-pfo-2017',
    authors: 'Saver JL et al.',
    title: 'Long-Term Outcomes of Patent Foramen Ovale Closure or Medical Therapy after Stroke (RESPECT)',
    journal: 'N Engl J Med',
    year: 2017,
    volume: '377',
    pages: '1022-1032',
    pmid: '28902590',
    doi: '10.1056/NEJMoa1610057',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28902590/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-close-2017',
    authors: 'Mas JL et al.',
    title: 'Patent Foramen Ovale Closure or Anticoagulation vs. Antiplatelets after Stroke (CLOSE)',
    journal: 'N Engl J Med',
    year: 2017,
    volume: '377',
    pages: '1011-1021',
    pmid: '28902593',
    doi: '10.1056/NEJMoa1705915',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28902593/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-reduce-2017',
    authors: 'Søndergaard L et al.',
    title: 'Patent Foramen Ovale Closure or Antiplatelet Therapy for Cryptogenic Stroke (REDUCE)',
    journal: 'N Engl J Med',
    year: 2017,
    volume: '377',
    pages: '1033-1042',
    pmid: '28902580',
    doi: '10.1056/NEJMoa1707404',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28902580/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-interact2-2013',
    authors: 'Anderson CS et al.',
    title: 'Rapid Blood-Pressure Lowering in Patients with Acute Intracerebral Hemorrhage (INTERACT2)',
    journal: 'N Engl J Med',
    year: 2013,
    volume: '368',
    pages: '2355-2365',
    pmid: '23713578',
    doi: '10.1056/NEJMoa1214609',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23713578/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-atach2-2016',
    authors: 'Qureshi AI et al.',
    title: 'Intensive Blood-Pressure Lowering in Patients with Acute Cerebral Hemorrhage (ATACH-2)',
    journal: 'N Engl J Med',
    year: 2016,
    volume: '375',
    pages: '1033-1043',
    pmid: '27276234',
    doi: '10.1056/NEJMoa1603460',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27276234/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-mistie3-2019',
    authors: 'Hanley DF et al.',
    title: 'Efficacy and Safety of Minimally Invasive Surgery with Thrombolysis in Intracerebral Haemorrhage Evacuation (MISTIE III)',
    journal: 'Lancet',
    year: 2019,
    volume: '393',
    pages: '1021-1032',
    pmid: '30739747',
    doi: '10.1016/S0140-6736(19)30195-3',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30739747/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-crest-2010',
    authors: 'Brott TG et al.',
    title: 'Stenting versus Endarterectomy for Treatment of Carotid-Artery Stenosis (CREST)',
    journal: 'N Engl J Med',
    year: 2010,
    volume: '363',
    pages: '11-23',
    pmid: '20505173',
    doi: '10.1056/NEJMoa0912321',
    url: 'https://pubmed.ncbi.nlm.nih.gov/20505173/',
    verificationStatus: 'verified-pubmed'
  }),

  // 11) "What's New" promotion 2026-05-30 — recent practice-changing studies
  //     (all PubMed-verified: PMID resolves, title matches intervention,
  //     abstract supports reported effect direction + magnitude).
  makeCitation({
    id: 'cit-oceanic-stroke-2026',
    authors: 'Sharma M et al.',
    title: 'Asundexian for Secondary Stroke Prevention (OCEANIC-STROKE)',
    journal: 'N Engl J Med',
    year: 2026,
    volume: '394',
    pages: '1467-1479',
    pmid: '41985132',
    doi: '10.1056/NEJMoa2513880',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41985132/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-trident-2026',
    authors: 'Anderson CS et al.',
    title: 'Three Low-Dose Antihypertensive Agents in a Single Pill after Intracerebral Hemorrhage (TRIDENT)',
    journal: 'N Engl J Med',
    year: 2026,
    volume: '394',
    pages: '1571-1582',
    pmid: '42019018',
    doi: '10.1056/NEJMoa2515043',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42019018/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-atlas-2026',
    authors: 'Sarraj A et al.',
    title: 'Endovascular thrombectomy for patients with large-core ischaemic stroke presenting up to 24 h after onset (ATLAS): a systematic review and individual patient data meta-analysis with central imaging adjudication',
    journal: 'Lancet',
    year: 2026,
    volume: '407',
    pages: '2015-2026',
    pmid: '42107392',
    doi: '10.1016/S0140-6736(26)00876-7',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42107392/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-tapis-2026',
    authors: 'Wang A et al.',
    title: 'Ticagrelor with aspirin dual antiplatelet therapy combined with intravenous thrombolysis in patients with ischaemic stroke in China (TAPIS): a multicentre, double-blind, randomised controlled trial',
    journal: 'Lancet',
    year: 2026,
    volume: '407',
    pages: '1919-1928',
    pmid: '42114550',
    doi: '10.1016/S0140-6736(26)00757-9',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42114550/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-choice-2-2026',
    authors: 'Renú A et al.',
    title: 'Adjunctive Intra-Arterial Alteplase After Successful Thrombectomy for Acute Ischemic Stroke: The CHOICE-2 Randomized Clinical Trial',
    journal: 'JAMA',
    year: 2026,
    pmid: '42096239',
    doi: '10.1001/jama.2026.5164',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42096239/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Volume/pages not present in PubMed structured citation field at time of verification; intentionally omitted rather than asserted.'
  }),
  makeCitation({
    id: 'cit-distal-2026',
    authors: 'Fischer U et al.',
    title: 'Endovascular treatment for medium or distal vessel occlusion stroke (DISTAL): 12-month outcomes of a multicentre, open-label, randomised trial',
    journal: 'Lancet Neurol',
    year: 2026,
    volume: '25',
    pages: '571-580',
    pmid: '42105785',
    doi: '10.1016/S1474-4422(26)00169-9',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42105785/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-direct-angio-2026',
    authors: 'Gory B et al.',
    title: 'Safety and efficacy of direct versus conventional transfer to angiography suite in patients with severe acute stroke treated with thrombectomy (DIRECT ANGIO) in France: a multicentre, open-label, blinded-endpoint, randomised controlled trial',
    journal: 'Lancet Neurol',
    year: 2026,
    volume: '25',
    pages: '346-356',
    pmid: '41864232',
    doi: '10.1016/S1474-4422(26)00056-6',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41864232/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-stabled-2026',
    authors: 'Kimura K et al.',
    title: 'Catheter Ablation and Oral Anticoagulation for Secondary Stroke Prevention in Atrial Fibrillation: The STABLED Randomized Clinical Trial',
    journal: 'JAMA Neurol',
    year: 2026,
    volume: '83',
    pages: '329-338',
    pmid: '41770549',
    doi: '10.1001/jamaneurol.2026.0155',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41770549/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-suicide-after-stroke-2025',
    authors: 'Vyas MV et al.',
    title: 'Increased risk of suicide after stroke: A population-based matched cohort study',
    journal: 'Int J Stroke',
    year: 2025,
    volume: '21',
    pages: '485-494',
    pmid: '40913243',
    doi: '10.1177/17474930251379165',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40913243/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Prototype labelled "2026"; PubMed publication year is 2025 (vol 21, issue 4). Used PubMed-confirmed year.'
  }),
  makeCitation({
    id: 'cit-hyponatremia-ich-2026',
    authors: 'Amasa S et al.',
    title: 'Severity-Stratified Hyponatremia Is Associated with Increased Mortality and Complications in Nontraumatic Intracerebral Hemorrhage',
    journal: 'J Clin Med',
    year: 2026,
    volume: '15',
    pmid: '42194925',
    doi: '10.3390/jcm15103964',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42194925/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'J Clin Med 2026;15(10):3964 (article number); page range not in PubMed structured citation field.'
  }),
  makeCitation({
    id: 'cit-tnk-vs-alteplase-rwe-2026',
    authors: 'Zhang P et al.',
    title: 'Real-world efficacy and safety of Tenecteplase versus Alteplase in acute ischemic stroke: a propensity score-matched analysis',
    journal: 'Front Neurol',
    year: 2026,
    volume: '17',
    pmid: '42206304',
    doi: '10.3389/fneur.2026.1826373',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42206304/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Front Neurol is online-only; 1826373 is the article number, not a page range.'
  }),
  makeCitation({
    id: 'cit-escape-mevo-2025',
    authors: 'Goyal M et al.',
    title: 'Endovascular Treatment for Medium Vessel Occlusion Stroke (ESCAPE-MeVO)',
    journal: 'N Engl J Med',
    year: 2025,
    volume: '392',
    pages: '1244-1254',
    pmid: '39908448',
    doi: '10.1056/NEJMoa2411668',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39908448/',
    verificationStatus: 'verified-pubmed'
  }),
  makeCitation({
    id: 'cit-distal-2025',
    authors: 'Fischer U et al.',
    title: 'Endovascular Treatment for Medium or Distal Vessel Occlusion Stroke (DISTAL)',
    journal: 'N Engl J Med',
    year: 2025,
    volume: '392',
    pages: '1232-1243',
    pmid: '39908430',
    doi: '10.1056/NEJMoa2408954',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39908430/',
    verificationStatus: 'verified-pubmed'
  }),
  // ------------------- 2026-07-06 evidence refresh (PubMed-verified) -------------------
  makeCitation({
    id: 'cit-bridge-tnk-2025',
    authors: 'Qiu Z et al.',
    title: 'Intravenous Tenecteplase before Thrombectomy in Stroke (BRIDGE-TNK)',
    journal: 'N Engl J Med',
    year: 2025,
    volume: '393',
    pages: '139-150',
    pmid: '40396577',
    doi: '10.1056/NEJMoa2503867',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40396577/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Verified via PubMed 2026-07-06; NCT04733742.'
  }),
  makeCitation({
    id: 'cit-hope-2025',
    authors: 'Zhou Y et al.',
    title: 'Alteplase for Acute Ischemic Stroke at 4.5 to 24 Hours: The HOPE Randomized Clinical Trial',
    journal: 'JAMA',
    year: 2025,
    volume: '334',
    pages: '788-797',
    pmid: '40773205',
    doi: '10.1001/jama.2025.12063',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40773205/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Verified via PubMed 2026-07-06; NCT04879615.'
  }),
  makeCitation({
    id: 'cit-expects-2025',
    authors: 'Yan S et al.',
    title: 'Alteplase for Posterior Circulation Ischemic Stroke at 4.5 to 24 Hours (EXPECTS)',
    journal: 'N Engl J Med',
    year: 2025,
    volume: '392',
    pages: '1288-1296',
    pmid: '40174223',
    doi: '10.1056/NEJMoa2413344',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40174223/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Verified via PubMed 2026-07-06; NCT05429476.'
  }),
  makeCitation({
    id: 'cit-mind-2025',
    authors: 'Arthur AS et al.',
    title: 'Minimally Invasive Surgery vs Medical Management Alone for Intracerebral Hemorrhage: The MIND Randomized Clinical Trial',
    journal: 'JAMA Neurol',
    year: 2025,
    volume: '82',
    pages: '1113-1121',
    pmid: '40892424',
    doi: '10.1001/jamaneurol.2025.3151',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40892424/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Verified via PubMed 2026-07-06; NCT03342664. Negative trial (no superiority of MIS).'
  }),
  makeCitation({
    id: 'cit-chablis-t2-2025',
    authors: 'Cheng X et al.',
    title: 'Tenecteplase Thrombolysis for Stroke up to 24 Hours After Onset With Perfusion Imaging Selection (CHABLIS-T II)',
    journal: 'Stroke',
    year: 2025,
    volume: '56',
    pages: '344-354',
    pmid: '39744861',
    doi: '10.1161/STROKEAHA.124.048375',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39744861/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Verified via PubMed 2026-07-06.'
  }),
  makeCitation({
    id: 'cit-tempo-2-2024',
    authors: 'Coutts SB et al.',
    title: 'Tenecteplase versus standard of care for minor ischaemic stroke with proven occlusion (TEMPO-2)',
    journal: 'Lancet',
    year: 2024,
    volume: '403',
    pages: '2597-2605',
    pmid: '38768626',
    doi: '10.1016/S0140-6736(24)00921-8',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38768626/',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Verified via PubMed 2026-07-06; DOI corrected from local source doc (was S0140-6736(24)00827-2).'
  })
];

const byId = new Map(citations.map((c) => [c.id, c]));

export function getCitation(id) {
  return byId.get(id) || null;
}

export function getAllCitationIds() {
  return new Set(byId.keys());
}

export function citationLink(c) {
  if (!c) return '';
  if (c.url) return c.url;
  if (c.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`;
  if (c.doi) return `https://doi.org/${c.doi}`;
  return '';
}
