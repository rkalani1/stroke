// Education PDF link guard (P4-3).
//
// The existing dead-link test only walks bundle.references, so a pdfPath prop
// in src/education.jsx could point at a file that does not exist on disk and
// ship a 404 Download/Preview button. This test extracts every pdfPath value
// from src/education.jsx and asserts the referenced file exists.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Education PDF links (src/education.jsx pdfPath props)', () => {
  const root = process.cwd();
  const eduSource = fs.readFileSync(path.join(root, 'src', 'education.jsx'), 'utf8');
  const pdfPaths = [...eduSource.matchAll(/pdfPath="([^"]+)"/g)].map((m) => m[1]);

  it('extracts at least one pdfPath (regex still matches the source)', () => {
    expect(pdfPaths.length).toBeGreaterThan(0);
  });

  it('every pdfPath points at a file that exists on disk', () => {
    const missing = pdfPaths
      .map((p) => p.split('?')[0])
      .filter((p) => !fs.existsSync(path.join(root, p)));
    expect(
      missing,
      `pdfPath prop(s) in src/education.jsx reference files missing from disk: ${missing.join(', ')}. ` +
        'Either generate the PDF (scripts/generate-pdfs.mjs) or remove the pdfPath prop.'
    ).toEqual([]);
  });

  it('pdfPath values stay inside documents/references/ (no traversal, no external URLs)', () => {
    for (const p of pdfPaths) {
      expect(p.startsWith('documents/references/')).toBe(true);
      expect(p.includes('..')).toBe(false);
      expect(/^https?:/i.test(p)).toBe(false);
    }
  });
});
