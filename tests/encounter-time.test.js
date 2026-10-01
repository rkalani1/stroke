import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { localDateTimeInputValues, formatEncounterClock, elapsedEncounterTime } from '../src/clinical/encounter-time.js';

const appSource = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');

function withTimezone(timezone, run) {
  const previous = process.env.TZ;
  process.env.TZ = timezone;
  try { run(); } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

function authoredClockFunction(name, dependencies) {
  const start = appSource.indexOf(`const ${name} = () => `);
  if (start < 0) throw new Error(`Missing authored function ${name}`);
  const indent = appSource.slice(appSource.lastIndexOf('\n', start) + 1, start);
  const firstLineEnd = appSource.indexOf('\n', start);
  const isBlock = appSource.slice(start, firstLineEnd).trimEnd().endsWith('{');
  const end = isBlock ? appSource.indexOf(`\n${indent}};`, start) : firstLineEnd;
  if (end < 0) throw new Error(`Unterminated authored function ${name}`);
  return new Function(...Object.keys(dependencies), appSource.slice(start, isBlock ? end + indent.length + 4 : end) + `\nreturn ${name}();`)(...Object.values(dependencies));
}

function selectedReference(note, lkwTime) {
  return authoredClockFunction('getReferenceTime', {
    telestrokeNote: note, lkwTime,
    getDiscoveryDateTime: () => authoredClockFunction('getDiscoveryDateTime', { telestrokeNote: note })
  });
}

function compactWindow(input) {
  const statusStart = appSource.indexOf('const getWindowStatusFromTime = ');
  const hookStart = appSource.indexOf('const useStrokeWindow = ({', statusStart);
  const hookEnd = appSource.indexOf('\n        };', hookStart);
  if (statusStart < 0 || hookStart < 0 || hookEnd < 0) throw new Error('Missing authored compact window hook');
  const source = appSource.slice(statusStart, hookEnd + '\n        };'.length);
  return new Function('useMemo', 'elapsedEncounterTime', 'input', `${source}\nreturn useStrokeWindow(input);`)(callback => callback(), elapsedEncounterTime, input);
}

describe('compact window and critical-alert timing consumers', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  const input = { lkwDate: '2026-10-01', lkwTime: '08:00', lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '10:00', now };

  it.each([
    ['unknown onset', {}, 'Discovery', false],
    ['future discovery', { discoveryTime: '13:00' }, 'Discovery', true],
    ['future known LKW', { lkwUnknown: false, lkwTime: '13:00' }, 'LKW', true]
  ])('the actual compact hook never labels %s green or eligible for an open window', (_label, patch, label, futureWarning) => {
    withTimezone('UTC', () => {
      const result = compactWindow({ ...input, ...patch });
      expect(result.label).toBe(label);
      expect(result.timeFrom.futureWarning).toBe(futureWarning);
      expect(result.status.color).not.toBe('green');
      expect(result.status.eligible).toBe('unknown');
      expect(result.status.message).not.toMatch(/within IV thrombolysis window|window open/i);
      if (futureWarning) expect(result.status.message).toContain('Future time');
      else expect(result).toMatchObject({ timeFrom: { total: 2, seconds: 7200 }, status: { color: 'gray' } });
    });
  });

  it('the actual compact hook keeps blank discovery unknown despite a prior known LKW', () => {
    withTimezone('UTC', () => {
      expect(compactWindow({ ...input, discoveryTime: '' })).toEqual({ timeFrom: null, status: null, label: 'Discovery' });
    });
  });

  it('the actual compact hook retains the known-onset standard-window positive control', () => {
    withTimezone('UTC', () => {
      expect(compactWindow({ ...input, lkwUnknown: false, lkwTime: '10:00' })).toMatchObject({
        label: 'LKW', timeFrom: { total: 2, seconds: 7200, futureWarning: false },
        status: { color: 'green', eligible: 'tnk', urgent: false }
      });
    });
  });

  it.each([
    ['unknown onset near a discovery-based cutoff', true, '07:45', '08:00', []],
    ['unknown onset with blank discovery', true, '', '08:00', []],
    ['future discovery', true, '13:00', '08:00', []],
    ['future known LKW', false, '10:00', '13:00', []],
    ['known LKW near the TNK cutoff', false, '10:00', '07:45', ['tnk-cutoff']],
    ['known LKW near the early EVT cutoff', false, '10:00', '06:15', ['evt-cutoff']]
  ])('the actual critical-alert effect reconciles stale time alerts for %s', (_label, lkwUnknown, discoveryTime, knownTime, expectedTimeAlerts) => {
    withTimezone('UTC', () => {
      const marker = appSource.indexOf('// Monitor critical alerts');
      const effectStart = appSource.indexOf('useEffect(() => {', marker);
      const dependenciesStart = appSource.indexOf('\n          }, [', effectStart);
      const effectEnd = appSource.indexOf(']);', dependenciesStart) + 3;
      expect(marker).toBeGreaterThan(0);
      expect(effectEnd).toBeGreaterThan(dependenciesStart);
      const effectSource = appSource.slice(effectStart, effectEnd);
      for (const dependency of ['currentTime', 'lkwTime', 'telestrokeNote.lkwUnknown', 'telestrokeNote.discoveryDate', 'telestrokeNote.discoveryTime']) {
        expect(appSource.slice(dependenciesStart, effectEnd)).toContain(dependency);
      }
      const note = { lkwUnknown, discoveryDate: '2026-10-01', discoveryTime };
      const lkwTime = new Date(`2026-10-01T${knownTime}:00Z`);
      const retained = Object.freeze({ id: 'multi-tab', level: 'warning', message: 'Existing non-time warning' });
      let alerts = Object.freeze([
        Object.freeze({ id: 'tnk-cutoff', message: 'Stale TNK cutoff' }),
        Object.freeze({ id: 'evt-cutoff', message: 'Stale EVT cutoff' }), retained
      ]);
      let updates = 0;
      const dependencies = {
        elapsedEncounterTime, getReferenceTime: () => selectedReference(note, lkwTime),
        currentTime: now, lkwTime, telestrokeNote: note,
        useEffect: callback => callback(),
        setCriticalAlerts: update => { alerts = update(alerts); updates += 1; }
      };
      new Function(...Object.keys(dependencies), effectSource)(...Object.values(dependencies));
      expect(updates).toBe(1);
      expect(alerts.filter(alert => ['tnk-cutoff', 'evt-cutoff'].includes(alert.id)).map(alert => alert.id)).toEqual(expectedTimeAlerts);
      expect(alerts.find(alert => alert.id === 'multi-tab')).toBe(retained);
      expect(alerts).toHaveLength(expectedTimeAlerts.length + 1);
      expect(alerts.map(alert => alert.message).join('\n')).not.toMatch(/Stale TNK cutoff|Stale EVT cutoff/);
      if (expectedTimeAlerts.length) expect(alerts[0].message).toContain('Only 15 minutes left');
    });
  });
});

