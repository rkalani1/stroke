// IndexedDB-backed patient census for approved/private deployments only.
// Public GitHub Pages builds disable this workflow and must not store PHI.
// Design goals:
// 1. Multi-patient census for ward rounds (8-20 patients typical).
// 2. Per-patient encounter state (fully isolated from acute-telestroke state).
// 3. Use only synthetic placeholders unless the deployment has organization-approved
//    storage, access control, security review, and local governance.
// 4. Graceful fallback to localStorage if IndexedDB blocked (e.g., private-mode Safari before iOS 15).
// 5. Zero external dependencies — avoids Dexie to keep the bundle lean.

const DB_NAME = 'strokeAppCensus';
const DB_VERSION = 1;
const STORE_NAME = 'patients';
const LS_FALLBACK_KEY = 'strokeApp:patientCensus:lsFallback';

let dbPromise = null;

const openDB = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return; }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (evt) => {
        const db = evt.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('service', 'service', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { console.warn('IndexedDB open failed; falling back to localStorage', req.error); resolve(null); };
      req.onblocked = () => resolve(null);
    } catch (err) {
      console.warn('IndexedDB exception; falling back to localStorage', err);
      resolve(null);
    }
  });
  return dbPromise;
};

// Fallback helpers
const lsReadMap = () => {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.reduce((acc, patient) => {
        if (patient && patient.id) acc[patient.id] = patient;
        return acc;
      }, {});
    }
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) { return {}; }
};
const lsWriteMap = (patientsById) => {
  try { localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(patientsById)); return true; } catch (_) { return false; }
};

export const generatePatientId = () => {
  // UUID-like id; use crypto when available.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    return `p_${Date.now().toString(36)}_${array[0].toString(36)}${array[1].toString(36)}`;
  }
  throw new Error('Secure random number generation is not supported by this environment');
};

export const makePatientStub = ({ initials, mrnLast4, birthYear, service = 'stroke', label = '' } = {}) => {
  const now = new Date().toISOString();
  return {
    id: generatePatientId(),
    initials: (initials || '').trim().toUpperCase().slice(0, 3),
    mrnLast4: (mrnLast4 || '').trim().slice(-4),
    birthYear: birthYear ? String(birthYear).slice(0, 4) : '',
    service,
    status: 'active',
    label,
    strokeDay: 0,
    encounter: {},                 // holds the full telestrokeNote snapshot
    decisionLog: [],               // timestamped decisions (existing feature)
    createdAt: now,
    updatedAt: now,
    lastSavedAt: now
  };
};

export const listPatients = async (filter = {}) => {
  const db = await openDB();
  if (!db) return Object.values(lsReadMap()).filter(filterPatient(filter)).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result || []).filter(filterPatient(filter));
      all.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      resolve(all);
    };
    req.onerror = () => resolve([]);
  });
};

const filterPatient = (filter) => (p) => {
  if (filter.status && p.status !== filter.status) return false;
  if (filter.service && p.service !== filter.service) return false;
  return true;
};

export const savePatient = async (patient) => {
  const toSave = { ...patient, updatedAt: new Date().toISOString(), lastSavedAt: new Date().toISOString() };
  const db = await openDB();
  if (!db) {
    const patientsById = lsReadMap();
    patientsById[toSave.id] = toSave;
    lsWriteMap(patientsById);
    return toSave;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(toSave);
    req.onsuccess = () => resolve(toSave);
    req.onerror = () => reject(req.error);
  });
};

export const getPatient = async (id) => {
  const db = await openDB();
  if (!db) return lsReadMap()[id] || null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
};

export const deletePatient = async (id) => {
  const db = await openDB();
  if (!db) {
    const patientsById = lsReadMap();
    delete patientsById[id];
    lsWriteMap(patientsById);
    return true;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
  });
};

export const exportPatientsJSON = async () => {
  const patients = await listPatients();
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    appVersion: 'stroke-cds',
    count: patients.length,
    patients
  }, null, 2);
};

export const savePatientsBatch = async (patients) => {
  const now = new Date().toISOString();
  const processed = patients.map((p) => ({
    ...p,
    updatedAt: now,
    lastSavedAt: now
  }));
  const db = await openDB();
  if (!db) {
    const patientsById = lsReadMap();
    for (const p of processed) {
      patientsById[p.id] = p;
    }
    lsWriteMap(patientsById);
    return processed;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    tx.oncomplete = () => resolve(processed);
    tx.onerror = () => reject(tx.error);
    for (const p of processed) {
      store.put(p);
    }
  });
};

export const importPatientsJSON = async (json) => {
  try {
    const data = JSON.parse(json);
    const patients = Array.isArray(data) ? data : (data.patients || []);
    await savePatientsBatch(patients);
    return { imported: patients.length };
  } catch (err) {
    return { error: err.message || 'Invalid JSON' };
  }
};

// ===== Auto-save helper =====
// Debounced save that records the time-of-save so the UI can display "Saved Xs ago".

export const createAutoSaver = (getPatient, delayMs = 1500) => {
  let t = null;
  let lastSaveAt = null;
  let subscribers = [];
  const notify = () => subscribers.forEach((fn) => fn(lastSaveAt));
  const flush = async () => {
    const p = getPatient();
    if (!p || !p.id) return;
    try { await savePatient(p); lastSaveAt = new Date(); notify(); } catch (e) { console.warn('autoSave failed', e); }
  };
  const schedule = () => {
    if (t) clearTimeout(t);
    t = setTimeout(flush, delayMs);
  };
  const subscribe = (fn) => { subscribers.push(fn); return () => { subscribers = subscribers.filter((s) => s !== fn); }; };
  const now = () => lastSaveAt;
  return { schedule, flush, subscribe, now };
};
