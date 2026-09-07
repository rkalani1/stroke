import React from 'react';

export default function GuidelineProvenance({ guideline }) {
  const pending = (guideline.publicationUpdates || []).filter((update) =>
    update.status === 'unresolved' || update.status === 'partially-applied');
  return (
    <div className="space-y-2 text-xs text-ink-2">
      {guideline.coverageComplete && (
        <p>
          Complete recommendation coverage: {guideline.coverage.sourceRecommendationCount} recommendations
          {guideline.coverage.sourceConsensusCount > 0 ? ` and ${guideline.coverage.sourceConsensusCount} consensus statements` : ''}.
          {(guideline.coverage.sourcePracticeStatementCount || guideline.coverage.sourcePracticePointCount) > 0
            ? ` Also includes ${guideline.coverage.sourcePracticeStatementCount || guideline.coverage.sourcePracticePointCount} ungraded practice statements.` : ''}
          {guideline.coverage.sourceValueStatementCount > 0
            ? ` Also includes ${guideline.coverage.sourceValueStatementCount} economic-value statement.` : ''}
          {' '}Checked against the full source on {guideline.coverage.checkedAt}.
        </p>
      )}
      {(guideline.sourceOnly || guideline.partialExtraction || guideline.summaryOnly) && (
        <p className="rounded-md border border-warn-300 bg-warn-50 p-2 text-warn-900 dark:border-warn-700 dark:bg-warn-950 dark:text-warn-200">
          {guideline.sourceOnly
            ? 'Source link only. Recommendations have not been extracted; open the original document.'
            : 'Selected extracts only. A missing recommendation here does not mean the source makes no recommendation.'}
        </p>
      )}
      {guideline.extractionNote && <p>{guideline.extractionNote}</p>}
      {pending.map((update) => (
        <div key={update.pmid || update.doi} className="rounded-md border border-warn-300 bg-warn-50 p-2 text-warn-900 dark:border-warn-700 dark:bg-warn-950 dark:text-warn-200">
          <strong>{update.status === 'partially-applied' ? 'Correction partly incorporated. ' : 'Correction needs verification. '}</strong>
          <span>{update.note}</span>{' '}
          <a href={update.publisherUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Read correction</a>
        </div>
      ))}
      {(guideline.publicationUpdates || []).some(update => !pending.includes(update)) && (
        <details className="rounded-md border border-line">
          <summary className="cursor-pointer min-h-[44px] p-3 font-semibold">Reviewed publication corrections</summary>
          <ul className="space-y-2 px-3 pb-3">
            {guideline.publicationUpdates.filter(update => !pending.includes(update)).map(update => (
              <li key={update.pmid || update.doi}>
                <a href={update.publisherUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                  {update.status === 'applied' ? 'Correction incorporated' : 'Correction reviewed'}
                </a>{': '}{update.note}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="flex flex-wrap gap-2">
        {(guideline.publisherUrl || guideline.pdfUrl) && (
          <a href={guideline.publisherUrl || guideline.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] rounded-md border border-line px-3 font-semibold text-link-600 dark:text-link-400">Original guideline</a>
        )}
        {guideline.pubmedFallbackUrl && (
          <a href={guideline.pubmedFallbackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] rounded-md border border-line px-3 font-semibold text-link-600 dark:text-link-400">PubMed</a>
        )}
        {guideline.supplementUrl && (
          <a href={guideline.supplementUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] rounded-md border border-line px-3 font-semibold text-link-600 dark:text-link-400">Source supplement</a>
        )}
      </div>
    </div>
  );
}