describe('elapsed time from the selected encounter reference', () => {
  const now = new Date('2026-10-01T12:00:00Z');

  it('reports two hours from Discovery with the same label and seconds', () => {
    expect(elapsedEncounterTime({ time: new Date('2026-10-01T10:00:00Z'), label: 'Discovery' }, now)).toEqual({
      hours: 2, minutes: 0, total: 2, seconds: 7200, label: 'Discovery', futureWarning: false
    });
  });

  it('keeps whole seconds and minute components consistent for a non-hour interval', () => {
    const result = elapsedEncounterTime({ time: new Date('2026-10-01T09:56:15Z'), label: 'LKW' }, now);
    expect(result).toMatchObject({ hours: 2, minutes: 3, seconds: 7425, label: 'LKW', futureWarning: false });
    expect(result.total).toBeCloseTo(7425 / 3600, 12);
  });

  it.each([null, undefined, {}, { time: null }, { time: new Date(NaN) }, { time: Infinity }])('withholds elapsed time for missing or invalid reference %j', reference => {
    expect(elapsedEncounterTime(reference, now)).toBeNull();
  });

  it.each([new Date(NaN), Infinity, null])('withholds elapsed time for invalid current time %j', invalidNow => {
    expect(elapsedEncounterTime({ time: new Date('2026-10-01T10:00:00Z'), label: 'Discovery' }, invalidNow)).toBeNull();
  });

  it('distinguishes a future reference from a documented zero interval', () => {
    const future = elapsedEncounterTime({ time: new Date('2026-10-01T13:00:00Z'), label: 'Discovery' }, now);
    expect(future).toEqual({ hours: 0, minutes: 0, total: 0, seconds: 0, label: 'Discovery', futureWarning: true });
    expect(elapsedEncounterTime({ time: new Date(now), label: 'Discovery' }, now)).toEqual({ ...future, futureWarning: false });
  });

  it('the authored unknown-onset reference ignores old LKW and responds to discovery edits and clears', () => {
    withTimezone('UTC', () => {
      const oldLkw = new Date('2026-09-29T08:00:00Z');
      const note = { lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '10:00' };
      const first = selectedReference(note, oldLkw);
      expect(first).toEqual({ time: new Date('2026-10-01T10:00:00Z'), label: 'Discovery' });
      expect(elapsedEncounterTime(first, now)).toMatchObject({ total: 2, seconds: 7200, label: 'Discovery' });
      expect(elapsedEncounterTime(selectedReference({ ...note, discoveryTime: '11:15' }, oldLkw), now)).toMatchObject({ hours: 0, minutes: 45, total: 0.75, seconds: 2700, label: 'Discovery' });
      for (const patch of [{ discoveryDate: '' }, { discoveryTime: '' }, { discoveryDate: '', discoveryTime: '' }]) {
        expect(selectedReference({ ...note, ...patch }, oldLkw)).toBeNull();
        expect(elapsedEncounterTime(selectedReference({ ...note, ...patch }, oldLkw), now)).toBeNull();
      }
      expect(elapsedEncounterTime(selectedReference({ ...note, lkwUnknown: false }, oldLkw), now)).toMatchObject({ total: 52, seconds: 187200, label: 'LKW' });
    });
  });

  it('uses the local discovery calendar across midnight west of UTC', () => {
    withTimezone('America/Los_Angeles', () => {
      const reference = selectedReference({ lkwUnknown: true, discoveryDate: '2026-09-30', discoveryTime: '23:30' }, new Date('2026-09-29T00:00:00Z'));
      expect(reference.time.toISOString()).toBe('2026-10-01T06:30:00.000Z');
      expect(elapsedEncounterTime(reference, new Date('2026-10-01T08:30:00Z'))).toEqual({ hours: 2, minutes: 0, total: 2, seconds: 7200, label: 'Discovery', futureWarning: false });
    });
  });

  it('both visible timer calculations return the same selected seconds and label', () => {
    withTimezone('UTC', () => {
      const note = { lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '10:00' };
      const reference = selectedReference(note, new Date('2026-09-29T08:00:00Z'));
      for (const marker of ['PERSISTENT TIMER STRIP', 'Treatment Window Countdown - Enhanced']) {
        const start = appSource.indexOf(marker);
        expect(start).toBeGreaterThan(0);
        const declaration = appSource.slice(start, start + 1000).match(/const timeFromLKW = [^\n]+;/)?.[0];
        expect(declaration).toContain('elapsedEncounterTime(getReferenceTime(), currentTime)');
        const output = new Function('elapsedEncounterTime', 'getReferenceTime', 'currentTime', `${declaration}\nreturn timeFromLKW;`)(elapsedEncounterTime, () => reference, now);
        expect(output).toEqual({ hours: 2, minutes: 0, total: 2, seconds: 7200, label: 'Discovery', futureWarning: false });
      }
    });
  });

  it.each([
    ['Discovery two hours ago with an old LKW', true, '10:00', 7200, []],
    ['Discovery at an ordinary LKW alert threshold', true, '08:00', 14400, []],
    ['known LKW at its alert threshold', false, '10:00', 14400, ['warning-30']],
    ['missing discovery with an old LKW', true, '', 0, []],
    ['future discovery with an old LKW', true, '13:00', 0, []]
  ])('the actual timer effect uses %s consistently', (_label, lkwUnknown, discoveryTime, seconds, expectedAlerts) => {
    withTimezone('UTC', () => {
      const callbackStart = appSource.indexOf('const checkAlertsAndUpdate = () => {');
      const effectStart = appSource.lastIndexOf('useEffect(() => {', callbackStart);
      const dependenciesStart = appSource.indexOf('\n          }, [', callbackStart);
      const effectEnd = appSource.indexOf(']);', dependenciesStart) + 3;
      expect(callbackStart).toBeGreaterThan(0);
      expect(effectEnd).toBeGreaterThan(dependenciesStart);
      const effectSource = appSource.slice(effectStart, effectEnd);
      for (const dependency of ['lkwTime', 'telestrokeNote.lkwUnknown', 'telestrokeNote.discoveryDate', 'telestrokeNote.discoveryTime']) {
        expect(appSource.slice(dependenciesStart, effectEnd)).toContain(dependency);
      }
      expect(effectSource).toContain('clock.futureWarning');
      const note = { lkwUnknown, discoveryDate: '2026-10-01', discoveryTime };
      const oldLkw = new Date('2026-10-01T08:00:00Z');
      const updates = [], alerts = [];
      let tick, cleanup;
      let clockNow = now;
      class SyntheticDate extends Date {
        constructor(...args) { super(...(args.length ? args : [clockNow.getTime()])); }
      }
      const dependencies = {
        Date: SyntheticDate, elapsedEncounterTime, telestrokeNote: note, lkwTime: oldLkw, alertsMuted: false,
        getReferenceTime: () => selectedReference(note, oldLkw),
        useEffect: callback => { cleanup = callback(); },
        setElapsedSeconds: value => updates.push(value), setCurrentTime: () => {},
        document: { hidden: false }, lastAlertPlayedRef: { current: null }, alertFlashTimeoutRef: { current: null },
        setLastAlertPlayed: () => {}, setAlertFlashing: () => {}, playAlertTone: value => alerts.push(value),
        setTimeout: () => 2, clearTimeout: () => {},
        setInterval: callback => { tick = callback; return 1; }, clearInterval: () => {}
      };
      new Function(...Object.keys(dependencies), effectSource)(...Object.values(dependencies));
      expect(updates).toEqual([seconds]);
      expect(alerts).toEqual(expectedAlerts);
      if (discoveryTime || !lkwUnknown) {
        expect(tick).toBeTypeOf('function');
        clockNow = new Date(now.getTime() + 1000);
        tick();
        expect(updates.at(-1)).toBe(discoveryTime === '13:00' ? 0 : seconds + 1);
        expect(alerts).toEqual(expectedAlerts);
        expect(cleanup).toBeTypeOf('function');
        cleanup();
      } else {
        expect(tick).toBeUndefined();
      }
    });
  });

  it('resets prior window warnings when the reference selection or discovery fields change', () => {
    const resetStart = appSource.indexOf('lastAlertPlayedRef.current = null;', appSource.indexOf('const checkAlertsAndUpdate = () => {'));
    const resetEnd = appSource.indexOf(']);', resetStart) + 3;
    const resetEffect = appSource.slice(resetStart, resetEnd);
    expect(resetEffect).toContain('setLastAlertPlayed(null)');
    expect(resetEffect).toContain('setAlertFlashing(false)');
    for (const dependency of ['lkwTime', 'telestrokeNote.lkwUnknown', 'telestrokeNote.discoveryDate', 'telestrokeNote.discoveryTime']) {
      expect(resetEffect).toContain(dependency);
    }
  });
});

