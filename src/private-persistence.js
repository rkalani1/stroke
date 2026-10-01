// A serialization policy, not a de-identification or clinical-validation claim.
// No browser APIs: callers apply the public-build gate before reaching this code.
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const objectValue = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const boolean = value => typeof value === 'boolean' ? value : undefined;
const nullableBoolean = value => value === null ? null : boolean(value);
const numeric = value => {
  if (value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) return undefined;
  return Number.isFinite(Number(value)) ? value.trim() : undefined;
};
const choice = values => value => value === '' || values.includes(value) ? value : undefined;
const pattern = expression => value => typeof value === 'string' && (value === '' || expression.test(value)) ? value : undefined;
const date = pattern(/^\d{4}-\d{2}-\d{2}$/);
const time = pattern(/^\d{2}:\d{2}(?::\d{2})?$/);
const timestamp = pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/);
const clockOrTimestamp = value => time(value) ?? timestamp(value) ?? pattern(/^\d{1,2}:\d{2}(?::\d{2})?\s?[AP]M$/i)(value);
const enumArray = values => value => Array.isArray(value) ? value.filter(item => values.includes(item)) : undefined;
const bloodPressure = pattern(/^\d{1,3}\s*\/\s*\d{1,3}$/);
const sex = choice(['F', 'M']);
const consultation = choice(['telephone', 'videoTelestroke']);

function project(value, schema) {
  if (!objectValue(value)) return {};
  const result = {};
  for (const [key, rule] of Object.entries(schema)) {
    if (!own(value, key)) continue;
    const next = typeof rule === 'function' ? rule(value[key]) : project(value[key], rule);
    if (next !== undefined) result[key] = next;
  }
  return result;
}

function booleanShape(defaults) {
  const result = {};
  if (!objectValue(defaults)) return result;
  for (const [key, value] of Object.entries(defaults)) {
    if (typeof value === 'boolean') result[key] = boolean;
    else if (objectValue(value)) result[key] = booleanShape(value);
  }
  return result;
}

function atPath(schema, path, rule) {
  const keys = path.split('.');
  let node = schema;
  for (const key of keys.slice(0, -1)) {
    if (!objectValue(node[key])) node[key] = {};
    node = node[key];
  }
  node[keys.at(-1)] = rule;
}

