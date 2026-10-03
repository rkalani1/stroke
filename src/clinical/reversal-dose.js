// Patient-specific 4F-PCC arithmetic for the reversal card, from the doses the card
// already states: Kcentra label INR tiers (dosing weight capped at 100 kg) and
// 50 units/kg for factor Xa inhibitors or dabigatran without idarucizumab.
const FXA = ['apixaban', 'rivaroxaban', 'edoxaban'];
export function reversalDoseLine({ weightKg, agent, inr, lastDoseHours } = {}) {
  const weight = Number(weightKg);
  if (!agent || !(weight > 0 && weight <= 350)) return null;
  const kg = Math.round(weight * 10) / 10, dosingWeight = Math.min(weight, 100);
  const timing = Number.isFinite(lastDoseHours) && lastDoseHours >= 0 ? `last dose ${Math.floor(lastDoseHours)} h ago` : 'last-dose time not documented';
  const pcc = perKg => Math.round(dosingWeight * perKg);
  if (agent === 'warfarin') {
    const value = Number(inr);
    if (!(value > 0)) return `${kg} kg on warfarin: enter the INR for the 4F-PCC tier; vitamin K 10 mg IV.`;
    if (value < 1.3) return `INR ${value}, ${kg} kg: below the INR range for PCC.`;
    if (value < 2) return `INR ${value}, ${kg} kg: PCC may be reasonable (COR 2b); vitamin K 10 mg IV.`;
    const [perKg, max] = value < 4 ? [25, 2500] : value <= 6 ? [35, 3500] : [50, 5000];
    return `INR ${value}, ${kg} kg: 4F-PCC ${perKg} units/kg = ${Math.min(pcc(perKg), max)} units (label max ${max}) + vitamin K 10 mg IV.`;
  }
  if (FXA.includes(agent)) return `${kg} kg, ${agent} (${timing}): 4F-PCC 50 units/kg = ${pcc(50)} units (local fixed dose 2000 units).`;
  if (agent === 'dabigatran') return `${kg} kg, dabigatran (${timing}): idarucizumab 5 g IV; if unavailable, 4F-PCC 50 units/kg = ${pcc(50)} units.`;
  return null;
}
