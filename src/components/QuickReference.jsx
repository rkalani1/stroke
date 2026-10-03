// Bedside quick reference for the top of the Protocols tab. Pure presentational:
// no network, no state writes. Guideline values are shown; where the protected
// local protocol states an institutional variant, the card says so ("local
// protocol may differ"). Grades verified 2026-10-03 against the archived
// AHA/ASA 2026 AIS, 2022 ICH and 2023 aSAH recommendation records.
import React from 'react';
import { calculateTNKDoseReviewed, calculateAlteplaseDoseReviewed } from '../calculators.js';

const SOURCES = {
  ais2026: { label: 'AHA/ASA AIS 2026', url: 'https://doi.org/10.1161/STR.0000000000000513' },
  ais2019: { label: 'AHA/ASA AIS 2019 (PMID 31662037)', url: 'https://pubmed.ncbi.nlm.nih.gov/31662037/' },
  ich2022: { label: 'AHA/ASA ICH 2022 (PMID 35579034)', url: 'https://pubmed.ncbi.nlm.nih.gov/35579034/' },
  sah2023: { label: 'AHA/ASA aSAH 2023 (PMID 37212182)', url: 'https://pubmed.ncbi.nlm.nih.gov/37212182/' },
  ncs2016: { label: 'NCS/SCCM reversal 2016 (PMID 26714677)', url: 'https://pubmed.ncbi.nlm.nih.gov/26714677/' },
  ncs2026: { label: 'NCS/SCCM reversal 2026 (PMID 42786382)', url: 'https://pubmed.ncbi.nlm.nih.gov/42786382/' },
  sich2017: { label: 'AHA/ASA sICH statement 2017 (PMID 29097489)', url: 'https://pubmed.ncbi.nlm.nih.gov/29097489/' },
  tnkLabel: { label: 'US TNKase label', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e647640d-c395-4b4b-a0be-1162f9c21d84' }
};

export const QUICK_REFERENCE_DOSE_WEIGHTS = Array.from({ length: 17 }, (_, index) => 40 + index * 5);

// Shared arithmetic (calculators.js): TNK 0.25 mg/kg max 25 mg at 5 mg/mL;
// alteplase 0.9 mg/kg max 90 mg, 10% bolus, remainder over 60 minutes.
export function thrombolyticDoseRow(weightKg) {
  const tnk = calculateTNKDoseReviewed(weightKg, 'guideline');
  const alteplase = calculateAlteplaseDoseReviewed(weightKg);
  if (!tnk || !alteplase) return null;
  return {
    weightKg: tnk.weightKg,
    tnkMg: Number(tnk.calculatedDose),
    tnkMl: parseFloat(tnk.volume),
    tnkCapped: tnk.isMaxDose,
    alteplaseTotal: alteplase.totalDose,
    alteplaseBolus: alteplase.bolus,
    alteplaseInfusion: alteplase.infusion,
    alteplaseCapped: alteplase.capped
  };
}

export function thrombolyticDoseTable() {
  return [
    ...QUICK_REFERENCE_DOSE_WEIGHTS.map(weight => ({ key: String(weight), label: `${weight}`, ...thrombolyticDoseRow(weight) })),
    { key: '>120', label: '>120', tnkMg: 25, tnkMl: 5, tnkCapped: true, alteplaseTotal: 90, alteplaseBolus: 9, alteplaseInfusion: 81, alteplaseCapped: true }
  ];
}

// The highlighted table row is the nearest 5-kg row; exact doses are shown separately.
export function highlightedDoseRowKey(weightKg) {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0 || weight > 350) return null;
  if (weight > 120) return '>120';
  const nearest = Math.min(120, Math.max(40, Math.round(weight / 5) * 5));
  return String(nearest);
}

const labelBands = () => (calculateTNKDoseReviewed(80, 'fda-label')?.doseTable || [])
  .map(band => `${band.maxWeight === null ? `≥${band.minWeight}` : band.minWeight === 0 ? `<${band.maxWeight}` : `${band.minWeight}–<${band.maxWeight}`} kg ${band.dose} mg`)
  .join('; ');

const Sources = ({ ids }) => (
  <p className="mt-2 text-[11px] text-mute">
    Sources:{' '}
    {ids.map((id, index) => (
      <React.Fragment key={id}>
        {index > 0 && ' · '}
        <a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer" className="underline text-link-700 dark:text-link-400">{SOURCES[id].label}</a>
      </React.Fragment>
    ))}
  </p>
);

