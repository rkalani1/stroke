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
  return Number.isFinite(number) ? String(unit === 'lb' ? Number((number * 0.45359237).toFixed(6)) : number) : '';
}
export function displayWeight(value, unit) {
  if (value === '' || unit !== 'lb') return value;
  return Number.isFinite(Number(value)) ? String(Number((Number(value) / 0.45359237).toFixed(2))) : '';
}
export function nihssKeyboardOption(item, key) {
  if (/^[0-4]$/.test(key)) return item.options.find(option => option.endsWith(`(${key})`));
  if (key.toLowerCase() === 'u') return item.options.find(option => option.includes('(UN)'));
}
