import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function findSvgElementsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const svgMatches = [];

  // Parse <svg ... > opening tags safely even if attribute values contain '>' inside quotes or braces
  const svgRegex = /<svg\b/gi;
  let match;
  while ((match = svgRegex.exec(content)) !== null) {
    const startIdx = match.index;
    let i = startIdx + 4; // after '<svg'
    let inQuote = null;
    let braceDepth = 0;
    let endIdx = -1;

    while (i < content.length) {
      const char = content[i];
      if (inQuote) {
        if (char === inQuote) {
          inQuote = null;
        }
      } else if (char === '"' || char === "'") {
        inQuote = char;
      } else if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        if (braceDepth > 0) braceDepth--;
      } else if (char === '>' && braceDepth === 0) {
        endIdx = i + 1;
        break;
      }
      i++;
    }

    if (endIdx === -1) continue;

    const rawTag = content.substring(startIdx, endIdx);
    const attributesRaw = content.substring(startIdx + 4, endIdx - 1);
    
    // Calculate line number
    const lineNum = content.substring(0, startIdx).split('\n').length;
    
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
      filePath: path.relative(process.cwd(), filePath),
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
  const files = getAllJsxFiles(path.resolve(process.cwd(), 'src'));
  const allSvgs = files.flatMap(f => findSvgElementsInFile(f));

  it('scans and finds all inline SVGs in src/', () => {
    expect(allSvgs.length).toBeGreaterThan(0);
  });

  it('identifies SVGs missing aria-hidden and focusable="false" (Decorative SVGs without WCAG attributes)', () => {
    const decorativeNonCompliant = allSvgs.filter(svg => 
      !svg.hasRole && !svg.hasAriaLabel && !svg.hasTitleAttr && (
        !svg.hasAriaHidden || svg.ariaHiddenValue !== 'true' ||
        !svg.hasFocusable || svg.focusableValue !== 'false'
      )
    );

    expect(decorativeNonCompliant).toHaveLength(0);
  });

  it('identifies SVGs with conflicting aria-hidden="true" AND role="img" / aria-label', () => {
    const conflictingSvgs = allSvgs.filter(svg => 
      (svg.hasRole || svg.hasAriaLabel) && svg.hasAriaHidden && svg.ariaHiddenValue === 'true'
    );

    expect(conflictingSvgs).toHaveLength(0);
  });

  it('identifies informative SVGs missing focusable="false" or internal <title>', () => {
    const nonCompliantInformativeSvgs = allSvgs.filter(svg => {
      const isInformative = svg.roleValue === 'img' || svg.hasAriaLabel || svg.hasRole;
      if (!isInformative) return false;

      const hasAccessibleLabel = svg.hasAriaLabel || svg.hasTitleAttr;
      const isFocusableFalse = svg.hasFocusable && svg.focusableValue === 'false';

      return !hasAccessibleLabel || !isFocusableFalse;
    });

    expect(nonCompliantInformativeSvgs).toHaveLength(0);
  });
});