// Finite domains transcribed from the current note controls and default state.
const NOTE_NUMBERS = [
  "wakeUpStrokeWorkflow.dwi.lesionVolume",
  "fisherGrade",
  "age",
  "weight",
  "creatinine",
  "height",
  "nihss",
  "glucose",
  "inr",
  "pt",
  "plateletCount",
  "ctpStructured.coreVolume",
  "ctpStructured.penumbraVolume",
  "ptt",
  "evtNumberOfPasses",
  "sahAneurysmSize",
  "mRSAtConsent",
  "screeningTools.mocaScore",
  "secondaryPrevention.ldlCurrent",
  "secondaryPrevention.daptMissedDoses7d",
  "secondaryPrevention.exerciseMinPerWeek",
  "anticoagBridging.crCl",
  "ichAnticoagResumption.chadsVascScore",
  "ichAnticoagResumption.hasbledScore",
  "osmoticTherapy.baselineNa",
  "osmoticTherapy.repeatNa",
  "osmoticTherapy.sodiumTarget",
  "osmoticTherapy.serumOsmolality",
  "osmoticTherapy.mannitolOsmGap",
  "substanceScreening.alcoholAuditC",
  "maternalStrokePathway.postpartumDays",
  "cancerStrokePathway.dDimerMultipleUln",
  "dischargeNIHSS",
  "ichVolumeCalc.lengthCm",
  "ichVolumeCalc.widthCm",
  "ichVolumeCalc.slicesCm",
  "crclCalc.age",
  "crclCalc.weight",
  "crclCalc.cr",
  "crclCalc.height",
  "enoxCalc.weightKg",
  "enoxCalc.crCl",
  "heartRate",
  "spO2",
  "temperature",
  "symptomOnsetNIHSS",
  "ctpStructured.mismatchRatio",
  "screeningTools.phq2Score",
  "screeningTools.stopBangScore",
  "ichAnticoagResumption.timeSinceICH",
  "feverManagement.maxTemp",
  "osmoticTherapy.serumSodium",
  "osmoticTherapy.correctionRate",
  "osmoticTherapy.weight",
  "nutritionalSupport.ngPlacementDay",
  "nutritionalSupport.pegConsiderationDay",
  "nutritionalSupport.caloricTarget",
  "anticoagBridging.holdDays",
  "anticoagBridging.resumeDay",
  "decompressiveCraniectomy.age",
  "andexanetCalc.lastDoseHours",
  "andexanetCalc.doacDoseMg"
];
const NOTE_DATES = [
  "discoveryDate",
  "ctDate",
  "ctaDate",
  "sahOutcomeSet.followUpDate",
  "secondaryPrevention.daptStartDate",
  "secondaryPrevention.daptPlannedStopDate",
  "lkwDate"
];
const NOTE_TIMES = [
  "tnkContraindicationReviewTime",
  "discoveryTime",
  "consultStartTime",
  "ichReversalStartTime",
  "ichTransferDecisionTime",
  "tnkAdminTime",
  "bpPreTNKTime",
  "ctTime",
  "ctaTime",
  "tnkConsentTime",
  "consentKit.evtConsentTime",
  "reperfusionTime",
  "angioedema.onsetTime",
  "familyCommunication.time",
  "lkwTime",
  "doorTime",
  "needleTime",
  "punctureTime"
];
const NOTE_TIMESTAMPS = [
  "wakeUpStrokeWorkflow.sleepMidpoint",
  "lastDOACDose",
  "osmoticTherapy.baselineNaTime",
  "osmoticTherapy.repeatNaTime",
  "transportEta",
  "dtnEdArrival",
  "dtnStrokeAlert",
  "dtnCtStarted",
  "dtnCtRead",
  "dtnTnkOrdered",
  "dtnTnkAdministered"
];
const NOTE_ENUMS = {
  "toastClassification": ["large-artery", "cardioembolism", "small-vessel", "other-determined", "cryptogenic"],
  "nihssSource": ["manual", "exam"],
  "callerRole": [
    "",
    "ED Physician",
    "ED NP/PA",
    "Inpatient Clinician",
    "Neurology Resident",
    "RN",
    "Other"
  ],
  "sex": [
    "",
    "M",
    "F"
  ],
  "premorbidMRS": [
    "",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5"
  ],
  "lastDOACType": [
    "",
    "none",
    "apixaban",
    "rivaroxaban",
    "dabigatran",
    "edoxaban",
    "warfarin",
    "heparin",
    "lmwh",
    "fondaparinux"
  ],
  "collateralGrade": [
    "",
    "good",
    "moderate",
    "poor"
  ],
  "diagnosis": [
    "",
    "Acute Ischemic Stroke",
    "Acute Ischemic Stroke - LVO",
    "Minor Ischemic Stroke",
    "TIA",
    "Intracerebral Hemorrhage (ICH)",
    "Subarachnoid Hemorrhage (SAH)",
    "Cerebral Venous Thrombosis (CVT)",
    "Cervical Artery Dissection",
    "Stroke Mimic",
    "Other"
  ],
  "strokeTerritory": [
    "",
    "MCA",
    "ACA",
    "PCA",
    "basilar",
    "vertebral",
    "cerebellar",
    "lacunar",
    "watershed",
    "multi"
  ],
  "strokePhenotype": [
    "",
    "cortical-lvo",
    "cortical-embolic",
    "lacunar",
    "posterior",
    "dissection",
    "watershed",
    "cardioembolic"
  ],
  "ichSurgicalCriteria.surgeryDecision": [
    "",
    "evacuate",
    "evd",
    "mie",
    "observe",
    "comfort",
    "not-candidate"
  ],
  "disposition": [
    "",
    "Admit to Neuro ICU",
    "Admit to Stroke Unit",
    "Admit to Floor",
    "Transfer to CSC",
    "Transfer to PSC",
    "Observation",
    "Discharge"
  ],
  "codeStatus": [
    "",
    "Full Code",
    "DNR/DNI",
    "DNR/Full treatment",
    "Comfort care",
    "Not yet discussed"
  ],
  "transportMode": [
    "",
    "Ground ambulance",
    "Air transport",
    "Critical care transport",
    "Ground",
    "Air",
    "Private",
    "Pending"
  ],
  "secondaryPrevention.antiplateletRegimen": [
    "",
    "dapt-21",
    "asa-mono",
    "clopidogrel-mono",
    "asa-er-dipyridamole",
    "doac-af",
    "anticoag-other",
    "dapt-ticagrelor-30",
    "dapt-cyp2c19",
    "factor-xia-asundexian"
  ],
  "secondaryPrevention.daptDuration": [
    "",
    "21 days",
    "30 days",
    "90 days"
  ],
  "secondaryPrevention.statinDose": [
    "",
    "atorvastatin-80",
    "rosuvastatin-20",
    "atorvastatin-40",
    "already-on-statin",
    "statin-deferred",
    "rosuvastatin-40"
  ],
  "secondaryPrevention.bpTarget": [
    "",
    "<130/80",
    "<140/90",
    "permissive",
    "<120/80"
  ],
  "anticoagulantDoseIntent": [
    "",
    "prophylactic",
    "therapeutic"
  ],
  "ctHemorrhageStatus": [
    "",
    "absent",
    "present",
    "uncertain"
  ],
  "tnkConsentType": [
    "",
    "informed",
    "surrogate",
    "presumed",
    "declined"
  ],
  "consentKit.evtConsentType": [
    "",
    "informed-consent",
    "presumed",
    "surrogate",
    "declined"
  ],
  "ticiScore": [
    "",
    "0",
    "1",
    "2a",
    "2b",
    "2c",
    "3"
  ],
  "evtAccessSite": [
    "",
    "R femoral",
    "L femoral",
    "R radial",
    "L radial"
  ],
  "evtTechnique": [
    "",
    "aspiration",
    "stent retriever",
    "combined"
  ],
  "sahGradeScale": [
    "",
    "huntHess",
    "wfns",
    "modifiedFisher"
  ],
  "sahGrade": [
    "",
    "1",
    "2",
    "3",
    "4",
    "5",
    "0"
  ],
  "sahAneurysmLocation": [
    "",
    "AComm",
    "PComm",
    "MCA",
    "ICA",
    "basilar-tip",
    "PICA",
    "SCA",
    "pericallosal",
    "ophthalmic",
    "other",
    "unknown"
  ],
  "sahSecuringMethod": [
    "",
    "coiling",
    "clipping",
    "flow-diverter",
    "hybrid",
    "conservative",
    "pending"
  ],
  "sahOutcomeSet.dischargeMRS": [
    "",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6"
  ],
  "sahOutcomeSet.dischargeDisposition": [
    "",
    "home",
    "home-health",
    "acute-rehab",
    "snf",
    "ltach",
    "hospice",
    "deceased"
  ],
  "sahOutcomeSet.ninetyDayMRS": [
    "",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6"
  ],
  "sahOutcomeSet.ninetyDayMortality": [
    "",
    "alive",
    "deceased",
    "unknown"
  ],
  "cvtAnticoagType": [
    "",
    "enoxaparin",
    "enoxaparin-daily",
    "ufh",
    "other"
  ],
  "ichEmergencyNeurosurgery": [
    "",
    "planned",
    "not-planned"
  ],
  "culpritM2Dominance": [
    "",
    "dominant",
    "co-dominant",
    "non-dominant"
  ],
  "cardiacWorkup.extendedMonitoringType": [
    "",
    "30-day-monitor",
    "14-day-patch",
    "ilr",
    "none-af-known",
    "none-other"
  ],
  "cardiacWorkup.pfoEvaluation": [
    "",
    "no-pfo",
    "pfo-no-closure",
    "pfo-closure-candidate",
    "pfo-further-eval"
  ],
  "cardiacWorkup.pascalClassification": [
    "",
    "probable",
    "possible",
    "unlikely"
  ],
  "dissectionPathway.antithromboticType": [
    "",
    "antiplatelet-asa",
    "antiplatelet-dapt",
    "anticoag-heparin",
    "anticoag-doac"
  ],
  "dissectionPathway.imagingFollowUp": [
    "",
    "3-month",
    "6-month",
    "3-and-6-month"
  ],
  "screeningTools.phq2_q1": [
    "",
    "0",
    "1",
    "2",
    "3"
  ],
  "screeningTools.phq2_q2": [
    "",
    "0",
    "1",
    "2",
    "3"
  ],
  "screeningTools.seizureRisk": [
    "",
    "no-seizure",
    "acute-seizure",
    "late-seizure",
    "status-epilepticus"
  ],
  "secondaryPrevention.daptAdherenceStatus": [
    "",
    "on-track",
    "at-risk",
    "nonadherent",
    "completed"
  ],
  "secondaryPrevention.daptTransitionAgent": [
    "",
    "asa-mono",
    "clopidogrel-mono",
    "ticagrelor",
    "doac-af"
  ],
  "secondaryPrevention.diabetesManagement": [
    "",
    "no-diabetes",
    "well-controlled",
    "needs-optimization",
    "new-diagnosis"
  ],
  "secondaryPrevention.smokingStatus": [
    "",
    "never",
    "former",
    "current",
    "current-rx"
  ],
  "secondaryPrevention.exercisePlan": [
    "",
    "active",
    "counseled",
    "limited"
  ],
  "secondaryPrevention.dietPlan": [
    "",
    "mediterranean",
    "dash",
    "sodium-restriction",
    "dietitian"
  ],
  "secondaryPrevention.dietAdherence": [
    "",
    "good",
    "partial",
    "poor"
  ],
  "secondaryPrevention.glp1ra": [
    "",
    "semaglutide-2.4",
    "semaglutide-1.0",
    "liraglutide",
    "dulaglutide",
    "not-indicated"
  ],
  "secondaryPrevention.glp1raIndication": [
    "",
    "overweight-ascvd",
    "t2dm",
    "both"
  ],
  "secondaryPrevention.sglt2i": [
    "",
    "empagliflozin",
    "dapagliflozin",
    "sotagliflozin",
    "not-indicated"
  ],
  "secondaryPrevention.sglt2iIndication": [
    "",
    "hf",
    "ckd",
    "t2dm-ascvd",
    "sotagliflozin-af-hf-dm"
  ],
  "secondaryPrevention.colchicineIndication": [
    "",
    "atherosclerotic-stroke",
    "recurrent-ascvd",
    "not-indicated"
  ],
  "secondaryPrevention.cyp2c19Result": [
    "",
    "normal-metabolizer",
    "intermediate",
    "poor-metabolizer",
    "rapid-metabolizer",
    "pending"
  ],
  "drugInteractions.aedType": [
    "",
    "levetiracetam",
    "lacosamide",
    "valproate",
    "phenytoin",
    "carbamazepine",
    "phenobarbital",
    "oxcarbazepine"
  ],
  "drugInteractions.statinInteractionDrug": [
    "",
    "diltiazem",
    "verapamil",
    "amiodarone",
    "cyclosporine",
    "clarithromycin",
    "fluconazole"
  ],
  "anticoagBridging.doacType": [
    "",
    "apixaban",
    "rivaroxaban",
    "dabigatran",
    "edoxaban",
    "warfarin"
  ],
  "anticoagBridging.procedureRisk": [
    "",
    "low",
    "high"
  ],
  "secondaryPrevention.followUpTimeline": [
    "",
    "24-72h",
    "1-2wk",
    "3mo",
    "6mo",
    "12mo",
    "custom"
  ],
  "hemorrhagicTransformation.classification": [
    "",
    "HI-1",
    "HI-2",
    "PH-1",
    "PH-2"
  ],
  "angioedema.severity": [
    "",
    "mild",
    "moderate",
    "severe"
  ],
  "dysphagiaScreening.bedsideScreenResult": [
    "",
    "pass",
    "fail",
    "modified"
  ],
  "dysphagiaScreening.instrumentalAssessment": [
    "",
    "vfss",
    "fees",
    "not-needed"
  ],
  "earlyMobilization.timingDecision": [
    "",
    "24-48h",
    "deferred",
    "contraindicated"
  ],
  "earlyMobilization.sessionFrequency": [
    "",
    "short-frequent",
    "standard-pt",
    "intensive"
  ],
  "doacTiming.strokeSeverity": [
    "",
    "minor",
    "moderate",
    "severe"
  ],
  "doacTiming.doacAgent": [
    "",
    "apixaban",
    "apixaban-reduced",
    "rivaroxaban",
    "rivaroxaban-reduced",
    "dabigatran",
    "edoxaban"
  ],
  "carotidManagement.stenosisSide": [
    "",
    "left",
    "right",
    "bilateral"
  ],
  "carotidManagement.stenosisDegree": [
    "",
    "<50",
    "50-69",
    "70-99",
    "occlusion"
  ],
  "carotidManagement.intervention": [
    "",
    "cea",
    "cas",
    "tcar",
    "medical-only"
  ],
  "esusWorkup.cardiacMonitoringType": [
    "",
    "30-day-monitor",
    "14-day-patch",
    "ilr",
    "telemetry-only"
  ],
  "esusWorkup.esusAntiplatelet": [
    "",
    "antiplatelet",
    "doac-af-found"
  ],
  "ichAnticoagResumption.ichLocation": [
    "",
    "deep",
    "lobar",
    "cerebellar",
    "brainstem"
  ],
  "ichAnticoagResumption.decision": [
    "",
    "resume-doac",
    "resume-doac-early",
    "laao",
    "no-anticoag",
    "defer"
  ],
  "vteProphylaxis.pharmacoProphylaxis": [
    "",
    "enoxaparin-40",
    "enoxaparin-30",
    "ufh-5000",
    "held-post-tpa",
    "held-post-ich",
    "contraindicated"
  ],
  "feverManagement.escalationLevel": [
    "",
    "acetaminophen",
    "surface-cooling",
    "iv-mag",
    "buspirone",
    "meperidine",
    "sedation"
  ],
  "feverManagement.bsasScore": [
    "",
    "0",
    "1",
    "2",
    "3"
  ],
  "osmoticTherapy.agentUsed": [
    "",
    "mannitol-20",
    "hts-3",
    "hts-23.4",
    "none"
  ],
  "osmoticTherapy.indication": [
    "",
    "cerebral-edema",
    "herniation",
    "icp-elevation"
  ],
  "nutritionalSupport.feedingRoute": [
    "",
    "oral-regular",
    "oral-modified",
    "ngt",
    "npo-pending",
    "peg"
  ],
  "palliativeCare.goalsOfCareOutcome": [
    "",
    "full-code",
    "limited-intervention",
    "comfort-focused"
  ],
  "drivingRestrictions.restrictionDuration": [
    "",
    "1-month",
    "3-months",
    "6-months",
    "1-year",
    "indefinite"
  ],
  "returnToWork.expectedTimeline": [
    "",
    "2-4-weeks",
    "2-6-months",
    "6-12-months",
    "unable"
  ],
  "spasticity.treatment": [
    "",
    "none",
    "stretching",
    "botox",
    "oral-meds",
    "itb"
  ],
  "centralPain.treatment": [
    "",
    "amitriptyline",
    "lamotrigine",
    "gabapentin",
    "duloxetine"
  ],
  "fatigue.management": [
    "",
    "energy-conservation",
    "graded-exercise",
    "sleep-hygiene",
    "treat-comorbid"
  ],
  "airTravelRestrictions.restrictionDuration": [
    "",
    "1-2-weeks",
    "2-weeks",
    "1-3-months",
    "6-8-weeks",
    "1-week-post-crani"
  ],
  "cancerStrokePathway.mechanism": [
    "",
    "probable",
    "possible",
    "conventional"
  ],
  "cancerStrokePathway.preventionPlan": [
    "",
    "lmwh",
    "antiplatelet",
    "doac",
    "individualized"
  ],
  "decompressiveCraniectomy.timing": [
    "",
    "proceeding-supra",
    "proceeding-posterior",
    "monitoring",
    "not-candidate"
  ],
  "cvtAnticoag.acutePhase": [
    "",
    "ufh-infusion",
    "lmwh"
  ],
  "cvtAnticoag.transitionAgent": [
    "",
    "warfarin",
    "doac"
  ],
  "cvtAnticoag.duration": [
    "",
    "3-6mo",
    "6-12mo",
    "indefinite"
  ],
  "crclCalc.sex": [
    "",
    "M",
    "F"
  ],
  "bpPhase": [
    "pre-tnk",
    "post-tnk",
    "post-evt",
    "ich",
    "sah",
    "sah-secured",
    "cvt",
    "cvt-hemorrhage"
  ],
  "diagnosisCategory": [
    "ischemic",
    "ich",
    "sah",
    "cvt",
    "tia",
    "mimic",
    "other"
  ],
  "andexanetCalc.doacType": [
    "apixaban",
    "rivaroxaban"
  ],
  "mrsAssessment.discharge": [
    "",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6"
  ],
  "mrsAssessment.day30": [
    "",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6"
  ],
  "mrsAssessment.day90": [
    "",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6"
  ],
  "mrsAssessment.month6": [
    "",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6"
  ],
  "mrsAssessment.month12": [
    "",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6"
  ]
};
const NOTE_BOOLEANS = [
  "postEvtBpConfirmed",
  "postEvtNeuroChecks",
  "postEvtGroinCheck",
  "postEvtImagingOrdered",
  "postEvtAntiplateletTiming",
  "postEvtIcuBed",
  "etiologyWorkup.completedTests.ctaHeadNeck",
  "etiologyWorkup.completedTests.carotidDuplex",
  "etiologyWorkup.completedTests.mriDwi",
  "etiologyWorkup.completedTests.lipidPanel",
  "etiologyWorkup.completedTests.hba1c",
  "etiologyWorkup.completedTests.ecg",
  "etiologyWorkup.completedTests.echo",
  "etiologyWorkup.completedTests.vesselWallMri",
  "etiologyWorkup.completedTests.telemetry",
  "etiologyWorkup.completedTests.echoTte",
  "etiologyWorkup.completedTests.echoTee",
  "etiologyWorkup.completedTests.extendedMonitor",
  "etiologyWorkup.completedTests.bpMonitoring",
  "etiologyWorkup.completedTests.mraNeck",
  "etiologyWorkup.completedTests.hypercoagPanel",
  "etiologyWorkup.completedTests.esrCrp",

  "tnkContraindicationChecklist.aorticDissection",
  "tnkContraindicationChecklist.giMalignancy",
  "tnkContraindicationChecklist.sahPresentation",
  "tnkContraindicationChecklist.infectiveEndocarditis",
  "tnkContraindicationChecklist.priorICH",
  "tnkContraindicationChecklist.vascularMalformation",
  "tnkContraindicationChecklist.medicationReconciliation",
  "tnkContraindicationChecklist.abnormalCoagUnknown",
  "tnkContraindicationChecklist.preexistingDisability",
  "tnkContraindicationChecklist.largeInfarct",
  "tnkContraindicationChecklist.severeRenalFailure",
  "tnkContraindicationChecklist.intracranialAneurysm",
  "tnkContraindicationChecklist.dualAntiplatelet",
  "tnkContraindicationChecklist.aceInhibitor",
  "angioedema.stepsTaken.airway",
  "angioedema.stepsTaken.stopTnk",
  "angioedema.stepsTaken.steroids",
  "angioedema.stepsTaken.epinephrine",
  "angioedema.stepsTaken.icatibant",

  "noncardioembolicConfirmed", "antiplateletContraindicationsReviewed", "cervicalDissectionConfirmed", "aorticDissectionSuspected",
  "screeningTools.sb_snoring", "screeningTools.sb_tired", "screeningTools.sb_observed", "screeningTools.sb_pressure",
  "screeningTools.sb_bmi", "screeningTools.sb_age", "screeningTools.sb_neck", "screeningTools.sb_gender",

  "wakeUpStrokeWorkflow.mriLesionExtentReviewed",
  "aspectsRegionsAssessed",
  "legacyPcAspectsAssessed",
  "ivtContraindicationsReviewed",
  "tiaDisposition.assessmentReviewed",
  "aspirinExposureConfirmed",
  "screeningTools.stopBangAssessed",
  "drugInteractions.doacDoseAppropriate",
  "anticoagBridging.warfarinBridgeIndication",
  "cvtAnticoag.apsStatus",
  "aspectsAssessed",
  "pcAspectsAssessed",
  "carotidManagement.symptomStatusReviewed"
];

