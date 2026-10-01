import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Regression guard for the Protocols > Ischemic "Jump to Section" chip row.
// Every chip calls document.getElementById(id)?.scrollIntoView(...), so a chip
// whose id has no element silently does nothing. Eight such dead chips
// (isch-af, isch-nbo, isch-ht, isch-antiplatelet, isch-statin, isch-icad,
// isch-cad, isch-seizure) shipped after their sections were removed; this test
// keeps every TOC id tied to exactly one element in the ischemic panel.

const appJsx = fs.readFileSync(path.join(process.cwd(), 'src', 'ProtectedProtocols.jsx'), 'utf8');

function extractTocEntries(source) {
  const marker = '{/* Section TOC */}';
  const start = source.indexOf(marker);
  if (start === -1) return null;
  const mapIdx = source.indexOf('].map(', start);
  if (mapIdx === -1) return null;
  const arraySrc = source.slice(start + marker.length, mapIdx);
  const entries = [];
  const pairRe = /\[\s*'([^']+)'\s*,\s*'([^']*)'\s*\]/g;
  let m;
  while ((m = pairRe.exec(arraySrc)) !== null) entries.push({ id: m[1], label: m[2] });
  return entries;
}

function extractIschemicPanel(source) {
  const start = source.indexOf('id="mgmt-tabpanel-ischemic"');
  if (start === -1) return null;
  const next = source.indexOf('id="mgmt-tabpanel-', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('Protocols ischemic Section TOC anchors', () => {
  const entries = extractTocEntries(appJsx);
  const panel = extractIschemicPanel(appJsx);

  it('finds the Section TOC array and the ischemic panel', () => {
    expect(entries, 'Section TOC array not found in src/ProtectedProtocols.jsx').not.toBeNull();
    expect(entries.length).toBeGreaterThan(0);
    expect(panel, 'id="mgmt-tabpanel-ischemic" not found in src/ProtectedProtocols.jsx').not.toBeNull();
  });

  it('has no duplicate TOC ids', () => {
    const ids = entries.map((e) => e.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate TOC ids: ${dupes.join(', ')}`).toEqual([]);
  });

  it('resolves every TOC id to exactly one id="<id>" element inside the ischemic panel', () => {
    const problems = [];
    for (const { id, label } of entries) {
      const count = (panel.match(new RegExp(`\\bid="${escapeRe(id)}"`, 'g')) || []).length;
      if (count !== 1) problems.push(`${id} (${label}): ${count} matching element(s)`);
    }
    expect(problems, `Unresolved Section TOC ids:\n  ${problems.join('\n  ')}`).toEqual([]);
  });
});
