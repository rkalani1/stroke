// A URL can return to the same text after newer navigation. Tokens identify
// the user's latest action independently of the current route string.
export function createNavigationIntents() {
  let generation = 0;
  // Native hashchange events can arrive after a newer intent has started.
  // Keep already-issued transitions until their own event is delivered.
  const expectedHashes = [];
  const cancel = () => { generation += 1; };
  return {
    begin() { cancel(); return generation; },
    cancel,
    isCurrent: token => token === generation,
    expectHash(token, hash, currentHash) {
      if (token === generation && hash !== currentHash) expectedHashes.push({ hash, previousHash: currentHash });
    },
    onHashChange(hash, previousHash) {
      const expected = expectedHashes.findIndex(item => item.hash === hash && (previousHash === undefined || item.previousHash === previousHash));
      if (expected !== -1) {
        expectedHashes.splice(expected, 1);
        return;
      }
      cancel();
    }
  };
}

// React and the calculator filter effect must finish before opening/focusing
// a target. A superseded action never scrolls or steals focus later.
export function revealNavigationTarget({ isCurrent, findTarget, reveal, requestFrame = globalThis.requestAnimationFrame, maxFrames = 60 }) {
  let frames = 0;
  const attempt = () => {
    if (!isCurrent()) return;
    const target = findTarget();
    if (target && !target.hidden && target.getClientRects().length) {
      reveal(target);
      return;
    }
    frames += 1;
    if (frames < maxFrames) requestFrame(attempt);
  };
  requestFrame(attempt);
}

export const CALCULATOR_TARGET_IDS = Object.freeze([
  'nihss', 'gcs', 'ich-score', 'func', 'mrs', 'abcd2', 'chads2vasc',
  'hasbled', 'rope', 'rcvs2', 'hunt-hess', 'phases', 'ich-volume',
  'andexanet', 'crcl', 'enoxaparin', 'aspects', 'pc-aspects',
  'alteplase', 'risk-scores', 'tici', 'dragon'
]);
const CALCULATOR_ANCHORS = new Set(CALCULATOR_TARGET_IDS);
export const CALCULATOR_ALIASES = Object.freeze({
  'aspects-pc': 'pc-aspects', chadsvasc: 'chads2vasc', 'alteplase-dose': 'alteplase',
  'GCS Score': 'gcs', 'ICH Score': 'ich-score', 'ABCD² Score': 'abcd2',
  'CHA₂DS₂-VASc': 'chads2vasc', 'ROPE Score': 'rope',
  'Modified Rankin Scale (mRS)': 'mrs', 'Hunt and Hess Scale': 'hunt-hess',
  'WFNS Scale': 'hunt-hess', 'HAS-BLED Score': 'hasbled', 'RCVS² Score': 'rcvs2',
  'PHASES Score (Aneurysm)': 'phases', 'CrCl Calculator': 'crcl',
  'Enoxaparin Dosing': 'enoxaparin', 'Factor Xa reversal / andexanet status': 'andexanet',
  'ICH Volume (ABC/2)': 'ich-volume', 'Alteplase (tPA) Dosing': 'alteplase', 'FUNC Score': 'func'
});

export function calculatorAnchorFor(idOrLabel) {
  const id = CALCULATOR_ALIASES[idOrLabel] || idOrLabel;
  return CALCULATOR_ANCHORS.has(id) ? `calc-${id}` : null;
}