describe('documented encounter time', () => {
  it.each([
    ['America/Los_Angeles', '2026-10-01T02:05:00Z', '2026-09-30', '19:05'],
    ['Asia/Kolkata', '2026-09-30T20:05:00Z', '2026-10-01', '01:35'],
    ['UTC', '2026-10-01T00:05:00Z', '2026-10-01', '00:05']
  ])('pairs the local date and clock for Use Now in %s', (timezone, instant, date, time) => {
    withTimezone(timezone, () => {
      expect(localDateTimeInputValues(new Date(instant))).toEqual({ date, time });
    });
  });

  it.each([
    ['', ''], [undefined, ''], ['00:00', '12:00 am'], ['09:05', '9:05 am'],
    ['12:00', '12:00 pm'], ['23:59:30', '11:59 pm'], ['24:01', '24:01'], ['not documented', 'not documented']
  ])('formats the entered clock %j without substituting the current time', (input, expected) => {
    expect(formatEncounterClock(input)).toBe(expected);
  });

  it('both actual onset controls preserve blank and previously documented discovery fields', () => {
    const controls = [...appSource.matchAll(/ariaLabel="Last Known Well type"/g)];
    expect(controls).toHaveLength(2);
    for (const control of controls) {
      const section = appSource.slice(control.index, appSource.indexOf('/>', control.index));
      const body = section.match(/onChange=\{\(id\) => \{([\s\S]*?)\n\s+\}\}/)?.[1];
      expect(body).toBeTruthy();
      const run = new Function('id', 'setTelestrokeNote', body);
      for (const discovery of [
        { discoveryDate: '', discoveryTime: '' },
        { discoveryDate: '2026-09-30', discoveryTime: '19:05' }
      ]) {
        let note = Object.freeze({
          lkwUnknown: false, lkwDate: '2026-09-29', lkwTime: '14:00', ...discovery,
          wakeUpStrokeWorkflow: { isWakeUpStroke: false, mriAvailable: true }
        });
        const update = fn => { note = fn(note); };
        run('wakeup', update);
        expect(note).toMatchObject({ lkwUnknown: true, ...discovery, wakeUpStrokeWorkflow: { isWakeUpStroke: true, mriAvailable: true } });
        run('known', update);
        expect(note).toMatchObject({ lkwUnknown: false, ...discovery, wakeUpStrokeWorkflow: { isWakeUpStroke: false, mriAvailable: true } });
      }
    }
  });

  it('the actual explicit Use Now handler records a local date/time pair in both workflow buttons', () => {
    expect(appSource.match(/onClick=\{setDiscoveryTimeToNow\}/g)).toHaveLength(2);
    expect(appSource.match(/aria-label="Set discovery time to now"/g)).toHaveLength(2);
    const body = appSource.match(/const setDiscoveryTimeToNow = \(\) => \{([\s\S]*?)\n\s+\};/)?.[1];
    expect(body).toBeTruthy();
    withTimezone('America/Los_Angeles', () => {
      let note = Object.freeze({ lkwUnknown: true, discoveryDate: '', discoveryTime: '', lkwDate: '2026-09-29' });
      const run = new Function('localDateTimeInputValues', 'setTelestrokeNote', body);
      run(() => localDateTimeInputValues(new Date('2026-10-01T02:05:00Z')), fn => { note = fn(note); });
      expect(note).toEqual({ lkwUnknown: true, discoveryDate: '2026-09-30', discoveryTime: '19:05', lkwDate: '2026-09-29' });
    });
  });
});
