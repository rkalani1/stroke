import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Helper to encode files to base64 data URLs
function getBase64DataUrl(filePath) {
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load cropped PNG assets
  const evdPhotoBase64 = getBase64DataUrl('assets/evd_photo_cropped.png');
  const snaccLogoBase64 = getBase64DataUrl('assets/snacc_logo_cropped.png');
  const icpWaveformBase64 = getBase64DataUrl('assets/icp_waveform_cropped.png');

  // ==========================================
  // 1. GENERATE EVD QUICK REFERENCE PDF
  // ==========================================
  const evdHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>EVD Quick Reference</title>
      <style>
        @page {
          size: letter;
          margin: 0.3in 0.3in 0.3in 0.3in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1e293b;
          font-size: 10pt;
          line-height: 1.35;
          background: white;
        }
        .container {
          border: 2px solid #1a365d;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .header {
          background-color: #1e3a8a;
          color: white;
          text-align: center;
          padding: 10px;
          font-size: 20pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #1a365d;
        }
        .section-title {
          background-color: #1d4ed8;
          color: white;
          text-align: center;
          padding: 6px;
          font-size: 12pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .section-title.purple { background-color: #7c3aed; }
        .section-title.green { background-color: #059669; }
        .section-title.red { background-color: #b91c1c; }
        
        .row-split {
          display: flex;
          border-bottom: 2px solid #1a365d;
        }
        .left-col {
          width: 48%;
          border-right: 2px solid #1a365d;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px;
          background-color: #f8fafc;
        }
        .left-col img {
          max-width: 95%;
          max-height: 250px;
          object-fit: contain;
          border-radius: 4px;
        }
        .right-col {
          width: 52%;
          display: flex;
          flex-direction: column;
        }
        .components-header {
          background-color: #2563eb;
          color: white;
          text-align: center;
          padding: 5px;
          font-weight: bold;
          font-size: 11pt;
          letter-spacing: 0.5px;
        }
        .components-body {
          padding: 10px 12px;
          font-size: 9pt;
          flex-grow: 1;
          border-bottom: 1.5px solid #1a365d;
          background-color: #f8fafc;
        }
        .components-body ol {
          margin: 0;
          padding-left: 15px;
        }
        .components-body li {
          margin-bottom: 6px;
        }
        .logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 6px;
          background: white;
          height: 55px;
        }
        .logo-container img {
          max-height: 45px;
          max-width: 90%;
          object-fit: contain;
        }
        
        .list-section {
          padding: 10px 15px;
          border-bottom: 2px solid #1a365d;
          background-color: #f0f7ff;
        }
        .list-section ul {
          margin: 0;
          padding-left: 20px;
        }
        .list-section li {
          margin-bottom: 4px;
        }
        
        .two-col-bullets {
          display: flex;
          border-bottom: 2px solid #1a365d;
        }
        .sub-col {
          width: 50%;
          padding: 10px 15px;
          background-color: #faf5ff; /* light purple background */
        }
        .sub-col:first-child {
          border-right: 2px solid #1a365d;
        }
        .sub-col-title {
          font-weight: bold;
          margin-bottom: 6px;
          font-size: 10pt;
          color: #5b21b6;
        }
        .sub-col ul {
          margin: 0;
          padding-left: 15px;
        }
        .sub-col li {
          margin-bottom: 4px;
          font-size: 9pt;
        }
        
        .basics-section {
          background-color: #f0fdf4; /* light green */
          padding: 10px 15px;
          border-bottom: 2px solid #1a365d;
        }
        .basics-section ul {
          margin: 0;
          padding-left: 20px;
        }
        .basics-section li {
          margin-bottom: 4px;
          font-size: 9.5pt;
        }
        
        .complications-section {
          padding: 10px 15px;
          background-color: #fef2f2; /* light red */
        }
        .complications-section ul {
          margin: 0;
          padding-left: 20px;
        }
        .complications-section li {
          margin-bottom: 4px;
          font-size: 9.5pt;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">EVD Quick Reference</div>
        
        <div class="row-split">
          <div class="left-col">
            <img src="${evdPhotoBase64}" alt="EVD Cylinder Setup" />
          </div>
          <div class="right-col">
            <div class="components-header">COMPONENTS</div>
            <div class="components-body">
              <ol>
                <li><strong>Drainage setting:</strong> Increments of 5 cmH₂O, higher = less drainage (higher resistance).</li>
                <li><strong>Drainage stopcock:</strong> 12 o'clock = clamp/closed, 3 o'clock = open to drain.</li>
                <li><strong>Transducer and zeroing stopcock:</strong> Controls baseline calibration.</li>
                <li><strong>Collection/drip chamber:</strong> Graduated cylinder measuring CSF volume.</li>
              </ol>
              <div style="font-size: 8.5pt; font-style: italic; margin-top: 6px; color: #475569;">
                *Red arrow indicates the direction of CSF flow.
              </div>
            </div>
            <div class="logo-container">
              <img src="${snaccLogoBase64}" alt="SNACC Logo" />
            </div>
          </div>
        </div>
        
        <div class="section-title">INDICATIONS</div>
        <div class="list-section">
          <ul>
            <li><strong>CSF Diversion</strong> for acute obstructive hydrocephalus (e.g., IVH, posterior fossa stroke).</li>
            <li><strong>ICP Monitoring</strong> in severe brain injury (GCS &le; 8).</li>
          </ul>
        </div>
        
        <div class="section-title purple">SIGNS OF HYDROCEPHALUS</div>
        <div class="two-col-bullets">
          <div class="sub-col">
            <div class="sub-col-title">Clinical Signs:</div>
            <ul>
              <li>Decline in Level of Consciousness (LOC) or progressive somnolence.</li>
              <li><strong>Parinaud's Syndrome:</strong> Upward gaze palsy (setting sun sign), retraction nystagmus on convergence, and pupillary light-near dissociation.</li>
            </ul>
          </div>
          <div class="sub-col">
            <div class="sub-col-title">Radiographic Signs (NCCT Head):</div>
            <ul>
              <li>Progressive enlargement of the cerebral ventricles.</li>
              <li>Temporal horn dilation (sensitive early sign of obstruction).</li>
              <li>High-risk factors: Intraventricular Hemorrhage (IVH) in 3rd or 4th ventricles, compression of 4th ventricle, or high volume blood (mGS &ge; 6).</li>
            </ul>
          </div>
        </div>
        
        <div class="section-title green">BASICS</div>
        <div class="basics-section">
          <ul>
            <li><strong>Leveling:</strong> Always align the zero level of the EVD scale/transducer to the external auditory meatus (EAM) / tragus.</li>
            <li><strong>Mobilization Clamping Rules:</strong> Always CLAMP the EVD before: turning the patient, adjusting HOB, or mobilizing the patient out of bed to prevent severe overdrainage or underdrainage.</li>
            <li><strong>Waveform Validity:</strong> ICP value and waveform morphology are valid only when the EVD is clamped.</li>
            <li><strong>CSF Drainage:</strong> CSF drainage is passive: occurs only when patient ICP exceeds EVD chamber height.</li>
            <li><strong>Normal CSF Flow Benchmarks:</strong> Normal CSF production is ~20 mL/hr (~500 mL/day). Drainage &gt;20 mL/hr should trigger immediate assessment for overdrainage or chamber level escalation.</li>
          </ul>
        </div>
        
        <div class="section-title red">COMPLICATIONS</div>
        <div class="complications-section">
          <ul>
            <li><strong>Overdrainage (&gt;20 mL/hr):</strong> Risk of subdural hematomas (bridging vein tearing), ventricular collapse (slit ventricles), or upward cerebellar herniation.</li>
            <li><strong>Underdrainage:</strong> Risk of worsening hydrocephalus, brain compression, or elevated ICP. Troubleshoot for system kinks, blood clots, air locks, or malpositioned stopcocks.</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(evdHtml);
  await page.pdf({
    path: 'documents/references/EVD Quick Reference.pdf',
    format: 'letter',
    printBackground: true,
    margin: { top: '0.3in', bottom: '0.3in', left: '0.3in', right: '0.3in' }
  });
  console.log('Generated documents/references/EVD Quick Reference.pdf');

  // ==========================================
  // 2. GENERATE ICP CRISIS QUICK REFERENCE PDF
  // ==========================================
  const icpHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>ICP Crisis/Herniation Quick Reference</title>
      <style>
        @page {
          size: letter;
          margin: 0.3in 0.3in 0.3in 0.3in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1e293b;
          font-size: 10pt;
          line-height: 1.35;
          background: white;
        }
        .container {
          border: 2px solid #b91c1c;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .header {
          background-color: #1e3a8a;
          color: white;
          text-align: center;
          padding: 10px;
          font-size: 20pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #b91c1c;
        }
        .section-title {
          background-color: #b91c1c;
          color: white;
          text-align: center;
          padding: 6px;
          font-size: 12pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .section-title.green { background-color: #059669; }
        .section-title.blue { background-color: #1d4ed8; }
        
        .list-section {
          padding: 12px 18px;
          border-bottom: 2px solid #b91c1c;
        }
        .list-section.peach {
          background-color: #fff7ed; /* light orange/peach */
        }
        .list-section.green-bg {
          background-color: #f0fdf4; /* light green */
        }
        .list-section ul {
          margin: 0;
          padding-left: 20px;
        }
        .list-section li {
          margin-bottom: 6px;
          font-size: 9.5pt;
        }
        .list-section ul ul {
          margin-top: 4px;
          padding-left: 20px;
        }
        .list-section ul ul li {
          margin-bottom: 4px;
          font-size: 9pt;
        }
        
        .waveform-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          background-color: #fafbfd;
        }
        .waveform-container {
          width: 100%;
          max-height: 180px;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: black;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
          border: 1px solid #e2e8f0;
        }
        .waveform-container img {
          max-width: 100%;
          max-height: 180px;
          object-fit: contain;
        }
        .waveform-bullets {
          width: 100%;
        }
        .waveform-bullets ul {
          margin: 0;
          padding-left: 20px;
        }
        .waveform-bullets li {
          margin-bottom: 4px;
          font-size: 9.5pt;
        }
        .escalation-pathway {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 10px;
        }
        .tier-card {
          flex: 1;
          padding: 6px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          text-align: center;
          font-size: 8pt;
          font-weight: bold;
          text-transform: uppercase;
          background-color: #f8fafc;
        }
        .tier-card.blue { border-color: #93c5fd; background-color: #eff6ff; color: #1e3a8a; }
        .tier-card.green { border-color: #6ee7b7; background-color: #ecfdf5; color: #064e3b; }
        .tier-card.amber { border-color: #fde047; background-color: #fef9c3; color: #713f12; }
        .tier-card.rose { border-color: #fca5a5; background-color: #fff1f2; color: #7f1d1d; }
        .tier-card span {
          display: block;
          font-weight: normal;
          text-transform: none;
          font-size: 7.5pt;
          color: #64748b;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">ICP Crisis/Herniation Quick Reference</div>
        
        <div class="section-title">CLINICAL SIGNS OF HERNIATION</div>
        <div class="list-section peach">
          <ul>
            <li><strong>Motor decline:</strong> Spontaneous GCS motor score decrease of &ge; 1 point.</li>
            <li><strong>Pupillary reactivity:</strong> Decrease in pupillary reactivity (Neurological Pupil Index, NPi &lt; 3).</li>
            <li><strong>Asymmetry:</strong> New pupillary asymmetry or unilateral dilation (ipsilateral mydriasis).</li>
            <li><strong>Focal deficit:</strong> New focal motor deficit or abnormal posturing (decorticate / decerebrate).</li>
            <li><strong>Cushing's Triad (Late Sign):</strong> Systolic hypertension, bradycardia, and irregular respirations. <strong style="color: #dc2626;">*Cushing's Triad is a LATE, pre-terminal sign of brainstem compression. Do not wait for its onset to initiate therapy.*</strong></li>
          </ul>
        </div>
        
        <div class="section-title green">MANAGEMENT</div>
        <div class="list-section green-bg">
          <ul>
            <li><strong>Hyperosmolar Therapies &amp; Hold Parameters:</strong>
              <ul>
                <li><strong>Mannitol 20% solution:</strong> 1 g/kg IV bolus over 20–30 min. Must use in-line 0.22-micron filter. <span style="color: #dc2626; font-weight: 600;">Hold if Serum Osmolarity &gt; 320 mOsm/kg OR Osmolar Gap &ge; 20 mOsm/kg.</span></li>
                <li><strong>Hypertonic Saline (23.4% NaCl):</strong> 30 mL IV bolus over 5–10 min. <strong style="color: #dc2626;">*CENTRAL LINE ACCESS ONLY*</strong> to prevent extravasation necrosis.</li>
                <li><strong>Hypertonic Saline (3% NaCl):</strong> 150–250 mL IV bolus over 15–20 min. Large peripheral IV access is acceptable for emergent rescue. <span style="color: #dc2626; font-weight: 600;">Hold HTS if Serum Sodium &gt; 155–160 mEq/L or Chloride &gt; 115–120 mEq/L.</span></li>
              </ul>
            </li>
            <li><strong>Hyperventilation:</strong> Use strictly as short-term bridge therapy (target PaCO₂ 30–35 mmHg). Avoid prolonged use due to ischemia risks.</li>
            <li><strong>Steroid Contraindication:</strong> Steroids are contraindicated for cytotoxic cerebral edema in stroke and raise infection risks.</li>
            <li><strong>Simplified Escalation Pathway:</strong>
              <div class="escalation-pathway">
                <div class="tier-card blue">Tier 1: Baseline<span>hob 30°, midline neck, sedation</span></div>
                <div class="tier-card green">Tier 2: Medical<span>mannitol 1g/kg, hts 3% bolus</span></div>
                <div class="tier-card amber">Tier 3: Bridging<span>hts 23.4%, hyperventilation</span></div>
                <div class="tier-card rose">Tier 4: Surgical<span>dhc / suboccipital decomp</span></div>
              </div>
            </li>
          </ul>
        </div>
        
        <div class="section-title blue">ICP WAVEFORM ANALYSIS</div>
        <div class="waveform-section">
          <div class="waveform-container">
            <img src="${icpWaveformBase64}" alt="ICP Waveform Graph" />
          </div>
          <div class="waveform-bullets">
            <ul>
              <li><strong>P1 (Percussion wave):</strong> Arterial pulsation.</li>
              <li><strong>P2 (Tidal wave):</strong> State of intracranial compliance (elastic reserve).</li>
              <li><strong>P3 (Dicrotic wave):</strong> Venous pulsations.</li>
              <li><strong>Compliance States:</strong>
                <ul>
                  <li><strong>Normal Compliance:</strong> P1 &gt; P2 &gt; P3 (elastic brain tissue easily cushions pulsations).</li>
                  <li><strong>Impaired Compliance / High ICP:</strong> P2 &gt; P1 (brain tissue reserve exhausted; high risk of herniation).</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(icpHtml);
  await page.pdf({
    path: 'documents/references/ICP Crisis Quick Reference.pdf',
    format: 'letter',
    printBackground: true,
    margin: { top: '0.3in', bottom: '0.3in', left: '0.3in', right: '0.3in' }
  });
  console.log('Generated documents/references/ICP Crisis Quick Reference.pdf');

  await browser.close();
}

main().catch(console.error);
