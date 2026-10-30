import { protocolEncounter, validTimestamp } from './workspace-state.js';
import { contradictedAsYes } from './encounter-clinical-review.js';
import { BENEFIT_ITEM_IDS } from './clinical/safety-items.js';

// Why IV thrombolysis is held, for the case bar's dose and the Encounter next-entry cue, so both name the same cause.
// Acute ischemic stroke only, before a recorded administration (agent selected and a valid past time, as in the
// case bar and the Encounter monitoring timer) and unless the IVT decision is Not recommended.
// A "No" that an entered value contradicts holds as a "Yes" would (the Protocols card reads the answers as given).
// Benefit-tier items (an antiplatelet, an ACE inhibitor, seizure at onset) are recorded, never counted as concerns,
// so a contradicted one holds nothing and is not named. After a CT hemorrhage finding, an unassessed anticoagulant
// is named first (7.8.1); `contradicted` still reports a contradiction that holds beside it.
export function ivtHold(state, nowMs) {
  const n = state.note;
  if (state.context !== 'acute' || n.diagnosisCategory !== 'ischemic' || state.decisions?.ivt === 'Not recommended') return null;
  if (state.actions?.administered && state.drug && validTimestamp(state.actions.administrationTime, nowMs)) return null;
  if (n.ctHemorrhageStatus === 'present') return { cause: 'ct-present' };
  if (n.ctHemorrhageStatus === 'uncertain') return { cause: 'ct-uncertain' };
  const read = contradictedAsYes(n, nowMs, state.details), given = n.tnkContraindicationChecklist || {};
  const contradicted = Object.entries(read.tnkContraindicationChecklist || {}).some(([id, value]) => value !== given[id] && !BENEFIT_ITEM_IDS.has(id));
  const protocol = protocolEncounter(contradicted ? { ...state, note: read } : state, nowMs);
  if (!protocol.safetyReviewRequired) return null;
  const cause = !n.lastDOACType && /not yet assessed/i.test(protocol.safetyReviewReason) ? 'anticoagulant' : contradicted ? 'contradicted' : 'review';
  return { cause, contradicted, reason: protocol.safetyReviewReason };
}
