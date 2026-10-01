import { describe, expect, it } from 'vitest';
import * as deferred from '../src/reference-loader.js';

describe('deferred reference data', () => {
  it('starts without data, then exposes the complete shared module without trimming records', async () => {
    expect(deferred.referenceResource.getSnapshot().status).toBe('idle');
    expect(deferred.GUIDELINE_LIBRARY_INDEX).toEqual([]);
    expect(deferred.evidenceCompletedTrials).toEqual([]);
    expect(deferred.getContentSearchIndex()).toEqual([]);
    const module = await deferred.loadReferenceData();
    expect(deferred.referenceResource.getSnapshot().status).toBe('ready');
    expect(deferred.GUIDELINE_LIBRARY).toBe(module.GUIDELINE_LIBRARY);
    expect(deferred.GUIDELINE_LIBRARY_INDEX).toBe(module.GUIDELINE_LIBRARY_INDEX);
    expect(deferred.evidenceCompletedTrials).toBe(module.completedTrials);
    expect(deferred.getContentSearchIndex()).toEqual(module.getContentSearchIndex());
    expect(deferred.GUIDELINE_LIBRARY_INDEX.length).toBeGreaterThan(100);
    expect(deferred.evidenceCompletedTrials.length).toBeGreaterThan(230);
    expect(deferred.resolveCompletedTrials([module.completedTrials[0].id])).toEqual([module.completedTrials[0]]);
    expect(deferred.filterCompletedTrials({ query: 'DAWN' })).toEqual(module.filterCompletedTrials({ query: 'DAWN' }));
    expect(await deferred.loadReferenceData()).toBe(module);
  });
});
