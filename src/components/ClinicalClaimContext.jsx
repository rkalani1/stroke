import React from 'react';
import { getClinicalClaim } from '../clinical/claim-registry.js';

// Place beside a decision or calculated dose, so applicability travels with it.
export default function ClinicalClaimContext({ claimId }) {
  const claim = getClinicalClaim(claimId);
  const sources = claim.sources || [{ label: claim.sourceLabel, url: claim.sourceUrl }];
  return (
    <div className="clinical-evidence-limit mt-2 space-y-1 text-xs text-ink-2" data-clinical-claim={claimId}>
      <p><strong>Applies to:</strong> {claim.population}</p>
      <p>{claim.limits}</p>
      <p>{sources.map((source, index) => <React.Fragment key={source.url}>{index > 0 && '; '}<a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">{source.label}</a></React.Fragment>)}{' '}· Recorded source review: <time dateTime={claim.reviewedAt}>{claim.reviewedAt}</time>. {claim.reviewScope}</p>
    </div>
  );
}
