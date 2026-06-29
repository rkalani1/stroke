// src/evidence/screenerTrials.js
//
// Native port of the standalone stroke-trials-screener `trials` array.
// 16 synthetic, public-clean trial objects used by the bedside Trial Screener
// (src/components/TrialScreener.jsx) and the dual-eval engine
// (src/evidence/screener-eval.js).
//
// Refactored: Trial data moved to src/evidence/screener/ directory for better maintainability.

export { CTGOV_FIRST_PASS_NOTE } from './screener/constants.js';
export { screenerTrials } from './screener/index.js';
import { screenerTrials } from './screener/index.js';

export default screenerTrials;
