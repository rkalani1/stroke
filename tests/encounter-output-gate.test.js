import { describe, expect, it, vi } from 'vitest';
import {
  createEncounterOutputGate,
  renderEncounterOutput,
  runEncounterOutput
} from '../src/encounter-output-gate.js';

describe('encounter output gate', () => {
  it('blocks incomplete encounters without evaluating or persisting output', () => {
    const gate = createEncounterOutputGate([{ name: 'Age' }, { name: 'LKW' }, { name: 'Diagnosis' }]);
    const buildOutput = vi.fn(() => 'generated note');
    const onBlocked = vi.fn();

    expect(runEncounterOutput(gate, buildOutput, onBlocked)).toEqual({ ok: false, value: null });
    expect(buildOutput).not.toHaveBeenCalled();
    expect(onBlocked).toHaveBeenCalledWith(gate);
    expect(renderEncounterOutput(gate, buildOutput)).toBe(
      'Output locked — complete Age, LKW, Diagnosis using synthetic information.'
    );
    expect(buildOutput).not.toHaveBeenCalled();
  });

  it('unlocks and relocks every output surface from the same required-field state', () => {
    const output = vi.fn(() => 'generated note');
    const ready = createEncounterOutputGate([]);
    const unlocked = runEncounterOutput(ready, output);

    expect(unlocked).toEqual({ ok: true, value: 'generated note' });
    expect(renderEncounterOutput(ready, output)).toBe('generated note');
    expect(output).toHaveBeenCalledTimes(2);

    const relocked = createEncounterOutputGate([{ name: 'Diagnosis' }]);
    expect(runEncounterOutput(relocked, output).ok).toBe(false);
    expect(renderEncounterOutput(relocked, output)).toContain('complete Diagnosis');
    expect(output).toHaveBeenCalledTimes(2);
  });
});