export function projectTelestrokeNote(note, defaults = {}, allowFreeText = false) {
  if (allowFreeText === true) return note;
  const schema = booleanShape(defaults);
  NOTE_NUMBERS.forEach(path => atPath(schema, path, numeric));
  Object.entries(NOTE_ENUMS).forEach(([path, values]) => atPath(schema, path, choice(values)));
  NOTE_BOOLEANS.forEach(path => atPath(schema, path, boolean));
  ['disablingDeficit', 'presentedWithin24h', 'carotidManagement.symptomatic',
    'wakeUpStrokeWorkflow.mriAvailable', 'wakeUpStrokeWorkflow.wakeUpEligible',
    'wakeUpStrokeWorkflow.extendEligible'].forEach(path => atPath(schema, path, nullableBoolean));
  NOTE_DATES.forEach(path => atPath(schema, path, date));
  NOTE_TIMES.forEach(path => atPath(schema, path, clockOrTimestamp));
  NOTE_TIMESTAMPS.forEach(path => atPath(schema, path, timestamp));
  ['presentingBP', 'bpPreTNK', 'bpPostEVT', 'bpProtocolCheck'].forEach(path => atPath(schema, path, bloodPressure));
  schema.vesselOcclusion = enumArray(['ICA', 'M1', 'M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3', 'Basilar', 'None']);
  return project(note, schema);
}

