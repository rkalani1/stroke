// Strict numeric input helper retained for independent trial screening.
export const tryInt = (v) => {
  // Keep the historical export name, but never truncate fractions or coerce
  // arrays/booleans/partially numeric text into recorded clinical inputs.
  if (typeof v !== 'number' && (typeof v !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim()))) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
