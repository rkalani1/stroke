import { readFileSync } from 'node:fs';

const target = 'docs/ai-agent-evals/automedbench-lite.md';
const text = readFileSync(target, 'utf8');

const requiredPhrases = [
  'S1 Plan',
  'S2 Setup',
  'S3 Validate',
  'S4 Execute',
  'S5 Submit',
  'npm run evidence:refresh',
  'npm run qa',
  'no PHI',
  'Source fidelity',
  'Citation integrity'
];

const missing = requiredPhrases.filter((phrase) => !text.includes(phrase));

if (missing.length > 0) {
  console.error(`AutoMedBench-Lite gate is missing required content in ${target}:`);
  for (const phrase of missing) {
    console.error(`- ${phrase}`);
  }
  process.exit(1);
}

console.log(`AutoMedBench-Lite gate validated: ${target}`);
