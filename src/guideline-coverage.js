// Shared by the browser and the public JSON index. Counts always describe the
// source document, before a search or class filter is applied.
export function guidelineCoverage(guideline) {
  const rows = guideline.recommendations || [];
  const sourceOnly = rows.length > 0 && rows.every((rec) => rec.section === 'Source not machine-readable');
  const summaryOnly = sourceOnly || (rows.length > 0 && rows.every((rec) => rec.section === 'Scope'));
  const complete = guideline.coverage?.status === 'complete' && !sourceOnly && !summaryOnly;
  return {
    sourceOnly,
    summaryOnly,
    coverageComplete: complete,
    partialExtraction: !sourceOnly && !complete && Boolean(guideline.extractionStatus || guideline.coverage?.status === 'partial'),
    recommendationCount: sourceOnly ? 0 : rows.length,
  };
}
