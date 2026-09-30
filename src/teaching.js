// Educational content for stroke/neurology trainees.
// Pure data — consumed by React components in teaching.jsx.
//
// Field-level source review and focused repairs: 2026-09-30.
// Source access and later-correction limits remain explicit in the review
// packet; this is not a claim of whole-card clinical certification.
// Key guidelines referenced: AHA/ASA AIS 2026 (Prabhakaran, PMID 41582814 —
// replaces the 2019 guideline; note its July 2026 published correction,
// PMID 42507797), AHA/ASA ICH 2022 (Greenberg), AHA/ASA aSAH 2023,
// AHA/ASA CVT 2024 scientific statement, AHA/ASA Secondary Prevention 2021
// (Kleindorfer), ESC AF 2024 (van Gelder).

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
      pearls: 'Global aphasia + right hemiparesis is classic for dominant M1. If also gaze preference to left, suggests large cortical strike (Broca\'s + Wernicke\'s areas affected).',
      pimpingQ: 'Why does the patient look toward the side of the lesion in a left M1 stroke?',
      answer: 'Frontal eye field (Brodmann area 8) in the left frontal lobe normally drives gaze to the right. With left frontal damage, the right FEF is unopposed and pulls gaze to the left (ipsilateral to lesion).'
    },
    {
      name: 'Right MCA (non-dominant) — proximal M1',
      territory: 'Right middle cerebral artery proximal',
      deficits: 'Left hemiplegia (face+arm>leg), left hemisensory loss, left homonymous hemianopia, left hemi-neglect, right gaze preference, anosognosia',
      pearls: 'Neglect is associated with the language-nondominant hemisphere, usually the right. Language dominance and laterality vary; assess language and attention rather than inferring them from the side alone.',
      pimpingQ: 'What is the pathophysiology of hemineglect in right MCA stroke?',
      answer: 'Right parietal cortex normally attends to both hemispaces; left parietal only to right. Right parietal damage → left hemineglect (patient ignores left side). Left damage can cause mild right neglect but rarely severe because right parietal compensates.'
    },
    {
      name: 'MCA — superior division',
      territory: 'Rolandic + Broca\'s branches',
      deficits: 'Contralateral face/arm > leg weakness, expressive aphasia (left-sided), no hemianopia typically',
      pearls: 'Nonfluent, effortful speech can occur. Comprehension varies with task complexity; do not assume all comprehension is preserved from the subtype label.'
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
      pearls: 'Homonymous hemianopia suggests a retrochiasmal lesion. Preserved reading or macular sparing does not uniquely identify PCA ischemia or exclude other lesion locations (Zhang et al., PMID 16567710).'
    }
  ],

  posteriorCirculation: [
    {
      name: 'Lateral medullary (Wallenberg)',
      territory: 'Vertebral artery or PICA',
      deficits: 'IPSILATERAL: facial numbness (CN5), Horner (sympathetics), hoarseness/dysphagia (CN9/10), ataxia (inferior cerebellar peduncle). CONTRALATERAL: body pain/temperature loss (spinothalamic).',
      pearls: 'The classic "crossed" syndrome. Often presents with severe nausea, vertigo, hiccups.',
      pimpingQ: 'Why does Wallenberg syndrome have crossed findings (ipsilateral face, contralateral body for pain/temp)?',
      answer: 'Trigeminal spinal nucleus (carries face pain/temp) is ipsilateral in the medulla. Spinothalamic tract (body pain/temp) has already decussated at the spinal cord level, so damage in the lateral medulla affects already-crossed fibers → contralateral body.'
    },
    {
      name: 'Medial medullary (Dejerine)',
      territory: 'Anterior spinal artery / vertebral',
      deficits: 'Contralateral hemiplegia (pyramidal tract), contralateral loss of position/vibration (medial lemniscus), ipsilateral tongue weakness (CN12).',
      pearls: 'Medial medullary injury can involve the pyramidal tract, medial lemniscus and hypoglossal root fibers or nucleus.'
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
      pearls: 'A classic locked-in presentation after ventral pontine injury combines preserved consciousness with severe motor paralysis and retained vertical eye movements; incomplete forms and later recovery occur. High mortality without recanalization; EVT within 24 h is recommended for basilar occlusion with NIHSS ≥10, pre-stroke mRS 0-1, and PC-ASPECTS ≥6 (2026 AHA/ASA Class 1, LOE A). For NIHSS 6-9 the benefit is not well established (Class 2b).'
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
      pearls: 'Cerebellar edema peaks day 2-4 → can cause obstructive hydrocephalus or brainstem compression. Suboccipital decompressive craniectomy with dural expansion is recommended for deterioration from brainstem compression or infarct volume ≥35 mL (Class 1, LOE B-NR). Ventriculostomy is recommended for obstructive hydrocephalus (Class 1, LOE C-LD). Source: 2026 AHA/ASA AIS guideline.'
    },
    {
      name: 'Midbrain (Weber, Benedikt, Claude)',
      territory: 'Paramedian midbrain',
      deficits: 'Weber: CN3 ipsilateral + contralateral hemiparesis. Benedikt: CN3 + contralateral tremor/ataxia. Claude: CN3 + contralateral ataxia.',
      pearls: 'These syndromes involve CN III with different neighboring pathways. Ptosis, pupillary dilation and a down-and-out eye are possible complete findings; partial or pupil-sparing involvement can occur.'
    }
  ],

  lacunarSyndromes: [
    {
      name: 'Pure motor hemiparesis',
      territory: 'Posterior limb of internal capsule or basis pontis',
      deficits: 'Contralateral pure motor weakness without sensory or cortical signs; face, arm and leg involvement can vary.',
      pearls: 'A common lacunar presentation, but the clinical syndrome does not prove small-vessel pathology or a specific lesion site.'
    },
    {
      name: 'Pure sensory stroke',
      territory: 'Thalamus (VPL/VPM)',
      deficits: 'Contralateral sensory symptoms without weakness or cortical signs; the distribution can be incomplete.',
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
      deficits: 'Weakness and ataxia in the same limbs, generally contralateral to a supratentorial or pontine lesion; distribution alone does not establish the site.',
      pearls: '"Ataxia in a weak limb" — a classic teaching point.'
    },
    {
      name: 'Clumsy-hand dysarthria',
      territory: 'Pons, internal capsule or corona radiata',
      deficits: 'Dysarthria + clumsy hand (contralateral), minimal weakness.',
      pearls: 'Dysarthria and clumsy hand movements can occur with lesions at several sites; the syndrome does not uniquely identify a pontine lacune.'
    }
  ],

  special: [
    {
      name: 'Watershed (border zone)',
      territory: 'ACA-MCA or MCA-PCA border',
      deficits: 'ACA-MCA: "man-in-a-barrel" (proximal > distal arm weakness). MCA-PCA: transcortical aphasia.',
      pearls: 'Internal borderzone infarcts have stronger hemodynamic associations; cortical borderzone infarcts can be embolic. Interpret the pattern with vascular imaging and the clinical setting.'
    },
    {
      name: 'Thalamic (artery of Percheron)',
      territory: 'Bilateral paramedian thalami (single perforator from PCA)',
      deficits: 'Acute coma/decreased consciousness + vertical gaze palsy + memory/behavioral change.',
      pearls: 'Bilateral paramedian thalamic infarction is a characteristic Percheron pattern, but bilateral thalamic abnormalities also have venous, inflammatory, infectious and other causes.'
    },
    {
      name: 'Central pontine (paramedian pontine)',
      territory: 'Paramedian basilar branches',
      deficits: 'Abducens fascicular involvement causes ipsilateral abduction weakness; abducens-nuclear or PPRF injury causes conjugate gaze palsy. Contralateral weakness and dysarthria may accompany pontine injury.',
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
    { cn: 'III', name: 'Oculomotor', testing: 'Pupils (efferent), ptosis, EOM (all except superior oblique and lateral rectus)', lesionEffect: 'Ptosis and a down-and-out eye, sometimes with pupillary dilation. Partial and pupil-sparing palsies occur; pupil sparing alone does not exclude compression.' },
    { cn: 'IV', name: 'Trochlear', testing: 'Superior oblique (downward in adduction)', lesionEffect: 'Vertical diplopia worse looking down and in (e.g., reading, stairs). Head tilt away from lesion side.' },
    { cn: 'V', name: 'Trigeminal', testing: 'Facial sensation V1/V2/V3, corneal reflex, masseter, jaw jerk', lesionEffect: 'Facial numbness by division; weak jaw deviates TO side of lesion.' },
    { cn: 'VI', name: 'Abducens', testing: 'Lateral rectus (horizontal abduction)', lesionEffect: 'Horizontal diplopia worse on gaze to affected side. Can be a false localizing sign with high ICP.' },
    { cn: 'VII', name: 'Facial', testing: 'Facial symmetry (upper and lower), taste anterior 2/3 tongue, hyperacusis', lesionEffect: 'Central lesions commonly affect the lower face more than the upper face, but forehead sparing is not an absolute discriminator. Peripheral lesions can affect the entire ipsilateral face, with possible hyperacusis or taste change.' },
    { cn: 'VIII', name: 'Vestibulocochlear', testing: 'Hearing, Weber/Rinne', lesionEffect: 'Vertigo + hearing loss + nystagmus.' },
    { cn: 'IX', name: 'Glossopharyngeal', testing: 'Gag (sensory), taste posterior 1/3 tongue', lesionEffect: 'Gag responses involve CN IX and X, but an absent gag alone does not diagnose their dysfunction or aspiration risk.' },
    { cn: 'X', name: 'Vagus', testing: 'Palate elevation, gag (motor), hoarseness', lesionEffect: 'Uvula deviates AWAY from lesion; hoarseness, dysphagia.' },
    { cn: 'XI', name: 'Spinal accessory', testing: 'SCM, trapezius', lesionEffect: 'Weak shoulder shrug and head turn AWAY from lesion side.' },
    { cn: 'XII', name: 'Hypoglossal', testing: 'Tongue protrusion, atrophy, fasciculations', lesionEffect: 'Tongue deviates TOWARD the weak side (lick your wounds).' }
  ],

  vascularTerritories: [
    { artery: 'ACA', supply: 'Medial frontal + medial parietal (including paracentral lobule — legs), anterior corpus callosum' },
    { artery: 'MCA — M1', supply: 'Deep lenticulostriates (internal capsule, basal ganglia) + most of lateral cortex' },
    { artery: 'MCA — M2 superior division', supply: 'Rolandic + Broca\'s (frontal + upper parietal)' },
    { artery: 'MCA — M2 inferior division', supply: 'Wernicke + temporoparietal' },
    { artery: 'PCA — P1', supply: 'Paramedian thalamic and midbrain perforators. A single artery supplying both paramedian thalami is the Percheron variant, not the usual paired pattern.' },
    { artery: 'PCA — P2-P4', supply: 'Occipital cortex, medial temporal (hippocampus), splenium corpus callosum' },
    { artery: 'AChA (anterior choroidal)', supply: 'Posterior limb internal capsule, lateral geniculate, medial temporal lobe' },
    { artery: 'PICA', supply: 'Lateral medulla (Wallenberg), inferior cerebellum (vermis + tonsils)' },
    { artery: 'AICA', supply: 'Lateral pons, middle cerebellar peduncle, labyrinthine (CN7/8) — hearing loss can occur' },
    { artery: 'SCA', supply: 'Superior cerebellum, tegmentum of upper pons/midbrain' },
    { artery: 'Basilar perforators', supply: 'Pons (corticospinal, corticobulbar, CN6/7 nuclei)' },
    { artery: 'Vertebral', supply: 'Medullary territories through direct vertebral branches and PICA-related supply; lateral medullary injury does not require PICA-origin involvement.' }
  ]
};

