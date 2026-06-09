import fs from 'fs';
import path from 'path';

// Helper to encode files to base64 data URLs
function getBase64DataUrl(filePath) {
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function main() {
  const dissectionStrokeMechanismsBase64 = getBase64DataUrl('assets/dissection_stroke_mechanisms.png');
  
  // Read scripts/generate-pdfs.mjs content to extract cervicalHtml
  const fileContent = fs.readFileSync('scripts/generate-pdfs.mjs', 'utf8');
  
  // We can just construct it here or extract it
  // Let's extract the part between `const cervicalHtml = \`` and the closing backtick
  const startMarker = 'const cervicalHtml = `';
  const startIndex = fileContent.indexOf(startMarker) + startMarker.length;
  const endIndex = fileContent.indexOf('`;', startIndex);
  
  let cervicalHtml = fileContent.substring(startIndex, endIndex);
  
  // Replace base64 variable
  cervicalHtml = cervicalHtml.replace('${dissectionStrokeMechanismsBase64}', dissectionStrokeMechanismsBase64);
  
  // Save to scratch
  fs.writeFileSync('scratch/cervical_preview.html', cervicalHtml, 'utf8');
  console.log('Saved scratch/cervical_preview.html');
}

main().catch(console.error);
