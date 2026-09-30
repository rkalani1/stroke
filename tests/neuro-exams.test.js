import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { classifyAphasia, APHASIA_MAP, NeuroExamsTool } from '../src/simulators/NeuroExamsTool.jsx';

describe('Withheld bedside neuro classifier', () => {
  it.each([[], ['fluent', 'preserved', 'preserved'], ['nonfluent', 'impaired', 'impaired'], ['unknown', 'unknown', 'unknown']])('does not label incomplete observations %j', (...input) => {
    const result = classifyAphasia(...input);
    expect(result.available).toBe(false);
    expect(result.localization).toBeNull();
    expect(result.name).toBe('Classification unavailable');
  });
  it('has no hidden lookup results or operational coma controls', () => {
    expect(Object.keys(APHASIA_MAP)).toHaveLength(0);
    const html = renderToStaticMarkup(React.createElement(NeuroExamsTool));
    expect(html).toContain('Missing or untestable findings are not normal');
    expect(html).not.toMatch(/<input|<select|ice water|20 cc|Anomic Aphasia/);
  });
});
