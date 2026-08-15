import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import {
  IvThrombolysisCard,
  LargeCoreThrombectomyCard,
  BasilarArteryOcclusionCard,
  DmvoMevoManagementCard,
  ExtendedWindowPerfusionCard,
  IchBloodPressureCard,
  AnticoagulationReversalCard,
  AneurysmalSahCard,
  MalignantInfarctionCard,
  BrainDeathCard,
  EVDInfographic,
  ICPInfographic,
  AfibAnticoagTimingCard,
  DaptRegimensCard,
  LipidManagementCard,
  MetabolicStrokePreventionCard,
  CarotidStenosisCard,
  VesselWallMriCard,
  CryptogenicStrokeEsusCard,
  PfoClosureCard,
  RcvsCard,
  CadasilCarasilCard,
  MoyamoyaDiseaseCard,
  FibromuscularDysplasiaCard,
  CervicalDissectionCard,
  PregnancyStrokeCard,
  CancerAssociatedStrokeCard,
  PediatricStrokeCard,
  CvstCard,
  NihssSimulator,
  StrokePrognosisCard,
  SelectSeizureRiskCard,
  ToastClassificationCard,
  BrainstemSyndromesCard,
  VascularTerritoryAtlasCard,
  StkCoreMeasuresCard,
  AntiepilepticDrugsCard,
  DeviceDetectedSubclinicalAfCard,
  IchSurgicalDecisionMakingCard,
  EvtPeriproceduralCareCard,
  IntracranialAtherosclerosisCard,
  UnrupturedIntracranialAneurysmCard,
  PrehospitalTriageSystemsCard,
  SevereStrokeCriticalCareCard,
  PostStrokeRecoveryCard,
  calculateAstralScore,
  getAstralRisk,
  calculatePlanScore,
  getPlanRisk,
  calculateIchScore,
  getIchRisk
} from '../src/education.jsx';
import { citations } from '../src/evidence/citations.js';

