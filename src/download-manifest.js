// Public download lifecycle, shared by the library and canonical PDF exporter.
// "Maintained" identifies the generated source path, not clinical certification.
// Historical files remain published at their established URLs for study/history.
// No new files are retired in 6.30.6: overlap alone is not proof of duplication.
const freezeEntries = (entries) => Object.freeze(entries.map((entry) => Object.freeze(entry)));

export const DOWNLOAD_MANIFEST = freezeEntries([
  {
    "id": "aneurysms-unruptured-cerebral-aneurysms",
    "title": "Unruptured Cerebral Aneurysms",
    "path": "documents/aneurysms/Unruptured Cerebral Aneurysms.pdf",
    "status": "historical-archive"
  },
  {
    "id": "antiplatelet-dapt-minor-stroke-tia-trials",
    "title": "DAPT Minor Stroke-TIA Trials",
    "path": "documents/antiplatelet/DAPT Minor Stroke-TIA Trials.pdf",
    "status": "historical-archive"
  },
  {
    "id": "antiplatelet-other-antithrombotics",
    "title": "Other Antithrombotics",
    "path": "documents/antiplatelet/Other Antithrombotics for Secondary Stroke Prevention.pdf",
    "status": "historical-archive"
  },
  {
    "id": "csvd-lacunar-stroke",
    "title": "Lacunar Stroke",
    "path": "documents/csvd/Lacunar Stroke 7.13.22.pdf",
    "status": "historical-archive"
  },
  {
    "id": "ebm-interpretation-of-clinical-trials",
    "title": "Interpretation of Clinical Trials",
    "path": "documents/ebm/Interpretation of Clinical Trials.pdf",
    "status": "historical-archive"
  },
  {
    "id": "evt-large-core-anterior-circulation-lvo-evt-trials",
    "title": "Large Core Anterior Circulation LVO EVT Trials",
    "path": "documents/evt/Large Core Anterior Circulation LVO EVT Trials.pdf",
    "status": "historical-archive"
  },
  {
    "id": "evt-basilar-artery-occlusion-evt-trials",
    "title": "Basilar Artery Occlusion EVT Trials",
    "path": "documents/evt/Basilar Artery Occlusion EVT Trials.pdf",
    "status": "historical-archive"
  },
  {
    "id": "evt-mevo-distal-vessel-occlusion-evt-trials",
    "title": "MeVO & Distal Vessel Occlusion EVT Trials",
    "path": "documents/evt/MeVO & Distal Vessel Occlusion EVT Trials.pdf",
    "status": "historical-archive"
  },
  {
    "id": "afib-ac-timing-after-af-related-stroke",
    "title": "Timing of Anticoagulation after AF-Related Stroke",
    "path": "documents/afib/AC timing after AF-related Stroke.pdf",
    "status": "historical-archive"
  },
  {
    "id": "afib-af-secondary-stroke-prevention-july-2024",
    "title": "Atrial Fibrillation & Secondary Stroke Prevention",
    "path": "documents/afib/AF & secondary stroke prevention July 2024.pdf",
    "status": "historical-archive"
  },
  {
    "id": "afib-afib-stroke-epi519",
    "title": "AFib Stroke EPI519",
    "path": "documents/afib/AFib Stroke EPI519.pdf",
    "status": "historical-archive"
  },
  {
    "id": "epidemiology-diabetes-and-stroke",
    "title": "Diabetes and stroke",
    "path": "documents/epidemiology/Diabetes and stroke.pdf",
    "status": "historical-archive"
  },
  {
    "id": "epidemiology-lipids-and-cerebrovascular-disease",
    "title": "Lipids and Cerebrovascular Disease",
    "path": "documents/epidemiology/Lipids and Cerebrovascular Disease.pdf",
    "status": "historical-archive"
  },
  {
    "id": "thrombolytic-therapy-ais-45-24h-rcts",
    "title": "Thrombolytic Therapy AIS 4.5-24h RCTs",
    "path": "documents/thrombolytic/Thrombolytic Therapy AIS 4.5-24h RCTs.pdf",
    "status": "historical-archive"
  },
  {
    "id": "exam-delirium-vs-aphasia",
    "title": "Differentiating Acute Confusional State (Delirium) from Aphasia",
    "path": "documents/exam/Differentiating Acute Confusional State (Delirium) from Aphasia.pdf",
    "status": "historical-archive"
  },
  {
    "id": "lad-symptomatic-cervical-carotid-artery-stenosis",
    "title": "Symptomatic Cervical Carotid Artery Stenosis",
    "path": "documents/lad/Symptomatic Cervical Carotid Artery Stenosis.pdf",
    "status": "historical-archive"
  },
  {
    "id": "lad-crest-2-trial-dec-2025",
    "title": "CREST-2 Trial (December 2025)",
    "path": "documents/lad/CREST-2 Trial - Dec 2025.pdf",
    "status": "historical-archive"
  },
  {
    "id": "quickref-afib-doac-start-timing",
    "title": "AFib DOAC Start Timing",
    "path": "documents/references/AFib DOAC Start Timing.pdf",
    "status": "maintained-generated",
    "component": "AfibAnticoagTimingCard",
    "educationModuleId": "afib-anticoag-timing",
    "sourcePath": "src/education.jsx"
  },
  {
    "id": "quickref-brain-death-guidelines",
    "title": "Brain Death Guidelines",
    "path": "documents/references/Brain Death Guidelines.pdf",
    "status": "maintained-generated",
    "component": "BrainDeathCard",
    "educationModuleId": "brain-death",
    "sourcePath": "src/education.jsx"
  },
  {
    "id": "quickref-cervical-artery-dissection",
    "title": "Cervical Artery Dissection",
    "path": "documents/references/Cervical Artery Dissection.pdf",
    "status": "maintained-generated",
    "component": "CervicalDissectionCard",
    "educationModuleId": "cervical-dissection",
    "sourcePath": "src/education.jsx"
  },
  {
    "id": "quickref-dapt-guidelines",
    "title": "DAPT Guidelines",
    "path": "documents/references/DAPT Guidelines.pdf",
    "status": "maintained-generated",
    "component": "DaptRegimensCard",
    "educationModuleId": "dapt-regimens",
    "sourcePath": "src/education.jsx"
  },
  {
    "id": "quickref-malignant-infarction",
    "title": "Malignant Infarction",
    "path": "documents/references/Malignant Infarction.pdf",
    "status": "maintained-generated",
    "component": "MalignantInfarctionCard",
    "educationModuleId": "malignant-infarction",
    "sourcePath": "src/education.jsx"
  },
  {
    "id": "quickref-stroke-prognosis",
    "title": "Stroke Prognosis",
    "path": "documents/references/Stroke Prognosis.pdf",
    "status": "maintained-generated",
    "component": "StrokePrognosisCard",
    "educationModuleId": "stroke-prognosis",
    "sourcePath": "src/education.jsx"
  },
  {
    "id": "quickref-toast-stroke-classification",
    "title": "TOAST Stroke Classification",
    "path": "documents/references/TOAST Stroke Classification.pdf",
    "status": "maintained-generated",
    "component": "ToastClassificationCard",
    "educationModuleId": "toast-classification",
    "sourcePath": "src/education.jsx"
  }
]);

