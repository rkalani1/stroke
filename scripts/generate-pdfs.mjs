import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Helper to encode files to base64 data URLs
function getBase64DataUrl(filePath) {
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function main() {
  const evdPhotoBase64 = getBase64DataUrl('assets/evd_photo_cropped.png');
  const herniationDiagramBase64 = getBase64DataUrl('assets/herniation_diagram.png');
  const dissectionStrokeMechanismsBase64 = getBase64DataUrl('assets/dissection_stroke_mechanisms.png');
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
      <title>External Ventricular Drain</title>
      <style>
        @page {
          size: letter;
          margin: 0.18in 0.18in 0.18in 0.18in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1e293b;
          font-size: 8.2pt;
          line-height: 1.25;
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
          padding: 6px;
          font-size: 14pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #1a365d;
        }
        .section-title {
          background-color: #1d4ed8;
          color: white;
          text-align: center;
          padding: 3px;
          font-size: 9pt;
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
          padding: 6px;
          background-color: #f8fafc;
        }
        .left-col img {
          max-width: 95%;
          max-height: 170px;
          object-fit: contain;
          border-radius: 4px;
        }
        .right-col {
          width: 52%;
          display: flex;
          flex-direction: column;
        }
        .basics-header {
          background-color: #059669;
          color: white;
          text-align: center;
          padding: 3px;
          font-weight: bold;
          font-size: 9pt;
          letter-spacing: 0.5px;
        }
        .basics-body {
          padding: 6px 10px;
          font-size: 8pt;
          flex-grow: 1;
          border-bottom: 1.5px solid #1a365d;
          background-color: #f0fdf4;
        }
        .basics-body ul {
          margin: 0;
          padding-left: 15px;
        }
        .basics-body li {
          margin-bottom: 3px;
        }
        .components-section {
          background-color: #f8fafc;
          padding: 10px 15px;
          border-bottom: 2px solid #1a365d;
        }
        .components-section ol {
          margin: 0;
          padding-left: 20px;
        }
        .components-section li {
          margin-bottom: 4px;
          font-size: 9pt;
        }
        .logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 4px;
          background: white;
          height: 42px;
        }
        
        .list-section {
          padding: 6px 10px;
          border-bottom: 2px solid #1a365d;
          background-color: #f0f7ff;
        }
        .list-section ul {
          margin: 0;
          padding-left: 20px;
        }
        .list-section li {
          margin-bottom: 2px;
        }
        
        .two-col-bullets {
          display: flex;
          border-bottom: 2px solid #1a365d;
        }
        .sub-col {
          width: 50%;
          padding: 6px 10px;
          background-color: #faf5ff; /* light purple background */
        }
        .sub-col:first-child {
          border-right: 2px solid #1a365d;
        }
        .sub-col-title {
          font-weight: bold;
          margin-bottom: 3px;
          font-size: 8.5pt;
          color: #5b21b6;
        }
        .sub-col ul {
          margin: 0;
          padding-left: 15px;
        }
        .sub-col li {
          margin-bottom: 2px;
          font-size: 8pt;
        }
        
        .basics-section {
          background-color: #f0fdf4; /* light green */
          padding: 6px 10px;
          border-bottom: 2px solid #1a365d;
        }
        .basics-section ul {
          margin: 0;
          padding-left: 20px;
        }
        .basics-section li {
          margin-bottom: 2px;
          font-size: 8.2pt;
        }
        
        .complications-section {
          padding: 6px 10px;
          background-color: #fef2f2; /* light red */
        }
        .complications-section ul {
          margin: 0;
          padding-left: 20px;
        }
        .complications-section li {
          margin-bottom: 2px;
          font-size: 8.2pt;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">External Ventricular Drain</div>
        
        <div class="row-split">
          <div class="left-col">
            <img src="${evdPhotoBase64}" alt="EVD Cylinder Setup" />
          </div>
          <div class="right-col">
            <div class="basics-header">BASICS</div>
            <div class="basics-body">
              <ul>
                <li><strong>Leveling:</strong> Always align the zero level of the EVD scale/transducer to the external auditory meatus (EAM) / tragus.</li>
                <li><strong>Mobilization Clamping Rules:</strong> Always CLAMP the EVD before: turning the patient, adjusting HOB, or mobilizing the patient out of bed to prevent severe overdrainage or underdrainage.</li>
                <li><strong>Waveform:</strong> ICP value and waveform morphology are valid only when the EVD is clamped.</li>
                <li><strong>CSF Drainage and Settings:</strong> CSF drainage is passive and occurs only when patient ICP exceeds the EVD chamber height setting. Setting the EVD higher (e.g., +15 vs. +5 cmH₂O) increases the pressure threshold required for CSF to flow, thereby reducing drainage volume for any given ICP.</li>
                <li><strong>Normal CSF Flow:</strong> Normal CSF production is ~20 mL/hr (~500 mL/day). Drainage &gt;20 mL/hr should trigger immediate assessment for overdrainage or chamber level escalation.</li>
                <li><strong>Weaning:</strong> Gradual escalation of drainage setting by 5 cmH₂O per day. After +20 cmH₂O, EVD should be clamped &amp; head CT obtained to evaluate ventricular caliber. Neurologic examination, CSF output, and ICP waveform should be assessed daily.</li>
              </ul>
            </div>
            <div class="logo-container">
              <svg viewBox="0 0 280 50" style="width: 100%; max-height: 32px;" xmlns="http://www.w3.org/2000/svg">
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
        
        <div class="section-title" style="background-color: #2563eb;">COMPONENTS</div>
        <div class="components-section">
          <ol>
            <li><strong>Drainage setting:</strong> CSF drainage is passive and occurs only when patient ICP exceeds the EVD chamber height setting. Setting the EVD higher (e.g., +15 vs. +5 cmH₂O) increases the pressure threshold required for CSF to flow, thereby reducing drainage volume for any given ICP.</li>
            <li><strong>Drainage stopcock:</strong> 12 o'clock = clamp/closed, 3 o'clock = open to drain.</li>
            <li><strong>Transducer and zeroing stopcock:</strong> Controls baseline calibration.</li>
            <li><strong>Collection/drip chamber:</strong> Graduated cylinder measuring CSF volume.</li>
          </ol>
        </div>

        <div class="section-title">INDICATIONS</div>
        <div class="list-section">
          <ul>
            <li><strong>CSF Diversion</strong> for acute obstructive hydrocephalus (e.g., IVH, posterior fossa stroke).</li>
            <li><strong>ICP Monitoring</strong> in severe brain injury (GCS &le; 8).</li>
          </ul>
        </div>
        
        <div class="section-title purple">SIGNS OF OBSTRUCTIVE HYDROCEPHALUS</div>
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
              <li>High-risk factors: Intraventricular Hemorrhage (IVH) in 3rd or 4th ventricles, compression of 4th ventricle, or high volume blood.</li>
            </ul>
          </div>
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
    path: 'documents/references/External Ventricular Drain.pdf',
    format: 'letter',
    printBackground: true,
    margin: { top: '0.18in', bottom: '0.18in', left: '0.18in', right: '0.18in' }
  });
  console.log('Generated documents/references/External Ventricular Drain.pdf');

  // ==========================================
  // 2. GENERATE INTRACRANIAL HYPERTENSION AND HERNIATION PDF
  // ==========================================
  const icpHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Intracranial Hypertension &amp; Herniation - Stroke</title>
      <style>
        @page {
          size: letter;
          margin: 0.11in 0.11in 0.11in 0.11in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1e293b;
          font-size: 7.8pt;
          line-height: 1.18;
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
          padding: 3px;
          font-size: 13.5pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #b91c1c;
        }
        .section-title {
          background-color: #b91c1c;
          color: white;
          text-align: center;
          padding: 2px;
          font-size: 8.8pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .section-title.green { background-color: #059669; }
        .section-title.blue { background-color: #1d4ed8; }
        
        .list-section {
          padding: 4px 8px;
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
          padding-left: 15px;
        }
        .list-section li {
          margin-bottom: 1px;
          font-size: 7.8pt;
        }
        .list-section ul ul {
          margin-top: 1px;
          padding-left: 15px;
        }
        .list-section ul ul li {
          margin-bottom: 1px;
          font-size: 7.4pt;
        }
        
        .herniation-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
          font-size: 7.2pt;
          line-height: 1.15;
        }
        .herniation-table th, .herniation-table td {
          border: 1px solid #fed7aa;
          padding: 1.5px 3px;
          text-align: left;
        }
        .herniation-table th {
          background-color: #ffedd5;
          font-weight: bold;
          color: #9a3412;
        }
        .herniation-table td strong {
          color: #b45309;
        }
        
        .perfusion-trap-box {
          border: 1px solid #dc2626;
          background-color: #fef2f2;
          color: #991b1b;
          border-radius: 4px;
          padding: 2px 4px;
          margin-top: 4px;
          font-size: 7.4pt;
          line-height: 1.2;
          width: 98%;
        }
        .perfusion-trap-box strong {
          color: #dc2626;
        }
        
        .waveform-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px;
          background-color: #fafbfd;
        }
        .waveform-row {
          display: flex;
          flex-direction: row;
          width: 100%;
          gap: 10px;
          align-items: center;
        }
        .waveform-container {
          width: 46%;
          background-color: black;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          padding: 2px 0;
        }
        .waveform-bullets {
          width: 54%;
        }
        .waveform-bullets ul {
          margin: 0;
          padding-left: 15px;
        }
        .waveform-bullets li {
          margin-bottom: 1px;
          font-size: 7.8pt;
        }

        .management-columns {
          display: flex;
          border-bottom: 2px solid #b91c1c;
          background-color: #f0fdf4; /* light green background */
        }
        .management-col {
          padding: 4px 8px;
          box-sizing: border-box;
        }
        .management-col.left {
          width: 58%;
          border-right: 2px solid #b91c1c;
        }
        .management-col.right {
          width: 42%;
        }
        .management-col .col-header {
          font-weight: bold;
          font-size: 8.2pt;
          color: #047857; /* green-700 */
          border-bottom: 1px solid #a7f3d0;
          margin-bottom: 4px;
          padding-bottom: 1.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .management-col ul {
          margin: 0;
          padding-left: 15px;
        }
        .management-col li {
          margin-bottom: 1px;
          font-size: 7.6pt;
        }
        .management-col ul ul {
          margin-top: 1px;
          padding-left: 12px;
        }
        .management-col ul ul li {
          margin-bottom: 1px;
          font-size: 7.2pt;
        }

      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Intracranial Hypertension &amp; Herniation - Stroke</div>
        
        <div class="section-title">CLINICAL SIGNS OF HERNIATION</div>
        <div class="list-section peach">
          <div style="display: flex; flex-direction: row; gap: 8px; align-items: center; justify-content: space-between;">
            <div style="width: 58%;">
              <ul>
                <li><strong>Motor decline:</strong> Spontaneous GCS motor score decrease of &ge; 1 point.</li>
                <li><strong>Pupillary reactivity:</strong> Decrease in pupillary reactivity (Neurological Pupil Index, NPi &lt; 3).</li>
                <li><strong>Asymmetry:</strong> New pupillary asymmetry or unilateral dilation (ipsilateral mydriasis).</li>
                <li><strong>Focal deficit:</strong> New focal motor deficit or abnormal posturing (decorticate / decerebrate).</li>
                <li><strong>Cushing's Triad (Late Sign):</strong> Systolic hypertension, bradycardia, and irregular respirations. <strong style="color: #dc2626;">*Cushing triad is a LATE sign of brainstem compression.*</strong></li>
              </ul>
            </div>
            <div style="width: 42%; display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding-right: 4px;">
              <img src="${herniationDiagramBase64}" style="max-width: 100%; max-height: 100px; object-fit: contain; border-radius: 4px; border: 1px solid #fed7aa; padding: 2px; background-color: white;" alt="Brain Herniation Diagram" />
            </div>
          </div>
          
          <table class="herniation-table">
            <thead>
              <tr>
                <th style="width: 20%;">Syndrome</th>
                <th style="width: 35%;">Anatomical Substrate</th>
                <th style="width: 45%;">Clinical Exam &amp; Diagnostic Trap</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Uncal</strong> (Lateral)</td>
                <td>Medial temporal lobe (uncus) pushed over tentorial edge</td>
                <td>Ipsilateral sluggish/dilated pupil (CN III compressed), contralateral hemiparesis. <br/><strong>Kernohan's Notch</strong> causes false-localizing ipsilateral hemiparesis.</td>
              </tr>
              <tr>
                <td><strong>Central</strong> (Axial)</td>
                <td>Downward diencephalic and midbrain displacement</td>
                <td>Progressive stupor, midpoint fixed pupils, decorticate to decerebrate posturing. <br/>Symmetrical signs often confused with metabolic encephalopathy.</td>
              </tr>
              <tr>
                <td><strong>Subfalcine</strong> (Cingulate)</td>
                <td>Cingulate gyrus displaced under the falx cerebri</td>
                <td>Often clinically silent, or presents with contralateral lower extremity weakness. <br/><strong>ACA compression</strong> causes frontal/leg territory infarction.</td>
              </tr>
              <tr>
                <td><strong>Tonsillar</strong> (Downward)</td>
                <td>Cerebellar tonsils forced through the foramen magnum</td>
                <td>Cushing's triad, flaccid quadriplegia, respiratory arrest.</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="section-title green">MANAGEMENT</div>
        <div class="management-columns">
          <div class="management-col left">
            <div class="col-header">General approach</div>
            <ul style="list-style-type: none; padding-left: 0; margin: 0;">
              <li style="margin-bottom: 5px;"><strong>Fundamental Measures</strong>
                <ul style="padding-left: 12px; margin-top: 1px;">
                  <li>Elevate HOB 30°; strict neutral midline neck alignment to preserve venous outflow.</li>
                  <li>Euvolemia (isotonic saline; avoid hypotonic D5W).</li>
                  <li>Temperature &lt; 38.0°C.</li>
                  <li>Normocapnia (pCO₂ 35–45 mmHg).</li>
                  <li>When ICP is monitored, CPP = MAP - ICP; many protocols target CPP around &gt;60 mmHg, individualized to disease context.</li>
                </ul>
              </li>
              <li><strong>Medical Interventions</strong>
                <ul style="padding-left: 12px; margin-top: 1px;">
                  <li style="margin-bottom: 2px;"><strong>Analgesia/sedation (fentanyl/propofol):</strong> Target RASS -1 to +1 to prevent coughing, agitation, or ventilator dyssynchrony.</li>
                  <li style="margin-bottom: 2px;"><strong>Mannitol 20%:</strong> 1 g/kg IV bolus over 20–30 min. Must use in-line filter. <span style="color: #dc2626; font-weight: 600;">Hold if Osm &gt; 320 or Gap &ge; 20.</span></li>
                  <li style="margin-bottom: 2px;"><strong>Hypertonic Saline (HTS):</strong> 3% (150–250 mL bolus) or 23.4% (30 mL rescue bolus; central access only). <span style="color: #dc2626; font-weight: 600;">Hold if Na &gt; 155 or Cl &gt; 115.</span></li>
                  <li style="margin-bottom: 2px;"><strong>Ventilation:</strong> Maintain normocapnia (PaCO2 35–45 mmHg). For impending herniation only, use brief controlled hyperventilation targeting about 30–35 mmHg while definitive therapy is initiated; avoid prophylactic or prolonged hypocapnia.</li>
                  <li><strong>Refractory ICP Elevation:</strong> High-dose barbiturate therapy (pentobarbital) titrated to burst suppression on EEG.</li>
                </ul>
              </li>
            </ul>
          </div>
          <div class="management-col right">
            <div class="col-header">CSF Diversion</div>
            <ul style="list-style-type: none; padding-left: 0; margin: 0 0 6px 0;">
              <li>EVD placement for acute hydrocephalus, intraventricular hemorrhage (IVH), or mass effect with ventriculomegaly.</li>
            </ul>
            <div class="col-header" style="margin-top: 6px;">Decompressive Surgery</div>
            <ul style="list-style-type: none; padding-left: 0; margin: 0;">
              <li style="margin-bottom: 4px;"><strong>Malignant MCA (DHC):</strong> Age &le; 60 years, clinical decline, infarct &ge; 50% MCA territory, within 48h (DECIMAL/DESTINY).</li>
              <li style="margin-bottom: 4px;"><strong>Cerebellar Stroke:</strong> Suboccipital craniectomy for brainstem compression, 4th ventricle effacement, or hydrocephalus.</li>
              <li><strong>Intracranial Hemorrhage (ICH):</strong> Cerebellar ICH with deterioration, brainstem compression, hydrocephalus, or large size requires urgent surgical evaluation. Supratentorial/lobar ICH evacuation or decompression is case-dependent rather than routine.</li>
            </ul>
          </div>
        </div>
        <div style="padding: 4px 8px; background-color: #f0fdf4; border-bottom: 2px solid #b91c1c;">
          <div style="border: 1px solid #dc2626; background-color: #fef2f2; color: #1e293b; border-radius: 4px; padding: 4px 6px; font-size: 7.6pt; line-height: 1.25;">
            <div style="margin-bottom: 4px;">
              <strong style="color: #dc2626; display: block; margin-bottom: 2px;">Management is not necessarily sequential</strong>
              For active herniation or rapid clinical/radiographic deterioration, immediately initiate medical interventions &amp; call Neurosurgery.
            </div>
            <div style="border-top: 1px solid rgba(220, 38, 38, 0.3); padding-top: 4px; margin-top: 4px; font-weight: 600; color: #b91c1c;">
              Corticosteroids are not indicated for cytotoxic edema in stroke and increase infection risk.
            </div>
          </div>
        </div>
        
        <div class="section-title blue">ICP WAVEFORM ANALYSIS</div>
        <div class="waveform-section">
          <div class="waveform-row">
            <div class="waveform-container">
              <svg viewBox="0 0 420 150" style="display: block; width: 100%; max-width: 440px; height: auto; margin: 0 auto;" xmlns="http://www.w3.org/2000/svg">
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
          
          <div class="perfusion-trap-box">
            <strong>CPP = MAP - ICP</strong><br/>
            In patients with intracranial hypertension or mass effect, cerebral perfusion is highly pressure dependent, and cautious BP lowering is recommended.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(icpHtml);
  await page.pdf({
    path: 'documents/references/Intracranial Hypertension & Herniation.pdf',
    format: 'letter',
    printBackground: true,
    margin: { top: '0.18in', bottom: '0.18in', left: '0.18in', right: '0.18in' }
  });
  console.log('Generated documents/references/Intracranial Hypertension & Herniation.pdf');

  // ==========================================
  // 3. GENERATE TOAST STROKE CLASSIFICATION PDF
  // ==========================================
  const toastHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Stroke Classification</title>
      <style>
        @page {
          size: letter;
          margin: 0.16in 0.16in 0.16in 0.16in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1a1b20;
          font-size: 8.6pt;
          line-height: 1.25;
          background: white;
          --ink:         #1a1b20;
          --ink-soft:    #3c3d47;
          --ink-mute:    #636472;
          --rule:        #e0dde4;
          --rule-soft:   #f0eef3;
          --fill:        #f3f1f6;
          --fill-soft:   #f8f7fa;
          --paper:       #ffffff;
          --purple:      #5B3B9C;
          --purple-deep: #3A2368;
          --purple-soft: #f1edfa;
          --purple-glow: rgba(91, 59, 156, 0.15);
          --teal:        #18849E;
          --teal-soft:   #e6f4f7;
          --teal-deep:   #0F586B;
          --teal-glow:   rgba(24, 132, 158, 0.15);
          --red:         #C62E2E;
          --red-soft:    #fcebeb;
          --red-deep:    #8E1E1E;
          --red-glow:    rgba(198, 46, 46, 0.15);
          --amber:       #D9860B;
          --amber-soft:  #fdf3e4;
          --amber-deep:  #945B06;
          --amber-glow:  rgba(217, 134, 11, 0.15);
          --slate:       #4A5A6D;
          --slate-soft:  #f0f2f5;
        }
        .container {
          border: 2px solid var(--purple);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 12px 18px;
          box-sizing: border-box;
        }
        h1 {
          font-size: 19pt;
          font-weight: 800;
          margin: 0 0 3px 0;
          text-align: center;
          background: linear-gradient(135deg, var(--purple-deep) 0%, var(--purple) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p.subtitle {
          font-size: 8.8pt;
          color: var(--ink-soft);
          margin: 0 0 10px 0;
          text-align: center;
          font-weight: 500;
        }
        .toast-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .toast-card {
          border: 1px solid var(--rule-soft);
          border-radius: 8px;
          padding: 10px 12px;
          background: var(--fill-soft);
        }
        .toast-card.primary {
          border-left: 4px solid var(--purple);
          background: linear-gradient(135deg, var(--purple-soft) 0%, #ffffff 100%);
        }
        .toast-card.secondary {
          border-left: 4px solid var(--teal);
          background: linear-gradient(135deg, var(--teal-soft) 0%, #ffffff 100%);
        }
        .toast-card.alert-orange {
          border-left: 4px solid var(--amber);
          background: linear-gradient(135deg, var(--amber-soft) 0%, #ffffff 100%);
        }
        .toast-card.alert-red {
          border-left: 4px solid var(--red);
          background: linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%);
        }
        .toast-card.neutral {
          border-left: 4px solid var(--slate);
          background: linear-gradient(135deg, var(--slate-soft) 0%, #ffffff 100%);
        }
        .toast-card h3 {
          font-size: 9.8pt;
          font-weight: 700;
          margin: 0 0 4px 0;
        }
        .toast-card.primary h3 { color: var(--purple-deep); }
        .toast-card.secondary h3 { color: var(--teal-deep); }
        .toast-card.alert-orange h3 { color: var(--amber-deep); }
        .toast-card.alert-red h3 { color: var(--red-deep); }
        .toast-card.neutral h3 { color: var(--slate); }
        .toast-card-list {
          margin: 4px 0 0 0;
          padding-left: 14px;
          font-size: 8.4pt;
          line-height: 1.4;
          color: var(--ink-soft);
        }
        .toast-card-list li {
          margin-bottom: 3px;
        }
        .workup-section {
          border-left: 4px solid var(--purple);
          background: var(--purple-soft);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 8.8pt;
          margin-bottom: 12px;
        }
        .workup-title {
          color: var(--purple-deep);
          text-transform: uppercase;
          font-size: 8.5pt;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
          display: block;
        }
        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px 12px;
          color: var(--ink-soft);
          line-height: 1.35;
          font-size: 7.8pt;
        }
        .checklist-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .checklist-dot {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 1.5px solid var(--purple);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--purple);
          font-size: 8px;
          font-weight: bold;
          flex-shrink: 0;
        }
        .ref-citation {
          margin-top: 5px;
          padding: 6px 10px;
          background: linear-gradient(135deg, var(--fill-soft) 0%, #ffffff 100%);
          border-left: 4px solid var(--purple);
          border-radius: 6px;
          font-size: 8.0pt;
          line-height: 1.3;
          color: var(--ink-mute);
        }
        .ref-citation a {
          color: var(--teal-deep);
          text-decoration: underline;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>TOAST Stroke Classification</h1>
        <p class="subtitle">Trial of Org 10172 in Acute Stroke Treatment (TOAST) diagnostic criteria for ischemic stroke etiology.</p>
        
        <svg viewBox="0 0 735 120" style="width: 100%; height: 120px; margin-bottom: 8px">
          <rect x="0" y="0" width="735" height="120" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" stroke-width="1"/>
          <rect x="267" y="10" width="200" height="30" rx="15" fill="var(--purple-deep)" />
          <text x="367" y="25" fill="white" font-size="8.5pt" font-family="Outfit" font-weight="700" text-anchor="middle" dominant-baseline="central">ACUTE ISCHEMIC STROKE</text>
          <path d="M 367 40 L 367 55 M 92 55 L 642 55 M 92 55 L 92 80 M 230 55 L 230 80 M 367 55 L 367 80 M 505 55 L 505 80 M 642 55 L 642 80" stroke="var(--purple)" stroke-width="2" fill="none" />
          <polygon points="92,85 88,77 96,77" fill="var(--purple)" />
          <polygon points="230,85 226,77 234,77" fill="var(--purple)" />
          <polygon points="367,85 363,77 371,77" fill="var(--purple)" />
          <polygon points="505,85 501,77 509,77" fill="var(--purple)" />
          <polygon points="642,85 638,77 646,77" fill="var(--purple)" />
          <rect x="32" y="85" width="120" height="25" rx="5" fill="var(--purple-soft)" stroke="var(--purple)" stroke-width="1"/>
          <text x="92" y="101" fill="var(--purple-deep)" font-size="8pt" font-family="Outfit" font-weight="700" text-anchor="middle">Large Artery (LAA)</text>
          <rect x="170" y="85" width="120" height="25" rx="5" fill="var(--teal-soft)" stroke="var(--teal)" stroke-width="1"/>
          <text x="230" y="101" fill="var(--teal-deep)" font-size="8pt" font-family="Outfit" font-weight="700" text-anchor="middle">Small Vessel (SVO)</text>
          <rect x="307" y="85" width="120" height="25" rx="5" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1"/>
          <text x="367" y="101" fill="var(--red-deep)" font-size="8pt" font-family="Outfit" font-weight="700" text-anchor="middle">Cardioembolic (CE)</text>
          <rect x="445" y="85" width="120" height="25" rx="5" fill="var(--slate-soft)" stroke="var(--slate)" stroke-width="1"/>
          <text x="505" y="101" fill="var(--slate)" font-size="8pt" font-family="Outfit" font-weight="700" text-anchor="middle">Other Det. (ODE)</text>
          <rect x="582" y="85" width="120" height="25" rx="5" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1"/>
          <text x="642" y="101" fill="var(--amber-deep)" font-size="7.5pt" font-family="Outfit" font-weight="700" text-anchor="middle">Undetermined Etiology</text>
        </svg>

        <div class="toast-grid">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="toast-card primary">
              <h3>1. Large-Artery Atherosclerosis (LAA)</h3>
              <ul class="toast-card-list">
                <li><strong>Clinical:</strong> Cortical signs (aphasia, neglect, gaze deviation) or brainstem/cerebellar syndrome.</li>
                <li><strong>Imaging:</strong> Cortical or subcortical/cerebellar/brainstem infarct matching the vascular territory.</li>
                <li><strong>Vascular:</strong> <strong>&gt; 50% stenosis</strong> or occlusion of the relevant major extracranial (carotid, vertebral) or intracranial artery.</li>
                <li><strong>Exclusion:</strong> Must exclude a high-risk cardioembolic source.</li>
              </ul>
            </div>
            
            <div class="toast-card secondary">
              <h3>2. Small-Vessel Occlusion (SVO / Lacune)</h3>
              <ul class="toast-card-list">
                <li><strong>Clinical:</strong> Classic lacunar syndrome (pure motor, pure sensory, sensorimotor, ataxic hemiparesis, clumsy hand) <strong>WITHOUT</strong> cortical signs.</li>
                <li><strong>Imaging:</strong> Normal scan or deep subcortical/brainstem lesion <strong>&le; 2.0 cm</strong>.</li>
                <li><strong>Vascular/Cardiac:</strong> Relevant artery must lack &gt;50% stenosis, and patient must lack high-risk cardioembolic sources.</li>
              </ul>
            </div>
            
            <div class="toast-card neutral">
              <h3>4. Other Determined Etiology (ODE)</h3>
              <ul class="toast-card-list">
                <li><strong>Clinical/Imaging:</strong> Infarction of any size with diagnostic proof of a rare/specific underlying mechanism:</li>
                <li>Arterial dissection (e.g. carotid or vertebral dissection)</li>
                <li>CNS vasculitis or systemic vasculopathy</li>
                <li>RCVS (Reversible Cerebral Vasoconstriction Syndrome)</li>
                <li>Moya-Moya disease, CADASIL, or Fibromuscular Displasia</li>
                <li>Prothrombotic/hypercoagulable state (APLS, cancer, DIC)</li>
              </ul>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="toast-card alert-red" style="padding-bottom: 6px;">
              <h3>3. Cardioembolism (CE)</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8.0pt; line-height: 1.3; color: var(--ink-soft); margin-top: 2px;">
                <div>
                  <strong style="color: var(--red-deep); font-size: 8.0pt; text-transform: uppercase; display: block; margin-bottom: 4px;">High-Risk Sources</strong>
                  • Atrial Fibrillation / Flutter<br/>
                  • Mechanical prosthetic valve<br/>
                  • Left atrial / LAA thrombus<br/>
                  • Recent anterior MI (&lt;3 mo)<br/>
                  • Dilated cardiomyopathy (EF&lt;30%)<br/>
                  • Infective endocarditis<br/>
                  • Sick sinus syndrome / LA myxoma
                </div>
                <div>
                  <strong style="color: var(--amber-deep); font-size: 8.0pt; text-transform: uppercase; display: block; margin-bottom: 4px;">Medium-Risk Sources</strong>
                  • PFO + Atrial Septal Aneurysm<br/>
                  • Mitral valve prolapse<br/>
                  • Mitral annulus calcification<br/>
                  • Bioprosthetic heart valve<br/>
                  • Calcific aortic stenosis<br/>
                  • LV dysfunction (EF 30–40%)<br/>
                  • LA spontaneous echo contrast
                </div>
              </div>
            </div>
            
            <div class="toast-card alert-orange">
              <h3>5. Undetermined Etiology</h3>
              <ul class="toast-card-list">
                <li><strong>Due to competing risks:</strong> &ge; 2 potential etiologies found (e.g., active AFib AND &ge;50% ipsilateral carotid stenosis).</li>
                <li><strong>Negative evaluation:</strong> Complete diagnostic workup identifies no clear source (Cryptogenic stroke).</li>
                <li><strong>Incomplete evaluation:</strong> Workup is unfinished (e.g., patient discharged/AMA before Echo or vascular imaging).</li>
              </ul>
              <div style="margin-top: 4px; border-top: 1px dashed rgba(217,134,11,0.3); padding-top: 3px; font-size: 8.2pt; line-height: 1.4; color: var(--ink-soft);">
                <strong style="color: var(--amber-deep);">ESUS Criteria:</strong> non-lacunar stroke, no relevant &gt;50% stenosis, no high-risk cardioembolic source, negative ECG/telemetry &ge;24 hours.
              </div>
            </div>
          </div>
        </div>

        <div class="workup-section">
          <strong class="workup-title">Required Diagnostic Workup to Complete TOAST Classification</strong>
          <div class="checklist-grid">
            <div class="checklist-item">
              <div class="checklist-dot">✓</div>
              <div><strong>Parenchymal:</strong> MRI Brain (DWI/ADC) preferred, or CT Head.</div>
            </div>
            <div class="checklist-item">
              <div class="checklist-dot">✓</div>
              <div><strong>Vascular:</strong> CTA or MRA Head & Neck (or Carotid Duplex + TCD).</div>
            </div>
            <div class="checklist-item">
              <div class="checklist-dot">✓</div>
              <div><strong>Rhythm:</strong> EKG + Continuous Telemetry &ge; 24h (or loop recorder).</div>
            </div>
            <div class="checklist-item">
              <div class="checklist-dot">✓</div>
              <div><strong>Cardiac:</strong> TTE required; consider TEE if cryptogenic / ESUS suspected.</div>
            </div>
          </div>
        </div>
        
        <div class="ref-citation">
          <strong>Original Study:</strong> Adams HP Jr, et al. TOAST. <em>Stroke</em>. 1993;24:35-41. | 
          <strong>AHA/ASA Guideline:</strong> Kleindorfer DO, et al. 2021 Stroke Prevention. <em>Stroke</em>. 2021;52:e364-e467.
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(toastHtml);
  await page.pdf({
    path: 'documents/references/TOAST Stroke Classification.pdf',
    format: 'letter',
    printBackground: true,
    margin: { top: '0.16in', bottom: '0.16in', left: '0.16in', right: '0.16in' }
  });
  console.log('Generated documents/references/TOAST Stroke Classification.pdf');

  // ==========================================
  // 4. GENERATE DAPT GUIDELINES PDF (LANDSCAPE)
  // ==========================================
  const daptHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>DAPT Guidelines</title>
      <style>
        @page {
          size: letter landscape;
          margin: 0.15in 0.15in 0.15in 0.15in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1a1b20;
          font-size: 7.8pt;
          line-height: 1.2;
          background: white;
          --ink:         #1a1b20;
          --ink-soft:    #3c3d47;
          --ink-mute:    #636472;
          --rule:        #e0dde4;
          --rule-soft:   #f0eef3;
          --fill:        #f3f1f6;
          --fill-soft:   #f8f7fa;
          --paper:       #ffffff;
          --purple:      #5B3B9C;
          --purple-deep: #3A2368;
          --purple-soft: #f1edfa;
          --purple-glow: rgba(91, 59, 156, 0.15);
          --teal:        #18849E;
          --teal-soft:   #e6f4f7;
          --teal-deep:   #0F586B;
          --teal-glow:   rgba(24, 132, 158, 0.15);
          --red:         #C62E2E;
          --red-soft:    #fcebeb;
          --red-deep:    #8E1E1E;
          --red-glow:    rgba(198, 46, 46, 0.15);
          --amber:       #D9860B;
          --amber-soft:  #fdf3e4;
          --amber-deep:  #945B06;
          --amber-glow:  rgba(217, 134, 11, 0.15);
          --slate:       #4A5A6D;
          --slate-soft:  #f0f2f5;
        }
        .container {
          border: 2px solid var(--purple);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 12px 18px;
          box-sizing: border-box;
        }
        h1 {
          font-size: 17pt;
          font-weight: 800;
          margin: 0 0 2px 0;
          text-align: center;
          background: linear-gradient(135deg, var(--purple-deep) 0%, var(--purple) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p.subtitle {
          font-size: 8.5pt;
          color: var(--ink-soft);
          margin: 0 0 4px 0;
          text-align: center;
          font-weight: 500;
        }
        table.card-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 6px 0;
          font-size: 7.8pt;
          background: var(--paper);
          border: 1px solid var(--rule-soft);
        }
        table.card-table thead th {
          background: linear-gradient(135deg, var(--purple-deep) 0%, var(--purple) 100%);
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 7.2pt;
          padding: 4px 6px;
          text-align: left;
        }
        table.card-table tbody td {
          padding: 4px 6px;
          border-bottom: 1px solid var(--rule-soft);
          vertical-align: top;
          line-height: 1.25;
        }
        table.card-table tbody tr:nth-child(even) td {
          background: var(--fill-soft);
        }
        .dapt-pearls-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 12px;
          margin-bottom: 6px;
        }
        .dapt-pearl-card {
          border-radius: 6px;
          padding: 6px 8px;
        }
        .dapt-pearl-card.purple {
          border: 1px solid var(--purple-soft);
          border-left: 4px solid var(--purple);
          background: linear-gradient(135deg, var(--purple-soft) 0%, #ffffff 100%);
        }
        .dapt-pearl-card.red {
          border: 1px solid var(--red-soft);
          border-left: 4px solid var(--red);
          background: linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%);
        }
        .ref-citation {
          margin-top: 0;
          padding: 4px 8px;
          background: linear-gradient(135deg, var(--fill-soft) 0%, #ffffff 100%);
          border-left: 4px solid var(--purple);
          border-radius: 4px;
          font-size: 7.0pt;
          line-height: 1.2;
          color: var(--ink-mute);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>DAPT for Non-Cardioembolic Ischemic Stroke</h1>
        
        <svg viewBox="0 0 735 240" style="width: 100%; height: 210px; margin-bottom: 6px">
          <rect x="0" y="0" width="735" height="240" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" stroke-width="1"/>
          <rect x="292" y="10" width="150" height="35" rx="6" fill="var(--purple-deep)" />
          <text x="367" y="23" fill="white" font-size="8.5pt" font-family="Outfit" font-weight="700" text-anchor="middle">ACUTE STROKE / TIA</text>
          <text x="367" y="36" fill="rgba(255,255,255,0.8)" font-size="7pt" font-family="IBM Plex Sans" text-anchor="middle">Non-Cardioembolic Onset</text>
          <path d="M 367 45 L 367 60 M 120 60 L 615 60 M 120 60 L 120 75 M 367 60 L 367 75 M 615 60 L 615 75" stroke="var(--purple)" stroke-width="1.5" fill="none"/>
          <rect x="35" y="75" width="170" height="40" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" stroke-width="1.5"/>
          <text x="120" y="87" fill="var(--teal-deep)" font-size="7.5pt" font-family="Outfit" font-weight="700" text-anchor="middle">Symptomatic Intracranial</text>
          <text x="120" y="97" fill="var(--teal-deep)" font-size="7.5pt" font-family="Outfit" font-weight="700" text-anchor="middle">Atherosclerotic Stenosis</text>
          <text x="120" y="108" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Sans" text-anchor="middle">70-99% Stenosis (SAMMPRIS)</text>
          <path d="M 120 115 L 120 140" stroke="var(--teal)" stroke-width="1.5" fill="none"/>
          <polygon points="120,145 117,137 123,137" fill="var(--teal)" />
          <rect x="35" y="145" width="170" height="40" rx="6" fill="white" stroke="var(--teal)" stroke-width="2" style="filter: drop-shadow(0 2px 4px var(--teal-glow))"/>
          <text x="120" y="159" fill="var(--teal-deep)" font-size="9pt" font-family="Outfit" font-weight="800" text-anchor="middle">ASA + CLOPIDOGREL</text>
          <text x="120" y="172" fill="var(--red-deep)" font-size="8pt" font-family="IBM Plex Mono" font-weight="700" text-anchor="middle">Duration: 90 Days</text>
          <rect x="252" y="75" width="230" height="42" rx="6" fill="var(--purple-soft)" stroke="var(--purple)" stroke-width="1.5"/>
          <text x="367" y="88" fill="var(--purple-deep)" font-size="8pt" font-family="Outfit" font-weight="700" text-anchor="middle">Minor Stroke (NIHSS&le;3) / TIA</text>
          <text x="367" y="99" fill="var(--purple-deep)" font-size="7pt" font-family="IBM Plex Sans" font-weight="700" text-anchor="middle">Start Clopidogrel + ASA (Day 1)</text>
          <text x="367" y="110" fill="var(--purple-deep)" font-size="6.5pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Send CYP2C19 Genotype on Admission</text>
          <path d="M 367 117 L 367 127 M 290 127 L 444 127 M 290 127 L 290 145 M 444 127 L 444 145" stroke="var(--purple)" stroke-width="1.5" fill="none"/>
          <rect x="215" y="145" width="140" height="42" rx="6" fill="white" stroke="var(--red)" stroke-width="1.5"/>
          <text x="285" y="157" fill="var(--red-deep)" font-size="7.5pt" font-family="Outfit" font-weight="700" text-anchor="middle">LOF Carrier (*2, *3)</text>
          <text x="285" y="169" fill="var(--ink-soft)" font-size="6.5pt" font-family="IBM Plex Sans" text-anchor="middle">Results Return (Days 1–3)</text>
          <text x="285" y="180" fill="var(--red-deep)" font-size="6.5pt" font-family="IBM Plex Sans" font-weight="700" text-anchor="middle">Switch to Ticagrelor</text>
          <path d="M 285 187 L 285 203" stroke="var(--red)" stroke-width="1.5" fill="none"/>
          <polygon points="285,203 282,195 288,195" fill="var(--red)" />
          <rect x="215" y="203" width="140" height="32" rx="4" fill="var(--red-soft)" stroke="var(--red)" stroke-width="2"/>
          <text x="285" y="213" fill="var(--red-deep)" font-size="7.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">ASA + TICAGRELOR</text>
          <text x="285" y="222" fill="var(--red-deep)" font-size="6pt" font-family="IBM Plex Sans" text-anchor="middle">Load 180mg STAT, then BID</text>
          <text x="285" y="231" fill="var(--red-deep)" font-size="6pt" font-family="IBM Plex Mono" font-weight="700" text-anchor="middle">Complete 21d DAPT</text>
          <rect x="375" y="145" width="140" height="42" rx="6" fill="white" stroke="var(--purple)" stroke-width="1.5"/>
          <text x="445" y="157" fill="var(--purple-deep)" font-size="7.5pt" font-family="Outfit" font-weight="700" text-anchor="middle">Normal Metabolizer</text>
          <text x="445" y="169" fill="var(--ink-soft)" font-size="6.5pt" font-family="IBM Plex Sans" text-anchor="middle">Results Return (Days 1–3)</text>
          <text x="445" y="180" fill="var(--purple-deep)" font-size="6.5pt" font-family="IBM Plex Sans" font-weight="700" text-anchor="middle">Continue Clopidogrel</text>
          <path d="M 445 187 L 445 203" stroke="var(--purple)" stroke-width="1.5" fill="none"/>
          <polygon points="445,203 442,195 448,195" fill="var(--purple)" />
          <rect x="375" y="203" width="140" height="32" rx="4" fill="var(--purple-soft)" stroke="var(--purple)" stroke-width="2"/>
          <text x="445" y="213" fill="var(--purple-deep)" font-size="7.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">ASA + CLOPIDOGREL</text>
          <text x="445" y="222" fill="var(--purple-deep)" font-size="6pt" font-family="IBM Plex Sans" text-anchor="middle">Continue Clopidogrel 75mg qD</text>
          <text x="445" y="231" fill="var(--purple-deep)" font-size="6pt" font-family="IBM Plex Mono" font-weight="700" text-anchor="middle">Complete 21d DAPT</text>
          <rect x="530" y="75" width="170" height="40" rx="6" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1.5"/>
          <text x="615" y="90" fill="var(--amber-deep)" font-size="8pt" font-family="Outfit" font-weight="700" text-anchor="middle">Mild-Mod Stroke (NIHSS&le;5)</text>
          <text x="615" y="102" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Sans" text-anchor="middle">Or High-Risk TIA (THALES)</text>
          <path d="M 615 115 L 615 140" stroke="var(--amber)" stroke-width="1.5" fill="none"/>
          <polygon points="615,145 612,137 618,137" fill="var(--amber)" />
          <rect x="530" y="145" width="170" height="40" rx="6" fill="white" stroke="var(--amber)" stroke-width="2" style="filter: drop-shadow(0 2px 4px var(--amber-glow))"/>
          <text x="615" y="159" fill="var(--amber-deep)" font-size="9pt" font-family="Outfit" font-weight="800" text-anchor="middle">ASA + TICAGRELOR</text>
          <text x="615" y="172" fill="var(--red-deep)" font-size="8pt" font-family="IBM Plex Mono" font-weight="700" text-anchor="middle">Duration: 30 Days</text>
        </svg>

        <table class="card-table">
          <thead>
            <tr>
              <th style="width: 22%;">Trial</th>
              <th style="width: 22%;">Target Population</th>
              <th style="width: 22%;">Loading Dose (Day 1)</th>
              <th style="width: 20%;">DAPT Duration</th>
              <th style="width: 14%;">Post-DAPT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 700;">POINT Trial</td>
              <td>NIHSS &le;3 or ABCD² &ge;4. **Within 12 hours** of onset.</td>
              <td><strong>Clopidogrel 600 mg</strong> +<br/>Aspirin 162–325 mg</td>
              <td><strong>Clopidogrel 75mg qD</strong> +<br/>Aspirin 81mg qD for <strong>21 days</strong></td>
              <td>Aspirin 81mg</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">CHANCE / INSPIRES</td>
              <td><strong>CHANCE:</strong> NIHSS&le;3, ABCD²&ge;4 within 24h.<br/><strong>INSPIRES:</strong> NIHSS&le;5, ABCD²&ge;4, &ge;50% stenosis within 72h.</td>
              <td><strong>Clopidogrel 300 mg</strong> +<br/>Aspirin 75–300 mg</td>
              <td><strong>Clopidogrel 75mg qD</strong> +<br/>Aspirin 75-100mg for <strong>21 days</strong></td>
              <td>Clopidogrel 75mg (to Day 90)</td>
            </tr>
            <tr style="background: var(--purple-soft);">
              <td style="font-weight: 700; color: var(--purple-deep);">CHANCE-2 Trial</td>
              <td>CYP2C19 LOF carrier (*2/*3) + Minor stroke/TIA. **Within 24h**.</td>
              <td><strong>Ticagrelor 180 mg</strong> +<br/>Aspirin 75–300 mg</td>
              <td><strong>Ticagrelor 90mg BID</strong> +<br/>Aspirin 75-100mg for <strong>21 days</strong></td>
              <td>Ticagrelor 90mg BID (to Day 90)</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">THALES Trial</td>
              <td>NIHSS &le;5 or high-risk TIA (ABCD² &ge;6 or symptomatic stenosis) within 24h.</td>
              <td><strong>Ticagrelor 180 mg</strong> +<br/>Aspirin 300–325 mg</td>
              <td><strong>Ticagrelor 90mg BID</strong> +<br/>Aspirin 75-100mg for <strong>30 days</strong></td>
              <td>Aspirin 81mg</td>
            </tr>
            <tr style="background: var(--teal-soft);">
              <td style="font-weight: 700; color: var(--teal-deep);">SAMMPRIS Trial</td>
              <td>Severe symptomatic atherosclerotic stenosis (70-99%) of a major intracranial artery.</td>
              <td><strong>Aspirin 325 mg</strong> +<br/><strong>Clopidogrel 75 mg</strong> (no load)</td>
              <td><strong>Clopidogrel 75mg qD</strong> +<br/>Aspirin for <strong>90 days</strong></td>
              <td>Aspirin</td>
            </tr>
          </tbody>
        </table>

        <div class="dapt-pearls-grid">
          <div class="dapt-pearl-card purple">
            <strong style="color: var(--purple-deep); font-size: 8.2pt; display: block; margin-bottom: 3px;">CYP2C19 Genotyping & Clopidogrel Resistance</strong>
            <p style="font-size: 7.6pt; color: var(--ink-soft); margin: 0; line-height: 1.35;">
              • CYP2C19 LOF alleles reduce clopidogrel activation. When rapid genotype results are available, LOF status can guide ticagrelor-vs-clopidogrel selection; CHANCE-2 evidence applies to LOF carriers rather than mandating universal testing.
            </p>
          </div>

          <div class="dapt-pearl-card red">
            <strong style="color: var(--red-deep); font-size: 8.2pt; display: block; margin-bottom: 3px;">Safety</strong>
            <p style="font-size: 7.4pt; color: var(--ink-soft); margin: 0; line-height: 1.35;">
              • **Bleeding vs. Benefit**: For minor stroke/high-risk TIA, most DAPT benefit occurs in the first 21 days; extend longer only for selected trial-matched indications such as severe symptomatic intracranial stenosis.<br/>
              • **Post-Lytic / EVT Policy**: After IV alteplase or TNK, avoid antithrombotics for the first 24h until follow-up imaging excludes hemorrhage. EVT alone is not a blanket DAPT contraindication; stenting/angioplasty plans and hemorrhage risk drive the decision.
            </p>
          </div>
        </div>
        
        <div class="ref-citation">
          <strong>POINT:</strong> Johnston SC et al. <em>N Engl J Med</em>. 2018;379:215-225. | <strong>CHANCE:</strong> Wang Y et al. <em>N Engl J Med</em>. 2013;369:11-19. | 
          <strong>CHANCE-2:</strong> Wang Y et al. <em>N Engl J Med</em>. 2021;385:2520-2530. | <strong>INSPIRES:</strong> Gao Y et al. <em>N Engl J Med</em>. 2023;389:2413-2424. | 
          <strong>THALES:</strong> Johnston SC et al. <em>N Engl J Med</em>. 2020;383:207-217. | <strong>SAMMPRIS:</strong> Chimowitz MI et al. <em>N Engl J Med</em>. 2011;365:993-1003.
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(daptHtml);
  await page.pdf({
    path: 'documents/references/DAPT Guidelines.pdf',
    format: 'letter',
    landscape: true,
    printBackground: true,
    margin: { top: '0.15in', bottom: '0.15in', left: '0.15in', right: '0.15in' }
  });
  console.log('Generated documents/references/DAPT Guidelines.pdf');

  // ==========================================
  // 5. GENERATE MALIGNANT INFARCTION PDF
  // ==========================================
  const malignantHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Malignant Infarction</title>
      <style>
        @page {
          size: letter;
          margin: 0.15in 0.15in 0.15in 0.15in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1a1b20;
          font-size: 8.2pt;
          line-height: 1.22;
          background: white;
          --ink:         #1a1b20;
          --ink-soft:    #3c3d47;
          --ink-mute:    #636472;
          --rule:        #e0dde4;
          --rule-soft:   #f0eef3;
          --fill:        #f3f1f6;
          --fill-soft:   #f8f7fa;
          --paper:       #ffffff;
          --purple:      #5B3B9C;
          --purple-deep: #3A2368;
          --purple-soft: #f1edfa;
          --purple-glow: rgba(91, 59, 156, 0.15);
          --teal:        #18849E;
          --teal-soft:   #e6f4f7;
          --teal-deep:   #0F586B;
          --teal-glow:   rgba(24, 132, 158, 0.15);
          --red:         #C62E2E;
          --red-soft:    #fcebeb;
          --red-deep:    #8E1E1E;
          --red-glow:    rgba(198, 46, 46, 0.15);
          --amber:       #D9860B;
          --amber-soft:  #fdf3e4;
          --amber-deep:  #945B06;
          --amber-glow:  rgba(217, 134, 11, 0.15);
          --slate:       #4A5A6D;
          --slate-soft:  #f0f2f5;
        }
        .container {
          border: 2px solid var(--red);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 12px 18px;
          box-sizing: border-box;
        }
        h1 {
          font-size: 19pt;
          font-weight: 800;
          margin: 0 0 3px 0;
          text-align: center;
          background: linear-gradient(135deg, var(--red-deep) 0%, var(--red) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p.subtitle {
          font-size: 8.8pt;
          color: var(--ink-soft);
          margin: 0 0 8px 0;
          text-align: center;
          font-weight: 500;
        }
        .selection-criteria-box {
          border: 1.5px solid var(--red);
          border-radius: 8px;
          padding: 8px 12px;
          background: linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%);
          margin-bottom: 8px;
        }
        .selection-criteria-box strong.title {
          color: var(--red-deep);
          font-size: 11pt;
          display: block;
          margin-bottom: 4px;
        }
        .selection-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 7.8pt;
          line-height: 1.35;
          color: var(--ink-soft);
        }
        .outcome-chart-container {
          background: white;
          border: 1px solid var(--rule-soft);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 8px;
          text-align: left;
        }
        .outcome-row {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
        }
        .outcome-label {
          width: 155px;
          font-size: 8.2pt;
          font-weight: 700;
          color: var(--ink-soft);
          line-height: 1.1;
        }
        .stacked-bar-container {
          flex: 1;
          height: 18px;
          display: flex;
          border-radius: 4px;
          overflow: hidden;
          background: #f1f2f6;
        }
        .bar-segment {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: monospace;
          font-size: 7.8pt;
          font-weight: 700;
        }
        .bar-mrs-03 { background: #2E7D32; }
        .bar-mrs-4  { background: #F57C00; }
        .bar-mrs-5  { background: #E64A19; }
        .bar-mrs-6  { background: #212121; }
        .chart-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px 14px;
          margin-top: 6px;
          font-size: 7.2pt;
          color: var(--ink-soft);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 1.5px;
          flex-shrink: 0;
        }
        .icu-care-box {
          border: 1px solid var(--rule-soft);
          border-radius: 8px;
          padding: 8px 12px;
          background: white;
          margin-bottom: 8px;
        }
        .icu-care-box strong.title {
          color: var(--purple-deep);
          font-size: 11pt;
          display: block;
          margin-bottom: 4px;
        }
        .icu-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7.8pt;
          line-height: 1.35;
          color: var(--ink);
        }
        .icu-table tr {
          border-bottom: 1px solid var(--rule-soft);
        }
        .icu-table tr:last-child {
          border-bottom: none;
        }
        .icu-table td {
          padding: 4px 0;
        }
        .ref-citation {
          margin-top: 0;
          padding: 4px 8px;
          background: linear-gradient(135deg, var(--fill-soft) 0%, #ffffff 100%);
          border-left: 4px solid var(--red);
          border-radius: 4px;
          font-size: 7.0pt;
          line-height: 1.25;
          color: var(--ink-mute);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Malignant Infarction</h1>
        <p class="subtitle">Decompressive hemicraniectomy selection criteria, evidence, and supportive ICU care.</p>
        
        <svg viewBox="0 0 735 65" style="width: 100%; height: 65px; margin-bottom: 8px">
          <polygon points="0,0 230,0 242,32 230,65 0,65" fill="var(--teal-soft)" stroke="var(--teal)" stroke-width="1.5" />
          <text x="110" y="28" fill="var(--teal-deep)" font-size="8.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">STAGE 1: 0 - 24 HOURS</text>
          <text x="110" y="44" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Sans" text-anchor="middle">Baseline Core & Serial NIHSS Checks</text>
          <polygon points="233,0 470,0 482,32 470,65 233,65 245,32" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1.5" />
          <text x="352" y="28" fill="var(--amber-deep)" font-size="8.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">STAGE 2: 24 - 48 HOURS</text>
          <text x="352" y="44" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Sans" text-anchor="middle">Peak Edema Phase & Serial CT Scan</text>
          <polygon points="473,0 735,0 735,65 473,65 485,32" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.5" />
          <text x="609" y="28" fill="var(--red-deep)" font-size="8.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">STAGE 3: &lt; 48H SURGERY</text>
          <text x="609" y="44" fill="var(--red-deep)" font-size="7pt" font-family="IBM Plex Sans" font-weight="600" text-anchor="middle">Decompressive Hemicraniectomy</text>
        </svg>

        <div class="selection-criteria-box">
          <strong class="title">1. Decompressive Hemicraniectomy Selection Criteria</strong>
          <div class="selection-grid">
            <div>
              <strong>Clinical Deficit Severity:</strong><br/>
              • NIHSS <strong>&gt; 15</strong> (non-dominant hemisphere)<br/>
              • NIHSS <strong>&gt; 20</strong> (dominant hemisphere)<br/>
              • AND decrease in level of consciousness (NIHSS Item 1a score <strong>&ge; 1</strong> / obtunded or stuporous)<br/>
              • **Timing**: Surgery performed <strong>within 48 hours</strong> of onset.
            </div>
            <div>
              <strong>Radiographic Markers:</strong><br/>
              • Infarction of <strong>&ge; 50%</strong> of the MCA territory (CT/MRI)<br/>
              • DWI core volume <strong>&gt; 82 mL</strong> within 6 hours<br/>
              • DWI core volume <strong>&gt; 145 mL</strong> within 14 hours<br/>
              • Midline shift or mass effect on repeat imaging<br/>
              • **Surgical Spec**: Bone flap diameter <strong>&ge; 12–15 cm</strong> with duraplasty.
            </div>
          </div>
        </div>

        <div class="outcome-chart-container">
          <strong style="color: var(--purple-deep); font-size: 11pt; display: block; margin-bottom: 4px">2. Surgical Outcomes & Evidence (By Age Group)</strong>
          
          <div class="outcome-row">
            <div class="outcome-label">
              <strong>Age &lt; 60 Years</strong> (DECIMAL/DESTINY)<br/>
              <span style="font-size: 6.5pt; font-weight: normal; color: var(--ink-mute)">Surgery (22% Mort) vs Med (71% Mort)</span>
            </div>
            <div class="stacked-bar-container">
              <div class="bar-segment bar-mrs-03" style="width: 43%">43%</div>
              <div class="bar-segment bar-mrs-4" style="width: 32%">32%</div>
              <div class="bar-segment bar-mrs-5" style="width: 3%">3%</div>
              <div class="bar-segment bar-mrs-6" style="width: 22%">22%</div>
            </div>
          </div>

          <div class="outcome-row">
            <div class="outcome-label" style="opacity: 0.7; font-weight: normal; font-size: 7.2pt">
              Age &lt; 60 Medical Control
            </div>
            <div class="stacked-bar-container" style="opacity: 0.7">
              <div class="bar-segment bar-mrs-03" style="width: 21%">21%</div>
              <div class="bar-segment bar-mrs-4" style="width: 3%">3%</div>
              <div class="bar-segment bar-mrs-5" style="width: 5%">5%</div>
              <div class="bar-segment bar-mrs-6" style="width: 71%">71%</div>
            </div>
          </div>

          <div class="outcome-row" style="margin-top: 6px">
            <div class="outcome-label">
              <strong>Age &ge; 60 Years</strong> (DESTINY II)<br/>
              <span style="font-size: 6.5pt; font-weight: normal; color: var(--ink-mute)">Surgery (33% Mort) vs Med (70% Mort)</span>
            </div>
            <div class="stacked-bar-container">
              <div class="bar-segment bar-mrs-03" style="width: 7%">7%</div>
              <div class="bar-segment bar-mrs-4" style="width: 31%">31%</div>
              <div class="bar-segment bar-mrs-5" style="width: 29%">29%</div>
              <div class="bar-segment bar-mrs-6" style="width: 33%">33%</div>
            </div>
          </div>

          <div class="outcome-row">
            <div class="outcome-label" style="opacity: 0.7; font-weight: normal; font-size: 7.2pt">
              Age &ge; 60 Medical Control
            </div>
            <div class="stacked-bar-container" style="opacity: 0.7">
              <div class="bar-segment bar-mrs-03" style="width: 3%">3%</div>
              <div class="bar-segment bar-mrs-4" style="width: 15%">15%</div>
              <div class="bar-segment bar-mrs-5" style="width: 12%">12%</div>
              <div class="bar-segment bar-mrs-6" style="width: 70%">70%</div>
            </div>
          </div>

          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-dot bar-mrs-03"></div>
              <div>mRS 0–2: Functional independence; mRS 3: walks unassisted but needs some help</div>
            </div>
            <div class="legend-item">
              <div class="legend-dot bar-mrs-4"></div>
              <div>mRS 4: Moderately severe; unable to walk or attend bodily needs unassisted</div>
            </div>
            <div class="legend-item">
              <div class="legend-dot bar-mrs-5"></div>
              <div>mRS 5: Severe disability; bedridden / constant care</div>
            </div>
            <div class="legend-item">
              <div class="legend-dot bar-mrs-6"></div>
              <div>mRS 6: Death</div>
            </div>
          </div>
          
          <div style="font-size: 7pt; line-height: 1.25; margin-top: 4px; color: var(--ink-soft); text-align: center; border-top: 1px dashed var(--rule); padding-top: 3px">
            • **Age &lt; 60**: NNT = 2 for survival, NNT = 4 for survival with mRS &le;3 (able to walk unassisted). | • **Age &ge; 60**: NNT = 3 for survival, NNT = 25 for mRS &le;3. *Goals-of-care discussion critical.
          </div>
        </div>

        <div class="icu-care-box">
          <strong class="title">3. Supportive ICU Care & Medical Management</strong>
          <table class="icu-table">
            <tbody>
              <tr>
                <td style="font-weight: 700; width: 22%; color: var(--purple-deep); vertical-align: top">Positioning</td>
                <td style="color: var(--ink-soft)">Elevate HOB 30 degrees; maintain straight head/neck alignment to maximize venous outflow.</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--purple-deep); vertical-align: top">Fluids</td>
                <td style="color: var(--ink-soft)">Maintain euvolemia with isotonic fluids. <strong>Avoid hypotonic fluids</strong> (e.g. D5W, 0.45% NS) that can worsen edema; balanced crystalloids such as LR should follow local neuro-ICU protocol.</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--purple-deep); vertical-align: top">Osmotherapy</td>
                <td style="color: var(--ink-soft)">Consider <strong>targeted PRN</strong> hyperosmolar agents (HTS 3% or Mannitol) for acute decline or severe mass effect. <em>Prophylactic osmotherapy is not recommended.</em></td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--purple-deep); vertical-align: top">Metabolic</td>
                <td style="color: var(--ink-soft)">Target normothermia (&lt;37.8&deg;C). Target normocapnia (PaCO2 35-45 mmHg); avoid hypoventilation/hypercapnia.</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--purple-deep); vertical-align: top">Steroids</td>
                <td style="color: var(--ink-soft)"><strong style="color: var(--red)">Class III (Harmful)</strong>: Corticosteroids are NOT recommended for reducing cerebral edema in acute ischemic stroke.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ref-citation">
          <strong>DECIMAL:</strong> Vahedi K et al. <em>Stroke</em>. 2007;38:2506-2517. | <strong>DESTINY:</strong> J&uuml;ttler E et al. <em>Stroke</em>. 2007;38:2518-2525.<br/>
          <strong>HAMLET:</strong> Hofmeijer J et al. <em>Lancet Neurol</em>. 2009;8:326-333. | <strong>DESTINY II:</strong> J&uuml;ttler E et al. <em>N Engl J Med</em>. 2014;370:1091-1100.<br/>
          <strong>AHA Guidelines:</strong> Wijdicks EF et al. <em>Stroke</em>. 2014;45:1222-1238.
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(malignantHtml);
  await page.pdf({
    path: 'documents/references/Malignant Infarction.pdf',
    format: 'letter',
    printBackground: true,
    margin: { top: '0.15in', bottom: '0.15in', left: '0.15in', right: '0.15in' }
  });
  console.log('Generated documents/references/Malignant Infarction.pdf');

  // ==========================================
  // 6. GENERATE AFIB DOAC START TIMING PDF (LANDSCAPE)
  // ==========================================
  const afibHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>AFib DOAC Start Timing</title>
      <style>
        @page {
          size: letter landscape;
          margin: 0.15in 0.15in 0.15in 0.15in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1a1b20;
          font-size: 7.8pt;
          line-height: 1.25;
          background: white;
          --ink:         #1a1b20;
          --ink-soft:    #3c3d47;
          --ink-mute:    #636472;
          --rule:        #e0dde4;
          --rule-soft:   #f0eef3;
          --fill:        #f3f1f6;
          --fill-soft:   #f8f7fa;
          --paper:       #ffffff;
          --purple:      #5B3B9C;
          --purple-deep: #3A2368;
          --purple-soft: #f1edfa;
          --purple-glow: rgba(91, 59, 156, 0.15);
          --teal:        #18849E;
          --teal-soft:   #e6f4f7;
          --teal-deep:   #0F586B;
          --teal-glow:   rgba(24, 132, 158, 0.15);
          --red:         #C62E2E;
          --red-soft:    #fcebeb;
          --red-deep:    #8E1E1E;
          --red-glow:    rgba(198, 46, 46, 0.15);
          --amber:       #D9860B;
          --amber-soft:  #fdf3e4;
          --amber-deep:  #945B06;
          --amber-glow:  rgba(217, 134, 11, 0.15);
          --slate:       #4A5A6D;
          --slate-soft:  #f0f2f5;
        }
        .container {
          border: 2px solid var(--teal);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 10px 15px;
          box-sizing: border-box;
        }
        h1 {
          font-size: 16pt;
          font-weight: 800;
          margin: 0 0 2px 0;
          text-align: center;
          background: linear-gradient(135deg, var(--purple-deep) 0%, var(--purple) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p.subtitle {
          font-size: 8.2pt;
          color: var(--ink-soft);
          margin: 0 0 4px 0;
          text-align: center;
          font-weight: 500;
        }
        .clinical-efficacy-box {
          border-left: 4px solid var(--teal);
          background: var(--teal-soft);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 7.4pt;
          margin-bottom: 4px;
          line-height: 1.35;
        }
        .severity-classification-box {
          border: 1px solid var(--rule-soft);
          border-radius: 6px;
          padding: 4px 6px;
          background: var(--fill-soft);
          margin-bottom: 4px;
        }
        .severity-classification-box strong.title {
          color: var(--purple-deep);
          font-size: 8.2pt;
          display: block;
          margin-bottom: 2px;
        }
        .severity-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          font-size: 7.2pt;
          line-height: 1.3;
        }
        .severity-col {
          border-radius: 4px;
          padding: 4px 6px;
          background: white;
        }
        .severity-col.mild { border: 1px solid rgba(24,132,158,0.2); }
        .severity-col.mod { border: 1px solid rgba(217,134,11,0.2); }
        .severity-col.sev { border: 1px solid rgba(198,46,46,0.2); }
        
        .dosing-guide-box {
          border: 1px solid var(--rule-soft);
          border-radius: 6px;
          padding: 6px 10px;
          background: white;
          margin-bottom: 4px;
        }
        .dosing-guide-box strong.title {
          color: var(--purple-deep);
          font-size: 8.5pt;
          display: block;
          margin-bottom: 2px;
        }
        .dosing-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7.2pt;
          line-height: 1.3;
          color: var(--ink);
        }
        .dosing-table th {
          border-bottom: 1.5px solid var(--rule-soft);
          background: var(--fill-soft);
          color: var(--purple-deep);
          font-weight: 700;
          padding: 3px 5px;
          text-align: left;
        }
        .dosing-table td {
          padding: 4px 5px;
          border-bottom: 1px solid var(--rule-soft);
          vertical-align: top;
        }
        .dosing-table tr:last-child td {
          border-bottom: none;
        }
        .ref-citation {
          margin-top: 0;
          padding: 4px 8px;
          background: linear-gradient(135deg, var(--fill-soft) 0%, #ffffff 100%);
          border-left: 4px solid var(--teal);
          border-radius: 4px;
          font-size: 6.8pt;
          line-height: 1.25;
          color: var(--ink-mute);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>AFib Anticoagulation Restart Timing After Acute Ischemic Stroke</h1>
        
        <div class="clinical-efficacy-box">
          <strong style="color: var(--teal-deep); text-transform: uppercase; font-size: 7.2pt; letter-spacing: 0.05em; display: block; margin-bottom: 1px;">Clinical Efficacy & Safety</strong>
          RCT and individual-patient meta-analysis data support early DOAC initiation in carefully selected AFib-related ischemic stroke patients, especially mild-to-moderate infarcts without high-risk hemorrhagic transformation. Early treatment has not shown excess symptomatic intracranial hemorrhage (sICH) versus delayed treatment and may reduce recurrent ischemic stroke; DOACs are preferred over warfarin for most nonvalvular AF patients when anticoagulation is indicated.
        </div>

        <div class="severity-classification-box">
          <strong class="title">1. Stroke Severity Classification (ELAN Imaging Criteria)</strong>
          <div class="severity-grid">
            <div class="severity-col mild">
              <strong style="color: var(--teal-deep); display: block;">Minor / Small Infarct</strong>
              • TIA or infarct <strong>&le; 1.5 cm</strong> on brain imaging. NIHSS can guide bedside risk but is not the ELAN definition.
            </div>
            <div class="severity-col mod">
              <strong style="color: var(--amber-deep); display: block;">Moderate Infarct</strong>
              • Cortical superficial-branch lesion, internal border-zone lesion, or deep-branch lesion <strong>&gt; 1.5 cm</strong>.
            </div>
            <div class="severity-col sev">
              <strong style="color: var(--red-deep); display: block;">Major / Large Infarct</strong>
              • Complete vascular territory, &ge;2 moderate lesions, large multilobar infarct, or brainstem/cerebellar lesion <strong>&ge; 1.5 cm</strong>.
            </div>
          </div>
        </div>

        <svg viewBox="0 0 735 150" style="width: 100%; height: 130px; margin-bottom: 6px">
          <rect x="0" y="0" width="735" height="150" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" stroke-width="1"/>
          <line x1="20" y1="95" x2="715" y2="95" stroke="var(--ink-mute)" stroke-width="2"/>
          <line x1="20" y1="90" x2="20" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="20" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 1</text>
          <line x1="73.5" y1="90" x2="73.5" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="73.5" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 2</text>
          <line x1="127" y1="90" x2="127" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="127" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 3</text>
          <line x1="180.5" y1="90" x2="180.5" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="180.5" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 4</text>
          <line x1="234" y1="90" x2="234" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="234" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 5</text>
          <line x1="287.5" y1="90" x2="287.5" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="287.5" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 6</text>
          <line x1="341" y1="90" x2="341" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="341" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 7</text>
          <line x1="394.5" y1="90" x2="394.5" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="394.5" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 8</text>
          <line x1="448" y1="90" x2="448" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="448" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 9</text>
          <line x1="501.5" y1="90" x2="501.5" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="501.5" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 10</text>
          <line x1="555" y1="90" x2="555" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="555" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 11</text>
          <line x1="608.5" y1="90" x2="608.5" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="608.5" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 12</text>
          <line x1="662" y1="90" x2="662" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="662" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 13</text>
          <line x1="715" y1="90" x2="715" y2="100" stroke="var(--ink-mute)" stroke-width="2"/>
          <text x="715" y="112" fill="var(--ink-soft)" font-size="7pt" font-family="IBM Plex Mono" font-weight="600" text-anchor="middle">Day 14</text>
          <rect x="20" y="65" width="53.5" height="15" rx="3" fill="var(--teal)" opacity="0.15"/>
          <rect x="20" y="65" width="53.5" height="15" rx="3" fill="none" stroke="var(--teal)" stroke-width="1.5"/>
          <text x="46.7" y="76" fill="var(--teal-deep)" font-size="6.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">MILD / TIA</text>
          <path d="M 46.7 80 L 46.7 93" stroke="var(--teal)" stroke-width="1" stroke-dasharray="2,2"/>
          <rect x="127" y="65" width="53.5" height="15" rx="3" fill="var(--amber)" opacity="0.15"/>
          <rect x="127" y="65" width="53.5" height="15" rx="3" fill="none" stroke="var(--amber)" stroke-width="1.5"/>
          <text x="153.7" y="76" fill="var(--amber-deep)" font-size="6.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">MODERATE</text>
          <path d="M 153.7 80 L 153.7 93" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2,2"/>
          <rect x="73.5" y="15" width="107" height="30" rx="4" fill="white" stroke="var(--amber)" stroke-width="1" style="filter: drop-shadow(0 2px 4px var(--amber-glow))"/>
          <text x="127" y="26" fill="var(--amber-deep)" font-size="6.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">REPEAT CT/MRI</text>
          <text x="127" y="37" fill="var(--ink-soft)" font-size="6pt" font-family="IBM Plex Sans" text-anchor="middle">Day 2-3 (Pre-DOAC)</text>
          <path d="M 127 45 L 127 60" stroke="var(--amber)" stroke-width="1"/>
          <rect x="287.5" y="65" width="53.5" height="15" rx="3" fill="var(--red)" opacity="0.15"/>
          <rect x="287.5" y="65" width="53.5" height="15" rx="3" fill="none" stroke="var(--red)" stroke-width="1.5"/>
          <text x="314.2" y="76" fill="var(--red-deep)" font-size="6.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">SEVERE</text>
          <path d="M 314.2 80 L 314.2 93" stroke="var(--red)" stroke-width="1" stroke-dasharray="2,2"/>
          <rect x="234" y="15" width="107" height="30" rx="4" fill="white" stroke="var(--red)" stroke-width="1" style="filter: drop-shadow(0 2px 4px var(--red-glow))"/>
          <text x="287.5" y="26" fill="var(--red-deep)" font-size="6.5pt" font-family="Outfit" font-weight="800" text-anchor="middle">REPEAT CT/MRI</text>
          <text x="287.5" y="37" fill="var(--ink-soft)" font-size="6pt" font-family="IBM Plex Sans" text-anchor="middle">Day 5-6 (Pre-DOAC)</text>
          <path d="M 287.5 45 L 287.5 60" stroke="var(--red)" stroke-width="1"/>
          <rect x="608.5" y="61" width="106.5" height="22" rx="3" fill="var(--red)" opacity="0.25"/>
          <rect x="608.5" y="61" width="106.5" height="22" rx="3" fill="none" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="3,2"/>
          <text x="661.7" y="70" fill="var(--red-deep)" font-size="6.0pt" font-family="Outfit" font-weight="800" text-anchor="middle">SEVERE +</text>
          <text x="661.7" y="79" fill="var(--red-deep)" font-size="6.0pt" font-family="Outfit" font-weight="800" text-anchor="middle">PH-2 HEMORRHAGE</text>
          <path d="M 661.7 83 L 661.7 93" stroke="var(--red)" stroke-width="1" stroke-dasharray="2,2"/>
          <text x="661.7" y="137" fill="var(--red-deep)" font-size="5.8pt" font-family="IBM Plex Sans" font-weight="600" text-anchor="middle">Delay initiation to Day 12-14</text>
          <text x="367" y="141" fill="var(--ink-mute)" font-size="7pt" font-family="Outfit" font-weight="700" text-anchor="middle">DOAC INITIATION TIMELINE AXIS (DAYS POST-AIS)</text>
        </svg>

        <div class="dosing-guide-box">
          <strong class="title">2. Bedside DOAC Dosing & Adjustment Guide</strong>
          <table class="dosing-table">
            <thead>
              <tr>
                <th style="width: 22%;">Drug</th>
                <th style="width: 28%;">Standard Dose</th>
                <th style="width: 50%;">Dose Reduction Criteria</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 700; color: var(--purple-deep)">Apixaban (Eliquis)</td>
                <td>5 mg BID</td>
                <td><strong>Reduce to 2.5 mg BID</strong> if &ge; 2 criteria are met:<br/>• Age &ge; 80 years | • Weight &le; 60 kg | • Serum creatinine &ge; 1.5 mg/dL</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--purple-deep)">Rivaroxaban (Xarelto)</td>
                <td>20 mg daily (with food)</td>
                <td><strong>Reduce to 15 mg daily</strong> if CrCl is 15–50 mL/min.<br/><span style="color: var(--red)">Hold if CrCl &lt; 15 mL/min</span>.</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--purple-deep)">Dabigatran (Pradaxa)</td>
                <td>150 mg BID</td>
                <td><strong>Reduce to 75 mg BID</strong> if CrCl is 15–30 mL/min.<br/><span style="color: var(--red)">Avoid if CrCl &lt; 15 mL/min</span>.</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--purple-deep)">Edoxaban (Savaysa)</td>
                <td>60 mg daily</td>
                <td><strong>Reduce to 30 mg daily</strong> if CrCl is 15–50 mL/min or weight &le; 60 kg.<br/><span style="color: var(--red)">Avoid if CrCl &gt; 95 mL/min</span> (high renal clearance reduces DOAC level).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ref-citation">
          <strong>ELAN Trial:</strong> Fischer U et al. <em>N Engl J Med</em>. 2023;388:2411-2421. | <strong>CATALYST Meta-Analysis:</strong> Dehbi HM et al. <em>Lancet</em> 2025. Early DOAC (median Day 2) vs delayed (median Day 7-8) showed no excess sICH (0.4% vs 0.4%) and fewer recurrent ischemic events in pooled data.<br/>
          <strong>AFib Guidelines:</strong> Joglar JA et al. 2023 ACC/AHA/ACCP/HRS Guideline. <em>Circulation</em>. 2024;149:e1-e156.
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(afibHtml);
  await page.pdf({
    path: 'documents/references/AFib DOAC Start Timing.pdf',
    format: 'letter',
    landscape: true,
    printBackground: true,
    margin: { top: '0.15in', bottom: '0.15in', left: '0.15in', right: '0.15in' }
  });
  console.log('Generated documents/references/AFib DOAC Start Timing.pdf');

  // ==========================================
  // GENERATE CERVICAL ARTERY DISSECTION PDF
  // ==========================================
  const cervicalHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Cervical Artery Dissection</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Outfit:wght@100..900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: letter;
          margin: 0.16in 0.16in 0.16in 0.16in;
        }
        :root {
          --fill-soft: #f8f7fa;
          --rule-soft: #f0eef3;
          --rule: #e0dde4;
          --ink: #1a1b20;
          --ink-soft: #3c3d47;
          --ink-mute: #636472;
          
          --purple: #5B3B9C;
          --purple-deep: #3A2368;
          --purple-soft: #f1edfa;
          
          --teal: #18849E;
          --teal-soft: #e6f4f7;
          --teal-deep: #0F586B;
          
          --red: #C62E2E;
          --red-soft: #fcebeb;
          --red-deep: #8E1E1E;
          
          --amber: #D9860B;
          --amber-soft: #fdf3e4;
          --amber-deep: #945B06;
          
          --slate: #4A5A6D;
          --slate-soft: #f0f2f5;
        }
        body {
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 0;
          color: var(--ink);
          font-size: 8pt;
          line-height: 1.25;
          background: white;
        }
        .container {
          border: 2px solid var(--purple-deep);
          border-radius: 8px;
          padding: 6px 12px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          height: 100%;
        }
        h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 18pt;
          font-weight: 800;
          margin: 0 auto 2px auto;
          text-align: center;
          background: linear-gradient(135deg, var(--purple-deep) 0%, var(--purple) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative;
          padding-bottom: 3px;
        }
        h1::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 50px;
          height: 2.5px;
          background: linear-gradient(90deg, var(--teal), var(--purple));
          border-radius: 3px;
        }
        p.subtitle {
          font-size: 8pt;
          color: var(--ink-soft);
          margin: 4px 0 6px 0;
          text-align: center;
          font-weight: 500;
        }
        .box {
          border-radius: 8px;
          padding: 4px 8px;
          box-sizing: border-box;
          margin-bottom: 4px;
        }
        .box-purple {
          border: 1.5px solid var(--purple);
          background: linear-gradient(135deg, var(--purple-soft) 0%, #ffffff 100%);
        }
        .box-teal {
          border: 1.5px solid var(--teal);
          background: linear-gradient(135deg, var(--teal-soft) 0%, #ffffff 100%);
        }
        .box-red {
          border: 1.5px solid var(--red);
          background: linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%);
        }
        .box-amber {
          border: 1.5px solid var(--amber);
          background: linear-gradient(135deg, var(--amber-soft) 0%, #ffffff 100%);
          margin-bottom: 3px;
        }
        .box-title {
          font-family: 'Outfit', sans-serif;
          font-size: 9pt;
          font-weight: 700;
          margin-bottom: 3px;
          display: block;
        }
        .box-purple .box-title { color: var(--purple-deep); }
        .box-teal .box-title { color: var(--teal-deep); }
        .box-red .box-title { color: var(--red-deep); }
        .box-amber .box-title { color: var(--amber-deep); }
        
        .presentation-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.85fr 0.9fr;
          gap: 6px;
          font-size: 7.4pt;
          line-height: 1.3;
          color: var(--ink-soft);
        }
        .col-divider {
          border-left: 1.5px dashed var(--purple);
          padding-left: 8px;
        }
        .two-column-grid {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 5px;
          margin-bottom: 4px;
        }
        .management-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 7.3pt;
          line-height: 1.3;
          color: var(--ink-soft);
        }
        .management-divider {
          border-left: 1.5px dashed var(--red);
          padding-left: 8px;
        }
        .trial-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7.1pt;
          line-height: 1.2;
          color: var(--ink);
        }
        .trial-table th {
          border-bottom: 1.5px solid var(--amber);
          color: var(--amber-deep);
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          padding: 2px 0;
          text-align: left;
        }
        .trial-table td {
          padding: 2.2px 0;
          vertical-align: top;
          border-bottom: 1px solid var(--rule-soft);
        }
        .trial-table tr:last-child td {
          border-bottom: none;
        }
        .ref-citation {
          margin-top: auto;
          padding: 2px 6px;
          background: linear-gradient(135deg, var(--fill-soft) 0%, #ffffff 100%);
          border-left: 4px solid var(--purple);
          border-radius: 4px;
          font-size: 7pt;
          line-height: 1.2;
          color: var(--ink-soft);
        }
        .ref-citation a {
          color: var(--teal-deep);
          text-decoration: underline;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Cervical Artery Dissection</h1>

        <!-- Anatomy & Dissection SVG -->
        <div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background: var(--fill-soft); border-radius: 6px; border: 1.5px solid var(--rule-soft); overflow: hidden; box-sizing: border-box; margin-bottom: 8px;">
          <svg viewBox="0 0 735 110" style="width: 100%; height: 100%;">
            <rect x="0" y="0" width="735" height="110" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" stroke-width="1"/>
            <path d="M 20 25 L 430 25 M 20 85 L 430 85" stroke="#4A5A6D" stroke-width="3" stroke-linecap="round" />
            <path d="M 20 33 L 150 33" stroke="#94a3b8" stroke-width="2" fill="none" />
            <path d="M 20 77 L 430 77" stroke="#94a3b8" stroke-width="2" fill="none" />
            <path d="M 150 33 L 160 48" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="M 160 48 C 220 72, 320 72, 380 33" stroke="#94a3b8" stroke-width="2" fill="none" />
            <path d="M 160 48 C 220 72, 320 72, 380 33 L 380 25 L 160 25 Z" fill="var(--red-soft)" opacity="0.8" />
            <path d="M 180 25 C 220 45, 320 45, 360 25" fill="var(--red)" opacity="0.25" />
            <path d="M 380 33 L 430 33" stroke="#94a3b8" stroke-width="2" fill="none" />
            <path d="M 100 55 Q 140 55, 160 40" fill="none" stroke="var(--red)" stroke-width="2.2" marker-end="url(#arrow-red)" />
            <path d="M 165 32 Q 190 28, 220 28" fill="none" stroke="var(--red)" stroke-width="2.2" marker-end="url(#arrow-red)" />
            <path d="M 240 68 L 300 68" stroke="var(--amber)" stroke-width="1.8" fill="none" marker-end="url(#arrow-amber)" />
            <rect x="380" y="55" width="45" height="22" rx="3" fill="var(--purple)" opacity="0.85" stroke="var(--purple-deep)" stroke-width="1" />
            <line x1="384" y1="77" x2="392" y2="55" stroke="#ffffff" stroke-width="1" opacity="0.4" />
            <line x1="392" y1="77" x2="400" y2="55" stroke="#ffffff" stroke-width="1" opacity="0.4" />
            <line x1="400" y1="77" x2="408" y2="55" stroke="#ffffff" stroke-width="1" opacity="0.4" />
            <text x="75" y="58" fill="var(--teal-deep)" font-size="7pt" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle">TRUE LUMEN</text>
            <text x="145" y="16" fill="var(--red-deep)" font-size="6pt" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle">Intimal Tear</text>
            <text x="270" y="38" fill="var(--red-deep)" font-size="7pt" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle">FALSE LUMEN (Intramural Hematoma)</text>
            <text x="270" y="60" fill="var(--amber-deep)" font-size="6.5pt" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">Stenosis / Compression</text>
            <text x="402" y="48" fill="var(--purple-deep)" font-size="6.5pt" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle">Thrombus</text>
            <circle cx="530" cy="55" r="28" fill="none" stroke="#4A5A6D" stroke-width="2.5" />
            <circle cx="530" cy="55" r="24" fill="none" stroke="#94a3b8" stroke-width="1.5" />
            <circle cx="530" cy="55" r="23" fill="var(--teal-soft)" opacity="0.6" />
            <text x="530" y="58" fill="var(--teal-deep)" font-size="5.5pt" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle">NORMAL ICA</text>
            <text x="530" y="96" fill="var(--ink-soft)" font-size="5pt" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">Sympathetic Plexus (Cervical)</text>
            <circle cx="530" cy="23" r="1.5" fill="var(--amber)" />
            <circle cx="545" cy="27" r="1.5" fill="var(--amber)" />
            <circle cx="555" cy="40" r="1.5" fill="var(--amber)" />
            <circle cx="557" cy="55" r="1.5" fill="var(--amber)" />
            <circle cx="555" cy="70" r="1.5" fill="var(--amber)" />
            <circle cx="545" cy="83" r="1.5" fill="var(--amber)" />
            <circle cx="530" cy="87" r="1.5" fill="var(--amber)" />
            <circle cx="650" cy="55" r="28" fill="none" stroke="#4A5A6D" stroke-width="2.5" />
            <path d="M 622 55 A 28 28 0 0 1 678 55 C 670 65, 630 65, 622 55 Z" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1" />
            <path d="M 622 55 C 630 65, 670 65, 678 55 A 28 28 0 0 1 622 55 Z" fill="none" stroke="#94a3b8" stroke-width="1.5" />
            <ellipse cx="650" cy="70" rx="18" ry="8" fill="var(--teal-soft)" stroke="#94a3b8" stroke-width="1" />
            <circle cx="650" cy="23" r="1.5" fill="var(--amber)" opacity="0.3" />
            <circle cx="665" cy="27" r="1.5" fill="var(--amber)" opacity="0.3" />
            <circle cx="675" cy="40" r="1.5" fill="var(--amber)" opacity="0.3" />
            <text x="650" y="44" fill="var(--red-deep)" font-size="5.5pt" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle">Hematoma</text>
            <text x="650" y="73" fill="var(--teal-deep)" font-size="5.5pt" font-family="'Outfit', sans-serif" font-weight="800" text-anchor="middle">True Lumen</text>
            <text x="650" y="96" fill="var(--ink-soft)" font-size="5pt" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">Cervical ICA Dissection</text>
            <defs>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--red)" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--amber)" />
              </marker>
            </defs>
          </svg>
        </div>
        <!-- Stroke Mechanisms (PNG) -->
        <div style="width: 100%; height: 270px; display: flex; align-items: center; justify-content: center; background: var(--fill-soft); border-radius: 6px; border: 1.5px solid var(--rule-soft); overflow: hidden; box-sizing: border-box; margin-bottom: 8px;">
          <img src="${dissectionStrokeMechanismsBase64}" style="max-height: 100%; max-width: 100%; object-fit: contain;" />
        </div>

        <div class="box box-purple">
          <span class="box-title">1. Clinical Presentation &amp; Pathophysiology</span>
          <div class="presentation-grid">
            <div>
              <strong style="color: var(--purple-deep); font-size: 8pt">Ipsilateral Pain &amp; Onset</strong>
              <br/>• <strong>Carotid (ICA)</strong>: Frontotemporal/retro-orbital/facial pain (jaw angle).
              <br/>• <strong>Vertebral (VA)</strong>: Severe occipital or posterior neck pain.
              <br/>• <strong>Onset</strong>: Precedes stroke/TIA by hours to days (median 4 days).
            </div>
            <div class="col-divider">
              <strong style="color: var(--purple-deep); font-size: 8pt">Anhidrosis-Sparing Horner's</strong>
              <br/>• <strong>Signs</strong>: Ptosis/miosis (28–58% of ICA) <strong>without</strong> anhidrosis.
              <br/>• <strong>Mechanism</strong>: Sweat fibers follow ECA plexus; pupil/eyelid fibers follow ICA.
            </div>
            <div class="col-divider">
              <strong style="color: var(--purple-deep); font-size: 8pt">Neurological Deficits</strong>
              <br/>• <strong>CN Palsies</strong>: CN IX–XII palsies (8–16%) from local ICA compression.
              <br/>• <strong>VA Territory</strong>: Wallenberg syndrome, cerebellar ataxia, PICA/AICA strokes.
            </div>
          </div>
        </div>

        <div class="two-column-grid">
          <div class="box box-teal">
            <span class="box-title">2. Diagnostic Workup</span>
            <ul style="margin: 0; padding-left: 12px; font-size: 7.8pt; line-height: 1.4; color: var(--ink-soft)">
              <li><strong>CTA Head/Neck</strong>: Shows string sign, dissection flap, pseudoaneurysm, or occlusion.</li>
              <li><strong>MRI Neck (T1 Fat-Sat)</strong>: Pathognomonic crescent sign (intramural hematoma).</li>
              <li><strong>DSA</strong>: Reserve for diagnostic doubt or stenting.</li>
              <li><strong>Screening</strong>: Assess for FMD/connective tissue disease, especially if spontaneous/recurrent.</li>
            </ul>
          </div>

          <div class="box box-red">
            <span class="box-title">3. Medical Management: Extracranial vs. Intracranial Dissection</span>
            <div class="management-split">
              <div>
                <strong style="color: var(--red-deep); font-size: 8pt">Extracranial Dissection</strong>
                <br/>• <strong>Antithrombotics</strong>: ≥ 3 months (Class I).
                <br/>• <strong>Choice</strong>: Equipoise. Monotherapy/DAPT vs. VKA/DOAC is individualized.
                <br/>• <strong>STOP-CAD</strong>: In occlusions, consider anticoagulation Day 1–30, then switch to antiplatelet.
                <br/>• <strong>IV Thrombolysis</strong>: Safe &amp; indicated within 4.5 hours (Class I).
              </div>
              <div class="management-divider">
                <strong style="color: var(--red-deep); font-size: 8pt">Intracranial &amp; Pseudoaneurysms</strong>
                <br/>• <strong>SAH</strong>: Lack external elastic lamina &amp; thin adventitia; rupture risk.
                <br/>• <strong>Anticoagulation</strong>: Avoided if SAH present. Prefer single antiplatelet.
                <br/>• <strong>Pseudoaneurysm</strong>: Conservative management with serial imaging.
                <br/>• <strong>Stenting</strong>: Reserve for refractory ischemia or enlarging/symptomatic pseudoaneurysms.
              </div>
            </div>
          </div>
        </div>

        <div class="box box-amber">
          <span class="box-title">4. Landmark Trial &amp; Cohort Evidence</span>
          <table class="trial-table">
            <thead>
              <tr style="border-bottom: 1.5px solid var(--amber); color: var(--amber-deep); font-weight: 700">
                <th style="padding: 2px 0; text-align: left; width: 12%">Study / Year</th>
                <th style="padding: 2px 0; text-align: left; width: 20%">Population &amp; Design</th>
                <th style="padding: 2px 0; text-align: left; width: 25%">Interventions Compared</th>
                <th style="padding: 2px 0; text-align: left; width: 43%">Key Outcomes &amp; Clinical Nuance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 700; padding: 3px 0;"><strong>CADISS</strong><br/>2015</td>
                <td style="padding: 3px 0;">N = 250. Extracranial CeAD. RCT.</td>
                <td style="padding: 3px 0;">Antiplatelet vs. Anticoagulant for 3 months.</td>
                <td style="padding: 3px 0; color: var(--ink-soft)">
                  • <strong>Composite (Stroke/Death at 3m)</strong>: 2.0% vs. 1.0% (p = 0.63). Established clinical equipoise.
                </td>
              </tr>
              <tr>
                <td style="font-weight: 700; padding: 3px 0;"><strong>TREAT-CAD</strong><br/>2021</td>
                <td style="padding: 3px 0;">N = 194 (PP = 173). Extracranial. RCT.</td>
                <td style="padding: 3px 0;">Aspirin 300mg daily vs. VKA for 3 months.</td>
                <td style="padding: 3px 0; color: var(--ink-soft)">
                  • <strong>Composite (Stroke, bleed, death, or MRI at 14d)</strong>: 23% vs. 15% (Non-inferiority NOT met). Ischemic stroke: 8.0% vs. 0%.
                </td>
              </tr>
              <tr>
                <td style="font-weight: 700; padding: 3px 0;"><strong>Kaufmann IPD</strong><br/>2024</td>
                <td style="padding: 3px 0;">N = 444. Meta-analysis of CADISS + TREAT-CAD.</td>
                <td style="padding: 3px 0;">Antiplatelet vs. Anticoagulant.</td>
                <td style="padding: 3px 0; color: var(--ink-soft)">
                  • <strong>Ischemic Stroke alone</strong>: Significant reduction with anticoagulation (0.5% vs. 4.0%; OR 0.14, p = 0.01). No difference in composite.
                </td>
              </tr>
              <tr>
                <td style="font-weight: 700; padding: 3px 0;"><strong>STOP-CAD</strong><br/>2024</td>
                <td style="padding: 3px 0;">N = 3,636. Multicenter cohort registry.</td>
                <td style="padding: 3px 0;">Antiplatelet vs. Anticoagulation.</td>
                <td style="padding: 3px 0; color: var(--ink-soft)">
                  • <strong>Stroke vs Bleed</strong>: Anticoagulation associated with lower stroke rate but higher bleed. Occlusions benefited most; day 30 transition.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ref-citation">
          <strong>CADISS:</strong> <em>Lancet Neurol</em>. 2015;14(4):361-7. PMID: 25684164 | <strong>TREAT-CAD:</strong> <em>Lancet Neurol</em>. 2021;20(5):341-350. PMID: 33765420<br/>
          <strong>Kaufmann IPD:</strong> <em>JAMA Neurol</em>. 2024;81(6):630-637. PMID: 38739383 | <strong>STOP-CAD:</strong> <em>Stroke</em>. 2024;55(4):908-918. PMID: 38334460 | <strong>AHA/ASA:</strong> <em>Stroke</em>. 2021;52:e364-e467. PMID: 34024117
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(cervicalHtml);
  await page.pdf({
    path: 'documents/references/Cervical Artery Dissection.pdf',
    format: 'letter',
    landscape: false,
    printBackground: true,
    margin: { top: '0.15in', bottom: '0.15in', left: '0.15in', right: '0.15in' }
  });
  console.log('Generated documents/references/Cervical Artery Dissection.pdf');

  await browser.close();
}

main().catch(console.error);
