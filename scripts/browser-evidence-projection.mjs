// Browser-only views of canonical evidence. Complete records remain in the
// versioned public data API and source checks; no clinical wording is authored here.
export const pick = (record, keys) => Object.fromEntries(keys.filter(key => record[key] !== undefined).map(key => [key, record[key]]));
export function projectClinicalClaims(records) {
  return records.map(record => ({
    ...pick(record, ['id', 'dose', 'population', 'limits', 'sourceLabel', 'sourceUrl', 'reviewedAt', 'reviewScope']),
    ...(record.sources ? { sources: record.sources.map(source => pick(source, ['label', 'url'])) } : {})
  }));
}
export function projectProtocolEvidence({ recommendations, claims, citations }) {
  const byId = new Map(citations.map(record => [record.id, pick(record, ['id', 'title', 'journal', 'year', 'pmid', 'doi', 'url'])]));
  return {
    recommendations: recommendations.map(record => pick(record, ['id', 'supportingClaimIds', 'caveats'])),
    claims: claims.map(record => ({ ...pick(record, ['id', 'statement', 'certainty', 'conflictNotes']), citationRecords: record.citationIds.map(id => byId.get(id)).filter(Boolean) }))
  };
}
