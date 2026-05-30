// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE INSTITUTIONAL LAYER — EXAMPLE / TEMPLATE
//
// SETUP INSTRUCTIONS:
//   1. Copy this file to  private/institutional.js  (that path is gitignored).
//   2. Replace every "[YOUR INSTITUTION]" / "Example General Hospital" etc.
//      placeholder with your real institutional content.
//   3. The file at private/institutional.js is loaded as an optional <script>
//      in index.html. It sets window.__INSTITUTIONAL_LOCAL__ before app.js.
//   4. When present locally, the app surfaces a clearly-labelled
//      "Institutional (local — not public)" section inside the
//      Protocols & Algorithms tab.
//   5. When absent (public site / GitHub Pages), nothing institutional appears.
//
// NEVER commit the populated file or any real HMC/UW/Harborview identifiers.
// The gitignore entry for  private/  and  src/institutional-protocols.local.js
// prevents accidental staging. Run  git status  before every commit to confirm.
//
// SHAPE:
//   window.__INSTITUTIONAL_LOCAL__ = {
//     institutionName: string,      // shown in the section header badge
//     sections: [                   // ordered list of protocol sections
//       {
//         id: string,               // unique slug, e.g. "bp-management"
//         title: string,            // section heading
//         subsections: [
//           {
//             heading: string,      // sub-heading (can be empty string)
//             items: string[]       // bullet-point lines (plain text)
//           }
//         ]
//       }
//     ],
//     contacts: [                   // optional; omit if not needed
//       { role: string, contact: string }
//     ],
//     lastUpdated: string,          // e.g. "2026-05-30" or "May 2026"
//     disclaimer: string            // optional caveat shown beneath section
//   }
// ─────────────────────────────────────────────────────────────────────────────

window.__INSTITUTIONAL_LOCAL__ = {
  institutionName: 'Example General Hospital',

  sections: [
    {
      id: 'alert-activation',
      title: 'Stroke Alert Activation',
      subsections: [
        {
          heading: 'Activation criteria',
          items: [
            'Acute focal neurological deficit ≤24 h (or wake-up) with clinical suspicion for stroke.',
            'ED provider, nurse, or triage staff may activate.',
            '[YOUR INSTITUTION] activates via [PAGE/RADIO/EHR order — fill in].',
          ]
        },
        {
          heading: 'Team composition',
          items: [
            'Stroke attending / fellow on-call.',
            'Bedside RN + charge nurse.',
            'CT tech pre-positioned for immediate scan.',
            '[Pharmacy / rapid-response — fill in].',
          ]
        }
      ]
    },
    {
      id: 'bp-management',
      title: 'Blood Pressure Management',
      subsections: [
        {
          heading: 'Pre-IVT target (<185/110)',
          items: [
            'First-line: Labetalol 10 mg IV q15 min (max 300 mg / 2 h).',
            'Alternative: Nicardipine infusion per [INSTITUTION] pharmacy drip protocol.',
            'Document BP confirmation before thrombolytic administration.',
          ]
        },
        {
          heading: 'Post-IVT 24 h target (<180/105)',
          items: [
            'Neuro-checks q15 min × 2 h → q30 min × 6 h → q1 h until 24 h.',
            'Notify stroke team for BP >180 systolic or new neuro change.',
            '[INSTITUTION] drip protocol: [fill in your formulary choice].',
          ]
        }
      ]
    },
    {
      id: 'ivt-doac-pathway',
      title: 'IVT in DOAC-Exposed Patients',
      subsections: [
        {
          heading: '[YOUR INSTITUTION] hub pathway',
          items: [
            'Requires STAT anti-Xa level UNDETECTABLE.',
            'Attending attestation documented in note prior to administration.',
            'Contact stroke attending directly for any uncertainty — do not delay scan.',
          ]
        }
      ]
    },
    {
      id: 'evt-workflow',
      title: 'EVT / Thrombectomy Workflow',
      subsections: [
        {
          heading: 'Activation & transfer',
          items: [
            '[YOUR INSTITUTION] neurointerventional on-call: [pager/contact — fill in].',
            'Direct-to-angio for confirmed LVO when IVT not indicated.',
            'Transfer spoke → hub: [INSTITUTION transfer line — fill in].',
          ]
        }
      ]
    }
  ],

  contacts: [
    { role: 'Stroke attending on-call', contact: '[pager / EHR message pool — fill in]' },
    { role: 'Neurointerventional on-call', contact: '[pager — fill in]' },
    { role: 'Stroke coordinator', contact: '[phone / pager — fill in]' },
    { role: 'Pharmacy (thrombolytics)', contact: '[extension — fill in]' }
  ],

  lastUpdated: '[DATE — fill in]',
  disclaimer: 'This content is institution-specific and for LOCAL USE ONLY. ' +
    'It is NOT part of the public application and is never committed or deployed. ' +
    'Verify against your current institutional policy before clinical use.'
};
