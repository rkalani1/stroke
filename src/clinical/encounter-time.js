// Date and time inputs both use the user's local calendar. Combining a UTC date
// with a local clock can invent a different day around midnight.
export function localDateTimeInputValues(now = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`
  };
}

export function formatEncounterClock(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return String(value);
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? 'pm' : 'am'}`;
}

// The displayed label and elapsed value must use the same selected reference.
// Discovery measures recognition time; it does not establish onset or LKW.
export function elapsedEncounterTime(reference, now = new Date()) {
  const referenceMs = reference?.time?.getTime?.();
  const nowMs = now?.getTime?.();
  if (!Number.isFinite(referenceMs) || !Number.isFinite(nowMs)) return null;
  const diffMs = nowMs - referenceMs;
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  return {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    total: Math.max(0, diffMs / 3600000),
    seconds,
    label: reference.label,
    futureWarning: diffMs < 0
  };
}
