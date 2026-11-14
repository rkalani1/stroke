import { reviewedNumber } from './reviewed-number.js';

const LB_KG = 0.45359237;
export const MRS_OPTIONS = [
  ['', 'Not assessed'], ['0', '0 · No symptoms'], ['1', '1 · No significant disability'],
  ['2', '2 · Slight disability; independent in own affairs'], ['3', '3 · Some help; walks independently'],
  ['4', '4 · Help with walking and bodily needs'], ['5', '5 · Constant nursing care'], ['6', '6 · Death']
];
export function weightInKg(value, unit) {
  if (value === '') return '';
  const number = Number(value);
  // Unit conversion precision is one milligram. Avoid floating-point tails in
  // the field, copied note and numeric-identifier scan.
  return Number.isFinite(number) ? String(unit === 'lb' ? Number((number * LB_KG).toFixed(6)) : number) : '';
}
export function displayWeight(value, unit) {
  if (value === '' || unit !== 'lb') return value;
  return Number.isFinite(Number(value)) ? String(Number((Number(value) / LB_KG).toFixed(2))) : '';
}
// The dose arithmetic and the note read weights up to 350 kg. In pounds the field's maximum is the largest
// 0.01 lb entry within that (771.61 lb = 349.996 kg; 771.62 lb is 350.0009 kg, which no dose reads).
export const weightLimit = unit => unit === 'lb' ? Math.floor(350 / LB_KG * 100) / 100 : 350;
// The range in which the Encounter uses each number entry, as the generated note reads it (workspace-state.js;
// height and the ABC/2 inputs as the renal and volume calculations read them): [min, max, min excluded, whole
// numbers only]. The note flags any other entry "[… invalid; correct before interpretation]". An entry the note
// accepts is used even where a narrower screen rejects it (a pediatric age).
export const ENTRY_RANGES = { age: [0, 120], sbp: [1, 400], dbp: [1, 300], glucose: [0, 2000, 1], heartRate: [0, 300, 1], spO2: [0, 100, 1], temperature: [80, 115], plateletCount: [0], pt: [0, 300, 1], inr: [0, 20, 1], ptt: [0, 300, 1], creatinine: [0, 30, 1], heightCm: [0, 300, 1], coreVolume: [0], penumbraVolume: [0], a: [0, , 1], b: [0, , 1], thicknessMm: [0, , 1], numSlices: [1, , 0, 1], administeredDose: [0, 100, 1], abcd2: [0, 7, 0, 1] };
// undefined: nothing entered (or no range to check); false: the entry is in range; otherwise the message, which
// states `shown` (the weight's range in the selected unit).
export function entryIssue(value, range, shown = range) {
  if (!range || String(value ?? '').trim() === '') return undefined;
  const [min = -Infinity, max = Infinity, above, whole] = range, number = reviewedNumber(value);
  if (number !== null && (above ? number > min : number >= min) && number <= max && (!whole || Number.isInteger(number))) return false;
  const [low, high = Infinity, over, integer] = shown;
  return `Out of range: enter ${integer ? 'a whole number ' : ''}${high < Infinity ? `${over ? `above ${low}, up` : integer ? `from ${low}` : low} to ${high}` : over ? `above ${low}` : `${integer ? 'of ' : ''}${low} or more`}.`;
}
export function nihssKeyboardOption(item, key) {
  if (/^[0-4]$/.test(key)) return item.options.find(option => option.endsWith(`(${key})`));
  if (key.toLowerCase() === 'u') return item.options.find(option => option.includes('(UN)'));
}
