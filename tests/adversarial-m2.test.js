import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VALIDATORS,
  parseFrontmatter,
  PMID_PATTERN,
  DOI_PATTERN,
  ISO_DATE_PATTERN,
  KEBAB_PATTERN
} from '../content/schema.mjs';
import { citations } from '../src/evidence/citations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const CONTENT_DIR = path.join(REPO, 'content', 'education');
const BUNDLE_PATH = path.join(REPO, 'content', 'bundle.json');
const EDU_JSX_PATH = path.join(REPO, 'src', 'education.jsx');
const APP_JSX_PATH = path.join(REPO, 'src', 'app.jsx');
const SRC_DIR = path.join(REPO, 'src');

const ctx = {
  citationIds: new Set(citations.map((c) => c.id)),
  pmids: new Set(citations.map((c) => c.pmid).filter(Boolean)),
  dois: new Set(citations.map((c) => c.doi).filter(Boolean)),
  calculatorIds: new Set(
    JSON.parse(fs.readFileSync(path.join(REPO, 'content', 'calculators', 'registry.json'), 'utf8')).map((c) => c.id)
  ),
  now: new Date(),
  maxAgeMonths: 18,
  staleIsError: true,
};

function scanDirForFiles(dir, exts = ['.jsx', '.js', '.html']) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && entry.name !== '.agents' && entry.name !== 'android') {
        results.push(...scanDirForFiles(fullPath, exts));
      }
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Milestone 2 Adversarial Verification & Stress Harness', () => {
  const mdFiles = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  const bundleEdu = bundle.education || [];
  const eduJsxContent = fs.readFileSync(EDU_JSX_PATH, 'utf8');
  const appJsxContent = fs.readFileSync(APP_JSX_PATH, 'utf8');

  const switchBlockMatch = eduJsxContent.match(/function renderSubModuleContent[\s\S]*?default:/);
  const switchBlock = switchBlockMatch ? switchBlockMatch[0] : '';
  const renderedModuleCases = new Set(
    [...switchBlock.matchAll(/case\s+['"]([^'"]+)['"]/g)].map(m => m[1])
  );

  it('verifies exactly 32 education markdown modules in content/education', () => {
    expect(mdFiles.length).toBe(32);
    expect(bundleEdu.length).toBe(32);
  });

  describe('Audit each of the 32 education markdown modules', () => {
    for (const file of mdFiles) {
      it(`validates ${file} against schema, bundle, JSX router, and assets`, () => {
        const filePath = path.join(CONTENT_DIR, file);
        const rawContent = fs.readFileSync(filePath, 'utf8');
        const expectedId = file.replace(/\.md$/, '');
        
        const { data, body } = parseFrontmatter(rawContent);
        
        // 1. Schema check
        const { errors } = VALIDATORS.education(data, ctx);
        expect(errors, `${file} schema errors: ${errors.join('; ')}`).toEqual([]);

        // 2. ID consistency
        expect(data.id).toBe(expectedId);
        expect(KEBAB_PATTERN.test(data.id)).toBe(true);

        // 3. Metadata fields
        expect(typeof data.title).toBe('string');
        expect(data.title.length).toBeGreaterThan(5);
        expect(typeof data.summary).toBe('string');
        expect(data.summary.length).toBeGreaterThan(20);
        expect(Array.isArray(data.tags)).toBe(true);
        expect(data.tags.length).toBeGreaterThan(0);
        expect(Array.isArray(data.contexts)).toBe(true);
        expect(data.contexts.length).toBeGreaterThan(0);
        expect(Array.isArray(data.references)).toBe(true);
        expect(data.references.length).toBeGreaterThan(0);
        expect(ISO_DATE_PATTERN.test(data.lastReviewed)).toBe(true);
        expect(body && body.trim().length).toBeGreaterThan(100);

        // 4. Reference integrity
        for (const ref of data.references || []) {
          if (typeof ref === 'object') {
            if (ref.pmid) expect(PMID_PATTERN.test(ref.pmid)).toBe(true);
            if (ref.doi) expect(DOI_PATTERN.test(ref.doi)).toBe(true);
          }
        }

        // 5. Parity with bundle.json
        const inBundle = bundleEdu.find(b => b.id === data.id);
        expect(inBundle).toBeDefined();
        expect(inBundle.title).toBe(data.title);
        expect(inBundle.summary).toBe(data.summary);

        // 6. Router in education.jsx
        expect(renderedModuleCases.has(data.id)).toBe(true);

        // 7. Image asset existence
        const imgMatches = [...body.matchAll(/!\[.*?\]\((.*?)\)/g)].map(m => m[1]);
        for (const img of imgMatches) {
          const cleanImg = img.split(' ')[0].split('?')[0];
          const absImgPath = path.isAbsolute(cleanImg) ? cleanImg : path.join(REPO, cleanImg);
          expect(fs.existsSync(absImgPath), `Image ${cleanImg} must exist`).toBe(true);
        }
      });
    }
  });

  describe('Accordion State & Minimized Defaults', () => {
    it('verifies zero static <details open> across all source files and index.html', () => {
      const allSrcFiles = scanDirForFiles(SRC_DIR);
      let totalDetails = 0;
      let openDetails = 0;

      for (const file of allSrcFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const detailsMatches = [...content.matchAll(/<details\b([^>]*)>/gi)];
        for (const match of detailsMatches) {
          totalDetails++;
          const attrs = match[1];
          const isExplicitTrue = /\bopen\s*=\s*(\{\s*true\s*\}|\"true\"|\'true\'|\"open\")/i.test(attrs);
          const isBareOpen = /\bopen\b/i.test(attrs) && !attrs.includes('open=');
          if (isExplicitTrue || isBareOpen) {
            openDetails++;
          }
        }
      }

      expect(totalDetails).toBe(180);
      expect(openDetails).toBe(0);

      const indexHtml = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
      const indexOpen = [...indexHtml.matchAll(/<details\b([^>]*)>/gi)].filter(m => /\bopen\b/i.test(m[1]) && !m[1].includes('open="false"'));
      expect(indexOpen.length).toBe(0);
    });

    it('verifies all accordion and drawer useState hooks initialize to false/minimized', () => {
      const appStateMatches = [...appJsxContent.matchAll(/const\s*\[\s*([a-zA-Z0-9_]+)\s*,\s*set[a-zA-Z0-9_]+\s*\]\s*=\s*useState\(([^)]*)\)/g)];
      for (const match of appStateMatches) {
        const varName = match[1];
        const initVal = match[2].trim();
        if (/expand|accordion|details/i.test(varName) || /open$/i.test(varName)) {
          expect(['false', 'null', "''", '""', '{}', '[]', '0', 'undefined']).toContain(initVal);
        }
      }
    });
  });

  describe('Accessibility & Landmark Citations', () => {
    it('verifies dark mode classes in education.jsx', () => {
      expect(eduJsxContent.includes('dark:bg-')).toBe(true);
      expect(eduJsxContent.includes('dark:text-')).toBe(true);
    });

    it('verifies 11 landmark 2024-2026 clinical citations across content and code', () => {
      const landmarkPmidChecks = [
        { name: '2026 AHA AIS Guideline', pmid: '41582814' },
        { name: 'THEIA 2025 (CRAO IVT)', pmid: '41109232' },
        { name: 'CATALYST 2025 (DOAC Timing IPDMA)', pmid: '40570866' },
        { name: 'CREST-2 2025 (Carotid Stenosis)', pmid: '41269206' },
        { name: 'LASTE 2024 (Large Core EVT)', pmid: '38718358' },
        { name: 'TESLA 2024 (Large Core EVT)', pmid: '39374319' },
        { name: 'TIMELESS 2024 (Late Window TNK)', pmid: '38329148' },
        { name: 'TRACE-III 2024 (Late Window TNK)', pmid: '38884324' },
        { name: 'ANNEXA-I 2024 (Andexanet Alfa in FXa ICH)', pmid: '38749032' },
        { name: 'OCEANIC-STROKE 2026 (Asundexian)', pmid: '41985132' },
        { name: 'FASTEST 2026 (rFVIIa in Ultra-Early ICH)', pmid: '41653933' },
      ];

      for (const check of landmarkPmidChecks) {
        let fileCount = 0;
        for (const file of mdFiles) {
          const text = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
          if (text.includes(check.pmid)) fileCount++;
        }
        const inBundle = JSON.stringify(bundleEdu).includes(check.pmid);
        const inJsx = eduJsxContent.includes(check.pmid) || appJsxContent.includes(check.pmid);
        const inCitationsJs = citations.some(c => c.pmid === check.pmid);

        expect(fileCount > 0 || inBundle || inJsx || inCitationsJs).toBe(true);
      }
    });
  });
});
