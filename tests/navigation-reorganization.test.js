import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Navigation Reorganization and Consolidation (R1, R2)', () => {
  const appJsxPath = path.join(process.cwd(), 'src', 'app.jsx');
  const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');

  // Extract pure routing functions for direct runtime testing
  const routingSlice = appJsxContent.substring(
    appJsxContent.indexOf('const MANAGEMENT_SUBTABS'),
    appJsxContent.indexOf('const AutoDetectedContraindicationsBanner')
  );
  
  // Safe evaluation of pure functions for test execution
  const scope = {};
  const fnModule = new Function(
    'scope',
    routingSlice + `
      scope.MANAGEMENT_SUBTABS = MANAGEMENT_SUBTABS;
      scope.RESEARCH_SUBTABS = RESEARCH_SUBTABS;
      scope.LEGACY_MANAGEMENT_TABS = LEGACY_MANAGEMENT_TABS;
      scope.VALID_TABS = VALID_TABS;
      scope.normalizeManagementSubTab = normalizeManagementSubTab;
      scope.normalizeResearchSubTab = normalizeResearchSubTab;
      scope.parseHashRoute = parseHashRoute;
      scope.buildHashRoute = buildHashRoute;
    `
  );
  fnModule(scope);

  it('R1: Primary navigation sequence is Encounter -> Protocols -> Trials -> Guidelines & References', () => {
    // Check desktop tab keydown sequence
    expect(appJsxContent).toContain("const tabs = ['encounter', 'protocols', 'trials', 'research'];");

    // Check desktop tab rendering order
    const desktopNavStart = appJsxContent.indexOf('aria-label="Main sections"');
    const desktopNavEnd = appJsxContent.indexOf('</nav>', desktopNavStart);
    const desktopNavBlock = appJsxContent.substring(desktopNavStart, desktopNavEnd);

    const encounterIdx = desktopNavBlock.indexOf("id: 'encounter'");
    const protocolsIdx = desktopNavBlock.indexOf("id: 'protocols'");
    const trialsIdx = desktopNavBlock.indexOf("id: 'trials'");
    const researchIdx = desktopNavBlock.indexOf("id: 'research'");

    expect(encounterIdx).toBeGreaterThan(0);
    expect(protocolsIdx).toBeGreaterThan(encounterIdx);
    expect(trialsIdx).toBeGreaterThan(protocolsIdx);
    expect(researchIdx).toBeGreaterThan(trialsIdx);

    // Check mobile bottom navigation sequence
    const mobileNavStart = appJsxContent.indexOf('aria-label="Mobile sections"');
    const mobileNavEnd = appJsxContent.indexOf('</div>\n            </nav>', mobileNavStart);
    const mobileNavBlock = appJsxContent.substring(mobileNavStart, mobileNavEnd);

    const mobileEncounterIdx = mobileNavBlock.indexOf("id: 'encounter'");
    const mobileProtocolsIdx = mobileNavBlock.indexOf("id: 'protocols'");
    const mobileTrialsIdx = mobileNavBlock.indexOf("id: 'trials'");
    const mobileResearchIdx = mobileNavBlock.indexOf("id: 'research'");

    expect(mobileEncounterIdx).toBeGreaterThan(0);
    expect(mobileProtocolsIdx).toBeGreaterThan(mobileEncounterIdx);
    expect(mobileTrialsIdx).toBeGreaterThan(mobileProtocolsIdx);
    expect(mobileResearchIdx).toBeGreaterThan(mobileTrialsIdx);
  });

  it('R2: Consolidated Guidelines & References has guidelines, references, calculators, and education subtabs', () => {
    // Check RESEARCH_SUBTABS definition
    expect(scope.RESEARCH_SUBTABS).toEqual(['guidelines', 'references', 'calculators', 'education']);

    // Check subtab template string inside activeTab === 'research'
    expect(appJsxContent).toContain('id={`research-tab-${tab.id}`}');
    expect(appJsxContent).toContain('id="research-tabpanel-guidelines"');
    expect(appJsxContent).toContain('id="research-tabpanel-references"');
    expect(appJsxContent).toContain('id="research-tabpanel-calculators"');
    expect(appJsxContent).toContain('id="research-tabpanel-education"');
    expect(appJsxContent).toContain('{ id: \'guidelines\', name: "Guidelines" }');
    expect(appJsxContent).toContain('{ id: \'references\', name: "Reference Library" }');
    expect(appJsxContent).toContain('{ id: \'calculators\', name: "Calculators" }');
    expect(appJsxContent).toContain('{ id: \'education\', name: "Educational Resources" }');
  });

  it('R2: Protocols sub-tabs are limited to ICH and Ischemic/TIA', () => {
    expect(scope.MANAGEMENT_SUBTABS).toEqual(['ich', 'ischemic']);
    expect(appJsxContent).toContain('const subTabs = MANAGEMENT_SUBTABS;');
  });

  it('R2: Dynamic hash routing and backwards compatibility for legacy paths', () => {
    // Primary routes
    expect(scope.parseHashRoute('')).toEqual({ tab: 'encounter' });
    expect(scope.parseHashRoute('#/trials')).toEqual({ tab: 'trials' });
    expect(scope.parseHashRoute('#/research')).toEqual({ tab: 'research', sub: null });
    expect(scope.parseHashRoute('#/research/guidelines')).toEqual({ tab: 'research', sub: 'guidelines' });
    expect(scope.parseHashRoute('#/research/references')).toEqual({ tab: 'research', sub: 'references' });
    expect(scope.parseHashRoute('#/research/calculators')).toEqual({ tab: 'research', sub: 'calculators' });
    expect(scope.parseHashRoute('#/research/education')).toEqual({ tab: 'research', sub: 'education', educationSub: null });
    expect(scope.parseHashRoute('#/research/education/icu')).toEqual({ tab: 'research', sub: 'education', educationSub: 'icu' });

    // Legacy and alias routes
    expect(scope.parseHashRoute('#/education')).toEqual({ tab: 'research', sub: 'education', educationSub: null });
    expect(scope.parseHashRoute('#/education/onboarding')).toEqual({ tab: 'research', sub: 'education', educationSub: 'onboarding' });
    expect(scope.parseHashRoute('#/curriculum/nursing')).toEqual({ tab: 'research', sub: 'education', educationSub: 'nursing' });
    expect(scope.parseHashRoute('#/simulators')).toEqual({ tab: 'research', sub: 'education', educationSub: 'simulators' });
    expect(scope.parseHashRoute('#/protocols/references')).toEqual({ tab: 'research', sub: 'references' });
    expect(scope.parseHashRoute('#/protocols/calculators')).toEqual({ tab: 'research', sub: 'calculators' });
    expect(scope.parseHashRoute('#/calculators')).toEqual({ tab: 'research', sub: 'calculators' });
    expect(scope.parseHashRoute('#/protocols/education/icu')).toEqual({ tab: 'research', sub: 'education', educationSub: 'icu' });
    expect(scope.parseHashRoute('#/management/education/icu')).toEqual({ tab: 'research', sub: 'education', educationSub: 'icu' });
    expect(scope.parseHashRoute('#/protocols/sah')).toEqual({ tab: 'protocols', sub: 'ich' });
    expect(scope.parseHashRoute('#/protocols/tia')).toEqual({ tab: 'protocols', sub: 'ischemic' });
    expect(scope.parseHashRoute('#/protocols/cvt')).toEqual({ tab: 'protocols', sub: 'ischemic' });
    expect(scope.parseHashRoute('#/guidelines')).toEqual({ tab: 'research', sub: 'guidelines' });
    expect(scope.parseHashRoute('#/references')).toEqual({ tab: 'research', sub: 'references' });

    // Hash builders
    expect(scope.buildHashRoute('encounter')).toBe('#/encounter');
    expect(scope.buildHashRoute('trials')).toBe('#/trials');
    expect(scope.buildHashRoute('research', 'guidelines')).toBe('#/research/guidelines');
    expect(scope.buildHashRoute('research', 'references')).toBe('#/research/references');
    expect(scope.buildHashRoute('research', 'calculators')).toBe('#/research/calculators');
    expect(scope.buildHashRoute('research', 'education')).toBe('#/research/education');
    expect(scope.buildHashRoute('research', 'education', 'icu')).toBe('#/research/education/icu');
    expect(scope.buildHashRoute('education', 'onboarding')).toBe('#/research/education/onboarding');
  });

  it('R3: Keyboard shortcuts 1..4 align with primary tab order (1: Encounter, 2: Protocols, 3: Trials, 4: Research)', () => {
    expect(appJsxContent).toContain("'1': { tab: 'encounter' }");
    expect(appJsxContent).toContain("'2': { tab: 'protocols' }");
    expect(appJsxContent).toContain("'3': { tab: 'trials' }");
    expect(appJsxContent).toContain("'4': { tab: 'research' }");
    expect(appJsxContent).toContain("'5': { tab: 'research', subTab: 'education' }");
  });

  it('R4: Command palette commands route correctly to research tab subtabs', () => {
    expect(appJsxContent).toContain("navigateTo('research', { clearSearch: true, subTab: 'guidelines' })");
    expect(appJsxContent).toContain("navigateTo('research', { clearSearch: true, subTab: 'references' })");
    expect(appJsxContent).toContain("navigateTo('research', { clearSearch: true, subTab: 'education' })");
  });

  it('R5: Global search commands, evidence documents, and Atlas route to research references', () => {
    expect(appJsxContent).toContain("navigateTo('research', { clearSearch: true, subTab: 'references' });");
    expect(appJsxContent).toContain("tabCommand = lowerQuery.match(/^(?:tab|go|open)\\s+(encounter|protocols|trials|guidelines|research|references|education|library|management)$/i)");
  });
});
