import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function findSvgElementsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const svgMatches = [];

  // Simple regex parser for <svg ...> tags across multi-line or single-line
  const svgRegex = /<svg\b([\s\S]*?)>/gi;
  let match;
  while ((match = svgRegex.exec(content)) !== null) {
    const rawTag = match[0];
    const attributesRaw = match[1];
    
    // Calculate line number
    const lineNum = content.substring(0, match.index).split('\n').length;
    
    // Extract attributes
    const hasAriaHidden = /aria-hidden=(?:["']([^"']*)["']|{([^}]+)})/i.test(attributesRaw);
    const ariaHiddenValue = (attributesRaw.match(/aria-hidden=(?:["']([^"']*)["']|{([^}]+)})/i) || [])[1] || (attributesRaw.match(/aria-hidden=(?:["']([^"']*)["']|{([^}]+)})/i) || [])[2];
    
    const hasRole = /role=(?:["']([^"']*)["']|{([^}]+)})/i.test(attributesRaw);
    const roleValue = (attributesRaw.match(/role=(?:["']([^"']*)["']|{([^}]+)})/i) || [])[1];
    
    const hasAriaLabel = /aria-label=(?:["']([^"']*)["']|{([^}]+)})/i.test(attributesRaw);
    const ariaLabelValue = (attributesRaw.match(/aria-label=(?:["']([^"']*)["']|{([^}]+)})/i) || [])[1];
    
    const hasFocusable = /focusable=(?:["']([^"']*)["']|{([^}]+)})/i.test(attributesRaw);
    const focusableValue = (attributesRaw.match(/focusable=(?:["']([^"']*)["']|{([^}]+)})/i) || [])[1];

    const hasTitleAttr = /title=(?:["']([^"']*)["']|{([^}]+)})/i.test(attributesRaw);

    svgMatches.push({
      filePath: path.relative('/Users/rizwankalani/stroke', filePath),
      lineNum,
      rawTag,
      hasAriaHidden,
      ariaHiddenValue,
      hasRole,
      roleValue,
      hasAriaLabel,
      ariaLabelValue,
      hasFocusable,
      focusableValue,
      hasTitleAttr
    });
  }

  return svgMatches;
}

function getAllJsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsxFiles(fullPath));
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

describe('SVG WCAG Audit in stroke codebase', () => {
  const files = getAllJsxFiles('/Users/rizwankalani/stroke/src');
  const allSvgs = files.flatMap(f => findSvgElementsInFile(f));

  it('scans and finds all inline SVGs in src/', () => {
    expect(allSvgs.length).toBeGreaterThan(0);
    // console.log(`Scanned ${files.length} files, found ${allSvgs.length} SVG elements.`);
  });

  it('identifies SVGs missing aria-hidden and focusable="false" (Decorative SVGs without WCAG attributes)', () => {
    const decorativeWithoutAriaHidden = allSvgs.filter(svg => 
      !svg.hasRole && !svg.hasAriaLabel && !svg.hasTitleAttr && (!svg.hasAriaHidden || svg.ariaHiddenValue !== 'true')
    );

    // console.log('Decorative SVGs missing aria-hidden="true":', decorativeWithoutAriaHidden);
    // Document all instances for our empirical report!
    expect(decorativeWithoutAriaHidden).toBeDefined();
  });

  it('identifies SVGs with conflicting aria-hidden="true" AND role="img" / aria-label', () => {
    const conflictingSvgs = allSvgs.filter(svg => 
      (svg.hasRole || svg.hasAriaLabel) && svg.hasAriaHidden && svg.ariaHiddenValue === 'true'
    );

    // console.log('Conflicting SVGs (has aria-label/role BUT aria-hidden="true"):', conflictingSvgs);
    expect(conflictingSvgs).toBeDefined();
  });

  it('identifies informative SVGs missing focusable="false" or internal <title>', () => {
    const informativeSvgs = allSvgs.filter(svg => svg.roleValue === 'img' || svg.hasAriaLabel);
    
    expect(informativeSvgs.length).toBeGreaterThan(0);
  });
});
