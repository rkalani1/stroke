// Existing source-reviewed historical values, shared by the teaching explorer
// and its canonical printable card. This is not a patient-outcome calculator.
export const ICH_HISTORICAL_COHORT = Object.freeze([
  { score: 0, mortality: '0%' },
  { score: 1, mortality: '13%' },
  { score: 2, mortality: '26%' },
  { score: 3, mortality: '72%' },
  { score: 4, mortality: '97%' },
  { score: 5, mortality: '100%' }
].map(Object.freeze));

export const ICH_COHORT_HEADING = 'Historical cohort · 30-day mortality';
export const ICH_COHORT_LIMIT = 'Historical cohort rates, not individual predictions. No percentage is assigned here to score 6; do not extrapolate a certain fatal outcome.';
export const ICH_COHORT_SOURCE = Object.freeze({
  label: 'Hemphill et al., 2001',
  url: 'https://pubmed.ncbi.nlm.nih.gov/11283388/'
});
export const PROGNOSIS_TEACHING_NOTE = 'Pre-filled synthetic teaching examples; these inputs are not linked to an encounter. Verify the original model definitions before using a score.';

export function historicalIchMortality(score) {
  return ICH_HISTORICAL_COHORT.find((entry) => entry.score === score)?.mortality ?? 'Not estimated';
}
