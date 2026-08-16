export const PROTOCOL_SOURCE_META = {
  reviewedOn: '2026-08-16',
  newestAuthoritativeRevision: 'August 2026',
  scope: 'De-identified translation of the current approved stroke protocol source set.',
  sourcePolicy: 'Only the approved protocol source set was used. No outside guideline content was added.',
  audienceNote: 'For trained clinical teams. Confirm the active approved source before clinical action.'
};

export const PROTOCOL_TABS = [
  { id: 'ischemic', label: 'Acute ischemic' },
  { id: 'ich', label: 'ICH' },
  { id: 'complications', label: 'Complications' },
  { id: 'pediatric', label: 'Pediatric' },
  { id: 'sah', label: 'SAH' },
  { id: 'tia', label: 'TIA' },
  { id: 'cvt', label: 'CVT' },
  { id: 'calculators', label: 'Calculators' }
];

export const PROTOCOL_SECTIONS = {
  ischemic: {
    title: 'Acute ischemic stroke',
    revision: 'Primary algorithm revised July 2026; treatment information reviewed August 2026',
    summary: 'Hyperacute evaluation, thrombolysis, thrombectomy, and immediate post-treatment care.',
    sections: [
      {
        title: 'Activate and evaluate',
        badge: 'First 15 minutes',
        items: [
          'Activate the stroke pathway for persistent or fluctuating, potentially disabling symptoms with last known well less than 24 hours.',
          'Obtain a brief history and examination including last known well, NIHSS, and GCS; determine weight.',
          'Proceed directly to noncontrast head CT and CTA. Review imaging jointly as soon as it is available.',
          'Check glucose, electrolytes, CBC, and hemorrhage/coagulation studies; obtain ECG and two large-bore IVs. Avoid urinary catheter placement when feasible.'
        ]
      },
      {
        title: 'Initial imaging branch',
        items: [
          'Blood on CT: move to the ICH or SAH pathway, control blood pressure, reverse coagulopathy, and obtain the appropriate critical-care and procedural consultation.',
          'No blood on CT: evaluate immediately for IV thrombolysis and large-vessel occlusion. Do not let one reperfusion decision delay the other.',
          'For wake-up or unknown-onset disabling deficits, hyperacute MRI uses DWI/ADC, then T2-FLAIR, then GRE. Add time-of-flight MRA when large-vessel occlusion is suspected and CTA is contraindicated.'
        ]
      },
      {
        title: 'IV thrombolysis',
        items: [
          'A disabling deficit is required. A non-disabling deficit does not proceed to IV thrombolysis in this algorithm.',
          'Standard window: last known well 4.5 hours or less, after the required safety pause and eligibility review.',
          'Tenecteplase: 0.25 mg/kg IV bolus, maximum 25 mg.',
          'Alteplase alternative: 0.9 mg/kg IV, maximum 90 mg; give 10% as a bolus and the remainder over 60 minutes.',
          'If glucose is below 50 mg/dL or above 400 mg/dL, correct it and repeat the neurologic examination before deciding.'
        ],
        callout: 'Safety pause: confirm identity, last known well, disabling deficit, imaging, blood pressure, glucose, bleeding risks, anticoagulant exposure, dose, consent, and team agreement before administration.'
      },
      {
        title: 'Extended-window thrombolysis',
        badge: 'Selected patients only',
        items: [
          'For 4.5–9 hours or wake-up/unknown onset, MRI eligibility is based on a DWI-positive, FLAIR-negative mismatch.',
          'For 4.5–24 hours, perfusion eligibility requires ischemic core less than 50 mL, mismatch ratio at least 1.2, salvageable penumbra at least 10 mL, baseline mRS 0–1, and no thrombectomy option.',
          'Document consent for extended-window treatment.'
        ]
      },
      {
        title: 'Key thrombolysis exclusions and individualization',
        items: [
          'Do not treat with intracranial hemorrhage, extensive established hypodensity, severe coagulopathy (platelets below 100,000/µL, INR above 1.7, aPTT above 40 seconds, or PT above 15 seconds), acute aortic arch dissection, infective endocarditis, acute spinal cord injury within 3 months, moderate-to-severe traumatic brain injury within 14 days, intracranial or spinal surgery within 14 days, intra-axial neoplasm, or amyloid-immunotherapy-related imaging abnormalities.',
          'Individualize for recent direct oral anticoagulant exposure, pre-existing disability or frailty, prior stroke or intracranial hemorrhage, recent surgery/trauma/bleeding/puncture, vascular malformation, cranial arterial dissection, recent myocardial infarction or pericarditis, cardiac thrombus, pregnancy/postpartum state, active systemic malignancy, and neurosurgery or traumatic brain injury 14 days to 3 months earlier.',
          'The source set generally favors treatment, when otherwise eligible, for extracranial cervical dissection, extra-axial neoplasm, unruptured aneurysm, angiographic procedural stroke, remote gastrointestinal/genitourinary bleeding, remote myocardial infarction, recreational drug use, diagnostic uncertainty with a possible stroke mimic, and adult moyamoya.'
        ]
      },
      {
        title: 'Direct oral anticoagulant exposure',
        items: [
          'Within 48 hours: consider only for a disabling deficit when thrombectomy is not an option and all other exclusions are cleared.',
          'Where a rapid calibrated assay is available, the primary pathway requires an undetectable direct factor-Xa level.',
          'Where a rapid assay is unavailable, require normal renal function and a documented last dose at least 24 hours earlier; document consent.',
          'More than 48 hours since the last dose: use standard thrombolysis eligibility.'
        ]
      },
      {
        title: 'Endovascular thrombectomy',
        items: [
          'Evaluate patients with NIHSS at least 6, last known well less than 24 hours, and an ICA, MCA, or basilar large-vessel occlusion.',
          'Use the current imaging-selection pathway for early and late windows. Obtain consent for treatment in the 9–24 hour window.',
          'If a patient with suspected large-vessel occlusion has a mild, moderate, or uncertain contrast allergy, the source pathway permits immediate premedication with hydrocortisone 200 mg IV or methylprednisolone 40 mg IV plus diphenhydramine 50 mg IV. Do not use this pathway for known contrast anaphylaxis or cardiovascular collapse.'
        ]
      },
      {
        title: 'Blood pressure and immediate aftercare',
        rows: [
          ['Before IV thrombolysis', 'Below 185/110 mm Hg'],
          ['After IV thrombolysis', 'Below 180/105 mm Hg'],
          ['After thrombectomy', '140–180 mm Hg systolic; avoid below 140 mm Hg unless the treating team individualizes the goal']
        ],
        items: [
          'Maintain systolic pressure above 140 mm Hg during the procedure.',
          'Admit to an ICU-capable setting for at least 24 hours after IV thrombolysis or thrombectomy; complete a swallow screen before oral intake.',
          'After thrombectomy, use a structured handoff, obtain follow-up CT or MRI at 24 hours (earlier when indicated), and discuss persistent pressor dependence with the treating teams.'
        ]
      }
    ]
  },
  ich: {
    title: 'Intracerebral hemorrhage',
    revision: 'Initial-evaluation algorithm revised July 2026; reversal protocol approved September 2025',
    summary: 'Initial leadership, blood-pressure treatment, surgical evaluation, reversal, and monitoring.',
    sections: [
      {
        title: 'Initial evaluation and procedural consultation',
        items: [
          'If imaging suggests an underlying vascular lesion, the procedural service leads the initial pathway. Otherwise, the stroke/critical-care service leads.',
          'Obtain early procedural consultation for intraparenchymal hemorrhage at least 15 mL, symptomatic intraventricular hemorrhage, multicompartment hemorrhage, concerning examination or pupillary trend, or clinician discretion.',
          'Place an external ventricular drain for symptomatic hydrocephalus and consider decompression for life-threatening mass effect.'
        ]
      },
      {
        title: 'Minimally invasive surgery pathway',
        items: [
          'Lobar hemorrhage: consider when volume is 30–80 mL, age 18–80 years, NIHSS above 5, and GCS 5–14.',
          'MINUTE research pathway: basal-ganglia hemorrhage at least 20 mL, NIHSS at least 6, presentation within 15 hours, no vascular lesion, and no clear standard surgical indication.',
          'MIRROR research pathway: adult, supratentorial hemorrhage above 20 mL, NIHSS at least 5, minimally invasive surgery within 24 hours, and no vascular lesion.',
          'MINUTE and MIRROR are research-only pathways, not standard care. Confirm the active research protocol before screening or enrollment.'
        ]
      },
      {
        title: 'Blood-pressure treatment',
        rows: [
          ['Initial SBP 150–219 mm Hg', 'Target 130–150 mm Hg, approximately 140'],
          ['Initial SBP at least 220 mm Hg', 'Reduce by about 20%, never more than 25% in the first hour; then target 140–160'],
          ['After 6 hours / stable repeat imaging', 'Reassess; a 160–180 target may be appropriate'],
          ['Large, severe, surgical, or raised-ICP hemorrhage', 'Individualize; consider 160–180 and maintain cerebral perfusion pressure above 60 mm Hg when ICP is elevated']
        ],
        items: [
          'Use titratable IV therapy such as nicardipine or labetalol. Avoid iatrogenic systolic pressure below 130 mm Hg during the first 24 hours.',
          'Spontaneous autoregulation below 130 mm Hg may be observed if the patient is asymptomatic. Do not initiate pressors solely for that number without multidisciplinary discussion.',
          'Use additional caution with renal vulnerability and reassess the target after repeat imaging.'
        ]
      },
      {
        title: 'Immediate anticoagulant reversal',
        rows: [
          ['Warfarin', 'Vitamin K 10 mg IV plus four-factor PCC 2,000 units IV; recheck INR at 30 minutes and every 6 hours for 24 hours'],
          ['Dabigatran', 'Thrombin time; idarucizumab 5 g IV (two 2.5 g doses no more than 15 minutes apart); PCC 2,000 units if unavailable'],
          ['Factor-Xa inhibitor', 'Direct factor-Xa screen; PCC 2,000 units IV'],
          ['Unfractionated heparin', 'Anti-Xa level; protamine 25 mg IV, then 10 mg more if anti-Xa remains above 0.1; maximum total 55 mg'],
          ['Low-molecular-weight heparin', 'Protamine 50 mg if under 8 hours; 25 mg if 8–24 hours; none after 24 hours']
        ],
        items: [
          'Obtain PT/INR, direct factor-Xa screen, thrombin time, fibrinogen, CBC, and PTT; document agent, last dose, duration, renal/hepatic function, and indication.',
          'If warfarin reversal remains incomplete with INR above 1.5, consider PCC 500 units or plasma 2–4 units with hematology input. Plasma backup starts at 4 units (ideal 15 mL/kg).',
          'If ingestion was less than 2 hours earlier, consider activated charcoal for dabigatran or a factor-Xa inhibitor. Consider dialysis for dabigatran with renal failure.',
          'Stop antiplatelet therapy; platelet transfusion is not routine. Give 2 units of cryoprecipitate when fibrinogen is below 125 mg/dL. Give 2 platelet units below 50,000/µL and 1 unit at 50,000–100,000/µL.',
          'Andexanet is not used in this protocol.'
        ]
      },
      {
        title: 'Monitoring',
        items: [
          'Obtain baseline CT, repeat at 6 hours or sooner for deterioration, and repeat at 24 hours.',
          'Perform hourly neurologic checks for 24 hours, maintain the selected blood-pressure target, and monitor for thrombotic complications after reversal.'
        ]
      }
    ]
  },
  complications: {
    title: 'Treatment complications',
    revision: 'Post-thrombolysis hemorrhage reviewed September 2025; angioedema revised November 2025',
    summary: 'Immediate response to post-thrombolysis hemorrhage, orolingual angioedema, and urgent contrast-allergy premedication.',
    sections: [
      {
        title: 'Suspected hemorrhage after thrombolysis',
        badge: 'Emergency response',
        items: [
          'Suspect with sudden neurologic decline, new headache, acute hypertension, nausea, or vomiting.',
          'Stop the thrombolytic infusion. Obtain STAT noncontrast head CT, hemorrhage/coagulation studies, CBC, and type and crossmatch; notify transfusion services and order 2 units of cryoprecipitate immediately.',
          'If CT is delayed more than 30 minutes and fibrinogen is below 200 mg/dL, give 2 units of cryoprecipitate empirically over 10–30 minutes.',
          'If CT confirms blood: give 2 units of cryoprecipitate and tranexamic acid 1,000 mg IV over 10 minutes; repeat the hemorrhage panel; obtain attending and procedural input; involve hematology if laboratory abnormalities or bleeding remain uncontrolled.',
          'If CT shows no blood, stop any empiric cryoprecipitate infusion, do not restart the thrombolytic, and evaluate other causes. Repeat laboratory assessment every 4 hours until normalized.'
        ]
      },
      {
        title: 'Orolingual angioedema after thrombolysis',
        items: [
          'Assess the airway immediately. Anterior tongue or lip swelling may not require intubation; laryngeal, palatal, floor-of-mouth, or oropharyngeal involvement—or rapid progression within 30 minutes—has greater airway risk.',
          'Stop alteplase if it is infusing and hold ACE-inhibitor therapy.',
          'Give methylprednisolone 125 mg IV, diphenhydramine 50 mg IV, and either ranitidine 50 mg IV or famotidine 20 mg IV.',
          'If worsening, give epinephrine 0.1% solution, 0.3 mL subcutaneously, or 0.5 mL by nebulization; give C1 esterase inhibitor 20 IU/kg IV.',
          'When intubation is needed, awake fiberoptic technique is preferred. Nasotracheal placement carries epistaxis risk.'
        ]
      },
      {
        title: 'Urgent contrast-allergy premedication for suspected LVO',
        items: [
          'Use only for mild, moderate, or uncertain prior contrast reactions. Do not use for known contrast anaphylaxis or cardiovascular collapse.',
          'Immediately before contrast, give hydrocortisone 200 mg IV or methylprednisolone 40 mg IV, plus diphenhydramine 50 mg IV.',
          'Document consent, treating-team approval, and the planned monitoring response.'
        ]
      }
    ]
  },
  pediatric: {
    title: 'Pediatric stroke framework',
    revision: 'Framework dated June 30, 2026',
    summary: 'A source-limited evaluation and treatment framework requiring pediatric specialist review and individualized family discussion.',
    warning: 'This source is an educational framework, not a stand-alone telephone treatment protocol. Pediatric reperfusion is off-label and evidence is limited.',
    sections: [
      {
        title: 'Evaluation',
        items: [
          'Document age, last known well, vascular and systemic risk factors, neurologic examination, and NIHSS or Pediatric NIHSS.',
          'Obtain glucose, CBC, coagulation studies, toxicology testing when relevant, and pregnancy testing when relevant.',
          'MRI with vascular imaging is preferred. CT with CTA is acceptable when the presentation is convincing and MRI would delay care.'
        ]
      },
      {
        title: 'IV thrombolysis',
        items: [
          'Consider for confirmed ischemic stroke with a measurable deficit within 4.5 hours, after individualized multidisciplinary and family discussion.',
          'Age under 2 years is a contraindication. Also address sickle-cell disease, mineralizing lenticulostriate arteriopathy, blood pressure more than 15% above the age-based 95th percentile, and the adult exclusion set.',
          'Tenecteplase: 0.25 mg/kg IV bolus, maximum 25 mg. Alteplase alternative: 0.9 mg/kg IV, maximum 90 mg.'
        ]
      },
      {
        title: 'Endovascular thrombectomy',
        items: [
          'Consider for ICA, M1, proximal dominant M2, or basilar occlusion; NIHSS/Pediatric NIHSS at least 6 or a non-improving moderate-to-severe deficit; and presentation within 24 hours.',
          'Age 6 years or older is the preferred threshold; use caution at ages 4–5. Do not use this framework under age 4, with moyamoya, or with focal cerebral arteriopathy.',
          'Anterior circulation imaging: ASPECTS at least 3 through 6 hours and at least 6 from 6–24 hours; imaging should be obtained within 2 hours of the treatment decision. Posterior circulation treatment may be considered through 24 hours.'
        ]
      },
      {
        title: 'Blood pressure and complications',
        items: [
          'After thrombolysis, treat blood pressure that remains for more than 1 hour at least 15% above the age-based 95th percentile, or treat immediately when at least 20% above that threshold; obtain pediatric critical-care support.',
          'Use the adult complication pathways only with pediatric weight-based medication and specialist/pharmacy review.'
        ]
      }
    ]
  },
  sah: {
    title: 'Subarachnoid hemorrhage',
    revision: 'High-level branch from the July 2026 acute stroke algorithm',
    summary: 'The current extractable source set supports only a high-level acute branch.',
    warning: 'Detailed procedure and order-set content is intentionally not reproduced. Confirm the current approved order set in the clinical system.',
    sections: [
      {
        title: 'Acute branch',
        items: [
          'Obtain CTA of the head after subarachnoid blood is identified.',
          'Obtain urgent procedural consultation and document the Hunt–Hess grade.',
          'Control blood pressure, reverse coagulopathy, and admit to an ICU-capable setting.'
        ]
      }
    ]
  },
  tia: {
    title: 'TIA and minor stroke',
    revision: 'Current note framework modified March 2026; DAPT evidence table modified April 2024',
    summary: 'Source-limited evaluation framework. The source set does not contain a newer stand-alone TIA treatment protocol.',
    sections: [
      {
        title: 'Evaluation and inpatient care elements',
        items: [
          'Use MRI brain with vascular-wall sequences when indicated, or CT/CTA when MRI is unavailable or would delay evaluation.',
          'Obtain ECG and telemetry. Consider echocardiography with bubble study for patients younger than 70 years without atrial fibrillation.',
          'Check lipids and hemoglobin A1c. Individualize antithrombotic choice and blood-pressure goals.',
          'Maintain glucose below 180 mg/dL and address swallow screening, therapy assessments, and venous-thromboembolism prevention as appropriate.'
        ]
      },
      {
        title: 'Dual-antiplatelet evidence table',
        badge: 'Evidence summary, not a dosing policy',
        items: [
          'The available source summarizes minor-stroke/TIA trial populations and treatment durations; it does not establish one universal regimen for every patient.',
          'Select agent, dose, start time, and duration from the current approved medication pathway and the patient’s bleeding and ischemic risks.',
          'The current source set does not support universal pharmacogenetic or thrombophilia testing recommendations.'
        ]
      }
    ]
  },
  cvt: {
    title: 'Cerebral venous thrombosis',
    revision: 'Source gap confirmed during August 2026 reconciliation',
    summary: 'No current CVT algorithm, protocol, or approved recommendation was found in the reviewed source set.',
    warning: 'No clinical recommendation is published here. Use the current approved clinical-system source and specialist consultation.',
    sections: [
      {
        title: 'Why this page is intentionally limited',
        items: [
          'This section is retained so the absence of an approved source is visible rather than silently replaced with outside guidance.',
          'Add content only after a current approved CVT source is placed in the designated protocol source set and reviewed.'
        ]
      }
    ]
  }
};

