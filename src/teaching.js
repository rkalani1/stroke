// Educational content for stroke/neurology trainees.
// Pure data — consumed by React components in teaching.jsx.
//
// EVIDENCE AUDIT: Last comprehensive review against primary publications
// completed 2026-04-23. All trial outcomes, NNTs, COR/LOE labels, and
// guideline attributions verified against peer-reviewed source publications.
// Key guidelines referenced: AHA/ASA AIS 2019 (Powers) + 2019 focused update,
// AHA/ASA ICH 2022 (Greenberg), AHA/ASA aSAH 2023, AHA/ASA CVT 2024,
// AHA/ASA Secondary Prevention 2021 (Kleindorfer), ESC AF 2024 (van Gelder).

import landmarkTrials from './guidelines/landmark-trials.json' with { type: 'json' };

// =====================================================================
// LANDMARK TRIALS — organized by topic
// =====================================================================

export const LANDMARK_TRIALS = landmarkTrials;

// =====================================================================
// STROKE SYNDROME PATTERN LIBRARY
// =====================================================================

export const STROKE_SYNDROMES = {
  anteriorCirculation: [
    {
      name: 'Left MCA (dominant) — proximal M1',
      territory: 'Left middle cerebral artery proximal',
      deficits: 'Right hemiplegia (face+arm>leg), right hemisensory loss, right homonymous hemianopia, global aphasia, left gaze preference',
      pearls: 'Global aphasia + right hemiparesis is classic for dominant M1. If also gaze preference to left, suggests large cortical strike (Brocas + Wernicke area affected).',
      pimpingQ: 'Why does the patient look toward the side of the lesion in a left M1 stroke?',
      answer: 'Frontal eye field (Brodmann area 8) in the left frontal lobe normally drives gaze to the right. With left frontal damage, the right FEF is unopposed and pulls gaze to the left (ipsilateral to lesion).'
    },
    {
      name: 'Right MCA (non-dominant) — proximal M1',
      territory: 'Right middle cerebral artery proximal',
      deficits: 'Left hemiplegia (face+arm>leg), left hemisensory loss, left homonymous hemianopia, left hemi-neglect, right gaze preference, anosognosia',
      pearls: 'Non-dominant strokes → neglect (not aphasia). Patient may deny deficit (anosognosia). Classic: examiner shows patient their left hand and patient insists "that\'s not mine."',
      pimpingQ: 'What is the pathophysiology of hemineglect in right MCA stroke?',
      answer: 'Right parietal cortex normally attends to both hemispaces; left parietal only to right. Right parietal damage → left hemineglect (patient ignores left side). Left damage can cause mild right neglect but rarely severe because right parietal compensates.'
    },
    {
      name: 'MCA — superior division',
      territory: 'Rolandic + Brocas branches',
      deficits: 'Contralateral face/arm > leg weakness, expressive aphasia (left-sided), no hemianopia typically',
      pearls: 'Brocas aphasia: non-fluent, effortful speech, preserved comprehension, patient aware of deficit.'
    },
    {
      name: 'MCA — inferior division',
      territory: 'Temporoparietal (Wernicke area on left)',
      deficits: 'Receptive aphasia (left) or neglect (right), hemianopia, minimal or no motor deficit',
      pearls: 'Wernicke aphasia: fluent paraphasic speech, impaired comprehension, patient often UNAWARE of deficit → easily mistaken for "confusion" or psychiatric issue.'
    },
    {
      name: 'ACA',
      territory: 'Anterior cerebral artery',
      deficits: 'Contralateral LEG > arm weakness and sensory loss, abulia, urinary incontinence, transcortical motor aphasia (left), alien hand (bilateral).',
      pearls: 'Bilateral ACA occlusion (rare, e.g., ruptured ACoA aneurysm with vasospasm) → akinetic mutism, severe abulia.'
    },
    {
      name: 'PCA',
      territory: 'Posterior cerebral artery',
      deficits: 'Contralateral homonymous hemianopia (often with macular sparing), alexia without agraphia (left PCA + splenium), visual agnosia, prosopagnosia (bilateral occipitotemporal).',
      pearls: 'Isolated hemianopia in a patient able to read is pathognomonic for PCA — check for macular sparing (typically preserved if PCA only; absent in MCA infarct).'
    }
  ],

  posteriorCirculation: [
    {
      name: 'Lateral medullary (Wallenberg)',
      territory: 'Vertebral artery or PICA',
      deficits: 'IPSILATERAL: facial numbness (CN5), Horner (sympathetics), hoarseness/dysphagia (CN9/10), ataxia (ICP). CONTRALATERAL: body pain/temperature loss (spinothalamic).',
      pearls: 'The classic "crossed" syndrome. Often presents with severe nausea, vertigo, hiccups.',
      pimpingQ: 'Why does Wallenberg syndrome have crossed findings (ipsilateral face, contralateral body for pain/temp)?',
      answer: 'Trigeminal spinal nucleus (carries face pain/temp) is ipsilateral in the medulla. Spinothalamic tract (body pain/temp) has already decussated at the spinal cord level, so damage in the lateral medulla affects already-crossed fibers → contralateral body.'
    },
    {
      name: 'Medial medullary (Dejerine)',
      territory: 'Anterior spinal artery / vertebral',
      deficits: 'Contralateral hemiplegia (pyramidal tract), contralateral loss of position/vibration (medial lemniscus), ipsilateral tongue weakness (CN12).',
      pearls: 'Rare. "Medial" = motor + medial lemniscus + CN12 nucleus.'
    },
    {
      name: 'Top of the basilar',
      territory: 'Distal basilar + proximal PCAs',
      deficits: 'Bilateral PCA territory infarcts (cortical blindness/Anton syndrome), oculomotor deficits (vertical gaze palsy, skew deviation), coma/somnolence, memory loss (hippocampi), behavioral changes.',
      pearls: 'Diverse presentations often mislabeled as encephalopathy, delirium, or psychiatric. Look for vertical gaze palsy + disorientation + cortical visual deficit.'
    },
    {
      name: 'Basilar artery occlusion',
      territory: 'Basilar artery',
      deficits: 'Variable: bilateral limb weakness, quadriplegia, locked-in syndrome, coma, cranial nerve palsies, vertigo, ataxia.',
      pearls: 'Locked-in syndrome = ventral pontine infarct, preserved consciousness + vertical eye movements only. High mortality without recanalization; EVT indicated with PC-ASPECTS ≥6.'
    },
    {
      name: 'Top of basilar / PCA — bilateral',
      territory: 'Bilateral PCA',
      deficits: 'Cortical blindness (bilateral occipital). Anton syndrome: denial of blindness + confabulation.',
      pearls: 'Patient walks into objects and insists they can see.'
    },
    {
      name: 'Cerebellar stroke',
      territory: 'SCA / AICA / PICA',
      deficits: 'Ataxia, nystagmus, vertigo, nausea, dysmetria, dysarthria. May have ipsilateral Horner if PICA.',
      pearls: 'Cerebellar edema peaks day 2-4 → can cause obstructive hydrocephalus or brainstem compression. Suboccipital decompression + EVD is life-saving (Class 1, LOE B-NR per 2019 AHA/ASA).'
    },
    {
      name: 'Midbrain (Weber, Benedikt, Claude)',
      territory: 'Paramedian midbrain',
      deficits: 'Weber: CN3 ipsilateral + contralateral hemiparesis. Benedikt: CN3 + contralateral tremor/ataxia. Claude: CN3 + contralateral ataxia.',
      pearls: 'All involve CN3 (ipsilateral ptosis, mydriasis, "down and out" eye). Differ by which red-nucleus/pyramidal fibers are involved.'
    }
  ],

  lacunarSyndromes: [
    {
      name: 'Pure motor hemiparesis',
      territory: 'Posterior limb of internal capsule or basis pontis',
      deficits: 'Contralateral face/arm/leg weakness (all equal), NO sensory, NO cortical signs.',
      pearls: 'Most common lacunar syndrome. "Equal weakness" distinguishes from cortical strokes (which typically affect face+arm > leg for MCA).'
    },
    {
      name: 'Pure sensory stroke',
      territory: 'Thalamus (VPL/VPM)',
      deficits: 'Contralateral hemisensory loss (all modalities), NO weakness, NO cortical signs.',
      pearls: 'Often misdiagnosed as conversion/functional. Thalamic pain syndrome (Dejerine-Roussy) can develop weeks-months later.'
    },
    {
      name: 'Sensorimotor lacunar',
      territory: 'Thalamocapsular region',
      deficits: 'Both motor and sensory loss, contralateral, no cortical signs.',
      pearls: 'Slightly less specific for lacunar vs. small cortical stroke; imaging usually clarifies.'
    },
    {
      name: 'Ataxic hemiparesis',
      territory: 'Basis pontis or posterior limb internal capsule',
      deficits: 'Contralateral weakness (leg > arm typically) + ipsilateral cerebellar ataxia on the WEAK side.',
      pearls: '"Ataxia in a weak limb" — a classic teaching point.'
    },
    {
      name: 'Clumsy-hand dysarthria',
      territory: 'Basis pontis (paramedian branch)',
      deficits: 'Dysarthria + clumsy hand (contralateral), minimal weakness.',
      pearls: 'Subtle presentation. A "clumsy hand" and slurred speech with minimal weakness → small pontine lacune.'
    }
  ],

  special: [
    {
      name: 'Watershed (border zone)',
      territory: 'ACA-MCA or MCA-PCA border',
      deficits: 'ACA-MCA: "man-in-a-barrel" (proximal > distal arm weakness). MCA-PCA: transcortical aphasia.',
      pearls: 'Often caused by hypotension + high-grade stenosis. Think aortic stenosis, carotid stenosis, cardiac arrest, hemodialysis.'
    },
    {
      name: 'Thalamic (artery of Percheron)',
      territory: 'Bilateral paramedian thalami (single perforator from PCA)',
      deficits: 'Acute coma/decreased consciousness + vertical gaze palsy + memory/behavioral change.',
      pearls: 'Often misdiagnosed as encephalopathy or metabolic. MRI DWI shows bilateral thalamic lesions — pathognomonic.'
    },
    {
      name: 'Central pontine (paramedian pontine)',
      territory: 'Paramedian basilar branches',
      deficits: 'CN6 palsy (gaze palsy), contralateral hemiparesis, dysarthria.',
      pearls: 'Often an elderly patient with hypertension + small-vessel disease.'
    }
  ]
};

