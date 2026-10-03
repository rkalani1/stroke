// Calendar-valid timestamps. A repeated local clock time has two possible
// instants; callers must obtain an explicit occurrence instead of choosing one.
export function timestampCandidates(value) {
  if (typeof value !== 'string') return [];
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!parts) return [];
  const [, y, mo, d, h, mi, s = '0', fraction = '', zone] = parts;
  const [year, month, day, hour, minute, second] = [y, mo, d, h, mi, s].map(Number);
  const milliseconds = Number(fraction.padEnd(3, '0'));
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1] || hour > 23 || minute > 59 || second > 59) return [];
  if (zone && zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59)) return [];
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return [];
  if (zone) return [parsed];
  const matchesLocal = date => date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day && date.getHours() === hour && date.getMinutes() === minute && date.getSeconds() === second && date.getMilliseconds() === milliseconds;
  // Date normalizes skipped local times forward; they must not become events.
  if (!matchesLocal(parsed)) return [];

  // Discover offsets on both sides of nearby transitions. The offset change is
  // observed, not assumed to be a one-hour daylight-saving transition.
  const offsets = new Set();
  for (let hours = -48; hours <= 48; hours += 6) offsets.add(new Date(parsed.getTime() + hours * 3600000).getTimezoneOffset());
  const instants = [...offsets].map(offset => parsed.getTime() + (offset - parsed.getTimezoneOffset()) * 60000);
  return [...new Set(instants)].sort((a, b) => a - b).map(instant => new Date(instant)).filter(matchesLocal);
}

export function parseTimestamp(value) {
  const candidates = timestampCandidates(value);
  return candidates.length === 1 ? candidates[0] : null;
}

const pad2 = number => String(number).padStart(2, '0');
// Exported clinical times are written as local wall time. A UTC offset is added
// only when that local clock time repeats (daylight-saving fall-back), so the
// recorded instant stays unambiguous. Invalid or ambiguous inputs are returned
// unchanged; callers flag them separately.
export function formatRecordedInstant(value) {
  const candidates = timestampCandidates(value);
  if (candidates.length !== 1) return value;
  const date = candidates[0];
  const seconds = /T\d{2}:\d{2}:\d{2}/.test(value) ? `:${pad2(date.getSeconds())}` : '';
  const local = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}${seconds}`;
  if (timestampCandidates(local).length < 2) return local.replace('T', ' ');
  const offset = -date.getTimezoneOffset(), absolute = Math.abs(offset);
  return `${local.replace('T', ' ')} (UTC${offset < 0 ? '−' : '+'}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)})`;
}
