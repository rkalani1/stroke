// src/evidence/topics.js
// Topic taxonomy used for filtering and cross-linking. Flat list with optional
// parentId; mirrors the existing trialsData.category structure.

import { makeTopic } from './schema.js';

export const topics = [
  makeTopic({ id: 'acute-ischemic-stroke', label: 'Acute ischemic stroke' }),
  makeTopic({ id: 'extended-window-ivt', label: 'Extended-window IV thrombolysis', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'wake-up-stroke', label: 'Wake-up / unknown-onset stroke', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'tnk-vs-alteplase', label: 'Tenecteplase vs alteplase', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-large-core', label: 'EVT for large-core infarct', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-late-window', label: 'EVT in late window (6-24h)', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'evt-mevo', label: 'EVT for medium / distal vessel occlusion', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'ia-adjunct-after-evt', label: 'IA adjunctive thrombolysis after EVT', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'crao-thrombolysis', label: 'CRAO thrombolysis', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'ivt-on-doac', label: 'IV thrombolysis in DOAC-treated patients', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'tandem-lesions', label: 'Tandem lesions', parentId: 'acute-ischemic-stroke' }),
  makeTopic({ id: 'icas-prevention', label: 'Intracranial atherosclerotic disease — secondary prevention' }),

  makeTopic({ id: 'ich', label: 'Intracerebral hemorrhage' }),
  makeTopic({ id: 'ich-bp-management', label: 'ICH blood pressure management', parentId: 'ich' }),
  makeTopic({ id: 'ich-anticoag-reversal', label: 'Anticoagulant-associated ICH reversal', parentId: 'ich' }),
  makeTopic({ id: 'ich-surgery', label: 'ICH surgical evacuation', parentId: 'ich' }),
  makeTopic({ id: 'ich-secondary-prevention', label: 'Secondary prevention after ICH (AF, statin)', parentId: 'ich' }),

  makeTopic({ id: 'sah', label: 'Aneurysmal subarachnoid hemorrhage' }),
  makeTopic({ id: 'cvt', label: 'Cerebral venous thrombosis' }),

  makeTopic({ id: 'secondary-prevention', label: 'Secondary stroke prevention' }),
  makeTopic({ id: 'dapt-minor-stroke', label: 'DAPT for minor stroke / high-risk TIA', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'af-anticoag-timing', label: 'AF anticoagulation timing after stroke', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'af-after-ich', label: 'Anticoagulation in AF after ICH', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'pfo-closure', label: 'PFO closure', parentId: 'secondary-prevention' }),
  makeTopic({ id: 'carotid-revasc', label: 'Carotid revascularization', parentId: 'secondary-prevention' }),

  makeTopic({ id: 'rehabilitation', label: 'Stroke rehabilitation' }),
  makeTopic({ id: 'cadasil', label: 'CADASIL and monogenic small-vessel disease' }),
  makeTopic({ id: 'cognitive-trajectories', label: 'Post-stroke cognitive trajectories' }),
  makeTopic({ id: 'special-populations', label: 'Special populations (pregnancy, cancer, pediatrics)' }),

  makeTopic({ id: 'imaging-selection', label: 'Imaging selection for reperfusion' })
];

const topicById = new Map(topics.map((t) => [t.id, t]));

export function getTopic(id) {
  return topicById.get(id) || null;
}

export function topicLabel(id) {
  return topicById.get(id)?.label || id || '';
}
