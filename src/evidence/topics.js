// src/evidence/topics.js
// Topic taxonomy used for filtering and cross-linking. Flat list with optional
// parentId; mirrors the existing trialsData.category structure.
//
// PHILOSOPHY (post-v5.35.0 cleanup):
// — Disease-area topics (ich, sah, cvt, secondary-prevention) and parent topics
//   are kept even when no atlas data references them yet. They define the UI's
//   topic-tree filter.
// — Pure-placeholder topics (no data, no parent role) were trimmed in v5.35.0:
//   removed `ivt-on-doac`, `cadasil`, `special-populations`, `imaging-selection`.
//   Add back when atlas data lands for them.

import { makeTopic } from './schema.js';

export const topics = [
  makeTopic({ id: 'acute-ischemic-stroke', label: 'Acute ischemic stroke' }),
  makeTopic({ id: 'extended-window-ivt', label: 'Extended-window IV thrombolysis', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'wake-up-stroke', label: 'Wake-up / unknown-onset stroke', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'tnk-vs-alteplase', label: 'Tenecteplase vs alteplase', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'novel-thrombolytics', label: 'Novel thrombolytics (reteplase, non-immunogenic staphylokinase)', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'minor-stroke-thrombolysis', label: 'Thrombolysis vs antiplatelets in minor non-disabling stroke', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-technique', label: 'EVT technique & adjuncts (catheters, bailout stenting, anesthesia)', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-early-window', label: 'EVT in early window (0-6h) — landmark trials', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-large-core', label: 'EVT for large-core infarct', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-late-window', label: 'EVT in late window (6-24h)', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'bp-post-evt', label: 'Blood pressure target after EVT', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-mevo', label: 'EVT for medium / distal vessel occlusion', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-basilar', label: 'EVT for basilar-artery occlusion', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'ia-adjunct-after-evt', label: 'IA adjunctive thrombolysis after EVT', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'crao-thrombolysis', label: 'CRAO thrombolysis', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'tandem-lesions', label: 'Tandem lesions', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'icas-prevention', label: 'Intracranial atherosclerotic disease — secondary prevention' }),

  makeTopic({ id: 'ich', label: 'Intracerebral hemorrhage' }),
  makeTopic({ id: 'ich-bp-management', label: 'ICH blood pressure management', parentId: 'ich' }),
  makeTopic({ id: 'ich-anticoag-reversal', label: 'Anticoagulant-associated ICH reversal', parentId: 'ich' }),
  makeTopic({ id: 'ich-surgery', label: 'ICH surgical evacuation', parentId: 'ich' }),
  makeTopic({ id: 'ich-secondary-prevention', label: 'Secondary prevention after ICH (AF, statin)', parentId: 'ich' }),
  makeTopic({ id: 'ich-hemostatic', label: 'ICH hemostatic therapy (antifibrinolytics, factor concentrates)', parentId: 'ich' }),
  makeTopic({ id: 'ivh-management', label: 'Intraventricular hemorrhage & EVD thrombolysis', parentId: 'ich' }),
  makeTopic({ id: 'prehospital-stroke-care', label: 'Prehospital stroke care (mobile stroke units, ambulance triage & BP)' }),

  makeTopic({ id: 'sah', label: 'Aneurysmal subarachnoid hemorrhage' }),
  makeTopic({ id: 'sah-critical-care', label: 'aSAH critical care (transfusion, CSF drainage, antifibrinolytics)', parentId: 'sah' }),
  makeTopic({ id: 'aneurysm-treatment', label: 'Ruptured aneurysm securing (clip vs coil)', parentId: 'sah' }),
  makeTopic({ id: 'unruptured-aneurysms', label: 'Unruptured intracranial aneurysms — rupture risk & management' }),
  makeTopic({ id: 'cvt', label: 'Cerebral venous thrombosis' }),

  makeTopic({ id: 'secondary-prevention', label: 'Secondary stroke prevention' }),
  makeTopic({ id: 'dapt-minor-stroke', label: 'DAPT for minor stroke / high-risk TIA', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'af-anticoag-timing', label: 'AF anticoagulation timing after stroke', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'af-after-ich', label: 'Anticoagulation in AF after ICH', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'pfo-closure', label: 'PFO closure', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'carotid-revasc', label: 'Carotid revascularization', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'esus', label: 'Embolic stroke of undetermined source (ESUS)', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'lacunar-svd-prevention', label: 'Lacunar stroke & small-vessel disease — secondary prevention', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'subclinical-af', label: 'Device-detected / subclinical atrial fibrillation', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'laa-occlusion', label: 'Left atrial appendage occlusion', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'valvular-rheumatic-af', label: 'Valvular & rheumatic atrial fibrillation', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'inflammation-stroke-prevention', label: 'Anti-inflammatory therapy for stroke prevention (colchicine)', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'factor-xi-inhibition', label: 'Factor XI / XIa inhibition', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'acute-antithrombotic-adjuncts', label: 'Acute antithrombotic adjuncts (tirofiban, argatroban, eptifibatide)', parentId: 'acute-ischemic-stroke' }),

  makeTopic({ id: 'rehabilitation', label: 'Stroke rehabilitation' }),
  makeTopic({ id: 'bp-targets-prevention', label: 'Blood-pressure targets for vascular prevention', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'malignant-edema', label: 'Malignant cerebral edema — prevention & treatment', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'neurocritical-care', label: 'Neurocritical care of severe stroke (fever, airway, tracheostomy)' }),
  makeTopic({ id: 'ec-ic-bypass', label: 'EC-IC bypass for symptomatic occlusion', parentId: 'icas-prevention' }),
  makeTopic({ id: 'cognitive-trajectories', label: 'Post-stroke cognitive trajectories' }),
  makeTopic({ id: 'special-populations', label: 'Special populations (pregnancy, cancer, pediatrics)' })
];

const topicById = new Map(topics.map((t) => [t.id, t]));

export function getTopic(id) {
  return topicById.get(id) || null;
}

export function topicLabel(id) {
  return topicById.get(id)?.label || id || '';
}
