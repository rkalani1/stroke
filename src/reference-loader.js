import { createDeferredResource } from './deferred-resource.js';

// Live bindings keep existing reference renderers intact. Consumers subscribe
// to referenceResource and gate reference-only screens until it is ready.
const EMPTY = Object.freeze([]);
export let GUIDELINE_LIBRARY = EMPTY;
export let GUIDELINE_LIBRARY_INDEX = EMPTY;
export let evidenceCompletedTrials = EMPTY;
let referenceModule = null;
export const referenceResource = createDeferredResource(async () => {
  const loaded = await import('./deferred-reference-data.js');
  GUIDELINE_LIBRARY = loaded.GUIDELINE_LIBRARY;
  GUIDELINE_LIBRARY_INDEX = loaded.GUIDELINE_LIBRARY_INDEX;
  evidenceCompletedTrials = loaded.completedTrials;
  referenceModule = loaded;
  return loaded;
});
export const loadReferenceData = () => referenceResource.load();
export const getContentSearchIndex = () => referenceModule?.getContentSearchIndex() || EMPTY;
export const resolveCompletedTrials = ids => referenceModule?.resolveCompletedTrials(ids) || EMPTY;
export const filterCompletedTrials = filters => referenceModule?.filterCompletedTrials(filters) || EMPTY;
export const guidelineSearchFields = (rec, guideline) => referenceModule?.guidelineSearchFields(rec, guideline) || EMPTY;
export const guidelineGradeLabel = (rec, guideline) => referenceModule?.guidelineGradeLabel(rec, guideline) || '';