// Same class colours as the Evidence recommendation chips.
// COR 3: No Benefit is neutral and COR 3: Harm is red, as in the protocol cards below.
const gradeTone = text => /COR 3: No Benefit/.test(text) ? 'cor-neutral' : /COR 3/.test(text) ? 'cor-3' : /COR 2a/.test(text) ? 'cor-2a' : /COR 2b/.test(text) ? 'cor-2b' : /COR 1\b/.test(text) ? 'cor-1' : 'cor-neutral';
const Grade = ({ children, harm = false }) => (
  <span className={`reference-chip ${harm ? 'cor-3' : gradeTone(String(children))} ml-1 whitespace-nowrap align-[1px]`}>{children}</span>
);

const Card = ({ id, title, open = false, children }) => (
  <details id={id} open={open} className="rounded-md border border-line bg-card text-ink">
    <summary className="flex min-h-[44px] cursor-pointer items-center px-3 py-2 text-[15px] font-semibold">{title}</summary>
    <div className="px-3 pb-3 text-sm leading-relaxed">{children}</div>
  </details>
);

const Rows = ({ rows }) => (
  <dl className="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-[11rem_minmax(0,1fr)]">
    {rows.map(([term, detail, rowClass]) => (
      <React.Fragment key={term}>
        <dt className={`font-semibold ${rowClass || ''}`}>{term}</dt>
        <dd className={`min-w-0 ${rowClass || ''}`}>{detail}</dd>
      </React.Fragment>
    ))}
  </dl>
);

function DoseCard({ weightKg, open = true }) {
  const exact = weightKg === undefined || weightKg === null || weightKg === '' ? null : thrombolyticDoseRow(weightKg);
  const highlight = exact ? highlightedDoseRowKey(weightKg) : null;
  const rows = thrombolyticDoseTable();
  return (
    <Card id="qr-dose" title="Thrombolytic dose by weight" open={open}>
      {exact ? (
        <p className="mb-2 rounded border border-cobalt-300 bg-cobalt-50 p-2 text-ink dark:border-cobalt-700 dark:bg-cobalt-900" data-testid="qr-exact-dose">
          <strong>{Math.round(exact.weightKg * 10) / 10} kg:</strong> TNK {exact.tnkMg} mg ({exact.tnkMl} mL at 5 mg/mL){exact.tnkCapped ? ', capped' : ''} · Alteplase {exact.alteplaseTotal} mg total: {exact.alteplaseBolus} mg bolus over 1 min, {exact.alteplaseInfusion} mg over 60 min{exact.alteplaseCapped ? ', capped' : ''}
        </p>
      ) : (
        <p className="mb-2 text-ink-2">Enter weight in Encounter to see the exact dose.</p>
      )}
      <div className="overflow-x-auto rounded border border-line md:w-fit md:max-w-full" role="region" aria-label="Thrombolytic dose table" tabIndex={0}>
        <table className="w-full min-w-[19rem] border-collapse text-[13px] tabular-nums md:w-auto md:min-w-[34rem]">
          <thead className="bg-paper-2 text-left">
            <tr>
              <th scope="col" className="px-1 py-1">kg</th>
              <th scope="col" className="px-1 py-1">TNK mg</th>
              <th scope="col" className="px-1 py-1">mL</th>
              <th scope="col" className="px-1 py-1">Alteplase total</th>
              <th scope="col" className="px-1 py-1">Bolus</th>
              <th scope="col" className="px-1 py-1">Infusion (60 min)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} data-weight={row.key} aria-current={row.key === highlight ? 'true' : undefined} className={`border-t border-line ${row.key === highlight ? 'bg-cobalt-50 font-semibold dark:bg-cobalt-900' : ''}`}>
                <th scope="row" className="px-1 py-0.5 text-left">{row.label}</th>
                <td className="px-1 py-0.5">{row.tnkMg}</td>
                <td className="px-1 py-0.5">{row.tnkMl}</td>
                <td className="px-1 py-0.5">{row.alteplaseTotal}</td>
                <td className="px-1 py-0.5">{row.alteplaseBolus}</td>
                <td className="px-1 py-0.5">{row.alteplaseInfusion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-ink-2">TNK 0.25 mg/kg IV bolus (max 25 mg) or alteplase 0.9 mg/kg (max 90 mg), COR 1, LOE A. Highlighted row is the nearest 5-kg row. The US TNKase label instead uses weight bands ({labelBands()}) and covers treatment within 3 h of onset.</p>
      <Sources ids={['ais2026', 'tnkLabel']} />
    </Card>
  );
}

const HARM = 'text-crit-800 dark:text-crit-300';

