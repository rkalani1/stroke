import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import 'fake-indexeddb/auto';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
  };
})();

// Assign to globalThis before any imports might use it
globalThis.localStorage = localStorageMock;

describe('patient-store', () => {
  let patientStore;

  beforeEach(async () => {
    // Re-import module to reset internal state (dbPromise)
    vi.resetModules();
    patientStore = await import('../src/patient-store.js');

    if (globalThis.localStorage) {
      globalThis.localStorage.clear();
    }

    // Reset IndexedDB for each test
    const { IDBFactory } = await import('fake-indexeddb');
    globalThis.indexedDB = new IDBFactory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('generatePatientId', () => {
    it('generates a string ID', () => {
      const id = patientStore.generatePatientId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(5);
    });

    it('uses crypto.randomUUID when available', () => {
      const mockUUID = '1234-5678-90ab-cdef';
      vi.stubGlobal('crypto', { randomUUID: vi.fn(() => mockUUID) });

      expect(patientStore.generatePatientId()).toBe(mockUUID);

      vi.unstubAllGlobals();
    });

    it('falls back to Math.random when crypto is unavailable', () => {
      vi.stubGlobal('crypto', undefined);

      const id = patientStore.generatePatientId();
      expect(id).toMatch(/^p_/);

      vi.unstubAllGlobals();
    });
  });

  describe('makePatientStub', () => {
    it('creates a patient object with defaults', () => {
      const stub = patientStore.makePatientStub({ initials: 'JD', mrnLast4: '1234', birthYear: '1980' });
      expect(stub.initials).toBe('JD');
      expect(stub.mrnLast4).toBe('1234');
      expect(stub.birthYear).toBe('1980');
      expect(stub.status).toBe('active');
      expect(stub.id).toBeDefined();
    });

    it('trims and slices inputs', () => {
      const stub = patientStore.makePatientStub({ initials: '  abcde  ', mrnLast4: '987654321', birthYear: '20230101' });
      expect(stub.initials).toBe('ABC');
      expect(stub.mrnLast4).toBe('4321');
      expect(stub.birthYear).toBe('2023');
    });
  });

  describe('IndexedDB Operations', () => {
    it('saves and gets a patient', async () => {
      const patient = patientStore.makePatientStub({ initials: 'TS' });
      const saved = await patientStore.savePatient(patient);
      expect(saved.initials).toBe('TS');

      const retrieved = await patientStore.getPatient(patient.id);
      expect(retrieved.id).toBe(patient.id);
      expect(retrieved.initials).toBe('TS');
    });

    it('lists patients and filters them', async () => {
      await patientStore.savePatient(patientStore.makePatientStub({ initials: 'P1', service: 'stroke' }));
      await patientStore.savePatient(patientStore.makePatientStub({ initials: 'P2', service: 'neuro' }));
      const p3 = patientStore.makePatientStub({ initials: 'P3', service: 'stroke' });
      p3.status = 'archived';
      await patientStore.savePatient(p3);

      const all = await patientStore.listPatients();
      expect(all.length).toBe(3);

      const strokeOnly = await patientStore.listPatients({ service: 'stroke' });
      expect(strokeOnly.length).toBe(2);

      const activeStroke = await patientStore.listPatients({ service: 'stroke', status: 'active' });
      expect(activeStroke.length).toBe(1);
      expect(activeStroke[0].initials).toBe('P1');
    });

    it('saves a batch of patients', async () => {
      const p1 = patientStore.makePatientStub({ initials: 'B1' });
      const p2 = patientStore.makePatientStub({ initials: 'B2' });
      const saved = await patientStore.savePatientsBatch([p1, p2]);
      expect(saved.length).toBe(2);
      expect(saved[0].initials).toBe('B1');
      expect(saved[1].initials).toBe('B2');

      const retrieved1 = await patientStore.getPatient(p1.id);
      expect(retrieved1.initials).toBe('B1');
      const retrieved2 = await patientStore.getPatient(p2.id);
      expect(retrieved2.initials).toBe('B2');
    });

    it('deletes a patient', async () => {
      const patient = await patientStore.savePatient(patientStore.makePatientStub({ initials: 'DEL' }));
      expect(await patientStore.getPatient(patient.id)).not.toBeNull();

      const success = await patientStore.deletePatient(patient.id);
      expect(success).toBe(true);
      expect(await patientStore.getPatient(patient.id)).toBeNull();
    });
  });

  describe('LocalStorage Fallback', () => {
    it('falls back to localStorage for save and get', async () => {
      vi.stubGlobal('indexedDB', undefined);

      const patient = patientStore.makePatientStub({ initials: 'LS' });
      await patientStore.savePatient(patient);

      const retrieved = await patientStore.getPatient(patient.id);
      expect(retrieved.initials).toBe('LS');

      expect(globalThis.localStorage.setItem).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('falls back to localStorage for batch save', async () => {
      vi.stubGlobal('indexedDB', undefined);

      const p1 = patientStore.makePatientStub({ initials: 'L1' });
      const p2 = patientStore.makePatientStub({ initials: 'L2' });
      await patientStore.savePatientsBatch([p1, p2]);

      const retrieved1 = await patientStore.getPatient(p1.id);
      expect(retrieved1.initials).toBe('L1');
      const retrieved2 = await patientStore.getPatient(p2.id);
      expect(retrieved2.initials).toBe('L2');

      vi.unstubAllGlobals();
    });
  });

  describe('JSON Import/Export', () => {
    it('exports patients to JSON string', async () => {
      const p = patientStore.makePatientStub({ initials: 'EX' });
      await patientStore.savePatient(p);
      const json = await patientStore.exportPatientsJSON();
      const parsed = JSON.parse(json);
      expect(parsed.count).toBeGreaterThan(0);
      expect(parsed.patients.some(p => p.initials === 'EX')).toBe(true);
    });

    it('imports patients from JSON string', async () => {
      const data = {
        patients: [
          patientStore.makePatientStub({ initials: 'IM1' }),
          patientStore.makePatientStub({ initials: 'IM2' })
        ]
      };
      const result = await patientStore.importPatientsJSON(JSON.stringify(data));
      expect(result.imported).toBe(2);

      const p1 = await patientStore.getPatient(data.patients[0].id);
      expect(p1.initials).toBe('IM1');
    });

    it('handles invalid JSON during import', async () => {
      const result = await patientStore.importPatientsJSON('invalid-json');
      expect(result.error).toBeDefined();
    });
  });

  describe('createAutoSaver', () => {
    it('schedules and flushes saves', async () => {
      const patient = patientStore.makePatientStub({ initials: 'AS' });
      const getPatientFn = vi.fn(() => patient);
      const autoSaver = patientStore.createAutoSaver(getPatientFn, 10);

      const subscribeFn = vi.fn();
      autoSaver.subscribe(subscribeFn);

      autoSaver.schedule();

      // Wait for it to happen for real but quickly
      await new Promise(r => setTimeout(r, 50));

      expect(subscribeFn).toHaveBeenCalled();
      const savedPatient = await patientStore.getPatient(patient.id);
      expect(savedPatient.initials).toBe('AS');
    });

    it('flushes immediately when requested', async () => {
      const patient = patientStore.makePatientStub({ initials: 'FL' });
      const getPatientFn = vi.fn(() => patient);
      const autoSaver = patientStore.createAutoSaver(getPatientFn, 1000);

      await autoSaver.flush();

      const savedPatient = await patientStore.getPatient(patient.id);
      expect(savedPatient.initials).toBe('FL');
    });
  });
});
