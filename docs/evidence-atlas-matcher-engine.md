# Matcher engine — declarative trial-eligibility evaluation

The matcher engine (`src/evidence/matcher-engine.js`) is a generic
evaluator that runs over the declarative `matcherCriteria` arrays on
each active trial. It exists so the atlas's matcher specification is
**executable**, not just documentation.

This document is the reference for adding criteria, extending operators,
or wiring the engine into a UI surface.

---

## Status

- **Coverage:** 100 % of seeded `matcherCriteria` (52 / 52 across 11
  active trials) fully evaluated by the engine.
- **Posture:** parallel-verification. The live matcher in `src/app.jsx`
  still reads from `TRIAL_ELIGIBILITY_CONFIG`. The engine runs alongside
  when the localStorage flag `strokeApp:matcherEngineCheck` is set, and
  logs disagreements to console.
- **Next sprint:** review parity telemetry, then flip the canonical
  source to the engine and retire the inline config.

---

## Enable parallel-verification mode

In the browser console while the app is loaded:

```js
localStorage.setItem('strokeApp:matcherEngineCheck', 'true')
```

Reload. Each time the trial-eligibility useEffect runs (i.e., every time
encounter-form data changes), the engine and the legacy evaluator both
run. Disagreements appear as `console.warn` entries:

```
[matcher-engine] SISTER (SISTER): 1 disagreement(s)
  [{ kind: 'criterion', criterion: 'noTNK', engineStatus: 'unknown', legacyStatus: 'not_met' }]
```

If they fully agree:

```
[matcher-engine] all trials agree with legacy evaluator
```

To disable:

```js
localStorage.removeItem('strokeApp:matcherEngineCheck')
```

---

## Operators

| Operator | Resolves true when | Examples |
|---|---|---|
| `>=` | numeric `resolved >= value` | `{ field: 'age', operator: '>=', value: 18 }` |
| `<=` | numeric `resolved <= value` | `{ field: 'premorbidMRS', operator: '<=', value: 2 }` |
| `>` | strict numeric `>` | `{ field: 'hoursFromLKW', operator: '>', value: 0 }` |
| `<` | strict numeric `<` | `{ field: 'hoursFromLKW', operator: '<', value: 4.5 }` |
| `==` | equality (boolean / string / numeric, with NaN-safe coerce) | `{ field: 'tnkRecommended', operator: '==', value: false }` |
| `between` | numeric `value[0] <= resolved <= value[1]` | `{ field: 'age', operator: 'between', value: [18, 79] }` |
| `in` | resolved is in `value[]` (or array intersection if resolved is an array) | `{ field: 'vesselOcclusion', operator: 'in', value: ['ICA','M1','M2'] }` |
| `present` | substring match (case-insensitive) for strings; array-overlap for arrays | `{ field: 'ctpResults', operator: 'present', value: ['mismatch','penumbra'] }` |

All operators return one of `true`, `false`, or `null`. Null means
**unknown** — the field isn't filled in yet. The engine never throws on
missing data.

---

## Field resolvers

Defined in `matcher-engine.js`:

| `field` | Source path / derivation |
|---|---|
| `age` | `pickEncounterField(telestrokeNote.age, strokeCodeForm.age)` |
| `nihss` | `pickEncounterField(telestrokeNote.nihss, strokeCodeForm.nihss, nihssScore)` |
| `premorbidMRS` | `telestrokeNote.premorbidMRS` |
| `aspectsScore` | `data.aspectsScore` |
| `hoursFromLKW` | `data.hoursFromLKW` |
| `vesselOcclusion` | `telestrokeNote.vesselOcclusion` (array) |
| `ctaResults` | `telestrokeNote.ctaResults` ‖ `strokeCodeForm.cta` |
| `ctpResults` | `telestrokeNote.ctpResults` |
| `diagnosisCategory` | `telestrokeNote.diagnosisCategory` |
| `symptoms` | `telestrokeNote.symptoms` |
| `pmh` | `telestrokeNote.pmh` |
| `ichLocation` | `data.ichLocation` |
| `onStatin` | `data.onStatin` |
| `mrsScore` | `data.mrsScore` |
| `tnkRecommended` | `telestrokeNote.tnkRecommended` (boolean) |
| `evtRecommended` | `telestrokeNote.evtRecommended` (boolean) |
| `reperfusion` (derived) | `tnkRecommended === true ‖ evtRecommended === true` |
| `domainMatch` (derived) | One of `'mevo'`, `'low-nihss-lvo'`, `'none'`, or `null` if undecidable |

---

## Add a new field

1. Open `src/evidence/matcher-engine.js`.
2. Add an entry to `fieldResolvers`. The resolver receives the
   evaluation `data` envelope and returns the canonical value. For
   derived fields, document the derivation rule in a brief comment above
   the entry.
3. Add a unit test in `src/evidence/__tests__/matcher-engine.test.js`.
4. Run `npm run evidence:validate` — coverage % should remain 100 % (the
   metric counts criteria using known fields and operators).

---

## Add a new operator

1. Add an entry to `operators` in `matcher-engine.js`. The operator
   receives `(resolvedValue, criterionValue)` and returns
   `true`/`false`/`null`.
2. Add a unit test for met / not-met / unknown semantics.
3. Document in the table above.

---

## API

```js
import {
  evaluateCriterion,    // (criterion, data) → 'met' | 'not_met' | 'unknown'
  evaluateActiveTrial,  // (activeTrial, data) → { criteria, counts, status }
  resolveField,         // (fieldName, data) → resolved value
  knownFields,          // → Set<string>
  knownOperators,       // → Set<string>
  coverageReport,       // (activeTrials) → { total, covered, percent, gaps }
  diffEvaluations       // (engineResult, legacyResult) → diff[]
} from './evidence/matcher-engine.js';
```

---

## Coverage metric in CI

`npm run evidence:validate` reports:

```
Matcher-engine coverage: 52/52 criteria (100%) — all criteria executable from declarative form.
```

If a `matcherCriteria` entry uses an unknown field or unknown operator,
the coverage % drops and the validator emits a warning listing the gap
in the form `trialId/field/operator`. Fix by extending the engine's
field or operator vocabulary, or by adjusting the criterion to use an
existing one.

---

## Retirement plan (next sprint)

1. Run the app with `strokeApp:matcherEngineCheck` enabled in real
   clinical scenarios. Record any disagreements.
2. For each disagreement, decide: legacy is right (fix the engine /
   matcherCriteria), or engine is right (fix the legacy criterion in
   `TRIAL_ELIGIBILITY_CONFIG`).
3. When parity holds for an extended period, flip the canonical source:
   replace `evaluateAllTrials(evaluationData)` in `app.jsx` with a loop
   that calls `engineEvaluateActiveTrial` and shapes the result for the
   existing UI.
4. Delete `TRIAL_ELIGIBILITY_CONFIG` and the inline criterion
   evaluators (~400 lines).
5. Keep the field resolver as the single source of truth for how
   encounter form fields map to matcher inputs.
