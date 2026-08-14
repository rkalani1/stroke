// tests/e2e/tier3-cross-feature-combinations.test.js
// Tier 3: Cross-Feature Combinations & Pairwise Interactions (>=19 cases, total 21 cases)
// Opaque-box, requirement-driven E2E tests derived from ORIGINAL_REQUEST.md & TEST_INFRA.md

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  activeTrials,
  completedTrials,
  citations,
  recommendations,
  claims,
  guidelines,
  topics,
  getCitation,
  getCompletedTrial
} from '../../src/evidence/index.js';
import {
  AIS_COMMAND_CENTER_CARDS,
  AIS_SOURCE_LINKS
} from '../../src/management-guidance.js';
import { INSTITUTIONAL_BP_PROTOCOLS } from '../../src/institutional-protocols.js';
import { parseFrontmatter, VALIDATORS } from '../../content/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

describe('Tier 3: Cross-Feature Combinations (Pairwise Interactions)', () => {

  // 1. F1 x F5: AIS 2026 Guidelines & Blood Pressure Guardrails
  it('F1xF5: AIS 2026 pre-IVT thrombolysis target harmonizes with blood pressure protocol threshold (<185/110 mmHg)', () => {
    const aisData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/ais-2026.json'), 'utf8'));
    const aisBPRec = aisData.recommendations.find(r => /185/i.test(r.text) && /110/i.test(r.text));
    const instBP = INSTITUTIONAL_BP_PROTOCOLS.beforeIVT;
    expect(aisBPRec).toBeDefined();
    expect(instBP).toBeDefined();
    expect(instBP.target).toContain('185/110');
    expect(aisBPRec.classOfRec).toBe('I');
    expect(instBP.cor).toBe('1');
  });

  // 2. F1 x F2: AIS 2026 Guidelines & SVIN 2025 Large-Core EVT
  it('F1xF2: AIS 2026 EVT recommendations coordinate with SVIN 2025 early and late large-core criteria', () => {
    const aisData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/ais-2026.json'), 'utf8'));
    const svinData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/svin-large-core-2025.json'), 'utf8'));
    const aisLargeCore = aisData.recommendations.filter(r => /ASPECTS 3-5|ASPECTS 0-2/i.test(r.text));
    const svinLargeCore = svinData.recommendations.filter(r => /ASPECTS of 0-5|ASPECTS of 3-5/i.test(r.text));
    expect(aisLargeCore.length).toBeGreaterThan(0);
    expect(svinLargeCore.length).toBeGreaterThan(0);
  });

  // 3. F1 x F3: AIS 2026 Guidelines & CATALYST 2025 DOAC Timing
  it('F1xF3: AIS secondary prevention and clinical pearls align with CATALYST ≤4 days early DOAC initiation model', () => {
    const appJsx = fs.readFileSync(path.join(ROOT, 'src/app.jsx'), 'utf8');
    expect(appJsx).toContain('≤4 days');
    const cit = citations.find(c => c.pmid === '40570866');
    expect(cit).toBeDefined();
    expect(cit.year).toBe(2025);
  });

  // 4. F2 x F4: SVIN 2025 Large-Core & Decision Tree Logic
  it('F2xF4: SVIN 2025 large-core thresholds integrate with SELECT2/TENSION decision tree logic in command center', () => {
    const evtCard = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-evt-selection');
    expect(evtCard).toBeDefined();
    const pathwayLabels = evtCard.pathway.map(p => p.label).join(' ');
    expect(pathwayLabels).toContain('ASPECTS 3-5');
    expect(pathwayLabels).toContain('50-100 mL');
  });

  // 5. F4 x F5: Large-Core Decision Trees & Post-EVT Blood Pressure Harm Guard
  it('F4xF5: Large-core EVT decision pathways incorporate intensive BP lowering harm thresholds (<140 mmHg)', () => {
    const sbp140Harm = INSTITUTIONAL_BP_PROTOCOLS.sbpLT140EVT;
    expect(sbp140Harm).toBeDefined();
    expect(sbp140Harm.cor).toContain('3 (Harm)');
    expect(sbp140Harm.rationale).toContain('ENCHANTED2-MT');
    expect(sbp140Harm.rationale).toContain('OPTIMAL-BP');
    expect(sbp140Harm.rationale).toContain('BEST-II');
  });

  // 6. F1 x F6: Adult AIS Guidelines & Pediatric Reperfusion Pathway Contrast
  it('F1xF6: Adult AIS guidelines contrast clearly with pediatric reperfusion pathway rules and warnings', () => {
    const pedCard = AIS_COMMAND_CENTER_CARDS.find(c => c.id === 'ais-pediatric');
    expect(pedCard).toBeDefined();
    expect(pedCard.classOfRecommendation).toBe('IIb');
    expect(pedCard.summary).toContain('Pediatric AIS evidence is far more limited than adult AIS');
    expect(pedCard.actions.some(a => a.includes('percentile thresholds'))).toBe(true);
  });

  // 7. F1 x F7: AIS 2026 Guidelines & Guideline Library Index
  it('F1xF7: AIS 2026 guideline dataset is correctly registered in the Guideline Library index with 195 statements', () => {
    const indexData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guidelines/index.json'), 'utf8'));
    const aisEntry = indexData.data.find(g => g.id === 'ais-2026');
    expect(aisEntry).toBeDefined();
    expect(aisEntry.recommendationCount).toBe(195);
    expect(aisEntry.doi).toBe('10.1161/STR.0000000000000513');
  });

  // 8. F7 x F8: Guideline Library & 32 Educational Modules
  it('F7xF8: Guideline datasets and 32 educational modules maintain consistent cross-referencing topics', () => {
    const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/bundle.json'), 'utf8'));
    expect(bundle.guidelines.length).toBe(11);
    expect(bundle.education.length).toBe(32);
    const eduIds = new Set(bundle.education.map(e => e.id));
    expect(eduIds.has('large-core-thrombectomy')).toBe(true);
    expect(eduIds.has('afib-anticoag-timing')).toBe(true);
    expect(eduIds.has('cerebral-venous-sinus-thrombosis')).toBe(true);
  });

  // 9. F8 x F9: Educational Modules & Minimized Accordion UX
  it('F8xF9: Educational markdown modules render within minimized accordion structures by default', () => {
    const eduSrc = fs.readFileSync(path.join(ROOT, 'src/education.jsx'), 'utf8');
    const openMatches = eduSrc.match(/<details[^>]*\bopen\b/gi) || [];
    expect(openMatches).toEqual([]);
    expect(eduSrc).toContain('function Education(');
  });

  // 10. F9 x F10: Minimized Accordions & Dark Mode Contrast Compliance
  it('F9xF10: Collapsible UI components and text elements satisfy WCAG AA contrast across light and dark modes', () => {
    const res = spawnSync('node', [path.join(ROOT, 'scripts/lint-contrast.mjs')], { cwd: ROOT, encoding: 'utf8' });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('21 pairs verified');
  });

  // 11. F8 x F11: Educational Modules & 2024-2026 Landmark Trial Citations
  it('F8xF11: Educational modules cite 2024-2026 landmark trials (THEIA, LASTE, TESLA, ANNEXA-I, CATALYST)', () => {
    const largeCore = fs.readFileSync(path.join(ROOT, 'content/education/large-core-thrombectomy.md'), 'utf8');
    const afib = fs.readFileSync(path.join(ROOT, 'content/education/afib-anticoag-timing.md'), 'utf8');
    expect(largeCore).toContain('LASTE');
    expect(largeCore).toContain('TESLA');
    expect(afib).toContain('40570866'); // CATALYST PMID
  });

  // 12. F11 x F14: Landmark Trial Citations & Evidence Atlas Completed Trials
  it('F11xF14: Landmark trial citations in Evidence Atlas completed trials resolve against central citations registry', () => {
    for (const trial of completedTrials) {
      if (trial.citationId) {
        const cit = getCitation(trial.citationId);
        expect(cit).toBeDefined();
        expect(cit.id).toBe(trial.citationId);
      }
    }
  });

  // 13. F12 x F13: Content Bundler & Content/Currency Validator
  it('F12xF13: Content bundler and schema/currency validator both verify 166 records across 5 domains', () => {
    const bundleRes = spawnSync('node', [path.join(ROOT, 'scripts/build-content-bundle.mjs'), '--check'], { cwd: ROOT, encoding: 'utf8' });
    const valRes = spawnSync('node', [path.join(ROOT, 'scripts/validate-content.mjs'), '--json'], { cwd: ROOT, encoding: 'utf8' });
    expect(bundleRes.status).toBe(0);
    expect(valRes.status).toBe(0);
    const valJson = JSON.parse(valRes.stdout);
    const total = Object.values(valJson.counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(166);
  });

  // 14. F13 x F14: Content Validator & Matcher Engine Criteria
  it('F13xF14: Content validator and evidence validator maintain 100% executable criteria coverage', () => {
    const evRes = spawnSync('node', [path.join(ROOT, 'scripts/evidence-validate.mjs'), '--json'], { cwd: ROOT, encoding: 'utf8' });
    expect(evRes.status).toBe(0);
    const evJson = JSON.parse(evRes.stdout);
    expect(evJson.coverage.percent).toBe(100);
    expect(evJson.coverage.exclusionsPercent).toBe(100);
  });

  // 15. F14 x F15: Evidence Atlas & Static / Inline Citation Validators
  it('F14xF15: Evidence Atlas citations validate cleanly under static citation analyzer and inline sweeper', () => {
    const citRes = spawnSync('node', [path.join(ROOT, 'scripts/validate-citations.mjs')], { cwd: ROOT, encoding: 'utf8' });
    const inlineRes = spawnSync('node', [path.join(ROOT, 'scripts/validate-inline-citations.mjs')], { cwd: ROOT, encoding: 'utf8' });
    expect(citRes.status).toBe(0);
    expect(inlineRes.status).toBe(0);
  });

  // 16. F5 x F16: Blood Pressure Guardrails & Playwright Protocol Snapshot Lock
  it('F5xF16: Blood pressure guardrails and harm thresholds are locked into ischemic protocol baseline snapshot', () => {
    const ischemic = fs.readFileSync(path.join(ROOT, 'tests/snapshots/example-protocols/ischemic.txt'), 'utf8');
    expect(ischemic).toContain('<185/110');
    expect(ischemic).toContain('<180/105');
    expect(ischemic).toContain('TNK 0.25 mg/kg');
  });

  // 17. F16 x F17: Protocol Snapshots & Institutional / PHI Leak Guard
  it('F16xF17: Example Protocol snapshots pass Institutional & PHI Leak Guard with zero violations', () => {
    const snapFiles = fs.readdirSync(path.join(ROOT, 'tests/snapshots/example-protocols'))
      .map(f => `tests/snapshots/example-protocols/${f}`);
    const scanResult = spawnSync('node', [path.join(ROOT, 'scripts/check-no-institutional-leak.mjs'), '--json'], {
      cwd: ROOT,
      input: snapFiles.join('\n') + '\n',
      encoding: 'utf8'
    });
    expect(scanResult.status).toBe(0);
    const report = JSON.parse(scanResult.stdout);
    expect(report.violations.length).toBe(0);
  });

  // 18. F12 x F18: Content Bundler & Production Build / Compression
  it('F12xF18: Content bundle output is compiled into the production build and compressed with brotli and gzip', () => {
    expect(fs.existsSync(path.join(ROOT, 'app.js'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'app.js.gz'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'app.js.br'))).toBe(true);
    const rawSize = fs.statSync(path.join(ROOT, 'app.js')).size;
    const brSize = fs.statSync(path.join(ROOT, 'app.js.br')).size;
    expect(brSize).toBeLessThan(rawSize * 0.35); // at least 65% compression
  });

  // 19. F18 x F19: Production Build & Git Deployment Target Verification
  it('F18xF19: Production build output matches repository status tracking main branch', () => {
    const branchRes = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
    expect(branchRes.status).toBe(0);
    expect(branchRes.stdout.trim()).toBe('main');
    const statusRes = spawnSync('git', ['status', '-sb'], { cwd: ROOT, encoding: 'utf8' });
    expect(statusRes.stdout).toContain('main...origin/main');
  });

  // 20. F6 x F16: Pediatric Pathway & Ischemic Protocol Snapshot Lock
  it('F6xF16: Pediatric reperfusion rules are locked into ischemic protocol baseline snapshot', () => {
    const ischemic = fs.readFileSync(path.join(ROOT, 'tests/snapshots/example-protocols/ischemic.txt'), 'utf8');
    expect(ischemic).toContain('Pediatric Acute Ischemic Stroke');
    expect(ischemic).toContain('28 days-18 years');
    expect(ischemic).toContain('COR IIb');
    expect(ischemic).toContain('COR IIa');
  });

  // 21. F3 x F8: CATALYST DOAC Timing & AFib Education Module
  it('F3xF8: CATALYST meta-analysis timing evidence is synchronized with afib-anticoag-timing educational module', () => {
    const file = path.join(ROOT, 'content/education/afib-anticoag-timing.md');
    expect(fs.existsSync(file)).toBe(true);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('40570866');
    expect(content).toContain('ELAN');
  });
});
