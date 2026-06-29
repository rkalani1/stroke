import { activeTrials as evidenceActiveTrials } from './src/evidence/activeTrials.js';
import { completedTrials as evidenceCompletedTrials } from './src/evidence/completedTrials.js';

const showRelatedActive = true;

// Baseline implementation
function baseline() {
  let count = 0;
  for (const trial of evidenceCompletedTrials) {
    const relatedActive = showRelatedActive ? (trial.relatedActiveTrialIds || []).map((id) => evidenceActiveTrials.find((a) => a.id === id)).filter(Boolean) : [];
    count += relatedActive.length;
  }
  return count;
}

// Optimized implementation
const activeTrialsMap = new Map(evidenceActiveTrials.map(t => [t.id, t]));
function optimized() {
  let count = 0;
  for (const trial of evidenceCompletedTrials) {
    const relatedActive = showRelatedActive ? (trial.relatedActiveTrialIds || []).map((id) => activeTrialsMap.get(id)).filter(Boolean) : [];
    count += relatedActive.length;
  }
  return count;
}

// Run benchmark
const iterations = 100000;

console.time('baseline');
for (let i = 0; i < iterations; i++) {
  baseline();
}
console.timeEnd('baseline');

console.time('optimized');
for (let i = 0; i < iterations; i++) {
  optimized();
}
console.timeEnd('optimized');
