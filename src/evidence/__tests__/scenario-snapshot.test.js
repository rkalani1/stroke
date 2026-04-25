// src/evidence/__tests__/scenario-snapshot.test.js
//
// Engine-scenario regression suite. Was the parity test in earlier
// sprints (engine vs legacy). After legacy retirement, this is the
// frozen snapshot of expected engine behavior for every (synthetic
// patient scenario, active trial) pair.
//
// The snapshot in expected-snapshot.js was captured when engine and
// legacy were in full parity (210 assertions passing). After the
// legacy was deleted, the snapshot stands alone as a regression
// guard: any future change to the engine, the matcherCriteria
// arrays, or the matcherExclusions arrays that alters a trial's
// status under any of these scenarios will fail the suite.
//
// Regeneration: run /tmp/retire-legacy.mjs to refresh both the
// snapshot module and this scenario list.

import { describe, it, expect } from 'vitest';
import { evaluateActiveTrial as engineEvaluateActiveTrial } from '../matcher-engine.js';
import { activeTrials } from '../index.js';
import { EXPECTED_SNAPSHOT } from './expected-snapshot.js';

const SCENARIOS = [
  {
    "name": "empty form",
    "data": {
      "telestrokeNote": {
        "age": "",
        "nihss": "",
        "premorbidMRS": "",
        "vesselOcclusion": []
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": null,
      "nihssScore": null,
      "mrsScore": null,
      "hoursFromLKW": null,
      "lkwTime": null
    }
  },
  {
    "name": "SISTER eligible — late-window non-LVO with mismatch",
    "data": {
      "telestrokeNote": {
        "age": "65",
        "nihss": "12",
        "premorbidMRS": "1",
        "tnkRecommended": false,
        "evtRecommended": false,
        "ctpResults": "CTP shows mismatch with penumbra >50 cc",
        "vesselOcclusion": [
          "M2"
        ]
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": 8,
      "nihssScore": 12,
      "mrsScore": 0,
      "hoursFromLKW": 8
    }
  },
  {
    "name": "STEP-EVT MeVO",
    "data": {
      "telestrokeNote": {
        "age": "50",
        "nihss": "8",
        "premorbidMRS": "1",
        "vesselOcclusion": [
          "M2"
        ]
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": 8,
      "nihssScore": 8,
      "mrsScore": 0,
      "hoursFromLKW": 6
    }
  },
  {
    "name": "STEP-EVT low-NIHSS LVO",
    "data": {
      "telestrokeNote": {
        "age": "70",
        "nihss": "4",
        "premorbidMRS": "0",
        "vesselOcclusion": [
          "M1"
        ]
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": 8,
      "nihssScore": 4,
      "mrsScore": 0,
      "hoursFromLKW": 4
    }
  },
  {
    "name": "TESTED — pre-existing disability LVO",
    "data": {
      "telestrokeNote": {
        "age": "78",
        "nihss": "14",
        "premorbidMRS": "3",
        "vesselOcclusion": [
          "M1"
        ]
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": 6,
      "nihssScore": 14,
      "mrsScore": 0,
      "hoursFromLKW": 10
    }
  },
  {
    "name": "PICASSO — tandem",
    "data": {
      "telestrokeNote": {
        "age": "60",
        "nihss": "14",
        "premorbidMRS": "1",
        "ctaResults": "tandem extracranial carotid + intracranial M1 occlusion",
        "vesselOcclusion": [
          "M1"
        ]
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": 8,
      "nihssScore": 14,
      "mrsScore": 0,
      "hoursFromLKW": 8
    }
  },
  {
    "name": "boundary — NIHSS = 6",
    "data": {
      "telestrokeNote": {
        "age": "40",
        "nihss": "6",
        "premorbidMRS": "0",
        "vesselOcclusion": [
          "M1"
        ]
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": 8,
      "nihssScore": 6,
      "mrsScore": 0,
      "hoursFromLKW": 3
    }
  },
  {
    "name": "late >24 h",
    "data": {
      "telestrokeNote": {
        "age": "60",
        "nihss": "10",
        "premorbidMRS": "0",
        "tnkRecommended": false,
        "evtRecommended": false,
        "ctpResults": "mismatch",
        "vesselOcclusion": [
          "M1"
        ]
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": 7,
      "nihssScore": 10,
      "mrsScore": 0,
      "hoursFromLKW": 25
    }
  },
  {
    "name": "ICH lobar on statin (SATURN candidate)",
    "data": {
      "telestrokeNote": {
        "age": "72",
        "diagnosisCategory": "ich"
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "ichLocation": "lobar parietal",
      "onStatin": true,
      "mrsScore": 3,
      "hoursFromLKW": null
    }
  },
  {
    "name": "ICH + AF (ASPIRE)",
    "data": {
      "telestrokeNote": {
        "age": "70",
        "diagnosisCategory": "ich",
        "pmh": "long history of afib, htn, dm"
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "mrsScore": 3,
      "hoursFromLKW": null
    }
  },
  {
    "name": "TIA + ICAS (CAPTIVA)",
    "data": {
      "telestrokeNote": {
        "age": "60",
        "diagnosisCategory": "tia",
        "ctaResults": "severe MCA stenosis suggestive of intracranial atherosclerosis",
        "premorbidMRS": "1"
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      }
    }
  },
  {
    "name": "pediatric (age 12)",
    "data": {
      "telestrokeNote": {
        "age": "12",
        "nihss": "5",
        "premorbidMRS": "0",
        "vesselOcclusion": [
          "M1"
        ]
      },
      "strokeCodeForm": {
        "age": "",
        "nihss": ""
      },
      "aspectsScore": 8,
      "nihssScore": 5,
      "mrsScore": 0,
      "hoursFromLKW": 3
    }
  },
  {
    "name": "SISTER eligible BUT prior stroke <90 days",
    "data": {
      "telestrokeNote": {
        "age": "65",
        "nihss": "12",
        "premorbidMRS": "1",
        "tnkRecommended": false,
        "evtRecommended": false,
        "ctpResults": "mismatch on CTP",
        "vesselOcclusion": [
          "M2"
        ]
      },
      "aspectsScore": 8,
      "nihssScore": 12,
      "mrsScore": 0,
      "hoursFromLKW": 8,
      "priorStroke90d": true
    }
  },
  {
    "name": "SISTER eligible BUT prior intracranial hemorrhage",
    "data": {
      "telestrokeNote": {
        "age": "65",
        "nihss": "12",
        "premorbidMRS": "1",
        "tnkRecommended": false,
        "evtRecommended": false,
        "ctpResults": "mismatch",
        "vesselOcclusion": [
          "M2"
        ]
      },
      "aspectsScore": 8,
      "nihssScore": 12,
      "mrsScore": 0,
      "hoursFromLKW": 8,
      "priorICH": true
    }
  },
  {
    "name": "SISTER eligible BUT on apixaban (lastDOACType truthy)",
    "data": {
      "telestrokeNote": {
        "age": "65",
        "nihss": "12",
        "premorbidMRS": "1",
        "tnkRecommended": false,
        "evtRecommended": false,
        "ctpResults": "mismatch",
        "vesselOcclusion": [
          "M2"
        ],
        "lastDOACType": "apixaban"
      },
      "aspectsScore": 8,
      "nihssScore": 12,
      "mrsScore": 0,
      "hoursFromLKW": 8
    }
  },
  {
    "name": "STEP-EVT eligible BUT pregnant",
    "data": {
      "telestrokeNote": {
        "age": "32",
        "nihss": "8",
        "premorbidMRS": "0",
        "vesselOcclusion": [
          "M2"
        ]
      },
      "aspectsScore": 8,
      "nihssScore": 8,
      "mrsScore": 0,
      "hoursFromLKW": 6,
      "pregnancy": true
    }
  },
  {
    "name": "STEP-EVT eligible BUT hemorrhage on imaging",
    "data": {
      "telestrokeNote": {
        "age": "50",
        "nihss": "8",
        "premorbidMRS": "1",
        "vesselOcclusion": [
          "M2"
        ]
      },
      "aspectsScore": 8,
      "nihssScore": 8,
      "mrsScore": 0,
      "hoursFromLKW": 6,
      "hemorrhage": true
    }
  },
  {
    "name": "ASPIRE eligible BUT mechanical valve",
    "data": {
      "telestrokeNote": {
        "age": "70",
        "diagnosisCategory": "ich",
        "pmh": "long history of afib, htn, dm"
      },
      "mrsScore": 3,
      "hoursFromLKW": null,
      "mechValve": true
    }
  },
  {
    "name": "CAPTIVA eligible BUT cardioembolic",
    "data": {
      "telestrokeNote": {
        "age": "60",
        "diagnosisCategory": "tia",
        "ctaResults": "severe MCA stenosis suggestive of intracranial atherosclerosis",
        "premorbidMRS": "1"
      },
      "cardioembolic": true
    }
  }
];

describe('engine scenario snapshot — frozen behavior across patient matrix', () => {
  it('every active trial has structured matcherCriteria', () => {
    for (const aTrial of activeTrials) {
      expect(aTrial.matcherCriteria, `missing matcherCriteria for ${aTrial.id}`).toBeDefined();
      expect(aTrial.matcherCriteria.length, `empty matcherCriteria for ${aTrial.id}`).toBeGreaterThan(0);
    }
  });

  it('every scenario has an entry in the frozen snapshot', () => {
    for (const scenario of SCENARIOS) {
      expect(EXPECTED_SNAPSHOT[scenario.name], `missing snapshot entry for "${scenario.name}"`).toBeDefined();
    }
  });

  for (const scenario of SCENARIOS) {
    describe(`scenario: ${scenario.name}`, () => {
      for (const aTrial of activeTrials) {
        it(`${aTrial.shortName} — status and exclusion count match frozen snapshot`, () => {
          const expected = EXPECTED_SNAPSHOT[scenario.name]?.[aTrial.id];
          expect(expected, `no snapshot for ${aTrial.id} under "${scenario.name}"`).toBeDefined();

          const engineResult = engineEvaluateActiveTrial(aTrial, scenario.data);
          expect(engineResult, `engine produced no result for ${aTrial.id}`).toBeTruthy();

          expect(engineResult.status, `status drift for ${aTrial.shortName} / ${scenario.name}`).toBe(expected.status);
          expect(engineResult.exclusions.length, `exclusion-count drift for ${aTrial.shortName} / ${scenario.name}`).toBe(expected.exclusionsCount);
        });
      }
    });
  }
});
