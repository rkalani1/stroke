import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createDeferredResource } from '../src/deferred-resource.js';
import { DeferredLoadStatus, deferredRecoveryHref } from '../src/deferred-components.jsx';

describe('recovery from cached browser module failure', () => {
  it.each([
    ['Education', '#/research/education/onboarding', '#/research/education/onboarding'],
    ['Trial screener', '#/trials/screener', '#/trials/screener'],
    ['Background evidence', '#/encounter', '#/research/references'],
    ['Reference search', '#/encounter', '#/research/guidelines'],
    ['EVD reference', '#/protocols/ich', '#/research/education/evd-maintenance'],
    ['ICP reference', '#/protocols/ich', '#/research/education/herniation-icp']
  ])('opens a usable destination for %s while preserving the deployment scope', (label, before, after) => {
    const href = deferredRecoveryHref(label, { href: `https://example.test/stroke/?publicDemo=1${before}` });
    expect(href).toBe(`https://example.test/stroke/?publicDemo=1${after}`);
  });
  it('offers an explicit fresh tab and does not offer a nonfunctional same-document retry', async () => {
    const resource = createDeferredResource(() => Promise.reject(Error('network')));
    await resource.load().catch(() => {});
    const html = renderToStaticMarkup(<DeferredLoadStatus resource={resource} label="Background evidence" />);
    expect(html).toContain('Your encounter remains open here.');
    expect(html).toContain('This action does not copy your encounter inputs to the new tab.');
    expect(html).toContain('Open in new tab');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('Try again');
  });
});
