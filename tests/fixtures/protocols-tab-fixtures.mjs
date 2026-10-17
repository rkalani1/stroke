// Synthetic Encounter states for the Protocols-tab preservation lock
// (scripts/protocols-tab-lock.mjs). Every value is fabricated test data.
//
// The lock renders the built app with a fixed clock, time zone and locale,
// enters each fixture through the Encounter UI, opens each Protocols sub-tab
// and compares the complete rendered Protocols surface (status banner, bedside
// quick reference, linked-data note and protected protocols, including
// disclosures, modals, tooltips, links and structure) with a checked-in
// baseline captured before the 7.8 review began.
//
// Step forms:
//   ['select', ariaLabel, value]    choose an option value
//   ['fill', ariaLabel, value]      type into an input
//   ['weight', value]               the shared weight input
//   ['unit', 'kg' | 'lb']           weight unit toggle
//   ['check', ariaText]             tick the checkbox whose label contains the text
//   ['vessel', name]                toggle a vessel-occlusion chip
//   ['nihssReported', total]        reported NIHSS total

// Fixed clock: Saturday 2026-10-17 14:00 America/Los_Angeles (PDT, UTC-7).
export const FIXED_NOW_ISO = '2026-10-17T21:00:00.000Z';
export const TIMEZONE = 'America/Los_Angeles';
export const LOCALE = 'en-US';

const lkw = (date, time) => [['fill', 'LKW date (local)', date], ['fill', 'LKW time (local)', time]];
const bp = (s, d) => [['fill', 'Systolic BP (mmHg)', String(s)], ['fill', 'Diastolic BP (mmHg)', String(d)]];
const ais = [['select', 'Working diagnosis', 'ischemic']];
const ich = [['select', 'Working diagnosis', 'ich']];
const abc2 = (a, b, t, n) => [['fill', 'A: largest diameter (cm)', a], ['fill', 'B: perpendicular diameter (cm)', b], ['fill', 'Slice thickness (mm)', t], ['fill', 'Number of hematoma slices', n]];
const gcs = (e, v, m) => [['select', 'GCS Eye', e], ['select', 'GCS Verbal', v], ['select', 'GCS Motor', m]];

