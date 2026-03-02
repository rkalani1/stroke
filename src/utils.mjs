export const ensureArray = (value, fallback = []) => Array.isArray(value) ? value : fallback;

export const toIsoString = (value = new Date()) => {
  try {
    return new Date(value).toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export const safeParseDt = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const safeFormatTime = (val) => {
  const d = safeParseDt(val);
  return d ? d.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) : null;
};
