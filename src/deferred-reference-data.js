// These records are precached for offline use, but parsed only on demand.
export { GUIDELINE_LIBRARY, GUIDELINE_LIBRARY_INDEX, guidelineSearchFields, guidelineGradeLabel } from './guideline-library.js';
export { getBrowserSearchIndex as getContentSearchIndex } from './content-search-index.js';
export { completedTrials, resolveCompletedTrials, filterCompletedTrials } from './evidence/index.js';