export function projectStrokeCodeForm(form, allowFreeText = false) {
  if (allowFreeText === true) return form;
  return project(form, {
    age: numeric, sex, lkw: time, lkw_date: date, nihss: numeric, aspects: numeric,
    tnk_rec: choice(['Recommended', 'Not Recommended']), evt_rec: choice(['Recommended', 'Not Recommended'])
  });
}

const booleans = keys => Object.fromEntries(keys.split(' ').map(key => [key, boolean]));
const SCORE_SCHEMAS = {
  gcsItems: { eye: choice(['1', '2', '3', '4', 'NT']), verbal: choice(['1', '2', '3', '4', '5', 'NT']), motor: choice(['1', '2', '3', '4', '5', '6', 'NT']) },
  funcItems: { location: choice(['lobar', 'deep', 'infratentorial']), preCogImpairment: boolean },
  phasesItems: { population: choice(['north_american', 'japanese', 'finnish']), ...booleans('hypertension age70 earlierSAH assessed'), size: numeric, site: choice(['ica', 'mca', 'aca_pcomm_posterior']) },
  ichScoreItems: { ...booleans('age80 volume30 ivh infratentorial lobar preCogImpairment criteriaReviewed'), gcs: choice(['gcs34', 'gcs512', 'gcs1315']), syncedAge: numeric, syncedGcsSignature: pattern(/^(?:[1-4]|NT)?\|(?:[1-5]|NT)?\|(?:[1-6]|NT)?$/) },
  abcd2Items: { ...booleans('age60 bp unilateralWeakness speechDisturbance diabetes criteriaReviewed'), duration: choice(['duration60', 'duration10', 'durationUnder10']), syncedAge: numeric },
  chads2vascItems: { ...booleans('chf hypertension age75 diabetes strokeTia vascular age65 female criteriaReviewed'), syncedAge: numeric, syncedSex: sex },
  ropeItems: { ...booleans('noHypertension noDiabetes noStrokeTia nonsmoker cortical assessed'), age: numeric, largeShunt: nullableBoolean, atrialSeptalAneurysm: nullableBoolean },
  hasbledItems: { ...booleans('hypertension renalDisease liverDisease stroke bleeding labileINR elderly drugs alcohol assessed'), syncedAge: numeric },
  rcvs2Items: booleans('recurrentTCH carotidInvolvement vasoconstrictiveTrigger female sah assessed'),
  ichVolumeParams: { a: numeric, b: numeric, thicknessMm: numeric, numSlices: numeric },
  evtDecisionInputs: {
    ...booleans('ctpMismatch disablingDeficit'), population: choice(['adult', 'pediatric']),
    aspects: numeric, mrs: numeric, nihss: numeric, pcAspects: numeric, age: numeric,
    coreVolume: numeric, mismatchRatio: numeric, mismatchVolume: numeric,
    massEffect: choice(['none', 'present']), timeWindow: choice(['auto', '0-6', '6-24', '>24']),
    occlusion: choice(['lvo', 'mvo-dominant', 'mvo-codominant', 'mvo-nondominant', 'aca', 'pca', 'basilar'])
  }
};
const SCALARS = {
  nihssScore: numeric, aspectsScore: numeric, mrsScore: numeric, huntHessGrade: numeric, wfnsGrade: numeric,
  currentStep: numeric, elapsedSeconds: numeric, ttlHoursOverride: numeric, lastUpdated: numeric,
  autoSyncCalculators: boolean, timerSidebarCollapsed: boolean, thrombolysisAlertsMuted: boolean,
  actionBarCollapsed: boolean, consultationType: consultation, weightUnit: choice(['kg', 'lbs']),
  doacProtocol: choice(['catalyst', 'expert-consensus', 'elan-optimas', '1-3-6-12']),
  noteTemplate: choice(['consult', 'transfer', 'signout', 'progress', 'discharge', 'followup', 'procedure', 'patient-ed']),
  activeTab: choice(['encounter', 'protocols', 'research', 'trials', 'settings', 'education', 'management', 'library']),
  apiProvider: choice(['openai', 'anthropic', 'gemini', 'grok']), lkwTime: timestamp
};