export const PROTOCOL_SOURCE_REGISTER = [
  { label: 'Acute stroke algorithm', revision: 'July 2026', status: 'Authoritative' },
  { label: 'IV thrombolytic information form', revision: 'August 2026', status: 'Authoritative' },
  { label: 'Endovascular treatment information form', revision: 'August 2026', status: 'Authoritative' },
  { label: 'Stroke pocket-card set', revision: 'May–July 2026', status: 'Authoritative' },
  { label: 'Intracerebral hemorrhage initial-evaluation algorithm', revision: 'June–July 2026', status: 'Authoritative' },
  { label: 'Anticoagulant-reversal protocol', revision: 'September 2025', status: 'Approved' },
  { label: 'Post-thrombolysis hemorrhage protocol', revision: 'September 2025', status: 'Reviewed' },
  { label: 'Thrombolysis-associated angioedema protocol', revision: 'November 2025', status: 'Revised' },
  { label: 'Pediatric stroke framework', revision: 'June 2026', status: 'Current framework' },
  { label: 'TIA/minor-stroke note framework', revision: 'March 2026', status: 'Current framework' },
  { label: 'Minor-stroke/TIA dual-antiplatelet evidence table', revision: 'April 2024', status: 'Evidence summary' }
];

export const EXCLUDED_PENDING_SOURCES = [
  'A proposed direct-to-procedure workflow was excluded because it is not an approved operational algorithm.',
  'A draft acute-ischemic guideline adaptation was excluded because it remains a working draft.',
  'A draft outpatient pathway was excluded because it remains a working draft.'
];

export const SOURCE_BACKED_CALCULATORS = [
  { id: 'gcs', label: 'GCS' },
  { id: 'abcd2', label: 'ABCD²' },
  { id: 'ich', label: 'ICH score' },
  { id: 'abc2', label: 'ABC/2 volume' },
  { id: 'cha2ds2vasc', label: 'CHA₂DS₂-VASc' }
];

export const PROTOCOL_AGENT_BUNDLE = {
  metadata: PROTOCOL_SOURCE_META,
  tabs: PROTOCOL_TABS,
  protocols: PROTOCOL_SECTIONS,
  calculators: SOURCE_BACKED_CALCULATORS,
  sourceRegister: PROTOCOL_SOURCE_REGISTER,
  excludedPendingSources: EXCLUDED_PENDING_SOURCES
};
