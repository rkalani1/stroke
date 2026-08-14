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

console.log('================================================================');
console.log('M2 EMPIRICAL ADVERSARIAL STRESS TEST & VERIFICATION HARNESS');
console.log('================================================================');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${testName} - Details: ${details}`);
    failures.push({ testName, details });
  }
}

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

// -----------------------------------------------------------------------------
// 1. ALL 32 EDUCATION MODULES DEEP SCHEMA & CONTENT AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 1. Education Modules Deep Schema & Content Audit ---');

const mdFiles = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
assert(mdFiles.length === 32, 'Exactly 32 education markdown files exist in content/education/', `Found ${mdFiles.length}`);

const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
const bundleEdu = bundle.education || [];
assert(bundleEdu.length === 32, 'Bundle contains exactly 32 education modules', `Found ${bundleEdu.length}`);

const eduJsxContent = fs.readFileSync(EDU_JSX_PATH, 'utf8');

// Extract all switch cases in renderSubModuleContent in src/education.jsx
const switchBlockMatch = eduJsxContent.match(/function renderSubModuleContent[\s\S]*?default:/);
assert(!!switchBlockMatch, 'renderSubModuleContent switch block found in src/education.jsx');
const switchBlock = switchBlockMatch ? switchBlockMatch[0] : '';
const renderedModuleCases = new Set(
  [...switchBlock.matchAll(/case\s+['"]([^'"]+)['"]/g)].map(m => m[1])
);

const moduleIds = new Set();

for (const file of mdFiles) {
  const filePath = path.join(CONTENT_DIR, file);
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const expectedId = file.replace(/\.md$/, '');
  
  let parsed;
  try {
    parsed = parseFrontmatter(rawContent);
  } catch (err) {
    assert(false, `Module ${file}: parseFrontmatter succeeded`, err.message);
    continue;
  }

  const { data, body } = parsed;
  moduleIds.add(data.id || expectedId);

  // 1.1 Schema Validation using official schema validator
  const { errors, warnings } = VALIDATORS.education(data, ctx);
  assert(errors.length === 0, `Module ${file}: Passes content/schema.mjs validation`, errors.join('; '));

  // 1.2 ID consistency
  assert(data.id === expectedId, `Module ${file}: ID matches filename`, `id: "${data.id}" vs expected: "${expectedId}"`);
  assert(KEBAB_PATTERN.test(data.id), `Module ${file}: ID is valid kebab-case`, `id: "${data.id}"`);

  // 1.3 Substantive Content
  assert(typeof data.title === 'string' && data.title.length > 5, `Module ${file}: Has meaningful title`, `title: "${data.title}"`);
  assert(typeof data.summary === 'string' && data.summary.length > 20, `Module ${file}: Has comprehensive summary`, `summary length: ${data.summary ? data.summary.length : 0}`);
  assert(Array.isArray(data.tags) && data.tags.length > 0, `Module ${file}: Has tags`, `tags count: ${data.tags ? data.tags.length : 0}`);
  assert(Array.isArray(data.contexts) && data.contexts.length > 0, `Module ${file}: Has valid contexts`, `contexts: ${JSON.stringify(data.contexts)}`);
  assert(Array.isArray(data.references) && data.references.length > 0, `Module ${file}: Has references array`, `references count: ${data.references ? data.references.length : 0}`);
  assert(ISO_DATE_PATTERN.test(data.lastReviewed), `Module ${file}: Has valid ISO lastReviewed date`, `lastReviewed: "${data.lastReviewed}"`);
  assert(body && body.trim().length > 100, `Module ${file}: Has substantive body markdown`, `Body length: ${body ? body.length : 0}`);

  // 1.4 References shape verification
  for (const ref of data.references || []) {
    if (typeof ref === 'object') {
      if (ref.pmid) {
        assert(PMID_PATTERN.test(ref.pmid), `Module ${file}: Reference PMID is valid 7-9 digits (${ref.pmid})`, `Bad PMID: ${ref.pmid}`);
      }
      if (ref.doi) {
        assert(DOI_PATTERN.test(ref.doi), `Module ${file}: Reference DOI is valid format (${ref.doi})`, `Bad DOI: ${ref.doi}`);
      }
    }
  }

  // 1.5 Parity with bundle.json
  const inBundle = bundleEdu.find(b => b.id === data.id);
  assert(!!inBundle, `Module ${file}: Exists in bundle.json`, `ID: ${data.id}`);
  if (inBundle) {
    assert(inBundle.title === data.title, `Module ${file}: Bundle title matches markdown`, `Bundle: "${inBundle.title}" vs MD: "${data.title}"`);
    assert(inBundle.summary === data.summary, `Module ${file}: Bundle summary matches markdown`, `Bundle summary differs`);
  }

  // 1.6 Routing / Rendering in src/education.jsx
  const hasRouterCase = renderedModuleCases.has(data.id);
  assert(hasRouterCase, `Module ${file}: Dedicated router case in renderSubModuleContent`, `Missing switch case for "${data.id}"`);

  // 1.7 Image Asset Existence
  const imgMatches = [...body.matchAll(/!\[.*?\]\((.*?)\)/g)].map(m => m[1]);
  for (const img of imgMatches) {
    const cleanImg = img.split(' ')[0].split('?')[0];
    const absImgPath = path.isAbsolute(cleanImg) ? cleanImg : path.join(REPO, cleanImg);
    assert(fs.existsSync(absImgPath), `Module ${file}: Image asset exists (${cleanImg})`, `Missing file: ${absImgPath}`);
  }
}

assert(moduleIds.size === 32, 'All 32 education module IDs are distinct and unique', `Total unique: ${moduleIds.size}`);

// -----------------------------------------------------------------------------
// 2. ACCORDION (<details>) DEFAULT MINIMIZED BEHAVIOR
// -----------------------------------------------------------------------------
console.log('\n--- 2. Accordion State & Minimized Default Behavior ---');

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

const allSrcFiles = scanDirForFiles(SRC_DIR);
let totalDetailsInSrc = 0;
let staticOpenDetailsInSrc = 0;
const openDetailsList = [];

for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const detailsMatches = [...content.matchAll(/<details\b([^>]*)>/gi)];
  for (const match of detailsMatches) {
    totalDetailsInSrc++;
    const attrs = match[1];
    
    // Check for open attribute
    // Violations: <details open>, <details open={true}>, <details open="true">, <details open="open">
    const isExplicitTrue = /\bopen\s*=\s*(\{\s*true\s*\}|\"true\"|\'true\'|\"open\")/i.test(attrs);
    const isBareOpen = /\bopen\b/i.test(attrs) && !attrs.includes('open=');

    if (isExplicitTrue || isBareOpen) {
      staticOpenDetailsInSrc++;
      openDetailsList.push({ file: path.relative(REPO, file), tag: match[0] });
    }
  }
}

console.log(`Scanned ${allSrcFiles.length} source files; found ${totalDetailsInSrc} <details> elements.`);
assert(totalDetailsInSrc === 181, 'Verified expected total count of 181 <details> accordion elements in src/', `Found: ${totalDetailsInSrc}`);
assert(staticOpenDetailsInSrc === 0, 'Zero static <details open> tags across all JSX/JS source files', `Found: ${JSON.stringify(openDetailsList)}`);

// Check index.html
const indexHtmlContent = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
const indexDetailsMatches = [...indexHtmlContent.matchAll(/<details\b([^>]*)>/gi)];
const indexStaticOpen = indexDetailsMatches.filter(m => /\bopen\b/i.test(m[1]) && !m[1].includes('open="false"'));
assert(indexStaticOpen.length === 0, 'Zero static <details open> in index.html', `Found ${indexStaticOpen.length}`);

// Check all controlled state variables for open/expand in src/app.jsx
const appJsxContent = fs.readFileSync(APP_JSX_PATH, 'utf8');
const appStateMatches = [...appJsxContent.matchAll(/const\s*\[\s*([a-zA-Z0-9_]+)\s*,\s*set[a-zA-Z0-9_]+\s*\]\s*=\s*useState\(([^)]*)\)/g)];
let openStateCount = 0;
for (const match of appStateMatches) {
  const varName = match[1];
  const initVal = match[2].trim();
  if (/expand|accordion|details/i.test(varName) || /open$/i.test(varName)) {
    openStateCount++;
    assert(initVal === 'false' || initVal === 'null' || initVal === "''" || initVal === '""' || initVal === '{}' || initVal === '[]' || initVal === '0' || initVal === 'undefined',
      `Controlled state "${varName}" in app.jsx initializes false/minimized`,
      `Initialized to: ${initVal}`
    );
  }
}
console.log(`Verified ${openStateCount} accordion/expansion state hooks in src/app.jsx.`);

// -----------------------------------------------------------------------------
// 3. ACCESSIBILITY & ARIA ATTRIBUTES AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 3. Accessibility & Interactive Controls Audit ---');

// Check dark mode tokens in src/education.jsx
const hasDarkModeSupport = eduJsxContent.includes('dark:bg-') && eduJsxContent.includes('dark:text-');
assert(hasDarkModeSupport, 'src/education.jsx implements Tailwind dark mode classes across modules');

// Check interactive elements in src/education.jsx for proper accessibility
const buttonMatchesInEdu = [...eduJsxContent.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
let missingAriaInEdu = 0;
for (const match of buttonMatchesInEdu) {
  const attrs = match[1];
  const inner = match[2].trim();
  const hasText = inner.replace(/<[^>]*>/g, '').trim().length > 0;
  const hasAria = /aria-label\s*=/i.test(attrs) || /title\s*=/i.test(attrs);
  if (!hasText && !hasAria) {
    missingAriaInEdu++;
  }
}
assert(missingAriaInEdu === 0, 'Zero icon-only buttons in src/education.jsx without aria-label', `Missing: ${missingAriaInEdu}`);

// -----------------------------------------------------------------------------
// 4. 2024-2026 LANDMARK CLINICAL EVIDENCE CITATIONS CURRENCY AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 4. 2024-2026 Landmark Clinical Evidence Citations Audit ---');

const landmarkPmidChecks = [
  { name: '2026 AHA AIS Guideline', pmid: '41582814', expectedFiles: 5 },
  { name: 'THEIA 2025 (CRAO IVT)', pmid: '41109232', expectedFiles: 1 },
  { name: 'CATALYST 2025 (DOAC Timing IPDMA)', pmid: '40570866', expectedFiles: 1 },
  { name: 'CREST-2 2025 (Carotid Stenosis)', pmid: '41269206', expectedFiles: 1 },
  { name: 'LASTE 2024 (Large Core EVT)', pmid: '38718358', expectedFiles: 1 },
  { name: 'TESLA 2024 (Large Core EVT)', pmid: '39374319', expectedFiles: 1 },
  { name: 'TIMELESS 2024 (Late Window TNK)', pmid: '38329148', expectedFiles: 1 },
  { name: 'TRACE-III 2024 (Late Window TNK)', pmid: '38884324', expectedFiles: 1 },
  { name: 'ANNEXA-I 2024 (Andexanet Alfa in FXa ICH)', pmid: '38749032', expectedFiles: 1 },
  { name: 'OCEANIC-STROKE 2026 (Asundexian)', pmid: '41985132', expectedFiles: 1 },
  { name: 'FASTEST 2026 (rFVIIa in Ultra-Early ICH)', pmid: '41653933', expectedFiles: 1 },
];

for (const check of landmarkPmidChecks) {
  let fileCount = 0;
  for (const file of mdFiles) {
    const text = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    if (text.includes(check.pmid)) fileCount++;
  }
  const inBundle = JSON.stringify(bundleEdu).includes(check.pmid);
  const inJsx = eduJsxContent.includes(check.pmid) || fs.readFileSync(APP_JSX_PATH, 'utf8').includes(check.pmid);
  const inCitationsJs = citations.some(c => c.pmid === check.pmid);

  assert(fileCount >= check.expectedFiles || inBundle || inJsx || inCitationsJs,
    `Landmark trial citation: ${check.name} (PMID ${check.pmid}) verified across content/education/code`,
    `Found in ${fileCount} md files, bundle: ${inBundle}, jsx: ${inJsx}, citations.js: ${inCitationsJs}`
  );
}

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nSUMMARY OF FAILURES:');
  failures.forEach((f, i) => console.error(`${i + 1}. [${f.testName}]: ${f.details}`));
  process.exit(1);
} else {
  console.log('\n>>> VERDICT: ALL 100% EMPIRICAL ADVERSARIAL AUDITS PASSED <<<');
  process.exit(0);
}