export const MAINTAINED_DOWNLOADS = Object.freeze(DOWNLOAD_MANIFEST.filter((entry) => entry.status === 'maintained-generated'));
export const HISTORICAL_DOWNLOADS = Object.freeze(DOWNLOAD_MANIFEST.filter((entry) => entry.status === 'historical-archive'));

// Existing withdrawals only. Recovery is available from repository history;
// these paths must not be regenerated or returned to offline caches.
export const RETIRED_DOWNLOADS = freezeEntries([
  {
    "path": "documents/references/External Ventricular Drain.pdf",
    "reason": "Operational handout withdrawn during the prior source review; concept reference retained.",
    "retainedEducationModuleId": "evd-maintenance"
  },
  {
    "path": "documents/references/Intracranial Hypertension & Herniation.pdf",
    "reason": "Operational handout withdrawn during the prior source review; concept reference retained.",
    "retainedEducationModuleId": "herniation-icp"
  },
  {
    "path": "documents/exam/coma exam.pdf",
    "reason": "Prior source review retired this examination handout; no export is approved."
  }
]);

export const DOWNLOAD_BY_PATH = new Map(DOWNLOAD_MANIFEST.map((entry) => [entry.path, entry]));
export const GENERATED_DOWNLOAD_NOTE = 'Generated from the maintained education cards. Use the original sources and approved local guidance for patient-specific decisions.';
export const HISTORICAL_DOWNLOAD_NOTE = 'Historical teaching archive · Currentness not verified. Consult the current guideline or teaching card before applying clinical recommendations.';
