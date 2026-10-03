// Local-first reversal line for the reversal card and the acute ICH banner.
// The institutional protocol uses a fixed 4F-PCC dose of 2000 units, not weight- or
// INR-tiered (v6.17.0: Protocols follow the Stroke Center folder). Weight-based label /
// NCS-SCCM arithmetic is returned separately as a comparison that mirrors the protocol's
// own fixed-dose caveat; it is never the lead instruction.
const FXA = ['apixaban', 'rivaroxaban', 'edoxaban'];
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
export function reversalDoseLine({ weightKg, agent, inr, lastDoseHours } = {}) {
  if (!agent) return null;
  const weight = Number(weightKg);
  const hasWeight = weight > 0 && weight <= 350;
  const kg = Math.round(weight * 10) / 10;
  const pcc = perKg => Math.round(Math.min(weight, 100) * perKg);
  const hours = Number.isFinite(lastDoseHours) && lastDoseHours >= 0 ? Math.floor(lastDoseHours) : null;
  if (agent === 'warfarin') {
    const value = Number(inr);
    if (!(value > 0)) return { local: 'Warfarin — vitamin K 10 mg IV now; enter the INR (4F-PCC 2000 units IV if INR ≥2.0).', comparison: null };
    if (value >= 2) {
      const [perKg, max] = value < 4 ? [25, 2500] : value <= 6 ? [35, 3500] : [50, 5000];
      return {
        local: `INR ${value} — 4F-PCC 2000 units IV now + vitamin K 10 mg IV; recheck INR at 30 min.`,
        comparison: hasWeight ? `Label dose at ${kg} kg: ${perKg} units/kg = ${Math.min(pcc(perKg), max)} units (max ${max}); the fixed dose may underdose heavier or high-INR patients.` : null
      };
    }
    if (value >= 1.3) return { local: `INR ${value} — vitamin K 10 mg IV; 4F-PCC 2000 units IV may be reasonable (COR 2b).`, comparison: null };
    return { local: `INR ${value} — below the PCC range; vitamin K 10 mg IV.`, comparison: null };
  }
  const comparison = hasWeight ? `NCS/SCCM 50 units/kg at ${kg} kg = ${pcc(50)} units${weight > 100 ? ' (dosing weight capped at 100 kg)' : ''}.` : null;
  if (FXA.includes(agent)) {
    const name = capitalize(agent);
    if (hours === null) return { local: `${name}, last-dose time unknown (treat as within the local <24 h trigger) — 4F-PCC 2000 units IV.`, comparison };
    if (hours < 24) return { local: `${name}, last dose ${hours} h ago (local trigger <24 h) — 4F-PCC 2000 units IV.`, comparison };
    return { local: `${name}, last dose ${hours} h ago — beyond the local <24 h trigger; reverse only with renal impairment or an elevated anti-Xa level.`, comparison: null };
  }
  if (agent === 'dabigatran') {
    const lead = `Dabigatran${hours === null ? ', last-dose time unknown' : `, last dose ${hours} h ago`}`;
    const drug = 'idarucizumab 5 g IV; 4F-PCC 2000 units IV only if idarucizumab is unavailable';
    // NCS/SCCM: reverse within 3-5 half-lives or with renal impairment; a normal thrombin time excludes a relevant effect.
    return hours !== null && hours >= 24
      ? { local: `${lead} — reverse if residual effect is likely (within 3–5 half-lives, renal impairment, or a prolonged thrombin time): ${drug}.`, comparison }
      : { local: `${lead} — ${drug}.`, comparison };
  }
  return null;
}
