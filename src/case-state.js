export const ASPECTS_UNASSESSED = '';

export const isValidAspectsScore = (value) => (
  Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= 10
);

export const normalizeAspectsScore = (value) => {
  if (typeof value === 'number') {
    return isValidAspectsScore(value) ? value : ASPECTS_UNASSESSED;
  }
  if (typeof value !== 'string') return ASPECTS_UNASSESSED;
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return ASPECTS_UNASSESSED;
  const score = Number(normalized);
  return isValidAspectsScore(score) ? score : ASPECTS_UNASSESSED;
};

export const cloneAspectsRegionState = (value) => (
  Array.isArray(value) ? value.map((item) => ({ ...item })) : null
);

export const getDefaultFuncItems = () => ({
  location: '',
  preCogImpairment: false,
});

export const normalizeFuncItems = (value) => {
  const defaults = getDefaultFuncItems();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  return {
    location: ['lobar', 'deep', 'infratentorial'].includes(value.location) ? value.location : '',
    preCogImpairment: value.preCogImpairment === true,
  };
};