function projectRegions(values, defaults) {
  if (!Array.isArray(defaults)) return [];
  const supplied = Array.isArray(values) ? values : [];
  return defaults.map(canonical => {
    const item = supplied.find(value => objectValue(value) && value.id === canonical.id);
    // Keep every selectable region; malformed/missing assessment is unknown.
    const checked = item && (typeof item.checked === 'boolean' || item.checked === null) ? item.checked : null;
    return { ...canonical, checked };
  });
}

export function projectStoredValue(key, value, policy = {}) {
  if (policy.allowFreeText === true) return value;
  if (key === 'telestrokeNote') return projectTelestrokeNote(value, policy.noteDefaults);
  if (key === 'strokeCodeForm') return projectStrokeCodeForm(value);
  if (key === 'patientData') {
    const schema = Object.fromEntries((policy.nihssItems || []).map(item => [item.id, choice(item.options)]));
    return project(value, schema);
  }
  if (key === 'aspectsRegionState') return projectRegions(value, policy.aspectsRegions);
  if (key === 'pcAspectsRegions') return projectRegions(value, policy.pcAspectsRegions);
  if (own(SCORE_SCHEMAS, key)) return project(value, SCORE_SCHEMAS[key]);
  if (own(SCALARS, key)) return SCALARS[key](value);
  if (key === 'completedSteps') return Array.isArray(value) ? value.filter(v => Number.isInteger(v) && v >= 0 && v <= 50) : [];
  // Complex shift/history snapshots and edited templates contain opaque text.
  // They stay in memory unless the user has explicitly opted into free text.
  return undefined;
}

export function projectAppData(data, policy = {}) {
  if (policy.allowFreeText === true) return data;
  const result = project(data, {
    schemaVersion: numeric,
    settings: {
      deidMode: boolean, allowFreeTextStorage: boolean, ttlHoursOverride: value => value === null ? null : numeric(value),
      defaultConsultationType: consultation, workflowPersona: choice(['senior', 'trainee'])
    },
    uiState: {
      lastActiveTab: SCALARS.activeTab,
      lastManagementSubTab: choice(['ich', 'ischemic', 'references']),
      lastLibrarySection: choice(['management', 'guidelines', 'references', 'calculators', 'education']),
      legacyMigratedAt: timestamp
    }
  });
  result.settings = { ...result.settings, allowFreeTextStorage: false };
  return result;
}
