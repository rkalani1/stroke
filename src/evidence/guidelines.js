// src/evidence/guidelines.js
// Lightweight guideline registry. The Atlas leans on AHA/ASA / ESO statements;
// records here are display-only metadata that link to citations and to topics.

import { makeGuideline } from './schema.js';

const lr = '2026-04-25';

export const guidelines = [
  makeGuideline({
    id: 'gl-aha-ais-2026',
    name: 'Early Management of Acute Ischemic Stroke',
    organization: 'AHA/ASA',
    year: 2026,
    topic: 'acute-ischemic-stroke',
    url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000513',
    citationId: '',
    verificationStatus: 'verified-guideline',
    lastReviewed: lr,
    verificationNotes: ''
  }),
  makeGuideline({
    id: 'gl-aha-ich-2022',
    name: 'Spontaneous Intracerebral Hemorrhage',
    organization: 'AHA/ASA',
    year: 2022,
    topic: 'ich',
    url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000407',
    citationId: 'cit-aha-ich-2022',
    verificationStatus: 'verified-guideline',
    lastReviewed: lr
  }),
  makeGuideline({
    id: 'gl-aha-secondary-2021',
    name: 'Secondary Stroke Prevention in Patients With Stroke and TIA',
    organization: 'AHA/ASA',
    year: 2021,
    topic: 'secondary-prevention',
    url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000375',
    citationId: 'cit-aha-secondary-2021',
    verificationStatus: 'verified-guideline',
    lastReviewed: lr
  }),
  makeGuideline({
    id: 'gl-aha-sah-2023',
    name: 'Aneurysmal Subarachnoid Hemorrhage',
    organization: 'AHA/ASA',
    year: 2023,
    topic: 'sah',
    url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000436',
    citationId: 'cit-aha-sah-2023',
    verificationStatus: 'verified-guideline',
    lastReviewed: lr
  }),
  makeGuideline({
    id: 'gl-aha-cvt-2024',
    name: 'Cerebral Venous Thrombosis',
    organization: 'AHA/ASA',
    year: 2024,
    topic: 'cvt',
    url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000456',
    citationId: 'cit-aha-cvt-2024',
    verificationStatus: 'verified-guideline',
    lastReviewed: lr
  }),
  makeGuideline({
    id: 'gl-aha-maternal-2026',
    name: 'Maternal Stroke',
    organization: 'AHA/ASA',
    year: 2026,
    topic: 'special-populations',
    url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000514',
    citationId: 'cit-aha-maternal-2026',
    verificationStatus: 'verified-guideline',
    lastReviewed: lr
  }),
  makeGuideline({
    id: 'gl-eso-tnk-2023',
    name: 'Tenecteplase expedited recommendation',
    organization: 'European Stroke Organisation',
    year: 2023,
    topic: 'tnk-vs-alteplase',
    url: 'https://journals.sagepub.com/doi/full/10.1177/23969873231177508',
    citationId: 'cit-eso-tnk-2023',
    verificationStatus: 'verified-guideline',
    lastReviewed: lr
  })
];

const byId = new Map(guidelines.map((g) => [g.id, g]));

export function getGuideline(id) {
  return byId.get(id) || null;
}
