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
import SCENARIOS from './scenarios.json';

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