describe('Comprehensive Final Challenger Curriculum Verification', () => {
  const ALL_CURRICULUM_CARDS = [
    // Domain 1: Acute Revascularization & Extended Windows
    { id: 'iv-thrombolysis', Component: IvThrombolysisCard, name: 'IV Thrombolysis (TNK & Alteplase)' },
    { id: 'large-core-thrombectomy', Component: LargeCoreThrombectomyCard, name: 'Large-Core Thrombectomy' },
    { id: 'basilar-artery-occlusion', Component: BasilarArteryOcclusionCard, name: 'Basilar Artery Occlusion' },
    { id: 'dmvo-mevo-management', Component: DmvoMevoManagementCard, name: 'Distal Medium Vessel Occlusions' },
    { id: 'extended-window-perfusion', Component: ExtendedWindowPerfusionCard, name: 'Extended Window Perfusion & Mismatch' },

    // Domain 2: Neurocritical Care, Hemorrhagic Stroke & ICP
    { id: 'ich-blood-pressure', Component: IchBloodPressureCard, name: 'Acute ICH Blood Pressure & Expansion Mitigation' },
    { id: 'anticoagulation-reversal', Component: AnticoagulationReversalCard, name: 'Anticoagulation Reversal' },
    { id: 'aneurysmal-sah-management', Component: AneurysmalSahCard, name: 'Aneurysmal SAH' },
    { id: 'malignant-infarction', Component: MalignantInfarctionCard, name: 'Malignant MCA Infarction & DHC' },
    { id: 'brain-death', Component: BrainDeathCard, name: '2023 Unified Brain Death' },
    { id: 'evd-maintenance', Component: EVDInfographic, name: 'EVD Maintenance Infographic' },
    { id: 'herniation-icp', Component: ICPInfographic, name: 'Intracranial Hypertension & Herniation' },

    // Domain 3: Secondary Prevention & Precision Antithrombotics
    { id: 'afib-anticoag-timing', Component: AfibAnticoagTimingCard, name: 'AFib Anticoagulation Restart Timing' },
    { id: 'dapt-regimens', Component: DaptRegimensCard, name: 'DAPT & Pharmacogenomics' },
    { id: 'lipid-management-after-stroke', Component: LipidManagementCard, name: 'Lipid Management After Stroke' },
    { id: 'metabolic-stroke-prevention', Component: MetabolicStrokePreventionCard, name: 'Metabolic & Vascular Risk Modulation' },
    { id: 'carotid-stenosis-management', Component: CarotidStenosisCard, name: 'Carotid Stenosis Management' },

    // Domain 4: Diagnostic Algorithms, Neuroimaging & ESUS
    { id: 'vessel-wall-mri', Component: VesselWallMriCard, name: 'Vessel Wall MRI Differential' },
    { id: 'cryptogenic-stroke-esus', Component: CryptogenicStrokeEsusCard, name: 'Cryptogenic Stroke & ESUS' },
    { id: 'pfo-closure', Component: PfoClosureCard, name: 'PFO Closure & LAAO Pathways' },
    { id: 'rcvs', Component: RcvsCard, name: 'RCVS Diagnostic Flowchart' },

    // Domain 5: Rare Vasculopathies & Special Populations
    { id: 'cadasil-carasil', Component: CadasilCarasilCard, name: 'CADASIL & CARASIL Vasculopathies' },
    { id: 'moyamoya-disease', Component: MoyamoyaDiseaseCard, name: 'Moyamoya Disease & Bypass' },
    { id: 'fibromuscular-dysplasia', Component: FibromuscularDysplasiaCard, name: 'Fibromuscular Dysplasia' },
    { id: 'cervical-dissection', Component: CervicalDissectionCard, name: 'Cervical Artery Dissection' },
    { id: 'pregnancy-stroke', Component: PregnancyStrokeCard, name: 'Stroke in Pregnancy & Puerperium' },
    { id: 'cancer-associated-stroke', Component: CancerAssociatedStrokeCard, name: 'Cancer-Associated Stroke & NBTE' },
    { id: 'pediatric-stroke', Component: PediatricStrokeCard, name: 'Pediatric Stroke Master Module' },
    { id: 'cerebral-venous-sinus-thrombosis', Component: CvstCard, name: 'Cerebral Venous Sinus Thrombosis' },

    // Clinical Simulators & Reference Atlases
    { id: 'nihss-simulator', Component: NihssSimulator, name: 'NIHSS Certification Simulator' },
    { id: 'stroke-prognosis', Component: StrokePrognosisCard, name: 'Stroke Prognosis & Scores' },
    { id: 'select-seizure-risk', Component: SelectSeizureRiskCard, name: 'SeLECT Seizure Risk' },
    { id: 'toast-classification', Component: ToastClassificationCard, name: 'TOAST Classification' },
    { id: 'brainstem-stroke-syndromes', Component: BrainstemSyndromesCard, name: 'Brainstem Syndromes Atlas' },
    { id: 'vascular-territory-atlas', Component: VascularTerritoryAtlasCard, name: 'Vascular Territory Atlas' },
    { id: 'stk-core-measures', Component: StkCoreMeasuresCard, name: 'Stroke Core Measures' },
    { id: 'antiepileptic-drugs', Component: AntiepilepticDrugsCard, name: 'Antiepileptic Drugs' },

    // Added with the 2026-08 education expansion
    { id: 'post-stroke-recovery', Component: PostStrokeRecoveryCard, name: "Post-Stroke Recovery, Cognition & Mood" },

    // Added with the 2026-08 education expansion
    { id: 'severe-stroke-critical-care', Component: SevereStrokeCriticalCareCard, name: "Neurocritical Care of Severe Stroke" },

    // Added with the 2026-08 education expansion
    { id: 'prehospital-triage-systems', Component: PrehospitalTriageSystemsCard, name: "Prehospital Triage & Stroke Systems of Care" },

    // Added with the 2026-08 education expansion
    { id: 'unruptured-intracranial-aneurysm', Component: UnrupturedIntracranialAneurysmCard, name: "Unruptured Intracranial Aneurysm: Rupture Risk vs Treatment Risk" },

    // Added with the 2026-08 education expansion
    { id: 'intracranial-atherosclerosis', Component: IntracranialAtherosclerosisCard, name: "Intracranial Atherosclerotic Disease" },

    // Added with the 2026-08 education expansion
    { id: 'evt-periprocedural-care', Component: EvtPeriproceduralCareCard, name: "EVT Technique & Post-Thrombectomy Care" },

    // Added with the 2026-08 education expansion
    { id: 'ich-surgical-decision-making', Component: IchSurgicalDecisionMakingCard, name: "ICH Surgical Decision-Making" },

    // Added with the 2026-08 education expansion
    { id: 'device-detected-subclinical-af', Component: DeviceDetectedSubclinicalAfCard, name: "Device-Detected & Subclinical AF" },
  ];

  describe('1. SSR & HTML Rendering Integrity', () => {
    ALL_CURRICULUM_CARDS.forEach(({ id, Component, name }) => {
      it(`renders ${name} (${id}) cleanly without exceptions, NaN, undefined, or [object Object]`, () => {
        expect(Component, `Component for ${id} must be defined`).toBeDefined();
        const html = ReactDOMServer.renderToString(React.createElement(Component));

        expect(html.length, `${name} HTML output suspiciously small`).toBeGreaterThan(300);
        expect(html).not.toContain('NaN');
        expect(html).not.toContain('undefined');
        expect(html).not.toContain('[object Object]');
        expect(html).not.toMatch(/>\s*null\s*</);
      });
    });
  });

  describe('2. SVG Vector Diagrams & WCAG Accessibility Audit', () => {
    ALL_CURRICULUM_CARDS.forEach(({ id, Component, name }) => {
      it(`audits all SVGs in ${name} (${id}) for valid bounding boxes and WCAG attributes`, () => {
        const html = ReactDOMServer.renderToString(React.createElement(Component));
        const svgRegex = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi;
        let match;

        while ((match = svgRegex.exec(html)) !== null) {
          const attrs = match[1];
          const inner = match[2];

          // Check viewBox
          const viewBoxMatch = attrs.match(/viewBox="([^"]+)"/i);
          expect(viewBoxMatch, `SVG in ${id} must have viewBox`).toBeTruthy();

          const [minX, minY, width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
          expect(minX).toBe(0);
          expect(minY).toBe(0);
          expect(width).toBeGreaterThan(0);
          expect(height).toBeGreaterThan(0);

          // Check inner content
          expect(inner).not.toContain('NaN');
          expect(inner).not.toContain('undefined');

          // Check accessibility
          const isRoleImg = /role="img"/i.test(attrs);
          const hasAriaLabel = /aria-label="[^"]+"/i.test(attrs);
          const isAriaHidden = /aria-hidden="true"/i.test(attrs);
          const isFocusableFalse = /focusable="false"/i.test(attrs);

          expect(isFocusableFalse, `SVG in ${id} must have focusable="false"`).toBe(true);

          if (isRoleImg) {
            expect(hasAriaLabel, `Informative SVG in ${id} must have aria-label`).toBe(true);
            expect(isAriaHidden, `Informative SVG in ${id} must NOT have aria-hidden="true"`).toBe(false);
          } else {
            expect(isAriaHidden, `Decorative SVG in ${id} must have aria-hidden="true"`).toBe(true);
          }
        }
      });
    });
  });

  describe('3. Content Bundle & Markdown Alignment', () => {
    const bundlePath = path.resolve(process.cwd(), 'content/bundle.json');
    const bundleData = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

    it('verifies content/bundle.json contains all 48 education modules', () => {
      expect(bundleData.education.length).toBe(48);
    });

    ALL_CURRICULUM_CARDS.forEach(({ id }) => {
      it(`verifies markdown file and bundle entry exist for ${id}`, () => {
        const mdPath = path.resolve(process.cwd(), `content/education/${id}.md`);
        expect(fs.existsSync(mdPath), `Missing content markdown file: ${mdPath}`).toBe(true);

        const bundleEntry = bundleData.education.find(e => e.id === id);
        expect(bundleEntry, `Missing bundle.json entry for ${id}`).toBeDefined();
        expect(bundleEntry.title).toBeTruthy();
        expect(bundleEntry.summary).toBeTruthy();
      });
    });
  });

  describe('4. Clinical Calculator Mathematical Integrity', () => {
    it('calculates ASTRAL score and risk prediction accurately across risk strata', () => {
      const lowRiskScore = calculateAstralScore({ age: 40, nihss: 2, delay: 60, glucose: 100, visual: false, motor: false });
      const midRiskScore = calculateAstralScore({ age: 65, nihss: 10, delay: 180, glucose: 140, visual: true, motor: false });
      const highRiskScore = calculateAstralScore({ age: 85, nihss: 22, delay: 240, glucose: 220, visual: true, motor: true });

      expect(lowRiskScore).toBeGreaterThanOrEqual(0);
      expect(midRiskScore).toBeGreaterThan(lowRiskScore);
      expect(highRiskScore).toBeGreaterThan(midRiskScore);

      expect(typeof getAstralRisk(lowRiskScore)).toBe('string');
      expect(getAstralRisk(lowRiskScore)).not.toContain('NaN');
      expect(getAstralRisk(highRiskScore)).not.toContain('NaN');
    });

    it('calculates PLAN score and outputs structured risk object', () => {
      const score = calculatePlanScore({
        preDependence: false,
        cancer: false,
        chf: false,
        afib: true,
        locReduced: false,
        age: 70,
        legWeakness: true,
        armWeakness: true,
        aphasiaNeglect: false
      });

      const risk = getPlanRisk(score);
      expect(risk).toHaveProperty('mortality');
      expect(risk).toHaveProperty('depMortality');
      expect(risk.mortality).not.toContain('NaN');
      expect(risk.depMortality).not.toContain('NaN');
    });

    it('calculates ICH score and accurately predicts 30-day mortality risk', () => {
      expect(getIchRisk(0)).toBe('0%');
      expect(getIchRisk(1)).toBe('13%');
      expect(getIchRisk(2)).toBe('26%');
      expect(getIchRisk(3)).toBe('72%');
      expect(getIchRisk(4)).toBe('97%');
      expect(getIchRisk(5)).toBe('100%');
      expect(getIchRisk(6)).toBe('100%');
    });
  });

  describe('5. Landmark Trial PMID Resolution in Citations Registry', () => {
    const verifiedTrialPMIDs = [
      { name: 'AcT', pmid: '35779553' },
      { name: 'TRACE-2', pmid: '36774935' },
      { name: 'ORIGINAL', pmid: '39264623' },
      { name: 'ATTEST-2', pmid: '39424558' },
      { name: 'TIMELESS', pmid: '38329148' },
      { name: 'TRACE-III', pmid: '38884324' },
      { name: 'TEMPO-2', pmid: '38768626' },
      { name: 'SELECT2', pmid: '36762865' },
      { name: 'ANGEL-ASPECT', pmid: '36762852' },
      { name: 'TENSION', pmid: '37837989' },
      { name: 'LASTE', pmid: '38718358' },
      { name: 'TESLA', pmid: '39374319' },
      { name: 'ATTENTION', pmid: '36239644' },
      { name: 'BAOCHE', pmid: '36239645' },
      { name: 'BASICS', pmid: '34010530' },
      { name: 'BEST', pmid: '31831388' },
      { name: 'DISTAL', pmid: '39908430' },
      { name: 'ESCAPE-MeVO', pmid: '39908448' },
      { name: 'DAWN', pmid: '29129157' },
      { name: 'DEFUSE 3', pmid: '29364767' },
      { name: 'EXTEND', pmid: '31067369' },
      { name: 'WAKE-UP', pmid: '29766770' },
      { name: 'ANNEXA-I', pmid: '38749032' },
      { name: 'RE-VERSE AD', pmid: '28693366' },
      { name: 'ELAN', pmid: '37222476' },
      { name: 'TIMING', pmid: '36065821' },
      { name: 'OPTIMAS', pmid: '39491870' },
      { name: 'CATALYST', pmid: '40570866' },
      { name: 'CHANCE', pmid: '23803136' },
      { name: 'POINT', pmid: '29766750' },
      { name: 'THALES', pmid: '32668111' },
      { name: 'INSPIRES', pmid: '38157499' },
      { name: 'CHANCE-2', pmid: '34708996' },
      { name: 'OCEANIC-STROKE', pmid: '41985132' },
      { name: 'SPARCL', pmid: '16899775' },
      { name: 'TST', pmid: '31738483' },
      { name: 'FOURIER', pmid: '28304224' },
      { name: 'ODYSSEY Outcomes', pmid: '30403574' },
      { name: 'CRYSTAL AF', pmid: '24963567' },
      { name: 'STROKE-AF', pmid: '34061145' },
      { name: 'ARCADIA', pmid: '38324415' },
      { name: 'NAVIGATE ESUS', pmid: '29766772' },
      { name: 'RE-SPECT ESUS', pmid: '31091372' },
      { name: 'CLOSE', pmid: '28902593' },
      { name: 'REDUCE', pmid: '28902580' },
      { name: 'DEFENSE-PFO', pmid: '29544871' },
      { name: 'RESPECT', pmid: '28902590' },
      { name: 'Boston Criteria 2.0', pmid: '35841910' },
      { name: 'PRESTIGE-AF', pmid: '40023176' },
      { name: 'SoSTART', pmid: '34487722' },
      { name: 'CADISS', pmid: '25684164' },
      { name: 'TREAT-CAD', pmid: '33765420' },
      { name: 'STOP-CAD', pmid: '38335240' },
      { name: '2023 Unified Brain Death', pmid: '37821233' },
      { name: '2026 AIS Guideline', pmid: '41582814' }
    ];

    verifiedTrialPMIDs.forEach(({ name, pmid }) => {
      it(`verifies landmark trial ${name} (PMID ${pmid}) is present in citations registry`, () => {
        const citation = citations.find(c => c.pmid === pmid);
        expect(citation, `PMID ${pmid} for ${name} not found in citations registry`).toBeDefined();
        if (citation.url) {
          expect(citation.url).toContain(pmid);
        }
      });
    });
  });
});