export default function QuickReference({ weightKg, sub = 'ischemic' } = {}) {
  // On the ICH tab the BP and reversal cards lead and the dose table stays closed.
  const ich = sub === 'ich';
  const dose = <DoseCard weightKg={weightKg} open={!ich} />;
  return (
    <section aria-labelledby="quick-reference-heading" className="quick-reference space-y-2">
      <h2 id="quick-reference-heading" className="text-base font-semibold text-ink">Bedside quick reference</h2>
      {!ich && dose}

      <Card id="qr-bp" title="BP targets by phase">
        <Rows rows={[
          ['Before IVT', <>&lt;185/110<Grade>COR 1, B-NR</Grade></>],
          ['EVT planned, no IVT', <>≤185/110<Grade>COR 2a, B-NR</Grade></>],
          ['After IVT (24 h)', <>&lt;180/105<Grade>COR 1, B-R</Grade></>],
          ['Any EVT (during + 24 h)', <>≤180/105<Grade>COR 2a, B-NR</Grade>. Local protocol: SBP 140–180 during EVT.</>],
          ['After mTICI ≥2b', <>Do not lower SBP to &lt;140 (harm)<Grade harm>COR 3: Harm, A</Grade>. Local protocol: SBP 140–180.</>, HARM],
          ['No reperfusion', <>≥220/120: benefit of starting treatment in the first 48–72 h is uncertain<Grade>COR 2b, C-EO</Grade> (ESO 2025: if lowered, by &lt;15% over 24 h). &lt;220/120: starting antihypertensives in the first 48–72 h is not effective<Grade>COR 3: No Benefit, A</Grade>. Treat earlier if a comorbidity requires it<Grade>COR 1, C-EO</Grade>.</>],
          ['ICH', <>Mild–moderate ICH presenting with SBP 150–220: target 140, keep 130–150<Grade>COR 2b, B-R</Grade>; avoid SBP &lt;130<Grade harm>COR 3: Harm, B-R</Grade>. Local protocol may differ (SBP ≥220 branch).</>],
          ['aSAH, unsecured aneurysm', <>Frequent BP monitoring with short-acting agents; avoid hypotension, hypertension and variability<Grade>COR 1, C-EO</Grade>. No numeric target is graded; SBP &lt;160 is a common local target — local protocol may differ.</>]
        ]} />
        <p className="mt-2"><strong>Agents:</strong> labetalol 10–20 mg IV over 1–2 min, may repeat once; nicardipine 5 mg/h, titrate by 2.5 mg/h every 5–15 min, max 15 mg/h; clevidipine 1–2 mg/h, double every 2–5 min, max 21 mg/h. The local pre-IVT labetalol ladder may differ.</p>
        <Sources ids={['ais2026', 'ich2022', 'sah2023']} />
      </Card>

      <Card id="qr-reversal" title="Anticoagulant reversal (ICH)">
        <Rows rows={[
          ['Warfarin', <>4F-PCC by INR and weight: INR 2–&lt;4, 25 units/kg (max 2500); 4–6, 35 units/kg (max 3500); &gt;6, 50 units/kg (max 5000)<Grade>COR 1, B-R</Grade>, plus vitamin K 10 mg IV<Grade>COR 1, C-LD</Grade>. INR 1.3–1.9: PCC may be reasonable<Grade>COR 2b, C-LD</Grade>. Local fixed dose 2000 units — local protocol may differ.</>],
          ['Dabigatran', <>Idarucizumab 5 g IV (2 × 2.5 g)<Grade>COR 2a, B-NR</Grade>; if unavailable, 4F-PCC 50 units/kg. Local fixed dose 2000 units — local protocol may differ.</>],
          ['Apixaban, rivaroxaban, edoxaban', <>4F-PCC 50 units/kg<Grade>COR 2b, B-NR</Grade>. Reverse when the last dose was within 3–5 half-lives, timing is unknown or clearance is impaired (NCS/SCCM 2016); do not wait for the anti-Xa assay. Local trigger: last dose &lt;24 h. Andexanet was withdrawn from the US market in December 2025; NCS/SCCM 2026 favors 4F-PCC (conditional). Local fixed dose 2000 units — local protocol may differ. Charcoal 50 g if ingestion &lt;2 h.</>],
          ['Unfractionated heparin', <>Protamine 1 mg per 100 units given in the prior 2–3 h, max 50 mg<Grade>COR 2a, C-LD</Grade>.</>],
          ['Enoxaparin', <>Protamine 1 mg per 1 mg if ≤8 h (max 50 mg); 0.5 mg per 1 mg if 8–12 h<Grade>COR 2b, C-LD</Grade>.</>],
          ['Antiplatelets', <>No platelet transfusion unless emergency neurosurgery (aspirin<Grade harm>COR 3: Harm, B-R</Grade>; NCS/SCCM 2026 suggests against for any antiplatelet agent). Aspirin with emergency neurosurgery: transfusion may be considered<Grade>COR 2b, C-LD</Grade>.</>]
        ]} />
        <Sources ids={['ich2022', 'ncs2016', 'ncs2026']} />
      </Card>
      {ich && dose}

      <Card id="qr-sich" title="Post-thrombolysis symptomatic ICH">
        <ol className="list-decimal space-y-1 pl-4">
          <li>Stop the alteplase infusion (TNK is a single bolus).</li>
          <li>STAT CBC, PT/INR, aPTT, fibrinogen, type and cross; emergent non-contrast CT.</li>
          <li>Cryoprecipitate 10 units (≈2 pre-pooled units) IV over 10–30 min; give more if fibrinogen &lt;150 mg/dL.</li>
          <li>Tranexamic acid 1000 mg IV over 10 min, or aminocaproic acid 4–5 g IV over 1 h then 1 g/h until bleeding is controlled, as an alternative or adjunct.</li>
          <li>Hematology and neurosurgery consultation; supportive care for BP, ICP, CPP, temperature and glucose.</li>
        </ol>
        <p className="mt-2 text-ink-2">Local protocol may differ: empiric cryoprecipitate when CT is delayed &gt;30 min and fibrinogen is &lt;200 mg/dL; TXA after CT confirmation.</p>
        <Sources ids={['ais2019', 'sich2017', 'ncs2016']} />
      </Card>

      <Card id="qr-angioedema" title="Orolingual angioedema">
        <ol className="list-decimal space-y-1 pl-4">
          <li>Airway first: edema of the larynx, palate, floor of mouth or oropharynx, or progression within 30 min, raises intubation risk; awake fiberoptic intubation is optimal.</li>
          <li>Stop the alteplase infusion and hold ACE inhibitors.</li>
          <li>Methylprednisolone 125 mg IV, diphenhydramine 50 mg IV, famotidine 20 mg IV.</li>
          <li>If edema progresses: epinephrine 0.1% (1 mg/mL) 0.3 mL (0.3 mg) SC, or 0.5 mL nebulized.</li>
          <li>Refractory or ACE-inhibitor-related: icatibant 30 mg SC; plasma-derived C1-esterase inhibitor 20 IU/kg IV is an alternative (local protocol restricts it).</li>
        </ol>
        <Sources ids={['ais2019', 'ais2026']} />
      </Card>

      <Card id="qr-edema" title="Malignant edema and decompression">
        <Rows rows={[
          ['MCA infarct, age ≤60', <>Deterioration from swelling within 48 h despite medical therapy: decompressive craniectomy with dural expansion<Grade>COR 1, A</Grade>.</>],
          ['MCA infarct, age >60', <>Decompressive craniectomy may be considered to reduce mortality<Grade>COR 2b, B-R</Grade>; survivors often remain disabled, so use shared decision-making.</>],
          ['Trigger', <>Decreased consciousness from swelling is a reasonable trigger<Grade>COR 2a, B-NR</Grade>. Transfer early to a neurosurgical center<Grade>COR 1, C-LD</Grade>.</>],
          ['Cerebellar infarct', <>Obstructive hydrocephalus: ventriculostomy<Grade>COR 1, C-LD</Grade>. Deterioration from brainstem compression or infarct ≥35 mL: suboccipital decompressive craniectomy<Grade>COR 1, B-NR</Grade>.</>],
          ['Medical bridge', <>Osmotic therapy as a bridge to surgery<Grade>COR 2a, C-LD</Grade>. Not hypothermia, barbiturates or corticosteroids<Grade harm>COR 3: Harm, C-LD</Grade>.</>, HARM]
        ]} />
        <Sources ids={['ais2026']} />
      </Card>

      <Card id="qr-supportive" title="AIS supportive care">
        <Rows rows={[
          ['Oxygen', <>Keep SpO₂ &gt;94% if hypoxic<Grade>COR 1, C-LD</Grade>; no supplemental O₂ when not hypoxic and EVT-ineligible<Grade>COR 3: No Benefit, B-R</Grade>; normobaric oxygen before planned EVT (NIHSS 10–20, ASPECTS ≥6, M1/ICA-T, ≤6 h) may be reasonable<Grade>COR 2b, B-R</Grade>.</>],
          ['Glucose', <>Treat &lt;60 mg/dL<Grade>COR 1, C-LD</Grade>; target 140–180 mg/dL<Grade>COR 2a, C-LD</Grade>; avoid intensive IV insulin to 80–130 (SHINE)<Grade>COR 3: No Benefit, A</Grade>.</>],
          ['Temperature', <>Treat hyperthermia toward normothermia<Grade>COR 1, B-R</Grade> and find the source<Grade>COR 1, C-EO</Grade>.</>],
          ['Seizures', <>No prophylactic antiseizure medication<Grade>COR 3: No Benefit, C-LD</Grade>.</>],
          ['VTE', <>Intermittent pneumatic compression if immobile<Grade>COR 1, B-R</Grade>; no elastic stockings<Grade harm>COR 3: Harm, B-R</Grade>.</>],
          ['Swallow', <>Bedside dysphagia screen before any oral intake<Grade>COR 1, C-EO</Grade>.</>]
        ]} />
        <Sources ids={['ais2026']} />
      </Card>
    </section>
  );
}

export { QuickReference };
