// Search matching is separate from ranking. A boost or a few shared letters
// must never turn an unrelated clinical resource into a search result.
export function normalizeSearchText(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase()
    .replace(/[‐‑–—-]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function matchesSearchText(query, parts = []) {
  const tokens = normalizeSearchText(query).split(' ').filter(Boolean);
  const text = normalizeSearchText(parts.filter(Boolean).join(' '));
  return tokens.every((token) => text.includes(token));
}

export function scoreSearchMatch(query, parts = [], boost = 0) {
  if (!normalizeSearchText(query) || !matchesSearchText(query, parts)) return 0;
  const q = normalizeSearchText(query);
  return 1 + boost + parts.reduce((total, part) => {
    const value = normalizeSearchText(part);
    return total + (value === q ? 100 : value.startsWith(q) ? 65 : value.includes(q) ? 25 : 0);
  }, 0);
}