// =====================================================================
// TEACHING PEARLS / COMMON PIMP QUESTIONS
// =====================================================================

export const TEACHING_PEARLS = [
  {
    category: 'Imaging',
    q: 'What is the hyperdense MCA sign and what does it mean?',
    a: "A hyperdense intracranial artery on noncontrast CT can indicate acute thrombus. An IST-3 study and meta-analysis reported 52% sensitivity and 95% specificity for arterial obstruction overall; these are not universal proximal-MCA performance estimates. Thin-section imaging improves detection."
  },
  {
    category: 'Imaging',
    q: 'What is ASPECTS and why is it important?',
    a: 'Alberta Stroke Program Early CT Score — 10-point score assessing early ischemic changes in 10 MCA territory regions (M1-M6, L, I, C, IC). Starts at 10, subtract 1 per affected region. ASPECTS ≥6 is the classic threshold. Under the 2026 AHA/ASA guideline (ICA/M1 occlusion, NIHSS ≥6, prestroke mRS 0-1), EVT is Class 1 for ASPECTS 3-10 within 6 h and for ASPECTS 3-5 at 6-24 h (age <80, no significant mass effect), and Class 2a for ASPECTS 0-2 within 6 h (age <80, no significant mass effect).'
  },
  {
    category: 'Imaging',
    q: 'How do you differentiate stroke from mimic on MRI?',
    a: "Restricted diffusion supports acute ischemia in the appropriate clinical setting but is not specific to it; seizures and other disorders can also restrict diffusion. A negative early DWI does not exclude stroke, particularly in the posterior circulation. Interpret the pattern with the examination, timing and follow-up imaging."
  },
  {
    category: 'NIHSS',
    q: 'What is a "fake zero" NIHSS and when is it missed?',
    a: "A low or zero NIHSS can underestimate gait, vestibular and other posterior-circulation disability. Hemianopia, dysarthria and limb ataxia do contribute to the score. Neither a low NIHSS nor these symptoms alone establish an EVT indication; obtain an urgent stroke assessment and appropriate vascular imaging."
  },
  {
    category: 'Thrombolysis',
    q: 'When is TNK contraindicated even if in window and no other exclusions?',
    a: 'This incomplete contraindication checklist is withheld pending reconciliation of the 2026 AHA/ASA guideline, its correction, and the US TNKase prescribing information. It must not be used as a treatment eligibility checklist.'
  },
  {
    category: 'Thrombolysis',
    q: 'What drug for wake-up stroke?',
    a: "WAKE-UP directly studied alteplase in selected unknown-onset stroke with MRI DWI-FLAIR mismatch. TWIST did not demonstrate a benefit from tenecteplase using its noncontrast-CT selection. These trials have different populations and do not establish an agent-independent wake-up treatment rule; apply current treatment-specific selection criteria."
  },
  {
    category: 'Guidelines',
    q: 'What is the ICH BP target per 2022 AHA/ASA?',
    a: "In mild-to-moderate spontaneous ICH presenting with SBP 150-220 mmHg, targeting 140 and maintaining 130-150 may be reasonable (AHA/ASA 2022, Class IIb, B-R). Smooth sustained control is recommended; acute lowering below 130 in this population can be harmful. Safety and efficacy in large/severe ICH or surgical-decompression candidates are uncertain."
  },
  {
    category: 'Guidelines',
    q: 'Post-EVT BP target?',
    a: "AHA/ASA 2026 considers BP ≤180/105 mmHg during EVT and for 24 hours afterward reasonable. In successfully recanalized anterior-circulation LVO without another BP indication, active intensive targeting of SBP <140 for the first 72 hours is harmful. This does not mandate raising a spontaneous SBP below 140 or establish one universal lower bound."
  },
  {
    category: 'Etiology',
    q: 'How do you work up cryptogenic stroke?',
    a: "Use a cause-directed evaluation. Echocardiography and prolonged rhythm monitoring are reasonable in selected cryptogenic stroke; TEE and an implantable monitor are individual choices. Select thrombophilia and vessel-wall testing by the clinical phenotype. Protein C, protein S and antithrombin levels may be altered by acute thrombosis or treatment; timing and interpretation depend on the assay. Empiric anticoagulation is not indicated for ESUS without a specific indication."
  },
  {
    category: 'Etiology',
    q: 'How do you evaluate a young stroke patient (<55)?',
    a: "Vascular imaging and clinical phenotype guide the workup. Consider dissection, selected arteriopathies, cardiac sources, medications and substance exposure. Hypercoagulable, infectious, metabolic and genetic tests should follow specific clinical clues; age below 55 alone does not justify a universal panel, TEE or genetic screen."
  },
  {
    category: 'Differential',
    q: 'Most common stroke mimics in the ED?',
    a: "Potential mimics include seizure with postictal deficits, migraine, hypoglycemia, infection, metabolic encephalopathy and functional neurological disorder. Registry data show low but nonzero symptomatic-ICH risk in thrombolysed mimics; this does not justify treating every uncertain presentation. Assess disabling suspected stroke promptly against eligibility and contraindications."
  },
  {
    category: 'Differential',
    q: 'HINTS exam: what is it, when positive?',
    a: "HINTS is a bedside examination for an appropriate acute vestibular syndrome with nystagmus, performed by a clinician trained in its use. Include hearing assessment and arrange MRI/MRA for a central or equivocal result. An abnormal head impulse or new hearing loss alone does not exclude stroke. It is not a screening test for every dizzy patient."
  },
  {
    category: 'Management',
    q: 'Post-tPA complications — what to watch for?',
    a: "Urgent concerns after IV thrombolysis include symptomatic intracranial bleeding and orolingual angioedema. New neurological deterioration needs emergency assessment and brain imaging; symptomatic bleeding is not limited to parenchymal-hematoma morphology. Angioedema requires immediate airway assessment. Use the current institutional emergency pathway and complete source guideline for treatment, dosing and monitoring."
  },
  {
    category: 'Management',
    q: 'DVT prophylaxis timing after ICH?',
    a: "For nonambulatory spontaneous ICH, IPC begins on the day of diagnosis; low-dose UFH or LMWH at 24-48 hours may be reasonable after assessing hematoma stability and contraindications (AHA/ASA 2022). In immobile AIS, IPC is recommended and prophylactic-dose UFH/LMWH is reasonable to reduce VTE, although survival benefit is uncertain. Elastic compression stockings are harmful. These are prophylaxis, not treatment regimens."
  },
  {
    category: 'Rehab',
    q: 'When does spasticity typically develop?',
    a: "Spasticity onset and severity vary. Assess its effect on function, comfort, hygiene and care goals before selecting therapy. Focal botulinum toxin treatment and oral agents have different indications and adverse effects. The onabotulinumtoxinA label allows repeat treatment when the prior effect diminishes, generally no sooner than 12 weeks; this is not a mandatory every-three-month schedule."
  },
  {
    category: 'Prognosis',
    q: 'What is the natural history of functional recovery after stroke?',
    a: "Recovery trajectories differ across motor, language, cognitive, activity and participation outcomes. Meaningful improvement can occur beyond an early follow-up assessment. A 90-day trial endpoint or cohort average must not be used as an individual recovery ceiling."
  },
  {
    category: 'Biomarkers',
    q: "What peripheral-blood observation has been reported before cryptogenic NORSE?",
    a: 'In a single case report, atypical lymphocytes appeared in peripheral blood (CSF was normal) just before cryptogenic NORSE, possibly reflecting hypercytokinemia. This is hypothesis-generating, not an established biomarker. (Takatsu et al., Neurohospitalist 2026;16(3); PMID 41306648)'
  },
  {
    category: 'Special Populations',
    q: 'What are the key considerations for AHLE (Acute Hemorrhagic Leukoencephalitis) in pregnancy?',
    a: 'AHLE (Acute Hemorrhagic Leukoencephalitis), a severe form of ADEM, can rarely present during pregnancy. It requires prompt recognition via MRI (hemorrhagic demyelinating lesions) and early immunotherapy. In the cited single case, high-dose corticosteroid therapy produced full neurological recovery, and the patient later delivered a healthy full-term infant. (Tuli et al., Neurohospitalist 2026;16(3); PMID 41280370)'
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