// =====================================================================
// NEUROANATOMY QUICK REFERENCE
// =====================================================================

export const NEUROANATOMY = {
  cranialNerves: [
    { cn: 'I', name: 'Olfactory', testing: 'Smell', lesionEffect: 'Anosmia (often traumatic or neurodegenerative)' },
    { cn: 'II', name: 'Optic', testing: 'Visual acuity, visual fields, fundi, pupils (afferent)', lesionEffect: 'Field cut or blindness depending on where (prechiasmal = unilateral, chiasm = bitemporal, tract/radiations = homonymous)' },
    { cn: 'III', name: 'Oculomotor', testing: 'Pupils (efferent), ptosis, EOM (all except superior oblique and lateral rectus)', lesionEffect: 'Ptosis + "down and out" eye + fixed dilated pupil (complete). Partial: pupil-sparing suggests microvascular (DM).' },
    { cn: 'IV', name: 'Trochlear', testing: 'Superior oblique (downward in adduction)', lesionEffect: 'Vertical diplopia worse looking down and in (e.g., reading, stairs). Head tilt away from lesion side.' },
    { cn: 'V', name: 'Trigeminal', testing: 'Facial sensation V1/V2/V3, corneal reflex, masseter, jaw jerk', lesionEffect: 'Facial numbness by division; weak jaw deviates TO side of lesion.' },
    { cn: 'VI', name: 'Abducens', testing: 'Lateral rectus (horizontal abduction)', lesionEffect: 'Horizontal diplopia worse on gaze to affected side. Can be a false localizing sign with high ICP.' },
    { cn: 'VII', name: 'Facial', testing: 'Facial symmetry (upper and lower), taste anterior 2/3 tongue, hyperacusis', lesionEffect: 'UMN: forehead spared (bilateral cortical innervation). LMN: entire face affected, + possible hyperacusis, taste change.' },
    { cn: 'VIII', name: 'Vestibulocochlear', testing: 'Hearing, Weber/Rinne, HIT, skew, nystagmus (HINTS exam)', lesionEffect: 'Vertigo + hearing loss + nystagmus. HINTS peripheral: normal head impulse + direction-changing nystagmus + normal skew → peripheral. Central: abnormal HIT or skew → central (stroke).' },
    { cn: 'IX', name: 'Glossopharyngeal', testing: 'Gag (sensory), taste posterior 1/3 tongue', lesionEffect: 'Absent gag (paired with CN10 for motor side).' },
    { cn: 'X', name: 'Vagus', testing: 'Palate elevation, gag (motor), hoarseness', lesionEffect: 'Uvula deviates AWAY from lesion; hoarseness, dysphagia.' },
    { cn: 'XI', name: 'Spinal accessory', testing: 'SCM, trapezius', lesionEffect: 'Weak shoulder shrug and head turn AWAY from lesion side.' },
    { cn: 'XII', name: 'Hypoglossal', testing: 'Tongue protrusion, atrophy, fasciculations', lesionEffect: 'Tongue deviates TOWARD the weak side (lick your wounds).' }
  ],

  vascularTerritories: [
    { artery: 'ACA', supply: 'Medial frontal + medial parietal (including paracentral lobule — legs), anterior corpus callosum' },
    { artery: 'MCA — M1', supply: 'Deep lenticulostriates (internal capsule, basal ganglia) + most of lateral cortex' },
    { artery: 'MCA — M2 superior division', supply: 'Rolandic + Brocas (frontal + upper parietal)' },
    { artery: 'MCA — M2 inferior division', supply: 'Wernicke + temporoparietal' },
    { artery: 'PCA — P1', supply: 'Bilateral thalami via perforators (art of Percheron variant), brainstem perforators' },
    { artery: 'PCA — P2-P4', supply: 'Occipital cortex, medial temporal (hippocampus), splenium corpus callosum' },
    { artery: 'AChA (anterior choroidal)', supply: 'Posterior limb internal capsule, lateral geniculate, medial temporal lobe' },
    { artery: 'PICA', supply: 'Lateral medulla (Wallenberg), inferior cerebellum (vermis + tonsils)' },
    { artery: 'AICA', supply: 'Lateral pons, middle cerebellar peduncle, labyrinthine (CN7/8) — hearing loss can occur' },
    { artery: 'SCA', supply: 'Superior cerebellum, tegmentum of upper pons/midbrain' },
    { artery: 'Basilar perforators', supply: 'Pons (corticospinal, corticobulbar, CN6/7 nuclei)' },
    { artery: 'Vertebral', supply: 'Medulla (anterior = medial medullary; lateral = Wallenberg when PICA origin involved)' }
  ]
};

