import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Education from '../src/education.jsx';

describe('HINTS reference navigation', () => {
  it('advertises a reference on the education dashboard', () => {
    const markup = renderToStaticMarkup(<Education />);
    expect(markup).toContain('HINTS+ Reference');
    expect(markup).toContain('Interactive References');
    expect(markup).toContain('Eye-movement animations are unavailable');
    expect(markup).not.toMatch(/HINTS\+[^<]*Simulator|Interactive Simulators/);
  });

  it('keeps the existing deep link and presents the reference without an eye stage', () => {
    const markup = renderToStaticMarkup(<Education activeSubTab="hints-simulator" />);
    expect(markup).toContain('HINTS+ Reference');
    expect(markup).toContain('Finding examples');
    expect(markup).toContain('EXAM INCOMPLETE — NO CLASSIFICATION');
    expect(markup).not.toContain('was not found');
    expect(markup).not.toMatch(/HINTS\+[^<]*Simulator|hint-(?:head|eye|pupil|cover|stage|anim)|@keyframes/);
  });
});
