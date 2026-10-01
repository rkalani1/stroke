import React from 'react';
import { encounterTiaReadiness } from '../workspace-state.js';

export default function TiaReadiness({ state }) {
  const review = encounterTiaReadiness(state);
  if (!review) return null;
  return <section className="workspace-details" aria-labelledby="tia-readiness-title">
    <h3 id="tia-readiness-title">TIA disposition review</h3>
    <p className="workspace-result" role={review.status === 'urgent' ? 'alert' : 'status'}>{review.text}</p>
    <p className="workspace-help">{review.reviewedCount}/5 high-risk features explicitly reviewed.</p>
    {review.concerns.length > 0 && <p>Recorded concerns: {review.concerns.join('; ')}.</p>}
    {review.missing.length > 0 && <p>Not yet reviewed: {review.missing.join('; ')}.</p>}
    {review.gaps.length > 0 && <><h4>Workup &amp; follow-up gaps</h4><ul>{review.gaps.map(gap => <li key={gap}>{gap}</li>)}</ul></>}
    <a href="#/encounter/section/diagnosis-details">Review TIA findings and workup</a>
  </section>;
}