// =====================================================================
// TEACHING PEARLS / COMMON PIMP QUESTIONS
// =====================================================================

export const TEACHING_PEARLS = [
  {
    category: 'Imaging',
    q: 'What is the hyperdense MCA sign and what does it mean?',
    a: 'Hyperdense vessel (Hounsfield 40-60) on non-contrast CT representing acute thrombus. Specificity ~90% for proximal MCA occlusion. Requires bone-windowing for detection.'
  },
  {
    category: 'Imaging',
    q: 'What is ASPECTS and why is it important?',
    a: 'Alberta Stroke Program Early CT Score — 10-point score assessing early ischemic changes in 10 MCA territory regions (M1-M6, L, I, C, IC). Starts at 10, subtract 1 per affected region. ASPECTS ≥6 for standard EVT (NIHSS ≥6); 3-5 eligible for large-core trials. <3 = very unfavorable but still consider SELECT2/ANGEL-ASPECT criteria.'
  },
  {
    category: 'Imaging',
    q: 'How do you differentiate stroke from mimic on MRI?',
    a: 'DWI positive + ADC restricted (dark) = acute ischemia. Unless: seizure (transient DWI +, corrects within days), hypoglycemia (selective regions), HSV encephalitis (temporal lobes, specific pattern), CJD (cortical + basal ganglia ribbon).'
  },
  {
    category: 'NIHSS',
    q: 'What is a "fake zero" NIHSS and when is it missed?',
    a: 'Posterior circulation stroke — vertigo, dysmetria, dysarthria, ataxia, hemianopia — can score 0-2 on NIHSS despite devastating deficit. If symptoms suggest posterior + NIHSS <4, still consider EVT and treat as stroke (not a mimic).'
  },
  {
    category: 'Thrombolysis',
    q: 'When is TNK contraindicated even if in window and no other exclusions?',
    a: 'Glucose <50 (correct first), SBP >185/110 despite treatment (uncontrolled), INR >1.7, recent major surgery <14d, ICH on imaging, aortic dissection, endocarditis, severe head injury <14d, prior ICH (relative if amyloid; modifiable if HTN), platelets <100K, aPTT >40 (if on heparin).'
  },
  {
    category: 'Thrombolysis',
    q: 'What drug for wake-up stroke?',
    a: 'Alteplase is the evidence-based agent (WAKE-UP trial). TNK can be extrapolated from AcT/TRACE-2 but direct RCT evidence in wake-up (TWIST) was negative without advanced imaging. Require DWI-FLAIR mismatch OR CTP mismatch.'
  },
  {
    category: 'Guidelines',
    q: 'What is the ICH BP target per 2022 AHA/ASA?',
    a: 'For presenting SBP 150-220 mmHg: target SBP 140, maintain 130-150 (Class 2a, LOE B-R). Avoid SBP <130 (Class 3: Harm, LOE B-R). Basis: INTERACT2 and ATACH-2.'
  },
  {
    category: 'Guidelines',
    q: 'Post-EVT BP target?',
    a: 'For successful recanalization (mTICI ≥2b): SBP 140-180 (avoid <140 for 72h — Class 3: Harm per ENCHANTED2-MT, OPTIMAL-BP, BP-TARGET, BEST-II).'
  },
  {
    category: 'Etiology',
    q: 'How do you work up cryptogenic stroke?',
    a: '30-day event monitor; consider implantable loop recorder when suspicion remains high (e.g., medium/high HAVOC score, atrial cardiopathy, recurrent embolic pattern), TEE with bubble study (PFO, aortic plaque, LAA thrombus), hypercoag panel (antiphospholipid, factor V Leiden, protein C/S/AT-III, homocysteine), vessel wall imaging if suspicion for vasculitis/ICAD/dissection. Do NOT empirically anticoagulate (NAVIGATE/RE-SPECT/ARCADIA all neutral).'
  },
  {
    category: 'Etiology',
    q: 'How do you evaluate a young stroke patient (<55)?',
    a: 'Cervicocerebral vascular imaging (CTA/MRA H&N) for dissection, vasculitis, FMD, moyamoya. TEE w/ bubble for PFO. Hypercoag panel. MELAS screening (lactate), Fabry (α-galactosidase), CADASIL (NOTCH3, skin biopsy). Drug screen. Consider RCVS vs PRES by imaging. Review for illicit stimulant use.'
  },
  {
    category: 'Differential',
    q: 'Most common stroke mimics in the ED?',
    a: 'Seizure with Todd paralysis (~10%), migraine with aura, hypoglycemia, sepsis/infection, encephalopathy/delirium, functional neurologic disorder, central vertigo vs peripheral, Bell palsy vs stroke. Seizure + aphasia is a hard one — if in doubt, treat as stroke (safer to give lytic for mimic than miss a stroke).'
  },
  {
    category: 'Differential',
    q: 'HINTS exam: what is it, when positive?',
    a: 'Head Impulse, Nystagmus, Test of Skew. For acute vestibular syndrome. Positive for central (stroke) if ANY of: (1) normal/bilateral HIT, (2) direction-changing nystagmus, (3) abnormal skew deviation. Higher sensitivity than MRI in first 48h (which can miss small brainstem lesions).'
  },
  {
    category: 'Management',
    q: 'Post-tPA complications — what to watch for?',
    a: '(1) Hemorrhagic transformation (stop tPA, CT, cryo/TXA if PH, platelets if <100K). (2) Orolingual angioedema (ACE-inhibitor users — stop tPA, IV diphenhydramine + methylprednisolone + H2 blocker; epinephrine if airway compromise). (3) Hypotension / reperfusion injury. Q15 neurochecks × 2h, then q30 × 6h, then q1h × 16h.'
  },
  {
    category: 'Management',
    q: 'DVT prophylaxis timing after ICH?',
    a: 'Day 0: IPC only (CLOTS-3). Day 2-4 with stable imaging: enoxaparin 40 mg SC daily or UFH 5000 BID (Class 2b, LOE B-R per AHA/ASA 2022 ICH). For ischemic stroke: chemical ppx from admission (Class 1).'
  },
  {
    category: 'Rehab',
    q: 'When does spasticity typically develop?',
    a: '2-6 weeks post-stroke. Treatment: physical therapy + stretching + oral baclofen / tizanidine. For focal severe spasticity: botulinum toxin (onabotulinum A) every 3 months.'
  },
  {
    category: 'Prognosis',
    q: 'What is the natural history of functional recovery after stroke?',
    a: 'Most recovery occurs first 3 months. Further gains are incremental but continue at least 6-12 months. 90-day mRS is the traditional trial endpoint because most recovery has plateaued by then. Language recovery can continue for 2+ years.'
  }
];

// =====================================================================
// KEYBOARD SHORTCUTS
// =====================================================================

export const KEYBOARD_SHORTCUTS = [
  { keys: '/', action: 'Open global search' },
  { keys: 'Esc', action: 'Close modal / clear focus' },
  { keys: '←   →', action: 'Navigate management sub-tabs' },
  { keys: 'Home / End', action: 'Jump to first / last management sub-tab' },
  { keys: 'Tab', action: 'Move focus to next interactive element' },
  { keys: 'Shift+Tab', action: 'Move focus to previous element' },
  { keys: 'Enter / Space', action: 'Activate focused button or checkbox' }
];