export const PROTOCOL_TAB_FIXTURES = [
  { id: 'empty', steps: [] },
  { id: 'ais-ivt-window-tnk', steps: [
    ...ais, ['fill', 'Age (years)', '68'], ['select', 'Sex', 'M'], ['weight', '82'], ['select', 'Baseline mRS', '0'],
    ...lkw('2026-10-17', '12:30'), ...bp(172, 94), ['fill', 'Glucose (mg/dL)', '142'], ['select', 'CT hemorrhage review', 'absent'],
    ['nihssReported', '12'], ['select', 'Disabling residual deficit', 'true'], ['fill', 'Reviewed ASPECTS (0–10)', '9'], ['vessel', 'M1'],
    ['select', 'Anticoagulant exposure', 'none'], ['select', 'Selected IV thrombolytic', 'TNK']
  ] },
  { id: 'ais-apixaban-held', steps: [
    ...ais, ['fill', 'Age (years)', '71'], ['select', 'Sex', 'F'], ['weight', '66'], ['select', 'Baseline mRS', '1'],
    ...lkw('2026-10-17', '12:10'), ...bp(168, 88), ['fill', 'Glucose (mg/dL)', '118'], ['select', 'CT hemorrhage review', 'absent'],
    ['nihssReported', '9'], ['select', 'Disabling residual deficit', 'true'], ['fill', 'Reviewed ASPECTS (0–10)', '10'],
    ['select', 'Anticoagulant exposure', 'apixaban'], ['fill', 'Last anticoagulant dose (local)', '2026-10-17T06:00']
  ] },
  { id: 'ais-unassessed-lb', steps: [
    ...ais, ['fill', 'Age (years)', '57'], ['unit', 'lb'], ['weight', '181'], ...lkw('2026-10-17', '13:05'), ...bp(150, 80),
    ['fill', 'Glucose (mg/dL)', '96'], ['nihssReported', '4'], ['select', 'Disabling residual deficit', 'false']
  ] },
  { id: 'ais-late-ctp-high-bp-low-glucose', steps: [
    ...ais, ['fill', 'Age (years)', '64'], ['weight', '90'], ['select', 'Baseline mRS', '0'], ...lkw('2026-10-17', '01:30'), ...bp(190, 105),
    ['fill', 'Glucose (mg/dL)', '45'], ['select', 'CT hemorrhage review', 'absent'], ['nihssReported', '16'], ['select', 'Disabling residual deficit', 'true'],
    ['fill', 'Reviewed ASPECTS (0–10)', '7'], ['vessel', 'ICA'], ['vessel', 'M1'], ['fill', 'Ischemic core (mL)', '22'],
    ['fill', 'Total hypoperfused volume (mL, including core)', '90'], ['select', 'Anticoagulant exposure', 'none']
  ] },
  { id: 'ais-wakeup-mri-m2', steps: [
    ...ais, ['fill', 'Age (years)', '59'], ['weight', '77'], ['select', 'Baseline mRS', '0'], ['check', 'Last known well is unknown'],
    ['fill', 'Discovery date (local)', '2026-10-17'], ['fill', 'Discovery time (local)', '12:45'], ...bp(160, 85), ['fill', 'Glucose (mg/dL)', '110'],
    ['select', 'CT hemorrhage review', 'absent'], ['nihssReported', '8'], ['select', 'Disabling residual deficit', 'true'], ['fill', 'Reviewed ASPECTS (0–10)', '8'],
    ['vessel', 'M2'], ['select', 'M2 segment / dominance', 'dominant-proximal'], ['select', 'MRI pathway selected (No = CTP / EXTEND)', 'true'],
    ['select', 'DWI positive lesion', 'true'], ['select', 'FLAIR without marked hyperintensity', 'true'], ['select', 'DWI lesion smaller than one-third MCA territory', 'true'],
    ['select', 'Anticoagulant exposure', 'none']
  ] },
  { id: 'ais-basilar-midnight-warfarin', steps: [
    ...ais, ['fill', 'Age (years)', '74'], ['weight', '95'], ['select', 'Baseline mRS', '1'], ...lkw('2026-10-16', '23:30'), ...bp(178, 92),
    ['fill', 'Glucose (mg/dL)', '130'], ['select', 'CT hemorrhage review', 'absent'], ['nihssReported', '22'], ['select', 'Disabling residual deficit', 'true'],
    ['fill', 'Reviewed pc-ASPECTS (0–10)', '8'], ['vessel', 'Basilar'], ['select', 'Anticoagulant exposure', 'warfarin'], ['fill', 'INR', '1.4']
  ] },
  { id: 'ais-large-core-heavy-alteplase', steps: [
    ...ais, ['fill', 'Age (years)', '61'], ['weight', '130'], ['select', 'Baseline mRS', '0'], ...lkw('2026-10-17', '10:00'), ...bp(165, 90),
    ['fill', 'Glucose (mg/dL)', '150'], ['select', 'CT hemorrhage review', 'absent'], ['nihssReported', '20'], ['select', 'Disabling residual deficit', 'true'],
    ['fill', 'Reviewed ASPECTS (0–10)', '4'], ['vessel', 'ICA'], ['vessel', 'M1'], ['fill', 'Ischemic core (mL)', '85'],
    ['fill', 'Total hypoperfused volume (mL, including core)', '160'], ['select', 'Significant mass effect', 'false'],
    ['select', 'Anticoagulant exposure', 'none'], ['select', 'Selected IV thrombolytic', 'Alteplase']
  ] },
  { id: 'ais-mevo-elderly-dabigatran-lowweight', steps: [
    ...ais, ['fill', 'Age (years)', '86'], ['weight', '38'], ['select', 'Baseline mRS', '2'], ...lkw('2026-10-17', '13:15'), ...bp(142, 76),
    ['fill', 'Glucose (mg/dL)', '101'], ['select', 'CT hemorrhage review', 'absent'], ['nihssReported', '5'], ['select', 'Disabling residual deficit', 'false'],
    ['fill', 'Reviewed ASPECTS (0–10)', '10'], ['vessel', 'M3 / distal'], ['vessel', 'PCA'],
    ['select', 'Anticoagulant exposure', 'dabigatran'], ['fill', 'Last anticoagulant dose (local)', '2026-10-16T20:00'], ['fill', 'aPTT (seconds)', '38']
  ] },
  { id: 'ich-apixaban-abc2', steps: [
    ...ich, ['fill', 'Age (years)', '72'], ['weight', '70'], ...lkw('2026-10-17', '11:00'), ...bp(196, 104), ['fill', 'Glucose (mg/dL)', '180'],
    ['select', 'Anticoagulant exposure', 'apixaban'], ['fill', 'Last anticoagulant dose (local)', '2026-10-17T08:00'],
    ...abc2('4.2', '3.1', '5', '6'), ...gcs('3', '4', '6'), ['select', 'Intraventricular hemorrhage', 'true'], ['select', 'Infratentorial origin', 'false']
  ] },
  { id: 'ich-warfarin-large', steps: [
    ...ich, ['fill', 'Age (years)', '80'], ['weight', '64'], ...lkw('2026-10-17', '09:40'), ...bp(205, 110), ['select', 'Anticoagulant exposure', 'warfarin'], ['fill', 'INR', '3.1'],
    ...abc2('6', '5', '5', '10'), ...gcs('2', '2', '5'), ['select', 'Intraventricular hemorrhage', 'true'], ['select', 'Infratentorial origin', 'true']
  ] },
  { id: 'ich-dabigatran', steps: [
    ...ich, ['fill', 'Age (years)', '55'], ['weight', '90'], ['select', 'Anticoagulant exposure', 'dabigatran'], ['fill', 'Last anticoagulant dose (local)', '2026-10-17T02:00'],
    ...bp(184, 98), ...gcs('4', '5', '6')
  ] },
  { id: 'ich-rivaroxaban-unknown-dose', steps: [
    ...ich, ['fill', 'Age (years)', '66'], ['weight', '58'], ['select', 'Anticoagulant exposure', 'rivaroxaban']
  ] },
  { id: 'ich-heparin-therapeutic', steps: [
    ...ich, ['fill', 'Age (years)', '63'], ['weight', '101'], ['select', 'Anticoagulant exposure', 'heparin'], ['select', 'UFH dose intent', 'therapeutic'], ['fill', 'aPTT (seconds)', '85']
  ] },
  { id: 'sah-lmwh', steps: [
    ['select', 'Working diagnosis', 'sah'], ['fill', 'Age (years)', '49'], ['weight', '75'], ['select', 'Anticoagulant exposure', 'lmwh'],
    ['fill', 'Last anticoagulant dose (local)', '2026-10-17T09:00'], ['select', 'LMWH dose intent', 'therapeutic']
  ] },
  { id: 'tia', steps: [
    ['select', 'Working diagnosis', 'tia'], ['fill', 'Age (years)', '59'], ['weight', '84'], ...lkw('2026-10-17', '09:00'), ...bp(150, 90)
  ] },
  { id: 'follow-up-ischemic-apixaban', steps: [
    ...ais, ['select', 'Context', 'follow-up'], ['fill', 'Age (years)', '70'], ['weight', '80'], ['select', 'Anticoagulant exposure', 'apixaban']
  ] },
  { id: 'ais-pediatric', steps: [
    ...ais, ['fill', 'Age (years)', '10'], ['weight', '30'], ...lkw('2026-10-17', '13:00'), ...bp(120, 70), ['fill', 'Glucose (mg/dL)', '95'],
    ['select', 'CT hemorrhage review', 'absent'], ['nihssReported', '6'], ['select', 'Disabling residual deficit', 'true'], ['select', 'Anticoagulant exposure', 'none']
  ] },
  { id: 'ais-late-lvo-negative', steps: [
    ...ais, ['fill', 'Age (years)', '66'], ['weight', '72'], ['select', 'Baseline mRS', '0'], ...lkw('2026-10-17', '03:00'), ...bp(158, 84), ['fill', 'Glucose (mg/dL)', '120'],
    ['select', 'CT hemorrhage review', 'absent'], ['nihssReported', '7'], ['select', 'Disabling residual deficit', 'true'], ['vessel', 'None'], ['select', 'Anticoagulant exposure', 'none']
  ] },
  { id: 'ais-post-evt-tici-2b', steps: [
    ...ais, ['fill', 'Age (years)', '69'], ['weight', '88'], ...lkw('2026-10-17', '08:30'), ...bp(150, 80), ['nihssReported', '14'], ['vessel', 'M1'],
    ['select', 'Anticoagulant exposure', 'none'], ['select', 'Recorded mTICI grade', '2b']
  ], protocolSteps: [['pbutton', 'Post-EVT']], subtabs: ['ischemic'] },
  { id: 'ais-ivt-window-tnk-protocol-interactions', steps: [
    ...ais, ['fill', 'Age (years)', '68'], ['select', 'Sex', 'M'], ['weight', '82'], ['select', 'Baseline mRS', '0'],
    ...lkw('2026-10-17', '12:30'), ...bp(172, 94), ['fill', 'Glucose (mg/dL)', '142'], ['select', 'CT hemorrhage review', 'absent'],
    ['nihssReported', '12'], ['select', 'Disabling residual deficit', 'true'], ['fill', 'Reviewed ASPECTS (0–10)', '9'], ['vessel', 'M1'],
    ['select', 'Anticoagulant exposure', 'none'], ['select', 'Selected IV thrombolytic', 'TNK']
  ], protocolSteps: [['pcheck', 'Absolute and relative contraindications'], ['pbutton', 'Post-TNK'], ['pbutton', 'M2 / Distal']], subtabs: ['ischemic'] },
  { id: 'ais-late-ctp-protocol-interactions', steps: [
    ...ais, ['fill', 'Age (years)', '64'], ['weight', '90'], ['select', 'Baseline mRS', '0'], ...lkw('2026-10-17', '01:30'), ...bp(170, 95),
    ['fill', 'Glucose (mg/dL)', '130'], ['select', 'CT hemorrhage review', 'absent'], ['nihssReported', '16'], ['select', 'Disabling residual deficit', 'true'],
    ['fill', 'Reviewed ASPECTS (0–10)', '7'], ['vessel', 'M1'], ['fill', 'Ischemic core (mL)', '22'],
    ['fill', 'Total hypoperfused volume (mL, including core)', '90'], ['select', 'Anticoagulant exposure', 'none']
  ], protocolSteps: [['pcheck', 'Absolute and relative contraindications'], ['pbutton', 'Post-EVT'], ['pbutton', 'Basilar']], subtabs: ['ischemic'] },
  { id: 'ich-abc2-unit-warning', steps: [
    ...ich, ['fill', 'Age (years)', '58'], ['weight', '76'], ...abc2('40', '30', '5', '6'), ...gcs('4', '5', '6')
  ] },
  { id: 'ich-warfarin-inr-boundaries', steps: [
    ...ich, ['fill', 'Age (years)', '77'], ['weight', '120'], ['select', 'Anticoagulant exposure', 'warfarin'], ['fill', 'INR', '2.0']
  ], subtabs: ['ich'] },
  { id: 'ich-warfarin-inr-1-3', steps: [
    ...ich, ['fill', 'Age (years)', '77'], ['weight', '60'], ['select', 'Anticoagulant exposure', 'warfarin'], ['fill', 'INR', '1.3']
  ], subtabs: ['ich'] },
  { id: 'ich-apixaban-future-dose', steps: [
    ...ich, ['fill', 'Age (years)', '70'], ['weight', '70'], ['select', 'Anticoagulant exposure', 'apixaban'], ['fill', 'Last anticoagulant dose (local)', '2026-10-17T16:00']
  ], subtabs: ['ich'] }
];
