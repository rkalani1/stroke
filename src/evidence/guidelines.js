// Maintained source identities; review dates retained.
export const guidelines = [
  {
    "id": "gl-aha-ais-2026",
    "name": "Early Management of Acute Ischemic Stroke",
    "organization": "AHA/ASA",
    "year": 2026,
    "topic": "acute-ischemic-stroke",
    "url": "https://www.ahajournals.org/doi/10.1161/STR.0000000000000513",
    "citationId": "cit-aha-ais-2026",
    "verificationStatus": "verified-guideline",
    "lastReviewed": "2026-04-25",
    "verificationNotes": ""
  },
  {
    "id": "gl-aha-ich-2022",
    "name": "Spontaneous Intracerebral Hemorrhage",
    "organization": "AHA/ASA",
    "year": 2022,
    "topic": "ich",
    "url": "https://www.ahajournals.org/doi/10.1161/STR.0000000000000407",
    "citationId": "cit-aha-ich-2022",
    "verificationStatus": "verified-guideline",
    "lastReviewed": "2026-04-25",
    "verificationNotes": ""
  },
  {
    "id": "gl-eso-tnk-2023",
    "name": "Tenecteplase expedited recommendation",
    "organization": "European Stroke Organisation",
    "year": 2023,
    "topic": "tnk-vs-alteplase",
    "url": "https://doi.org/10.1177/23969873221150022",
    "citationId": "cit-eso-tnk-2023",
    "verificationStatus": "verified-guideline",
    "lastReviewed": "2026-04-25",
    "verificationNotes": ""
  },
  {
    "id": "gl-aha-mis-ich-2026",
    "name": "Minimally Invasive Surgical Evacuation of Supratentorial ICH (Science Advisory)",
    "organization": "AHA/ASA",
    "year": 2026,
    "topic": "ich-surgery",
    "url": "https://www.ahajournals.org/doi/10.1161/STR.0000000000000529",
    "citationId": "cit-aha-mis-ich-2026",
    "verificationStatus": "verified-guideline",
    "lastReviewed": "2026-09-26",
    "verificationNotes": "Ungraded science advisory; no COR/LOE."
  }
];

const byId = new Map(guidelines.map(record => [record.id, record]));
export function getGuideline(id) { return byId.get(id) || null; }
export function getAllGuidelineIds() { return new Set(byId.keys()); }
