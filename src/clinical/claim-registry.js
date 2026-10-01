// Bounded, shared clinical wording. Source dates are copied from the existing
// source-review records, never the date of a build or this consolidation.
// Exact trial regimens and calculator arithmetic keep their own definitions.
import records from './claims.json' with { type: 'json' };

export const CLINICAL_CLAIMS = Object.freeze(Object.fromEntries(
  records.map(record => [record.id, Object.freeze(record)])
));

export function getClinicalClaim(id) {
  const claim = CLINICAL_CLAIMS[id];
  if (!claim) throw new Error(`Unknown clinical claim: ${id}`);
  return claim;
}
