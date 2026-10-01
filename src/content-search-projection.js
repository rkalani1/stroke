// Search-only projection of the authored content bundle. Keep the full record
// accessors in content-context.js for consumers that need source/context data.
export function projectContentSearchEntries(bundle) {
  const out = [];
  const push = (domain, records, project) => {
    for (const record of records || []) out.push({ domain, ...project(record) });
  };
  push('guideline', bundle.guidelines, (r) => ({ id: r.id, title: r.statement, subtitle: `${r.guideline} · ${r.COR}/${r.LOE}`, keywords: r.section }));
  push('trial', bundle.trials, (r) => ({ id: r.id, title: r.name, subtitle: r.finding, keywords: r.category }));
  push('education', bundle.education, (r) => ({ id: r.id, title: r.title, subtitle: r.summary, keywords: (r.tags || []).join(' ') }));
  push('calculator', bundle.calculators, (r) => ({ id: r.id, title: r.name, subtitle: r.category, keywords: r.fn }));
  push('reference', bundle.references, (r) => ({ id: r.id, title: r.title, subtitle: r.category, keywords: r.type }));
  return out;
}

export function copyContentSearchEntries(entries) {
  // JSON omits undefined object values. Restore all five properties so a
  // missing field retains the legacy search entry's undefined semantics.
  // Return fresh objects just as getSearchIndex() does.
  return entries.map(({ domain, id, title, subtitle, keywords }) => ({
    domain, id, title, subtitle, keywords
  }));
}
