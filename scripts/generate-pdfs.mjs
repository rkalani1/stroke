import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

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
            <svg viewBox="0 0 220 280" style="width: 100%; max-height: 250px;" xmlns="http://www.w3.org/2000/svg">
              <rect width="220" height="280" rx="8" fill="#f8fafc" />
              <rect x="25" y="10" width="10" height="260" fill="#94a3b8" rx="2" />
              <rect x="23" y="40" width="14" height="6" fill="#64748b" />
              <rect x="23" y="220" width="14" height="6" fill="#64748b" />
              <rect x="70" y="20" width="45" height="240" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" rx="4" />
              <line x1="70" y1="140" x2="115" y2="140" stroke="#ef4444" stroke-width="2" />
              <text x="50" y="144" fill="#ef4444" font-size="10" font-family="monospace" font-weight="bold">0 —</text>
              <line x1="80" y1="110" x2="110" y2="110" stroke="#475569" stroke-width="1" />
              <text x="58" y="113" fill="#475569" font-size="9" font-family="monospace">5 —</text>
              <line x1="80" y1="80" x2="110" y2="80" stroke="#475569" stroke-width="1" />
              <text x="52" y="83" fill="#475569" font-size="9" font-family="monospace">10 —</text>
              <line x1="80" y1="50" x2="110" y2="50" stroke="#475569" stroke-width="1" />
              <text x="52" y="53" fill="#475569" font-size="9" font-family="monospace">15 —</text>
              <line x1="80" y1="170" x2="110" y2="170" stroke="#475569" stroke-width="1" />
              <text x="53" y="173" fill="#475569" font-size="9" font-family="monospace">-5 —</text>
              <line x1="80" y1="200" x2="110" y2="200" stroke="#475569" stroke-width="1" />
              <text x="47" y="203" fill="#475569" font-size="9" font-family="monospace">-10 —</text>
              <rect x="135" y="30" width="30" height="150" rx="15" fill="none" stroke="#334155" stroke-width="2" />
              <line x1="135" y1="60" x2="145" y2="60" stroke="#94a3b8" stroke-width="1" />
              <line x1="135" y1="90" x2="150" y2="90" stroke="#94a3b8" stroke-width="1" />
              <line x1="135" y1="120" x2="145" y2="120" stroke="#94a3b8" stroke-width="1" />
              <line x1="135" y1="150" x2="150" y2="150" stroke="#94a3b8" stroke-width="1" />
              <path d="M 136,120 L 164,120 A 14,14 0 0,1 164,150 L 136,150 Z" fill="#fbbf24" fill-opacity="0.4" />
              <line x1="136" y1="120" x2="164" y2="120" stroke="#d97706" stroke-width="1" stroke-dasharray="2,2" />
              <rect x="67" y="74" width="51" height="12" rx="2" fill="#ef4444" fill-opacity="0.85" stroke="#dc2626" stroke-width="1" />
              <polygon points="118,80 128,76 128,84" fill="#ef4444" />
              <circle cx="150" cy="205" r="8" fill="#0d9488" />
              <line x1="150" y1="205" x2="162" y2="205" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
              <line x1="150" y1="205" x2="150" y2="195" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
              <path d="M 195,245 L 150,245 L 150,213" fill="none" stroke="#dc2626" stroke-width="2" />
              <path d="M 172,245 L 164,245" stroke="#ef4444" stroke-width="2" fill="none" />
              <polygon points="164,242 158,245 164,248" fill="#ef4444" />
              <path d="M 150,245 L 105,245" fill="none" stroke="#2563eb" stroke-width="2" />
              <rect x="92" y="238" width="14" height="14" rx="2" fill="#2563eb" stroke="#1d4ed8" stroke-width="1" />
              <circle cx="99" cy="245" r="3" fill="#ffffff" />
              <circle cx="92" cy="80" r="7" fill="#b91c1c" />
              <text x="92" y="83" fill="#ffffff" font-size="8.5" font-family="sans-serif" text-anchor="middle" font-weight="bold">1</text>
              <circle cx="138" cy="214" r="7" fill="#b91c1c" />
              <text x="138" y="217" fill="#ffffff" font-size="8.5" font-family="sans-serif" text-anchor="middle" font-weight="bold">2</text>
              <circle cx="82" cy="235" r="7" fill="#b91c1c" />
              <text x="82" y="238" fill="#ffffff" font-size="8.5" font-family="sans-serif" text-anchor="middle" font-weight="bold">3</text>
              <circle cx="176" cy="105" r="7" fill="#b91c1c" />
              <text x="176" y="108" fill="#ffffff" font-size="8.5" font-family="sans-serif" text-anchor="middle" font-weight="bold">4</text>
              <line x1="5" y1="140" x2="65" y2="140" stroke="#94a3b8" stroke-dasharray="3,3" stroke-width="1.5" />
            </svg>
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
              <svg viewBox="0 0 280 50" style="width: 100%; max-height: 45px;" xmlns="http://www.w3.org/2000/svg">
                <path d="M 10,25 C 10,15 18,8 28,8 C 38,8 46,15 46,25 C 46,35 38,42 28,42 C 18,42 10,35 10,25 Z" fill="none" stroke="#5B3B9C" stroke-width="1.5" />
                <circle cx="28" cy="25" r="4" fill="#18849E" />
                <line x1="28" y1="25" x2="20" y2="18" stroke="#5B3B9C" stroke-width="1.2" />
                <line x1="28" y1="25" x2="36" y2="18" stroke="#5B3B9C" stroke-width="1.2" />
                <line x1="28" y1="25" x2="20" y2="32" stroke="#5B3B9C" stroke-width="1.2" />
                <line x1="28" y1="25" x2="36" y2="32" stroke="#5B3B9C" stroke-width="1.2" />
                <circle cx="20" cy="18" r="2" fill="#5B3B9C" />
                <circle cx="36" cy="18" r="2" fill="#5B3B9C" />
                <circle cx="20" cy="32" r="2" fill="#5B3B9C" />
                <circle cx="36" cy="32" r="2" fill="#5B3B9C" />
                <text x="56" y="24" fill="#3A2368" font-size="16" font-family="'Outfit', sans-serif" font-weight="900" letter-spacing="1px">SNACC</text>
                <text x="56" y="38" fill="#636472" font-size="6.5" font-family="sans-serif" font-weight="600" letter-spacing="0.2px">SOCIETY FOR NEUROSCIENCE</text>
                <text x="56" y="45" fill="#636472" font-size="5.5" font-family="sans-serif" font-weight="400">IN ANESTHESIOLOGY AND CRITICAL CARE</text>
              </svg>
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
            <li><strong>Decompressive Surgery Selection Criteria:</strong>
              <ul>
                <li><strong>Malignant MCA (DHC):</strong> Age &le; 60 years, clinical decline (GCS decline &ge; 1, pupillary changes), CT/MRI infarction &ge; 50% MCA territory, within 48h of onset (DECIMAL/DESTINY trials).</li>
                <li><strong>Cerebellar Stroke (Suboccipital Decompression):</strong> Mass effect on brainstem, 4th ventricle effacement, cerebellar herniation, or hydrocephalus.</li>
              </ul>
            </li>
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
            <svg viewBox="0 0 420 150" style="width: 100%; max-height: 180px;" xmlns="http://www.w3.org/2000/svg">
              <line x1="10" y1="25" x2="410" y2="25" stroke="#1e293b" stroke-width="1" />
              <line x1="10" y1="50" x2="410" y2="50" stroke="#1e293b" stroke-width="1" />
              <line x1="10" y1="75" x2="410" y2="75" stroke="#1e293b" stroke-width="1" />
              <line x1="10" y1="100" x2="410" y2="100" stroke="#1e293b" stroke-width="1" />
              <line x1="10" y1="125" x2="410" y2="125" stroke="#1e293b" stroke-width="1" />
              <line x1="50" y1="10" x2="50" y2="140" stroke="#1e293b" stroke-width="1" />
              <line x1="100" y1="10" x2="100" y2="140" stroke="#1e293b" stroke-width="1" />
              <line x1="150" y1="10" x2="150" y2="140" stroke="#1e293b" stroke-width="1" />
              <line x1="200" y1="10" x2="200" y2="140" stroke="#1e293b" stroke-width="1" />
              <line x1="250" y1="10" x2="250" y2="140" stroke="#1e293b" stroke-width="1" />
              <line x1="300" y1="10" x2="300" y2="140" stroke="#1e293b" stroke-width="1" />
              <line x1="350" y1="10" x2="350" y2="140" stroke="#1e293b" stroke-width="1" />
              <text x="15" y="20" fill="#10b981" font-size="10" font-family="sans-serif" font-weight="bold">Normal Compliance (P1 &gt; P2 &gt; P3)</text>
              <path d="M 15,120 C 25,120 30,35 40,35 C 50,35 55,75 60,75 C 65,75 70,55 80,55 C 90,55 95,90 100,90 C 105,90 110,75 120,75 C 130,75 140,120 160,120" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
              <circle cx="40" cy="35" r="7" fill="#2563eb" />
              <text x="40" y="38" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="bold">P1</text>
              <circle cx="80" cy="55" r="7" fill="#2563eb" />
              <text x="80" y="58" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="bold">P2</text>
              <circle cx="120" cy="75" r="7" fill="#2563eb" />
              <text x="120" y="78" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="bold">P3</text>
              <line x1="200" y1="15" x2="200" y2="135" stroke="#334155" stroke-width="1.5" stroke-dasharray="3,3" />
              <text x="215" y="20" fill="#f43f5e" font-size="10" font-family="sans-serif" font-weight="bold">Impaired Compliance (P2 &gt; P1)</text>
              <path d="M 215,100 C 225,100 230,55 240,55 C 250,55 255,80 260,80 C 265,80 270,30 280,30 C 290,30 295,90 300,90 C 305,90 310,70 320,70 C 330,70 340,100 360,100" fill="none" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" />
              <circle cx="240" cy="55" r="7" fill="#2563eb" />
              <text x="240" y="58" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="bold">P1</text>
              <circle cx="280" cy="30" r="7" fill="#2563eb" />
              <text x="280" y="33" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="bold">P2</text>
              <circle cx="320" cy="70" r="7" fill="#2563eb" />
              <text x="320" y="73" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="bold">P3</text>
              <text x="215" y="130" fill="#94a3b8" font-size="8.5" font-family="sans-serif" font-style="italic">Tissue compliance exhausted; elevated baseline pressure</text>
            </svg>
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
