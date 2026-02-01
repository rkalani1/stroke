        const { useState, useEffect, useRef } = React;
        const { Calculator, Clock, Brain, AlertTriangle, FileText, CheckCircle, Moon, Sun, Download, Copy, Search, Check, Info } = lucide;

        const APP_VERSION = (window.strokeAppStorage && window.strokeAppStorage.appVersion) || 'unknown';
        const STORAGE_PREFIX = (window.strokeAppStorage && window.strokeAppStorage.prefix) || 'strokeApp:';
        const APP_DATA_KEY = (window.strokeAppStorage && window.strokeAppStorage.appDataKey) || 'stroke.appData.v2';
        const LEGACY_KEYS = (window.strokeAppStorage && window.strokeAppStorage.legacyKeys) || [
          'app_version',
          'darkMode',
          'activeTab',
          'patientData',
          'nihssScore',
          'aspectsScore',
          'gcsItems',
          'mrsScore',
          'ichScoreItems',
          'abcd2Items',
          'chads2vascItems',
          'ropeItems',
          'huntHessGrade',
          'wfnsGrade',
          'hasbledItems',
          'rcvs2Items',
          'strokeCodeForm',
          'lkwTime',
          'currentStep',
          'completedSteps',
          'aspectsRegionState',
          'pcAspectsRegions',
          'telestrokeNote',
          'telestrokeTemplate',
          'thrombolysisAlertsMuted',
          'timerSidebarCollapsed',
          'shiftPatients',
          'currentPatientId',
          'consultationType',
          'ttlHoursOverride',
          'lastUpdated',
          'legacyMigrated'
        ];
        const LEGACY_SESSION_KEYS = (window.strokeAppStorage && window.strokeAppStorage.legacySessionKeys) || ['error_reload_attempted'];
        const DEFAULT_TTL_HOURS = 12;
        const LAST_UPDATED_KEY = 'lastUpdated';
        const LEGACY_MIGRATION_KEY = 'legacyMigrated';
        const APP_DATA_SCHEMA_VERSION = 1;
        const DEFAULT_CONTACTS = [
          { id: 'stroke-phone', label: 'Stroke Phone', phone: '206-744-6789', note: '' },
          { id: 'stat-pharmacy', label: 'STAT Pharmacy', phone: '206-744-2241', note: '' },
          { id: 'rad-hotline', label: 'Stroke RAD Hotline', phone: '206-744-8484', note: 'Weekdays 8-5' },
          { id: 'angio-suite', label: 'Angio Suite', phone: '206-744-3381', note: '' },
          { id: 'stat-ct', label: 'STAT CT', phone: '206-744-7290', note: '' }
        ];

        const parseStoredValue = (raw) => {
          if (raw === null || raw === undefined) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        };

        const normalizeStoredValue = (value, fallback) => {
          if (value === undefined || value === null || value === 'undefined' || value === 'null') {
            return fallback;
          }
          if (typeof value === 'object' && value !== null && 'data' in value && 'expiresAt' in value) {
            if (typeof value.expiresAt === 'number' && Date.now() > value.expiresAt) {
              return fallback;
            }
            return value.data;
          }
          return value;
        };

        const getKey = (name, fallback) => {
          const namespaced = localStorage.getItem(STORAGE_PREFIX + name);
          if (namespaced !== null) {
            return normalizeStoredValue(parseStoredValue(namespaced), fallback);
          }
          const legacy = localStorage.getItem(name);
          if (legacy !== null) {
            return normalizeStoredValue(parseStoredValue(legacy), fallback);
          }
          return fallback;
        };

        const touchLastUpdated = () => {
          try {
            localStorage.setItem(STORAGE_PREFIX + LAST_UPDATED_KEY, JSON.stringify(Date.now()));
          } catch (e) {
            console.warn('Failed to update lastUpdated:', e);
          }
        };

        const setKey = (name, value, options = {}) => {
          try {
            localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(value));
            if (!options.skipLastUpdated && name !== LAST_UPDATED_KEY) {
              touchLastUpdated();
            }
          } catch (e) {
            console.warn('Failed to save key:', name, e);
          }
        };

        const removeKey = (name) => {
          localStorage.removeItem(STORAGE_PREFIX + name);
          localStorage.removeItem(name);
        };

        const clearAllAppStorage = () => {
          if (window.strokeAppStorage && typeof window.strokeAppStorage.clearAppStorage === 'function') {
            window.strokeAppStorage.clearAppStorage({ includeLegacy: true });
            return;
          }
          try {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key);
              }
            });
            localStorage.removeItem(APP_DATA_KEY);
            LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
            Object.keys(sessionStorage).forEach((key) => {
              if (key.startsWith(STORAGE_PREFIX)) {
                sessionStorage.removeItem(key);
              }
            });
            LEGACY_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
          } catch (e) {
            console.warn('Storage clear failed:', e);
          }
        };

        const migrateLegacyStorage = () => {
          try {
            const migrated = localStorage.getItem(STORAGE_PREFIX + LEGACY_MIGRATION_KEY);
            if (migrated) return;
            LEGACY_KEYS.forEach((key) => {
              const legacyValue = localStorage.getItem(key);
              if (legacyValue === null) return;
              const parsed = parseStoredValue(legacyValue);
              const normalized = normalizeStoredValue(parsed, undefined);
              if (normalized !== undefined) {
                localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(normalized));
              }
            });
            localStorage.setItem(STORAGE_PREFIX + LEGACY_MIGRATION_KEY, JSON.stringify(true));
          } catch (e) {
            console.warn('Legacy storage migration failed:', e);
          }
        };

        const ensureArray = (value, fallback = []) => Array.isArray(value) ? value : fallback;
        const toIsoString = (value = new Date()) => {
          try {
            return new Date(value).toISOString();
          } catch {
            return new Date().toISOString();
          }
        };
        const formatLocalDateTime = (value) => {
          if (!value) return '';
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return '';
          return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        };

        const generateId = (prefix = 'id') => {
          const stamp = Date.now().toString(36);
          const rand = Math.random().toString(36).slice(2, 8);
          return `${prefix}_${stamp}_${rand}`;
        };

        const copyPlainText = async (text) => {
          try {
            await navigator.clipboard.writeText(text);
            return true;
          } catch (e) {
            console.warn('Clipboard copy failed:', e);
            return false;
          }
        };


        const copyWithSectionHeaders = async (sections) => {
          const content = sections
            .filter(section => section && section.body && section.body.trim())
            .map(section => `=== ${section.title} ===\n${section.body}`)
            .join('\n\n');
          if (!content.trim()) return false;
          return copyPlainText(content.trim());
        };

        const exportJSON = (fileName, data) => {
          try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
          } catch (e) {
            console.warn('Export failed:', e);
          }
        };


        const importJSON = (file) => {
          return new Promise((resolve, reject) => {
            if (!file) {
              reject(new Error('No file provided'));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const parsed = JSON.parse(reader.result);
                if (!parsed || typeof parsed !== 'object') {
                  reject(new Error('Invalid JSON structure'));
                  return;
                }
                resolve(parsed);
              } catch (e) {
                reject(e);
              }
            };
            reader.onerror = () => reject(reader.error || new Error('File read failed'));
            reader.readAsText(file);
          });
        };

        const DEID_PATTERNS = [
          { id: 'mrn', label: 'Possible MRN (long numeric ID)', regex: /\b\d{7,}\b/ },
          { id: 'dob', label: 'Possible DOB/date', regex: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/ },
          { id: 'phone', label: 'Possible phone number', regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
          { id: 'email', label: 'Possible email address', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i }
        ];

        const getDeidWarnings = (text) => {
          if (!text || typeof text !== 'string') return [];
          return DEID_PATTERNS.filter(pattern => pattern.regex.test(text)).map(pattern => pattern.label);
        };

        const getDefaultClipboardPacks = () => ([
          {
            id: 'telestroke-consult',
            title: 'Telestroke Consult Pack',
            description: 'Summary for consult documentation.',
            sections: [
              { id: 'summary', title: 'Summary', enabled: true, template: 'Alias: {PATIENT_ALIAS}\nAge/Sex: {AGE}{SEX}\nNIHSS: {NIHSS}\nDx: {DIAGNOSIS}\nLVO: {LVO}\nWeight: {WEIGHT_KG} kg' },
              { id: 'times', title: 'Key Times', enabled: true, template: 'LKW: {LKW}\nArrival: {ARRIVAL}\nCT: {CT_TIME}\nCTA: {CTA_TIME}' },
              { id: 'imaging', title: 'Imaging', enabled: true, template: 'CT: {CT_RESULTS}\nCTA: {CTA_RESULTS}\nASPECTS: {ASPECTS}' },
              { id: 'plan', title: 'Plan', enabled: true, template: 'TNK: {TNK_STATUS}\nEVT: {EVT_STATUS}\nDisposition: {DISPOSITION}' }
            ]
          },
          {
            id: 'transfer-pack',
            title: 'Transfer Pack',
            description: 'Transfer-ready summary for receiving centers.',
            sections: [
              { id: 'summary', title: 'Summary', enabled: true, template: 'Alias: {PATIENT_ALIAS}\nAge/Sex: {AGE}{SEX}\nNIHSS: {NIHSS}\nDx: {DIAGNOSIS}\nLVO: {LVO}' },
              { id: 'imaging', title: 'Imaging', enabled: true, template: 'CT: {CT_RESULTS}\nCTA: {CTA_RESULTS}\nASPECTS: {ASPECTS}\nPerfusion: {CTP_RESULTS}' },
              { id: 'treatment', title: 'Treatment', enabled: true, template: 'TNK: {TNK_STATUS}\nEVT: {EVT_STATUS}\nTransfer status: {TRANSFER_STATUS}' }
            ]
          },
          {
            id: 'signout-pack',
            title: 'Signout Pack',
            description: 'End-of-shift signout snapshot.',
            sections: [
              { id: 'summary', title: 'Summary', enabled: true, template: 'Alias: {PATIENT_ALIAS}\nAge/Sex: {AGE}{SEX}\nNIHSS: {NIHSS}\nDx: {DIAGNOSIS}\nDisposition: {DISPOSITION}' },
              { id: 'pending', title: 'Pending / Follow-up', enabled: true, template: '{PENDING_ITEMS}' }
            ]
          },
          {
            id: 'ich-pack',
            title: 'ICH Pack',
            description: 'ICH-specific bundle.',
            sections: [
              { id: 'summary', title: 'Summary', enabled: true, template: 'Alias: {PATIENT_ALIAS}\nAge/Sex: {AGE}{SEX}\nICH Score: {ICH_SCORE}\nGCS: {GCS}\nBP: {BP}' },
              { id: 'imaging', title: 'Imaging', enabled: true, template: 'CT: {CT_RESULTS}\nHematoma: {HEMATOMA}\nIVH: {IVH}' },
              { id: 'plan', title: 'Plan', enabled: true, template: 'Reversal: {REVERSAL}\nDisposition: {DISPOSITION}' }
            ]
          }
        ]);

          const getDefaultSettings = () => ({
            deidMode: true,
            allowFreeTextStorage: false,
            ttlHoursOverride: null,
            defaultConsultationType: 'videoTelestroke',
            contacts: DEFAULT_CONTACTS,
          });

        const getDefaultAppData = () => ({
          schemaVersion: APP_DATA_SCHEMA_VERSION,
          settings: getDefaultSettings(),
          shiftBoards: [],
          uiState: {
            lastActiveTab: 'encounter',
            lastShiftBoardId: null,
            lastManagementSubTab: 'ich',
            legacyMigratedAt: null,
            searchHighlightId: null,
          },
          encounter: {
            clipboardPacks: getDefaultClipboardPacks(),
            clipboardPackVisibility: {}
          }
        });

        const mergeAppData = (base, incoming) => {
          const merged = {
            ...base,
            ...incoming,
            settings: { ...base.settings, ...(incoming && incoming.settings ? incoming.settings : {}) },
            uiState: { ...base.uiState, ...(incoming && incoming.uiState ? incoming.uiState : {}) },
            encounter: { ...base.encounter, ...(incoming && incoming.encounter ? incoming.encounter : {}) }
          };
          delete merged.pinnedReferences;
          merged.shiftBoards = ensureArray(merged.shiftBoards, []);
          merged.encounter.clipboardPacks = ensureArray(merged.encounter.clipboardPacks, getDefaultClipboardPacks());
          return merged;
        };

        const migrateAppData = (data) => {
          const next = { ...data };
          const version = Number.isFinite(next.schemaVersion) ? next.schemaVersion : 0;
          if (version < APP_DATA_SCHEMA_VERSION) {
            next.schemaVersion = APP_DATA_SCHEMA_VERSION;
          }
          return next;
        };

        const migrateLegacyToAppData = (data) => {
          if (data.uiState && data.uiState.legacyMigratedAt) return data;
          const next = mergeAppData(getDefaultAppData(), data);

          const legacyActiveTab = getKey('activeTab', null);
          if (legacyActiveTab) {
            next.uiState.lastActiveTab = legacyActiveTab;
          }

          const legacyTtl = getKey('ttlHoursOverride', null);
          if (Number.isFinite(Number(legacyTtl)) && Number(legacyTtl) > 0) {
            next.settings.ttlHoursOverride = Number(legacyTtl);
          }


          next.uiState.legacyMigratedAt = toIsoString();
          return next;
        };

        const loadAppData = () => {
          const base = getDefaultAppData();
          const raw = localStorage.getItem(APP_DATA_KEY);
          if (!raw) {
            return migrateLegacyToAppData(base);
          }
          try {
            const parsed = JSON.parse(raw);
            const merged = mergeAppData(base, parsed);
            return migrateLegacyToAppData(migrateAppData(merged));
          } catch (e) {
            console.warn('Failed to parse app data:', e);
            return migrateLegacyToAppData(base);
          }
        };

        const saveAppData = (data) => {
          try {
            localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
            touchLastUpdated();
          } catch (e) {
            console.warn('Failed to save app data:', e);
          }
        };

        const bufferToBase64 = (buffer) => {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          bytes.forEach((b) => {
            binary += String.fromCharCode(b);
          });
          return btoa(binary);
        };

        const base64ToBuffer = (base64) => {
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes;
        };

        const derivePinHash = async (pin, saltBase64 = null) => {
          const encoder = new TextEncoder();
          const salt = saltBase64 ? base64ToBuffer(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(pin),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
          );
          const derivedBits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            256
          );
          return {
            salt: bufferToBase64(salt),
            hash: bufferToBase64(derivedBits)
          };
        };

        const verifyPinHash = async (pin, salt, expectedHash) => {
          try {
            const derived = await derivePinHash(pin, salt);
            return derived.hash === expectedHash;
          } catch (e) {
            console.warn('PIN verification failed:', e);
            return false;
          }
        };

        const parseLastUpdated = (value) => {
          if (typeof value === 'number' && Number.isFinite(value)) return value;
          if (typeof value === 'string') {
            const numeric = Number(value);
            if (Number.isFinite(numeric)) return numeric;
            const parsedDate = Date.parse(value);
            if (!Number.isNaN(parsedDate)) return parsedDate;
          }
          return null;
        };

        const applyStorageExpiration = (ttlHours) => {
          const lastUpdatedRaw = getKey(LAST_UPDATED_KEY, null);
          const lastUpdated = parseLastUpdated(lastUpdatedRaw);
          if (!lastUpdated || !Number.isFinite(ttlHours) || ttlHours <= 0) {
            return false;
          }
          const ttlMs = ttlHours * 60 * 60 * 1000;
          if (Date.now() - lastUpdated > ttlMs) {
            clearAllAppStorage();
            return true;
          }
          return false;
        };

        migrateLegacyStorage();
        const INITIAL_APP_DATA = loadAppData();
        const storedTtlOverride = INITIAL_APP_DATA.settings.ttlHoursOverride ?? getKey('ttlHoursOverride', null);
        const initialTtlHours = Number.isFinite(storedTtlOverride) && storedTtlOverride > 0
          ? storedTtlOverride
          : DEFAULT_TTL_HOURS;
        const INITIAL_STORAGE_EXPIRED = applyStorageExpiration(initialTtlHours);

        const MANAGEMENT_SUBTABS = ['ich', 'ischemic', 'calculators', 'references'];
        const LEGACY_MANAGEMENT_TABS = {
          ich: 'ich',
          protocols: 'ischemic',
          calculators: 'calculators',
          evidence: 'references'
        };

        const normalizeManagementSubTab = (value) => {
          if (!value) return null;
          const normalized = String(value).toLowerCase();
          if (MANAGEMENT_SUBTABS.includes(normalized)) return normalized;
          if (LEGACY_MANAGEMENT_TABS[normalized]) return LEGACY_MANAGEMENT_TABS[normalized];
          return null;
        };

        const VALID_TABS = [
          'encounter',
          'management',
          'trials'
        ];

        const parseHashRoute = (hash) => {
          if (!hash) return { tab: 'encounter' };
          const cleaned = hash.replace(/^#\/?/, '').trim();
          if (!cleaned) {
            return { tab: 'encounter' };
          }
          const parts = cleaned.split('/').filter(Boolean);
          const root = parts[0];
          const sub = parts[1];

          switch (root) {
            case 'home':
              return { tab: 'encounter' };
            case 'encounter':
              return { tab: 'encounter' };
            case 'management':
              return { tab: 'management', sub: normalizeManagementSubTab(sub) };
            case 'ich':
            case 'protocols':
            case 'calculators':
            case 'evidence':
              return { tab: 'management', sub: LEGACY_MANAGEMENT_TABS[root] };
            case 'trials':
              return { tab: 'trials' };
            default:
              return null;
          }
        };

        const buildHashRoute = (tab, sub) => {
          switch (tab) {
            case 'encounter':
              return '#/encounter';
            case 'management': {
              const managementSub = normalizeManagementSubTab(sub);
              return managementSub ? `#/management/${managementSub}` : '#/management';
            }
            case 'ich':
              return '#/management/ich';
            case 'protocols':
              return '#/management/ischemic';
            case 'calculators':
              return '#/management/calculators';
            case 'trials':
              return '#/trials';
            case 'evidence':
              return '#/management/references';
            default:
              return '#/encounter';
          }
        };

        const StrokeClinicalTool = () => {
          const defaultTelestrokeTemplate = `Chief complaint: {chiefComplaint}
Last known well (date/time): {lkwDate} {lkwTime}
HPI: {age} year old {sex} p/w {symptoms} at {lkwTime}
Relevant PMH: {pmh}
Medications: {medications}

Objective:
Vitals:
Presenting BP {presentingBP}
Blood pressure: BP prior to TNK administration: {bpPreTNK} at {bpPreTNKTime}
Labs: Glucose {glucose}
Exam: Scores: NIHSS {nihss} - {nihssDetails}

Imaging: I personally reviewed imaging
Date/time Non-contrast Head CT reviewed: {ctTime}; Non-contrast Head CT Results: {ctResults}
Date/time CTA reviewed: {ctaDate} {ctaTime}; CTA Results: {ctaResults}
Telemetry/EKG: {ekgResults}

Assessment and Plan:
Suspected Diagnosis: {diagnosis}
After ensuring that there were no evident contraindications, TNK administration was recommended at {tnkAdminTime}. Potential benefits, potential risks (including a potential risk of sx ICH of up to 4%), and alternatives to treatment were discussed with the patient, patient's wife, and OSH provider. Both the patient and his wife expressed agreement with the recommendation.
TNK was administered at {tnkAdminTime} after a brief time-out.

Recommendations:
{recommendationsText}

Clinician Name`;

          const getDefaultStrokeCodeForm = () => ({
            age: '',
            sex: '',
            hx: '',
            sx: '',
            lkw: '',
            lkw_date: new Date().toISOString().split('T')[0],
            nihss: '',
            aspects: '',
            def: '',
            hct: '',
            cta: '',
            ctp: '',
            tnk: [],
            tnk_rec: '',
            evt_rec: '',
            rec_reason: ''
          });

          const getDefaultAspectsRegionState = () => ([
            { id: 'M1', name: 'M1 - Anterior MCA cortex', checked: true },
            { id: 'M2', name: 'M2 - MCA cortex lateral to insular ribbon', checked: true },
            { id: 'M3', name: 'M3 - Posterior MCA cortex', checked: true },
            { id: 'M4', name: 'M4 - Anterior MCA territory immediately superior to M1', checked: true },
            { id: 'M5', name: 'M5 - Lateral MCA territory immediately superior to M2', checked: true },
            { id: 'M6', name: 'M6 - Posterior MCA territory immediately superior to M3', checked: true },
            { id: 'IC', name: 'IC - Internal capsule', checked: true },
            { id: 'L', name: 'L - Lentiform nucleus', checked: true },
            { id: 'C', name: 'C - Caudate', checked: true },
            { id: 'I', name: 'I - Insular ribbon', checked: true }
          ]);

          const getDefaultPcAspectsRegions = () => ([
            { id: 'THAL', name: 'Thalami (bilateral)', checked: true, points: 1 },
            { id: 'MIDBRAIN', name: 'Midbrain', checked: true, points: 2 },
            { id: 'PONS', name: 'Pons', checked: true, points: 2 },
            { id: 'MEDULLA', name: 'Medulla', checked: true, points: 1 },
            { id: 'CEREBELLUM-L', name: 'Left Cerebellar Hemisphere', checked: true, points: 1 },
            { id: 'CEREBELLUM-R', name: 'Right Cerebellar Hemisphere', checked: true, points: 1 },
            { id: 'PCA-L', name: 'Left Occipital Lobe (PCA Territory)', checked: true, points: 1 },
            { id: 'PCA-R', name: 'Right Occipital Lobe (PCA Territory)', checked: true, points: 1 }
          ]);

          const getDefaultTelestrokeNote = () => ({
            // Calling Site for Telephone Consults
            callingSite: '',
            callingSiteOther: '',
            alias: '',
            // Telephone consult specific fields
            workingDiagnosis: '',
            briefHistory: '',
            deficits: '',
            imaging: '',
            chiefComplaint: '',
            lkwDate: new Date().toISOString().split('T')[0],
            lkwTime: new Date().toTimeString().slice(0, 5),
            lkwUnknown: false,
            discoveryDate: '',
            discoveryTime: '',
            age: '',
            sex: 'M',
            affectedSide: '',
            weight: '',
            height: '',
            lastDOACDose: new Date().toISOString().slice(0, 16),
            lastDOACType: '',
            arrivalTime: '',
            strokeAlertTime: '',
            // DTN Time Metrics
            dtnEdArrival: '',
            dtnStrokeAlert: '',
            dtnCtStarted: '',
            dtnCtRead: '',
            dtnTnkOrdered: '',
            dtnTnkAdministered: '',
            symptoms: '',
            pmh: '',
            medications: '',
            noAnticoagulants: false,
            premorbidMRS: '',
            vesselOcclusion: [],
            presentingBP: '',
            bpPreTNK: '',
            bpPreTNKTime: '',
            glucose: '',
            plateletsCoags: '',
            creatinine: '',
            inr: '',
            ptt: '',
            plateletCount: '',
            platelets: '',
            allergies: '',
            contrastAllergy: false,
            nihss: '',
            nihssDetails: '',
            imagingReviewed: true,
            ctDate: new Date().toISOString().split('T')[0],
            ctTime: '',
            ctResults: '',
            ctaDate: new Date().toISOString().split('T')[0],
            ctaTime: '',
            ctaResults: '',
            ctpResults: '',
            ekgResults: '',
            wakeUpStrokeWorkflow: {
              mriAvailable: null,
              dwi: {
                positiveForLesion: false,
                lesionVolume: ''
              },
              flair: {
                noMarkedHyperintensity: false
              },
              ageEligible: false,
              nihssEligible: false,
              extendCriteria: {
                nihss4to26: false,
                premorbidMRSLt2: false,
                ischemicCoreLte70: false,
                mismatchRatioGte1_2: false,
                timeWindow4_5to9h: false
              },
              imagingRecommendation: '',
              wakeUpEligible: null,
              extendEligible: null
            },
            diagnosis: '',
            diagnosisCategory: '',
            tnkRecommended: false,
            evtRecommended: false,
            rationale: '',
            tnkConsentDiscussed: false,
            patientFamilyConsent: false,
            presumedConsent: false,
            preTNKSafetyPause: false,
            tnkAdminTime: '',
            admitLocation: '',
            recommendationsText: '',
            transferAccepted: false,
            transferRationale: '',
            transferChecklist: {
              imagingShared: false,
              transferCenterCalled: false,
              acceptingPhysicianNotified: false,
              transportArranged: false,
              etaConfirmed: false,
              bpGoalsCommunicated: false
            },
            transferImagingShareMethod: '',
            transferImagingShareLink: '',
            transportMode: '',
            transportEta: '',
            transportNotes: '',
            disposition: '',
            doorTime: '',
            needleTime: '',
            punctureTime: '',
            tnkContraindicationChecklist: {
              activeInternalBleeding: false,
              recentIntracranialSurgery: false,
              intracranialNeoplasm: false,
              knownBleedingDiathesis: false,
              severeUncontrolledHTN: false,
              currentICH: false,
              recentMajorSurgery: false,
              recentGIGUBleeding: false,
              recentArterialPuncture: false,
              recentLumbarPuncture: false,
              pregnancy: false,
              seizureAtOnset: false,
              lowPlatelets: false,
              elevatedINR: false,
              elevatedPTT: false,
              abnormalGlucose: false,
              recentDOAC: false
            },
            tnkContraindicationReviewed: false,
            tnkContraindicationReviewTime: '',
            decisionLog: [],
            recommendations: {
              neuroChecks: false,
              noAntithrombotics: false,
              bpControl: false,
              followUpCT: false,
              mri: false,
              ekg: false,
              echo: false,
              lipids: false,
              therapies: false,
              dvtPpx: false,
              neuroConsult: false
            },
            // Phase 2: Guided Clinical Pathway fields
            ichBPManaged: false,
            ichReversalOrdered: false,
            ichNeurosurgeryConsulted: false,
            // Phase 4: SAH fields
            sahGrade: '',
            sahGradeScale: '',
            sahBPManaged: false,
            sahNimodipine: false,
            sahEVDPlaced: false,
            sahAneurysmSecured: false,
            sahNeurosurgeryConsulted: false,
            sahSeizureProphylaxis: false,
            // Phase 4: CVT fields
            cvtAnticoagStarted: false,
            cvtAnticoagType: '',
            cvtIcpManaged: false,
            cvtSeizureManaged: false,
            cvtHematologyConsulted: false,
            // Phase 5: TIA Pathway fields
            tiaWorkup: {
              mriDwi: false,
              ctaHeadNeck: false,
              ecg12Lead: false,
              telemetry: false,
              echo: false,
              labsCbc: false,
              labsBmp: false,
              labsA1c: false,
              labsLipids: false,
              labsTsh: false
            },
            tiaWorkupReviewed: false,
            // Phase 5: Etiologic Classification (TOAST)
            toastClassification: '',
            // Phase 5: Cardiac Workup
            cardiacWorkup: {
              ecgComplete: false,
              telemetryOrdered: false,
              echoOrdered: false,
              extendedMonitoring: '',
              extendedMonitoringType: '',
              pfoEvaluation: '',
              pascalClassification: ''
            },
            // Phase 5: Cervical Artery Dissection
            dissectionPathway: {
              antithromboticStarted: false,
              antithromboticType: '',
              imagingFollowUp: '',
              vascularImagingDate: ''
            },
            // Phase 5: Screening Tools
            screeningTools: {
              phq2Score: '',
              phq2Positive: false,
              mocaScore: '',
              mocaReferral: false,
              stopBangScore: '',
              stopBangPositive: false,
              seizureRisk: ''
            },
            // Phase 5: Secondary Prevention Dashboard
            secondaryPrevention: {
              bpTarget: '',
              bpMeds: '',
              ldlCurrent: '',
              ldlTarget: '<70',
              statinDose: '',
              ezetimibeAdded: false,
              pcsk9Added: false,
              diabetesManagement: '',
              smokingStatus: '',
              smokingCessationRx: '',
              exercisePlan: '',
              dietPlan: '',
              antiplateletRegimen: '',
              daptDuration: '',
              followUpTimeline: ''
            },
            // Phase 5: Special Populations
            pregnancyStroke: false,
            decompressiveCraniectomy: {
              considered: false,
              age: '',
              nihssThreshold: false,
              territorySize: '',
              timing: ''
            },
            rehabReferral: {
              pt: false,
              ot: false,
              slp: false,
              neuropsych: false,
              socialWork: false,
              vocationalRehab: false
            },
            // Phase 4: Discharge Checklist
            dischargeChecklist: {
              antiplateletOrAnticoag: false,
              statinPrescribed: false,
              bpMedOptimized: false,
              diabetesManaged: false,
              smokingCessation: false,
              dietCounseling: false,
              exerciseCounseling: false,
              followUpNeurology: false,
              followUpPCP: false,
              rehabilitationOrdered: false,
              patientEducation: false,
              drivingRestrictions: false
            },
            dischargeChecklistReviewed: false
          });

          // Load saved data from localStorage with validation
          const loadFromStorage = (key, defaultValue) => {
            try {
              const saved = getKey(key, undefined);
              if (saved === undefined || saved === null) return defaultValue;

              // Validate that arrays are actually arrays (fix for completedSteps issue)
              if (Array.isArray(defaultValue) && !Array.isArray(saved)) {
                console.warn(`Invalid data type for ${key}, expected array. Resetting to default.`);
                return defaultValue;
              }

              return saved;
            } catch (e) {
              console.warn(`Error loading ${key} from localStorage:`, e);
              return defaultValue;
            }
          };

          // PHI Protection - shift handoff data expires after 24 hours
          const SHIFT_DATA_TTL_MS = 24 * 60 * 60 * 1000;

          const loadShiftData = (key, defaultValue) => {
            try {
              return getKey(key, defaultValue);
            } catch (e) {
              console.warn(`Error loading ${key}:`, e);
              return defaultValue;
            }
          };

          const saveShiftData = (key, value) => {
            try {
              setKey(key, { data: value, expiresAt: Date.now() + SHIFT_DATA_TTL_MS });
            } catch (e) {
              console.warn(`Error saving ${key}:`, e);
            }
          };

          const [appData, setAppData] = useState(() => INITIAL_APP_DATA);
          const settings = appData.settings || getDefaultSettings();

          const updateAppData = (updater) => {
            setAppData((prev) => {
              const next = typeof updater === 'function' ? updater(prev) : updater;
              return mergeAppData(getDefaultAppData(), next);
            });
          };

          const initialActiveTab = (() => {
            const storedTab = appData.uiState.lastActiveTab || 'encounter';
            if (LEGACY_MANAGEMENT_TABS[storedTab]) return 'management';
            return storedTab;
          })();
          const initialManagementSubTab = (() => {
            const storedSubTab = normalizeManagementSubTab(appData.uiState.lastManagementSubTab);
            if (storedSubTab) return storedSubTab;
            const legacySubTab = LEGACY_MANAGEMENT_TABS[appData.uiState.lastActiveTab];
            return legacySubTab || 'ich';
          })();

          const [activeTab, setActiveTab] = useState(initialActiveTab);
          const [routeReady, setRouteReady] = useState(false);
          const [notice, setNotice] = useState(null);
          const [clearUndo, setClearUndo] = useState(null);
          const [storageExpired, setStorageExpired] = useState(INITIAL_STORAGE_EXPIRED);
          const [actionsOpen, setActionsOpen] = useState(false);
          const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
          const [caseSummaryCollapsed, setCaseSummaryCollapsed] = useState(() => {
            const saved = getKey('caseSummaryCollapsed', null);
            if (saved !== null && saved !== undefined) return saved === true;
            return window.innerWidth < 640;
          });
          // Phase 2: Guided Clinical Pathway UI state
          const [pathwayCollapsed, setPathwayCollapsed] = useState(true);
          const [guidelineRecsExpanded, setGuidelineRecsExpanded] = useState(false);
          const [showAdvanced, setShowAdvanced] = useState(() => getKey('showAdvanced', false) === true);
          const [appConfig, setAppConfig] = useState({ institutionLinks: [], ttlHoursOverride: null });
          const [configLoaded, setConfigLoaded] = useState(false);
          const [ttlHours, setTtlHours] = useState(settings.ttlHoursOverride || DEFAULT_TTL_HOURS);

          const [patientData, setPatientData] = useState(loadFromStorage('patientData', {}));
          const [nihssScore, setNihssScore] = useState(loadFromStorage('nihssScore', 0));
          const [aspectsScore, setAspectsScore] = useState(loadFromStorage('aspectsScore', 10));
          const [darkMode, setDarkMode] = useState(getKey('darkMode', false) === true);
          const [searchQuery, setSearchQuery] = useState('');
          const [showSuccess, setShowSuccess] = useState(false);
          const [isCalculating, setIsCalculating] = useState(false);
          const [copiedText, setCopiedText] = useState('');
          const [isMounted, setIsMounted] = useState(false);
          const [editableTemplate, setEditableTemplate] = useState(loadFromStorage('telestrokeTemplate', defaultTelestrokeTemplate));

          // Time tracking
          const [currentTime, setCurrentTime] = useState(new Date());
          const [lkwTime, setLkwTime] = useState(() => {
            const storedLkwTime = loadFromStorage('lkwTime', null);
            return storedLkwTime ? new Date(storedLkwTime) : new Date();
          });

          // Thrombolysis window alert state
          const [alertsMuted, setAlertsMuted] = useState(getKey('thrombolysisAlertsMuted', false) === true);
          const [lastAlertPlayed, setLastAlertPlayed] = useState(null);
          const [alertFlashing, setAlertFlashing] = useState(false);
          const [elapsedSeconds, setElapsedSeconds] = useState(0);

          // Save status
          const [saveStatus, setSaveStatus] = useState('saved');
          const [lastSaved, setLastSaved] = useState(null);

          // Critical alerts state
          const [criticalAlerts, setCriticalAlerts] = useState([]);

          // Search
          const [searchResults, setSearchResults] = useState([]);
          const [searchOpen, setSearchOpen] = useState(false);
          const [searchContext, setSearchContext] = useState('header');
          const [evidenceFilter, setEvidenceFilter] = useState('');
          const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
          const [deidWarnings, setDeidWarnings] = useState({});
          const [wipeConfirmText, setWipeConfirmText] = useState('');

          // Workflow tracking
          const [currentStep, setCurrentStep] = useState(loadFromStorage('currentStep', 0));
          const [completedSteps, setCompletedSteps] = useState(loadFromStorage('completedSteps', []));

          // ============================================
          // SHIFT TRACKING: Multi-patient management
          // ============================================
          // Each patient in shift has: id, summary, timestamp, formState snapshot
          const [shiftPatients, setShiftPatients] = useState(loadFromStorage('shiftPatients', []));
          const [currentPatientId, setCurrentPatientId] = useState(loadFromStorage('currentPatientId', null));
          const [showPatientSwitcher, setShowPatientSwitcher] = useState(false);

          // Collapsible Timer Sidebar state (default: expanded on desktop, collapsed on mobile)
          const [timerSidebarCollapsed, setTimerSidebarCollapsed] = useState(() => {
            const saved = getKey('timerSidebarCollapsed', null);
            if (saved !== null && saved !== undefined) return saved === true;
            return window.innerWidth < 1024; // collapsed by default on mobile/tablet
          });

          // ============================================
          // CONSULTATION TYPE: Telephone, Video Telestroke
          // ============================================
          const [consultationType, setConsultationType] = useState(loadFromStorage('consultationType', settings.defaultConsultationType || 'videoTelestroke'));

          const [managementSubTab, setManagementSubTab] = useState(initialManagementSubTab);

          // Emergency Contacts FAB state
          const [fabExpanded, setFabExpanded] = useState(false);

          const [selectedPackId, setSelectedPackId] = useState(appData.encounter.clipboardPacks?.[0]?.id || 'telestroke-consult');
          const [shiftFilterDueToday, setShiftFilterDueToday] = useState(false);
          const [shiftFilterPendingOnly, setShiftFilterPendingOnly] = useState(false);
          const [showArchivedBoards, setShowArchivedBoards] = useState(false);
          const [shiftDrafts, setShiftDrafts] = useState({});

          const shiftBoards = appData.shiftBoards || [];
          const clipboardPacks = appData.encounter.clipboardPacks || getDefaultClipboardPacks();
          const activeShiftBoardId = appData.uiState.lastShiftBoardId || (shiftBoards[0] ? shiftBoards[0].id : null);
          const activeShiftBoard = shiftBoards.find((board) => board.id === activeShiftBoardId) || null;

          // Ref and state for Part 6 (Treatment Decision) scroll visibility
          const treatmentDecisionRef = useRef(null);
          const backupImportRef = useRef(null);
          const decisionStateRef = useRef({
            tnkRecommended: false,
            evtRecommended: false,
            transferAccepted: false,
            tnkContraindicationReviewed: false,
            tnkConsentDiscussed: false,
            tnkAdminTime: ''
          });

          const [gcsItems, setGcsItems] = useState(loadFromStorage('gcsItems', {
            eye: '',
            verbal: '',
            motor: ''
          }));
          const [mrsScore, setMrsScore] = useState(loadFromStorage('mrsScore', ''));
          const [ichScoreItems, setIchScoreItems] = useState(loadFromStorage('ichScoreItems', {
            gcs: '', // Changed to single field for mutual exclusivity
            age80: false,
            volume30: false,
            ivh: false,
            infratentorial: false
          }));
          const [ichVolumeParams, setIchVolumeParams] = useState({ a: '', b: '', thicknessMm: '', numSlices: '' });

          useEffect(() => {
            const { a, b, thicknessMm, numSlices } = ichVolumeParams;
            if (a && b && thicknessMm && numSlices) {
              const cCm = (parseFloat(thicknessMm) / 10) * parseFloat(numSlices);
              const vol = (parseFloat(a) * parseFloat(b) * cCm) / 2;
              if (!isNaN(vol)) {
                setIchScoreItems(prev => {
                  const isHigh = vol >= 30;
                  if (prev.volume30 !== isHigh) {
                    return { ...prev, volume30: isHigh };
                  }
                  return prev;
                });
              }
            }
          }, [ichVolumeParams]);
          const [abcd2Items, setAbcd2Items] = useState(loadFromStorage('abcd2Items', {
            age60: false,
            bp: false,
            unilateralWeakness: false,
            speechDisturbance: false,
            duration: '', // Changed to single field for mutual exclusivity
            diabetes: false
          }));
          const [chads2vascItems, setChads2vascItems] = useState(loadFromStorage('chads2vascItems', {
            chf: false,
            hypertension: false,
            age75: false,
            diabetes: false,
            strokeTia: false,
            vascular: false,
            age65: false,
            female: false
          }));
          const [ropeItems, setRopeItems] = useState(loadFromStorage('ropeItems', {
            noHypertension: false,
            noDiabetes: false,
            noStrokeTia: false,
            nonsmoker: false,
            cortical: false,
            age: ''
          }));
          const [huntHessGrade, setHuntHessGrade] = useState(loadFromStorage('huntHessGrade', ''));
          const [wfnsGrade, setWfnsGrade] = useState(loadFromStorage('wfnsGrade', ''));
          const [hasbledItems, setHasbledItems] = useState(loadFromStorage('hasbledItems', {
            hypertension: false,
            renalDisease: false,
            liverDisease: false,
            stroke: false,
            bleeding: false,
            labileINR: false,
            elderly: false,
            drugs: false,
            alcohol: false
          }));
          const [rcvs2Items, setRcvs2Items] = useState(loadFromStorage('rcvs2Items', {
            recurrentTCH: false,
            carotidInvolvement: false,
            vasoconstrictiveTrigger: false,
            female: false,
            sah: false
          }));
          const [trialsCategory, setTrialsCategory] = useState('ischemic');
          const [toolLoadErrors, setToolLoadErrors] = useState({ clinic: false, map: false });

          const [strokeCodeForm, setStrokeCodeForm] = useState(loadFromStorage('strokeCodeForm', getDefaultStrokeCodeForm()));
          const [aspectsRegionState, setAspectsRegionState] = useState(loadFromStorage('aspectsRegionState', getDefaultAspectsRegionState()));

          // PC-ASPECTS regions state
          const [pcAspectsRegions, setPcAspectsRegions] = useState(loadFromStorage('pcAspectsRegions', getDefaultPcAspectsRegions()));

          // Telestroke Documentation State
          const [telestrokeNote, setTelestrokeNote] = useState(loadFromStorage('telestrokeNote', getDefaultTelestrokeNote()));


          // Trials data
          const trialsData = {
            ischemic: {
                title: "Ischemic Stroke Studies",
                hasSubsections: true,
                subsections: {
                    acute: {
                        title: "Acute Trials",
                        trials: [
                            {
                                name: "SISTER Trial",
                                nct: "NCT05948566",
                                phase: "Phase 2",
                                status: "",
                                description: "TS23 (monoclonal antibody to α2-antiplasmin) for late thrombolysis in acute ischemic stroke patients presenting 4.5-24 hours from last known well",
                                inclusion: [
                                    "Age ≥18 years",
                                    "Suspected anterior circulation acute ischemic stroke",
                                    "NIH Stroke Scale score ≥4 prior to randomization (participant must have a clearly disabling deficit if NIHSS is 4-5)",
                                    "Time from last known well: 4.5-24 hours",
                                    "Favorable baseline neuroimaging consisting of ALL of the following:",
                                    "• ASPECTS ≥6 on CT (or ASPECTS ≥7 on MRI)",
                                    "• Favorable perfusion imaging on CTP/MR-PWI consisting of ALL:",
                                    "  - Mismatch ratio of penumbra:core >1.2",
                                    "  - Mismatch volume >10 cc",
                                    "  - Ischemic core volume <70 cc",
                                    "Able to receive assigned study drug within 4.5 to 24 hours of stroke onset or last known well",
                                    "Informed consent obtained from participant or legally authorized representative",
                                    "Study drug administration encouraged within 90 minutes after qualifying perfusion image (allowed up to 120 minutes)"
                                ],
                                exclusion: [
                                    "Received endovascular treatment with clot engagement (patients with groin puncture but no clot engagement due to spontaneous distal migration are permitted)",
                                    "Received or planned to receive intravenous thrombolysis",
                                    "Pre-stroke modified Rankin score >2",
                                    "Previous treatment with TS23 or known previous allergy to antibody therapy",
                                    "Known pregnancy, breastfeeding, or plan to breastfeed within 3 months of receiving TS23",
                                    "Positive urine or serum pregnancy test for women of childbearing potential",
                                    "Known previous stroke in the past 90 days",
                                    "Known previous intracranial hemorrhage, intracranial neoplasm, subarachnoid hemorrhage, or arteriovenous malformation",
                                    "Known active diagnosis of intracranial neoplasm",
                                    "Clinical presentation suggestive of subarachnoid hemorrhage (even if initial CT scan was normal)",
                                    "Surgery or biopsy of parenchymal organ in the past 30 days",
                                    "Known trauma with internal injuries or persistent ulcerative wounds in the past 30 days",
                                    "Severe head trauma in the past 90 days",
                                    "Persistent systolic blood pressure >180mmHg or diastolic blood pressure >105mmHg despite best medical management",
                                    "Serious systemic hemorrhage in the past 30 days",
                                    "Hereditary or acquired hemorrhagic diathesis or coagulation factor deficiency",
                                    "Use of dual antiplatelet agents within 48 hours prior to stroke symptom onset",
                                    "International normalized ratio (INR) >1.7 or partial thromboplastin time (PTT) > 2x upper limit of normal",
                                    "Use of direct thrombin inhibitors or direct factor Xa inhibitors within past 48 hours unless aPTT, INR, platelet count, ecarin clotting time (ECT), thrombin time (TT), or appropriate factor Xa activity assays are normal",
                                    "Glucose <50 mg/dL or >400 mg/dL",
                                    "Platelets <100,000/µL",
                                    "Known severe renal failure with creatinine >3 mg/dL or glomerular filtration rate <30 mL/min",
                                    "Severe contrast allergy that cannot be managed medically",
                                    "Suspected cerebral vasculitis based on medical history and CTA/MRA",
                                    "Suspected intracranial dissection based on medical history and CTA/MRA",
                                    "Intracranial stenosis related to atherosclerosis proximal to intracranial thrombus",
                                    "Intracranial stent in place proximal to the intracranial occlusion",
                                    "Acute myocardial infarction in past 7 days",
                                    "Major surgery (requiring intubation or transfusion) in past 30 days",
                                    "Suspicion of aortic dissection on history, examination, or imaging",
                                    "Presumed septic embolus; suspicion of bacterial endocarditis",
                                    "Life expectancy <90 days",
                                    "Currently participating in another investigational drug or device study"
                                ]
                            },
                            {
                                name: "STEP-EVT Trial",
                                nct: "NCT06289985",
                                phase: "Adaptive Platform",
                                status: "",
                                description: "NIH StrokeNet adaptive platform trial optimizing endovascular therapy for mild stroke and medium/distal vessel occlusions",
                                inclusion: [
                                    "Age ≥18 years",
                                    "Acute ischemic stroke due to large vessel occlusion (LVO) or medium vessel occlusion (MVO)",
                                    "Within 24 hours of last known well",
                                    "For Low NIHSS Domain:",
                                    "• NIHSS 0-5 with ICA or M1 occlusion",
                                    "• Disabling symptoms despite low NIHSS",
                                    "For Medium/Distal Vessel Occlusion Domain:",
                                    "• M2, M3, or M4 occlusion",
                                    "• A1, A2, or A3 occlusion",
                                    "• P1, P2, or P3 occlusion",
                                    "• Appropriate perfusion imaging criteria demonstrating salvageable tissue",
                                    "Ability to start EVT within appropriate time window",
                                    "Pre-stroke mRS ≤2 (able to live independently)",
                                    "Informed consent from patient or legally authorized representative"
                                ],
                                exclusion: [
                                    "Known pre-existing medical, neurological or psychiatric disease that would confound outcome evaluations",
                                    "Known serious, advanced, or terminal illness with life expectancy <6 months",
                                    "Unfavorable vascular anatomy limiting endovascular access to occluded artery",
                                    "Acute occlusions in multiple vascular territories",
                                    "Suspected septic embolus",
                                    "Suspected bacterial endocarditis",
                                    "Seizure at stroke onset with postictal residual impairments",
                                    "Contrast allergy precluding EVT that cannot be adequately pre-medicated",
                                    "Chronic total occlusion of target vessel",
                                    "Known intracranial dissection",
                                    "Known vasculitis",
                                    "Known moyamoya disease or syndrome",
                                    "Pregnancy or positive pregnancy test",
                                    "Currently breastfeeding",
                                    "Large core infarct (ASPECTS <3 or core volume >100cc depending on time window)",
                                    "Evidence of intracranial hemorrhage on baseline imaging",
                                    "Clinical suspicion of subarachnoid hemorrhage despite negative imaging",
                                    "Known bleeding diathesis or coagulopathy",
                                    "Platelet count <50,000/μL",
                                    "INR >3.0",
                                    "Blood glucose <50mg/dL",
                                    "Refractory hypertension (SBP >185 or DBP >110 despite treatment)",
                                    "Currently participating in another interventional clinical trial"
                                ]
                            },
                            {
                                name: "PICASSO Trial",
                                nct: "NCT05611242",
                                phase: "Phase 3 RCT",
                                status: "",
                                description: "Mechanical thrombectomy with vs without acute carotid stenting for tandem lesions",
                                inclusion: [
                                    "Age 18-79 years",
                                    "Acute ischemic stroke in the anterior circulation",
                                    "Tandem lesion consisting of:",
                                    "• Proximal carotid artery stenosis 70-100% by NASCET criteria or complete occlusion",
                                    "• Intracranial large vessel occlusion (ICA terminus, M1, or proximal M2)",
                                    "Within 16 hours from stroke onset or last known well",
                                    "Pre-stroke mRS 0-2",
                                    "NIHSS ≥4",
                                    "For presentation ≤6 hours: ASPECTS ≥7 on non-contrast CT",
                                    "For presentation >6-16 hours:",
                                    "• ASPECTS ≥7 AND",
                                    "• Ischemic core volume <50cc on perfusion imaging",
                                    "• Mismatch ratio >1.8",
                                    "• Mismatch volume >15cc",
                                    "Ability to undergo groin puncture within treatment window",
                                    "Informed consent obtained"
                                ],
                                exclusion: [
                                    "Proximal carotid stenosis secondary to dissection",
                                    "Proximal carotid stenosis secondary to vasculitis",
                                    "Pre-stroke mRS >2",
                                    "Known hemorrhagic diathesis",
                                    "Known coagulation factor deficiency",
                                    "Absolute contraindications to antiplatelet therapy",
                                    "Need for acute therapeutic anticoagulation that cannot be stopped",
                                    "Platelet count <100,000/μL",
                                    "INR >1.7",
                                    "aPTT >1.5x normal",
                                    "Blood glucose <50mg/dL or >400mg/dL",
                                    "Serum creatinine >3.0mg/dL unless on dialysis",
                                    "Evidence of intracranial hemorrhage on baseline CT/MRI",
                                    "Clinical suspicion of subarachnoid hemorrhage",
                                    "Large territory infarction (>1/3 MCA territory)",
                                    "Known severe contrast allergy that cannot be adequately pre-medicated",
                                    "Known pregnancy or positive pregnancy test",
                                    "Life expectancy <90 days due to comorbid conditions",
                                    "Enrollment in another interventional clinical trial",
                                    "Previous carotid endarterectomy or carotid stenting on affected side",
                                    "Contralateral carotid occlusion",
                                    "Intracranial stenosis in addition to the tandem lesion",
                                    "Known cardiac source of embolism requiring anticoagulation",
                                    "Recent MI within 30 days with ongoing cardiac issues",
                                    "Severe or unstable congestive heart failure",
                                    "Uncontrolled hypertension (SBP >185 or DBP >110 despite treatment)"
                                ]
                            },
                            {
                                name: "TESTED",
                                nct: "NCT05911568",
                                phase: "Comparative Effectiveness",
                                status: "",
                                description: "EVT vs medical therapy in LVO with pre-existing disability (mRS 3-4)",
                                inclusion: [
                                    "Age ≥18 years",
                                    "Pre-stroke mRS 3-4 for at least 3 months prior to index stroke",
                                    "Large vessel occlusion:",
                                    "• ICA terminus",
                                    "• M1 segment of MCA",
                                    "• Dominant/co-dominant M2 segment",
                                    "Within 24 hours of last known well",
                                    "NIHSS ≥6",
                                    "ASPECTS ≥3 on non-contrast CT or ≥4 on MRI",
                                    "For 6-24 hour window: evidence of salvageable tissue on perfusion imaging",
                                    "Able to undergo groin puncture within time window",
                                    "Informed consent from patient or legally authorized representative"
                                ],
                                exclusion: [
                                    "Pre-stroke mRS 0-2 or mRS 5-6",
                                    "Life expectancy <6 months from non-stroke condition",
                                    "Pre-stroke disability deemed temporary or reversible",
                                    "Known pregnancy",
                                    "Evidence of intracranial hemorrhage",
                                    "Large established infarct (>1/3 MCA territory)",
                                    "Bilateral strokes",
                                    "Known vasculitis or moyamoya",
                                    "Intracranial tumor",
                                    "Currently participating in another stroke intervention trial",
                                    "Inability to follow up at 90 days"
                                ]
                            }
                        ]
                    },
                    inpatient: {
                        title: "Subacute Enrollment",
                        trials: [
                            {
                                name: "VERIFY Study",
                                nct: "NCT05338697",
                                phase: "Observational",
                                status: "",
                                description: "Early TMS/MRI/clinical measures to predict upper extremity motor recovery",
                                inclusion: [
                                    "Age ≥18 years",
                                    "Acute ischemic stroke within 7 days of onset",
                                    "Upper extremity weakness (shoulder abduction and/or finger extension ≤4 on MRC scale)",
                                    "Able to provide informed consent or has LAR",
                                    "Able to participate in study assessments",
                                    "Expected to survive at least 90 days"
                                ],
                                exclusion: [
                                    "Contraindications to TMS:",
                                    "• Implanted electronic devices (pacemaker, cochlear implant, etc.)",
                                    "• Intracranial metal",
                                    "• History of seizures",
                                    "• Active psychiatric medication affecting cortical excitability",
                                    "Contraindications to MRI",
                                    "Unable to complete follow-up visits at 30 and 90 days",
                                    "Pre-stroke mRS >2",
                                    "Bilateral upper extremity weakness",
                                    "Previous stroke affecting motor function",
                                    "Other neurological conditions affecting motor function",
                                    "Pregnancy"
                                ]
                            },
                            {
                                name: "DISCOVERY Study",
                                nct: "NCT04916210",
                                phase: "Observational",
                                status: "",
                                description: "Cognitive trajectories and biomarkers after stroke (includes AIS/ICH/SAH)",
                                inclusion: [
                                    "Age ≥18 years",
                                    "Admitted with one of the following:",
                                    "• Acute ischemic stroke",
                                    "• Intracerebral hemorrhage",
                                    "• Aneurysmal subarachnoid hemorrhage",
                                    "Radiographic confirmation of stroke diagnosis",
                                    "Baseline visit can be completed within 6 weeks of stroke",
                                    "Fluent in English or Spanish",
                                    "Has study partner who knows patient well (contact ≥1x/week)",
                                    "Able to provide informed consent or has LAR",
                                    "Expected to survive at least 1 year"
                                ],
                                exclusion: [
                                    "Pre-stroke dementia diagnosis",
                                    "Pre-stroke cognitive impairment interfering with daily activities",
                                    "Concurrent enrollment in interventional trial affecting cognition",
                                    "Unable to complete study protocol due to:",
                                    "• Severe aphasia preventing cognitive testing",
                                    "• Severe motor impairment preventing testing",
                                    "• Blindness or severe visual impairment",
                                    "• Deafness or severe hearing impairment",
                                    "Active substance abuse",
                                    "Severe psychiatric illness affecting participation",
                                    "Terminal illness with life expectancy <1 year",
                                    "Previous enrollment in DISCOVERY",
                                    "Planned move out of area within study period"
                                ]
                            }
                        ]
                    },
                    imaging: {
                        title: "Imaging Studies",
                        trials: [
                            {
                                name: "ESUS Imaging Study",
                                nct: "NCT03820375",
                                phase: "Observational",
                                status: "",
                                description: "Cardiac and intracranial vessel wall MRI to reclassify ESUS",
                                inclusion: [
                                    "ESUS diagnosis",
                                    "Age ≥18 years",
                                    "Within 30 days of index stroke"
                                ],
                                exclusion: [
                                    "MRI contraindications",
                                    "Known stroke etiology"
                                ]
                            },
                            {
                                name: "MOCHA Imaging",
                                nct: "PMC8821414",
                                phase: "Observational",
                                status: "",
                                description: "Automated intracranial vessel-wall analysis for non-stenotic ICAD detection",
                                inclusion: [
                                    "Atherosclerotic lesions within the cerebrovascular tree clinically detected based on stenosis presence on clinical luminal imaging",
                                    "Presence of two or more atherosclerotic risk factors:",
                                    "• Age >50 years for men or >60 years for women",
                                    "• Hypertension",
                                    "• Diabetes mellitus", 
                                    "• Hyperlipidemia",
                                    "• Obesity",
                                    "• Smoking history",
                                    "No clinical evidence for other intracranial vasculopathies",
                                    "High-resolution MRI vessel wall imaging available"
                                ],
                                exclusion: [
                                    "Poor MRI image quality limiting vessel wall analysis",
                                    "Known intracranial vasculopathy (vasculitis, moyamoya, dissection)",
                                    "Unable to undergo MRI scanning",
                                    "Contraindications to MRI contrast if required for imaging protocol"
                                ]
                            }
                        ]
                    }
                }
            },
            ich: {
                title: "Intracerebral Hemorrhage Studies",
                hasSubsections: true,
                subsections: {
                    trials: {
                        title: "Trials",
                        trials: [
                            {
                                name: "SATURN Trial",
                                nct: "NCT03936361",
                                phase: "Phase 3",
                                status: "",
                                description: "Statins for intracerebral hemorrhage: Continue vs discontinue after lobar ICH",
                                inclusion: [
                                    "Age ≥50 years",
                                    "Spontaneous lobar intracerebral hemorrhage confirmed by CT or MRI",
                                    "Taking statin therapy at time of ICH onset for ≥1 month",
                                    "Modified Rankin Scale ≤4 at time of randomization",
                                    "Randomization within 7 days of ICH",
                                    "Clinical indication for statin therapy (dyslipidemia, atherosclerotic disease, diabetes)",
                                    "Able to provide informed consent or has LAR",
                                    "Expected to survive at least 6 months"
                                ],
                                exclusion: [
                                    "Deep (non-lobar) ICH location",
                                    "Secondary causes of ICH:",
                                    "• Trauma",
                                    "• Known brain tumor",
                                    "• Known vascular malformation or aneurysm",
                                    "• Hemorrhagic transformation of ischemic stroke",
                                    "• Known or suspected CNS vasculitis",
                                    "• Coagulopathy (INR >1.5, platelet count <100,000)",
                                    "• Drug-related (cocaine, amphetamines)",
                                    "Recent MI (<3 months) or unstable angina",
                                    "Coronary revascularization within past year",
                                    "Diabetes mellitus with prior MI or coronary revascularization",
                                    "Clear contraindication to statin discontinuation per treating physician",
                                    "Statin-related myopathy or rhabdomyolysis",
                                    "Severe hepatic impairment (ALT/AST >3x ULN)",
                                    "Life expectancy <6 months from non-ICH condition",
                                    "Unable to follow study protocol",
                                    "Pregnancy or breastfeeding",
                                    "Participation in another interventional trial"
                                ]
                            },
                            {
                                name: "ASPIRE Trial",
                                nct: "NCT03907046",
                                phase: "Phase 3",
                                status: "",
                                description: "Apixaban vs aspirin for stroke prevention after ICH in atrial fibrillation",
                                inclusion: [
                                    "Age ≥18 years",
                                    "Spontaneous ICH confirmed by CT or MRI",
                                    "Non-valvular atrial fibrillation (paroxysmal, persistent, or permanent)",
                                    "CHA2DS2-VASc score ≥2",
                                    "Randomization 14-180 days after ICH",
                                    "Modified Rankin Scale ≤4 at randomization",
                                    "Able to take oral medications",
                                    "Informed consent obtained"
                                ],
                                exclusion: [
                                    "Clear indication for anticoagulation other than AF:",
                                    "• Mechanical heart valve",
                                    "• Recent DVT/PE requiring anticoagulation",
                                    "• Left ventricular thrombus",
                                    "Left atrial appendage closure device",
                                    "Valvular AF (moderate-severe mitral stenosis, mechanical valve)",
                                    "Secondary causes of ICH requiring specific treatment",
                                    "Creatinine ≥2.5mg/dL or CrCl <25mL/min",
                                    "Hepatic insufficiency (Child-Pugh B or C)",
                                    "Active bleeding or high bleeding risk condition",
                                    "Uncontrolled hypertension (BP ≥180/100 on multiple readings)",
                                    "Platelet count <100,000/μL",
                                    "Hemoglobin <8g/dL",
                                    "Need for dual antiplatelet therapy",
                                    "Contraindication to aspirin or apixaban",
                                    "Pregnancy or breastfeeding",
                                    "Life expectancy <1 year",
                                    "Unable to adhere to study protocol",
                                    "Participation in another antithrombotic trial"
                                ]
                            },
                            {
                                name: "cAPPricorn-1 Trial",
                                nct: "NCT06393712",
                                phase: "Phase 2",
                                status: "",
                                description: "Intrathecal ALN-APP (mivelsiran) for cerebral amyloid angiopathy",
                                inclusion: [
                                    "For sporadic CAA:",
                                    "• Age ≥50 years",
                                    "• Meets Boston Criteria v2.0 for probable CAA",
                                    "• Prior symptomatic lobar ICH ≥90 days ago",
                                    "For Dutch-type hereditary CAA:",
                                    "• Age ≥30 years",
                                    "• Confirmed E693Q APP variant",
                                    "• Prior ICH ≥90 days ago (if applicable)",
                                    "MRI evidence of CAA (microbleeds, superficial siderosis)",
                                    "Modified Rankin Scale ≤4",
                                    "Able to undergo lumbar punctures",
                                    "Adequate contraception if childbearing potential",
                                    "Informed consent obtained"
                                ],
                                exclusion: [
                                    "ICH within 90 days of screening",
                                    "Other cause of ICH identified",
                                    "ALT or AST >3× upper limit of normal",
                                    "eGFR <30 mL/min/1.73m²",
                                    "Platelet count <100,000/μL",
                                    "INR >1.5 or aPTT >1.5× ULN",
                                    "Contraindication to lumbar puncture",
                                    "Active CNS infection or inflammation",
                                    "Intrathecal pump or shunt",
                                    "Spinal cord compression or injury",
                                    "History of chemical or radiation meningitis",
                                    "Pregnancy or breastfeeding",
                                    "Life expectancy <2 years",
                                    "Chronic use of anticoagulation that cannot be stopped for LP",
                                    "Prior treatment with gene therapy or oligonucleotide therapy",
                                    "Participation in another interventional trial within 30 days"
                                ]
                            },
                            {
                                name: "FASTEST Trial",
                                nct: "NCT03496883",
                                phase: "Phase 3",
                                status: "Actively recruiting",
                                description: "Recombinant Factor VIIa (rFVIIa) for acute ICH within 2 hours of symptom onset to prevent hematoma expansion",
                                inclusion: [
                                    "Age 18-80 years",
                                    "Spontaneous supratentorial ICH confirmed by CT",
                                    "ICH symptom onset ≤2 hours before treatment",
                                    "Hematoma volume 2-60 mL",
                                    "Intraventricular hemorrhage (IVH) score ≤7",
                                    "Glasgow Coma Scale ≥8",
                                    "Able to receive study drug within 2 hours of symptom onset",
                                    "Informed consent from patient or legally authorized representative"
                                ],
                                exclusion: [
                                    "On anticoagulation therapy (warfarin, DOAC, heparin)",
                                    "Known coagulopathy",
                                    "Secondary ICH:",
                                    "• Trauma",
                                    "• Known vascular malformation (AVM, aneurysm)",
                                    "• Brain tumor",
                                    "• Hemorrhagic conversion of ischemic stroke",
                                    "• Dural venous sinus thrombosis",
                                    "Brainstem hemorrhage excluded; cerebellar hemorrhage permitted",
                                    "Planned surgical evacuation within 24 hours",
                                    "Pre-existing severe disability (mRS >2)",
                                    "Known allergy to rFVIIa",
                                    "History of thromboembolic disease within 30 days",
                                    "Pregnancy",
                                    "Life expectancy <3 months from pre-existing condition"
                                ]
                            }
                        ]
                    },
                    observational: {
                        title: "Observational",
                        trials: [
                            {
                                name: "MIRROR Registry",
                                nct: "NCT04494295",
                                phase: "Observational Registry",
                                status: "",
                                description: "Minimally invasive endoscopic ICH evacuation using Aurora Surgiscope System",
                                inclusion: [
                                    "Age ≥18 years",
                                    "Spontaneous supratentorial ICH confirmed by CT",
                                    "ICH volume ≥20mL",
                                    "Surgery planned within 24 hours of last known well",
                                    "NIHSS >5",
                                    "Baseline mRS ≤2",
                                    "GCS ≥5",
                                    "Ability to undergo general anesthesia",
                                    "Informed consent from patient or LAR"
                                ],
                                exclusion: [
                                    "Secondary ICH due to:",
                                    "• Vascular lesion (AVM, aneurysm, dural fistula)",
                                    "• Brain tumor",
                                    "• Trauma",
                                    "• Hemorrhagic transformation of ischemic stroke",
                                    "• Moyamoya disease",
                                    "Fixed and dilated pupils",
                                    "Bilateral extensor posturing",
                                    "Infratentorial or brainstem ICH",
                                    "Intraventricular hemorrhage as primary pathology",
                                    "Life expectancy <6 months from other condition",
                                    "Uncorrectable coagulopathy (INR >1.4, platelets <100,000)",
                                    "Known pregnancy",
                                    "Prisoner or ward of state",
                                    "Participation in another interventional trial"
                                ]
                            },
                            {
                                name: "DISCOVERY Study (ICH Cohort)",
                                nct: "NCT04916210",
                                phase: "Observational",
                                status: "",
                                description: "Cognitive trajectories and biomarkers after ICH",
                                inclusion: [
                                    "Age ≥18 years",
                                    "Admitted with intracerebral hemorrhage",
                                    "Radiographic confirmation of ICH",
                                    "Baseline visit within 6 weeks of ICH",
                                    "Fluent in English or Spanish",
                                    "Has study partner with regular contact",
                                    "Expected survival ≥1 year"
                                ],
                                exclusion: [
                                    "Pre-existing dementia",
                                    "Unable to complete cognitive testing",
                                    "Concurrent enrollment in cognitive intervention trial",
                                    "Active substance abuse",
                                    "Severe psychiatric illness",
                                    "Terminal illness with life expectancy <1 year"
                                ]
                            }
                        ]
                    }
                }
            },
            rehab: {
                title: "Rehabilitation",
                trials: [
                    {
                        name: "MR-PICS Study",
                        nct: "NCT06506279",
                        phase: "Phase 2",
                        status: "",
                        description: "Motor Recovery through Plasticity-Inducing Cortical Stimulation using CorTec Brain Interchange System for chronic stroke recovery",
                        inclusion: [
                            "Post-ischemic stroke patients with upper extremity deficit",
                            "Chronic stroke (minimum 6 months post-stroke)",
                            "Age 22-80 years",
                            "Able to participate meaningfully in rehabilitation (Upper Extremity Fugl-Meyer score 25-45)",
                            "Disability measured between 3-4 on modified Rankin Scale",
                            "Minimum 30% preservation of corticospinal tract integrity",
                            "Ability to provide informed consent",
                            "Medically stable and cleared for neurosurgical procedure",
                            "Willingness to comply with study protocol and follow-up visits",
                            "Access to caregiver support during recovery period"
                        ],
                        exclusion: [
                            "Seizure disorder or history of seizures",
                            "Contraindications to neurosurgical procedures",
                            "Contraindications to MRI scanning",
                            "Active psychiatric condition that would interfere with participation",
                            "Pregnancy or nursing",
                            "Life expectancy less than 2 years",
                            "Current participation in other interventional clinical trials",
                            "Inability to stop anti-platelet medications 7 days before and 3 days after surgery",
                            "Therapeutic anticoagulation that cannot be safely interrupted",
                            "Active substance abuse or dependence",
                            "Severe cognitive impairment preventing informed consent",
                            "Glenohumeral subluxation, adhesive capsulitis, or upper extremity contractures with associated pain that would limit participation",
                            "Implanted electronic devices incompatible with study procedures",
                            "Prior brain surgery or cranial implants",
                            "Hemorrhagic stroke (intracerebral hemorrhage excluded)",
                            "Bilateral stroke or multiple stroke locations"
                        ]
                    }
                ]
            },
            cadasil: {
                title: "CADASIL",
                trials: [
                    {
                        name: "CADASIL Registry",
                        nct: "NCT05567744",
                        phase: "Observational Registry",
                        status: "",
                        description: "Longitudinal registry for genetically confirmed or suspected CADASIL",
                        inclusion: [
                            "Confirmed NOTCH3 mutation or suspected CADASIL",
                            "Age ≥18 years"
                        ],
                        exclusion: [
                            "Unable to provide consent"
                        ]
                    }
                ]
            }
          };

          // =================================================================
          // ANTICOAGULANT INFORMATION - Drug-specific half-lives, thrombolysis
          // thresholds, and ICH reversal protocols
          // Sources: AHA/ASA Guidelines, NEJM, Stroke Journal
          // =================================================================
          const ANTICOAGULANT_INFO = {
            apixaban: {
              name: 'Apixaban (Eliquis)',
              class: 'Direct Factor Xa Inhibitor',
              halfLife: '8-12 hours',
              halfLifeNote: 'Prolonged in renal impairment',
              thrombolysisThreshold: '48 hours since last dose',
              thrombolysisNote: 'Consider anti-Xa level if <48h - thrombolysis may be given if anti-Xa <30 ng/mL',
              ichReversal: {
                primary: '4-Factor PCC (Kcentra) 50 IU/kg (max 5000 IU)',
                alternative: 'Activated PCC (FEIBA) 50 IU/kg if 4F-PCC unavailable',
                note: 'Andexxa (andexanet alfa) is NOT recommended due to cost, availability, and thrombosis risk'
              },
              monitoring: 'Anti-Xa level (calibrated for apixaban)'
            },
            rivaroxaban: {
              name: 'Rivaroxaban (Xarelto)',
              class: 'Direct Factor Xa Inhibitor',
              halfLife: '5-9 hours (young), 11-13 hours (elderly)',
              halfLifeNote: 'Prolonged in renal impairment',
              thrombolysisThreshold: '48 hours since last dose',
              thrombolysisNote: 'Consider anti-Xa level if <48h - thrombolysis may be given if anti-Xa <30 ng/mL',
              ichReversal: {
                primary: '4-Factor PCC (Kcentra) 50 IU/kg (max 5000 IU)',
                alternative: 'Activated PCC (FEIBA) 50 IU/kg if 4F-PCC unavailable',
                note: 'Andexxa (andexanet alfa) is NOT recommended due to cost, availability, and thrombosis risk'
              },
              monitoring: 'Anti-Xa level (calibrated for rivaroxaban)'
            },
            dabigatran: {
              name: 'Dabigatran (Pradaxa)',
              class: 'Direct Thrombin Inhibitor',
              halfLife: '12-17 hours',
              halfLifeNote: 'Significantly prolonged in renal impairment (up to 28h if CrCl <30)',
              thrombolysisThreshold: '48 hours since last dose',
              thrombolysisNote: 'Consider dTT or ECT if <48h - thrombolysis may be given if dTT/ECT normal or aPTT <40s',
              ichReversal: {
                primary: 'Idarucizumab (Praxbind) 5g IV (2 x 2.5g vials)',
                alternative: '4-Factor PCC (Kcentra) 50 IU/kg if idarucizumab unavailable',
                note: 'Idarucizumab is the ONLY FDA-approved specific reversal agent for dabigatran'
              },
              monitoring: 'dTT (dilute thrombin time), ECT, or aPTT (less reliable)'
            },
            warfarin: {
              name: 'Warfarin (Coumadin)',
              class: 'Vitamin K Antagonist',
              halfLife: '20-60 hours',
              halfLifeNote: 'Variable, depends on individual metabolism',
              thrombolysisThreshold: 'INR ≤1.7',
              thrombolysisNote: 'Contraindicated if INR >1.7, PT >15s, or aPTT >40s',
              ichReversal: {
                primary: 'Vitamin K 10mg IV + 4-Factor PCC (Kcentra) based on INR and weight',
                pccDosing: 'INR 2-4: 25 IU/kg; INR 4-6: 35 IU/kg; INR >6: 50 IU/kg (max 5000 IU)',
                alternative: 'FFP 10-15 mL/kg if PCC unavailable (less effective, volume overload risk)',
                note: 'Vitamin K should always be given for sustained reversal'
              },
              monitoring: 'INR, PT'
            },
            heparin: {
              name: 'Unfractionated Heparin (UFH)',
              class: 'Indirect Thrombin Inhibitor',
              halfLife: '1-2 hours',
              halfLifeNote: 'Dose-dependent, cleared faster at higher doses',
              thrombolysisThreshold: '24 hours if therapeutic dosing',
              thrombolysisNote: 'Contraindicated if aPTT >40s - wait for normalization',
              ichReversal: {
                primary: 'Protamine sulfate 1mg per 100 units UFH (last 2-3 hours)',
                maxDose: 'Max 50mg protamine per dose',
                note: 'Protamine has rapid onset; re-dose if continued bleeding'
              },
              monitoring: 'aPTT, anti-Xa level'
            },
            lmwh: {
              name: 'Low Molecular Weight Heparin (Enoxaparin, etc.)',
              class: 'Indirect Factor Xa/IIa Inhibitor',
              halfLife: '4-6 hours',
              halfLifeNote: 'Prolonged in renal impairment',
              thrombolysisThreshold: '24 hours since last therapeutic dose',
              thrombolysisNote: 'Contraindicated within 24h of therapeutic dose; prophylactic dosing may be acceptable',
              ichReversal: {
                primary: 'Protamine sulfate 1mg per 1mg enoxaparin (if <8h since dose)',
                note: 'Protamine only partially reverses LMWH (~60% anti-Xa activity neutralized)'
              },
              monitoring: 'Anti-Xa level (preferred), aPTT (unreliable)'
            }
          };

          // =================================================================
          // TRIAL ELIGIBILITY CONFIG - Modular structure for easy modification
          // Adding a new trial = Adding an object to this config
          // =================================================================
          const TRIAL_ELIGIBILITY_CONFIG = {
            SISTER: {
              id: 'SISTER',
              name: 'SISTER Trial',
              nct: 'NCT05948566',
              category: 'ischemic',
              quickDescription: 'Late thrombolysis (4.5-24h) for anterior circulation stroke, no TNK/EVT',
              lookingFor: [
                'Anterior circulation stroke',
                'Late presenter (4.5-24h from LKW)',
                'NOT getting TNK or EVT',
                'Has salvageable tissue on CTP (mismatch profile)'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age) >= 18, required: true },
                { id: 'nihss', label: 'NIHSS ≥6 (or 4-5 disabling)', field: 'nihss', evaluate: (data) => parseInt(data.telestrokeNote?.nihss || data.strokeCodeForm?.nihss) >= 4, required: true },
                { id: 'timeWindow', label: '4.5-24h from LKW', field: 'lkw', evaluate: (data) => {
                    const hrs = data.hoursFromLKW;
                    return hrs !== null && hrs >= 4.5 && hrs <= 24;
                  }, required: true },
                { id: 'noTNK', label: 'No IV thrombolysis', field: 'tnkRecommended', evaluate: (data) => data.telestrokeNote?.tnkRecommended === false, required: true },
                { id: 'noEVT', label: 'No EVT planned', field: 'evtRecommended', evaluate: (data) => data.telestrokeNote?.evtRecommended === false, required: true },
                { id: 'aspects', label: 'ASPECTS ≥6', field: 'aspects', evaluate: (data) => parseInt(data.aspectsScore) >= 6, required: true },
                { id: 'premorbidMRS', label: 'Pre-stroke mRS ≤2', field: 'premorbidMRS', evaluate: (data) => parseInt(data.telestrokeNote?.premorbidMRS) <= 2, required: true },
                { id: 'ctpMismatch', label: 'CTP mismatch profile', field: 'ctpResults', evaluate: (data) => {
                    const ctp = (data.telestrokeNote?.ctpResults || '').toLowerCase();
                    return ctp.includes('mismatch') || ctp.includes('penumbra') || ctp.includes('salvageable');
                  }, required: true }
              ],
              exclusionFlags: [
                { id: 'priorStroke90d', label: 'Prior stroke <90 days', field: 'priorStroke90d' },
                { id: 'priorICH', label: 'Prior intracranial hemorrhage', field: 'priorICH' },
                { id: 'onAnticoag', label: 'On anticoagulation', field: 'noAnticoagulants', evaluate: (data) => data.telestrokeNote?.noAnticoagulants === false }
              ]
            },
            STEP: {
              id: 'STEP',
              name: 'STEP-EVT Trial',
              nct: 'NCT06289985',
              category: 'ischemic',
              quickDescription: 'Adaptive platform for mild LVO or medium/distal vessel occlusions',
              lookingFor: [
                'Two domains: Low NIHSS with LVO, OR Medium/Distal Vessel Occlusion',
                'Low NIHSS (0-5) + ICA/M1 occlusion, or',
                'M2/M3/M4, A1-A3, P1-P3 occlusion regardless of NIHSS'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age) >= 18, required: true },
                { id: 'timeWindow', label: 'Within 24h from LKW', field: 'lkw', evaluate: (data) => {
                    const hrs = data.hoursFromLKW;
                    return hrs !== null && hrs <= 24;
                  }, required: true },
                { id: 'premorbidMRS', label: 'Pre-stroke mRS ≤2', field: 'premorbidMRS', evaluate: (data) => parseInt(data.telestrokeNote?.premorbidMRS) <= 2, required: true },
                { id: 'vesselOcclusion', label: 'LVO or MeVO present', field: 'vesselOcclusion', evaluate: (data) => {
                    const occlusion = data.telestrokeNote?.vesselOcclusion || [];
                    return occlusion.length > 0;
                  }, required: true },
                { id: 'domainMatch', label: 'Matches Low-NIHSS or MeVO domain', field: 'nihss', evaluate: (data) => {
                    const nihss = parseInt(data.telestrokeNote?.nihss || data.strokeCodeForm?.nihss);
                    const occlusion = data.telestrokeNote?.vesselOcclusion || [];
                    // Low NIHSS domain: NIHSS 0-5 with ICA or M1
                    const lowNIHSSMatch = nihss <= 5 && (occlusion.includes('ICA') || occlusion.includes('M1'));
                    // MeVO domain: M2, M3, A1-A3, P1-P3
                    const mevoMatch = occlusion.some(v => ['M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3'].includes(v));
                    return lowNIHSSMatch || mevoMatch;
                  }, required: true }
              ],
              exclusionFlags: [
                { id: 'pregnancy', label: 'Pregnancy', field: 'pregnancy' },
                { id: 'hemorrhage', label: 'Evidence of hemorrhage', field: 'hemorrhage' }
              ]
            },
            PICASSO: {
              id: 'PICASSO',
              name: 'PICASSO Trial',
              nct: 'NCT05611242',
              category: 'ischemic',
              quickDescription: 'Tandem lesion: carotid stenosis + intracranial LVO',
              lookingFor: [
                'Tandem lesion (carotid + intracranial)',
                'Extracranial ICA stenosis 70-100%',
                'Plus intracranial LVO (ICA-T, M1, proximal M2)'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age 18-79', field: 'age', evaluate: (data) => {
                    const age = parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age);
                    return age >= 18 && age <= 79;
                  }, required: true },
                { id: 'timeWindow', label: 'Within 16h from LKW', field: 'lkw', evaluate: (data) => {
                    const hrs = data.hoursFromLKW;
                    return hrs !== null && hrs <= 16;
                  }, required: true },
                { id: 'nihss', label: 'NIHSS ≥4', field: 'nihss', evaluate: (data) => parseInt(data.telestrokeNote?.nihss || data.strokeCodeForm?.nihss) >= 4, required: true },
                { id: 'premorbidMRS', label: 'Pre-stroke mRS 0-2', field: 'premorbidMRS', evaluate: (data) => parseInt(data.telestrokeNote?.premorbidMRS) <= 2, required: true },
                { id: 'aspects', label: 'ASPECTS ≥7', field: 'aspects', evaluate: (data) => parseInt(data.aspectsScore) >= 7, required: true },
                { id: 'tandemLesion', label: 'Tandem lesion present', field: 'ctaResults', evaluate: (data) => {
                    const cta = (data.telestrokeNote?.ctaResults || data.strokeCodeForm?.cta || '').toLowerCase();
                    return (cta.includes('tandem') || (cta.includes('carotid') && (cta.includes('m1') || cta.includes('ica'))));
                  }, required: true }
              ],
              exclusionFlags: []
            },
            TESTED: {
              id: 'TESTED',
              name: 'TESTED',
              nct: 'NCT05911568',
              category: 'ischemic',
              quickDescription: 'EVT in patients with pre-existing disability (mRS 3-4)',
              lookingFor: [
                'Patient with EXISTING disability (mRS 3-4)',
                'LVO stroke within 24h',
                'ASPECTS ≥3'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age) >= 18, required: true },
                { id: 'premorbidMRS', label: 'Pre-stroke mRS 3-4', field: 'premorbidMRS', evaluate: (data) => {
                    const mrs = parseInt(data.telestrokeNote?.premorbidMRS);
                    return mrs >= 3 && mrs <= 4;
                  }, required: true },
                { id: 'nihss', label: 'NIHSS ≥6', field: 'nihss', evaluate: (data) => parseInt(data.telestrokeNote?.nihss || data.strokeCodeForm?.nihss) >= 6, required: true },
                { id: 'timeWindow', label: 'Within 24h from LKW', field: 'lkw', evaluate: (data) => {
                    const hrs = data.hoursFromLKW;
                    return hrs !== null && hrs <= 24;
                  }, required: true },
                { id: 'aspects', label: 'ASPECTS ≥3', field: 'aspects', evaluate: (data) => parseInt(data.aspectsScore) >= 3, required: true },
                { id: 'lvo', label: 'LVO present', field: 'vesselOcclusion', evaluate: (data) => {
                    const occlusion = data.telestrokeNote?.vesselOcclusion || [];
                    return occlusion.some(v => ['ICA', 'M1', 'M2'].includes(v));
                  }, required: true }
              ],
              exclusionFlags: []
            },
            SATURN: {
              id: 'SATURN',
              name: 'SATURN Trial',
              nct: 'NCT03936361',
              category: 'ich',
              quickDescription: 'Statin continuation vs discontinuation after lobar ICH',
              lookingFor: [
                'Lobar ICH (NOT deep/basal ganglia)',
                'Already on statin therapy',
                'Age ≥50'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age ≥50', field: 'age', evaluate: (data) => parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age) >= 50, required: true },
                { id: 'lobarICH', label: 'Lobar ICH location', field: 'ichLocation', evaluate: (data) => {
                    const loc = (data.ichLocation || '').toLowerCase();
                    return loc.includes('lobar') || loc.includes('cortical');
                  }, required: true },
                { id: 'onStatin', label: 'On statin at ICH onset', field: 'onStatin', evaluate: (data) => data.onStatin === true, required: true },
                { id: 'mrs', label: 'mRS ≤4 at randomization', field: 'mrsScore', evaluate: (data) => parseInt(data.mrsScore) <= 4, required: true }
              ],
              exclusionFlags: [
                { id: 'deepICH', label: 'Deep/non-lobar ICH', field: 'ichLocation' },
                { id: 'recentMI', label: 'Recent MI <3 months', field: 'recentMI' }
              ]
            },
            ASPIRE: {
              id: 'ASPIRE',
              name: 'ASPIRE Trial',
              nct: 'NCT03907046',
              category: 'ich',
              quickDescription: 'Apixaban vs aspirin post-ICH in atrial fibrillation',
              lookingFor: [
                'ICH patient with atrial fibrillation',
                'Randomize 14-180 days post-ICH',
                'CHA2DS2-VASc ≥2'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age) >= 18, required: true },
                { id: 'ichConfirmed', label: 'ICH confirmed', field: 'diagnosis', evaluate: (data) => {
                    const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                    return dx.includes('ich') || dx.includes('hemorrhage') || dx.includes('hemorrhagic');
                  }, required: true },
                { id: 'afib', label: 'Atrial fibrillation', field: 'pmh', evaluate: (data) => {
                    const pmh = (data.telestrokeNote?.pmh || '').toLowerCase();
                    return pmh.includes('afib') || pmh.includes('atrial fib') || pmh.includes('af ') || pmh.includes('a-fib');
                  }, required: true },
                { id: 'mrs', label: 'mRS ≤4', field: 'mrsScore', evaluate: (data) => parseInt(data.mrsScore) <= 4, required: true }
              ],
              exclusionFlags: [
                { id: 'mechValve', label: 'Mechanical heart valve', field: 'mechValve' }
              ]
            },
            FASTEST: {
              id: 'FASTEST',
              name: 'FASTEST Trial',
              nct: 'NCT03496883',
              category: 'ich',
              quickDescription: 'rFVIIa within 2 hours of ICH onset for hematoma expansion prevention',
              lookingFor: [
                'Acute ICH within 2 HOURS of symptom onset',
                'Hematoma volume 2-60 mL',
                'Not on anticoagulants',
                'Age 18-80'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age 18-80', field: 'age', evaluate: (data) => {
                    const age = parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age);
                    return age >= 18 && age <= 80;
                  }, required: true },
                { id: 'ichConfirmed', label: 'ICH confirmed on imaging', field: 'diagnosis', evaluate: (data) => {
                    const dx = (data.telestrokeNote?.diagnosis || data.strokeCodeForm?.diagnosis || '').toLowerCase();
                    const ct = (data.telestrokeNote?.ctResults || data.strokeCodeForm?.ctResults || '').toLowerCase();
                    return dx.includes('ich') || dx.includes('hemorrhage') || ct.includes('hemorrhage') || ct.includes('bleed');
                  }, required: true },
                { id: 'timeWindow', label: 'Within 2h of onset', field: 'lkw', evaluate: (data) => {
                    const hrs = data.hoursFromLKW;
                    return hrs !== null && hrs <= 2;
                  }, required: true },
                { id: 'volume', label: 'Hematoma 2-60 mL', field: 'ichVolume', evaluate: (data) => {
                    const vol = parseFloat(data.ichVolume);
                    return !isNaN(vol) && vol >= 2 && vol <= 60;
                  }, required: true },
                { id: 'noAnticoag', label: 'Not on anticoagulants', field: 'noAnticoagulants', evaluate: (data) => {
                    return data.telestrokeNote?.noAnticoagulants === true;
                  }, required: true },
                { id: 'gcs', label: 'GCS ≥8 (not deeply comatose)', field: 'gcs', evaluate: (data) => {
                    const gcs = parseInt(data.gcsScore);
                    return !isNaN(gcs) && gcs >= 8;
                  }, required: true },
                { id: 'premorbidMRS', label: 'Pre-stroke mRS ≤2', field: 'premorbidMRS', evaluate: (data) => {
                    const mrs = parseInt(data.telestrokeNote?.premorbidMRS);
                    return !isNaN(mrs) && mrs <= 2;
                  }, required: true }
              ],
              exclusionFlags: [
                { id: 'onAnticoag', label: 'On anticoagulation', field: 'onAnticoag' },
                { id: 'largeIVH', label: 'IVH score >7', field: 'largeIVH' },
                { id: 'brainstem', label: 'Brainstem hemorrhage', field: 'brainstemICH' },
                { id: 'secondary', label: 'Secondary ICH (trauma, AVM, tumor)', field: 'secondaryICH' }
              ]
            },
            VERIFY: {
              id: 'VERIFY',
              name: 'VERIFY Study',
              nct: 'NCT05338697',
              category: 'ischemic',
              quickDescription: 'Observational: TMS/MRI to predict motor recovery',
              lookingFor: [
                'Acute ischemic stroke within 7 days',
                'Upper extremity weakness',
                'Inpatient enrollment opportunity'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age) >= 18, required: true },
                { id: 'ueWeakness', label: 'Upper extremity weakness', field: 'symptoms', evaluate: (data) => {
                    const sx = (data.telestrokeNote?.symptoms || '').toLowerCase();
                    return sx.includes('arm') || sx.includes('upper') || sx.includes('hand') || sx.includes('weakness');
                  }, required: false },
                { id: 'premorbidMRS', label: 'Pre-stroke mRS ≤2', field: 'premorbidMRS', evaluate: (data) => parseInt(data.telestrokeNote?.premorbidMRS) <= 2, required: true }
              ],
              exclusionFlags: [
                { id: 'seizures', label: 'History of seizures', field: 'seizures' },
                { id: 'implants', label: 'Implanted devices (pacemaker, etc.)', field: 'implants' }
              ]
            },
            DISCOVERY: {
              id: 'DISCOVERY',
              name: 'DISCOVERY Study',
              nct: 'NCT04916210',
              category: 'ischemic',
              quickDescription: 'Observational: Cognitive trajectories post-stroke',
              lookingFor: [
                'Any stroke type (AIS, ICH, SAH)',
                'Baseline visit within 6 weeks',
                'Able to complete cognitive testing'
              ],
              keyCriteria: [
                { id: 'age', label: 'Age ≥18', field: 'age', evaluate: (data) => parseInt(data.telestrokeNote?.age || data.strokeCodeForm?.age) >= 18, required: true },
                { id: 'strokeConfirmed', label: 'Stroke confirmed', field: 'diagnosis', evaluate: (data) => {
                    const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                    return dx.includes('stroke') || dx.includes('ischemic') || dx.includes('ich') || dx.includes('sah');
                  }, required: true }
              ],
              exclusionFlags: [
                { id: 'preDementia', label: 'Pre-existing dementia', field: 'preDementia' }
              ]
            }
          };

          // =================================================================
          // GUIDELINE RECOMMENDATIONS KNOWLEDGE BASE
          // Evidence-based recommendations from current stroke guidelines
          // =================================================================
          const GUIDELINE_RECOMMENDATIONS = {
            // ---------------------------------------------------------------
            // BLOOD PRESSURE MANAGEMENT
            // ---------------------------------------------------------------
            bp_pre_tnk: {
              id: 'bp_pre_tnk',
              category: 'Blood Pressure',
              title: 'Pre-thrombolysis BP target',
              recommendation: 'Maintain BP <185/110 mmHg before and during IV thrombolysis administration.',
              detail: 'Use IV labetalol 10-20 mg or nicardipine 5 mg/hr (titrate by 2.5 mg/hr q5-15 min, max 15 mg/hr). If BP cannot be maintained <185/110, thrombolysis is contraindicated.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              medications: ['Labetalol 10-20 mg IV', 'Nicardipine 5 mg/hr IV'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isIschemic = dx.includes('ischemic') || dx.includes('stroke') || dx.includes('lvo');
                const timeFrom = data.timeFromLKW;
                const inWindow = timeFrom && timeFrom.total <= 4.5;
                return isIschemic && (inWindow || data.telestrokeNote?.tnkRecommended);
              }
            },
            bp_post_tnk: {
              id: 'bp_post_tnk',
              category: 'Blood Pressure',
              title: 'Post-thrombolysis BP target',
              recommendation: 'Maintain BP <180/105 mmHg for 24 hours after IV thrombolysis.',
              detail: 'Monitor BP every 15 minutes for 2 hours, then every 30 minutes for 6 hours, then hourly for 16 hours.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              medications: ['Labetalol IV PRN', 'Nicardipine infusion'],
              conditions: (data) => {
                return !!data.telestrokeNote?.tnkAdminTime;
              }
            },
            bp_post_evt: {
              id: 'bp_post_evt',
              category: 'Blood Pressure',
              title: 'Post-EVT BP management (Class III: Harm)',
              recommendation: 'Do NOT target SBP <140 mmHg after successful EVT reperfusion. Maintain SBP <180/105.',
              detail: 'ENCHANTED2/MT and OPTIMAL-BP trials demonstrated that intensive BP lowering (SBP <140) post-EVT was associated with worse functional outcomes (Class III: Harm). Standard target SBP <180/105 is recommended.',
              classOfRec: 'III',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              caveats: 'Based on ENCHANTED2/MT (2023) and OPTIMAL-BP (2024). Applies to successful reperfusion (mTICI 2b-3).',
              conditions: (data) => {
                return !!data.telestrokeNote?.evtRecommended;
              }
            },
            bp_ich_acute: {
              id: 'bp_ich_acute',
              category: 'Blood Pressure',
              title: 'ICH acute BP target',
              recommendation: 'Target SBP 130-150 mmHg within 2 hours of ICH onset. Initiate rapid treatment for SBP >150.',
              detail: 'Nicardipine infusion preferred for reliable titration. Avoid SBP <130 (risk of renal AKI). Maintain target for at least 24 hours.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Spontaneous ICH 2022',
              reference: 'Greenberg SM et al. Stroke. 2022;53:e282-e361. DOI: 10.1161/STR.0000000000000407',
              medications: ['Nicardipine 5 mg/hr IV (titrate to 15 mg/hr)', 'Labetalol 10-20 mg IV bolus PRN'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('ich') || dx.includes('hemorrhag') || dx.includes('intracerebral');
              }
            },
            bp_ischemic_no_lysis: {
              id: 'bp_ischemic_no_lysis',
              category: 'Blood Pressure',
              title: 'Ischemic stroke BP (no thrombolysis)',
              recommendation: 'Permissive hypertension: treat only if BP >220/120 mmHg in first 24-48 hours. Lower by 15% in first 24 hours if treating.',
              detail: 'For patients not receiving thrombolysis or EVT, aggressive BP lowering may worsen ischemic penumbra. After 24-48h, initiate oral antihypertensives to target <130/80 for secondary prevention.',
              classOfRec: 'I',
              levelOfEvidence: 'C-EO',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isIschemic = dx.includes('ischemic') || dx.includes('stroke') || dx.includes('lvo');
                return isIschemic && !data.telestrokeNote?.tnkRecommended && !data.telestrokeNote?.evtRecommended;
              }
            },

            // ---------------------------------------------------------------
            // THROMBOLYSIS
            // ---------------------------------------------------------------
            tnk_standard: {
              id: 'tnk_standard',
              category: 'Thrombolysis',
              title: 'IV TNK for acute ischemic stroke',
              recommendation: 'Administer TNK 0.25 mg/kg (max 25 mg) single IV bolus within 4.5 hours of symptom onset.',
              detail: 'TNK is the preferred thrombolytic due to single-bolus dosing (Class I, LOE A). Administer at spoke and transfer immediately for EVT evaluation if LVO suspected. Do not delay for imaging beyond NCCT.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              medications: ['TNK 0.25 mg/kg IV bolus (max 25 mg)'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isIschemic = dx.includes('ischemic') || dx.includes('stroke') || dx.includes('lvo');
                const timeFrom = data.timeFromLKW;
                return isIschemic && timeFrom && timeFrom.total <= 4.5;
              }
            },
            tnk_extended_imaging: {
              id: 'tnk_extended_imaging',
              category: 'Thrombolysis',
              title: 'Extended window TNK (4.5-24h)',
              recommendation: 'TNK 0.25 mg/kg (max 25 mg) IV bolus may be considered in the 4.5-24 hour window when perfusion imaging shows salvageable tissue (core <70 mL, mismatch ratio >1.2).',
              detail: 'Based on TIMELESS trial (2025): TNK in the 4.5-24h window with perfusion mismatch showed improved functional outcomes. Also supported by EXTEND/WAKE-UP criteria (DWI-FLAIR mismatch for wake-up strokes). Requires CTP or MRI DWI/perfusion before treatment.',
              classOfRec: 'IIa',
              levelOfEvidence: 'B-R',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026; TIMELESS Investigators. NEJM 2025.',
              medications: ['TNK 0.25 mg/kg IV bolus (max 25 mg)'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isIschemic = dx.includes('ischemic') || dx.includes('stroke') || dx.includes('lvo');
                const timeFrom = data.timeFromLKW;
                return isIschemic && timeFrom && timeFrom.total > 4.5 && timeFrom.total <= 24;
              }
            },

            // ---------------------------------------------------------------
            // ENDOVASCULAR THERAPY (EVT)
            // ---------------------------------------------------------------
            evt_standard: {
              id: 'evt_standard',
              category: 'EVT',
              title: 'EVT for LVO within 6 hours',
              recommendation: 'EVT recommended for anterior LVO (ICA, M1) within 6 hours of onset with NIHSS >= 6 and ASPECTS >= 6.',
              detail: 'Do not delay transfer for TNK response. Administer TNK at spoke and transfer immediately for EVT evaluation.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              conditions: (data) => {
                const nihss = parseInt(data.telestrokeNote?.nihss) || data.nihssScore || 0;
                const timeFrom = data.timeFromLKW;
                const hasLVO = (data.telestrokeNote?.vesselOcclusion || []).some(v =>
                  /ica|m1|mca/i.test(v)
                );
                return nihss >= 6 && timeFrom && timeFrom.total <= 6 && hasLVO;
              }
            },
            evt_late_window: {
              id: 'evt_late_window',
              category: 'EVT',
              title: 'EVT late window (6-24h)',
              recommendation: 'EVT recommended 6-24 hours from onset for anterior LVO with favorable perfusion imaging or good collaterals (NIHSS >= 6).',
              detail: 'Based on DAWN/DEFUSE-3 criteria. Requires CT perfusion or MRI DWI/perfusion showing target mismatch. Age >= 80 requires NIHSS >= 10. Good collateral status on CTA may independently predict benefit in late window.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              caveats: 'Collateral grading on multiphase CTA or single-phase CTA may support EVT candidacy when CTP unavailable.',
              conditions: (data) => {
                const nihss = parseInt(data.telestrokeNote?.nihss) || data.nihssScore || 0;
                const timeFrom = data.timeFromLKW;
                const hasLVO = (data.telestrokeNote?.vesselOcclusion || []).some(v =>
                  /ica|m1|mca/i.test(v)
                );
                return nihss >= 6 && timeFrom && timeFrom.total > 6 && timeFrom.total <= 24 && hasLVO;
              }
            },
            evt_large_core: {
              id: 'evt_large_core',
              category: 'EVT',
              title: 'EVT for large ischemic core (ASPECTS 3-5)',
              recommendation: 'EVT can be beneficial for anterior LVO with ASPECTS 3-5 within 24 hours when NIHSS >= 6.',
              detail: 'Based on SELECT2, RESCUE-Japan LIMIT, and ANGEL-ASPECT (2023). Despite larger infarcts, EVT still provides benefit. Goals-of-care discussion recommended. Higher sICH rates (~10%) and mortality. Consider patient/family preferences.',
              classOfRec: 'IIa',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026; SELECT2 (NEJM 2023); ANGEL-ASPECT (NEJM 2023); RESCUE-Japan LIMIT (NEJM 2023).',
              caveats: 'Trial eligibility: SELECT2 (ASPECTS 3-5, NIHSS >=6, LVO, <24h); ANGEL-ASPECT (ASPECTS 3-5, core 70-100mL, <24h); RESCUE-Japan LIMIT (ASPECTS 3-5, <24h).',
              conditions: (data) => {
                const nihss = parseInt(data.telestrokeNote?.nihss) || data.nihssScore || 0;
                const aspects = data.aspectsScore;
                const hasLVO = (data.telestrokeNote?.vesselOcclusion || []).some(v =>
                  /ica|m1|mca/i.test(v)
                );
                return nihss >= 6 && aspects >= 3 && aspects <= 5 && hasLVO;
              }
            },
            evt_basilar: {
              id: 'evt_basilar',
              category: 'EVT',
              title: 'EVT for basilar artery occlusion',
              recommendation: 'EVT is recommended for basilar artery occlusion within 24 hours of symptom onset.',
              detail: 'Based on ATTENTION and BAOCHE trials (2023). Benefit demonstrated up to 24 hours. Consider in posterior circulation strokes with significant deficit.',
              classOfRec: 'I',
              levelOfEvidence: 'B-R',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              conditions: (data) => {
                const timeFrom = data.timeFromLKW;
                const hasBasilar = (data.telestrokeNote?.vesselOcclusion || []).some(v =>
                  /basilar/i.test(v)
                );
                return hasBasilar && timeFrom && timeFrom.total <= 24;
              }
            },

            // ---------------------------------------------------------------
            // ANTITHROMBOTIC THERAPY
            // ---------------------------------------------------------------
            dapt_minor_stroke: {
              id: 'dapt_minor_stroke',
              category: 'Antithrombotic',
              title: 'DAPT for minor stroke/TIA',
              recommendation: 'Dual antiplatelet therapy (aspirin + clopidogrel) for 21 days in minor ischemic stroke (NIHSS <= 3) or high-risk TIA, then transition to single antiplatelet.',
              detail: 'Start within 24 hours of onset. Loading dose: ASA 325 mg + clopidogrel 300 mg, then ASA 81 mg + clopidogrel 75 mg daily for 21 days. Based on CHANCE/POINT trials.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467. DOI: 10.1161/STR.0000000000000375',
              medications: ['ASA 325 mg load then 81 mg daily', 'Clopidogrel 300 mg load then 75 mg daily x 21 days'],
              conditions: (data) => {
                const nihss = parseInt(data.telestrokeNote?.nihss) || data.nihssScore || 0;
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isIschemic = dx.includes('ischemic') || dx.includes('stroke') || dx.includes('tia');
                return isIschemic && nihss <= 3 && !data.telestrokeNote?.tnkRecommended;
              }
            },
            anticoag_af_timing: {
              id: 'anticoag_af_timing',
              category: 'Antithrombotic',
              title: 'Early DOAC initiation in AF-related stroke',
              recommendation: 'Initiate DOAC early after AF-related ischemic stroke based on infarct severity: minor stroke within 48 hours, moderate stroke day 3-5, severe/large stroke day 6-14.',
              detail: 'Based on CATALYST meta-analysis (ELAN, OPTIMAS, TIMING, START pooled data). No increased risk of symptomatic ICH with early DOAC initiation vs delayed. Individual timing should consider hemorrhagic transformation on imaging. DOAC preferred over warfarin (Class I, LOE A).',
              classOfRec: 'IIa',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021 + CATALYST Meta-Analysis 2025',
              reference: 'Fischer U et al. Lancet Neurol. 2025. CATALYST: Collaboration for Antithrombotic Timing After Acute Ischaemic Stroke.',
              medications: ['Apixaban 5 mg BID (preferred)', 'Rivaroxaban 20 mg daily', 'Dabigatran 150 mg BID'],
              caveats: 'Timing categories per CATALYST: minor (NIHSS <8, small infarct) 48h; moderate (NIHSS 8-15) day 3-5; severe (NIHSS >15 or large infarct) day 6-14. Reassess imaging before starting if any concern for hemorrhagic transformation.',
              conditions: (data) => {
                const meds = (data.telestrokeNote?.medications || '').toLowerCase();
                const pmh = (data.telestrokeNote?.pmh || '').toLowerCase();
                const hasAF = pmh.includes('afib') || pmh.includes('atrial fib') || pmh.includes('a-fib') || pmh.includes('af ') ||
                              meds.includes('apixaban') || meds.includes('rivaroxaban') || meds.includes('eliquis') || meds.includes('xarelto') ||
                              meds.includes('warfarin') || meds.includes('coumadin') || meds.includes('dabigatran') || meds.includes('pradaxa');
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isIschemic = dx.includes('ischemic') || dx.includes('stroke');
                return isIschemic && hasAF;
              }
            },
            sicas_dapt: {
              id: 'sicas_dapt',
              category: 'Antithrombotic',
              title: 'Symptomatic intracranial atherosclerosis (sICAS) DAPT',
              recommendation: 'DAPT (aspirin + clopidogrel) for 90 days for severe symptomatic intracranial stenosis (70-99%), then aspirin 325 mg monotherapy.',
              detail: 'Do NOT offer intracranial stenting as initial treatment (Class III). Add high-intensity statin with LDL target <70 mg/dL. Based on SAMMPRIS trial evidence.',
              classOfRec: 'I',
              levelOfEvidence: 'B-R',
              guideline: 'AAN Intracranial Atherosclerosis Practice Advisory 2022 (reaffirmed 2025)',
              reference: 'AAN Practice Advisory 2022. Reaffirmed 2025.',
              medications: ['ASA 325 mg daily (after 90-day DAPT)', 'Clopidogrel 75 mg daily x 90 days', 'High-intensity statin'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const cta = (data.telestrokeNote?.ctaResults || '').toLowerCase();
                return dx.includes('intracranial') || dx.includes('icas') || cta.includes('intracranial stenosis') || cta.includes('icas');
              }
            },

            // ---------------------------------------------------------------
            // STATIN THERAPY
            // ---------------------------------------------------------------
            statin_ischemic: {
              id: 'statin_ischemic',
              category: 'Statin',
              title: 'High-intensity statin for ischemic stroke',
              recommendation: 'Initiate high-intensity statin therapy (atorvastatin 40-80 mg or rosuvastatin 20-40 mg) with LDL target <70 mg/dL.',
              detail: 'Add ezetimibe if LDL not at goal on max statin. Consider PCSK9 inhibitor if still not at goal. Start during hospitalization.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467. DOI: 10.1161/STR.0000000000000375',
              medications: ['Atorvastatin 80 mg daily', 'Rosuvastatin 20-40 mg daily', 'Ezetimibe 10 mg if LDL not at goal'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('ischemic') || dx.includes('stroke') || dx.includes('tia') || dx.includes('lvo');
              }
            },

            // ---------------------------------------------------------------
            // ANTICOAGULATION REVERSAL (ICH)
            // ---------------------------------------------------------------
            reversal_warfarin: {
              id: 'reversal_warfarin',
              category: 'Reversal',
              title: 'Warfarin reversal in ICH',
              recommendation: 'Administer IV Vitamin K 10 mg + 4-factor PCC (KCentra) for ICH on warfarin. Target INR <1.5 within 4 hours.',
              detail: 'PCC preferred over FFP (faster, lower volume, more predictable reversal). Recheck INR at 30-60 minutes. Repeat PCC if INR remains elevated.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Spontaneous ICH 2022',
              reference: 'Greenberg SM et al. Stroke. 2022;53:e282-e361. DOI: 10.1161/STR.0000000000000407',
              medications: ['Vitamin K 10 mg IV over 20 min', '4F-PCC (KCentra) 25-50 IU/kg based on INR'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const meds = (data.telestrokeNote?.medications || '').toLowerCase();
                const isICH = dx.includes('ich') || dx.includes('hemorrhag') || dx.includes('intracerebral');
                const onWarfarin = meds.includes('warfarin') || meds.includes('coumadin');
                return isICH && onWarfarin;
              }
            },
            reversal_dabigatran: {
              id: 'reversal_dabigatran',
              category: 'Reversal',
              title: 'Dabigatran reversal in ICH',
              recommendation: 'Administer idarucizumab (Praxbind) 5g IV (2 x 2.5g) for ICH on dabigatran.',
              detail: 'If idarucizumab unavailable, use 4F-PCC 50 IU/kg. Reversal is immediate with idarucizumab.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Spontaneous ICH 2022',
              reference: 'Greenberg SM et al. Stroke. 2022;53:e282-e361. DOI: 10.1161/STR.0000000000000407',
              medications: ['Idarucizumab (Praxbind) 5g IV', 'Alt: 4F-PCC 50 IU/kg if unavailable'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const meds = (data.telestrokeNote?.medications || '').toLowerCase();
                const isICH = dx.includes('ich') || dx.includes('hemorrhag') || dx.includes('intracerebral');
                const onDabigatran = meds.includes('dabigatran') || meds.includes('pradaxa');
                return isICH && onDabigatran;
              }
            },
            reversal_xa_inhibitor: {
              id: 'reversal_xa_inhibitor',
              category: 'Reversal',
              title: 'Factor Xa inhibitor reversal in ICH',
              recommendation: 'Administer andexanet alfa or 4F-PCC 50 IU/kg for ICH on apixaban/rivaroxaban.',
              detail: 'Andexanet alfa (Andexxa) if available: low-dose bolus 400 mg then 480 mg infusion (rivaroxaban >7h or apixaban), high-dose 800 mg then 960 mg (rivaroxaban <7h). If unavailable, use 4F-PCC 50 IU/kg.',
              classOfRec: 'IIa',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Spontaneous ICH 2022',
              reference: 'Greenberg SM et al. Stroke. 2022;53:e282-e361. DOI: 10.1161/STR.0000000000000407',
              medications: ['Andexanet alfa (Andexxa) per dosing protocol', '4F-PCC 50 IU/kg if andexanet unavailable'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const meds = (data.telestrokeNote?.medications || '').toLowerCase();
                const isICH = dx.includes('ich') || dx.includes('hemorrhag') || dx.includes('intracerebral');
                const onXaInhibitor = meds.includes('apixaban') || meds.includes('eliquis') ||
                                      meds.includes('rivaroxaban') || meds.includes('xarelto');
                return isICH && onXaInhibitor;
              }
            },

            // ---------------------------------------------------------------
            // DISPOSITION & TRANSFER
            // ---------------------------------------------------------------
            transfer_evt: {
              id: 'transfer_evt',
              category: 'Disposition',
              title: 'Transfer for EVT evaluation',
              recommendation: 'Transfer LVO patients to EVT-capable center immediately. Do NOT wait for clinical response to IV thrombolysis before initiating transfer.',
              detail: 'Administer TNK at spoke site (if eligible) and initiate transfer simultaneously. Time-to-reperfusion is the critical metric.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              conditions: (data) => {
                const hasLVO = (data.telestrokeNote?.vesselOcclusion || []).some(v =>
                  /ica|m1|mca|basilar/i.test(v)
                );
                const nihss = parseInt(data.telestrokeNote?.nihss) || data.nihssScore || 0;
                return hasLVO && nihss >= 6;
              }
            },
            cerebellar_ich_surgery: {
              id: 'cerebellar_ich_surgery',
              category: 'Disposition',
              title: 'Cerebellar ICH: surgical evacuation',
              recommendation: 'Urgent surgical evacuation for cerebellar ICH >15 mL with neurological deterioration, brainstem compression, or obstructive hydrocephalus.',
              detail: 'EVD alone insufficient for large cerebellar hemorrhages. Suboccipital craniectomy recommended. Transfer to neurosurgical center emergently.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Spontaneous ICH 2022',
              reference: 'Greenberg SM et al. Stroke. 2022;53:e282-e361. DOI: 10.1161/STR.0000000000000407',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const ct = (data.telestrokeNote?.ctResults || '').toLowerCase();
                const isICH = dx.includes('ich') || dx.includes('hemorrhag') || dx.includes('intracerebral');
                const isCerebellar = ct.includes('cerebell') || dx.includes('cerebell') || ct.includes('posterior fossa');
                return isICH && isCerebellar;
              }
            },
            decompressive_craniectomy: {
              id: 'decompressive_craniectomy',
              category: 'Disposition',
              title: 'Decompressive craniectomy for malignant MCA infarction',
              recommendation: 'Consider decompressive craniectomy within 48 hours for malignant MCA infarction in patients age <60 with deteriorating neurological status despite medical therapy.',
              detail: 'Based on pooled analysis of DECIMAL, DESTINY, HAMLET trials. Reduces mortality from ~78% to ~22%. Discuss functional outcomes and goals of care with family.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              conditions: (data) => {
                const nihss = parseInt(data.telestrokeNote?.nihss) || data.nihssScore || 0;
                const age = parseInt(data.telestrokeNote?.age) || 0;
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isIschemic = dx.includes('ischemic') || dx.includes('mca') || dx.includes('malignant');
                return isIschemic && nihss >= 15 && age > 0 && age < 60;
              }
            },

            // ---------------------------------------------------------------
            // SECONDARY PREVENTION
            // ---------------------------------------------------------------
            carotid_intervention: {
              id: 'carotid_intervention',
              category: 'Secondary Prevention',
              title: 'Carotid intervention for symptomatic stenosis',
              recommendation: 'Carotid endarterectomy (CEA) or stenting within 2 weeks for symptomatic carotid stenosis 70-99%. Consider for 50-69% based on patient factors.',
              detail: 'CEA preferred if age >70 and suitable anatomy. CAS reasonable if high surgical risk. Benefit diminishes if delayed beyond 2 weeks.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467. DOI: 10.1161/STR.0000000000000375',
              conditions: (data) => {
                const cta = (data.telestrokeNote?.ctaResults || '').toLowerCase();
                return cta.includes('carotid') && (cta.includes('stenosis') || cta.includes('occlus'));
              }
            },
            pfo_closure: {
              id: 'pfo_closure',
              category: 'Secondary Prevention',
              title: 'PFO closure for cryptogenic stroke',
              recommendation: 'PFO closure is recommended for patients age 18-60 with cryptogenic ischemic stroke and high-risk PFO features (atrial septal aneurysm, large shunt).',
              detail: 'Based on CLOSE, RESPECT, REDUCE trials. Also antiplatelet therapy. Anticoagulation if concurrent DVT/PE.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467. DOI: 10.1161/STR.0000000000000375',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const age = parseInt(data.telestrokeNote?.age) || 0;
                return (dx.includes('cryptogenic') || dx.includes('pfo') || dx.includes('esus')) && age >= 18 && age <= 60;
              }
            },

            // ---------------------------------------------------------------
            // SUPPORTIVE CARE
            // ---------------------------------------------------------------
            dysphagia_screen: {
              id: 'dysphagia_screen',
              category: 'Supportive Care',
              title: 'Dysphagia screening',
              recommendation: 'Keep patient NPO until formal dysphagia screening is passed. Screen before any oral intake including medications.',
              detail: 'Use validated bedside screening tool (e.g., Yale Swallow Protocol, 3-oz water test). SLP evaluation for failed screens. Aspiration pneumonia is a leading cause of post-stroke mortality.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('stroke') || dx.includes('ischemic') || dx.includes('ich') || dx.includes('hemorrhag');
              }
            },
            vte_prophylaxis: {
              id: 'vte_prophylaxis',
              category: 'Supportive Care',
              title: 'VTE prophylaxis',
              recommendation: 'Intermittent pneumatic compression (IPC) on admission. Add pharmacologic prophylaxis (LMWH or UFH) after 24-48 hours in immobile patients.',
              detail: 'For ischemic stroke post-TNK: delay pharmacologic VTE prophylaxis 24 hours. For ICH: IPC immediately; consider pharmacologic prophylaxis after 24-48h if hematoma stable.',
              classOfRec: 'I',
              levelOfEvidence: 'B-R',
              guideline: 'AHA Systemic Complications of Acute Stroke 2024',
              reference: 'AHA Scientific Statement 2024. DOI: 10.1161/STR.0000000000000477',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('stroke') || dx.includes('ischemic') || dx.includes('ich') || dx.includes('hemorrhag');
              }
            },
            glycemic_management: {
              id: 'glycemic_management',
              category: 'Glycemic',
              title: 'Glycemic management (Class III: Harm for intensive insulin)',
              recommendation: 'Target glucose 140-180 mg/dL. Do NOT use IV insulin to target 80-130 mg/dL (Class III: Harm). Treat hypoglycemia <60 mg/dL emergently.',
              detail: 'SHINE trial demonstrated no benefit and increased hypoglycemia with intensive glucose control (80-130). Subcutaneous insulin sliding scale preferred for mild hyperglycemia.',
              classOfRec: 'III',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026. DOI: 10.1161/STR.0000000000000513',
              conditions: (data) => {
                const glucose = parseInt(data.telestrokeNote?.glucose) || 0;
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isStroke = dx.includes('stroke') || dx.includes('ischemic') || dx.includes('ich');
                return isStroke && (glucose > 180 || glucose < 60 || glucose === 0);
              }
            },
            fever_management: {
              id: 'fever_management',
              category: 'Supportive Care',
              title: 'Fever management',
              recommendation: 'Treat fever (>38C) with acetaminophen and identify source. Maintain normothermia.',
              detail: 'Fever worsens outcomes in stroke. Search for UTI, pneumonia, line infection. Induced hypothermia not recommended outside clinical trials.',
              classOfRec: 'I',
              levelOfEvidence: 'C-LD',
              guideline: 'AHA Systemic Complications of Acute Stroke 2024',
              reference: 'AHA Scientific Statement 2024. DOI: 10.1161/STR.0000000000000477',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('stroke') || dx.includes('ischemic') || dx.includes('ich') || dx.includes('hemorrhag');
              }
            },

            // ---------------------------------------------------------------
            // GOALS OF CARE
            // ---------------------------------------------------------------
            goc_ich: {
              id: 'goc_ich',
              category: 'Goals of Care',
              title: 'Goals-of-care discussion in ICH',
              recommendation: 'Initiate goals-of-care discussion for ICH Score >= 3. Avoid early DNR orders that may limit aggressive care in first 24-48 hours.',
              detail: 'Self-fulfilling prophecy of early care withdrawal is well-documented in ICH. Recommend full care for minimum 24-48 hours while prognostic picture clarifies. ICH Score is for prognostication, not to determine treatment limits.',
              classOfRec: 'I',
              levelOfEvidence: 'C-LD',
              guideline: 'AHA/ASA Spontaneous ICH 2022 + AHA Palliative Care in Stroke 2024',
              reference: 'Greenberg SM et al. Stroke. 2022. DOI: 10.1161/STR.0000000000000407; AHA 2024. DOI: 10.1161/STR.0000000000000479',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isICH = dx.includes('ich') || dx.includes('hemorrhag') || dx.includes('intracerebral');
                const ichScore = data.ichScore || 0;
                return isICH && ichScore >= 3;
              }
            },

            // ---------------------------------------------------------------
            // SAH MANAGEMENT (2023 AHA/ASA Aneurysmal SAH)
            // ---------------------------------------------------------------
            sah_bp_presecuring: {
              id: 'sah_bp_presecuring',
              category: 'SAH Management',
              title: 'SAH: BP management (pre-aneurysm securing)',
              recommendation: 'Target SBP <160 mmHg before aneurysm is secured. Avoid SBP >160 to reduce rebleeding risk.',
              detail: 'Use short-acting IV agents (nicardipine or labetalol) for rapid titration. Avoid nitroprusside (may increase ICP). Balance between rebleed prevention and cerebral perfusion.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Aneurysmal SAH 2023',
              reference: 'Hoh BL et al. Stroke. 2023;54:e314-e370. DOI: 10.1161/STR.0000000000000436',
              medications: ['Nicardipine 5 mg/hr IV (titrate to 15 mg/hr)', 'Labetalol 10-20 mg IV bolus PRN'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return (dx.includes('sah') || dx.includes('subarachnoid')) && !data.telestrokeNote?.sahAneurysmSecured;
              }
            },
            sah_nimodipine: {
              id: 'sah_nimodipine',
              category: 'SAH Management',
              title: 'SAH: Nimodipine for vasospasm prevention',
              recommendation: 'Administer nimodipine 60 mg PO/NG q4h for 21 days. Begin as soon as possible after SAH diagnosis.',
              detail: 'Only calcium channel blocker proven to improve outcomes after SAH. If hypotension occurs, reduce to 30 mg q2h. Do not give IV. Reduces delayed cerebral ischemia (DCI), not angiographic vasospasm.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Aneurysmal SAH 2023',
              reference: 'Hoh BL et al. Stroke. 2023;54:e314-e370. DOI: 10.1161/STR.0000000000000436',
              medications: ['Nimodipine 60 mg PO/NG q4h x 21 days'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('sah') || dx.includes('subarachnoid');
              }
            },
            sah_seizure: {
              id: 'sah_seizure',
              category: 'SAH Management',
              title: 'SAH: Seizure management',
              recommendation: 'Short-term (3-7 day) seizure prophylaxis may be considered. Routine long-term prophylaxis is NOT recommended.',
              detail: 'Consider levetiracetam over phenytoin (phenytoin associated with worse cognitive outcomes). Continuous EEG monitoring for poor-grade SAH (HH 4-5). Routine prophylactic AEDs beyond 7 days are associated with harm.',
              classOfRec: 'IIb',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Aneurysmal SAH 2023',
              reference: 'Hoh BL et al. Stroke. 2023;54:e314-e370. DOI: 10.1161/STR.0000000000000436',
              medications: ['Levetiracetam 500-1000 mg IV/PO q12h (preferred)', 'Avoid phenytoin if possible'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('sah') || dx.includes('subarachnoid');
              }
            },
            sah_aneurysm_securing: {
              id: 'sah_aneurysm_securing',
              category: 'SAH Management',
              title: 'SAH: Early aneurysm securing (clip or coil)',
              recommendation: 'Secure ruptured aneurysm as early as feasible, ideally within 24 hours to reduce rebleeding risk.',
              detail: 'Endovascular coiling preferred for posterior circulation and elderly. Microsurgical clipping may be preferred for MCA aneurysms, large hematomas requiring evacuation, or wide-neck aneurysms. Multidisciplinary decision between neurovascular surgery and neurointerventional.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Aneurysmal SAH 2023',
              reference: 'Hoh BL et al. Stroke. 2023;54:e314-e370. DOI: 10.1161/STR.0000000000000436',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return (dx.includes('sah') || dx.includes('subarachnoid')) && !data.telestrokeNote?.sahAneurysmSecured;
              }
            },
            sah_euvolemia: {
              id: 'sah_euvolemia',
              category: 'SAH Management',
              title: 'SAH: Euvolemia maintenance',
              recommendation: 'Maintain euvolemia with isotonic crystalloids. Avoid hypovolemia and prophylactic hypervolemia (triple-H therapy is NOT recommended).',
              detail: 'Target euvolemia with isotonic saline. Monitor for cerebral salt wasting and SIADH. Induced hypertension may be considered as rescue for symptomatic DCI after aneurysm securing.',
              classOfRec: 'I',
              levelOfEvidence: 'B-R',
              guideline: 'AHA/ASA Aneurysmal SAH 2023',
              reference: 'Hoh BL et al. Stroke. 2023;54:e314-e370. DOI: 10.1161/STR.0000000000000436',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('sah') || dx.includes('subarachnoid');
              }
            },
            sah_evd: {
              id: 'sah_evd',
              category: 'SAH Management',
              title: 'SAH: External ventricular drain (EVD)',
              recommendation: 'Place EVD for acute hydrocephalus or poor-grade SAH (Hunt & Hess 3-5) with decreased level of consciousness.',
              detail: 'CSF diversion improves outcomes in acute hydrocephalus. Monitor for ventriculitis. Consider weaning after aneurysm securing and clinical improvement.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Aneurysmal SAH 2023',
              reference: 'Hoh BL et al. Stroke. 2023;54:e314-e370. DOI: 10.1161/STR.0000000000000436',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const isSAH = dx.includes('sah') || dx.includes('subarachnoid');
                const grade = parseInt(data.telestrokeNote?.sahGrade) || 0;
                return isSAH && grade >= 3;
              }
            },

            // ---------------------------------------------------------------
            // CVT MANAGEMENT (2024 AHA Cerebral Venous Thrombosis)
            // ---------------------------------------------------------------
            cvt_anticoag_acute: {
              id: 'cvt_anticoag_acute',
              category: 'CVT Management',
              title: 'CVT: Acute anticoagulation',
              recommendation: 'Initiate therapeutic anticoagulation with LMWH or UFH, even in the presence of hemorrhagic infarction or small parenchymal hemorrhage.',
              detail: 'LMWH preferred over UFH in most cases. Enoxaparin 1 mg/kg q12h or weight-based UFH with aPTT target 60-80s. Hemorrhagic transformation is NOT a contraindication. For large parenchymal hemorrhages, individualize decision.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA Cerebral Venous Thrombosis 2024',
              reference: 'Saposnik G et al. Stroke. 2024. DOI: 10.1161/STR.0000000000000467',
              medications: ['Enoxaparin 1 mg/kg SC q12h', 'UFH weight-based (aPTT 60-80s)'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('cvt') || dx.includes('venous thrombosis') || dx.includes('cerebral venous') || dx.includes('dural sinus');
              }
            },
            cvt_anticoag_longterm: {
              id: 'cvt_anticoag_longterm',
              category: 'CVT Management',
              title: 'CVT: Long-term anticoagulation',
              recommendation: 'Transition to warfarin (INR 2-3) for 3-12 months. DOACs may be considered as alternative in provoked CVT without severe features.',
              detail: 'Duration: 3-6 months for provoked CVT, 6-12 months for unprovoked, indefinite if recurrent VTE or severe thrombophilia. ACTION-CVT supports DOAC non-inferiority for mild-moderate CVT. Warfarin preferred for severe CVT or antiphospholipid syndrome.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA Cerebral Venous Thrombosis 2024',
              reference: 'Saposnik G et al. Stroke. 2024. DOI: 10.1161/STR.0000000000000467',
              medications: ['Warfarin target INR 2-3', 'DOAC alternative: rivaroxaban 20 mg or apixaban 5 mg BID'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('cvt') || dx.includes('venous thrombosis') || dx.includes('cerebral venous') || dx.includes('dural sinus');
              }
            },
            cvt_icp_management: {
              id: 'cvt_icp_management',
              category: 'CVT Management',
              title: 'CVT: Elevated ICP management',
              recommendation: 'Assess for elevated ICP. Use acetazolamide for isolated intracranial hypertension. LP with CSF drainage for severe headache or visual impairment.',
              detail: 'Elevated ICP is common in CVT. HOB elevation to 30 degrees. Avoid lumbar drain in large parenchymal lesions. Decompressive craniectomy for malignant CVT with impending herniation.',
              classOfRec: 'IIa',
              levelOfEvidence: 'C-LD',
              guideline: 'AHA Cerebral Venous Thrombosis 2024',
              reference: 'Saposnik G et al. Stroke. 2024. DOI: 10.1161/STR.0000000000000467',
              medications: ['Acetazolamide 250-500 mg PO BID', 'LP with CSF drainage if severe'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('cvt') || dx.includes('venous thrombosis') || dx.includes('cerebral venous') || dx.includes('dural sinus');
              }
            },
            cvt_seizure: {
              id: 'cvt_seizure',
              category: 'CVT Management',
              title: 'CVT: Seizure management',
              recommendation: 'Seizure prophylaxis is reasonable for CVT with supratentorial parenchymal lesions. Treat acute seizures with standard ASMs.',
              detail: 'Seizures occur in ~40% of CVT patients. Supratentorial hemorrhagic or ischemic lesions increase risk. Levetiracetam preferred. Duration: typically 3-6 months, taper if seizure-free and lesion resolved.',
              classOfRec: 'IIa',
              levelOfEvidence: 'C-LD',
              guideline: 'AHA Cerebral Venous Thrombosis 2024',
              reference: 'Saposnik G et al. Stroke. 2024. DOI: 10.1161/STR.0000000000000467',
              medications: ['Levetiracetam 500-1000 mg PO/IV q12h'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('cvt') || dx.includes('venous thrombosis') || dx.includes('cerebral venous') || dx.includes('dural sinus');
              }
            },
            cvt_thrombophilia: {
              id: 'cvt_thrombophilia',
              category: 'CVT Management',
              title: 'CVT: Thrombophilia workup',
              recommendation: 'Evaluate for underlying thrombophilia in unprovoked CVT, especially in young patients. Defer testing until after acute phase if possible.',
              detail: 'Test for: Factor V Leiden, prothrombin G20210A, antithrombin III, protein C/S, antiphospholipid antibodies. Hormonal risk factors (OCP, pregnancy) are most common provoked cause. Test timing: some assays affected by acute thrombosis and anticoagulation.',
              classOfRec: 'IIa',
              levelOfEvidence: 'C-LD',
              guideline: 'AHA Cerebral Venous Thrombosis 2024',
              reference: 'Saposnik G et al. Stroke. 2024. DOI: 10.1161/STR.0000000000000467',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const age = parseInt(data.telestrokeNote?.age) || 0;
                return (dx.includes('cvt') || dx.includes('venous thrombosis') || dx.includes('cerebral venous') || dx.includes('dural sinus')) && age <= 60;
              }
            },

            // ---------------------------------------------------------------
            // TIA-SPECIFIC RECOMMENDATIONS
            // ---------------------------------------------------------------
            tia_admit: {
              id: 'tia_admit',
              category: 'TIA',
              title: 'TIA: Hospital admission',
              recommendation: 'Admit ALL TIA patients for urgent workup regardless of ABCD2 score.',
              detail: 'Inpatient evaluation allows rapid completion of workup (MRI DWI, CTA, cardiac monitoring, labs) and early initiation of secondary prevention. Reduces 90-day stroke risk by 80% compared to outpatient evaluation.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021 + 2026 Update',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467; Powers WJ et al. Stroke. 2026.',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('tia');
              }
            },
            tia_mri_dwi: {
              id: 'tia_mri_dwi',
              category: 'TIA',
              title: 'TIA: MRI with DWI',
              recommendation: 'Obtain MRI with DWI for all TIA patients to evaluate for acute infarction.',
              detail: 'DWI-positive TIA (i.e., tissue-based minor stroke) carries higher recurrence risk. MRI also helps classify etiology. If MRI unavailable, CT is acceptable but inferior for small infarct detection.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467.',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('tia');
              }
            },
            tia_vascular_imaging: {
              id: 'tia_vascular_imaging',
              category: 'TIA',
              title: 'TIA: Vascular imaging (CTA/MRA)',
              recommendation: 'Obtain CTA or MRA of head and neck for all TIA patients to evaluate for large artery stenosis or occlusion.',
              detail: 'Identifies symptomatic carotid stenosis (CEA/CAS candidate), intracranial stenosis (DAPT candidate), or dissection. Urgent imaging within 24 hours preferred.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467.',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('tia');
              }
            },
            tia_cardiac_monitoring: {
              id: 'tia_cardiac_monitoring',
              category: 'TIA',
              title: 'TIA: Cardiac monitoring for AF detection',
              recommendation: 'Perform cardiac monitoring for AF detection: 30-day ambulatory monitor preferred, 14-day patch if unavailable, ILR in select cases.',
              detail: 'AF is found in up to 25% of cryptogenic stroke/TIA with prolonged monitoring. 30-day event monitor (e.g., Zio AT) is preferred. If unavailable, 14-day continuous patch (e.g., Zio Patch). ILR (e.g., LINQ) considered if high suspicion and no AF detected on ambulatory monitoring.',
              classOfRec: 'I',
              levelOfEvidence: 'B-R',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021 + 2026 Update',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467; CRYSTAL-AF, EMBRACE trials.',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('tia');
              }
            },
            tia_echo: {
              id: 'tia_echo',
              category: 'TIA',
              title: 'TIA: Echocardiography',
              recommendation: 'Obtain echocardiography (TTE with bubble study; TEE if PFO or structural pathology suspected).',
              detail: 'Identifies PFO, atrial septal aneurysm, valvular disease, or intracardiac thrombus. PFO closure may be indicated based on PASCAL classification in appropriate patients.',
              classOfRec: 'I',
              levelOfEvidence: 'B-NR',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467.',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('tia');
              }
            },
            tia_dapt: {
              id: 'tia_dapt',
              category: 'TIA',
              title: 'TIA: DAPT for high-risk TIA',
              recommendation: 'Start DAPT (aspirin + clopidogrel) within 24 hours for high-risk TIA, continue for 21 days, then single antiplatelet.',
              detail: 'Loading: ASA 325 mg + clopidogrel 300 mg. Maintenance: ASA 81 mg + clopidogrel 75 mg x 21 days. Based on CHANCE/POINT/THALES trials. High-risk TIA = ABCD2 >=4 or DWI+ on MRI.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467.',
              medications: ['ASA 325 mg load then 81 mg daily', 'Clopidogrel 300 mg load then 75 mg daily x 21 days'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('tia');
              }
            },

            // ---------------------------------------------------------------
            // CERVICAL ARTERY DISSECTION
            // ---------------------------------------------------------------
            dissection_antithrombotic: {
              id: 'dissection_antithrombotic',
              category: 'Dissection',
              title: 'Cervical artery dissection: Antithrombotic therapy',
              recommendation: 'Antiplatelet or anticoagulation for cervical artery dissection. Either approach is reasonable (no proven superiority of one over the other).',
              detail: 'CADISS trial showed no significant difference between antiplatelet and anticoagulation. Choice depends on clinical factors: anticoagulation may be preferred for pseudoaneurysm, free-floating thrombus, or recurrent events on antiplatelet. Duration: typically 3-6 months.',
              classOfRec: 'IIa',
              levelOfEvidence: 'B-R',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'CADISS Trial Investigators. Lancet Neurol. 2015;14:361-367.',
              medications: ['ASA 81-325 mg daily', 'OR Heparin bridge to warfarin (INR 2-3)', 'OR DOAC (off-label, growing evidence)'],
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const cta = (data.telestrokeNote?.ctaResults || '').toLowerCase();
                return dx.includes('dissect') || cta.includes('dissect');
              }
            },
            dissection_imaging_followup: {
              id: 'dissection_imaging_followup',
              category: 'Dissection',
              title: 'Cervical artery dissection: Imaging follow-up',
              recommendation: 'Repeat vascular imaging (CTA or MRA) at 3-6 months to assess for recanalization or pseudoaneurysm evolution.',
              detail: 'Most dissections heal within 3-6 months. Persistent stenosis/occlusion or pseudoaneurysm may warrant continued antithrombotic therapy. If fully recanalized, may consider stopping anticoagulation and switching to antiplatelet.',
              classOfRec: 'IIa',
              levelOfEvidence: 'C-EO',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467.',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const cta = (data.telestrokeNote?.ctaResults || '').toLowerCase();
                return dx.includes('dissect') || cta.includes('dissect');
              }
            },
            dissection_avoid_manipulation: {
              id: 'dissection_avoid_manipulation',
              category: 'Dissection',
              title: 'Cervical artery dissection: Avoid cervical manipulation',
              recommendation: 'Advise patients to avoid cervical manipulation (chiropractic, aggressive physical therapy) during healing phase.',
              detail: 'While causation is debated, cervical manipulation is associated with vertebral and carotid dissection. Patients should avoid high-velocity neck movements during the healing period (minimum 3 months).',
              classOfRec: 'IIb',
              levelOfEvidence: 'C-LD',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467.',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const cta = (data.telestrokeNote?.ctaResults || '').toLowerCase();
                return dx.includes('dissect') || cta.includes('dissect');
              }
            },
            dissection_no_thrombolysis_contraindication: {
              id: 'dissection_no_thrombolysis_contraindication',
              category: 'Dissection',
              title: 'Dissection: TNK is NOT contraindicated',
              recommendation: 'Cervical artery dissection is NOT an absolute contraindication to IV thrombolysis if within the treatment window.',
              detail: 'Observational data suggests IV thrombolysis in dissection-related stroke is safe and may be beneficial. Treat according to standard TNK eligibility criteria.',
              classOfRec: 'IIa',
              levelOfEvidence: 'C-LD',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026.',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                const cta = (data.telestrokeNote?.ctaResults || '').toLowerCase();
                const timeFrom = data.timeFromLKW;
                return (dx.includes('dissect') || cta.includes('dissect')) && timeFrom && timeFrom.total <= 4.5;
              }
            },

            // ---------------------------------------------------------------
            // SPECIAL POPULATIONS
            // ---------------------------------------------------------------
            pregnancy_stroke: {
              id: 'pregnancy_stroke',
              category: 'Special Populations',
              title: 'Stroke in pregnancy',
              recommendation: 'TNK is a relative contraindication in pregnancy but may be considered when benefit outweighs risk. Consult OB/GYN immediately. EVT is preferred for LVO.',
              detail: 'Per 2026 AHA guidelines, pregnancy is reclassified as relative (not absolute) contraindication. For LVO, EVT is preferred (no systemic thrombolytic exposure). ASA 81 mg is safe. Avoid warfarin in first trimester. LMWH is preferred anticoagulant.',
              classOfRec: 'IIb',
              levelOfEvidence: 'C-LD',
              guideline: 'AHA/ASA Early Management of Acute Ischemic Stroke 2026',
              reference: 'Powers WJ et al. Stroke. 2026.',
              conditions: (data) => {
                const checklist = data.telestrokeNote?.tnkContraindicationChecklist || {};
                return !!checklist.pregnancy || !!data.telestrokeNote?.pregnancyStroke;
              }
            },

            // ---------------------------------------------------------------
            // DISCHARGE / SECONDARY PREVENTION
            // ---------------------------------------------------------------
            discharge_antiplatelet: {
              id: 'discharge_antiplatelet',
              category: 'Discharge',
              title: 'Discharge: Antiplatelet or anticoagulation',
              recommendation: 'Ensure appropriate antithrombotic therapy is prescribed at discharge. Antiplatelet for non-cardioembolic stroke; anticoagulation for AF-related stroke.',
              detail: 'ASA 81-325 mg, clopidogrel 75 mg, or DAPT based on stroke subtype. DOAC for AF (apixaban preferred). Verify no gaps in medication reconciliation.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467. DOI: 10.1161/STR.0000000000000375',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('ischemic') || dx.includes('stroke') || dx.includes('tia');
              }
            },
            discharge_statin: {
              id: 'discharge_statin',
              category: 'Discharge',
              title: 'Discharge: High-intensity statin',
              recommendation: 'Prescribe high-intensity statin at discharge with LDL target <70 mg/dL for ischemic stroke/TIA patients.',
              detail: 'Atorvastatin 80 mg or rosuvastatin 20-40 mg. Add ezetimibe if not at goal. Verify statin is on discharge medication list.',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467. DOI: 10.1161/STR.0000000000000375',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('ischemic') || dx.includes('stroke') || dx.includes('tia');
              }
            },
            discharge_bp_management: {
              id: 'discharge_bp_management',
              category: 'Discharge',
              title: 'Discharge: BP optimization',
              recommendation: 'Initiate or optimize antihypertensive therapy at discharge targeting BP <130/80 for secondary stroke prevention.',
              detail: 'ACE inhibitor or ARB + thiazide diuretic preferred. Initiate after 24-48 hours for ischemic stroke. Individualize timing for ICH (may start earlier).',
              classOfRec: 'I',
              levelOfEvidence: 'A',
              guideline: 'AHA/ASA Secondary Stroke Prevention 2021',
              reference: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467. DOI: 10.1161/STR.0000000000000375',
              conditions: (data) => {
                const dx = (data.telestrokeNote?.diagnosis || '').toLowerCase();
                return dx.includes('stroke') || dx.includes('ischemic') || dx.includes('ich') || dx.includes('tia');
              }
            }
          };

          // =================================================================
          // CLINICAL PATHWAY DEFINITIONS
          // Type-specific step sequences for guided encounter workflow
          // =================================================================
          const CLINICAL_PATHWAY_STEPS = {
            shared: [
              { id: 'patient-info', label: 'Patient Info', section: 'patient-info-section', check: (d) => !!(d.telestrokeNote?.age && d.telestrokeNote?.symptoms) },
              { id: 'lkw', label: 'Last Known Well', section: 'lkw-section', check: (d) => !!(d.lkwTime || d.telestrokeNote?.lkwUnknown) },
              { id: 'nihss', label: 'NIHSS', section: 'nihss-section', check: (d) => !!(d.telestrokeNote?.nihss || d.nihssComplete) },
              { id: 'vitals', label: 'Vitals/Labs', section: 'vitals-section', check: (d) => !!d.telestrokeNote?.presentingBP },
              { id: 'imaging', label: 'Imaging', section: 'imaging-section', check: (d) => !!d.telestrokeNote?.ctResults },
              { id: 'diagnosis', label: 'Diagnosis', section: 'treatment-decision', check: (d) => !!d.telestrokeNote?.diagnosis }
            ],
            ischemic: [
              { id: 'tnk-contraindications', label: 'TNK Screen', section: 'tnk-contraindications', check: (d) => !!d.telestrokeNote?.tnkContraindicationReviewed,
                skip: (d) => { const t = d.timeFromLKW; return t && t.total > 4.5; } },
              { id: 'tnk-decision', label: 'TNK Decision', section: 'treatment-decision', check: (d) => d.telestrokeNote?.tnkRecommended === true || d.telestrokeNote?.tnkRecommended === false,
                skip: (d) => { const t = d.timeFromLKW; return t && t.total > 4.5; } },
              { id: 'evt-eval', label: 'EVT Evaluation', section: 'treatment-decision', check: (d) => d.telestrokeNote?.evtRecommended === true || d.telestrokeNote?.evtRecommended === false },
              { id: 'tnk-admin', label: 'TNK Admin', section: 'time-metrics-section', check: (d) => !!d.telestrokeNote?.tnkAdminTime,
                skip: (d) => !d.telestrokeNote?.tnkRecommended },
              { id: 'transfer', label: 'Transfer', section: 'transfer-section', check: (d) => !!d.telestrokeNote?.transferAccepted || !!d.telestrokeNote?.disposition,
                skip: (d) => !d.telestrokeNote?.evtRecommended && !(d.telestrokeNote?.vesselOcclusion || []).some(v => /ica|m1|mca|basilar/i.test(v)) },
              { id: 'recommendations', label: 'Recommendations', section: 'recommendations-section', check: (d) => !!d.telestrokeNote?.recommendationsText }
            ],
            ich: [
              { id: 'ich-bp', label: 'BP Management', section: 'vitals-section', check: (d) => !!d.telestrokeNote?.ichBPManaged },
              { id: 'ich-reversal', label: 'Anticoag Reversal', section: 'treatment-decision', check: (d) => !!d.telestrokeNote?.ichReversalOrdered,
                skip: (d) => !!d.telestrokeNote?.noAnticoagulants },
              { id: 'ich-neurosurg', label: 'Neurosurgery', section: 'treatment-decision', check: (d) => !!d.telestrokeNote?.ichNeurosurgeryConsulted },
              { id: 'recommendations', label: 'Recommendations', section: 'recommendations-section', check: (d) => !!d.telestrokeNote?.recommendationsText }
            ],
            sah: [
              { id: 'sah-grade', label: 'SAH Grade', section: 'sah-management-section', check: (d) => !!d.telestrokeNote?.sahGrade },
              { id: 'sah-bp', label: 'BP Management', section: 'sah-management-section', check: (d) => !!d.telestrokeNote?.sahBPManaged },
              { id: 'sah-nimodipine', label: 'Nimodipine', section: 'sah-management-section', check: (d) => !!d.telestrokeNote?.sahNimodipine },
              { id: 'sah-neurosurg', label: 'Neurosurgery', section: 'sah-management-section', check: (d) => !!d.telestrokeNote?.sahNeurosurgeryConsulted },
              { id: 'sah-aneurysm', label: 'Aneurysm Securing', section: 'sah-management-section', check: (d) => !!d.telestrokeNote?.sahAneurysmSecured,
                skip: (d) => { const ct = (d.telestrokeNote?.ctaResults || '').toLowerCase(); return ct.includes('no aneurysm'); } },
              { id: 'recommendations', label: 'Recommendations', section: 'recommendations-section', check: (d) => !!d.telestrokeNote?.recommendationsText }
            ],
            cvt: [
              { id: 'cvt-anticoag', label: 'Anticoagulation', section: 'cvt-management-section', check: (d) => !!d.telestrokeNote?.cvtAnticoagStarted },
              { id: 'cvt-icp', label: 'ICP Management', section: 'cvt-management-section', check: (d) => !!d.telestrokeNote?.cvtIcpManaged },
              { id: 'cvt-seizure', label: 'Seizure Mgmt', section: 'cvt-management-section', check: (d) => !!d.telestrokeNote?.cvtSeizureManaged },
              { id: 'cvt-heme', label: 'Hematology', section: 'cvt-management-section', check: (d) => !!d.telestrokeNote?.cvtHematologyConsulted,
                skip: (d) => { const age = parseInt(d.telestrokeNote?.age) || 0; return age > 60; } },
              { id: 'recommendations', label: 'Recommendations', section: 'recommendations-section', check: (d) => !!d.telestrokeNote?.recommendationsText }
            ],
            tia: [
              { id: 'tia-imaging', label: 'MRI DWI', section: 'imaging-section', check: (d) => !!d.telestrokeNote?.tiaWorkup?.mriDwi },
              { id: 'tia-vascular', label: 'CTA/MRA', section: 'imaging-section', check: (d) => !!d.telestrokeNote?.tiaWorkup?.ctaHeadNeck },
              { id: 'tia-ecg', label: 'ECG', section: 'vitals-section', check: (d) => !!d.telestrokeNote?.tiaWorkup?.ecg12Lead },
              { id: 'tia-telemetry', label: 'Telemetry', section: 'vitals-section', check: (d) => !!d.telestrokeNote?.tiaWorkup?.telemetry },
              { id: 'tia-echo', label: 'Echo', section: 'treatment-decision', check: (d) => !!d.telestrokeNote?.tiaWorkup?.echo },
              { id: 'tia-labs', label: 'Labs', section: 'vitals-section', check: (d) => !!(d.telestrokeNote?.tiaWorkup?.labsCbc && d.telestrokeNote?.tiaWorkup?.labsLipids) },
              { id: 'tia-etiology', label: 'TOAST Classification', section: 'treatment-decision', check: (d) => !!d.telestrokeNote?.toastClassification },
              { id: 'tia-prevention', label: 'Secondary Prevention', section: 'recommendations-section', check: (d) => !!d.telestrokeNote?.recommendationsText }
            ],
            dissection: [
              { id: 'dissection-imaging', label: 'Vascular Imaging', section: 'imaging-section', check: (d) => !!d.telestrokeNote?.ctaResults },
              { id: 'dissection-antithrombotic', label: 'Antithrombotic', section: 'treatment-decision', check: (d) => !!d.telestrokeNote?.dissectionPathway?.antithromboticStarted },
              { id: 'dissection-followup', label: 'Imaging Follow-Up Plan', section: 'recommendations-section', check: (d) => !!d.telestrokeNote?.dissectionPathway?.imagingFollowUp },
              { id: 'recommendations', label: 'Recommendations', section: 'recommendations-section', check: (d) => !!d.telestrokeNote?.recommendationsText }
            ],
            mimic: [
              { id: 'alt-workup', label: 'Alternative Workup', section: 'treatment-decision', check: (d) => !!d.telestrokeNote?.diagnosis },
              { id: 'disposition', label: 'Disposition', section: 'recommendations-section', check: (d) => !!d.telestrokeNote?.disposition || !!d.telestrokeNote?.recommendationsText }
            ]
          };

          const getPathwayForDiagnosis = (diagnosis) => {
            if (!diagnosis) return 'shared';
            const dx = diagnosis.toLowerCase();
            if (dx.includes('mimic') || dx.includes('non-stroke') || dx.includes('seizure') || dx.includes('migraine') || dx.includes('conversion') || dx.includes('bell')) return 'mimic';
            if (dx.includes('sah') || dx.includes('subarachnoid')) return 'sah';
            if (dx.includes('cvt') || dx.includes('venous thrombosis') || dx.includes('cerebral venous') || dx.includes('dural sinus')) return 'cvt';
            if (dx.includes('ich') || dx.includes('hemorrhag') || dx.includes('intracerebral') || dx.includes('bleed')) return 'ich';
            if (dx.includes('dissect')) return 'dissection';
            if (dx.includes('tia') || dx.includes('transient ischemic')) return 'tia';
            if (dx.includes('ischemic') || dx.includes('stroke') || dx.includes('lvo') || dx.includes('occlusion')) return 'ischemic';
            return 'shared';
          };

          // =================================================================
          // ELIGIBILITY EVALUATION FUNCTION
          // =================================================================
          const evaluateTrialEligibility = (trialId, data) => {
            const config = TRIAL_ELIGIBILITY_CONFIG[trialId];
            if (!config) return null;

            const results = {
              trialId,
              trialName: config.name,
              category: config.category,
              quickDescription: config.quickDescription,
              lookingFor: config.lookingFor,
              criteria: [],
              exclusions: [],
              status: 'pending', // 'eligible', 'not_eligible', 'needs_info', 'pending'
              metCount: 0,
              notMetCount: 0,
              unknownCount: 0,
              requiredMissing: 0
            };

            // Evaluate key criteria
            config.keyCriteria.forEach(criterion => {
              let status = 'unknown';
              let value = null;

              try {
                const evalResult = criterion.evaluate(data);
                if (evalResult === true) {
                  status = 'met';
                  results.metCount++;
                } else if (evalResult === false) {
                  status = 'not_met';
                  results.notMetCount++;
                  if (criterion.required) results.requiredMissing++;
                } else {
                  status = 'unknown';
                  results.unknownCount++;
                }
              } catch (e) {
                status = 'unknown';
                results.unknownCount++;
              }

              results.criteria.push({
                id: criterion.id,
                label: criterion.label,
                status,
                required: criterion.required
              });
            });

            // Evaluate exclusion flags
            config.exclusionFlags.forEach(exclusion => {
              let triggered = false;
              try {
                if (exclusion.evaluate) {
                  triggered = exclusion.evaluate(data);
                } else {
                  triggered = data[exclusion.field] === true;
                }
              } catch (e) {
                triggered = false;
              }

              if (triggered) {
                results.exclusions.push({
                  id: exclusion.id,
                  label: exclusion.label,
                  triggered: true
                });
                results.notMetCount++;
                results.status = 'not_eligible';
              }
            });

            // Determine overall status
            if (results.exclusions.some(e => e.triggered)) {
              results.status = 'not_eligible';
            } else if (results.requiredMissing > 0) {
              results.status = 'not_eligible';
            } else if (results.unknownCount > 0) {
              results.status = 'needs_info';
            } else if (results.notMetCount === 0) {
              results.status = 'eligible';
            } else {
              results.status = 'not_eligible';
            }

            return results;
          };

          // Evaluate all trials for current patient
          const evaluateAllTrials = (data) => {
            const results = {};
            Object.keys(TRIAL_ELIGIBILITY_CONFIG).forEach(trialId => {
              results[trialId] = evaluateTrialEligibility(trialId, data);
            });
            return results;
          };

          // Trial eligibility state
          const [trialEligibility, setTrialEligibility] = useState({});

          // Selected trial for navigation from Encounter to Trials tab
          const [selectedTrialId, setSelectedTrialId] = useState(null);

          // Navigate to Trials tab with specific trial selected
          const navigateToTrial = (trialId) => {
            const config = TRIAL_ELIGIBILITY_CONFIG[trialId];
            if (!config) return;

            setSelectedTrialId(trialId);
            setActiveTab('trials');

            // Create the same slug used in TrialCard from the trial name
            const trialSlug = config.name.toLowerCase()
              .replace(/\s+trial$/i, '')
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');

            // Scroll to trial after tab switch
            setTimeout(() => {
              const trialElement = document.getElementById(`trial-${trialSlug}`);
              if (trialElement) {
                // Open the details element if closed
                trialElement.open = true;
                trialElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add highlight effect
                trialElement.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-75');
                setTimeout(() => {
                  trialElement.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-75');
                }, 2000);
              }
            }, 150);
          };

          // Toggle trial details

          // Create trial card component
          const TrialCard = ({ trial, category }) => {
            const getCategoryColor = (cat) => {
              switch(cat) {
                case 'ischemic': return 'bg-blue-600 text-white';
                case 'ich': return 'bg-red-600 text-white';
                case 'rehab': return 'bg-green-600 text-white';
                case 'cadasil': return 'bg-purple-600 text-white';
                default: return 'bg-gray-600 text-white';
              }
            };

            const getCategoryBorderColor = (cat) => {
              switch(cat) {
                case 'ischemic': return 'border-blue-200';
                case 'ich': return 'border-red-200';
                case 'rehab': return 'border-green-200';
                case 'cadasil': return 'border-purple-200';
                default: return 'border-gray-200';
              }
            };

            // Create a slug-friendly ID from the trial name
            const trialSlug = trial.name.toLowerCase()
              .replace(/\s+trial$/i, '')
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');

            return (
              <details
                id={`trial-${trialSlug}`}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${getCategoryBorderColor(category)} hover:shadow-lg transition-shadow`}
              >
                <summary className={`${getCategoryColor(category)} p-4 cursor-pointer list-none`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{trial.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold">
                          {trial.phase}
                        </span>
                        {trial.status && (
                          <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold">
                            {trial.status}
                          </span>
                        )}
                      </div>
                      <p className="text-white text-opacity-95">{trial.description}</p>
                    </div>
                    <div className="ml-4">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center">
                    {trial.nct.startsWith('NCT') ? (
                      <button
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://clinicaltrials.gov/study/${trial.nct}`, '_blank');
                        }}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {trial.nct}
                      </button>
                    ) : (
                      <span className="text-sm opacity-90">Reference: {trial.nct}</span>
                    )}
                  </div>
                </summary>

                <div className="bg-gray-50 p-4 border-t-2 border-gray-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-green-700 mb-3 text-lg">✓ Inclusion Criteria</h4>
                      <ul className="space-y-2">
                        {trial.inclusion.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">•</span>
                            <span className="text-gray-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-700 mb-3 text-lg">✗ Exclusion Criteria</h4>
                      <ul className="space-y-2">
                        {trial.exclusion.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-500 mr-2 mt-1">•</span>
                            <span className="text-gray-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {trial.nct.startsWith('NCT') && (
                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
                        onClick={() => window.open(`https://clinicaltrials.gov/study/${trial.nct}`, '_blank')}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Full Details on ClinicalTrials.gov
                      </button>
                    </div>
                  )}
                </div>
              </details>
            );
          };


          // NIH Stroke Scale items
          const nihssItems = [
            { id: 'consciousness', name: '1a. Level of Consciousness', options: ['Alert (0)', 'Drowsy (1)', 'Stuporous (2)', 'Coma (3)'] },
            { id: 'loc_questions', name: '1b. LOC Questions', options: ['Both correct (0)', 'One correct (1)', 'Neither correct (2)'] },
            { id: 'loc_commands', name: '1c. LOC Commands', options: ['Obeys both correctly (0)', 'Obeys one correctly (1)', 'Neither correctly (2)'] },
            { id: 'best_gaze', name: '2. Best Gaze', options: ['Normal (0)', 'Partial gaze palsy (1)', 'Forced deviation (2)'] },
            { id: 'visual', name: '3. Visual', options: ['No visual loss (0)', 'Partial hemianopia (1)', 'Complete hemianopia (2)', 'Bilateral hemianopia (3)'] },
            { id: 'facial_palsy', name: '4. Facial Palsy', options: ['Normal (0)', 'Minor asymmetry (1)', 'Partial facial paralysis (2)', 'Complete facial paralysis (3)'] },
            { id: 'motor_arm_left', name: '5a. Motor Arm-Left', options: ['No drift (0)', 'Drift (1)', 'Some effort against gravity (2)', 'No effort against gravity (3)', 'No movement (4)'] },
            { id: 'motor_arm_right', name: '5b. Motor Arm-Right', options: ['No drift (0)', 'Drift (1)', 'Some effort against gravity (2)', 'No effort against gravity (3)', 'No movement (4)'] },
            { id: 'motor_leg_left', name: '6a. Motor Leg-Left', options: ['No drift (0)', 'Drift (1)', 'Some effort against gravity (2)', 'No effort against gravity (3)', 'No movement (4)'] },
            { id: 'motor_leg_right', name: '6b. Motor Leg-Right', options: ['No drift (0)', 'Drift (1)', 'Some effort against gravity (2)', 'No effort against gravity (3)', 'No movement (4)'] },
            { id: 'limb_ataxia', name: '7. Limb Ataxia', options: ['Absent (0)', 'Present in upper or lower (1)', 'Present in both (2)'] },
            { id: 'sensory', name: '8. Sensory', options: ['Normal (0)', 'Partial loss (1)', 'Dense loss (2)'] },
            { id: 'language', name: '9. Best Language†', options: ['No aphasia (0)', 'Mild-moderate aphasia (1)', 'Severe aphasia (2)', 'Mute, global aphasia (3)'] },
            { id: 'dysarthria', name: '10. Dysarthria†', options: ['Normal articulation (0)', 'Mild-moderate slurring (1)', 'Severe dysarthria (2)', 'Intubated/other (2)'] },
            { id: 'extinction', name: '11. Extinction and Inattention', options: ['No neglect (0)', 'Visual, tactile, auditory, spatial, or personal inattention (1)', 'Profound hemi-inattention (2)'] }
          ];

          // Calculate NIHSS score
          const calculateNIHSS = (responses) => {
            return Object.values(responses).reduce((total, response) => {
              const score = parseInt(response?.split('(')[1]?.split(')')[0] || 0);
              return total + score;
            }, 0);
          };

          // Calculate ASPECTS score
          const calculateASPECTS = (regions) => {
            return regions.filter(region => region.checked).length;
          };

          // Calculate PC-ASPECTS score
          const calculatePCAspects = (regions) => {
            return regions.reduce((total, region) => {
              return total + (region.checked ? region.points : 0);
            }, 0);
          };

          // Calculate GCS score
          const calculateGCS = (items) => {
            return parseInt(items.eye || 0) + parseInt(items.verbal || 0) + parseInt(items.motor || 0);
          };

          // Calculate ICH score
          const calculateICHScore = (items) => {
            let score = 0;
            if (items.gcs === 'gcs34') score += 2;
            else if (items.gcs === 'gcs512') score += 1;
            if (items.age80) score += 1;
            if (items.volume30) score += 1;
            if (items.ivh) score += 1;
            if (items.infratentorial) score += 1;
            return score;
          };

          // Calculate ABCD2 score
          const calculateABCD2Score = (items) => {
            let score = 0;
            if (items.age60) score += 1;
            if (items.bp) score += 1;
            if (items.unilateralWeakness) score += 2;
            if (items.speechDisturbance) score += 1;
            if (items.duration === 'duration10') score += 1;
            else if (items.duration === 'duration60') score += 2;
            if (items.diabetes) score += 1;
            return score;
          };

          // Calculate CHADS2-VASc score
          const calculateCHADS2VascScore = (items) => {
            let score = 0;
            if (items.chf) score += 1;
            if (items.hypertension) score += 1;
            if (items.age75) score += 2;
            if (items.diabetes) score += 1;
            if (items.strokeTia) score += 2;
            if (items.vascular) score += 1;
            if (items.age65) score += 1;
            if (items.female) score += 1;
            return score;
          };

          // Calculate ROPE score
          const calculateROPEScore = (items) => {
            let score = 0;
            if (items.noHypertension) score += 1;
            if (items.noDiabetes) score += 1;
            if (items.noStrokeTia) score += 1;
            if (items.nonsmoker) score += 1;
            if (items.cortical) score += 1;

            // Age points
            const age = parseInt(items.age) || 0;
            if (age >= 18 && age <= 29) score += 5;
            else if (age >= 30 && age <= 39) score += 4;
            else if (age >= 40 && age <= 49) score += 3;
            else if (age >= 50 && age <= 59) score += 2;
            else if (age >= 60 && age <= 69) score += 1;
            // 70+ years gets 0 points

            return score;
          };

          // Calculate HAS-BLED score
          const calculateHASBLEDScore = (items) => {
            let score = 0;
            if (items.hypertension) score += 1;
            if (items.renalDisease) score += 1;
            if (items.liverDisease) score += 1;
            if (items.stroke) score += 1;
            if (items.bleeding) score += 1;
            if (items.labileINR) score += 1;
            if (items.elderly) score += 1;
            if (items.drugs) score += 1;
            if (items.alcohol) score += 1;
            return score;
          };

          // Calculate RCVS2 score
          const calculateRCVS2Score = (items) => {
            let score = 0;
            if (items.recurrentTCH) score += 5;
            if (items.carotidInvolvement) score += 3;
            if (items.vasoconstrictiveTrigger) score += 2;
            if (items.female) score += 1;
            if (items.sah) score -= 2;
            return score;
          };

          // =================================================================
          // TNK DOSING CALCULATOR (0.25 mg/kg, max 25 mg)
          // =================================================================
          const calculateTNKDose = (weightKg) => {
            const weight = parseFloat(weightKg);
            if (isNaN(weight) || weight <= 0) return null;

            // TNK dosing: 0.25 mg/kg, maximum 25 mg
            const rawDose = weight * 0.25;
            const finalDose = Math.min(rawDose, 25);

            // Pre-calculated doses for common weight ranges
            const doseTable = [
              { minWeight: 0, maxWeight: 59.9, dose: 'Variable (0.25 mg/kg)', vial: 'Calculate' },
              { minWeight: 60, maxWeight: 69.9, dose: '15-17.5 mg', vial: '3-3.5 mL' },
              { minWeight: 70, maxWeight: 79.9, dose: '17.5-20 mg', vial: '3.5-4 mL' },
              { minWeight: 80, maxWeight: 89.9, dose: '20-22.5 mg', vial: '4-4.5 mL' },
              { minWeight: 90, maxWeight: 99.9, dose: '22.5-25 mg', vial: '4.5-5 mL' },
              { minWeight: 100, maxWeight: Infinity, dose: '25 mg (MAX)', vial: '5 mL' }
            ];

            return {
              weightKg: weight,
              calculatedDose: finalDose.toFixed(1),
              isMaxDose: rawDose >= 25,
              doseTable
            };
          };

          // =================================================================
          // BP THRESHOLD CHECKER FOR THROMBOLYSIS
          // =================================================================
          const getBPThresholdStatus = (bpString) => {
            if (!bpString || typeof bpString !== 'string') {
              return { status: 'unknown', systolic: null, diastolic: null };
            }

            const bpMatch = bpString.match(/(\d+)\s*\/\s*(\d+)/);
            if (!bpMatch) {
              return { status: 'unknown', systolic: null, diastolic: null };
            }

            const systolic = parseInt(bpMatch[1]);
            const diastolic = parseInt(bpMatch[2]);

            if (isNaN(systolic) || isNaN(diastolic)) {
              return { status: 'unknown', systolic: null, diastolic: null };
            }

            // Thresholds for TNK/tPA eligibility
            const MAX_SBP = 185;
            const MAX_DBP = 110;
            const BORDERLINE_SBP_LOW = 175;
            const BORDERLINE_DBP_LOW = 105;

            let status = 'ok';
            let message = 'OK for lysis';
            let badgeClass = 'bg-green-100 text-green-800 border-green-300';
            let icon = String.fromCharCode(0x2713); // checkmark

            // Check if too high (absolute contraindication)
            if (systolic > MAX_SBP || diastolic > MAX_DBP) {
              status = 'too_high';
              message = 'Too high for TNK';
              badgeClass = 'bg-red-100 text-red-800 border-red-300';
              icon = String.fromCharCode(0x1F6AB); // prohibited sign
            }
            // Check if borderline
            else if ((systolic >= BORDERLINE_SBP_LOW && systolic <= MAX_SBP) ||
                     (diastolic >= BORDERLINE_DBP_LOW && diastolic <= MAX_DBP)) {
              status = 'borderline';
              message = 'Borderline';
              badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
              icon = String.fromCharCode(0x26A0); // warning sign
            }

            // Calculate how much to lower if too high
            const sbpToLower = Math.max(0, systolic - MAX_SBP);
            const dbpToLower = Math.max(0, diastolic - MAX_DBP);

            return {
              status,
              systolic,
              diastolic,
              message,
              badgeClass,
              icon,
              sbpToLower,
              dbpToLower,
              needsLowering: sbpToLower > 0 || dbpToLower > 0
            };
          };

          // =================================================================
          // 4-FACTOR PCC (KCENTRA) DOSING CALCULATOR
          // =================================================================
          const calculate4FPCC = (weightKg, inr) => {
            const weight = parseFloat(weightKg);
            const inrValue = parseFloat(inr);
            if (isNaN(weight) || weight <= 0) return null;

            let unitsPerKg;
            let description;

            if (isNaN(inrValue) || inrValue < 2) {
              unitsPerKg = 25;
              description = 'INR <2 or unknown';
            } else if (inrValue >= 2 && inrValue <= 4) {
              unitsPerKg = 25;
              description = 'INR 2-4';
            } else if (inrValue > 4 && inrValue <= 6) {
              unitsPerKg = 35;
              description = 'INR 4-6';
            } else {
              unitsPerKg = 50;
              description = 'INR >6';
            }

            const totalDose = Math.min(weight * unitsPerKg, 5000); // Max 5000 IU

            return {
              weightKg: weight,
              inr: inrValue || 'unknown',
              unitsPerKg,
              totalDose: Math.round(totalDose),
              isMaxDose: weight * unitsPerKg >= 5000,
              description
            };
          };

          // =================================================================
          // DTN (DOOR-TO-NEEDLE) TIME CALCULATIONS
          // =================================================================
          const calculateDTNMetrics = () => {
            const metrics = {
              doorToCT: null,
              doorToNeedle: null,
              ctToNeedle: null,
              timestamps: {}
            };

            // Parse timestamps
            const edArrival = telestrokeNote.dtnEdArrival ? new Date(telestrokeNote.dtnEdArrival) : null;
            const ctStarted = telestrokeNote.dtnCtStarted ? new Date(telestrokeNote.dtnCtStarted) : null;
            const ctRead = telestrokeNote.dtnCtRead ? new Date(telestrokeNote.dtnCtRead) : null;
            const tnkAdmin = telestrokeNote.dtnTnkAdministered ? new Date(telestrokeNote.dtnTnkAdministered) : null;

            metrics.timestamps = {
              edArrival,
              strokeAlert: telestrokeNote.dtnStrokeAlert ? new Date(telestrokeNote.dtnStrokeAlert) : null,
              ctStarted,
              ctRead,
              tnkOrdered: telestrokeNote.dtnTnkOrdered ? new Date(telestrokeNote.dtnTnkOrdered) : null,
              tnkAdmin
            };

            // Door-to-CT: ED Arrival → CT started
            if (edArrival && ctStarted) {
              const diffMs = ctStarted - edArrival;
              const diffMins = Math.round(diffMs / (1000 * 60));
              metrics.doorToCT = diffMins;
            }

            // Door-to-Needle (DTN): ED Arrival → TNK administered
            if (edArrival && tnkAdmin) {
              const diffMs = tnkAdmin - edArrival;
              const diffMins = Math.round(diffMs / (1000 * 60));
              metrics.doorToNeedle = diffMins;
            }

            // CT-to-Needle: CT read → TNK administered
            if (ctRead && tnkAdmin) {
              const diffMs = tnkAdmin - ctRead;
              const diffMins = Math.round(diffMs / (1000 * 60));
              metrics.ctToNeedle = diffMins;
            }

            return metrics;
          };

          // Get DTN benchmark status and color
          const getDTNBenchmark = (dtnMinutes) => {
            if (dtnMinutes === null) return null;
            if (dtnMinutes <= 45) {
              return {
                status: 'excellent',
                color: 'green',
                label: 'Excellent',
                target: 45,
                delta: dtnMinutes - 45
              };
            } else if (dtnMinutes <= 60) {
              return {
                status: 'good',
                color: 'yellow',
                label: 'Good',
                target: 60,
                delta: dtnMinutes - 45 // Compare to ideal target
              };
            } else {
              return {
                status: 'needs_improvement',
                color: 'red',
                label: 'Needs Improvement',
                target: 60,
                delta: dtnMinutes - 60
              };
            }
          };

          // Format DTN metrics for Epic note
          const formatDTNForNote = () => {
            const metrics = calculateDTNMetrics();
            if (!metrics.doorToNeedle) return '';

            const benchmark = getDTNBenchmark(metrics.doorToNeedle);
            let noteText = '\nTime Metrics:\n';

            if (metrics.doorToCT !== null) {
              noteText += `Door-to-CT: ${metrics.doorToCT} minutes\n`;
            }
            noteText += `Door-to-Needle (DTN): ${metrics.doorToNeedle} minutes`;

            if (benchmark) {
              noteText += ` (${benchmark.label}`;
              if (benchmark.delta > 0) {
                noteText += `, +${benchmark.delta} min over ${benchmark.target} min target`;
              } else if (benchmark.delta < 0) {
                noteText += `, ${Math.abs(benchmark.delta)} min under ${benchmark.target} min target`;
              }
              noteText += ')';
            }
            noteText += '\n';

            if (metrics.ctToNeedle !== null) {
              noteText += `CT-to-Needle: ${metrics.ctToNeedle} minutes\n`;
            }

            return noteText;
          };

          // =================================================================
          // CONTRAINDICATION DETECTION
          // =================================================================
          const detectContraindications = (data) => {
            const alerts = [];

            // Glucose check
            const glucose = parseFloat(data.telestrokeNote?.glucose);
            if (!isNaN(glucose)) {
              if (glucose < 50) {
                alerts.push({ severity: 'critical', label: 'Hypoglycemia', message: `Glucose ${glucose} mg/dL - Correct before thrombolysis`, field: 'glucose' });
              } else if (glucose > 400) {
                alerts.push({ severity: 'critical', label: 'Hyperglycemia', message: `Glucose ${glucose} mg/dL - Correct before thrombolysis`, field: 'glucose' });
              }
            }

            // INR check
            const inr = parseFloat(data.telestrokeNote?.inr);
            if (!isNaN(inr) && inr > 1.7) {
              alerts.push({ severity: 'critical', label: 'Elevated INR', message: `INR ${inr.toFixed(1)} >1.7 - tPA/TNK CONTRAINDICATED`, field: 'inr' });
            }

            // Platelet check
            const platelets = parseFloat(data.telestrokeNote?.plateletCount);
            if (!isNaN(platelets) && platelets < 100000) {
              alerts.push({ severity: 'critical', label: 'Low Platelets', message: `${platelets.toLocaleString()}/μL <100,000 - tPA/TNK CONTRAINDICATED`, field: 'plateletCount' });
            }

            // BP check (parse from string like "185/110")
            const bp = data.telestrokeNote?.presentingBP || '';
            const bpMatch = bp.match(/(\d+)\s*\/\s*(\d+)/);
            if (bpMatch) {
              const systolic = parseInt(bpMatch[1]);
              const diastolic = parseInt(bpMatch[2]);
              if (systolic > 185 || diastolic > 110) {
                alerts.push({ severity: 'warning', label: 'Elevated BP', message: `${systolic}/${diastolic} exceeds 185/110 - Must lower before TNK`, field: 'presentingBP' });
              }
            }

            // DOAC check
            if (data.telestrokeNote?.lastDOACType && data.telestrokeNote?.lastDOACDose) {
              const lastDose = new Date(data.telestrokeNote.lastDOACDose);
              const now = new Date();
              const hoursSinceDose = (now - lastDose) / (1000 * 60 * 60);
              if (hoursSinceDose < 48) {
                alerts.push({ severity: 'warning', label: 'Recent DOAC', message: `${data.telestrokeNote.lastDOACType} within ${hoursSinceDose.toFixed(0)}h - Check drug-specific assay`, field: 'lastDOACDose' });
              }
            }

            // Age + NIHSS check (SPAN-100)
            const age = parseInt(data.telestrokeNote?.age);
            const nihss = parseInt(data.telestrokeNote?.nihss);
            if (!isNaN(age) && !isNaN(nihss) && (age + nihss >= 100)) {
              alerts.push({ severity: 'info', label: 'SPAN-100', message: `Age ${age} + NIHSS ${nihss} = ${age + nihss} ≥100 - Higher sICH risk`, field: 'nihss' });
            }

            // Time window check
            const lkwDate = data.telestrokeNote?.lkwDate;
            const lkwTime = data.telestrokeNote?.lkwTime;
            if (lkwDate && lkwTime) {
              const lkw = new Date(`${lkwDate}T${lkwTime}`);
              const now = new Date();
              const hoursFromLKW = (now - lkw) / (1000 * 60 * 60);
              if (hoursFromLKW > 4.5 && data.telestrokeNote?.tnkRecommended) {
                alerts.push({ severity: 'warning', label: 'Late Window', message: `${hoursFromLKW.toFixed(1)}h from LKW - Verify imaging criteria`, field: 'lkwTime' });
              }
            }

            return alerts;
          };

          // Create Icon component wrapper
          const Icon = ({ icon: IconComponent, size = 16 }) => {
            const ref = useRef(null);
            
            React.useEffect(() => {
              if (ref.current) {
                // Scope icon creation to this specific container to prevent global DOM conflicts
                lucide.createIcons({
                  root: ref.current,
                  nameAttr: 'data-lucide',
                  attrs: {
                    class: `w-4 h-4 inline-block`
                  }
                });
              }
            }, [IconComponent]);

            // Use a span wrapper to protect the icon from React reconciliation issues
            // Lucide will replace the <i> inside this span
            return (
              <span ref={ref} className="inline-flex items-center justify-center">
                <i data-lucide={IconComponent} className="w-4 h-4 inline-block"></i>
              </span>
            );
          };

          // Privacy: Persist app data and update lastUpdated (TTL handled globally)
          const saveWithExpiration = (key, data) => {
            try {
              setKey(key, data);
              setSaveStatus('saved');
              setLastSaved(new Date());
            } catch (e) {
              setSaveStatus('error');
              console.error('Save failed:', e);
            }
          };

          const loadWithExpiration = (key, defaultValue) => {
            try {
              return loadFromStorage(key, defaultValue);
            } catch (e) {
              console.warn('Load failed:', e);
              return defaultValue;
            }
          };

          // Debounce utility
          const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
              const later = () => {
                clearTimeout(timeout);
                func(...args);
              };
              clearTimeout(timeout);
              timeout = setTimeout(later, wait);
            };
          };

          // Debounced save (will be set up in useEffect)
          const debouncedSave = React.useCallback(
            debounce((key, data) => {
              setSaveStatus('saving');
              saveWithExpiration(key, data);
              setSaveStatus('saved');
              setLastSaved(Date.now());
            }, 1000),
            []
          );

          // ====================================
          // SHIFT MANAGEMENT FUNCTIONS
          // ============================================

          // Generate unique patient ID
          const generatePatientId = () => {
            return `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          };

          // Get current patient summary for display
          const getCurrentPatientSummary = () => {
            const age = telestrokeNote.age || '?';
            const sex = telestrokeNote.sex || '?';
            const symptoms = telestrokeNote.symptoms || 'Stroke symptoms';
            const nihss = telestrokeNote.nihss || nihssScore || '?';
            const timeFromLKW = calculateTimeFromLKW();
            const timeDisplay = timeFromLKW ? `${timeFromLKW.hours}h ${timeFromLKW.minutes}m` : '?';

            // Determine primary vessel/syndrome
            let vesselInfo = '';
            const vessels = telestrokeNote.vesselOcclusion || [];
            if (vessels.includes('M1')) vesselInfo = 'M1';
            else if (vessels.includes('ICA')) vesselInfo = 'ICA';
            else if (vessels.includes('M2')) vesselInfo = 'M2';
            else if (telestrokeNote.ctaResults) {
              if (telestrokeNote.ctaResults.toLowerCase().includes('m1')) vesselInfo = 'M1';
              else if (telestrokeNote.ctaResults.toLowerCase().includes('ica')) vesselInfo = 'ICA';
            }

            return {
              age,
              sex,
              symptoms: symptoms.substring(0, 30) + (symptoms.length > 30 ? '...' : ''),
              nihss,
              timeFromLKW: timeDisplay,
              vesselInfo,
              shortLabel: `${age}${sex} ${vesselInfo || 'AIS'} NIHSS ${nihss}`,
              fullLabel: `${age}yo ${sex === 'M' ? 'M' : sex === 'F' ? 'F' : '?'}, ${vesselInfo || 'Stroke'}, NIHSS ${nihss}, ${timeDisplay} from LKW`
            };
          };

          // Count trials by eligibility status
          const getTrialEligibilitySummary = () => {
            const counts = { eligible: 0, needsInfo: 0, notEligible: 0, total: 0 };
            Object.values(trialEligibility).forEach(result => {
              if (!result) return;
              counts.total++;
              if (result.status === 'eligible') counts.eligible++;
              else if (result.status === 'needs_info') counts.needsInfo++;
              else if (result.status === 'not_eligible') counts.notEligible++;
            });
            return counts;
          };

          // Save current patient to shift list
          const saveCurrentPatientToShift = () => {
            const patientId = currentPatientId || generatePatientId();
            const summary = getCurrentPatientSummary();
            const trialSummary = getTrialEligibilitySummary();

            const patientSnapshot = {
              id: patientId,
              timestamp: Date.now(),
              summary,
              trialSummary,
              // Save form state for restoration
              formState: {
                telestrokeNote: { ...telestrokeNote },
                strokeCodeForm: { ...strokeCodeForm },
                lkwTime: lkwTime ? lkwTime.toISOString() : null,
                nihssScore,
                aspectsScore,
                mrsScore,
                gcsItems: { ...gcsItems }
              }
            };

            setShiftPatients(prev => {
              // Update existing or add new
              const existingIndex = prev.findIndex(p => p.id === patientId);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = patientSnapshot;
                return updated;
              }
              return [...prev, patientSnapshot];
            });

            if (!currentPatientId) {
              setCurrentPatientId(patientId);
            }

            return patientId;
          };

          // Switch to a different patient from shift list
          const switchToPatient = (patientId) => {
            // First save current patient
            if (currentPatientId && telestrokeNote.age) {
              saveCurrentPatientToShift();
            }

            // Find and load the selected patient
            const patient = shiftPatients.find(p => p.id === patientId);
            if (!patient) return;

            const { formState } = patient;
            setTelestrokeNote(formState.telestrokeNote);
            setStrokeCodeForm(formState.strokeCodeForm);
            setLkwTime(formState.lkwTime ? new Date(formState.lkwTime) : null);
            setNihssScore(formState.nihssScore);
            setAspectsScore(formState.aspectsScore);
            setMrsScore(formState.mrsScore);
            setGcsItems(formState.gcsItems);
            setCurrentPatientId(patientId);
            setShowPatientSwitcher(false);
          };

          // Start a new patient (save current first)
          const startNewPatient = () => {
            // Save current if there's data
            if (telestrokeNote.age) {
              saveCurrentPatientToShift();
            }

            clearCurrentCase({ generateNewId: true });
          };

          // Remove patient from shift list
          const removePatientFromShift = (patientId) => {
            setShiftPatients(prev => prev.filter(p => p.id !== patientId));
            if (currentPatientId === patientId) {
              setCurrentPatientId(null);
            }
          };

          const extractTemplateVariables = (text) => {
            if (!text) return [];
            const matches = text.match(/{[A-Z0-9_]+}/g) || [];
            return [...new Set(matches.map((match) => match.replace(/[{}]/g, '')))];
          };

          const fillTemplate = (template, values) => {
            if (!template) return '';
            return template.replace(/{([A-Z0-9_]+)}/g, (match, key) => {
              const replacement = values[key];
              return replacement === null || replacement === undefined ? '' : String(replacement);
            });
          };

          const buildEncounterTemplateContext = () => {
            const lkw = telestrokeNote.lkwDate && telestrokeNote.lkwTime
              ? `${telestrokeNote.lkwDate} ${telestrokeNote.lkwTime}`
              : '';
            return {
              PATIENT_ALIAS: telestrokeNote.alias || '',
              AGE: telestrokeNote.age || '',
              SEX: telestrokeNote.sex || '',
              NIHSS: telestrokeNote.nihss || nihssScore || '',
              DIAGNOSIS: telestrokeNote.diagnosis || '',
              LVO: (telestrokeNote.vesselOcclusion || []).join(', '),
              WEIGHT_KG: telestrokeNote.weight || '',
              LKW: lkw,
              ARRIVAL: telestrokeNote.arrivalTime || '',
              CT_TIME: telestrokeNote.ctTime || '',
              CTA_TIME: telestrokeNote.ctaTime || '',
              CT_RESULTS: telestrokeNote.ctResults || '',
              CTA_RESULTS: telestrokeNote.ctaResults || '',
              CTP_RESULTS: telestrokeNote.ctpResults || '',
              ASPECTS: aspectsScore !== 10 ? aspectsScore : '',
              TNK_STATUS: telestrokeNote.tnkRecommended ? (telestrokeNote.tnkAdminTime ? `Given at ${telestrokeNote.tnkAdminTime}` : 'Recommended') : 'Not given',
              EVT_STATUS: telestrokeNote.evtRecommended ? 'Recommended' : 'Not recommended',
              DISPOSITION: telestrokeNote.disposition || '',
              TRANSFER_STATUS: telestrokeNote.transferAccepted ? 'Accepted' : '',
              PENDING_ITEMS: '',
              ICH_SCORE: calculateICHScore(ichScoreItems),
              GCS: calculateGCS(gcsItems),
              BP: telestrokeNote.presentingBP || '',
              HEMATOMA: telestrokeNote.ctResults || '',
              IVH: telestrokeNote.ctResults || '',
              REVERSAL: ''
            };
          };

          const getSelectedClipboardPack = () => {
            return clipboardPacks.find((pack) => pack.id === selectedPackId) || clipboardPacks[0] || null;
          };

          const buildClipboardPackSections = (pack) => {
            if (!pack) return [];
            const context = buildEncounterTemplateContext();
            return (pack.sections || [])
              .filter((section) => section.enabled)
              .map((section) => ({
                title: section.title,
                body: fillTemplate(section.template, context)
              }));
          };

          const copySelectedClipboardPack = async () => {
            const pack = getSelectedClipboardPack();
            if (!pack) return;
            const sections = buildClipboardPackSections(pack);
            const ok = await copyWithSectionHeaders(sections);
            if (ok) {
              setCopiedText('Clipboard pack');
            }
          };

          const updateShiftBoard = (boardId, updater) => {
            updateAppData((prev) => ({
              ...prev,
              shiftBoards: prev.shiftBoards.map((board) => {
                if (board.id !== boardId) return board;
                const updated = updater(board);
                return { ...updated, updatedAt: toIsoString() };
              })
            }));
          };

          const setActiveShiftBoard = (boardId) => {
            updateAppData((prev) => ({
              ...prev,
              uiState: { ...prev.uiState, lastShiftBoardId: boardId }
            }));
          };

          const addShiftBoard = () => {
            const name = prompt('Board name:', 'New Board');
            if (!name) return;
            const boardId = generateId('board');
            updateAppData((prev) => ({
              ...prev,
              shiftBoards: [
                {
                  id: boardId,
                  name: name.trim() || 'New Board',
                  createdAt: toIsoString(),
                  updatedAt: toIsoString(),
                  archived: false,
                  patients: []
                },
                ...prev.shiftBoards
              ],
              uiState: { ...prev.uiState, lastShiftBoardId: boardId }
            }));
          };

          const renameShiftBoard = (boardId) => {
            const board = shiftBoards.find((item) => item.id === boardId);
            if (!board) return;
            const name = prompt('Rename board:', board.name);
            if (!name) return;
            updateShiftBoard(boardId, (current) => ({ ...current, name: name.trim() || current.name }));
          };

          const archiveShiftBoard = (boardId, archived = true) => {
            updateShiftBoard(boardId, (current) => ({ ...current, archived }));
          };

          const addShiftPatientCard = () => {
            if (!activeShiftBoard) return;
            const patient = {
              id: generateId('pt'),
              alias: generateAlias(),
              label: '',
              location: '',
              problemSummary: '',
              tasks: [],
              pendingResults: [],
              freeNotes: ''
            };
            updateShiftBoard(activeShiftBoard.id, (board) => ({
              ...board,
              patients: [patient, ...(board.patients || [])]
            }));
          };

          const updateShiftPatient = (patientId, updates) => {
            if (!activeShiftBoard) return;
            updateShiftBoard(activeShiftBoard.id, (board) => ({
              ...board,
              patients: (board.patients || []).map((patient) => patient.id === patientId ? { ...patient, ...updates } : patient)
            }));
          };

          const removeShiftPatient = (patientId) => {
            if (!activeShiftBoard) return;
            updateShiftBoard(activeShiftBoard.id, (board) => ({
              ...board,
              patients: (board.patients || []).filter((patient) => patient.id !== patientId)
            }));
          };

          const addShiftTask = (patientId, text) => {
            if (!activeShiftBoard || !text) return;
            updateShiftBoard(activeShiftBoard.id, (board) => ({
              ...board,
              patients: (board.patients || []).map((patient) => {
                if (patient.id !== patientId) return patient;
                const task = {
                  id: generateId('task'),
                  text: text.trim(),
                  priority: 'med',
                  owner: 'me',
                  dueAt: '',
                  status: 'todo',
                  createdAt: toIsoString(),
                  completedAt: null
                };
                return { ...patient, tasks: [task, ...(patient.tasks || [])] };
              })
            }));
          };

          const promptAddShiftTask = () => {
            if (!activeShiftBoard || !(activeShiftBoard.patients || []).length) {
              showNotice('Add a patient before creating a task.', 'warning');
              return;
            }
            const taskText = prompt('Task description:');
            if (!taskText) return;
            const targetPatient = activeShiftBoard.patients[0];
            addShiftTask(targetPatient.id, taskText);
          };

          const updateShiftTask = (patientId, taskId, updates) => {
            if (!activeShiftBoard) return;
            updateShiftBoard(activeShiftBoard.id, (board) => ({
              ...board,
              patients: (board.patients || []).map((patient) => {
                if (patient.id !== patientId) return patient;
                return {
                  ...patient,
                  tasks: (patient.tasks || []).map((task) => task.id === taskId
                    ? {
                        ...task,
                        ...updates,
                        completedAt: updates.status === 'done' ? toIsoString() : task.completedAt
                      }
                    : task)
                };
              })
            }));
          };

          const addPendingResult = (patientId, label) => {
            if (!activeShiftBoard || !label) return;
            updateShiftBoard(activeShiftBoard.id, (board) => ({
              ...board,
              patients: (board.patients || []).map((patient) => {
                if (patient.id !== patientId) return patient;
                const result = {
                  id: generateId('result'),
                  label: label.trim(),
                  status: 'pending',
                  dueAt: '',
                  resultSummary: ''
                };
                return { ...patient, pendingResults: [result, ...(patient.pendingResults || [])] };
              })
            }));
          };

          const updatePendingResult = (patientId, resultId, updates) => {
            if (!activeShiftBoard) return;
            updateShiftBoard(activeShiftBoard.id, (board) => ({
              ...board,
              patients: (board.patients || []).map((patient) => {
                if (patient.id !== patientId) return patient;
                return {
                  ...patient,
                  pendingResults: (patient.pendingResults || []).map((result) => result.id === resultId ? { ...result, ...updates } : result)
                };
              })
            }));
          };

          const generateRoundsChecklist = (board) => {
            if (!board) return '';
            let text = `ROUNDS CHECKLIST - ${board.name}\n---\n`;
            (board.patients || []).forEach((patient) => {
              text += `${patient.alias || 'Patient'}${patient.label ? ` (${patient.label})` : ''}\n`;
              if (patient.problemSummary) text += `- Summary: ${patient.problemSummary}\n`;
              const openTasks = (patient.tasks || []).filter((task) => task.status !== 'done');
              if (openTasks.length) {
                text += `- Tasks:\n`;
                openTasks.forEach((task) => {
                  text += `  • ${task.text} (${task.priority})\n`;
                });
              }
              const pending = (patient.pendingResults || []).filter((result) => result.status !== 'resulted');
              if (pending.length) {
                text += `- Pending:\n`;
                pending.forEach((result) => {
                  text += `  • ${result.label}\n`;
                });
              }
              text += '\n';
            });
            return text.trim();
          };


          // Persist shift patients to localStorage
          React.useEffect(() => {
            if (shiftPatients.length > 0) {
              saveWithExpiration('shiftPatients', shiftPatients);
            }
          }, [shiftPatients]);

          React.useEffect(() => {
            if (currentPatientId) {
              setKey('currentPatientId', currentPatientId);
            }
          }, [currentPatientId]);

          React.useEffect(() => {
            saveAppData(appData);
          }, [appData]);

          const noticeTimeoutRef = React.useRef(null);
          const clearUndoTimeoutRef = React.useRef(null);
          const hasHandledExpiredRef = React.useRef(false);

          const showNotice = (message, type = 'info', options = {}) => {
            const { timeoutMs = 4000, persist = false } = options;
            if (noticeTimeoutRef.current) {
              clearTimeout(noticeTimeoutRef.current);
            }
            setNotice({ message, type });
            if (!persist) {
              noticeTimeoutRef.current = setTimeout(() => {
                setNotice(null);
              }, timeoutMs);
            }
          };

          const resetAppStateToDefaults = (options = {}) => {
            const { resetDarkMode = false } = options;

            setAppData(getDefaultAppData());
            setPatientData({});
            setNihssScore(0);
            setAspectsScore(10);
            setLkwTime(new Date());
            setStrokeCodeForm(getDefaultStrokeCodeForm());
            setAspectsRegionState(getDefaultAspectsRegionState());
            setPcAspectsRegions(getDefaultPcAspectsRegions());
            setGcsItems({ eye: '', verbal: '', motor: '' });
            setMrsScore('');
            setIchScoreItems({ gcs: '', age80: false, volume30: false, ivh: false, infratentorial: false });
            setAbcd2Items({ age60: false, bp: false, unilateralWeakness: false, speechDisturbance: false, duration: '', diabetes: false });
            setChads2vascItems({ chf: false, hypertension: false, age75: false, diabetes: false, strokeTia: false, vascular: false, age65: false, female: false });
            setRopeItems({ noHypertension: false, noDiabetes: false, noStrokeTia: false, nonsmoker: false, cortical: false, age: '' });
            setHuntHessGrade('');
            setWfnsGrade('');
            setHasbledItems({ hypertension: false, renalDisease: false, liverDisease: false, stroke: false, bleeding: false, labileINR: false, elderly: false, drugs: false, alcohol: false });
            setRcvs2Items({ recurrentTCH: false, carotidInvolvement: false, vasoconstrictiveTrigger: false, female: false, sah: false });
            setCurrentStep(0);
            setCompletedSteps([]);
            setShiftPatients([]);
            setCurrentPatientId(null);
            setShowPatientSwitcher(false);
            setConsultationType(getDefaultSettings().defaultConsultationType || 'videoTelestroke');
            setManagementSubTab('ich');
            setFabExpanded(false);
            setAlertsMuted(false);
            setLastAlertPlayed(null);
            setAlertFlashing(false);
            setElapsedSeconds(0);
            setTimerSidebarCollapsed(window.innerWidth < 1024);
            setTelestrokeNote(getDefaultTelestrokeNote());
            setEditableTemplate(defaultTelestrokeTemplate);
            setSearchQuery('');
            setSearchResults([]);
            setSearchOpen(false);
            setSearchContext('header');
            setEvidenceFilter('');
            setShowKeyboardHelp(false);
            setCopiedText('');
            setShowSuccess(false);
            setIsCalculating(false);
            setCriticalAlerts([]);
            setTrialsCategory('ischemic');
            setToolLoadErrors({ clinic: false, map: false });
            setSaveStatus('saved');
            setLastSaved(null);
            setNotice(null);
            setPathwayCollapsed(true);
            setGuidelineRecsExpanded(false);
            setDeidWarnings({});

            if (resetDarkMode) {
              setDarkMode(false);
              document.documentElement.classList.remove('dark');
            }
          };

          const navigateTo = (tab, options = {}) => {
            const { clearSearch = false, subTab = null } = options;
            const rawTab = tab || 'encounter';
            const legacySubTab = LEGACY_MANAGEMENT_TABS[rawTab];
            let nextTab = rawTab;

            if (legacySubTab) {
              nextTab = 'management';
            } else if (!VALID_TABS.includes(nextTab)) {
              nextTab = 'encounter';
            }

            let nextManagementSubTab = managementSubTab;
            if (nextTab === 'management') {
              const resolvedSubTab = normalizeManagementSubTab(subTab) || legacySubTab || managementSubTab || 'ich';
              nextManagementSubTab = resolvedSubTab;
              setManagementSubTab(resolvedSubTab);
            }

            setActiveTab(nextTab);

            updateAppData((prev) => ({
              ...prev,
              uiState: {
                ...prev.uiState,
                lastActiveTab: nextTab,
                lastManagementSubTab: nextTab === 'management' ? nextManagementSubTab : prev.uiState.lastManagementSubTab
              }
            }));

            if (clearSearch) {
              setSearchQuery('');
              setSearchResults([]);
              setSearchOpen(false);
              setSearchContext('header');
            }
          };

          const setSearchHighlight = (id) => {
            updateAppData((prev) => ({
              ...prev,
              uiState: {
                ...prev.uiState,
                searchHighlightId: id
              }
            }));
          };

          // Utility Functions
          const shouldPersistFreeText = settings.allowFreeTextStorage === true;

          const updateSettings = (updates) => {
            updateAppData((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                ...updates
              }
            }));
          };


          const addDecisionLogEntry = (label, detail = '') => {
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            setTelestrokeNote((prev) => ({
              ...prev,
              decisionLog: [
                { id: generateId('decision'), label, detail, time },
                ...(prev.decisionLog || [])
              ]
            }));
          };

          const appendMedication = (medication) => {
            setTelestrokeNote((prev) => {
              const current = (prev.medications || '').trim();
              const next = current ? `${current}, ${medication}` : medication;
              return { ...prev, medications: next };
            });
          };


          const updateContacts = (contacts) => {
            updateSettings({ contacts });
          };


          const applyRolePreset = (role) => {
            const preset = rolePresets[role];
            if (!preset) return;
            setConsultationType(preset.consultationType);
            setShowAdvanced(preset.showAdvanced);
          };

          const formatDateTimeDisplay = (value) => {
            if (!value) return '';
            const parsed = value instanceof Date ? value : new Date(value);
            if (Number.isNaN(parsed.getTime())) return String(value);
            return parsed.toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
          };

          const buildTransferDecisionText = (decision, reason = '') => {
            const age = telestrokeNote.age || '?';
            const sex = telestrokeNote.sex || '?';
            const nihss = telestrokeNote.nihss || nihssScore || '?';
            const reference = getReferenceTime();
            const onsetLabel = reference ? reference.label : 'LKW';
            const onsetTime = reference ? formatDateTimeDisplay(reference.time) : 'unknown';
            const decisionLabel = decision === 'accept' ? 'Transfer accepted' : 'Transfer declined';
            const detail = reason ? `Reason: ${reason}` : 'Reason: clinical criteria not met';
            return `${decisionLabel} for ${age}yo ${sex}, NIHSS ${nihss}. ${onsetLabel} ${onsetTime}. ${detail}.`;
          };

          const getHandoffSummaryFields = () => {
            const age = telestrokeNote.age || '--';
            const sex = telestrokeNote.sex || '--';
            const nihss = telestrokeNote.nihss || nihssScore || '--';
            const nihssDetails = telestrokeNote.nihssDetails || '';
            const diagnosis = telestrokeNote.diagnosis
              || (telestrokeNote.diagnosisCategory === 'ischemic'
                ? 'Suspected acute ischemic stroke'
                : telestrokeNote.diagnosisCategory === 'ich'
                  ? 'Intracerebral hemorrhage (ICH)'
                  : telestrokeNote.diagnosisCategory === 'mimic'
                    ? 'Stroke mimic'
                    : 'Diagnosis pending');
            const reference = getReferenceTime();
            const onsetLabel = reference ? reference.label : 'Onset';
            const onsetTime = reference ? formatDateTimeDisplay(reference.time) : 'Unknown';
            const timeFrom = calculateTimeFromLKW();
            const elapsed = timeFrom ? `${timeFrom.hours}h ${timeFrom.minutes}m` : 'Unknown';
            const imagingSummaryParts = [
              `CT: ${telestrokeNote.ctResults || 'pending'}`,
              `CTA: ${telestrokeNote.ctaResults || 'pending'}`
            ];
            if (telestrokeNote.ctpResults) {
              imagingSummaryParts.push(`CTP: ${telestrokeNote.ctpResults}`);
            }
            const imagingSummary = imagingSummaryParts.join('; ');
            const tnkDose = telestrokeNote.weight ? calculateTNKDose(telestrokeNote.weight) : null;
            const tnkStatus = telestrokeNote.tnkRecommended
              ? `TNK recommended${tnkDose ? ` (${tnkDose.calculatedDose} mg)` : ''}`
              : 'TNK not recommended';
            const evtStatus = telestrokeNote.evtRecommended ? 'EVT recommended' : 'EVT not recommended';
            const disposition = telestrokeNote.disposition || '';
            const transferStatus = telestrokeNote.transferAccepted
              ? 'Transfer accepted'
              : telestrokeNote.transferRationale
                ? 'Transfer declined'
                : '';
            const transportDetails = telestrokeNote.transportMode
              ? `${telestrokeNote.transportMode}${telestrokeNote.transportEta ? ` ETA ${formatDateTimeDisplay(telestrokeNote.transportEta)}` : ''}`
              : '';
            const imagingShare = telestrokeNote.transferImagingShareMethod
              ? `${telestrokeNote.transferImagingShareMethod}${telestrokeNote.transferImagingShareLink ? ` (${telestrokeNote.transferImagingShareLink})` : ''}`
              : '';

            return {
              age,
              sex,
              nihss,
              nihssDetails,
              diagnosis,
              onsetLabel,
              onsetTime,
              elapsed,
              imagingSummary,
              tnkStatus,
              evtStatus,
              disposition,
              transferStatus,
              transportDetails,
              imagingShare
            };
          };

          const buildHandoffSummary = () => {
            const fields = getHandoffSummaryFields();
            const summaryLines = [
              'Handoff Summary',
              `Age/Sex: ${fields.age}${fields.sex ? ` ${fields.sex}` : ''}`,
              `Dx: ${fields.diagnosis}`,
              `${fields.onsetLabel}: ${fields.onsetTime}${fields.elapsed && fields.elapsed !== 'Unknown' ? ` (${fields.elapsed} elapsed)` : ''}`,
              `NIHSS: ${fields.nihss}${fields.nihssDetails ? ` (${fields.nihssDetails})` : ''}`,
              `Imaging: ${fields.imagingSummary}`,
              `Plan: ${fields.tnkStatus}; ${fields.evtStatus}`
            ];
            if (fields.disposition) summaryLines.push(`Disposition: ${fields.disposition}`);
            if (fields.transferStatus) summaryLines.push(fields.transferStatus);
            if (fields.transportDetails) summaryLines.push(`Transport: ${fields.transportDetails}`);
            if (fields.imagingShare) summaryLines.push(`Imaging share: ${fields.imagingShare}`);
            if (telestrokeNote.rationale) summaryLines.push(`Rationale: ${telestrokeNote.rationale}`);
            if (telestrokeNote.recommendationsText) summaryLines.push(`Recommendations: ${telestrokeNote.recommendationsText}`);
            return summaryLines.filter(Boolean).join('\n');
          };

          const getSafetyChecks = () => {
            const hasOnset = Boolean(getReferenceTime());
            const hasNihss = Boolean(telestrokeNote.nihss || nihssScore);
            const hasBP = Boolean(telestrokeNote.presentingBP);
            const hasGlucose = Boolean(telestrokeNote.glucose);
            const hasCT = Boolean(telestrokeNote.ctResults);
            const hasCTA = Boolean(telestrokeNote.ctaResults);
            const hasWeight = !telestrokeNote.tnkRecommended || Boolean(telestrokeNote.weight);
            const tnkChecklist = !telestrokeNote.tnkRecommended || telestrokeNote.tnkContraindicationReviewed;
            const consent = !telestrokeNote.tnkRecommended || telestrokeNote.tnkConsentDiscussed;

            return [
              { id: 'onset', label: 'Onset time documented', complete: hasOnset },
              { id: 'nihss', label: 'NIHSS documented', complete: hasNihss },
              { id: 'bp', label: 'BP documented', complete: hasBP },
              { id: 'glucose', label: 'Glucose documented', complete: hasGlucose },
              { id: 'ct', label: 'CT results documented', complete: hasCT },
              { id: 'cta', label: 'CTA results documented (if obtained)', complete: hasCTA },
              { id: 'weight', label: 'Weight documented (if TNK)', complete: hasWeight },
              { id: 'tnkChecklist', label: 'TNK contraindications reviewed', complete: tnkChecklist },
              { id: 'consent', label: 'TNK consent discussed', complete: consent }
            ];
          };


          const sanitizeTelestrokeNoteForStorage = (note) => {
            if (shouldPersistFreeText) return note;
            const allowedKeys = [
              'alias', 'age', 'sex', 'weight', 'nihss', 'aspects', 'vesselOcclusion', 'diagnosisCategory',
              'lkwDate', 'lkwTime', 'lkwUnknown', 'discoveryDate', 'discoveryTime', 'arrivalTime', 'strokeAlertTime', 'ctDate', 'ctTime', 'ctaDate', 'ctaTime', 'tnkAdminTime',
              'presentingBP', 'bpPreTNK', 'bpPreTNKTime',
              'glucose', 'plateletCount', 'inr', 'ptt', 'creatinine',
              'tnkRecommended', 'evtRecommended', 'tnkContraindicationChecklist',
              'tnkContraindicationReviewed', 'tnkContraindicationReviewTime', 'tnkConsentDiscussed',
              'patientFamilyConsent', 'presumedConsent', 'preTNKSafetyPause',
              'imagingReviewed', 'transferAccepted', 'transferRationale', 'transferChecklist', 'disposition',
              'transferImagingShareMethod', 'transferImagingShareLink', 'transportMode', 'transportEta', 'transportNotes',
              'lastDOACType', 'lastDOACDose',
              'dtnEdArrival', 'dtnStrokeAlert', 'dtnCtStarted', 'dtnCtRead',
              'dtnTnkOrdered', 'dtnTnkAdministered',
              'decisionLog'
            ];
            return allowedKeys.reduce((acc, key) => {
              if (note && Object.prototype.hasOwnProperty.call(note, key)) {
                acc[key] = note[key];
              }
              return acc;
            }, {});
          };

          const sanitizeStrokeCodeFormForStorage = (form) => {
            if (shouldPersistFreeText) return form;
            const allowedKeys = [
              'age', 'sex', 'lkw', 'lkw_date', 'nihss', 'aspects',
              'tnk', 'tnk_rec', 'evt_rec'
            ];
            return allowedKeys.reduce((acc, key) => {
              if (form && Object.prototype.hasOwnProperty.call(form, key)) {
                acc[key] = form[key];
              }
              return acc;
            }, {});
          };

          const generateAlias = () => {
            const adjectives = ['Swift', 'Calm', 'Brisk', 'Bright', 'Sable', 'Quiet', 'Sturdy', 'Clear'];
            const nouns = ['Falcon', 'Harbor', 'Quartz', 'Willow', 'Comet', 'Cedar', 'Nimbus', 'Aspen'];
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            const code = Math.floor(Math.random() * 90 + 10);
            return `${adj}-${noun}-${code}`;
          };

          const formatElapsed = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${String(secs).padStart(2, '0')}`;
          };

          const buildSparklinePath = (values, width = 120, height = 28) => {
            if (!values.length) return '';
            const max = Math.max(...values, 1);
            const step = width / Math.max(values.length - 1, 1);
            return values.map((value, index) => {
              const x = index * step;
              const y = height - (value / max) * height;
              return `${index === 0 ? 'M' : 'L'}${x},${y}`;
            }).join(' ');
          };

          const copyToClipboard = (text, label) => {
            navigator.clipboard.writeText(text).then(() => {
              setCopiedText(label);
              setTimeout(() => setCopiedText(''), 2000);
            });
          };

          // Share document using Web Share API
          const shareDocument = async (title, url) => {
            const fullUrl = window.location.origin + window.location.pathname + url;
            if (navigator.share) {
              try {
                await navigator.share({
                  title: `Stroke Resource: ${title}`,
                  text: `Check out this stroke reference: ${title}`,
                  url: fullUrl
                });
              } catch (err) {
                if (err.name !== 'AbortError') {
                  // If share fails, fallback to copy
                  copyToClipboard(fullUrl, title);
                }
              }
            } else {
              // Fallback to copy if Web Share API not supported
              copyToClipboard(fullUrl, title);
            }
          };

          // Email document link
          const emailDocument = (title, url) => {
            const fullUrl = window.location.origin + window.location.pathname + url;
            const subject = encodeURIComponent(title);
            const body = encodeURIComponent(fullUrl);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
          };

          const exportToPDF = () => {
            const element = document.getElementById('root');
            const opt = {
              margin: 0.5,
              filename: `stroke-assessment-${new Date().toISOString().split('T')[0]}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
          };

          const toggleDarkMode = () => {
            const newDarkMode = !darkMode;
            setDarkMode(newDarkMode);
            setKey('darkMode', newDarkMode, { skipLastUpdated: true });
            if (newDarkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          };

          const handleShare = async () => {
            const shareData = {
              title: 'Stroke',
              text: 'Clinical decision support toolkit for stroke management',
              url: window.location.href
            };

            try {
              if (navigator.share) {
                await navigator.share(shareData);
              } else {
                // Fallback: copy link to clipboard
                await navigator.clipboard.writeText(window.location.href);
                setCopiedText('Link');
              }
            } catch (err) {
              if (err.name !== 'AbortError') {
                // User cancelled or error occurred - fallback to copy
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopiedText('Link');
                } catch (e) {
                  console.error('Share failed:', e);
                }
              }
            }
          };

          const Tooltip = ({ text, children }) => (
            <span className="tooltip">
              {children}
              <span className="tooltiptext">{text}</span>
            </span>
          );

          // Generate telestroke documentation note
          const generateTelestrokeNote = () => {
            const formatDate = (dateStr) => {
              if (!dateStr) return '';
              const date = new Date(dateStr);
              return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`;
            };

            const formatTime = (timeStr) => {
              if (!timeStr) return '';
              const [hours, minutes] = timeStr.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'pm' : 'am';
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              return `${displayHour}:${minutes} ${ampm}`;
            };

            // Use the editable template and replace placeholders with actual values
            let note = editableTemplate;

            // Replace all placeholders with actual values
            note = note.replace(/{chiefComplaint}/g, telestrokeNote.chiefComplaint || '');
            note = note.replace(/{lkwDate}/g, formatDate(telestrokeNote.lkwDate));
            note = note.replace(/{lkwTime}/g, formatTime(telestrokeNote.lkwTime));
            note = note.replace(/{age}/g, telestrokeNote.age || '');
            note = note.replace(/{sex}/g, telestrokeNote.sex || '');
            note = note.replace(/{symptoms}/g, telestrokeNote.symptoms || '');
            note = note.replace(/{pmh}/g, telestrokeNote.pmh || '');
            note = note.replace(/{medications}/g, telestrokeNote.medications || '');
            note = note.replace(/{presentingBP}/g, telestrokeNote.presentingBP || '');
            note = note.replace(/{bpPreTNK}/g, telestrokeNote.bpPreTNK || '');
            note = note.replace(/{bpPreTNKTime}/g, formatTime(telestrokeNote.bpPreTNKTime));
            note = note.replace(/{glucose}/g, telestrokeNote.glucose || '');
            note = note.replace(/{plateletsCoags}/g, telestrokeNote.plateletsCoags || '');
            note = note.replace(/{creatinine}/g, telestrokeNote.creatinine || '');
            note = note.replace(/{nihss}/g, telestrokeNote.nihss || nihssScore || '');
            note = note.replace(/{nihssDetails}/g, telestrokeNote.nihssDetails || '');
            note = note.replace(/{ctTime}/g, formatTime(telestrokeNote.ctTime));
            note = note.replace(/{ctResults}/g, telestrokeNote.ctResults || '');
            note = note.replace(/{ctaDate}/g, formatDate(telestrokeNote.ctaDate));
            note = note.replace(/{ctaTime}/g, formatTime(telestrokeNote.ctaTime));
            note = note.replace(/{ctaResults}/g, telestrokeNote.ctaResults || '');
            note = note.replace(/{ekgResults}/g, telestrokeNote.ekgResults || '');
            note = note.replace(/{diagnosis}/g, telestrokeNote.diagnosis || '');
            note = note.replace(/{tnkAdminTime}/g, formatTime(telestrokeNote.tnkAdminTime));
            note = note.replace(/{recommendationsText}/g, telestrokeNote.recommendationsText || '');

            // Add DTN metrics if TNK was administered
            if (telestrokeNote.dtnTnkAdministered && telestrokeNote.tnkRecommended) {
              note += formatDTNForNote();
            }

            // Add contraindication review status if reviewed
            if (telestrokeNote.tnkContraindicationReviewed) {
              note += `\nThrombolysis Contraindication Review: Completed at ${telestrokeNote.tnkContraindicationReviewTime}. `;
              const checklist = telestrokeNote.tnkContraindicationChecklist || {};
              const absoluteKeys = ['activeInternalBleeding', 'recentIntracranialSurgery', 'intracranialNeoplasm', 'knownBleedingDiathesis', 'severeUncontrolledHTN', 'currentICH'];
              const relativeKeys = ['recentMajorSurgery', 'recentGIGUBleeding', 'recentArterialPuncture', 'recentLumbarPuncture', 'pregnancy', 'seizureAtOnset', 'lowPlatelets', 'elevatedINR', 'elevatedPTT', 'abnormalGlucose', 'recentDOAC'];
              const absoluteChecked = absoluteKeys.filter(k => checklist[k]);
              const relativeChecked = relativeKeys.filter(k => checklist[k]);
              if (absoluteChecked.length === 0 && relativeChecked.length === 0) {
                note += 'No absolute or relative contraindications identified.';
              } else if (absoluteChecked.length > 0) {
                note += `Absolute contraindication(s) identified: ${absoluteChecked.length}. TNK contraindicated.`;
              } else if (relativeChecked.length > 0) {
                note += `${relativeChecked.length} relative contraindication(s) identified. Clinical judgment applied.`;
              }
              note += '\n';
            }

            return note;

            // OLD TEMPLATE CODE BELOW - kept for reference but not used anymore
            /*

            let note = `Chief complaint: ${telestrokeNote.chiefComplaint}\n`;
            note += `Last known well (date/time): ${formatDate(telestrokeNote.lkwDate)} ${formatTime(telestrokeNote.lkwTime)}\n`;
            note += `HPI:\n`;
            note += `            ${telestrokeNote.age} year old ${telestrokeNote.sex} p/w ${telestrokeNote.symptoms}`;
            if (telestrokeNote.lkwTime) {
              note += ` at ${formatTime(telestrokeNote.lkwTime)}`;
            }
            note += `\n`;

            note += `Relevant PMH:\n`;
            note += `            ${telestrokeNote.pmh}\n`;

            note += `Medications: `;
            if (telestrokeNote.noAnticoagulants) {
              note += `no anticoagulants (confirmed with pt's wife), `;
            }
            note += `${telestrokeNote.medications}\n`;

            note += `Objective:\n`;
            note += `Vitals:\n`;
            if (telestrokeNote.presentingBP) {
              note += `Presenting BP ${telestrokeNote.presentingBP}\n`;
            }
            if (telestrokeNote.bpPreTNK) {
              note += `Blood pressure: BP prior to TNK administration: ${telestrokeNote.bpPreTNK}`;
              if (telestrokeNote.bpPreTNKTime) {
                note += ` at ${formatTime(telestrokeNote.bpPreTNKTime)}`;
              }
              note += `\n`;
            }

            note += `Labs: `;
            const labs = [];
            if (telestrokeNote.glucose) labs.push(`Glucose ${telestrokeNote.glucose}`);
            if (telestrokeNote.plateletsCoags) labs.push(`PLT and coags ${telestrokeNote.plateletsCoags}`);
            if (telestrokeNote.creatinine) labs.push(`Cr ${telestrokeNote.creatinine}`);
            note += labs.join(', ') + `\n`;

            note += `Exam: Scores: NIHSS ${telestrokeNote.nihss}`;
            if (telestrokeNote.nihssDetails) {
              note += ` - ${telestrokeNote.nihssDetails}`;
            }
            note += `\n`;

            note += `Imaging: `;
            if (telestrokeNote.imagingReviewed) {
              note += `I personally reviewed imaging\n`;
            } else {
              note += `\n`;
            }

            if (telestrokeNote.ctTime) {
              note += `Date/time Non-contrast Head CT reviewed: ${formatTime(telestrokeNote.ctTime)}\n`;
            }
            if (telestrokeNote.ctResults) {
              note += `Non-contrast Head CT Results: ${telestrokeNote.ctResults}\n`;
            }

            if (telestrokeNote.ctaDate && telestrokeNote.ctaTime) {
              note += `Date/time CTA reviewed: ${formatDate(telestrokeNote.ctaDate)} ${formatTime(telestrokeNote.ctaTime)}\n`;
            }
            if (telestrokeNote.ctaResults) {
              note += `CTA Results: ${telestrokeNote.ctaResults}\n`;
            }

            if (telestrokeNote.ekgResults) {
              note += `EKG - ${telestrokeNote.ekgResults}\n`;
            }

            note += `\nAssessment and Plan:\n`;
            note += `${telestrokeNote.diagnosis}\n`;

            if (telestrokeNote.tnkRecommended) {
              note += `After ensuring that there were no evident contraindications, TNK administration was recommended`;
              if (telestrokeNote.tnkAdminTime) {
                note += ` at ${formatTime(telestrokeNote.tnkAdminTime.split(' ')[0])}`;
              }
              note += `. `;

              if (telestrokeNote.tnkConsentDiscussed) {
                note += `Potential benefits, potential risks (including a potential risk of sx ICH of up to 4%), and alternatives to treatment were discussed with the patient, patient's wife, and OSH provider. Both the patient and his wife expressed agreement with the recommendation.\n`;
              }

              if (telestrokeNote.tnkAdminTime) {
                note += `TNK was administered at ${formatTime(telestrokeNote.tnkAdminTime)} after a brief time-out.\n`;
              }
            }

            note += `\nRecommendations:\n`;
            if (telestrokeNote.recommendationsText) {
              note += `${telestrokeNote.recommendationsText}\n`;
            }

            note += `\nClinician Name`;

            return note;
            */
          };

          // Time calculation functions
          const getDiscoveryDateTime = () => {
            if (!telestrokeNote.discoveryDate || !telestrokeNote.discoveryTime) return null;
            const [year, month, day] = telestrokeNote.discoveryDate.split('-').map(Number);
            const [hours, minutes] = telestrokeNote.discoveryTime.split(':').map(Number);
            if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
            return new Date(year, month - 1, day, hours, minutes);
          };

          const getReferenceTime = () => {
            if (telestrokeNote.lkwUnknown) {
              const discovery = getDiscoveryDateTime();
              if (!discovery) return null;
              return { time: discovery, label: 'Discovery' };
            }
            if (!lkwTime) return null;
            return { time: lkwTime, label: 'LKW' };
          };

          const calculateTimeFromLKW = () => {
            const reference = getReferenceTime();
            if (!reference) return null;
            const diffMs = currentTime - reference.time;
            const diffHrs = diffMs / (1000 * 60 * 60);
            const diffMins = (diffMs / (1000 * 60)) % 60;
            return {
              hours: Math.floor(diffHrs),
              minutes: Math.floor(diffMins),
              total: diffHrs,
              label: reference.label
            };
          };

          const getWindowStatus = (timeFromLKW) => {
            if (!timeFromLKW) return null;
            if (timeFromLKW.total <= 4.5) {
              // TNK eligible up to and including 4.5 hours
              if (timeFromLKW.total < 3) {
                return { color: 'green', message: 'Within TNK window (<3h)', urgent: false, eligible: 'tnk' };
              } else {
                return { color: 'yellow', message: 'Extended TNK window (3-4.5h)', urgent: false, eligible: 'tnk' };
              }
            } else if (timeFromLKW.total < 6) {
              return { color: 'orange', message: 'TNK window closed - EVT window (4.5-6h)', urgent: true, eligible: 'evt-early' };
            } else if (timeFromLKW.total < 24) {
              return { color: 'red', message: 'Late EVT window (6-24h - needs perfusion imaging)', urgent: true, eligible: 'evt-late' };
            } else {
              return { color: 'gray', message: 'Beyond standard treatment window', urgent: false, eligible: 'none' };
            }
          };

          const scrollToSection = (id) => {
            const target = document.getElementById(id);
            if (!target) return;
            const headerOffset = 24;
            const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            if (!target.hasAttribute('tabindex')) {
              target.setAttribute('tabindex', '-1');
            }
            target.focus({ preventScroll: true });
          };

          const getNextBestAction = () => {
            const timeFrom = calculateTimeFromLKW();
            const nihss = parseInt(telestrokeNote.nihss) || nihssScore || 0;
            const dx = (telestrokeNote.diagnosis || '').toLowerCase();
            const pathwayType = getPathwayForDiagnosis(telestrokeNote.diagnosis);

            // Build data context for pathway step checks
            const pathwayData = {
              telestrokeNote,
              lkwTime,
              nihssScore,
              nihssComplete: isNIHSSComplete(),
              aspectsScore,
              timeFromLKW: timeFrom,
              ichScore: typeof calculateICHScore === 'function' ? calculateICHScore(ichScoreItems) : 0
            };

            // Determine applicable steps: shared + type-specific
            const sharedSteps = CLINICAL_PATHWAY_STEPS.shared;
            const typeSteps = CLINICAL_PATHWAY_STEPS[pathwayType] || [];
            const allSteps = [...sharedSteps, ...typeSteps];

            // Filter out skipped steps and compute progress
            const activeSteps = allSteps.filter(step => !step.skip || !step.skip(pathwayData));
            const completedCount = activeSteps.filter(step => step.check(pathwayData)).length;
            const totalSteps = activeSteps.length;
            const percentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

            // Determine current phase label
            let phase = 'Assessment';
            if (pathwayType !== 'shared') {
              if (completedCount === totalSteps) {
                phase = 'Complete';
              } else if (completedCount > sharedSteps.filter(s => !s.skip || !s.skip(pathwayData)).length) {
                phase = pathwayType === 'ischemic' ? 'Ischemic Pathway' : pathwayType === 'ich' ? 'ICH Pathway' : pathwayType === 'sah' ? 'SAH Pathway' : pathwayType === 'cvt' ? 'CVT Pathway' : pathwayType === 'tia' ? 'TIA Pathway' : pathwayType === 'dissection' ? 'Dissection Pathway' : 'Workup';
              } else {
                phase = 'Initial Assessment';
              }
            }

            // Find the first incomplete step
            const nextStep = activeSteps.find(step => !step.check(pathwayData));

            // Build the action for the next incomplete step
            let action = null;
            if (nextStep) {
              const stepActions = {
                'patient-info': { title: 'Capture core details', detail: 'Enter age and presenting symptoms to drive recommendations.', cta: 'Go to Patient Info' },
                'lkw': { title: 'Set last known well', detail: 'Time from onset is required to determine treatment windows.', cta: 'Set LKW' },
                'nihss': { title: 'Enter NIHSS score', detail: 'Use quick entry or guided NIHSS to calculate severity.', cta: 'Enter NIHSS' },
                'vitals': { title: 'Add presenting BP', detail: 'BP drives TNK eligibility and safety checks.', cta: 'Enter BP' },
                'imaging': { title: 'Review imaging', detail: 'Document CT/CTA findings to determine treatment pathway.', cta: 'Add imaging' },
                'diagnosis': { title: 'Set diagnosis', detail: 'Establish working diagnosis to activate type-specific pathway.', cta: 'Set diagnosis' },
                'tnk-contraindications': { title: 'Review TNK contraindications', detail: 'Complete the contraindication checklist before recommending TNK.', cta: 'Review contraindications' },
                'tnk-decision': { title: 'TNK decision', detail: 'Patient is within TNK window. Confirm eligibility and document decision.', cta: 'Review treatment' },
                'evt-eval': { title: 'Evaluate for EVT', detail: 'Assess LVO, NIHSS, and imaging for thrombectomy candidacy.', cta: 'Evaluate EVT' },
                'tnk-admin': { title: 'Document TNK administration', detail: 'Capture administration time for DTN metrics.', cta: 'Add TNK time' },
                'transfer': { title: 'Arrange transfer', detail: 'Coordinate transfer to EVT-capable center for LVO.', cta: 'Transfer checklist' },
                'recommendations': { title: 'Finalize recommendations', detail: 'Complete the recommendation summary for handoff and documentation.', cta: 'Add recommendations' },
                'ich-bp': { title: 'ICH: Manage blood pressure', detail: 'Target SBP 130-150 within 2 hours (AHA/ASA 2022 ICH). Initiate nicardipine or labetalol.', cta: 'Manage BP' },
                'ich-reversal': { title: 'ICH: Anticoagulation reversal', detail: 'Patient may be on anticoagulation. Review and order reversal agents.', cta: 'Order reversal' },
                'ich-neurosurg': { title: 'ICH: Neurosurgery evaluation', detail: 'Document neurosurgery consultation for surgical candidacy assessment.', cta: 'Consult neurosurgery' },
                'sah-grade': { title: 'SAH: Grade severity', detail: 'Enter Hunt & Hess or WFNS grade for SAH prognostication.', cta: 'Grade SAH' },
                'sah-bp': { title: 'SAH: Manage blood pressure', detail: 'Target SBP <160 (pre-securing) or <140 (post-securing) per 2023 AHA/ASA SAH guidelines.', cta: 'Manage BP' },
                'sah-nimodipine': { title: 'SAH: Start nimodipine', detail: 'Nimodipine 60 mg q4h x 21 days for vasospasm prevention (Class I, LOE A).', cta: 'Order nimodipine' },
                'sah-neurosurg': { title: 'SAH: Neurosurgery consult', detail: 'Urgent neurosurgery consultation for aneurysm securing strategy.', cta: 'Consult neurosurgery' },
                'sah-aneurysm': { title: 'SAH: Aneurysm securing', detail: 'Document plan for aneurysm securing (clip vs coil) within 24 hours.', cta: 'Document plan' },
                'cvt-anticoag': { title: 'CVT: Start anticoagulation', detail: 'Initiate LMWH or UFH per 2024 AHA CVT guideline, even with hemorrhagic transformation.', cta: 'Start anticoag' },
                'cvt-icp': { title: 'CVT: ICP management', detail: 'Assess and manage elevated intracranial pressure. HOB elevation, acetazolamide if needed.', cta: 'Manage ICP' },
                'cvt-seizure': { title: 'CVT: Seizure management', detail: 'Assess seizure risk and initiate prophylaxis if supratentorial lesion.', cta: 'Manage seizures' },
                'cvt-heme': { title: 'CVT: Hematology consult', detail: 'Thrombophilia workup for young patients or unprovoked CVT.', cta: 'Consult hematology' },
                'alt-workup': { title: 'Alternative workup', detail: 'Document alternative diagnosis and appropriate workup.', cta: 'Document workup' },
                'disposition': { title: 'Determine disposition', detail: 'Set disposition plan for stroke mimic.', cta: 'Set disposition' }
              };
              const stepAction = stepActions[nextStep.id] || { title: nextStep.label, detail: 'Complete this step to advance the pathway.', cta: 'Go' };
              action = {
                ...stepAction,
                action: () => scrollToSection(nextStep.section),
                stepId: nextStep.id
              };
            }

            // Return enriched object with progress metadata
            return {
              ...action,
              progress: {
                completedCount,
                totalSteps,
                percentage,
                phase,
                steps: activeSteps.map(step => ({
                  id: step.id,
                  label: step.label,
                  completed: step.check(pathwayData)
                }))
              }
            };
          };

          // Get guideline recommendations matching current patient data
          const getContextualRecommendations = () => {
            const timeFrom = calculateTimeFromLKW();
            const data = {
              telestrokeNote,
              nihssScore,
              aspectsScore,
              timeFromLKW: timeFrom,
              ichScore: typeof calculateICHScore === 'function' ? calculateICHScore(ichScoreItems) : 0
            };
            return Object.values(GUIDELINE_RECOMMENDATIONS).filter(rec => {
              try { return rec.conditions(data); } catch { return false; }
            });
          };

          // NIHSS validation
          const isNIHSSComplete = () => {
            return nihssItems.every(item => patientData[item.id] !== undefined && patientData[item.id] !== '');
          };

          const getIncompleteNIHSSItems = () => {
            return nihssItems.filter(item => !patientData[item.id]).map(item => item.name);
          };

          const getNIHSSInterpretation = (score) => {
            if (score === 0) return { severity: 'No stroke symptoms', color: 'green', guidance: 'Consider stroke mimics and alternative diagnoses' };
            if (score <= 4) return { severity: 'Minor stroke', color: 'yellow', guidance: 'Consider EVT if large vessel occlusion present despite low NIHSS' };
            if (score <= 15) return { severity: 'Moderate stroke', color: 'orange', guidance: 'Candidate for both thrombolysis and EVT if eligible' };
            if (score <= 20) return { severity: 'Moderate-severe stroke', color: 'red', guidance: 'Aggressive intervention warranted - high benefit potential' };
            return { severity: 'Severe stroke', color: 'red', guidance: 'All treatment options should be considered - high mortality risk without intervention' };
          };

          const applyNihssAllNormal = () => {
            const newData = {};
            nihssItems.forEach((item) => {
              const normalOption = item.options.find((opt) => opt.includes('(0)')) || item.options[0];
              newData[item.id] = normalOption;
            });
            setPatientData(newData);
            const newScore = calculateNIHSS(newData);
            setNihssScore(newScore);
            setTelestrokeNote({ ...telestrokeNote, nihss: newScore.toString() });
          };

          // Treatment validation
          const validateTreatmentRecommendation = () => {
            const hasContraindications = strokeCodeForm.tnk && strokeCodeForm.tnk.length > 0;
            const tnkRecommended = strokeCodeForm.tnk_rec === 'Recommended';

            if (hasContraindications && tnkRecommended) {
              return {
                valid: false,
                message: `⚠️ WARNING: TNK recommended but ${strokeCodeForm.tnk.length} contraindication(s) selected`,
                severity: 'error'
              };
            }

            if (!hasContraindications && strokeCodeForm.tnk_rec === 'Not Recommended') {
              return {
                valid: true,
                message: 'ℹ️ No contraindications selected. Confirm rationale for not recommending TNK.',
                severity: 'warning'
              };
            }

            return { valid: true, message: null, severity: null };
          };

          // Search function
          // Helper function to check if evidence section matches filter
          const evidenceSectionMatches = (sectionTitle, documentTitles) => {
            if (!evidenceFilter) return true;
            const filter = evidenceFilter.toLowerCase();
            if (sectionTitle.toLowerCase().includes(filter)) return true;
            return documentTitles.some(title => title.toLowerCase().includes(filter));
          };

          const performSearch = (query) => {
            if (!query || query.length < 2) {
              setSearchResults([]);
              return;
            }

            const results = [];
            const lowerQuery = query.toLowerCase();

            // Search in trials
            Object.entries(trialsData).forEach(([category, data]) => {
              if (data.hasSubsections) {
                Object.entries(data.subsections).forEach(([subKey, subsection]) => {
                  subsection.trials.forEach(trial => {
                    if (trial.name.toLowerCase().includes(lowerQuery) ||
                        trial.description.toLowerCase().includes(lowerQuery) ||
                        trial.nct.toLowerCase().includes(lowerQuery)) {
                      results.push({
                        type: 'Clinical Trial',
                        category: category,
                        title: trial.name,
                        description: trial.description.substring(0, 100) + '...',
                        action: () => {
                          setTrialsCategory(category);
                          navigateTo('trials', { clearSearch: true });
                        }
                      });
                    }
                  });
                });
              }
            });

            // Search in management tools
            const searchableItems = [
              { name: 'NIHSS', keywords: ['nihss', 'stroke scale', 'neurological'], tab: 'encounter' },
              { name: 'ASPECTS', keywords: ['aspects', 'imaging', 'ct'], tab: 'encounter' },
              { name: 'TNK Eligibility', keywords: ['tnk', 'tenecteplase', 'thrombolysis', 'lytic'], tab: 'encounter' },
              { name: 'EVT Eligibility', keywords: ['evt', 'thrombectomy', 'mechanical', 'endovascular'], tab: 'encounter' },
              { name: 'ICH Management', keywords: ['ich', 'hemorrhage', 'bleeding', 'reversal'], tab: 'management', subTab: 'ich' },
              { name: 'GCS Score', keywords: ['gcs', 'glasgow', 'coma', 'consciousness'], tab: 'management', subTab: 'calculators' },
              { name: 'ICH Score', keywords: ['ich score', 'hemorrhage score', 'mortality'], tab: 'management', subTab: 'calculators' },
              { name: 'ABCD² Score', keywords: ['abcd', 'tia', 'transient'], tab: 'management', subTab: 'calculators' },
              { name: 'CHA₂DS₂-VASc', keywords: ['chads', 'afib', 'atrial fibrillation', 'anticoagulation'], tab: 'management', subTab: 'calculators' },
              { name: 'ROPE Score', keywords: ['rope', 'pfo', 'paradoxical'], tab: 'management', subTab: 'calculators' },
              { name: 'Modified Rankin Scale (mRS)', keywords: ['mrs', 'rankin', 'disability', 'outcome', 'functional status'], tab: 'management', subTab: 'calculators' },
              { name: 'Hunt and Hess Scale', keywords: ['hunt', 'hess', 'sah', 'subarachnoid', 'hemorrhage', 'grading'], tab: 'management', subTab: 'calculators' },
              { name: 'WFNS Scale', keywords: ['wfns', 'world federation', 'neurosurgical', 'sah', 'subarachnoid'], tab: 'management', subTab: 'calculators' },
              { name: 'HAS-BLED Score', keywords: ['hasbled', 'has-bled', 'bleeding', 'risk', 'anticoagulation'], tab: 'management', subTab: 'calculators' },
              { name: 'RCVS² Score', keywords: ['rcvs', 'rcvs2', 'vasoconstriction', 'thunderclap', 'headache'], tab: 'management', subTab: 'calculators' },
              { name: 'Blood Pressure Management', keywords: ['bp', 'blood pressure', 'labetalol', 'nicardipine'], tab: 'management', subTab: 'ischemic' }
            ];

            searchableItems.forEach(item => {
              if (item.name.toLowerCase().includes(lowerQuery) ||
                  item.keywords.some(k => k.includes(lowerQuery))) {
                results.push({
                  type: 'Tool/Protocol',
                  title: item.name,
                  description: `Go to ${item.name}`,
                  action: () => {
                    navigateTo(item.tab, { clearSearch: true, subTab: item.subTab });
                  }
                });
              }
            });

            // Search in Evidence documents
            const evidenceDocuments = [
              { title: 'DAPT Minor Stroke-TIA Trials', section: 'Antiplatelet Therapy', keywords: ['dapt', 'antiplatelet', 'tia', 'minor stroke'] },
              { title: 'DAPT After Ischemic Stroke-TIA', section: 'Antiplatelet Therapy', keywords: ['dapt', 'antiplatelet', 'duration', 'ischemic stroke', 'tia', 'sammpris', 'chance', 'point', 'thales', 'inspires', 'icad'] },
              { title: 'Timing of Anticoagulation after AF-Related Stroke', section: 'Risk Factors', keywords: ['anticoagulation', 'atrial fibrillation', 'afib', 'timing'] },
              { title: 'Atrial Fibrillation & Secondary Stroke Prevention', section: 'Risk Factors', keywords: ['afib', 'atrial fibrillation', 'prevention'] },
              { title: 'AFib Stroke EPI519', section: 'Risk Factors', keywords: ['afib', 'atrial fibrillation', 'epidemiology', 'stroke', 'epi', 'epi519'] },
              { title: 'Diabetes and stroke', section: 'Risk Factors', keywords: ['diabetes', 'risk factor', 'dm'] },
              { title: 'Lipids and Cerebrovascular Disease', section: 'Risk Factors', keywords: ['lipids', 'cholesterol', 'statins', 'ldl'] },
              { title: 'WAKE-UP Trial', section: 'Thrombolytic Therapy', keywords: ['wake-up', 'thrombolysis', 'tpa', 'alteplase', 'mri'] },
              { title: 'Thrombolytic Therapy 4.5-24h RCTs', section: 'Thrombolytic Therapy', keywords: ['thrombolysis', 'tpa', 'alteplase', 'rct', 'extended window', '4.5-24h'] },
              { title: 'Lacunar Stroke', section: 'Cerebral Small Vessel Disease', keywords: ['lacunar', 'small vessel', 'csvd'] },
              { title: 'Symptomatic Cervical Carotid Artery Stenosis', section: 'Large Artery Disease', keywords: ['carotid', 'stenosis', 'endarterectomy', 'cea', 'cas'] },
              { title: 'CREST-2 Trial', section: 'Large Artery Disease', keywords: ['crest', 'crest-2', 'carotid', 'stenting', 'endarterectomy', 'cea', 'cas', 'asymptomatic'] },
              { title: 'Differentiating Acute Confusional State (Delirium) from Aphasia', section: 'Exam', keywords: ['delirium', 'aphasia', 'confusion', 'exam'] },
              { title: 'Coma Exam', section: 'Exam', keywords: ['coma', 'exam', 'consciousness'] },
              { title: 'Large Core Anterior Circulation LVO EVT Trials', section: 'Endovascular Therapy', keywords: ['large core', 'lvo', 'thrombectomy', 'evt'] },
              { title: 'Basilar Artery Occlusion EVT Trials', section: 'Endovascular Therapy', keywords: ['basilar', 'posterior circulation', 'evt'] },
              { title: 'MeVO & Distal Vessel Occlusion EVT Trials', section: 'Endovascular Therapy', keywords: ['mevo', 'distal', 'medium vessel'] },
              { title: 'Unruptured Cerebral Aneurysms', section: 'Aneurysms & Vascular Malformations', keywords: ['aneurysm', 'unruptured', 'sah'] },
              { title: 'Interpretation of Clinical Trials', section: 'Critical Appraisal', keywords: ['ebm', 'clinical trials', 'evidence', 'statistics', 'critical appraisal'] },
              { title: 'CEBM Oxford Resources', section: 'Critical Appraisal', keywords: ['cebm', 'oxford', 'ebm', 'evidence-based medicine', 'critical appraisal', 'study designs', 'levels of evidence'] }
            ];

            evidenceDocuments.forEach(doc => {
              if (doc.title.toLowerCase().includes(lowerQuery) ||
                  doc.section.toLowerCase().includes(lowerQuery) ||
                  doc.keywords.some(k => k.toLowerCase().includes(lowerQuery))) {
                results.push({
                  type: 'Evidence',
                  title: doc.title,
                  description: `${doc.section} section`,
                  action: () => {
                    navigateTo('management', { clearSearch: true, subTab: 'references' });
                  }
                });
              }
            });

            setSearchResults(results.slice(0, 10)); // Limit to 10 results
          };

          const CLEAR_UNDO_WINDOW_MS = 30000;

          const buildCaseSnapshot = () => ({
            telestrokeNote: { ...telestrokeNote },
            strokeCodeForm: { ...strokeCodeForm },
            patientData: { ...patientData },
            lkwTime: lkwTime ? lkwTime.toISOString() : null,
            nihssScore,
            aspectsScore,
            mrsScore,
            gcsItems: { ...gcsItems },
            ichScoreItems: { ...ichScoreItems },
            abcd2Items: { ...abcd2Items },
            chads2vascItems: { ...chads2vascItems },
            ropeItems: { ...ropeItems },
            huntHessGrade,
            wfnsGrade,
            hasbledItems: { ...hasbledItems },
            rcvs2Items: { ...rcvs2Items },
            currentStep,
            completedSteps: Array.isArray(completedSteps) ? [...completedSteps] : [],
            aspectsRegionState: Array.isArray(aspectsRegionState)
              ? aspectsRegionState.map((item) => ({ ...item }))
              : [],
            pcAspectsRegions: Array.isArray(pcAspectsRegions)
              ? pcAspectsRegions.map((item) => ({ ...item }))
              : [],
            consultationType,
            currentPatientId
          });

          const restoreCaseSnapshot = (snapshot) => {
            if (!snapshot) return;
            const note = snapshot.telestrokeNote || getDefaultTelestrokeNote();
            setTelestrokeNote(note);
            setStrokeCodeForm(snapshot.strokeCodeForm || getDefaultStrokeCodeForm());
            setPatientData(snapshot.patientData || {});
            setLkwTime(snapshot.lkwTime ? new Date(snapshot.lkwTime) : null);
            setNihssScore(snapshot.nihssScore || 0);
            setAspectsScore(Number.isFinite(snapshot.aspectsScore) ? snapshot.aspectsScore : 10);
            setMrsScore(snapshot.mrsScore || '');
            setGcsItems(snapshot.gcsItems || { eye: 0, verbal: 0, motor: 0 });
            setIchScoreItems(snapshot.ichScoreItems || { gcs: '', age80: false, volume30: false, ivh: false, infratentorial: false });
            setAbcd2Items(snapshot.abcd2Items || { age60: false, bp: false, unilateralWeakness: false, speechDisturbance: false, duration: '', diabetes: false });
            setChads2vascItems(snapshot.chads2vascItems || { chf: false, hypertension: false, age75: false, diabetes: false, strokeTia: false, vascular: false, age65: false, female: false });
            setRopeItems(snapshot.ropeItems || { noHypertension: false, noDiabetes: false, noStrokeTia: false, nonsmoker: false, cortical: false, age: '' });
            setHuntHessGrade(snapshot.huntHessGrade || '');
            setWfnsGrade(snapshot.wfnsGrade || '');
            setHasbledItems(snapshot.hasbledItems || { hypertension: false, renalDisease: false, liverDisease: false, stroke: false, bleeding: false, labileINR: false, elderly: false, drugs: false, alcohol: false });
            setRcvs2Items(snapshot.rcvs2Items || { recurrentTCH: false, carotidInvolvement: false, vasoconstrictiveTrigger: false, female: false, sah: false });
            setCurrentStep(Number.isFinite(snapshot.currentStep) ? snapshot.currentStep : 0);
            setCompletedSteps(Array.isArray(snapshot.completedSteps) ? snapshot.completedSteps : []);
            setAspectsRegionState(Array.isArray(snapshot.aspectsRegionState) && snapshot.aspectsRegionState.length
              ? snapshot.aspectsRegionState
              : getDefaultAspectsRegionState());
            setPcAspectsRegions(Array.isArray(snapshot.pcAspectsRegions) && snapshot.pcAspectsRegions.length
              ? snapshot.pcAspectsRegions
              : getDefaultPcAspectsRegions());
            setConsultationType(snapshot.consultationType || settings.defaultConsultationType || 'videoTelestroke');
            setCurrentPatientId(snapshot.currentPatientId || null);
            decisionStateRef.current = {
              tnkRecommended: note.tnkRecommended,
              evtRecommended: note.evtRecommended,
              transferAccepted: note.transferAccepted,
              tnkContraindicationReviewed: note.tnkContraindicationReviewed,
              tnkConsentDiscussed: note.tnkConsentDiscussed,
              tnkAdminTime: note.tnkAdminTime
            };
          };

          const resetCaseState = () => {
            setPatientData({});
            setNihssScore(0);
            setAspectsScore(10);
            setLkwTime(null);
            setStrokeCodeForm(getDefaultStrokeCodeForm());
            setAspectsRegionState(getDefaultAspectsRegionState());
            setPcAspectsRegions(getDefaultPcAspectsRegions());
            setGcsItems({ eye: 0, verbal: 0, motor: 0 });
            setMrsScore('');
            setIchScoreItems({ gcs: '', age80: false, volume30: false, ivh: false, infratentorial: false });
            setAbcd2Items({ age60: false, bp: false, unilateralWeakness: false, speechDisturbance: false, duration: '', diabetes: false });
            setChads2vascItems({ chf: false, hypertension: false, age75: false, diabetes: false, strokeTia: false, vascular: false, age65: false, female: false });
            setRopeItems({ noHypertension: false, noDiabetes: false, noStrokeTia: false, nonsmoker: false, cortical: false, age: '' });
            setHuntHessGrade('');
            setWfnsGrade('');
            setHasbledItems({ hypertension: false, renalDisease: false, liverDisease: false, stroke: false, bleeding: false, labileINR: false, elderly: false, drugs: false, alcohol: false });
            setRcvs2Items({ recurrentTCH: false, carotidInvolvement: false, vasoconstrictiveTrigger: false, female: false, sah: false });
            setCurrentStep(0);
            setCompletedSteps([]);
            setConsultationType(settings.defaultConsultationType || 'videoTelestroke');
            setTelestrokeNote(getDefaultTelestrokeNote());

            const keysToRemove = ['patientData', 'nihssScore', 'aspectsScore', 'gcsItems', 'mrsScore', 'ichScoreItems',
                                  'abcd2Items', 'chads2vascItems', 'ropeItems', 'huntHessGrade', 'wfnsGrade',
                                  'hasbledItems', 'rcvs2Items', 'strokeCodeForm', 'lkwTime',
                                  'currentStep', 'completedSteps', 'aspectsRegionState', 'pcAspectsRegions',
                                  'telestrokeNote', 'consultationType'];
            keysToRemove.forEach((key) => removeKey(key));

            navigateTo('encounter');
            setSaveStatus('saved');
          };

          const clearCurrentCase = (options = {}) => {
            const { generateNewId = false } = options;
            if (!confirm('Start a new case? Current inputs will be cleared. You can undo for 30 seconds.')) {
              return;
            }
            const snapshot = buildCaseSnapshot();
            resetCaseState();
            if (generateNewId) {
              setCurrentPatientId(generatePatientId());
            }
            setShowPatientSwitcher(false);
            setClearUndo({ snapshot, expiresAt: Date.now() + CLEAR_UNDO_WINDOW_MS });
            if (clearUndoTimeoutRef.current) {
              clearTimeout(clearUndoTimeoutRef.current);
            }
            clearUndoTimeoutRef.current = setTimeout(() => {
              setClearUndo(null);
            }, CLEAR_UNDO_WINDOW_MS);
            showNotice('Case cleared. Undo available for 30 seconds.', 'info');
          };

          const handleUndoClearCase = () => {
            if (!clearUndo || !clearUndo.snapshot) return;
            restoreCaseSnapshot(clearUndo.snapshot);
            setClearUndo(null);
            if (clearUndoTimeoutRef.current) {
              clearTimeout(clearUndoTimeoutRef.current);
              clearUndoTimeoutRef.current = null;
            }
            showNotice('Case restored.', 'success');
          };

          // Reset all data - New Patient
          const resetAllData = () => {
            if (!confirm('Start new patient assessment? All current data will be cleared. This cannot be undone.')) {
              return;
            }
            resetCaseState();
          };

          const handleClearLocalData = () => {
            if (!confirm('This clears locally stored app data on this device.')) {
              return;
            }

            clearAllAppStorage();
            resetAppStateToDefaults({ resetDarkMode: true });
            navigateTo('encounter');
            showNotice('Local data cleared.', 'success');
          };

          const removeLegacyKeysAfterMigration = () => {
            LEGACY_KEYS.forEach((key) => {
              try {
                localStorage.removeItem(key);
              } catch (e) {
                console.warn('Failed to remove legacy key:', key, e);
              }
            });
            showNotice('Legacy keys removed.', 'success');
          };

          const importBackup = async (file) => {
            try {
              const data = await importJSON(file);
              const candidate = data.schemaVersion ? data : data.appData ? data.appData : null;
              if (!candidate) {
                showNotice('Backup import failed: invalid file.', 'error');
                return;
              }
              const merged = mergeAppData(getDefaultAppData(), candidate);
              const migrated = migrateAppData(merged);
              setAppData(migrated);
              showNotice('Backup imported.', 'success');
            } catch (e) {
              showNotice('Backup import failed.', 'error');
            }
          };

          // Workflow steps definition
          const workflowSteps = [
            { id: 'assessment', name: 'Initial Assessment', tab: 'workflow' },
            { id: 'nihss', name: 'NIHSS Score', tab: 'nihss' },
            { id: 'imaging', name: 'Imaging Review', tab: 'imaging' },
            { id: 'eligibility', name: 'Treatment Eligibility', tab: 'lytic' },
            { id: 'documentation', name: 'Documentation', tab: 'encounter' }
          ];

          // Save to local storage whenever state changes
          useEffect(() => {
            debouncedSave('activeTab', activeTab);
          }, [activeTab]);

          // Persist timer sidebar collapse state
          useEffect(() => {
            setKey('timerSidebarCollapsed', timerSidebarCollapsed, { skipLastUpdated: true });
          }, [timerSidebarCollapsed]);

          useEffect(() => {
            setKey('caseSummaryCollapsed', caseSummaryCollapsed, { skipLastUpdated: true });
          }, [caseSummaryCollapsed]);

          useEffect(() => {
            setKey('showAdvanced', showAdvanced, { skipLastUpdated: true });
          }, [showAdvanced]);


          useEffect(() => {
            if (!('serviceWorker' in navigator)) return;
            navigator.serviceWorker.register('service-worker.js').catch((err) => {
              console.warn('Service worker registration failed:', err);
            });
          }, []);


          useEffect(() => {
            decisionStateRef.current = {
              tnkRecommended: telestrokeNote.tnkRecommended,
              evtRecommended: telestrokeNote.evtRecommended,
              transferAccepted: telestrokeNote.transferAccepted,
              tnkContraindicationReviewed: telestrokeNote.tnkContraindicationReviewed,
              tnkConsentDiscussed: telestrokeNote.tnkConsentDiscussed,
              tnkAdminTime: telestrokeNote.tnkAdminTime
            };
          }, []);

          // Persist consultation type
          useEffect(() => {
            debouncedSave('consultationType', consultationType);
          }, [consultationType]);

          useEffect(() => {
            debouncedSave('patientData', patientData);
            const newScore = calculateNIHSS(patientData);
            if (newScore !== nihssScore) {
              setNihssScore(newScore);
            }
          }, [patientData]);

          useEffect(() => {
            debouncedSave('nihssScore', nihssScore);
          }, [nihssScore]);

          useEffect(() => {
            debouncedSave('aspectsScore', aspectsScore);
          }, [aspectsScore]);

          useEffect(() => {
            debouncedSave('gcsItems', gcsItems);
          }, [gcsItems]);

          useEffect(() => {
            debouncedSave('mrsScore', mrsScore);
          }, [mrsScore]);

          useEffect(() => {
            debouncedSave('ichScoreItems', ichScoreItems);
          }, [ichScoreItems]);

          useEffect(() => {
            debouncedSave('abcd2Items', abcd2Items);
          }, [abcd2Items]);

          useEffect(() => {
            debouncedSave('chads2vascItems', chads2vascItems);
          }, [chads2vascItems]);

          useEffect(() => {
            debouncedSave('ropeItems', ropeItems);
          }, [ropeItems]);

          useEffect(() => {
            debouncedSave('huntHessGrade', huntHessGrade);
          }, [huntHessGrade]);

          useEffect(() => {
            debouncedSave('wfnsGrade', wfnsGrade);
          }, [wfnsGrade]);

          useEffect(() => {
            debouncedSave('hasbledItems', hasbledItems);
          }, [hasbledItems]);

          useEffect(() => {
            debouncedSave('rcvs2Items', rcvs2Items);
          }, [rcvs2Items]);

          useEffect(() => {
            debouncedSave('strokeCodeForm', sanitizeStrokeCodeFormForStorage(strokeCodeForm));
          }, [strokeCodeForm, settings.allowFreeTextStorage]);

          useEffect(() => {
            debouncedSave('aspectsRegionState', aspectsRegionState);
          }, [aspectsRegionState]);

          useEffect(() => {
            debouncedSave('pcAspectsRegions', pcAspectsRegions);
          }, [pcAspectsRegions]);

          useEffect(() => {
            debouncedSave('telestrokeNote', sanitizeTelestrokeNoteForStorage(telestrokeNote));
          }, [telestrokeNote, settings.allowFreeTextStorage]);

          useEffect(() => {
            const prev = decisionStateRef.current;
            if (!prev.tnkRecommended && telestrokeNote.tnkRecommended) {
              addDecisionLogEntry('TNK recommended');
            }
            if (!prev.evtRecommended && telestrokeNote.evtRecommended) {
              addDecisionLogEntry('EVT recommended');
            }
            if (!prev.transferAccepted && telestrokeNote.transferAccepted) {
              addDecisionLogEntry('Transfer accepted');
            }
            if (!prev.tnkContraindicationReviewed && telestrokeNote.tnkContraindicationReviewed) {
              addDecisionLogEntry('TNK contraindications reviewed', telestrokeNote.tnkContraindicationReviewTime || '');
            }
            if (!prev.tnkConsentDiscussed && telestrokeNote.tnkConsentDiscussed) {
              addDecisionLogEntry('TNK consent discussed');
            }
            if (prev.tnkAdminTime !== telestrokeNote.tnkAdminTime && telestrokeNote.tnkAdminTime) {
              addDecisionLogEntry('TNK administered', telestrokeNote.tnkAdminTime);
            }
            decisionStateRef.current = {
              tnkRecommended: telestrokeNote.tnkRecommended,
              evtRecommended: telestrokeNote.evtRecommended,
              transferAccepted: telestrokeNote.transferAccepted,
              tnkContraindicationReviewed: telestrokeNote.tnkContraindicationReviewed,
              tnkConsentDiscussed: telestrokeNote.tnkConsentDiscussed,
              tnkAdminTime: telestrokeNote.tnkAdminTime
            };
          }, [
            telestrokeNote.tnkRecommended,
            telestrokeNote.evtRecommended,
            telestrokeNote.transferAccepted,
            telestrokeNote.tnkContraindicationReviewed,
            telestrokeNote.tnkConsentDiscussed,
            telestrokeNote.tnkAdminTime
          ]);

          // Auto-switch trial category when diagnosis category changes
          useEffect(() => {
            if (telestrokeNote.diagnosisCategory === 'ischemic' || telestrokeNote.diagnosisCategory === 'ich') {
              setTrialsCategory(telestrokeNote.diagnosisCategory);
            }
          }, [telestrokeNote.diagnosisCategory]);

          useEffect(() => {
            debouncedSave('telestrokeTemplate', editableTemplate);
          }, [editableTemplate]);

          useEffect(() => {
            if (lkwTime) {
              debouncedSave('lkwTime', lkwTime.toISOString());
            }
          }, [lkwTime]);

          useEffect(() => {
            debouncedSave('currentStep', currentStep);
          }, [currentStep]);

          useEffect(() => {
            debouncedSave('completedSteps', completedSteps);
          }, [completedSteps]);

          // Auto-populate Documentation form with Workflow data
          useEffect(() => {
            if (lkwTime) {
              const timeStr = lkwTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const dateStr = lkwTime.toLocaleDateString('en-US');
              // Use local date format to avoid timezone issues
              const localDateStr = `${lkwTime.getFullYear()}-${String(lkwTime.getMonth() + 1).padStart(2, '0')}-${String(lkwTime.getDate()).padStart(2, '0')}`;
              setStrokeCodeForm(prev => ({
                ...prev,
                lkw: timeStr,
                lkw_date: localDateStr
              }));
            }
          }, [lkwTime]);

          useEffect(() => {
            if (nihssScore !== null && nihssScore !== undefined) {
              setStrokeCodeForm(prev => ({
                ...prev,
                nihss: nihssScore.toString()
              }));
            }
          }, [nihssScore]);

          useEffect(() => {
            if (aspectsScore !== null && aspectsScore !== undefined) {
              setStrokeCodeForm(prev => ({
                ...prev,
                aspects: aspectsScore.toString()
              }));
            }
          }, [aspectsScore]);

          // Update current time every minute
          useEffect(() => {
            const timer = setInterval(() => setCurrentTime(new Date()), 60000);
            return () => clearInterval(timer);
          }, []);

          // ============================================================
          // THROMBOLYSIS WINDOW TIMER & AUDIBLE ALERTS
          // ============================================================

          // Web Audio API alert function
          const playAlertTone = (alertType) => {
            if (alertsMuted) return;

            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();

              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);

              // Different tones for different alert types
              const toneConfigs = {
                'warning-30': { freq: 440, duration: 0.3, repeat: 2 },   // A4 - two beeps for 30 min warning
                'warning-15': { freq: 523, duration: 0.3, repeat: 3 },   // C5 - three beeps for 15 min warning
                'window-closed': { freq: 659, duration: 0.5, repeat: 4 } // E5 - four beeps for window closed
              };

              const config = toneConfigs[alertType] || toneConfigs['warning-30'];

              // Play repeating tones
              let currentTime = audioContext.currentTime;
              for (let i = 0; i < config.repeat; i++) {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();

                osc.connect(gain);
                gain.connect(audioContext.destination);

                osc.frequency.setValueAtTime(config.freq, currentTime);
                osc.type = 'sine';

                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(0.3, currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0.3, currentTime + config.duration - 0.1);
                gain.gain.linearRampToValueAtTime(0, currentTime + config.duration);

                osc.start(currentTime);
                osc.stop(currentTime + config.duration);

                currentTime += config.duration + 0.15; // Gap between beeps
              }
            } catch (e) {
              console.log('Audio alert not supported:', e);
            }
          };

          // Toggle mute and persist to localStorage
          const toggleAlertMute = () => {
            const newMuted = !alertsMuted;
            setAlertsMuted(newMuted);
            setKey('thrombolysisAlertsMuted', newMuted, { skipLastUpdated: true });
          };

          // Second-level timer for elapsed time and alert checking
          // Only runs on encounter tab to prevent re-renders on other tabs
          useEffect(() => {
            if (!lkwTime || activeTab !== 'encounter') return;

            const checkAlertsAndUpdate = () => {
              const now = new Date();
              const diffMs = now - lkwTime;
              const diffMinutes = diffMs / (1000 * 60);
              const remainingMinutes = (4.5 * 60) - diffMinutes; // Minutes until 4.5h window closes

              setElapsedSeconds(Math.floor(diffMs / 1000));
              setCurrentTime(now);

              // Only check alerts if tab is visible and LKW is set
              if (document.hidden || !lkwTime) return;

              // Check for alert thresholds (within 30 seconds of the threshold)
              const alertThresholds = [
                { id: 'warning-30', minutesRemaining: 30, played: false },
                { id: 'warning-15', minutesRemaining: 15, played: false },
                { id: 'window-closed', minutesRemaining: 0, played: false }
              ];

              for (const threshold of alertThresholds) {
                // Check if we're within 30 seconds of this threshold
                const diff = Math.abs(remainingMinutes - threshold.minutesRemaining);
                if (diff < 0.5 && lastAlertPlayed !== threshold.id && remainingMinutes >= -1) {
                  // Play alert and flash
                  setLastAlertPlayed(threshold.id);
                  playAlertTone(threshold.id);
                  setAlertFlashing(true);

                  // Stop flashing after 10 seconds
                  setTimeout(() => setAlertFlashing(false), 10000);
                  break;
                }
              }
            };

            // Initial check
            checkAlertsAndUpdate();

            // Update every second for precise timing
            const timer = setInterval(checkAlertsAndUpdate, 1000);

            return () => clearInterval(timer);
          }, [lkwTime, alertsMuted, lastAlertPlayed, activeTab]);

          // Reset last alert when LKW changes
          useEffect(() => {
            setLastAlertPlayed(null);
            setAlertFlashing(false);
          }, [lkwTime]);

          // =================================================================
          // TRIAL ELIGIBILITY - Auto-update when form data changes
          // =================================================================
          useEffect(() => {
            const timeFromLKW = calculateTimeFromLKW();
            const hoursFromLKW = timeFromLKW ? timeFromLKW.total : null;

            const evaluationData = {
              telestrokeNote,
              strokeCodeForm,
              aspectsScore,
              nihssScore,
              mrsScore,
              hoursFromLKW,
              lkwTime
            };

            const results = evaluateAllTrials(evaluationData);
            setTrialEligibility(results);
          }, [telestrokeNote, strokeCodeForm, aspectsScore, nihssScore, mrsScore, lkwTime]);

          // Monitor scroll position for Part 6 (Treatment Decision) visibility

          // Monitor critical alerts
          useEffect(() => {
            const alerts = [];

            if (lkwTime) {
              const timeFromLKW = calculateTimeFromLKW();
              if (!timeFromLKW) return;

              const totalHours = timeFromLKW.total;
              const remainingToTNK = 4.5 - totalHours;
              const remainingToEVT = 6 - totalHours;

              // Alert if <30 min to TNK cutoff (4.5h)
              if (remainingToTNK > 0 && remainingToTNK <= 0.5) {
                const minsLeft = Math.floor(remainingToTNK * 60);
                alerts.push({
                  id: 'tnk-cutoff',
                  level: 'critical',
                  message: `⚠️ URGENT: Only ${minsLeft} minutes left for TNK window!`,
                  action: 'TNK must be given before 4.5h from LKW'
                });
              }

              // Alert if <30 min to early EVT cutoff (6h)
              if (remainingToEVT > 0 && remainingToEVT <= 0.5 && totalHours > 4.5) {
                const minsLeft = Math.floor(remainingToEVT * 60);
                alerts.push({
                  id: 'evt-cutoff',
                  level: 'critical',
                  message: `⚠️ URGENT: Only ${minsLeft} minutes left for early EVT window!`,
                  action: 'Consider EVT before 6h window requires perfusion imaging'
                });
              }
            }

            setCriticalAlerts(alerts);
          }, [currentTime, lkwTime]);

          // Perform search when query changes
          useEffect(() => {
            performSearch(searchQuery);
          }, [searchQuery]);

          // De-ID warning scan for free-text inputs
          useEffect(() => {
            if (!settings.deidMode) {
              setDeidWarnings({});
              return;
            }
            const fieldsToCheck = {
              'Chief complaint': telestrokeNote.chiefComplaint,
              'Symptoms': telestrokeNote.symptoms,
              'PMH': telestrokeNote.pmh,
              'Medications': telestrokeNote.medications,
              'CT results': telestrokeNote.ctResults,
              'CTA results': telestrokeNote.ctaResults,
              'EKG results': telestrokeNote.ekgResults,
              'Diagnosis': telestrokeNote.diagnosis,
              'Recommendations': telestrokeNote.recommendationsText,
              'Stroke code history': strokeCodeForm.hx,
              'Stroke code symptoms': strokeCodeForm.sx,
              'Stroke code deficits': strokeCodeForm.def,
              'Stroke code HCT': strokeCodeForm.hct,
              'Stroke code CTA': strokeCodeForm.cta,
              'Stroke code CTP': strokeCodeForm.ctp,
              'TNK rationale': strokeCodeForm.rec_reason
            };
            const nextWarnings = {};
            Object.entries(fieldsToCheck).forEach(([label, value]) => {
              const matches = getDeidWarnings(value);
              if (matches.length) {
                nextWarnings[label] = matches;
              }
            });
            setDeidWarnings(nextWarnings);
          }, [settings.deidMode, telestrokeNote, strokeCodeForm]);


          useEffect(() => {
            if (shiftBoards.length > 0) return;
            const boardId = generateId('board');
            updateAppData((prev) => ({
              ...prev,
              shiftBoards: [
                {
                  id: boardId,
                  name: 'Primary Board',
                  createdAt: toIsoString(),
                  updatedAt: toIsoString(),
                  archived: false,
                  patients: []
                }
              ],
              uiState: {
                ...prev.uiState,
                lastShiftBoardId: boardId
              }
            }));
          }, [shiftBoards.length]);

          useEffect(() => {
            if (clipboardPacks.find((pack) => pack.id === selectedPackId)) return;
            setSelectedPackId(clipboardPacks[0]?.id || 'telestroke-consult');
          }, [clipboardPacks, selectedPackId]);


          // Keep mobile bottom nav offset in sync so content isn't obscured
          useEffect(() => {
            const updateMobileNavOffset = () => {
              const nav = document.getElementById('mobile-bottom-nav');
              const actionBar = document.getElementById('action-bar');
              const height = nav ? nav.offsetHeight : 0;
              const actionHeight = actionBar ? actionBar.offsetHeight : 0;
              document.documentElement.style.setProperty('--mobile-nav-offset', `${height}px`);
              document.documentElement.style.setProperty('--mobile-action-offset', `${actionHeight}px`);
            };

            const scheduleUpdate = () => {
              window.requestAnimationFrame(updateMobileNavOffset);
            };

            scheduleUpdate();
            window.addEventListener('resize', scheduleUpdate);
            window.addEventListener('orientationchange', scheduleUpdate);

            return () => {
              window.removeEventListener('resize', scheduleUpdate);
              window.removeEventListener('orientationchange', scheduleUpdate);
            };
          }, []);

          useEffect(() => {
            const handleResize = () => {
              if (window.innerWidth >= 1024) {
                setCaseSummaryCollapsed(false);
              }
            };
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
          }, []);

          // Load optional local config (ignored if missing)
          useEffect(() => {
            let cancelled = false;
            const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
            const configUrl = isLocalhost ? 'config.local.json' : 'config.example.json';

            fetch(configUrl, { cache: 'no-store' })
              .then((response) => {
                if (response.status === 404) {
                  if (!cancelled) {
                    removeKey('ttlHoursOverride');
                    setTtlHours(DEFAULT_TTL_HOURS);
                    setConfigLoaded(true);
                  }
                  return null;
                }
                if (!response.ok) {
                  throw new Error('Config fetch failed');
                }
                return response.json();
              })
              .then((data) => {
                if (cancelled || !data) return;
                if (typeof data !== 'object' || Array.isArray(data)) {
                  throw new Error('Config format invalid');
                }
                const links = Array.isArray(data.institutionLinks) ? data.institutionLinks : [];
                const sanitizedLinks = links
                  .filter((link) => link && typeof link === 'object')
                  .map((link) => ({
                    label: String(link.label || '').trim(),
                    url: String(link.url || '').trim(),
                    note: String(link.note || '').trim()
                  }))
                  .filter((link) => link.url);
                const ttlOverride = typeof data.ttlHoursOverride === 'number' &&
                  Number.isFinite(data.ttlHoursOverride) &&
                  data.ttlHoursOverride > 0
                  ? data.ttlHoursOverride
                  : null;
                setAppConfig({ institutionLinks: sanitizedLinks, ttlHoursOverride: ttlOverride });
                if (ttlOverride) {
                  setTtlHours(ttlOverride);
                  setKey('ttlHoursOverride', ttlOverride, { skipLastUpdated: true });
                } else {
                  removeKey('ttlHoursOverride');
                }
                setConfigLoaded(true);
              })
              .catch((err) => {
                if (cancelled) return;
                console.warn('Config load failed:', err);
                removeKey('ttlHoursOverride');
                setTtlHours(DEFAULT_TTL_HOURS);
                setConfigLoaded(true);
              });

            return () => {
              cancelled = true;
            };
          }, []);

          // If storage expired on load, notify and reset visual state
          useEffect(() => {
            if (!storageExpired) return;
            resetAppStateToDefaults({ resetDarkMode: true });
            navigateTo('encounter');
            showNotice('Stored data expired and was cleared.', 'warning', { timeoutMs: 6000 });
          }, []);

          // Apply TTL override once config is loaded
          useEffect(() => {
            if (storageExpired || !configLoaded) return;
            if (ttlHours === DEFAULT_TTL_HOURS) return;
            const expired = applyStorageExpiration(ttlHours);
            if (expired) {
              setStorageExpired(true);
              resetAppStateToDefaults({ resetDarkMode: true });
              navigateTo('encounter');
              showNotice('Stored data expired and was cleared.', 'warning', { timeoutMs: 6000 });
            }
          }, [ttlHours, storageExpired, configLoaded]);

          // Initialize component, routing, and icons on mount
          useEffect(() => {
            lucide.createIcons();

            const resolveRoute = () => {
              if (storageExpired && !hasHandledExpiredRef.current) {
                hasHandledExpiredRef.current = true;
                setActiveTab('encounter');
                return;
              }
              const parsed = parseHashRoute(window.location.hash);
              if (parsed && VALID_TABS.includes(parsed.tab)) {
                setActiveTab(parsed.tab);
                if (parsed.tab === 'management') {
                  const resolvedSubTab = normalizeManagementSubTab(parsed.sub) ||
                    normalizeManagementSubTab(appData.uiState.lastManagementSubTab) ||
                    'ich';
                  setManagementSubTab(resolvedSubTab);
                }
                return;
              }
              const savedTab = appData.uiState.lastActiveTab || getKey('activeTab', null);
              if (savedTab) {
                if (LEGACY_MANAGEMENT_TABS[savedTab]) {
                  setActiveTab('management');
                  setManagementSubTab(LEGACY_MANAGEMENT_TABS[savedTab]);
                  return;
                }
                if (savedTab === 'management') {
                  setActiveTab('management');
                  setManagementSubTab(normalizeManagementSubTab(appData.uiState.lastManagementSubTab) || 'ich');
                  return;
                }
                if (VALID_TABS.includes(savedTab)) {
                  setActiveTab(savedTab);
                  return;
                }
              }
              setActiveTab('encounter');
            };

            resolveRoute();
            setRouteReady(true);

            requestAnimationFrame(() => {
              setIsMounted(true);
              lucide.createIcons();
            });

            window.addEventListener('hashchange', resolveRoute);
            return () => window.removeEventListener('hashchange', resolveRoute);
          }, []);

          // Keep hash in sync with the active view
          useEffect(() => {
            if (!routeReady) return;
            const nextHash = buildHashRoute(activeTab, managementSubTab);
            if (window.location.hash !== nextHash) {
              window.location.hash = nextHash;
            }
          }, [activeTab, routeReady, managementSubTab]);

          useEffect(() => {
            setActionsOpen(false);
          }, [activeTab]);

          useEffect(() => {
            if (activeTab !== 'management') return;
            updateAppData((prev) => ({
              ...prev,
              uiState: {
                ...prev.uiState,
                lastManagementSubTab: managementSubTab
              }
            }));
          }, [activeTab, managementSubTab]);

          // Reinitialize icons when needed
          useEffect(() => {
            if (isMounted) {
              lucide.createIcons();
            }
          }, [activeTab, copiedText, darkMode, notice, searchOpen, actionsOpen, isMounted]);

          // Documentation generation functions
          const generateHPI = () => {
            const timeFromLKW = calculateTimeFromLKW();
            const timeElapsed = timeFromLKW ? `${timeFromLKW.hours}h ${timeFromLKW.minutes}m` : 'unknown';
            const lkw = lkwTime ? lkwTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '__';
            const lkwDate = lkwTime ? lkwTime.toLocaleDateString('en-US') : '__';
            const sexDisplay = telestrokeNote.sex === 'M' ? 'male' : telestrokeNote.sex === 'F' ? 'female' : '__';
            const nihssDisplay = telestrokeNote.nihss || nihssScore || '__';

            return `HPI: ${telestrokeNote.age || '__'} year old ${sexDisplay} with PMH of ${telestrokeNote.pmh || '__'} presenting with ${telestrokeNote.symptoms || '__'} starting at ${lkw} on ${lkwDate} (${timeElapsed} ago). NIHSS ${nihssDisplay}.

IMAGING:
- Head CT: ${telestrokeNote.ctResults || 'pending'}
- CTA Head/Neck: ${telestrokeNote.ctaResults || 'pending'}
- CTP: ${telestrokeNote.ctpResults || 'pending'}
- ASPECTS: ${aspectsScore || '__'}

ASSESSMENT: ${telestrokeNote.diagnosis || 'Acute ischemic stroke'}, NIHSS ${nihssDisplay}
${telestrokeNote.tnkRecommended ? `\nTNK: Recommended` : '\nTNK: Not Recommended'}
${telestrokeNote.evtRecommended ? `EVT: Recommended` : 'EVT: Not Recommended'}`;
          };

          const generateAdmissionOrders = () => {
            const nihssDisplay = telestrokeNote.nihss || nihssScore || '__';

            return `ACUTE STROKE ADMISSION ORDERS:

1. Admit to Stroke Unit / Neuro ICU
2. Vital signs q1h x 24h, then q4h
3. Continuous telemetry monitoring
4. NPO until swallow evaluation completed
5. IV fluids: NS at 75 mL/hr
6. Maintain SBP <180/105 (or <185/110 if post-tPA)
7. Blood glucose 140-180 mg/dL
8. HOB elevated 30 degrees
9. DVT prophylaxis: SCDs (hold pharmacologic if tPA given)
10. Aspirin 325mg daily (hold x 24h if tPA given)
11. Statin therapy: Atorvastatin 80mg daily
12. Neurology consultation
13. PT/OT/Speech evaluation
14. Fall precautions

LABS:
- CBC, CMP, PT/INR, PTT
- Lipid panel, HbA1c
- Troponin, BNP
- Consider: ESR, CRP if indicated

IMAGING:
- MRI brain with DWI if not already done
- Carotid ultrasound
- Echocardiogram (TTE or TEE)

NIHSS: ${nihssDisplay} - reassess q4h x 24h, then daily`;
          };

          // Keyboard shortcuts
          React.useEffect(() => {
            const handleKeyDown = (e) => {
              // Ignore if user is typing in an input/textarea
              if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
              }

              // Cmd/Ctrl + K: Open search
              if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
                setSearchContext('header');
                document.querySelector('input[placeholder*="Search"]')?.focus();
              }

              // "/" key: Focus search
              if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                setSearchOpen(true);
                setSearchContext('header');
                document.querySelector('input[placeholder*="Search"]')?.focus();
              }

              // Escape: Close search/modals
              if (e.key === 'Escape') {
                setSearchOpen(false);
              }

              // Number keys for tab navigation
              const tabMap = {
                '1': { tab: 'encounter' },
                '2': { tab: 'management', subTab: 'ischemic' },
                '3': { tab: 'management', subTab: 'calculators' }
              };

              if (tabMap[e.key] && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                const target = tabMap[e.key];
                navigateTo(target.tab, { subTab: target.subTab });
              }

              // Ctrl/Cmd + E: Export to PDF
              if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                exportToPDF();
              }

              // Ctrl/Cmd + D: Toggle dark mode
              if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                toggleDarkMode();
              }

              // ? key: Show keyboard shortcuts help
              if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                setShowKeyboardHelp(prev => !prev);
              }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
          }, []);

          const topLinks = [
            { label: 'Regional Hospitals', url: 'https://rkalani1.github.io/telestroke-expansion-map/' },
            { label: 'Stroke Clinic Pre-Visit Questionnaire', url: 'https://rkalani1.github.io/stroke-clinic-q/' }
          ];
          const encounterQuickLinks = [
            { label: 'Pulsara', url: 'https://us-app.pulsara.com/user/login' },
            { label: 'Teladoc Imaging', url: 'https://urldefense.com/v3/__https:/imaging.visitnow.org/studies__;!!K-Hz7m0Vt54!nECcOahuNh21d0jzlVH-mSie_Il2fvDWCKseicWktKKQwdj4xk9XfAX2s8QyVGAs0n-NvzXDLAHKDw%24' },
            { label: 'Telestroke Provider Resources', url: 'https://intranet.neurology.uw.edu/telestroke-provider-resources/' },
            { label: 'UW Medicine', url: 'https://access.uwmedicine.org/logon/LogonPoint/tmindex.html' }
          ];
          const userQuickLinks = Array.isArray(settings.quickLinks) ? settings.quickLinks : [];
          const quickLinks = [...encounterQuickLinks, ...userQuickLinks, ...appConfig.institutionLinks].reduce((acc, link) => {
            if (!link || !link.url) return acc;
            const normalizedUrl = String(link.url).trim();
            if (!normalizedUrl || acc.seen.has(normalizedUrl)) return acc;
            acc.seen.add(normalizedUrl);
            acc.items.push({
              label: String(link.label || 'Resource').trim() || 'Resource',
              url: normalizedUrl,
              note: link.note ? String(link.note).trim() : ''
            });
            return acc;
          }, { items: [], seen: new Set() }).items;
          const ttlDisplayHours = appConfig.ttlHoursOverride || DEFAULT_TTL_HOURS;
          const showDocumentActions = true;
          const showEncounterActions = activeTab === 'encounter';
          const todayDate = new Date().toISOString().slice(0, 10);
          const hasLegacyKeys = LEGACY_KEYS.some((key) => {
            try {
              return localStorage.getItem(key) !== null;
            } catch {
              return false;
            }
          });
          const mobilePrimaryTabs = [
            { id: 'encounter', name: 'Encounter', icon: 'activity' },
            { id: 'management', name: 'Manage', icon: 'layers' },
            { id: 'trials', name: 'Trials', icon: 'file-text' }
          ];
          const mobileMoreTabs = [];
          const quickContacts = Array.isArray(settings.contacts) && settings.contacts.length
            ? settings.contacts
            : DEFAULT_CONTACTS;
          const toolShortcuts = [
            { id: 'patient-info-section', label: 'Patient Info' },
            { id: 'lkw-section', label: 'LKW / Discovery' },
            { id: 'nihss-section', label: 'NIHSS' },
            { id: 'vitals-section', label: 'Vitals' },
            { id: 'treatment-decision', label: 'Treatment' },
            { id: 'time-metrics-section', label: 'DTN / DTP' },
            { id: 'sah-management-section', label: 'SAH Mgmt' },
            { id: 'cvt-management-section', label: 'CVT Mgmt' },
            { id: 'discharge-checklist-section', label: 'Discharge' },
            { id: 'recommendations-section', label: 'Recommendations' },
            { id: 'handoff-section', label: 'Handoff' },
            { id: 'safety-section', label: 'Safety' },
          ];
          const roleOptions = [
            { value: 'consult', label: 'Consult' },
            { value: 'attending', label: 'Attending' },
            { value: 'ed', label: 'ED' },
            { value: 'icu', label: 'ICU' },
            { value: 'transfer', label: 'Transfer' }
          ];
          const rolePresets = {
            consult: { consultationType: 'videoTelestroke', showAdvanced: true },
            attending: { consultationType: 'videoTelestroke', showAdvanced: true },
            ed: { consultationType: 'telephone', showAdvanced: false },
            icu: { consultationType: 'telephone', showAdvanced: true },
            transfer: { consultationType: 'videoTelestroke', showAdvanced: true }
          };
          const timeFromLKW = calculateTimeFromLKW();
          const safetyChecks = getSafetyChecks();
          const safetyChecksCompleted = safetyChecks.filter((item) => item.complete).length;
          const windowStatus = telestrokeNote.lkwUnknown
            ? { color: 'gray', message: timeFromLKW ? 'Discovery-based timing' : 'LKW unknown' }
            : getWindowStatus(timeFromLKW) || { color: 'gray', message: 'Set LKW time' };
          const windowToneClass = {
            green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            yellow: 'bg-amber-100 text-amber-800 border-amber-200',
            orange: 'bg-orange-100 text-orange-800 border-orange-200',
            red: 'bg-red-100 text-red-800 border-red-200',
            gray: 'bg-slate-100 text-slate-700 border-slate-200'
          }[windowStatus.color] || 'bg-slate-100 text-slate-700 border-slate-200';
          const onsetLabel = timeFromLKW?.label || (telestrokeNote.lkwUnknown ? 'Discovery' : 'LKW');
          const lkwDisplay = telestrokeNote.lkwUnknown
            ? (timeFromLKW ? `${telestrokeNote.discoveryDate || ''} ${telestrokeNote.discoveryTime || ''}`.trim() || 'Unknown' : 'Unknown')
            : lkwTime
              ? lkwTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Not set';
          const lkwElapsed = timeFromLKW ? `${timeFromLKW.hours}h ${timeFromLKW.minutes}m` : null;
          const ageDisplay = telestrokeNote.age !== undefined && String(telestrokeNote.age).trim() !== ''
            ? String(telestrokeNote.age).trim()
            : '--';
          const weightDisplay = telestrokeNote.weight !== undefined && String(telestrokeNote.weight).trim() !== ''
            ? `${String(telestrokeNote.weight).trim()} kg`
            : '--';
          const nihssFromNote = telestrokeNote.nihss !== undefined && String(telestrokeNote.nihss).trim() !== ''
            ? String(telestrokeNote.nihss).trim()
            : '';
          const hasNihssInputs = nihssItems.some((item) => patientData[item.id] !== undefined && patientData[item.id] !== '');
          const nihssDisplay = nihssFromNote || (hasNihssInputs ? String(nihssScore) : '--');

          return (
            <div className="relative">
              <div className="app-shell max-w-7xl mx-auto p-4 sm:p-8 overflow-x-hidden" role="main">
              {/* Skip Navigation Link for Screen Readers */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
              >
                Skip to main content
              </a>

              {/* Header */}
              <div className="mb-4 sm:mb-6 app-header" role="banner">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1 text-center sm:text-left">
                      Stroke
                    </h1>
                    {topLinks.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        {topLinks.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            <i data-lucide="external-link" className="w-4 h-4"></i>
                            <span>{link.label}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:items-end sm:justify-end">
                    <div className="relative w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Search trials, management tools, references..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSearchOpen(true);
                          setSearchContext('header');
                        }}
                        onFocus={() => {
                          setSearchOpen(true);
                          setSearchContext('header');
                        }}
                        onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                        className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 md:w-64"
                        aria-label="Search trials, management tools, and references"
                      />
                      <i data-lucide="search" className="w-4 h-4 absolute left-2 top-3 text-gray-400"></i>

                      {searchOpen && searchContext === 'header' && searchResults.length > 0 && (
                        <div className="absolute top-12 left-0 right-0 sm:right-auto sm:w-96 bg-white shadow-lg rounded-lg border max-h-96 overflow-y-auto z-50">
                          {Object.entries(searchResults.reduce((acc, result) => {
                            const key = result.type || 'Results';
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(result);
                            return acc;
                          }, {})).map(([group, items]) => (
                            <div key={group}>
                              <div className="px-3 py-1 text-[11px] uppercase tracking-wider text-gray-500 bg-gray-50 border-b">
                                {group}
                              </div>
                              {items.map((result, index) => (
                                <button
                                  key={`${group}-${index}`}
                                  onClick={result.action}
                                  className="w-full text-left p-3 hover:bg-blue-50 border-b transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm">{result.title}</p>
                                      {result.description && (
                                        <p className="text-xs text-gray-600 mt-1">{result.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className={saveStatus === 'saving' ? 'text-amber-600' : 'text-emerald-600'}>
                        {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
                      </span>
                      {lastSaved && (
                        <span>
                          {new Date(lastSaved).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
                      <button
                        onClick={startNewPatient}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        aria-label="Start new case"
                        title="Start a new case (clears current inputs)"
                      >
                        <i data-lucide="user-plus" className="w-4 h-4"></i>
                        <span className="hidden lg:inline">Start Case</span>
                      </button>

                      <div className="hidden sm:flex items-center gap-2">
                        {showDocumentActions && (
                          <>
                            <button
                              onClick={exportToPDF}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              aria-label="Export to PDF"
                              title="Export current view to PDF"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button
                              onClick={handleShare}
                              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                              aria-label="Share this page"
                              title="Share this page"
                            >
                              <i data-lucide="share-2" className="w-4 h-4"></i>
                              <span className="hidden sm:inline">Share</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={toggleDarkMode}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                          <i data-lucide={darkMode ? "sun" : "moon"} className="w-5 h-5"></i>
                        </button>
                      </div>

                      <button
                        onClick={handleClearLocalData}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        aria-label="Clear local data"
                        title="Clear locally stored app data"
                      >
                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                        <span>Clear local data</span>
                      </button>

                      <button
                        onClick={() => setActionsOpen((prev) => !prev)}
                        className="sm:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                        aria-expanded={actionsOpen}
                        aria-label="Toggle actions menu"
                      >
                        <i data-lucide="more-horizontal" className="w-4 h-4"></i>
                        <span>Actions</span>
                      </button>
                    </div>

                    {actionsOpen && (
                      <div className="sm:hidden w-full grid grid-cols-2 gap-2">
                        {showDocumentActions && (
                          <button
                            onClick={() => {
                              exportToPDF();
                              setActionsOpen(false);
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                            aria-label="Export to PDF"
                          >
                            <i data-lucide="download" className="w-4 h-4"></i>
                            <span>PDF</span>
                          </button>
                        )}
                        {showDocumentActions && (
                          <button
                            onClick={() => {
                              handleShare();
                              setActionsOpen(false);
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                            aria-label="Share this page"
                          >
                            <i data-lucide="share-2" className="w-4 h-4"></i>
                            <span>Share</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            toggleDarkMode();
                            setActionsOpen(false);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                          <i data-lucide={darkMode ? "sun" : "moon"} className="w-4 h-4"></i>
                          <span>{darkMode ? "Light" : "Dark"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {notice && (
                  <div className={`mt-2 p-3 rounded-lg border text-sm flex items-center gap-2 ${
                    notice.type === 'success'
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : notice.type === 'warning'
                      ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                      : notice.type === 'error'
                      ? 'bg-red-100 border-red-400 text-red-700'
                      : 'bg-blue-100 border-blue-400 text-blue-700'
                  }`}>
                    <i
                      data-lucide={
                        notice.type === 'success'
                          ? 'check-circle'
                          : notice.type === 'warning'
                          ? 'alert-triangle'
                          : notice.type === 'error'
                          ? 'x-circle'
                          : 'info'
                      }
                      className="w-4 h-4"
                    ></i>
                    <span>{notice.message}</span>
                  </div>
                )}

                {clearUndo && (
                  <div className="mt-2 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <i data-lucide="rotate-ccw" className="w-4 h-4"></i>
                      <span>Case cleared. Undo available for 30 seconds.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUndoClearCase}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                    >
                      Undo
                    </button>
                  </div>
                )}

                {/* Success Notification */}
                {copiedText && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm flex items-center gap-2">
                    <i data-lucide="check" className="w-4 h-4"></i>
                    <span>{copiedText} copied to clipboard!</span>
                  </div>
                )}

                {Object.keys(deidWarnings).length > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
                    <div className="flex items-center gap-2 font-semibold">
                      <i data-lucide="alert-triangle" className="w-4 h-4"></i>
                      <span>Possible identifiers detected</span>
                    </div>
                    <div className="mt-1">
                      {Object.entries(deidWarnings).slice(0, 4).map(([field, matches]) => (
                        <div key={field}>{field}: {matches.join(', ')}</div>
                      ))}
                      {Object.keys(deidWarnings).length > 4 && (
                        <div>More fields flagged...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Case Summary */}
              <div className="sticky top-2 z-40 mb-4 no-print">
                <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-sm px-3 py-3 dark:bg-slate-900/90 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3 lg:hidden mb-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Case Summary</p>
                    <button
                      onClick={() => setCaseSummaryCollapsed((prev) => !prev)}
                      className="text-xs font-semibold text-blue-700 dark:text-blue-300"
                      aria-expanded={!caseSummaryCollapsed}
                      aria-label={caseSummaryCollapsed ? 'Expand case summary' : 'Collapse case summary'}
                    >
                      {caseSummaryCollapsed ? 'Expand' : 'Collapse'}
                    </button>
                  </div>
                  {caseSummaryCollapsed ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">NIHSS</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{nihssDisplay}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">LKW</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lkwDisplay}</p>
                        {lkwElapsed && (
                          <p className="text-xs text-slate-500 dark:text-slate-300">({lkwElapsed} from {onsetLabel})</p>
                        )}
                      </div>
                      <div className={`rounded-lg border px-3 py-2 ${windowToneClass}`}>
                        <p className="text-[11px] uppercase tracking-wide opacity-70">Window</p>
                        <p className="text-sm font-semibold">{windowStatus.message}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Age</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ageDisplay}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Weight</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{weightDisplay}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">NIHSS</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{nihssDisplay}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">LKW</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lkwDisplay}</p>
                        {lkwElapsed && (
                          <p className="text-xs text-slate-500 dark:text-slate-300">({lkwElapsed} from {onsetLabel})</p>
                        )}
                      </div>
                      <div className={`rounded-lg border px-3 py-2 ${windowToneClass}`}>
                        <p className="text-[11px] uppercase tracking-wide opacity-70">Window</p>
                        <p className="text-sm font-semibold">{windowStatus.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Keyboard Shortcuts Help Modal */}
              {showKeyboardHelp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowKeyboardHelp(false)}>
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                      <button
                        onClick={() => setShowKeyboardHelp(false)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Close keyboard shortcuts"
                      >
                        <i data-lucide="x" className="w-6 h-6"></i>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 mb-2">Navigation</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Encounter Tab</span>
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">1</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Management (Ischemic) Tab</span>
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">2</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Management (Calculators) Tab</span>
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">3</kbd>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 mb-2">Actions</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Open Search</span>
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">⌘K / Ctrl+K</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Export to PDF</span>
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">⌘E / Ctrl+E</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Toggle Dark Mode</span>
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">⌘D / Ctrl+D</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Close Modals</span>
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">Esc</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Show This Help</span>
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">?</kbd>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setShowKeyboardHelp(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* Critical Alerts Banner */}
              {criticalAlerts.length > 0 && (
                <div className="mb-4 space-y-2" role="alert" aria-live="assertive" aria-atomic="true">
                  {criticalAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
                        alert.level === 'critical'
                          ? 'bg-red-50 border-red-500 animate-pulse'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <i
                        data-lucide="alert-triangle"
                        className={`w-6 h-6 flex-shrink-0 ${
                          alert.level === 'critical' ? 'text-red-600' : 'text-yellow-600'
                        }`}
                      ></i>
                      <div className="flex-1">
                        <p className={`font-bold text-lg ${
                          alert.level === 'critical' ? 'text-red-900' : 'text-yellow-900'
                        }`}>
                          {alert.message}
                        </p>
                        <p className={`text-sm mt-1 ${
                          alert.level === 'critical' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {alert.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Tabs - Desktop Only - 3 Tabs */}
              <div className="mb-4 sm:mb-6 hidden md:block app-nav" role="navigation" aria-label="Main navigation">
                <nav className="flex flex-wrap justify-center gap-2 md:justify-around md:gap-0" role="tablist">
                  {[
                    { id: 'encounter', name: '⚡ Encounter', icon: 'activity' },
                    { id: 'management', name: 'Management', icon: 'layers' },
                    { id: 'trials', name: 'Trials', icon: 'file-text' }
                  ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          navigateTo(tab.id);
                        }}
                        className={`tab-pill py-2 px-4 text-sm flex items-center space-x-2 transition-all ${isActive ? 'active' : 'inactive'}`}
                        role="tab"
                        aria-selected={isActive}
                      >
                        <i data-lucide={tab.icon} className="w-4 h-4"></i>
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Content */}
              <div id="main-content" className="space-y-6 sm:space-y-8 mobile-nav-padding" role="region" aria-label="Main content area">

                {/* CONSOLIDATED ENCOUNTER TAB */}
                {activeTab === 'encounter' && (
                  <div key="encounter-tab" className="space-y-4">
                    {/* Consultation Type Selector */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block font-semibold text-slate-700 text-sm uppercase tracking-wide">
                          Consultation Type
                        </label>
                        <button
                          onClick={() => setShowAdvanced((prev) => !prev)}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                            showAdvanced
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}
                          type="button"
                          aria-pressed={showAdvanced}
                          title={showAdvanced ? 'Hide advanced sections' : 'Show advanced sections'}
                        >
                          {showAdvanced ? 'Advanced On' : 'Advanced Off'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setConsultationType('telephone')}
                          className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all ${
                            consultationType === 'telephone'
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-amber-50 hover:border-amber-300'
                          }`}
                        >
                          <i data-lucide="phone" className="w-4 h-4 inline mr-2"></i>
                          Telephone
                        </button>
                        <button
                          onClick={() => setConsultationType('videoTelestroke')}
                          className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all ${
                            consultationType === 'videoTelestroke'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          <i data-lucide="video" className="w-4 h-4 inline mr-2"></i>
                          Video Telestroke
                        </button>
                      </div>
                    </div>

                    {quickLinks.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Quick Links</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                          {quickLinks.map((link, index) => (
                            <a
                              key={`${link.label}-${index}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 font-medium"
                            >
                              <i data-lucide="external-link" className="w-5 h-5"></i>
                              <div className="flex flex-col">
                                <span>{link.label}</span>
                                {link.note && (
                                  <span className="text-xs text-blue-700">{link.note}</span>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Calling Site Dropdown - Show for Video Telestroke */}
                    {consultationType === 'videoTelestroke' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-blue-900 mb-1">
                        <i data-lucide="map-pin" className="w-4 h-4 inline mr-1"></i>
                        Calling Site
                      </label>
                      <select
                        value={telestrokeNote.callingSite}
                        onChange={(e) => setTelestrokeNote({...telestrokeNote, callingSite: e.target.value, callingSiteOther: e.target.value === 'Other' ? telestrokeNote.callingSiteOther : ''})}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Site --</option>
                        <optgroup label="UW Sites">
                          <option value="UWM Northwest">UWM Northwest</option>
                        </optgroup>
                        <optgroup label="Video Partner Sites">
                          <option value="Astria Sunnyside">Astria Sunnyside</option>
                          <option value="Cascade Medical – Leavenworth">Cascade Medical – Leavenworth</option>
                          <option value="Columbia Basin-Ephrata">Columbia Basin-Ephrata</option>
                          <option value="Confluence Health – Wenatchee">Confluence Health – Wenatchee</option>
                          <option value="Island Health – Anacortes">Island Health – Anacortes</option>
                          <option value="Lourdes Health – Pasco">Lourdes Health – Pasco</option>
                          <option value="Mason General Hospital – Shelton">Mason General Hospital – Shelton</option>
                          <option value="Snoqualmie Valley – Snoqualmie">Snoqualmie Valley – Snoqualmie</option>
                          <option value="St. Joseph Regional Medical Center – Lewiston, Idaho">St. Joseph Regional Medical Center – Lewiston, Idaho</option>
                        </optgroup>
                        <optgroup label="PeaceHealth Sites">
                          <option value="PeaceHealth Island - Friday Harbor">PeaceHealth Island - Friday Harbor</option>
                          <option value="PeaceHealth Ketchikan Medical Center – Ketchikan, Alaska">PeaceHealth Ketchikan Medical Center – Ketchikan, Alaska</option>
                          <option value="PeaceHealth St. Joseph Medical Center – Bellingham">PeaceHealth St. Joseph Medical Center – Bellingham</option>
                          <option value="PeaceHealth United General Medical Center – Sedro Woolley">PeaceHealth United General Medical Center – Sedro Woolley</option>
                        </optgroup>
                        <optgroup label="Alaska Sites">
                          <option value="Petersburg, AK">Petersburg, AK</option>
                        </optgroup>
                        <optgroup label="Tri-Cities">
                          <option value="Trios Health – Kennewick">Trios Health – Kennewick</option>
                        </optgroup>
                        <option value="Other">Other (specify below)</option>
                      </select>
                      {telestrokeNote.callingSite === 'Other' && (
                        <input
                          type="text"
                          value={telestrokeNote.callingSiteOther}
                          onChange={(e) => setTelestrokeNote({...telestrokeNote, callingSiteOther: e.target.value})}
                          className="w-full mt-2 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter site name..."
                        />
                      )}
                    </div>
                    )}

                    {/* Last Known Well Input - Show for Video Telestroke */}
                    {consultationType === 'videoTelestroke' && (
                    <div id="lkw-section" className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block font-semibold text-blue-900">
                          <i data-lucide="clock" className="w-4 h-4 inline mr-1"></i>
                          Last Known Well Time *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            setLkwTime(now);
                          }}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                        >
                          Use Now
                        </button>
                      </div>

                      {/* Separate Date and Time Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <label className="block text-sm font-medium text-blue-900 mb-1">Date</label>
                          <input
                            type="date"
                            value={lkwTime ? `${lkwTime.getFullYear()}-${String(lkwTime.getMonth() + 1).padStart(2, '0')}-${String(lkwTime.getDate()).padStart(2, '0')}` : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                // Parse as local date to avoid timezone issues
                                const [year, month, day] = e.target.value.split('-').map(Number);
                                const newDate = new Date(year, month - 1, day); // month is 0-indexed
                                if (lkwTime) {
                                  newDate.setHours(lkwTime.getHours(), lkwTime.getMinutes());
                                }
                                setLkwTime(newDate);
                              }
                            }}
                            max={`${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`}
                            className="w-full px-2 sm:px-4 py-3 border-2 border-blue-300 rounded-lg text-base sm:text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-full"
                            style={{boxSizing: 'border-box'}}
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="block text-sm font-medium text-blue-900 mb-1">Time</label>
                          <input
                            type="time"
                            value={lkwTime ? lkwTime.toTimeString().slice(0, 5) : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [hours, minutes] = e.target.value.split(':');
                                const newDate = lkwTime ? new Date(lkwTime) : new Date();
                                newDate.setHours(parseInt(hours), parseInt(minutes));
                                setLkwTime(newDate);
                              }
                            }}
                            className="w-full px-2 sm:px-4 py-3 border-2 border-blue-300 rounded-lg text-base sm:text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-full"
                            style={{boxSizing: 'border-box'}}
                          />
                        </div>
                      </div>

                      {/* Wake-up Stroke / Unknown LKW Checkbox */}
                      <div className="mt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={telestrokeNote.lkwUnknown}
                            onChange={(e) => {
                              const nextValue = e.target.checked;
                              setTelestrokeNote({
                                ...telestrokeNote,
                                lkwUnknown: nextValue,
                                discoveryDate: nextValue ? (telestrokeNote.discoveryDate || new Date().toISOString().split('T')[0]) : telestrokeNote.discoveryDate,
                                discoveryTime: nextValue ? (telestrokeNote.discoveryTime || new Date().toTimeString().slice(0, 5)) : telestrokeNote.discoveryTime
                              });
                            }}
                            className="w-5 h-5 rounded border-2 border-purple-400 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="font-semibold text-purple-800">Wake-up Stroke / Unknown LKW</span>
                        </label>
                      </div>

                      {telestrokeNote.lkwUnknown && (
                        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-purple-800">Discovery Time</span>
                            <button
                              onClick={() => setTelestrokeNote({
                                ...telestrokeNote,
                                discoveryDate: new Date().toISOString().split('T')[0],
                                discoveryTime: new Date().toTimeString().slice(0, 5)
                              })}
                              className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                              type="button"
                            >
                              Use Now
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={telestrokeNote.discoveryDate}
                              onChange={(e) => setTelestrokeNote({ ...telestrokeNote, discoveryDate: e.target.value })}
                              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                            <input
                              type="time"
                              value={telestrokeNote.discoveryTime}
                              onChange={(e) => setTelestrokeNote({ ...telestrokeNote, discoveryTime: e.target.value })}
                              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          {timeFromLKW && (
                            <p className="text-xs text-purple-700 mt-2">
                              {timeFromLKW.hours}h {timeFromLKW.minutes}m from discovery
                            </p>
                          )}
                        </div>
                      )}

                      {/* Wake-up Stroke Decision Tree Panel */}
                      {telestrokeNote.lkwUnknown && (
                        <div className="mt-3 bg-purple-50 border-2 border-purple-300 rounded-lg p-4 space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-purple-900">🌙 Wake-up Stroke Evaluation</span>
                          </div>

                          {/* MRI Availability Decision Point */}
                          <div className="space-y-2">
                            <div className="font-semibold text-purple-800">Is MRI with DWI-FLAIR available?</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setTelestrokeNote({
                                  ...telestrokeNote,
                                  wakeUpStrokeWorkflow: {...telestrokeNote.wakeUpStrokeWorkflow, mriAvailable: true}
                                })}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                  telestrokeNote.wakeUpStrokeWorkflow.mriAvailable === true
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-100'
                                }`}
                              >
                                Yes - MRI Available
                              </button>
                              <button
                                onClick={() => setTelestrokeNote({
                                  ...telestrokeNote,
                                  wakeUpStrokeWorkflow: {...telestrokeNote.wakeUpStrokeWorkflow, mriAvailable: false}
                                })}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                  telestrokeNote.wakeUpStrokeWorkflow.mriAvailable === false
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white border-2 border-orange-300 text-orange-700 hover:bg-orange-100'
                                }`}
                              >
                                No - Use CTP
                              </button>
                            </div>
                          </div>

                          {/* WAKE-UP Trial Criteria (MRI-guided) */}
                          {telestrokeNote.wakeUpStrokeWorkflow.mriAvailable === true && (
                            <div className="bg-white border border-purple-200 rounded-lg p-3 space-y-2">
                              <div className="font-bold text-purple-800 flex items-center gap-2">
                                <span>🔬</span>
                                <span>WAKE-UP Trial Criteria (MRI-guided)</span>
                                <a href="https://www.nejm.org/doi/full/10.1056/NEJMoa1804355" target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-purple-600 hover:underline">[NEJM 2018]</a>
                              </div>
                              <div className="grid gap-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.dwi.positiveForLesion}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {
                                        ...telestrokeNote.wakeUpStrokeWorkflow,
                                        dwi: {...telestrokeNote.wakeUpStrokeWorkflow.dwi, positiveForLesion: e.target.checked}
                                      }
                                    })}
                                    className="w-4 h-4 rounded border-purple-400 text-purple-600"
                                  />
                                  <span>DWI positive lesion visible</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.flair.noMarkedHyperintensity}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {
                                        ...telestrokeNote.wakeUpStrokeWorkflow,
                                        flair: {...telestrokeNote.wakeUpStrokeWorkflow.flair, noMarkedHyperintensity: e.target.checked}
                                      }
                                    })}
                                    className="w-4 h-4 rounded border-purple-400 text-purple-600"
                                  />
                                  <span>No marked parenchymal hyperintensity on FLAIR</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.ageEligible}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {...telestrokeNote.wakeUpStrokeWorkflow, ageEligible: e.target.checked}
                                    })}
                                    className="w-4 h-4 rounded border-purple-400 text-purple-600"
                                  />
                                  <span>Age 18-80 years</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.nihssEligible}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {...telestrokeNote.wakeUpStrokeWorkflow, nihssEligible: e.target.checked}
                                    })}
                                    className="w-4 h-4 rounded border-purple-400 text-purple-600"
                                  />
                                  <span>NIHSS ≤25</span>
                                </label>
                              </div>
                              {/* Eligibility Summary */}
                              {telestrokeNote.wakeUpStrokeWorkflow.dwi.positiveForLesion &&
                               telestrokeNote.wakeUpStrokeWorkflow.flair.noMarkedHyperintensity &&
                               telestrokeNote.wakeUpStrokeWorkflow.ageEligible &&
                               telestrokeNote.wakeUpStrokeWorkflow.nihssEligible && (
                                <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-green-800 font-semibold text-sm flex items-center gap-2">
                                  <span>✓</span>
                                  <span>Meets WAKE-UP criteria - Consider IV thrombolysis</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* EXTEND Trial Criteria (Perfusion-guided) */}
                          {telestrokeNote.wakeUpStrokeWorkflow.mriAvailable === false && (
                            <div className="bg-white border border-orange-200 rounded-lg p-3 space-y-2">
                              <div className="font-bold text-orange-800 flex items-center gap-2">
                                <span>🧠</span>
                                <span>EXTEND Trial Criteria (Perfusion Imaging)</span>
                                <a href="https://www.nejm.org/doi/full/10.1056/NEJMoa1813046" target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-orange-600 hover:underline">[NEJM 2019]</a>
                              </div>
                              <div className="grid gap-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.nihss4to26}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {
                                        ...telestrokeNote.wakeUpStrokeWorkflow,
                                        extendCriteria: {...telestrokeNote.wakeUpStrokeWorkflow.extendCriteria, nihss4to26: e.target.checked}
                                      }
                                    })}
                                    className="w-4 h-4 rounded border-orange-400 text-orange-600"
                                  />
                                  <span>NIHSS 4-26</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.premorbidMRSLt2}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {
                                        ...telestrokeNote.wakeUpStrokeWorkflow,
                                        extendCriteria: {...telestrokeNote.wakeUpStrokeWorkflow.extendCriteria, premorbidMRSLt2: e.target.checked}
                                      }
                                    })}
                                    className="w-4 h-4 rounded border-orange-400 text-orange-600"
                                  />
                                  <span>Pre-morbid mRS &lt;2</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.ischemicCoreLte70}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {
                                        ...telestrokeNote.wakeUpStrokeWorkflow,
                                        extendCriteria: {...telestrokeNote.wakeUpStrokeWorkflow.extendCriteria, ischemicCoreLte70: e.target.checked}
                                      }
                                    })}
                                    className="w-4 h-4 rounded border-orange-400 text-orange-600"
                                  />
                                  <span>Ischemic core ≤70mL</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.mismatchRatioGte1_2}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {
                                        ...telestrokeNote.wakeUpStrokeWorkflow,
                                        extendCriteria: {...telestrokeNote.wakeUpStrokeWorkflow.extendCriteria, mismatchRatioGte1_2: e.target.checked}
                                      }
                                    })}
                                    className="w-4 h-4 rounded border-orange-400 text-orange-600"
                                  />
                                  <span>Mismatch ratio ≥1.2</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.timeWindow4_5to9h}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      wakeUpStrokeWorkflow: {
                                        ...telestrokeNote.wakeUpStrokeWorkflow,
                                        extendCriteria: {...telestrokeNote.wakeUpStrokeWorkflow.extendCriteria, timeWindow4_5to9h: e.target.checked}
                                      }
                                    })}
                                    className="w-4 h-4 rounded border-orange-400 text-orange-600"
                                  />
                                  <span>Time 4.5-9 hours OR wake-up stroke</span>
                                </label>
                              </div>
                              {/* Eligibility Summary */}
                              {telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.nihss4to26 &&
                               telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.premorbidMRSLt2 &&
                               telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.ischemicCoreLte70 &&
                               telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.mismatchRatioGte1_2 &&
                               telestrokeNote.wakeUpStrokeWorkflow.extendCriteria.timeWindow4_5to9h && (
                                <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-green-800 font-semibold text-sm flex items-center gap-2">
                                  <span>✓</span>
                                  <span>Meets EXTEND criteria - Consider IV thrombolysis</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Imaging Recommendation Auto-suggest */}
                          {telestrokeNote.wakeUpStrokeWorkflow.mriAvailable !== null && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="font-semibold text-blue-800 mb-2">📋 Suggested Imaging Recommendation:</div>
                              <div className="text-sm text-blue-900 bg-white rounded p-2 border border-blue-200">
                                {telestrokeNote.wakeUpStrokeWorkflow.mriAvailable === true
                                  ? "Obtain MRI brain with DWI/FLAIR to assess for DWI-FLAIR mismatch (WAKE-UP trial criteria). If positive DWI lesion with no corresponding FLAIR hyperintensity, patient may be candidate for IV thrombolysis."
                                  : "Obtain CT Perfusion to assess for perfusion mismatch (EXTEND trial criteria). If ischemic core ≤70mL with mismatch ratio ≥1.2, patient may be candidate for IV thrombolysis in extended window."
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    )}

                    {/* ============================================ */}
                    {/* TELEPHONE CONSULT - Enhanced Clinical Form  */}
                    {/* ============================================ */}
                    {consultationType === 'telephone' && (
                      <div className="space-y-4">

                        {/* Header with LKW Timer */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4 shadow-lg">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <h3 className="text-xl font-bold">📞 Telephone Consult</h3>
                            {lkwTime && (
                              <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                                <span className="text-2xl font-bold">
                                  {(() => {
                                    const tf = calculateTimeFromLKW();
                                    return tf ? `${tf.hours}h ${tf.minutes}m` : '--:--';
                                  })()}
                                </span>
                                <span className="text-sm ml-2 opacity-90">from LKW</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Section 1a: Calling Site */}
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 shadow-md">
                          <label className="block text-sm font-medium text-blue-900 mb-1">
                            <i data-lucide="map-pin" className="w-4 h-4 inline mr-1"></i>
                            Calling Site
                          </label>
                          <select
                            value={telestrokeNote.callingSite}
                            onChange={(e) => setTelestrokeNote({...telestrokeNote, callingSite: e.target.value, callingSiteOther: e.target.value === 'Other' ? telestrokeNote.callingSiteOther : ''})}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- Select Site --</option>
                            <optgroup label="UW Sites">
                              <option value="HMC">HMC</option>
                              <option value="UWMC-ML">UWMC-ML</option>
                              <option value="UWM Northwest">UWM Northwest</option>
                            </optgroup>
                            <optgroup label="Partner Sites">
                              <option value="Astria Sunnyside">Astria Sunnyside</option>
                              <option value="Cascade Medical – Leavenworth">Cascade Medical – Leavenworth</option>
                              <option value="Columbia Basin-Ephrata">Columbia Basin-Ephrata</option>
                              <option value="Confluence Health – Wenatchee">Confluence Health – Wenatchee</option>
                              <option value="Island Health – Anacortes">Island Health – Anacortes</option>
                              <option value="Lourdes Health – Pasco">Lourdes Health – Pasco</option>
                              <option value="Mason General Hospital – Shelton">Mason General Hospital – Shelton</option>
                              <option value="Snoqualmie Valley – Snoqualmie">Snoqualmie Valley – Snoqualmie</option>
                              <option value="St. Joseph Regional Medical Center – Lewiston, Idaho">St. Joseph Regional Medical Center – Lewiston, Idaho</option>
                              <option value="PeaceHealth Island - Friday Harbor">PeaceHealth Island - Friday Harbor</option>
                              <option value="PeaceHealth Ketchikan Medical Center – Ketchikan, Alaska">PeaceHealth Ketchikan Medical Center – Ketchikan, Alaska</option>
                              <option value="PeaceHealth St. Joseph Medical Center – Bellingham">PeaceHealth St. Joseph Medical Center – Bellingham</option>
                              <option value="PeaceHealth United General Medical Center – Sedro Woolley">PeaceHealth United General Medical Center – Sedro Woolley</option>
                              <option value="Petersburg, AK">Petersburg, AK</option>
                              <option value="Trios Health – Kennewick">Trios Health – Kennewick</option>
                            </optgroup>
                            <option value="Other">Other (specify below)</option>
                          </select>
                          {telestrokeNote.callingSite === 'Other' && (
                            <input
                              type="text"
                              value={telestrokeNote.callingSiteOther}
                              onChange={(e) => setTelestrokeNote({...telestrokeNote, callingSiteOther: e.target.value})}
                              className="w-full mt-2 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter site name..."
                            />
                          )}
                        </div>

                        {/* Section 1b: Last Known Well */}
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 shadow-md">
                          <label className="block text-sm font-medium text-amber-900 mb-1">
                            <i data-lucide="clock" className="w-4 h-4 inline mr-1"></i>
                            Last Known Well
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={lkwTime ? `${lkwTime.getFullYear()}-${String(lkwTime.getMonth() + 1).padStart(2, '0')}-${String(lkwTime.getDate()).padStart(2, '0')}` : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  // Parse as local date to avoid timezone issues
                                  const [year, month, day] = e.target.value.split('-').map(Number);
                                  const newDate = new Date(year, month - 1, day); // month is 0-indexed
                                  if (lkwTime) {
                                    newDate.setHours(lkwTime.getHours(), lkwTime.getMinutes());
                                  }
                                  setLkwTime(newDate);
                                }
                              }}
                              max={`${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`}
                              className="w-full px-2 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                            <input
                              type="time"
                              value={lkwTime ? lkwTime.toTimeString().slice(0, 5) : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  const [hours, minutes] = e.target.value.split(':');
                                  const newDate = lkwTime ? new Date(lkwTime) : new Date();
                                  newDate.setHours(parseInt(hours), parseInt(minutes));
                                  setLkwTime(newDate);
                                }
                              }}
                              className="w-full px-2 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        {/* Section 2: Patient Info + History */}
                        <div id="patient-info-section" className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-md">
                          <h4 className="text-md font-bold text-purple-900 mb-3 flex items-center gap-2">
                            <i data-lucide="user" className="w-4 h-4"></i>
                            Patient Info & History
                          </h4>

                          {/* Demographics Row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                              <input
                                type="number"
                                value={telestrokeNote.age}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, age: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Sex</label>
                              <select
                                value={telestrokeNote.sex}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, sex: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="M">M</option>
                                <option value="F">F</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                              <input
                                type="number"
                                value={telestrokeNote.weight}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, weight: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Pre-stroke mRS</label>
                              <select
                                value={telestrokeNote.premorbidMRS}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, premorbidMRS: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">--</option>
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                              </select>
                            </div>
                          </div>

                          {/* TNK Dose Display */}
                          {telestrokeNote.weight && calculateTNKDose(telestrokeNote.weight) && (
                            <div className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-center justify-between text-sm">
                              <span className="text-orange-800 font-medium">💉 TNK Dose: <span className="font-bold">{calculateTNKDose(telestrokeNote.weight).calculatedDose} mg</span></span>
                              <span className="text-xs text-orange-600">{calculateTNKDose(telestrokeNote.weight).volume}</span>
                            </div>
                          )}

                          {/* Presenting Symptoms & PMH */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-gray-600">Presenting Symptoms</label>
                              </div>
                              <textarea
                                value={telestrokeNote.symptoms}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, symptoms: e.target.value})}
                                rows="2"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-gray-600">Relevant PMH</label>
                              </div>
                              <textarea
                                value={telestrokeNote.pmh}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, pmh: e.target.value})}
                                rows="2"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          {/* Medications */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Medications</label>
                            <input
                              type="text"
                              value={telestrokeNote.medications}
                              onChange={(e) => setTelestrokeNote({...telestrokeNote, medications: e.target.value})}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                              {['Aspirin', 'Clopidogrel', 'Warfarin', 'Apixaban'].map((med) => (
                                <button
                                  key={med}
                                  type="button"
                                  onClick={() => appendMedication(med)}
                                  className="px-2 py-1 text-xs font-semibold rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50"
                                >
                                  + {med}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Anticoagulation Status */}
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <span className="text-sm font-medium text-amber-800">💊 Anticoagulation Status</span>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Anticoagulant Type</label>
                                <select
                                  value={telestrokeNote.lastDOACType}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, lastDOACType: e.target.value})}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                >
                                  <option value="">None / Unknown</option>
                                  <option value="apixaban">Apixaban (Eliquis)</option>
                                  <option value="rivaroxaban">Rivaroxaban (Xarelto)</option>
                                  <option value="dabigatran">Dabigatran (Pradaxa)</option>
                                  <option value="warfarin">Warfarin (check INR)</option>
                                  <option value="heparin">Heparin UFH (check PTT)</option>
                                  <option value="lmwh">LMWH / Enoxaparin</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Last Dose</label>
                                <input
                                  type="datetime-local"
                                  value={telestrokeNote.lastDOACDose}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, lastDOACDose: e.target.value})}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setTelestrokeNote({...telestrokeNote, lastDOACDose: new Date().toISOString().slice(0, 16)})}
                                    className="px-2 py-1 text-xs font-semibold rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50"
                                  >
                                    Dose now
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const past = new Date(Date.now() - (49 * 60 * 60 * 1000));
                                      setTelestrokeNote({...telestrokeNote, lastDOACDose: past.toISOString().slice(0, 16)});
                                    }}
                                    className="px-2 py-1 text-xs font-semibold rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50"
                                  >
                                    &gt;48h ago
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTelestrokeNote({...telestrokeNote, lastDOACDose: ''})}
                                    className="px-2 py-1 text-xs font-semibold rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50"
                                  >
                                    Unknown
                                  </button>
                                </div>
                              </div>
                            </div>
                            {/* Show anticoagulant info if selected */}
                            {telestrokeNote.lastDOACType && ANTICOAGULANT_INFO[telestrokeNote.lastDOACType] && (
                              <div className="mt-2 bg-orange-50 border border-orange-200 rounded p-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="font-medium">{ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].name}</span>
                                  <span className="text-orange-700">t½: {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].halfLife}</span>
                                </div>
                                <div className="text-orange-700 mt-1">TNK: {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].thrombolysisThreshold}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Section 3: NIHSS */}
                        <div id="nihss-section" className="bg-white border-2 border-red-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-bold text-red-900 flex items-center gap-2">
                              <i data-lucide="brain" className="w-4 h-4"></i>
                              NIHSS Examination
                            </h4>
                            <span className="text-2xl font-bold text-red-600">Score: {nihssScore}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">NIHSS Score (0-42)</label>
                              <input
                                type="number"
                                value={telestrokeNote.nihss}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setTelestrokeNote({...telestrokeNote, nihss: value});
                                  setNihssScore(parseInt(value) || 0);
                                }}
                                min="0"
                                max="42"
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xl font-bold text-center focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Neurologic Deficits</label>
                              <input
                                type="text"
                                value={telestrokeNote.nihssDetails}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, nihssDetails: e.target.value})}
                                placeholder="e.g., R hemiparesis, aphasia, gaze deviation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>

                          {/* NIHSS Severity */}
                          {nihssScore > 0 && (
                            <div className={`mt-2 p-2 rounded-lg text-center text-sm font-medium ${
                              nihssScore <= 4 ? 'bg-green-100 text-green-800' :
                              nihssScore <= 15 ? 'bg-yellow-100 text-yellow-800' :
                              nihssScore <= 20 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {nihssScore <= 4 ? 'Minor Stroke' :
                               nihssScore <= 15 ? 'Moderate Stroke' :
                               nihssScore <= 20 ? 'Moderate-Severe Stroke' :
                               'Severe Stroke'}
                            </div>
                          )}
                        </div>

                        {/* Section 4: Vitals & Labs */}
                        <div id="vitals-section" className="bg-white border-2 border-green-300 rounded-lg p-4 shadow-md">
                          <h4 className="text-md font-bold text-green-900 mb-3 flex items-center gap-2">
                            <i data-lucide="activity" className="w-4 h-4"></i>
                            Vitals & Labs
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">BP</label>
                              <input
                                type="text"
                                value={telestrokeNote.presentingBP}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, presentingBP: e.target.value})}
                                placeholder="120/80"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Glucose</label>
                              <input
                                type="text"
                                value={telestrokeNote.glucose}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, glucose: e.target.value})}
                                placeholder="mg/dL"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">INR</label>
                              <input
                                type="text"
                                value={telestrokeNote.inr}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, inr: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Platelets</label>
                              <input
                                type="text"
                                value={telestrokeNote.platelets}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, platelets: e.target.value})}
                                placeholder="K/uL"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 5: Imaging */}
                        <div className="bg-white border-2 border-cyan-300 rounded-lg p-4 shadow-md">
                          <h4 className="text-md font-bold text-cyan-900 mb-3 flex items-center gap-2">
                            <i data-lucide="scan" className="w-4 h-4"></i>
                            Imaging Review
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">CT Head</label>
                              <textarea
                                value={telestrokeNote.ctResults}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, ctResults: e.target.value})}
                                rows="2"
                                placeholder="No acute hemorrhage, early ischemic changes..."
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">CTA Head/Neck</label>
                              <textarea
                                value={telestrokeNote.ctaResults}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, ctaResults: e.target.value})}
                                rows="2"
                                placeholder="LVO location, vessel patency..."
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">ASPECTS</label>
                              <input
                                type="number"
                                value={aspectsScore}
                                onChange={(e) => setAspectsScore(parseInt(e.target.value) || 0)}
                                min="0"
                                max="10"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">CTP</label>
                              <input
                                type="text"
                                value={telestrokeNote.ctpResults}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, ctpResults: e.target.value})}
                                placeholder="Core/penumbra, mismatch..."
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                          </div>
                        </div>


                        {/* Section 6: Treatment Decision */}
                        <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-md">
                          <h4 className="text-md font-bold text-purple-900 mb-3 flex items-center gap-2">
                            <i data-lucide="stethoscope" className="w-4 h-4"></i>
                            Treatment Decision
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Suspected Diagnosis</label>
                              <select
                                value={telestrokeNote.diagnosis}
                                onChange={(e) => {
                                  const newDx = e.target.value;
                                  const category = newDx.toLowerCase().includes('ich') || newDx.toLowerCase().includes('hemorrhag') ? 'ich' : newDx.toLowerCase().includes('ischemic') || newDx.toLowerCase().includes('lvo') ? 'ischemic' : '';
                                  setTelestrokeNote({...telestrokeNote, diagnosis: newDx, diagnosisCategory: category});
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">-- Select Diagnosis --</option>
                                <optgroup label="Ischemic Stroke">
                                  <option value="Acute Ischemic Stroke">Acute Ischemic Stroke</option>
                                  <option value="Acute Ischemic Stroke - LVO">Acute Ischemic Stroke - LVO</option>
                                  <option value="Minor Ischemic Stroke">Minor Ischemic Stroke</option>
                                  <option value="TIA">TIA</option>
                                </optgroup>
                                <optgroup label="Hemorrhagic">
                                  <option value="Intracerebral Hemorrhage (ICH)">Intracerebral Hemorrhage (ICH)</option>
                                  <option value="Subarachnoid Hemorrhage (SAH)">Subarachnoid Hemorrhage (SAH)</option>
                                </optgroup>
                                <optgroup label="Other">
                                  <option value="Cerebral Venous Thrombosis (CVT)">Cerebral Venous Thrombosis (CVT)</option>
                                  <option value="Cervical Artery Dissection">Cervical Artery Dissection</option>
                                  <option value="Stroke Mimic">Stroke Mimic</option>
                                  <option value="Other">Other</option>
                                </optgroup>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <label className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={telestrokeNote.tnkRecommended}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, tnkRecommended: e.target.checked})}
                                  className="w-4 h-4 text-green-600"
                                />
                                <span className="text-sm font-medium text-green-800">TNK Recommended</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={telestrokeNote.evtRecommended}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, evtRecommended: e.target.checked})}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm font-medium text-blue-800">EVT Recommended</span>
                              </label>
                            </div>

                            {telestrokeNote.tnkRecommended && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">TNK Admin Time</label>
                                <input
                                  type="time"
                                  value={telestrokeNote.tnkAdminTime || ''}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, tnkAdminTime: e.target.value})}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Rationale</label>
                              <textarea
                                value={telestrokeNote.rationale}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, rationale: e.target.value})}
                                rows="2"
                                placeholder="Clinical rationale for treatment recommendation..."
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Disposition</label>
                              <select
                                value={telestrokeNote.disposition || ''}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, disposition: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">-- Select --</option>
                                <option value="Admit to Neuro ICU">Admit to Neuro ICU</option>
                                <option value="Admit to Stroke Unit">Admit to Stroke Unit</option>
                                <option value="Admit to Floor">Admit to Floor</option>
                                <option value="Transfer to CSC">Transfer to Comprehensive Stroke Center</option>
                                <option value="Transfer to PSC">Transfer to Primary Stroke Center</option>
                                <option value="Observation">Observation</option>
                                <option value="Discharge">Discharge</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Section 6b: Recommendations */}
                        <div className="bg-white border-2 border-teal-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-bold text-teal-900 flex items-center gap-2">
                              <i data-lucide="clipboard-check" className="w-4 h-4"></i>
                              Recommendations
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                const recs = getContextualRecommendations();
                                const age = telestrokeNote.age || '[Age]';
                                const sex = telestrokeNote.sex === 'M' ? 'male' : telestrokeNote.sex === 'F' ? 'female' : '[sex]';
                                const dx = telestrokeNote.diagnosis || '[Diagnosis]';
                                let note = `TELEPHONE CONSULTATION NOTE\nDate: ${new Date().toLocaleDateString()}\n\n`;
                                note += `HPI: ${age} year old ${sex}`;
                                if (telestrokeNote.pmh) note += ` with PMH of ${telestrokeNote.pmh}`;
                                note += ` presenting with ${telestrokeNote.symptoms || '[symptoms]'}.\n`;
                                if (lkwTime) note += `Last known well: ${lkwTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} on ${lkwTime.toLocaleDateString()}.\n`;
                                note += `\nNIHSS: ${telestrokeNote.nihss || nihssScore || 'N/A'}\n`;
                                if (telestrokeNote.presentingBP) note += `BP: ${telestrokeNote.presentingBP}\n`;
                                note += `\nIMAGING:\n`;
                                if (telestrokeNote.ctResults) note += `CT Head: ${telestrokeNote.ctResults}\n`;
                                if (telestrokeNote.ctaResults) note += `CTA: ${telestrokeNote.ctaResults}\n`;
                                if (telestrokeNote.ctpResults) note += `CTP: ${telestrokeNote.ctpResults}\n`;
                                if (aspectsScore) note += `ASPECTS: ${aspectsScore}\n`;
                                note += `\nASSESSMENT: ${dx}\n\nPLAN:\n`;
                                if (telestrokeNote.tnkRecommended) {
                                  note += `- TNK 0.25 mg/kg IV bolus (max 25 mg) recommended`;
                                  if (telestrokeNote.tnkAdminTime) note += ` at ${telestrokeNote.tnkAdminTime}`;
                                  note += `.\n`;
                                } else { note += `- IV TNK: Not recommended.\n`; }
                                if (telestrokeNote.evtRecommended) note += `- EVT: Recommended.\n`;
                                if (telestrokeNote.rationale) note += `- Rationale: ${telestrokeNote.rationale}\n`;
                                if (telestrokeNote.disposition) note += `\nDISPOSITION: ${telestrokeNote.disposition}\n`;
                                if (recs.length > 0) {
                                  note += `\nGUIDELINE-BASED RECOMMENDATIONS:\n`;
                                  recs.forEach(rec => { note += `- ${rec.title}: ${rec.recommendation} [Class ${rec.classOfRec}, LOE ${rec.levelOfEvidence}]\n`; });
                                }
                                setTelestrokeNote({...telestrokeNote, recommendationsText: note});
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
                            >
                              <i data-lucide="file-text" className="w-3 h-3"></i>
                              Generate Auto-Note
                            </button>
                          </div>
                          <textarea
                            value={telestrokeNote.recommendationsText}
                            onChange={(e) => setTelestrokeNote({...telestrokeNote, recommendationsText: e.target.value})}
                            placeholder="Click 'Generate Auto-Note' or type recommendations..."
                            rows="5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                          />
                        </div>

                        {/* Section 7: Output Buttons */}
                        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 shadow-md space-y-3">
                          <h4 className="text-md font-bold text-gray-800 mb-3">📋 Copy Notes</h4>

                          {/* Pulsara Summary */}
                          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-indigo-800 text-sm">Pulsara Summary</span>
                              <button
                                onClick={() => {
                                  const age = telestrokeNote.age || "[Age]";
                                  const sexRaw = telestrokeNote.sex;
                                  const sex = sexRaw === 'M' ? 'male' : sexRaw === 'F' ? 'female' : '[sex]';
                                  const pmh = telestrokeNote.pmh || "no PMH";
                                  const symptoms = telestrokeNote.symptoms || "[symptoms]";
                                  const lkw = lkwTime ? lkwTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "[time]";
                                  const lkwDate = lkwTime ? lkwTime.toLocaleDateString('en-US') : "[date]";
                                  const nihss = telestrokeNote.nihss || nihssScore || "[score]";
                                  const nihssDeficits = telestrokeNote.nihssDetails ? ` (${telestrokeNote.nihssDetails})` : "";
                                  const ctResults = telestrokeNote.ctResults || "[CT findings]";
                                  const ctaResults = telestrokeNote.ctaResults || "[CTA findings]";
                                  const ctpResults = telestrokeNote.ctpResults || "N/A";
                                  const aspectsStr = aspectsScore ? ` ASPECTS: ${aspectsScore}.` : "";
                                  const tnkStatus = telestrokeNote.tnkRecommended ? "Recommended" : "Not Recommended";
                                  const evtStatus = telestrokeNote.evtRecommended ? "Recommended" : "Not Recommended";
                                  const rationale = telestrokeNote.rationale || "[rationale]";

                                  const summary = `${age} year old ${sex} with ${pmh} who presents with ${symptoms}. Last known well is ${lkw} ${lkwDate}. NIHSS score: ${nihss}${nihssDeficits}. Head CT: ${ctResults}.${aspectsStr} CTA Head/Neck: ${ctaResults}. CTP: ${ctpResults}. TNK Treatment: ${tnkStatus}. EVT: ${evtStatus}. Rationale for Treatment Recommendation: ${rationale}.`;
                                  navigator.clipboard.writeText(summary);
                                  setCopiedText('tel-pulsara');
                                  setTimeout(() => setCopiedText(''), 2000);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                <i data-lucide={copiedText === 'tel-pulsara' ? 'check' : 'copy'} className="w-4 h-4"></i>
                                {copiedText === 'tel-pulsara' ? 'Copied!' : 'Copy Pulsara'}
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap">
                              {(() => {
                                const age = telestrokeNote.age || "[Age]";
                                const sexRaw = telestrokeNote.sex;
                                const sex = sexRaw === 'M' ? 'male' : sexRaw === 'F' ? 'female' : '[sex]';
                                const pmh = telestrokeNote.pmh || "no PMH";
                                const symptoms = telestrokeNote.symptoms || "[symptoms]";
                                const lkw = lkwTime ? lkwTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "[time]";
                                const lkwDate = lkwTime ? lkwTime.toLocaleDateString('en-US') : "[date]";
                                const nihss = telestrokeNote.nihss || nihssScore || "[score]";
                                const nihssDeficits = telestrokeNote.nihssDetails ? ` (${telestrokeNote.nihssDetails})` : "";
                                const ctResults = telestrokeNote.ctResults || "[CT findings]";
                                const ctaResults = telestrokeNote.ctaResults || "[CTA findings]";
                                const ctpResults = telestrokeNote.ctpResults || "N/A";
                                const aspectsStr = aspectsScore ? ` ASPECTS: ${aspectsScore}.` : "";
                                const tnkStatus = telestrokeNote.tnkRecommended ? "Recommended" : "Not Recommended";
                                const evtStatus = telestrokeNote.evtRecommended ? "Recommended" : "Not Recommended";
                                const rationale = telestrokeNote.rationale || "[rationale]";
                                return `${age} year old ${sex} with ${pmh} who presents with ${symptoms}. Last known well is ${lkw} ${lkwDate}. NIHSS score: ${nihss}${nihssDeficits}. Head CT: ${ctResults}.${aspectsStr} CTA Head/Neck: ${ctaResults}. CTP: ${ctpResults}. TNK Treatment: ${tnkStatus}. EVT: ${evtStatus}. Rationale: ${rationale}.`;
                              })()}
                            </p>
                          </div>

                          {/* Brief Note Button */}
                          <button
                            onClick={() => {
                              const siteName = telestrokeNote.callingSite === 'Other' ? telestrokeNote.callingSiteOther : telestrokeNote.callingSite;
                              const timeFromLKW = calculateTimeFromLKW();
                              const timeDisplay = timeFromLKW ? `${timeFromLKW.hours}h ${timeFromLKW.minutes}m from LKW` : '';

                              const note = `TELEPHONE CONSULT\n\n` +
                                `Site: ${siteName || 'Not specified'}\n` +
                                `Patient: ${telestrokeNote.age || '?'}yo ${telestrokeNote.sex || '?'}\n` +
                                `LKW: ${lkwTime ? lkwTime.toLocaleString() : 'Not specified'}${timeDisplay ? ` (${timeDisplay})` : ''}\n\n` +
                                `PRESENTATION:\n${telestrokeNote.symptoms || 'Not documented'}\n` +
                                `PMH: ${telestrokeNote.pmh || 'Not documented'}\n` +
                                `Medications: ${telestrokeNote.medications || 'Not documented'}\n` +
                                (telestrokeNote.lastDOACType ? `Anticoagulation: ${telestrokeNote.lastDOACType}${telestrokeNote.lastDOACDose ? `, last dose: ${new Date(telestrokeNote.lastDOACDose).toLocaleString()}` : ''}\n` : '') +
                                `\nNIHSS: ${telestrokeNote.nihss || nihssScore || 'N/A'}${telestrokeNote.nihssDetails ? ` (${telestrokeNote.nihssDetails})` : ''}\n` +
                                `\nVITALS/LABS:\n` +
                                `BP: ${telestrokeNote.presentingBP || 'N/A'}, Glucose: ${telestrokeNote.glucose || 'N/A'}, INR: ${telestrokeNote.inr || 'N/A'}, Plt: ${telestrokeNote.platelets || 'N/A'}\n` +
                                `\nIMAGING:\n` +
                                `CT Head: ${telestrokeNote.ctResults || 'Not documented'}\n` +
                                `CTA: ${telestrokeNote.ctaResults || 'Not documented'}\n` +
                                (aspectsScore ? `ASPECTS: ${aspectsScore}\n` : '') +
                                (telestrokeNote.ctpResults ? `CTP: ${telestrokeNote.ctpResults}\n` : '') +
                                `\nTREATMENT DECISION:\n` +
                                `TNK: ${telestrokeNote.tnkRecommended ? 'RECOMMENDED' : 'Not recommended'}\n` +
                                `EVT: ${telestrokeNote.evtRecommended ? 'RECOMMENDED' : 'Not recommended'}\n` +
                                `\nRATIONALE/RECOMMENDATIONS:\n${telestrokeNote.rationale || 'None documented'}\n\n` +
                                `Clinician Name\n` +
                                `${new Date().toLocaleString()}`;
                              navigator.clipboard.writeText(note);
                              setCopiedText('telephone-note');
                              setTimeout(() => setCopiedText(''), 2000);
                            }}
                            className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            <i data-lucide="copy" className="w-4 h-4"></i>
                            {copiedText === 'telephone-note' ? 'Copied!' : 'Copy Full Telephone Note'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ============================================ */}
                    {/* FULL ENCOUNTER FORM - Video Telestroke & Consult */}
                    {/* ============================================ */}
                    {consultationType === 'videoTelestroke' && (
                    <>
                    {/* Two-Column Layout: Desktop/Tablet | Single Column: Mobile */}
                    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4`}>

                      {/* LEFT COLUMN - Data Entry (2/3 width on desktop) */}
                      <div className={`lg:col-span-2 space-y-4`}>

                        {/* Section 1: Patient Info */}
                        <div id="patient-info-section" className="bg-white border-2 border-blue-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-blue-900">1. Patient Info</h3>
                            <i data-lucide="user" className="w-5 h-5 text-blue-600"></i>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                              <input
                                type="number"
                                value={telestrokeNote.age}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, age: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder=""
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                              <select
                                value={telestrokeNote.sex}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, sex: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="M">M</option>
                                <option value="F">F</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Weight
                                <span className="ml-1 text-xs text-orange-600 font-normal">(TNK dosing)</span>
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  value={telestrokeNote.weight}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, weight: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder=""
                                  min="0"
                                />
                                <span className="ml-1 text-xs text-gray-500">kg</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pre-stroke mRS
                                <span className="ml-1 text-xs text-blue-600 font-normal">(trials)</span>
                              </label>
                              <select
                                value={telestrokeNote.premorbidMRS}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, premorbidMRS: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select...</option>
                                <option value="0">0 - No symptoms</option>
                                <option value="1">1 - No significant disability</option>
                                <option value="2">2 - Slight disability</option>
                                <option value="3">3 - Moderate disability</option>
                                <option value="4">4 - Moderately severe disability</option>
                                <option value="5">5 - Severe disability</option>
                              </select>
                            </div>
                          </div>
                          {/* Auto TNK Dose Display */}
                          {telestrokeNote.weight && calculateTNKDose(telestrokeNote.weight) && (
                            <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-orange-800 font-medium">💉 TNK Dose:</span>
                                <span className="text-lg font-bold text-orange-700">{calculateTNKDose(telestrokeNote.weight).calculatedDose} mg</span>
                                <span className="text-sm text-orange-600">({calculateTNKDose(telestrokeNote.weight).volume})</span>
                              </div>
                              <span className="text-xs text-orange-500">0.25 mg/kg, max 25 mg</span>
                            </div>
                          )}
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                            <input
                              type="text"
                              value={telestrokeNote.chiefComplaint}
                              onChange={(e) => setTelestrokeNote({...telestrokeNote, chiefComplaint: e.target.value})}
                              placeholder=""
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Section 2: History & Medications */}
                        <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-purple-900">2. History & Medications</h3>
                            <i data-lucide="file-text" className="w-5 h-5 text-purple-600"></i>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Presenting Symptoms</label>
                              <textarea
                                value={telestrokeNote.symptoms}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, symptoms: e.target.value})}
                                placeholder=""
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Relevant PMH</label>
                              <input
                                type="text"
                                value={telestrokeNote.pmh}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, pmh: e.target.value})}
                                placeholder=""
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>
                              <textarea
                                value={telestrokeNote.medications}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, medications: e.target.value})}
                                placeholder=""
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* DOAC Status for thrombolysis eligibility */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-amber-800">💊 Anticoagulation Status</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Anticoagulant Type</label>
                                  <select
                                    value={telestrokeNote.lastDOACType}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, lastDOACType: e.target.value})}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">None / Unknown</option>
                                    <option value="apixaban">Apixaban (Eliquis)</option>
                                    <option value="rivaroxaban">Rivaroxaban (Xarelto)</option>
                                    <option value="dabigatran">Dabigatran (Pradaxa)</option>
                                      <option value="warfarin">Warfarin (check INR)</option>
                                    <option value="heparin">Heparin UFH (check PTT)</option>
                                    <option value="lmwh">LMWH / Enoxaparin</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Last Dose (date/time)</label>
                                  <input
                                    type="datetime-local"
                                    value={telestrokeNote.lastDOACDose}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, lastDOACDose: e.target.value})}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              {/* Anticoagulant Info Panel - Shows when drug selected */}
                              {telestrokeNote.lastDOACType && ANTICOAGULANT_INFO[telestrokeNote.lastDOACType] && (
                                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-orange-800">
                                      {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].name}
                                    </span>
                                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                                      {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].class}
                                    </span>
                                  </div>

                                  {/* Key Info Grid */}
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white rounded p-2 border border-orange-200">
                                      <div className="text-gray-500 mb-0.5">Half-Life</div>
                                      <div className="font-semibold text-gray-800">
                                        {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].halfLife}
                                      </div>
                                    </div>
                                    <div className="bg-white rounded p-2 border border-orange-200">
                                      <div className="text-gray-500 mb-0.5">tPA/TNK Threshold</div>
                                      <div className="font-semibold text-gray-800">
                                        {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].thrombolysisThreshold}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Thrombolysis Note */}
                                  {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].thrombolysisNote && (
                                    <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded flex items-start gap-1">
                                      <span>⚠️</span>
                                      <span>{ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].thrombolysisNote}</span>
                                    </div>
                                  )}

                                  {/* ICH Reversal - Collapsible */}
                                  <details className="group">
                                    <summary className="cursor-pointer text-sm font-semibold text-red-700 hover:text-red-900 flex items-center gap-1">
                                      <span className="group-open:rotate-90 transition-transform">▶</span>
                                      ICH Reversal Protocol
                                    </summary>
                                    <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs space-y-1">
                                      <div className="flex items-start gap-2">
                                        <span className="font-bold text-red-700 shrink-0">1st Line:</span>
                                        <span className="text-red-900 font-medium">
                                          {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.primary}
                                        </span>
                                      </div>
                                      {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.pccDosing && (
                                        <div className="flex items-start gap-2">
                                          <span className="font-bold text-red-700 shrink-0">PCC Dose:</span>
                                          <span className="text-red-800">
                                            {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.pccDosing}
                                          </span>
                                        </div>
                                      )}
                                      {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.alternative && (
                                        <div className="flex items-start gap-2">
                                          <span className="font-bold text-gray-600 shrink-0">Alt:</span>
                                          <span className="text-gray-700">
                                            {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.alternative}
                                          </span>
                                        </div>
                                      )}
                                      {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.maxDose && (
                                        <div className="text-gray-600 italic">
                                          {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.maxDose}
                                        </div>
                                      )}
                                      {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.note && (
                                        <div className="text-gray-600 italic mt-1 pt-1 border-t border-red-200">
                                          {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].ichReversal.note}
                                        </div>
                                      )}
                                    </div>
                                  </details>

                                  {/* Monitoring */}
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">Monitor:</span> {ANTICOAGULANT_INFO[telestrokeNote.lastDOACType].monitoring}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Section 3: NIHSS Examination */}
                        <div className="bg-white border-2 border-red-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-red-900">3. NIHSS Examination</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-red-600">Score: {nihssScore}</span>
                              <i data-lucide="brain" className="w-5 h-5 text-red-600"></i>
                            </div>
                          </div>

                          {/* Quick NIHSS Entry */}
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-700">Quick Entry:</p>
                              <button
                                type="button"
                                onClick={applyNihssAllNormal}
                                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                              >
                                All normal (0)
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">NIHSS Score (0-42)</label>
                                <input
                                  type="number"
                                  value={telestrokeNote.nihss}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setTelestrokeNote({...telestrokeNote, nihss: value});
                                    setNihssScore(parseInt(value) || 0);
                                  }}
                                  min="0"
                                  max="42"
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Neurologic Deficits</label>
                                <input
                                  type="text"
                                  value={telestrokeNote.nihssDetails}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, nihssDetails: e.target.value})}
                                  placeholder="e.g., R hemiparesis, aphasia"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            {/* NIHSS Severity Interpretation */}
                            {(telestrokeNote.nihss || nihssScore > 0) && (
                              <div className={`p-2 rounded-lg text-center text-sm font-medium ${
                                nihssScore === 0 ? 'bg-green-100 text-green-800' :
                                nihssScore <= 4 ? 'bg-blue-100 text-blue-800' :
                                nihssScore <= 15 ? 'bg-yellow-100 text-yellow-800' :
                                nihssScore <= 20 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {nihssScore === 0 ? '0 = No stroke symptoms' :
                                 nihssScore <= 4 ? `${nihssScore} = Minor stroke` :
                                 nihssScore <= 15 ? `${nihssScore} = Moderate stroke` :
                                 nihssScore <= 20 ? `${nihssScore} = Moderate-Severe stroke` :
                                 `${nihssScore} = Severe stroke`}
                                {nihssScore >= 6 && nihssScore <= 24 && ' | Consider TNK if within window'}
                                {nihssScore >= 6 && ' | Consider LVO screening'}
                              </div>
                            )}
                          </div>

                          {/* Full NIHSS Calculator (Collapsible) */}
                          <details className="bg-gray-50 border border-gray-200 rounded-lg">
                            <summary className="cursor-pointer p-3 font-semibold text-gray-800 hover:bg-gray-100 rounded-lg">
                              📊 Full NIHSS Calculator (Click to expand)
                            </summary>
                            <div className="p-4 space-y-3">
                              {nihssItems.map((item) => (
                                <div key={item.id} className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-sm mb-2">{item.name}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {item.options.map((option, optionIndex) => (
                                      <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer text-sm">
                                        <input
                                          type="radio"
                                          name={item.id}
                                          value={option}
                                          checked={patientData[item.id] === option}
                                          onChange={(e) => {
                                            const newData = { ...patientData, [item.id]: e.target.value };
                                            setPatientData(newData);
                                            const newScore = calculateNIHSS(newData);
                                            setNihssScore(newScore);
                                            setTelestrokeNote({...telestrokeNote, nihss: newScore.toString()});
                                          }}
                                          className="text-blue-600"
                                        />
                                        <span>{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>

                        {/* Section 4: Vitals & Labs */}
                        <div className="bg-white border-2 border-green-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-green-900">4. Vitals & Labs</h3>
                            <i data-lucide="activity" className="w-5 h-5 text-green-600"></i>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Presenting BP</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={telestrokeNote.presentingBP}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, presentingBP: e.target.value})}
                                    placeholder="185/110"
                                    className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                      (() => {
                                        const bpStatus = getBPThresholdStatus(telestrokeNote.presentingBP);
                                        if (bpStatus.status === 'too_high') return 'border-red-400 bg-red-50';
                                        if (bpStatus.status === 'borderline') return 'border-yellow-400 bg-yellow-50';
                                        if (bpStatus.status === 'ok') return 'border-green-400 bg-green-50';
                                        return 'border-gray-300';
                                      })()
                                    }`}
                                  />
                                  {/* Inline BP Status Badge */}
                                  {(() => {
                                    const bpStatus = getBPThresholdStatus(telestrokeNote.presentingBP);
                                    if (bpStatus.status === 'unknown') return null;
                                    return (
                                      <span className={`px-2 py-1 rounded text-xs font-bold border whitespace-nowrap ${bpStatus.badgeClass}`}>
                                        {bpStatus.icon} {bpStatus.message}
                                      </span>
                                    );
                                  })()}
                                </div>
                                {/* Quick BP Math - how much to lower */}
                                {(() => {
                                  const bpStatus = getBPThresholdStatus(telestrokeNote.presentingBP);
                                  if (!bpStatus.needsLowering) return null;
                                  return (
                                    <div className="mt-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-800 font-medium">
                                      Need to lower by {bpStatus.sbpToLower}/{bpStatus.dbpToLower} mmHg to reach 185/110
                                    </div>
                                  );
                                })()}
                                {(() => {
                                  const bpStatus = getBPThresholdStatus(telestrokeNote.presentingBP);
                                  if (bpStatus.status !== 'too_high') return null;
                                  return (
                                    <div className="mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                      TNK should be held until BP is controlled below 185/110.
                                    </div>
                                  );
                                })()}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current BP (prior to TNK, if applicable)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={telestrokeNote.bpPreTNK}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, bpPreTNK: e.target.value})}
                                    placeholder="185/110"
                                    className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                      (() => {
                                        const bpStatus = getBPThresholdStatus(telestrokeNote.bpPreTNK);
                                        if (bpStatus.status === 'too_high') return 'border-red-400 bg-red-50';
                                        if (bpStatus.status === 'borderline') return 'border-yellow-400 bg-yellow-50';
                                        if (bpStatus.status === 'ok') return 'border-green-400 bg-green-50';
                                        return 'border-gray-300';
                                      })()
                                    }`}
                                  />
                                  <input
                                    type="time"
                                    value={telestrokeNote.bpPreTNKTime}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, bpPreTNKTime: e.target.value})}
                                    className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                  {/* Inline BP Status Badge for Pre-TNK BP */}
                                  {(() => {
                                    const bpStatus = getBPThresholdStatus(telestrokeNote.bpPreTNK);
                                    if (bpStatus.status === 'unknown') return null;
                                    return (
                                      <span className={`px-2 py-1 rounded text-xs font-bold border whitespace-nowrap ${bpStatus.badgeClass}`}>
                                        {bpStatus.icon} {bpStatus.message}
                                      </span>
                                    );
                                  })()}
                                </div>
                                {/* Quick BP Math for Pre-TNK BP */}
                                {(() => {
                                  const bpStatus = getBPThresholdStatus(telestrokeNote.bpPreTNK);
                                  if (!bpStatus.needsLowering) return null;
                                  return (
                                    <div className="mt-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-800 font-medium">
                                      Need to lower by {bpStatus.sbpToLower}/{bpStatus.dbpToLower} mmHg to reach 185/110
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            {/* Post-TNK BP Target Reminder */}
                            {(telestrokeNote.tnkRecommended || telestrokeNote.dtnTnkAdministered) && (
                              <div className="mt-2 px-3 py-2 bg-blue-50 border-l-4 border-blue-500 rounded-r text-sm">
                                <span className="font-bold text-blue-800">Post-TNK Target:</span>
                                <span className="text-blue-700 ml-2">&lt;180/105 for 24 hours after thrombolysis</span>
                              </div>
                            )}
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Glucose</label>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={telestrokeNote.glucose}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, glucose: e.target.value})}
                                    placeholder=""
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                  />
                                  <span className="ml-1 text-xs text-gray-500">mg/dL</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">INR</label>
                                <input
                                  type="number"
                                  value={telestrokeNote.inr}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, inr: e.target.value})}
                                  placeholder=""
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  step="0.1"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Platelets</label>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={telestrokeNote.plateletCount}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, plateletCount: e.target.value})}
                                    placeholder=""
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                  />
                                  <span className="ml-1 text-xs text-gray-500">/μL</span>
                                </div>
                              </div>
                            </div>

                            {/* Critical Timestamps for DTN/DTP */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <h4 className="font-semibold text-yellow-800 mb-2">⏱️ Critical Timestamps</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-gray-600">Door Time (ED Arrival)</label>
                                    <button
                                      type="button"
                                      onClick={() => setTelestrokeNote({...telestrokeNote, doorTime: new Date().toTimeString().slice(0, 5)})}
                                      className="text-[10px] font-semibold text-yellow-800 hover:text-yellow-900"
                                    >
                                      Now
                                    </button>
                                  </div>
                                  <input
                                    type="time"
                                    value={telestrokeNote.doorTime || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, doorTime: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-gray-600">CT Time</label>
                                    <button
                                      type="button"
                                      onClick={() => setTelestrokeNote({...telestrokeNote, ctTime: new Date().toTimeString().slice(0, 5)})}
                                      className="text-[10px] font-semibold text-yellow-800 hover:text-yellow-900"
                                    >
                                      Now
                                    </button>
                                  </div>
                                  <input
                                    type="time"
                                    value={telestrokeNote.ctTime || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, ctTime: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-gray-600">Needle Time (TNK)</label>
                                    <button
                                      type="button"
                                      onClick={() => setTelestrokeNote({...telestrokeNote, needleTime: new Date().toTimeString().slice(0, 5)})}
                                      className="text-[10px] font-semibold text-yellow-800 hover:text-yellow-900"
                                    >
                                      Now
                                    </button>
                                  </div>
                                  <input
                                    type="time"
                                    value={telestrokeNote.needleTime || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, needleTime: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-gray-600">Puncture Time (EVT)</label>
                                    <button
                                      type="button"
                                      onClick={() => setTelestrokeNote({...telestrokeNote, punctureTime: new Date().toTimeString().slice(0, 5)})}
                                      className="text-[10px] font-semibold text-yellow-800 hover:text-yellow-900"
                                    >
                                      Now
                                    </button>
                                  </div>
                                  <input
                                    type="time"
                                    value={telestrokeNote.punctureTime || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, punctureTime: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500"
                                  />
                                </div>
                              </div>

                              {/* DTN/DTP Auto-Calculation */}
                              {(telestrokeNote.doorTime && (telestrokeNote.needleTime || telestrokeNote.punctureTime)) && (
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  {telestrokeNote.needleTime && (() => {
                                    const [doorH, doorM] = telestrokeNote.doorTime.split(':').map(Number);
                                    const [needleH, needleM] = telestrokeNote.needleTime.split(':').map(Number);
                                    let dtn = (needleH * 60 + needleM) - (doorH * 60 + doorM);
                                    if (dtn < 0) dtn += 1440; // Handle midnight crossing
                                    const isGood = dtn <= 60;
                                    return (
                                      <div className={`p-2 rounded text-center ${isGood ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                                        <span className="block text-xs text-gray-600">Door-to-Needle</span>
                                        <span className={`text-xl font-bold ${isGood ? 'text-green-800' : 'text-red-800'}`}>
                                          {dtn} min
                                        </span>
                                        <span className="block text-xs text-gray-500">{isGood ? '✓ Goal ≤60 min' : '⚠ Goal ≤60 min'}</span>
                                      </div>
                                    );
                                  })()}
                                  {telestrokeNote.punctureTime && (() => {
                                    const [doorH, doorM] = telestrokeNote.doorTime.split(':').map(Number);
                                    const [punctureH, punctureM] = telestrokeNote.punctureTime.split(':').map(Number);
                                    let dtp = (punctureH * 60 + punctureM) - (doorH * 60 + doorM);
                                    if (dtp < 0) dtp += 1440; // Handle midnight crossing
                                    const isGood = dtp <= 90;
                                    return (
                                      <div className={`p-2 rounded text-center ${isGood ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                                        <span className="block text-xs text-gray-600">Door-to-Puncture</span>
                                        <span className={`text-xl font-bold ${isGood ? 'text-green-800' : 'text-red-800'}`}>
                                          {dtp} min
                                        </span>
                                        <span className="block text-xs text-gray-500">{isGood ? '✓ Goal ≤90 min' : '⚠ Goal ≤90 min'}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {telestrokeNote.doorTime && (() => {
                                const [doorH, doorM] = telestrokeNote.doorTime.split(':').map(Number);
                                const nowH = currentTime.getHours();
                                const nowM = currentTime.getMinutes();
                                let minutesSinceDoor = (nowH * 60 + nowM) - (doorH * 60 + doorM);
                                if (minutesSinceDoor < 0) minutesSinceDoor += 1440;
                                const tnkRemaining = 60 - minutesSinceDoor;
                                const evtRemaining = 90 - minutesSinceDoor;
                                return (
                                  <div className="mt-3 bg-white border border-yellow-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-yellow-800 mb-2">Live Timers (from door time)</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center">
                                      <div className={`p-2 rounded border ${
                                        tnkRemaining >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                                      }`}>
                                        <p className="text-xs font-medium">TNK goal (60 min)</p>
                                        <p className="text-lg font-bold">
                                          {tnkRemaining >= 0 ? `${tnkRemaining} min left` : `${Math.abs(tnkRemaining)} min over`}
                                        </p>
                                      </div>
                                      <div className={`p-2 rounded border ${
                                        evtRemaining >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                                      }`}>
                                        <p className="text-xs font-medium">EVT goal (90 min)</p>
                                        <p className="text-lg font-bold">
                                          {evtRemaining >= 0 ? `${evtRemaining} min left` : `${Math.abs(evtRemaining)} min over`}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                          </div>
                        </div>

                        {/* Section 5: Imaging Review */}
                        <div className="bg-white border-2 border-indigo-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-indigo-900">5. Imaging Review</h3>
                            <i data-lucide="image" className="w-5 h-5 text-indigo-600"></i>
                          </div>
                          <div className="space-y-3">
                            {/* Non-contrast Head CT */}
                            <div className="bg-gray-50 p-3 rounded border">
                              <h4 className="font-semibold text-gray-700 mb-2">Non-contrast Head CT</h4>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <input
                                  type="date"
                                  value={telestrokeNote.ctDate}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, ctDate: e.target.value})}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="time"
                                  value={telestrokeNote.ctTime}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, ctTime: e.target.value})}
                                  placeholder="Time reviewed"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">CT Results</span>
                              </div>
                              <textarea
                                value={telestrokeNote.ctResults}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, ctResults: e.target.value})}
                                placeholder=""
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Quick ASPECTS Entry */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-blue-800">ASPECTS Score</label>
                                <span className="text-2xl font-bold text-blue-600">{aspectsScore}/10</span>
                              </div>

                              {/* Quick ASPECTS Buttons */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(score => (
                                  <button
                                    key={score}
                                    onClick={() => {
                                      setAspectsScore(score);
                                      // Also update region state to reflect the score
                                      const newState = aspectsRegionState.map((r, idx) => ({
                                        ...r,
                                        checked: idx < score
                                      }));
                                      setAspectsRegionState(newState);
                                    }}
                                    className={`w-8 h-8 rounded-lg text-sm font-bold transition ${
                                      aspectsScore === score ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                                    } ${
                                      score >= 7 ? 'bg-green-100 hover:bg-green-200 text-green-800' :
                                      score >= 6 ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' :
                                      score >= 3 ? 'bg-orange-100 hover:bg-orange-200 text-orange-800' :
                                      'bg-red-100 hover:bg-red-200 text-red-800'
                                    }`}
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>

                              {/* ASPECTS Interpretation */}
                              <div className={`p-2 rounded-lg text-center text-xs font-medium ${
                                aspectsScore >= 7 ? 'bg-green-100 text-green-800' :
                                aspectsScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                aspectsScore >= 3 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {aspectsScore >= 7 ? `ASPECTS ${aspectsScore} = Favorable for EVT (most trials)` :
                                 aspectsScore === 6 ? `ASPECTS 6 = Standard EVT candidate; late window if perfusion mismatch or good collaterals` :
                                 aspectsScore >= 3 ? `ASPECTS ${aspectsScore} = Large core — EVT may benefit (SELECT2/ANGEL-ASPECT/RESCUE-Japan); discuss GOC with family` :
                                 `ASPECTS ${aspectsScore} = Very large core, poor EVT candidate`}
                              </div>
                            </div>

                            {/* ASPECTS Calculator (Collapsible) */}
                            <details className="bg-blue-50 border border-blue-200 rounded-lg">
                              <summary className="cursor-pointer p-3 font-semibold text-blue-800 hover:bg-blue-100 rounded-lg">
                                🧮 Full ASPECTS Calculator (Click to expand)
                              </summary>
                              <div className="p-4">
                                <div className="text-center mb-3">
                                  <span className="text-3xl font-bold text-blue-600">ASPECTS: {aspectsScore}</span>
                                </div>
                                <div className="space-y-2">
                                  {aspectsRegionState.map((region) => (
                                    <label key={region.id} className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={region.checked}
                                        onChange={() => {
                                          const newState = aspectsRegionState.map(r =>
                                            r.id === region.id ? { ...r, checked: !r.checked } : r
                                          );
                                          setAspectsRegionState(newState);
                                          setAspectsScore(newState.filter(r => r.checked).length);
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">{region.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </details>

                            {/* PC-ASPECTS Calculator (Collapsible) */}
                            <details className="bg-purple-50 border border-purple-200 rounded-lg">
                              <summary className="cursor-pointer p-3 font-semibold text-purple-800 hover:bg-purple-100 rounded-lg">
                                🧮 PC-ASPECTS Calculator (Posterior Circulation)
                              </summary>
                              <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <p className="text-sm text-gray-700">Start at 10 points, subtract points for affected regions:</p>
                                  <div className="text-center">
                                    <span className="text-3xl font-bold text-purple-600">PC-ASPECTS: {calculatePCAspects(pcAspectsRegions)}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {pcAspectsRegions.map((region, idx) => (
                                    <label key={region.id} className="flex items-center gap-2 p-2 hover:bg-purple-50 rounded cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={region.checked}
                                        onChange={(e) => {
                                          const newRegions = [...pcAspectsRegions];
                                          newRegions[idx].checked = e.target.checked;
                                          setPcAspectsRegions(newRegions);
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm flex-1">{region.name}</span>
                                      <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                                        {region.points} {region.points === 1 ? 'point' : 'points'}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </details>

                            {/* CTA Head & Neck */}
                            <div className="bg-gray-50 p-3 rounded border">
                              <h4 className="font-semibold text-gray-700 mb-2">CTA Head & Neck</h4>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <input
                                  type="date"
                                  value={telestrokeNote.ctaDate}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, ctaDate: e.target.value})}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="time"
                                  value={telestrokeNote.ctaTime}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, ctaTime: e.target.value})}
                                  placeholder="Time reviewed"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">CTA Results</span>
                              </div>
                              <textarea
                                value={telestrokeNote.ctaResults}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, ctaResults: e.target.value})}
                                placeholder=""
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />

                              {/* Vessel Occlusion Quick Select for Trial Eligibility */}
                              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs font-semibold text-blue-800 mb-2">
                                  🔬 Vessel Occlusion <span className="font-normal">(for trial screening)</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {['ICA', 'M1', 'M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3'].map(vessel => (
                                    <label key={vessel} className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={(telestrokeNote.vesselOcclusion || []).includes(vessel)}
                                        onChange={(e) => {
                                          const current = telestrokeNote.vesselOcclusion || [];
                                          const updated = e.target.checked
                                            ? [...current, vessel]
                                            : current.filter(v => v !== vessel);
                                          setTelestrokeNote({...telestrokeNote, vesselOcclusion: updated});
                                        }}
                                        className="w-3 h-3"
                                      />
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (telestrokeNote.vesselOcclusion || []).includes(vessel)
                                          ? 'bg-blue-600 text-white font-semibold'
                                          : 'bg-gray-200 text-gray-700'
                                      }`}>{vessel}</span>
                                    </label>
                                  ))}
                                  {(telestrokeNote.vesselOcclusion || []).length === 0 && (
                                    <span className="text-xs text-gray-500 italic">None selected</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* CT Perfusion */}
                            <div className="bg-gray-50 p-3 rounded border">
                              <h4 className="font-semibold text-gray-700 mb-2">CT Perfusion</h4>
                              <textarea
                                value={telestrokeNote.ctpResults}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, ctpResults: e.target.value})}
                                placeholder=""
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 6: Treatment Decision */}
                        <div id="treatment-decision" ref={treatmentDecisionRef} className="bg-white border-2 border-orange-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-orange-900">6. Treatment Decision</h3>
                            <i data-lucide="zap" className="w-5 h-5 text-orange-600"></i>
                          </div>

                          {/* Auto Treatment Recommendation */}
                          {(() => {
                            const timeFromLKW = calculateTimeFromLKW();
                            const hoursFromLKW = timeFromLKW ? timeFromLKW.total : null;
                            const nihss = parseInt(telestrokeNote.nihss) || nihssScore || 0;
                            const aspects = aspectsScore;
                            const age = parseInt(telestrokeNote.age) || 0;
                            const contraindications = detectContraindications({ telestrokeNote });
                            const criticalContraindications = contraindications.filter(c => c.severity === 'critical');

                            // Determine TNK recommendation
                            let tnkRec = { eligible: false, reason: '', confidence: 'low' };
                            let evtRec = { eligible: false, reason: '', confidence: 'low' };

                            // TNK Logic
                            if (criticalContraindications.length > 0) {
                              tnkRec = { eligible: false, reason: 'Absolute contraindication(s) present', confidence: 'high' };
                            } else if (!hoursFromLKW) {
                              tnkRec = { eligible: false, reason: 'Set LKW time to evaluate', confidence: 'low' };
                            } else if (nihss < 4 && !telestrokeNote.nihssDetails) {
                              tnkRec = { eligible: false, reason: `NIHSS ${nihss} - minor stroke, TNK not typically indicated`, confidence: 'medium' };
                            } else if (hoursFromLKW <= 4.5) {
                              if (nihss >= 4 || telestrokeNote.nihssDetails) {
                                tnkRec = { eligible: true, reason: `Within 4.5h window, NIHSS ${nihss}`, confidence: 'high' };
                              }
                            } else if (hoursFromLKW > 4.5 && hoursFromLKW <= 24) {
                              tnkRec = { eligible: true, reason: `Extended window (${hoursFromLKW.toFixed(1)}h) — TNK may be given if perfusion mismatch present (TIMELESS criteria: core <70 mL, ratio >1.2). Obtain CTP/MRI.`, confidence: 'medium' };
                            } else if (hoursFromLKW > 24) {
                              tnkRec = { eligible: false, reason: 'Outside all TNK windows (>24h)', confidence: 'high' };
                            }

                            // EVT Logic
                            if (!hoursFromLKW) {
                              evtRec = { eligible: false, reason: 'Set LKW time to evaluate', confidence: 'low' };
                            } else if (nihss >= 6 && hoursFromLKW <= 24) {
                              if (aspects >= 7 && hoursFromLKW <= 6) {
                                evtRec = { eligible: true, reason: `Early window, NIHSS ${nihss}, ASPECTS ${aspects}`, confidence: 'high' };
                              } else if (aspects >= 6 && hoursFromLKW > 6 && hoursFromLKW <= 24) {
                                evtRec = { eligible: true, reason: `Late window eligible (DAWN/DEFUSE criteria likely met)`, confidence: 'medium' };
                              } else if (aspects >= 3 && hoursFromLKW <= 24) {
                                evtRec = { eligible: true, reason: `Large core - may qualify under SELECT2/RESCUE-Japan`, confidence: 'medium' };
                              } else if (aspects < 3) {
                                evtRec = { eligible: false, reason: `ASPECTS ${aspects} too low for EVT`, confidence: 'high' };
                              }
                            } else if (nihss < 6) {
                              evtRec = { eligible: false, reason: `NIHSS ${nihss} - consider if LVO present (STEP trial)`, confidence: 'medium' };
                            } else if (hoursFromLKW > 24) {
                              evtRec = { eligible: false, reason: 'Outside EVT window (>24h)', confidence: 'high' };
                            }

                            // Only show if we have some data to work with
                            if (!age && !nihss && !hoursFromLKW) return null;

                            return (
                              <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-lg font-bold text-blue-900">Recommendation</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* TNK Recommendation */}
                                  <div className={`p-3 rounded-lg border-2 ${
                                    tnkRec.eligible ? 'bg-green-100 border-green-400' :
                                    tnkRec.confidence === 'low' ? 'bg-gray-100 border-gray-300' :
                                    'bg-red-50 border-red-300'
                                  }`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-bold text-gray-800">TNK (Thrombolysis)</span>
                                      {tnkRec.eligible ? (
                                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">CONSIDER</span>
                                      ) : tnkRec.confidence === 'low' ? (
                                        <span className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded">PENDING</span>
                                      ) : (
                                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">NOT INDICATED</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700">{tnkRec.reason}</p>
                                  </div>

                                  {/* EVT Recommendation */}
                                  <div className={`p-3 rounded-lg border-2 ${
                                    evtRec.eligible ? 'bg-purple-100 border-purple-400' :
                                    evtRec.confidence === 'low' ? 'bg-gray-100 border-gray-300' :
                                    'bg-red-50 border-red-300'
                                  }`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-bold text-gray-800">EVT (Thrombectomy)</span>
                                      {evtRec.eligible ? (
                                        <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded">CONSIDER</span>
                                      ) : evtRec.confidence === 'low' ? (
                                        <span className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded">PENDING</span>
                                      ) : (
                                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">NOT INDICATED</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700">{evtRec.reason}</p>
                                  </div>
                                </div>

                              </div>
                            );
                          })()}

                          {/* Active Contraindication Alerts */}
                          {(() => {
                            const contraindications = detectContraindications({
                              telestrokeNote
                            });
                            if (contraindications.length === 0) return null;

                            const criticalAlerts = contraindications.filter(c => c.severity === 'critical');
                            const warningAlerts = contraindications.filter(c => c.severity === 'warning');
                            const infoAlerts = contraindications.filter(c => c.severity === 'info');

                            return (
                              <div className="mb-3 space-y-2">
                                {criticalAlerts.length > 0 && (
                                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-red-700 font-bold">🚨 CRITICAL CONTRAINDICATION{criticalAlerts.length > 1 ? 'S' : ''}</span>
                                    </div>
                                    <ul className="space-y-1">
                                      {criticalAlerts.map((alert, idx) => (
                                        <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                                          <span className="text-red-500">•</span>
                                          <span><strong>{alert.label}:</strong> {alert.message}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {warningAlerts.length > 0 && (
                                  <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-amber-700 font-bold">⚠️ CAUTION{warningAlerts.length > 1 ? 'S' : ''}</span>
                                    </div>
                                    <ul className="space-y-1">
                                      {warningAlerts.map((alert, idx) => (
                                        <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                                          <span className="text-amber-500">•</span>
                                          <span><strong>{alert.label}:</strong> {alert.message}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {infoAlerts.length > 0 && (
                                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-2">
                                    <ul className="space-y-1">
                                      {infoAlerts.map((alert, idx) => (
                                        <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                                          <span className="text-blue-500">ℹ️</span>
                                          <span>{alert.message}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-slate-700">Decision Log</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  const label = prompt('Decision label (e.g., TNK held, transfer declined)');
                                  if (!label) return;
                                  addDecisionLogEntry(label.trim());
                                }}
                                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                              >
                                Add timestamp
                              </button>
                            </div>
                            {(telestrokeNote.decisionLog || []).length > 0 ? (
                              <ul className="space-y-1 text-xs text-slate-700">
                                {telestrokeNote.decisionLog.slice(0, 6).map((entry) => (
                                  <li key={entry.id} className="flex items-center justify-between">
                                    <span className="font-medium">{entry.label}{entry.detail ? ` — ${entry.detail}` : ''}</span>
                                    <span className="text-slate-500">{entry.time}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-500">No decisions logged yet.</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>

                              {/* Diagnosis Category Selector */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                {[
                                  { value: 'ischemic', label: 'Ischemic Stroke or TIA', color: 'blue', icon: 'activity' },
                                  { value: 'ich', label: 'Intracranial Hemorrhage', color: 'red', icon: 'alert-triangle' },
                                  { value: 'sah', label: 'SAH', color: 'purple', icon: 'zap' },
                                  { value: 'cvt', label: 'CVT', color: 'indigo', icon: 'git-branch' },
                                  { value: 'mimic', label: 'Stroke Mimic/Other', color: 'amber', icon: 'eye-off' }
                                ].map(option => {
                                  const isSelected = telestrokeNote.diagnosisCategory === option.value;
                                  const colorMap2 = {
                                    blue: 'bg-blue-500 text-white border-blue-500',
                                    red: 'bg-red-500 text-white border-red-500',
                                    purple: 'bg-purple-500 text-white border-purple-500',
                                    indigo: 'bg-indigo-500 text-white border-indigo-500',
                                    amber: 'bg-amber-500 text-white border-amber-500'
                                  };
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => {
                                        const newCategory = option.value;
                                        let newDiagnosis = '';
                                        if (newCategory === 'ischemic') {
                                          newDiagnosis = 'Suspected acute ischemic stroke';
                                        } else if (newCategory === 'ich') {
                                          newDiagnosis = 'Intracerebral hemorrhage (ICH)';
                                        } else if (newCategory === 'sah') {
                                          newDiagnosis = 'Subarachnoid hemorrhage (SAH)';
                                        } else if (newCategory === 'cvt') {
                                          newDiagnosis = 'Cerebral venous thrombosis (CVT)';
                                        } else if (newCategory === 'mimic') {
                                          newDiagnosis = 'Stroke mimic';
                                        }
                                        setTelestrokeNote({
                                          ...telestrokeNote,
                                          diagnosisCategory: newCategory,
                                          diagnosis: newDiagnosis
                                        });
                                      }}
                                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                                        isSelected
                                          ? (colorMap2[option.color] || 'bg-gray-500 text-white border-gray-500')
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                      }`}
                                    >
                                      <i data-lucide={option.icon} className="w-4 h-4"></i>
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Free text for Other or additional details */}
                              {telestrokeNote.diagnosisCategory === 'other' && (
                                <input
                                  type="text"
                                  value={telestrokeNote.diagnosis}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, diagnosis: e.target.value})}
                                  placeholder="Specify diagnosis..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              )}

                              {/* Show selected diagnosis */}
                              {telestrokeNote.diagnosisCategory && telestrokeNote.diagnosisCategory !== 'other' && (
                                <div className={`px-3 py-2 rounded-lg text-sm ${
                                  telestrokeNote.diagnosisCategory === 'ischemic' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                  telestrokeNote.diagnosisCategory === 'ich' ? 'bg-red-50 text-red-800 border border-red-200' :
                                  telestrokeNote.diagnosisCategory === 'mimic' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                  'bg-gray-50 text-gray-800 border border-gray-200'
                                }`}>
                                  <strong>Dx:</strong> {telestrokeNote.diagnosis}
                                </div>
                              )}

                              {/* Active Trials List - Show for Ischemic or ICH */}
                              {showAdvanced && telestrokeNote.diagnosisCategory === 'ischemic' && (
                                <div className="mt-3 text-sm">
                                  <div className="font-medium text-gray-700 mb-1">Active Ischemic Stroke Trials:</div>
                                  <ul className="text-gray-600 space-y-0.5 ml-4">
                                    <li>• <strong>SISTER</strong> – Late thrombolysis (4.5-24h), no TNK/EVT</li>
                                    <li>• <strong>STEP-EVT</strong> – Mild LVO or medium/distal vessel occlusions</li>
                                    <li>• <strong>PICASSO</strong> – Tandem lesion (carotid + intracranial LVO)</li>
                                    <li>• <strong>TESTED</strong> – EVT in pre-existing disability (mRS 3-4)</li>
                                    <li>• <strong>VERIFY</strong> – TMS/MRI to predict motor recovery</li>
                                    <li>• <strong>DISCOVERY</strong> – Cognitive trajectories post-stroke</li>
                                    <li>• <strong>ESUS Imaging</strong> – Cardiac/vessel wall MRI for ESUS</li>
                                    <li>• <strong>MOCHA Imaging</strong> – Intracranial vessel-wall analysis for ICAD</li>
                                  </ul>
                                </div>
                              )}
                              {showAdvanced && telestrokeNote.diagnosisCategory === 'ich' && (
                                <div className="mt-3 text-sm">
                                  <div className="font-medium text-gray-700 mb-1">Active ICH Trials:</div>
                                  <ul className="text-gray-600 space-y-0.5 ml-4">
                                    <li>• <strong>FASTEST</strong> – rFVIIa within 2h for hematoma expansion</li>
                                    <li>• <strong>SATURN</strong> – Statin continuation vs stop after lobar ICH</li>
                                    <li>• <strong>ASPIRE</strong> – Apixaban vs aspirin post-ICH with AF</li>
                                    <li>• <strong>cAPPricorn-1</strong> – Intrathecal mivelsiran for CAA</li>
                                    <li>• <strong>MIRROR Registry</strong> – Minimally invasive ICH evacuation</li>
                                    <li>• <strong>DISCOVERY</strong> – Cognitive trajectories post-ICH</li>
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* ICH Pathway Checkboxes */}
                            {telestrokeNote.diagnosisCategory === 'ich' && (
                              <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                                <h4 className="text-sm font-bold text-red-800 mb-2 uppercase tracking-wide">ICH Pathway Checklist</h4>
                                <div className="space-y-2">
                                  {[
                                    { field: 'ichBPManaged', label: 'BP managed (SBP 130-150 target)', detail: 'AHA/ASA ICH 2022' },
                                    { field: 'ichReversalOrdered', label: 'Anticoag reversal ordered (if applicable)', detail: 'Skip if no anticoagulants', skipIf: telestrokeNote.noAnticoagulants },
                                    { field: 'ichNeurosurgeryConsulted', label: 'Neurosurgery consulted/evaluated', detail: 'Surgical candidacy assessed' }
                                  ].filter(item => !item.skipIf).map(item => (
                                    <label key={item.field} className="flex items-start gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={telestrokeNote[item.field] || false}
                                        onChange={(e) => setTelestrokeNote({ ...telestrokeNote, [item.field]: e.target.checked })}
                                        className="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500"
                                      />
                                      <div>
                                        <span className="text-sm font-medium text-red-900">{item.label}</span>
                                        <span className="text-xs text-red-600 block">{item.detail}</span>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lytic Eligibility Criteria (Collapsible) */}
                            {showAdvanced && (
                            <details className="bg-green-50 border border-green-200 rounded-lg">
                              <summary className="cursor-pointer p-3 font-semibold text-green-800 hover:bg-green-100 rounded-lg">
                                ✓ TNK Eligibility Criteria (Click to expand)
                              </summary>
                              <div className="p-4 space-y-3 text-sm">
                                <div>
                                  <h4 className="font-semibold text-green-700 mb-2">Standard Window (&le;4.5h) — TNK 0.25 mg/kg IV bolus (max 25 mg):</h4>
                                  <ul className="space-y-1 ml-4">
                                    <li>• Diagnosis of ischemic stroke causing measurable neurologic deficit</li>
                                    <li>• Age ≥18 years</li>
                                    <li>• Onset of symptoms &lt;4.5 hours from LKW</li>
                                    <li>• Class I, LOE A (AHA/ASA 2026)</li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-teal-700 mb-2">Extended Window (4.5-24h) — TIMELESS Criteria:</h4>
                                  <ul className="space-y-1 ml-4">
                                    <li>• TNK 0.25 mg/kg IV bolus (max 25 mg) in 4.5-24h window</li>
                                    <li>• Requires CT Perfusion or MRI DWI/perfusion</li>
                                    <li>• Ischemic core &lt;70 mL with mismatch ratio &gt;1.2</li>
                                    <li>• No hemorrhage on imaging</li>
                                    <li>• Class IIa, LOE B-R (TIMELESS 2025, EXTEND, WAKE-UP)</li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-teal-700 mb-2">WAKE-UP Stroke:</h4>
                                  <ul className="space-y-1 ml-4">
                                    <li>• LKW unclear + NO LVO</li>
                                    <li>• MRI with DWI-FLAIR mismatch (DWI+, FLAIR-)</li>
                                    <li>• TNK 0.25 mg/kg IV bolus (max 25 mg)</li>
                                    <li>• Discuss lower certainty of benefit and hemorrhage risk</li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-amber-700 mb-2">2026 Relaxed Contraindication Notes:</h4>
                                  <ul className="space-y-1 ml-4">
                                    <li>• Pregnancy is a relative (not absolute) contraindication — consult OB/GYN</li>
                                    <li>• Prior stroke &lt;90 days: relative CI; weigh severity of current vs prior</li>
                                    <li>• Extra-axial intracranial neoplasm: NOT a contraindication</li>
                                    <li>• Seizure at onset: may treat if deficit clearly from stroke, not postictal</li>
                                    <li>• Lecanemab / anti-amyloid therapy: relative CI due to ARIA risk</li>
                                    <li>• DOAC within 48h: check drug-specific assay; if below threshold, may treat</li>
                                  </ul>
                                </div>
                              </div>
                            </details>
                            )}

                            {/* ========== TNK CONTRAINDICATIONS ========== */}
                            {(() => {
                              const checklist = telestrokeNote.tnkContraindicationChecklist || {};

                              const absoluteContraindications = [
                                // Imaging Exclusions
                                { id: 'currentICH', label: 'CT with evidence of hemorrhage', note: null },
                                { id: 'extensiveHypoattenuation', label: 'CT with extensive regions of clear hypoattenuation', note: null },
                                { id: 'largeInfarct', label: 'Ischemic injury >1/3 of MCA territory', note: null },
                                { id: 'intracranialTumor', label: 'Intra-axial intracranial tumor', note: 'extra-axial not absolute' },
                                { id: 'aorticDissection', label: 'Aortic arch dissection', note: null },
                                // Clinical Exclusions
                                { id: 'recentStroke', label: 'Recent stroke', note: '<90 days' },
                                { id: 'recentHeadTrauma', label: 'Recent severe head trauma', note: '<90 days' },
                                { id: 'recentIntracranialSurgery', label: 'Recent intracranial/intraspinal surgery', note: '<60 days' },
                                { id: 'activeInternalBleeding', label: 'Active internal bleeding', note: null },
                                { id: 'giMalignancy', label: 'GI malignancy', note: null },
                                { id: 'sahPresentation', label: 'Clinical presentation suggestive of SAH', note: 'even if CT normal' },
                                { id: 'infectiveEndocarditis', label: 'Presentation consistent with infective endocarditis', note: null },
                                // Lab/Vital Exclusions
                                { id: 'severeUncontrolledHTN', label: 'SBP >185 or DBP >110 mmHg', note: 'unresponsive to treatment' },
                                { id: 'lowPlatelets', label: 'Platelet count <100,000', note: null },
                                { id: 'lowGlucose', label: 'Blood glucose <50 mg/dL', note: null },
                                { id: 'warfarinElevatedINR', label: 'Warfarin use with PT >15s, INR >1.7, or aPTT >40s', note: null },
                                { id: 'recentDOAC', label: 'Recent DOAC use', note: '<48h' },
                                { id: 'recentHeparin', label: 'Treatment-dose heparin/LMWH', note: '<24 hours' }
                              ];

                              const relativeContraindications = [
                                // Cautionary - Consider risks/benefits
                                { id: 'priorICH', label: 'Prior known non-traumatic intracranial hemorrhage', note: null },
                                { id: 'vascularMalformation', label: 'Intracranial vascular malformation', note: 'unless severe neuro sx' },
                                { id: 'intracranialAneurysm', label: 'Intracranial aneurysm', note: null },
                                { id: 'knownBleedingDiathesis', label: 'Known bleeding diathesis', note: null },
                                { id: 'pregnancy', label: 'Pregnancy', note: 'consult OB/GYN ASAP' },
                                { id: 'recentMajorSurgery', label: 'Major extracranial surgery or trauma', note: '<14 days' },
                                { id: 'recentGIGUBleeding', label: 'Recent GI/urinary tract hemorrhage', note: '<21 days' },
                                { id: 'recentMI', label: 'Acute or recent MI', note: '<3 months, depends on type' },
                                { id: 'acutePericarditis', label: 'Acute pericarditis', note: null },
                                { id: 'recentArterialPuncture', label: 'Recent arterial puncture at non-compressible site', note: '<7 days' },
                                { id: 'recentLumbarPuncture', label: 'Recent lumbar puncture', note: '<7 days' },
                                { id: 'seizureAtOnset', label: 'Seizure at onset with postictal deficits', note: 'consider stroke mimic' },
                                { id: 'abnormalCoagUnknown', label: 'Abnormal aPTT, TT, or anti-Xa with unknown anticoagulant use', note: null },
                                { id: 'cerebralMicrobleeds', label: 'Cerebral microbleeds >10 on prior MRI', note: 'increased ICH risk' },
                                { id: 'lecanemab', label: 'Lecanemab or other Alzheimer medications', note: 'ARIA risk' },
                                { id: 'highGlucose', label: 'Blood glucose >400 mg/dL', note: 'correct before treatment' }
                              ];

                              const autoDetected = {};
                              const glucoseVal = parseFloat(telestrokeNote.glucose);
                              if (!isNaN(glucoseVal) && glucoseVal < 50) autoDetected.lowGlucose = true;
                              if (!isNaN(glucoseVal) && glucoseVal > 400) autoDetected.highGlucose = true;
                              const inrVal = parseFloat(telestrokeNote.inr);
                              if (!isNaN(inrVal) && inrVal > 1.7) autoDetected.warfarinElevatedINR = true;
                              const pttVal = parseFloat(telestrokeNote.ptt);
                              if (!isNaN(pttVal) && pttVal > 40) autoDetected.warfarinElevatedINR = true;
                              const plateletsVal = parseFloat(telestrokeNote.plateletCount);
                              if (!isNaN(plateletsVal) && plateletsVal < 100000) autoDetected.lowPlatelets = true;
                              const bpVal = telestrokeNote.presentingBP || '';
                              const bpMatchVal = bpVal.match(/(\d+)\s*\/\s*(\d+)/);
                              if (bpMatchVal && (parseInt(bpMatchVal[1]) > 185 || parseInt(bpMatchVal[2]) > 110)) autoDetected.severeUncontrolledHTN = true;
                              // DOAC detection
                              if (telestrokeNote.lastDOACType && telestrokeNote.lastDOACType !== '' && telestrokeNote.lastDOACType !== 'none' && telestrokeNote.lastDOACType !== 'warfarin' && telestrokeNote.lastDOACType !== 'heparin') {
                                if (telestrokeNote.lastDOACDose) {
                                  const hoursSinceDOAC = (new Date() - new Date(telestrokeNote.lastDOACDose)) / (1000 * 60 * 60);
                                  if (hoursSinceDOAC < 48) autoDetected.recentDOAC = true;
                                } else { autoDetected.recentDOAC = true; }
                              }
                              // Heparin detection
                              if (telestrokeNote.lastDOACType === 'heparin') {
                                if (telestrokeNote.lastDOACDose) {
                                  const hoursSinceHeparin = (new Date() - new Date(telestrokeNote.lastDOACDose)) / (1000 * 60 * 60);
                                  if (hoursSinceHeparin < 24) autoDetected.recentHeparin = true;
                                } else { autoDetected.recentHeparin = true; }
                              }
                              // Warfarin with elevated INR
                              if (telestrokeNote.lastDOACType === 'warfarin' && !isNaN(inrVal) && inrVal > 1.7) {
                                autoDetected.warfarinElevatedINR = true;
                              }

                              const absoluteChecked = absoluteContraindications.filter(c => checklist[c.id] || autoDetected[c.id]);
                              const relativeChecked = relativeContraindications.filter(c => checklist[c.id] || autoDetected[c.id]);

                              let badgeColor, badgeText, badgeIcon;
                              if (absoluteChecked.length > 0) { badgeColor = 'bg-red-500 text-white'; badgeText = 'Absolute CI (' + absoluteChecked.length + ')'; badgeIcon = 'X'; }
                              else if (relativeChecked.length > 0) { badgeColor = 'bg-amber-500 text-white'; badgeText = relativeChecked.length + ' relative'; badgeIcon = '!'; }
                              else if (telestrokeNote.tnkContraindicationReviewed) { badgeColor = 'bg-green-500 text-white'; badgeText = 'No contraindications'; badgeIcon = 'check'; }
                              else { badgeColor = 'bg-gray-400 text-white'; badgeText = 'Not reviewed'; badgeIcon = '?'; }

                              const updateChecklistItem = (id, value) => setTelestrokeNote({...telestrokeNote, tnkContraindicationChecklist: {...telestrokeNote.tnkContraindicationChecklist, [id]: value}});

                              const clearAllAndProceed = () => {
                                const clearedChecklist = {};
                                [...absoluteContraindications, ...relativeContraindications].forEach(c => { clearedChecklist[c.id] = false; });
                                setTelestrokeNote({...telestrokeNote, tnkContraindicationChecklist: clearedChecklist, tnkContraindicationReviewed: true, tnkContraindicationReviewTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), tnkRecommended: true});
                              };

                              return (
                                <details id="tnk-contraindications" className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg">
                                  <summary className="cursor-pointer p-3 font-semibold text-orange-900 hover:bg-orange-100 rounded-lg flex items-center justify-between">
                                    <span>TNK Contraindications</span>
                                    <span className={'px-3 py-1 rounded-full text-xs font-bold ' + badgeColor}>
                                      {badgeIcon === 'check' && <span>&#10003; </span>}
                                      {badgeIcon === '!' && <span>&#9888; </span>}
                                      {badgeIcon === 'X' && <span>&#10007; </span>}
                                      {badgeText}
                                    </span>
                                  </summary>
                                  <div className="p-4 space-y-4">
                                    {absoluteChecked.length > 0 && (
                                      <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm text-red-800">
                                        <strong>Absolute contraindications detected.</strong> TNK should not be given unless these are ruled out or overridden.
                                      </div>
                                    )}
                                    {telestrokeNote.tnkRecommended && absoluteChecked.length > 0 && (
                                      <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800">
                                        <strong>Warning:</strong> TNK is marked recommended while absolute contraindications are present.
                                      </div>
                                    )}
                                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-orange-200 rounded-lg px-3 py-2">
                                      <div className="text-sm text-orange-800">
                                        <strong>Review status:</strong>{' '}
                                        {telestrokeNote.tnkContraindicationReviewed
                                          ? `Reviewed at ${telestrokeNote.tnkContraindicationReviewTime || '—'}`
                                          : 'Not reviewed'}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setTelestrokeNote({
                                          ...telestrokeNote,
                                          tnkContraindicationReviewed: true,
                                          tnkContraindicationReviewTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                        })}
                                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700"
                                      >
                                        Mark Reviewed
                                      </button>
                                    </div>
                                    <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                                      <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs">ABSOLUTE</span>
                                        Contraindications - TNK is contraindicated if ANY checked
                                      </h4>
                                      <div className="space-y-2">
                                        {absoluteContraindications.map(item => {
                                          const isAutoDetected = autoDetected[item.id];
                                          const isChecked = checklist[item.id] || isAutoDetected;
                                          return (
                                            <label key={item.id} className={'flex items-start gap-2 p-2 rounded cursor-pointer transition ' + (isChecked ? 'bg-red-200' : 'hover:bg-red-50')}>
                                              <input type="checkbox" checked={isChecked} onChange={(e) => updateChecklistItem(item.id, e.target.checked)} className="w-4 h-4 mt-0.5 accent-red-600" />
                                              <div className="flex-1">
                                                <span className={'text-sm ' + (isChecked ? 'text-red-900 font-semibold' : 'text-gray-800')}>{item.label}</span>
                                                {item.note && <span className="text-xs text-red-600 ml-1">({item.note})</span>}
                                                {isAutoDetected && <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">Auto-detected</span>}
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                                      <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs">RELATIVE</span>
                                        Contraindications - Use clinical judgment
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {relativeContraindications.map(item => {
                                          const isAutoDetected = autoDetected[item.id];
                                          const isChecked = checklist[item.id] || isAutoDetected;
                                          return (
                                            <label key={item.id} className={'flex items-start gap-2 p-2 rounded cursor-pointer transition ' + (isChecked ? 'bg-amber-200' : 'hover:bg-amber-100')}>
                                              <input type="checkbox" checked={isChecked} onChange={(e) => updateChecklistItem(item.id, e.target.checked)} className="w-4 h-4 mt-0.5 accent-amber-600" />
                                              <div className="flex-1">
                                                <span className={'text-sm ' + (isChecked ? 'text-amber-900 font-semibold' : 'text-gray-800')}>{item.label}</span>
                                                {item.note && <span className="text-xs text-amber-600 block">({item.note})</span>}
                                                {isAutoDetected && <span className="ml-2 text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded">Auto-detected</span>}
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                                      <div className="text-sm text-gray-600">
                                        {telestrokeNote.tnkContraindicationReviewed && <span className="text-green-700">Reviewed at {telestrokeNote.tnkContraindicationReviewTime}</span>}
                                      </div>
                                      <div className="flex gap-2">
                                        {absoluteChecked.length === 0 && (
                                          <button onClick={clearAllAndProceed} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
                                            <span>&#10003;</span> All reviewed - Proceed with TNK
                                          </button>
                                        )}
                                        {absoluteChecked.length > 0 && (
                                          <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold border border-red-300">
                                            &#10007; TNK Contraindicated - {absoluteChecked.length} absolute CI{absoluteChecked.length > 1 ? 's' : ''}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </details>
                              );
                            })()}

                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={telestrokeNote.tnkRecommended}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, tnkRecommended: e.target.checked})}
                                className="w-4 h-4"
                              />
                              TNK Recommended
                            </label>

                            {telestrokeNote.tnkRecommended && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-3">
                                {/* TNK Dosing Calculator */}
                                <div className="bg-white border border-green-300 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-green-800">💉 TNK Dosing Calculator</span>
                                    <span className="text-xs text-gray-500">0.25 mg/kg, max 25 mg</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <label className="text-sm text-gray-700">Weight:</label>
                                    <input
                                      type="number"
                                      value={telestrokeNote.weight}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, weight: e.target.value})}
                                      placeholder="kg"
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                      min="0"
                                      step="0.1"
                                    />
                                    <span className="text-xs text-gray-500">kg</span>
                                  </div>

                                  {(() => {
                                    const doseCalc = calculateTNKDose(telestrokeNote.weight);
                                    if (!doseCalc) {
                                      return (
                                        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                                          ⚠️ Enter patient weight to calculate TNK dose
                                        </div>
                                      );
                                    }
                                    // Calculate volume: TNK is 50mg/10mL = 5mg/mL, so volume = dose/5
                                    const volumeMl = (parseFloat(doseCalc.calculatedDose) / 5).toFixed(1);
                                    return (
                                      <div className={`rounded-xl shadow-lg overflow-hidden ${doseCalc.isMaxDose ? 'ring-2 ring-amber-400' : 'ring-2 ring-green-400'}`}>
                                        {/* Header */}
                                        <div className={`px-4 py-2 ${doseCalc.isMaxDose ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}>
                                          <div className="flex items-center justify-between">
                                            <span className="text-white font-bold text-lg flex items-center gap-2">
                                              <span className="text-2xl">💉</span>
                                              TNK DOSING
                                            </span>
                                            {doseCalc.isMaxDose && (
                                              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                                MAX DOSE
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {/* Dose Display */}
                                        <div className={`px-4 py-4 ${doseCalc.isMaxDose ? 'bg-gradient-to-br from-amber-50 to-amber-100' : 'bg-gradient-to-br from-green-50 to-emerald-100'}`}>
                                          <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className={`p-3 rounded-lg ${doseCalc.isMaxDose ? 'bg-amber-200/50' : 'bg-green-200/50'}`}>
                                              <div className="text-3xl font-black text-gray-900">{doseCalc.calculatedDose}</div>
                                              <div className="text-sm font-medium text-gray-600">mg</div>
                                            </div>
                                            <div className={`p-3 rounded-lg ${doseCalc.isMaxDose ? 'bg-amber-200/50' : 'bg-green-200/50'}`}>
                                              <div className="text-3xl font-black text-gray-900">{volumeMl}</div>
                                              <div className="text-sm font-medium text-gray-600">mL</div>
                                            </div>
                                            <div className={`p-3 rounded-lg ${doseCalc.isMaxDose ? 'bg-amber-200/50' : 'bg-green-200/50'}`}>
                                              <div className="text-3xl font-black text-gray-900">{doseCalc.weightKg}</div>
                                              <div className="text-sm font-medium text-gray-600">kg</div>
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500 text-center mt-2">
                                            {doseCalc.weightKg} kg × 0.25 mg/kg = {(doseCalc.weightKg * 0.25).toFixed(1)} mg
                                            {doseCalc.isMaxDose && ' → capped at 25 mg max'}
                                          </div>
                                          <div className="text-xs text-gray-400 text-center mt-1">
                                            Reconstitute: 50mg vial + 10mL sterile water = 5 mg/mL
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={telestrokeNote.tnkConsentDiscussed}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, tnkConsentDiscussed: e.target.checked})}
                                    className="w-4 h-4"
                                  />
                                  Risks/benefits discussed with patient and family
                                </label>
                                {telestrokeNote.tnkConsentDiscussed && (
                                  <div className="bg-white border border-purple-200 rounded-lg p-3 space-y-2">
                                    <p className="text-sm text-gray-700">
                                      We recommend a medication called Tenecteplase (TNK), which is a "clot-buster" drug. TNK reduces the risk of being disabled; people who get TNK have an improved chance of recovering without disability than people who don't get the medication. All medications have risks – the main risk is bleeding, up to 4% of people develop bleeding in the brain that leads to new symptoms. Very rarely, people have an allergic reaction. The potential benefits are thought to be higher than the potential risks and we recommend TNK is administered. Time is very important here - the sooner the treatment is started, the higher the likelihood of benefit.
                                    </p>

                                    <div className="mt-3 space-y-2">
                                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={telestrokeNote.patientFamilyConsent}
                                          onChange={(e) => setTelestrokeNote({...telestrokeNote, patientFamilyConsent: e.target.checked})}
                                          className="w-4 h-4"
                                        />
                                        Patient/family provides consent
                                      </label>
                                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={telestrokeNote.presumedConsent}
                                          onChange={(e) => setTelestrokeNote({...telestrokeNote, presumedConsent: e.target.checked})}
                                          className="w-4 h-4"
                                        />
                                        Presumed consent
                                      </label>
                                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={telestrokeNote.preTNKSafetyPause}
                                          onChange={(e) => setTelestrokeNote({...telestrokeNote, preTNKSafetyPause: e.target.checked})}
                                          className="w-4 h-4"
                                        />
                                        Pre-TNK safety pause completed
                                      </label>
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">TNK Administration Time</label>
                                  <input
                                    type="time"
                                    value={telestrokeNote.tnkAdminTime}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, tnkAdminTime: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Time Metrics Section - DTN Tracker (Collapsible) */}
                            <details id="time-metrics-section" className="bg-purple-50 border-2 border-purple-300 rounded-lg" open={telestrokeNote.tnkRecommended}>
                              <summary className="cursor-pointer p-3 font-semibold text-purple-800 hover:bg-purple-100 rounded-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <i data-lucide="timer" className="w-4 h-4"></i>
                                  Time Metrics (DTN Tracker)
                                </span>
                                {(() => {
                                  const metrics = calculateDTNMetrics();
                                  if (metrics.doorToNeedle !== null) {
                                    const benchmark = getDTNBenchmark(metrics.doorToNeedle);
                                    return (
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        benchmark.color === 'green' ? 'bg-green-500 text-white' :
                                        benchmark.color === 'yellow' ? 'bg-yellow-500 text-white' :
                                        'bg-red-500 text-white'
                                      }`}>
                                        DTN: {metrics.doorToNeedle} min
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </summary>
                              <div className="p-4 space-y-4">
                                {/* Timestamp capture fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* ED Arrival (Door) */}
                                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium text-gray-700">ED Arrival (Door)</label>
                                      <button
                                        type="button"
                                        onClick={() => setTelestrokeNote({...telestrokeNote, dtnEdArrival: new Date().toISOString().slice(0, 16)})}
                                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                                      >
                                        Now
                                      </button>
                                    </div>
                                    <input
                                      type="datetime-local"
                                      value={telestrokeNote.dtnEdArrival || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, dtnEdArrival: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                  </div>

                                  {/* Stroke Alert Called */}
                                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium text-gray-700">Stroke Alert Called</label>
                                      <button
                                        type="button"
                                        onClick={() => setTelestrokeNote({...telestrokeNote, dtnStrokeAlert: new Date().toISOString().slice(0, 16)})}
                                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                                      >
                                        Now
                                      </button>
                                    </div>
                                    <input
                                      type="datetime-local"
                                      value={telestrokeNote.dtnStrokeAlert || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, dtnStrokeAlert: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                  </div>

                                  {/* CT Scan Started */}
                                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium text-gray-700">CT Scan Started</label>
                                      <button
                                        type="button"
                                        onClick={() => setTelestrokeNote({...telestrokeNote, dtnCtStarted: new Date().toISOString().slice(0, 16)})}
                                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                                      >
                                        Now
                                      </button>
                                    </div>
                                    <input
                                      type="datetime-local"
                                      value={telestrokeNote.dtnCtStarted || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, dtnCtStarted: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                  </div>

                                  {/* CT Read/Cleared for TNK */}
                                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium text-gray-700">CT Read/Cleared for TNK</label>
                                      <button
                                        type="button"
                                        onClick={() => setTelestrokeNote({...telestrokeNote, dtnCtRead: new Date().toISOString().slice(0, 16)})}
                                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                                      >
                                        Now
                                      </button>
                                    </div>
                                    <input
                                      type="datetime-local"
                                      value={telestrokeNote.dtnCtRead || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, dtnCtRead: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                  </div>

                                  {/* TNK Ordered */}
                                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium text-gray-700">TNK Ordered</label>
                                      <button
                                        type="button"
                                        onClick={() => setTelestrokeNote({...telestrokeNote, dtnTnkOrdered: new Date().toISOString().slice(0, 16)})}
                                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                                      >
                                        Now
                                      </button>
                                    </div>
                                    <input
                                      type="datetime-local"
                                      value={telestrokeNote.dtnTnkOrdered || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, dtnTnkOrdered: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                  </div>

                                  {/* TNK Administered (Needle Time) */}
                                  <div className="bg-white p-3 rounded-lg border-2 border-green-400">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-bold text-green-700">TNK Administered (Needle)</label>
                                      <button
                                        type="button"
                                        onClick={() => setTelestrokeNote({...telestrokeNote, dtnTnkAdministered: new Date().toISOString().slice(0, 16)})}
                                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                      >
                                        Now
                                      </button>
                                    </div>
                                    <input
                                      type="datetime-local"
                                      value={telestrokeNote.dtnTnkAdministered || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, dtnTnkAdministered: e.target.value})}
                                      className="w-full px-2 py-1 border border-green-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                    />
                                  </div>
                                </div>

                                {/* Auto-calculated Time Metrics */}
                                {(() => {
                                  const metrics = calculateDTNMetrics();
                                  const hasSomeData = metrics.doorToCT !== null || metrics.doorToNeedle !== null || metrics.ctToNeedle !== null;

                                  if (!hasSomeData) {
                                    return (
                                      <div className="text-center text-gray-500 text-sm py-2">
                                        Enter timestamps above to calculate time metrics
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 border-2 border-purple-300">
                                      <h5 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                        <i data-lucide="bar-chart-2" className="w-4 h-4"></i>
                                        Calculated Intervals
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* Door-to-CT */}
                                        <div className="bg-white p-3 rounded-lg border border-blue-200 text-center">
                                          <p className="text-xs text-gray-600 mb-1">Door-to-CT</p>
                                          <p className="text-2xl font-bold text-blue-600">
                                            {metrics.doorToCT !== null ? `${metrics.doorToCT} min` : '--'}
                                          </p>
                                          <p className="text-xs text-gray-500">Target: &lt;25 min</p>
                                        </div>

                                        {/* Door-to-Needle (DTN) */}
                                        {metrics.doorToNeedle !== null && (() => {
                                          const benchmark = getDTNBenchmark(metrics.doorToNeedle);
                                          return (
                                            <div className={`p-3 rounded-lg border-2 text-center ${
                                              benchmark.color === 'green' ? 'bg-green-100 border-green-500' :
                                              benchmark.color === 'yellow' ? 'bg-yellow-100 border-yellow-500' :
                                              'bg-red-100 border-red-500'
                                            }`}>
                                              <p className="text-xs text-gray-700 mb-1 font-semibold">Door-to-Needle (DTN)</p>
                                              <p className={`text-3xl font-bold ${
                                                benchmark.color === 'green' ? 'text-green-700' :
                                                benchmark.color === 'yellow' ? 'text-yellow-700' :
                                                'text-red-700'
                                              }`}>
                                                {metrics.doorToNeedle} min
                                              </p>
                                              <p className={`text-sm font-semibold ${
                                                benchmark.color === 'green' ? 'text-green-600' :
                                                benchmark.color === 'yellow' ? 'text-yellow-600' :
                                                'text-red-600'
                                              }`}>
                                                {benchmark.label}
                                              </p>
                                              {benchmark.delta !== 0 && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                  {benchmark.delta > 0
                                                    ? `+${benchmark.delta} min over ${benchmark.target} min target`
                                                    : `${Math.abs(benchmark.delta)} min under target`}
                                                </p>
                                              )}
                                            </div>
                                          );
                                        })()}
                                        {metrics.doorToNeedle === null && (
                                          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                            <p className="text-xs text-gray-600 mb-1">Door-to-Needle (DTN)</p>
                                            <p className="text-2xl font-bold text-gray-400">--</p>
                                            <p className="text-xs text-gray-500">Target: &lt;45 min</p>
                                          </div>
                                        )}

                                        {/* CT-to-Needle */}
                                        <div className="bg-white p-3 rounded-lg border border-blue-200 text-center">
                                          <p className="text-xs text-gray-600 mb-1">CT-to-Needle</p>
                                          <p className="text-2xl font-bold text-blue-600">
                                            {metrics.ctToNeedle !== null ? `${metrics.ctToNeedle} min` : '--'}
                                          </p>
                                          <p className="text-xs text-gray-500">Target: &lt;20 min</p>
                                        </div>
                                      </div>

                                      {/* Benchmark Legend */}
                                      <div className="mt-3 pt-3 border-t border-purple-200">
                                        <p className="text-xs text-gray-600 text-center">
                                          DTN Benchmarks:
                                          <span className="ml-2 px-2 py-0.5 bg-green-500 text-white rounded">≤45 min = Excellent</span>
                                          <span className="ml-1 px-2 py-0.5 bg-yellow-500 text-white rounded">46-60 min = Good</span>
                                          <span className="ml-1 px-2 py-0.5 bg-red-500 text-white rounded">&gt;60 min = Needs Improvement</span>
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </details>

                            {/* EVT Eligibility (Collapsible) */}
                            <details className="bg-blue-50 border border-blue-200 rounded-lg">
                              <summary className="cursor-pointer p-3 font-semibold text-blue-800 hover:bg-blue-100 rounded-lg">
                                🔧 EVT Eligibility Criteria (Click to expand)
                              </summary>
                              <div className="p-4 space-y-3 text-sm">
                                <div>
                                  <h4 className="font-semibold text-blue-700 mb-2">Basilar Artery Occlusion:</h4>
                                  <ul className="space-y-1 ml-4">
                                    <li>• Last known well ≤24 hours</li>
                                    <li>• NIHSS score ≥10</li>
                                    <li>• pc-ASPECTS ≥6</li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-green-700 mb-2">Anterior Circulation Large Vessel Occlusion:</h4>
                                  <p className="text-xs text-gray-600 mb-2">Trial evidence principally supports efficacy among adults ≥60 years of age, baseline mRS 0-1, NIHSS≥6 with disabling symptoms</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                    <div className="bg-white p-2 rounded border">
                                      <p className="font-semibold text-green-700 text-xs mb-1">Early Window (0-6h):</p>
                                      <ul className="space-y-1 ml-2 text-xs">
                                        <li>• ASPECTS 3-10: Generally eligible for EVT</li>
                                        <li>• ASPECTS 0-2: Consider in very select cases; Consider CTP to evaluate if estimated core volume is &lt;70-100cc</li>
                                      </ul>
                                    </div>
                                    <div className="bg-white p-2 rounded border">
                                      <p className="font-semibold text-purple-700 text-xs mb-1">Late Window (6-24h):</p>
                                      <ul className="space-y-1 ml-2 text-xs">
                                        <li>• ASPECTS 6-10: Generally eligible for EVT</li>
                                        <li>• ASPECTS 3-5: Generally eligible; Consider CTP to evaluate if estimated core volume is ≤100cc + mismatch is present</li>
                                        <li>• ASPECTS 0-2: EVT benefit is unclear</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-orange-700 mb-2">Medium Vessel Occlusion:</h4>
                                  <ul className="space-y-1 ml-4">
                                    <li>• Consider in select cases of proximal or dominant M2 segment MCA occlusion within ≤1cm of bifurcation in horizontal segment when there is evidence of salvageable tissue + last known well is ≤24 hours</li>
                                    <li>• Not recommended for M2-M4 MCA, ACA, and PCA occlusions</li>
                                  </ul>
                                </div>
                              </div>
                            </details>

                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={telestrokeNote.evtRecommended}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, evtRecommended: e.target.checked})}
                                className="w-4 h-4"
                              />
                              EVT Recommended
                            </label>

                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <label className="block text-sm font-medium text-gray-700">Rationale for Recommendation</label>
                              </div>
                              <textarea
                                value={telestrokeNote.rationale}
                                onChange={(e) => setTelestrokeNote({...telestrokeNote, rationale: e.target.value})}
                                placeholder=""
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Guideline Recommendations Panel */}
                        {(() => {
                          const recs = getContextualRecommendations();
                          if (recs.length === 0) return null;

                          // Group by category
                          const grouped = {};
                          recs.forEach(rec => {
                            if (!grouped[rec.category]) grouped[rec.category] = [];
                            grouped[rec.category].push(rec);
                          });

                          const classColors = {
                            'I': 'bg-green-600 text-white',
                            'IIa': 'bg-blue-500 text-white',
                            'IIb': 'bg-amber-500 text-white',
                            'III': 'bg-red-600 text-white'
                          };

                          return (
                            <div className="bg-white border-2 border-indigo-300 rounded-lg shadow-md">
                              <details open={guidelineRecsExpanded} onToggle={(e) => setGuidelineRecsExpanded(e.target.open)}>
                                <summary className="cursor-pointer p-4 font-semibold text-indigo-900 hover:bg-indigo-50 rounded-lg flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <i data-lucide="book-open" className="w-5 h-5 text-indigo-600"></i>
                                    Guideline Recommendations ({recs.length})
                                  </span>
                                  <span className="text-xs text-indigo-500 font-normal">Evidence-based, auto-matched to patient data</span>
                                </summary>
                                <div className="p-4 pt-0 space-y-4">
                                  {Object.entries(grouped).map(([category, catRecs]) => (
                                    <div key={category}>
                                      <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-2 border-b border-indigo-100 pb-1">{category}</h4>
                                      <div className="space-y-2">
                                        {catRecs.map(rec => (
                                          <div key={rec.id} className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold shrink-0 ${classColors[rec.classOfRec] || 'bg-gray-500 text-white'}`}>
                                                {rec.classOfRec}/{rec.levelOfEvidence}
                                              </span>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                                                <p className="text-sm text-gray-700 mt-0.5">{rec.recommendation}</p>
                                                {rec.medications && rec.medications.length > 0 && (
                                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                                    {rec.medications.map((med, i) => (
                                                      <span key={i} className="inline-block px-2 py-0.5 bg-white border border-indigo-200 rounded text-xs text-indigo-800">{med}</span>
                                                    ))}
                                                  </div>
                                                )}
                                                {rec.caveats && (
                                                  <p className="text-xs text-amber-700 mt-1 italic">{rec.caveats}</p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">{rec.guideline}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          );
                        })()}

                        {/* Trial Eligibility Quick Badge */}
                        {(() => {
                          const allTrials = Object.keys(TRIAL_ELIGIBILITY_CONFIG);
                          if (allTrials.length === 0) return null;
                          const patientDataForTrials = { telestrokeNote, nihssScore, aspectsScore, patientData };
                          let eligibleCount = 0;
                          let needsInfoCount = 0;
                          allTrials.forEach(trialId => {
                            const result = evaluateTrialEligibility(trialId, patientDataForTrials);
                            if (result) {
                              if (result.status === 'eligible') eligibleCount++;
                              else if (result.status === 'needs_info') needsInfoCount++;
                            }
                          });
                          if (eligibleCount === 0 && needsInfoCount === 0) return null;
                          return (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-3 text-sm">
                                <i data-lucide="flask-conical" className="w-4 h-4 text-purple-600"></i>
                                <span className="font-medium text-purple-900">Clinical Trials:</span>
                                {eligibleCount > 0 && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-bold">{eligibleCount} eligible</span>
                                )}
                                {needsInfoCount > 0 && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">{needsInfoCount} needs info</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => navigateTo('trials')}
                                className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                              >
                                View Trials →
                              </button>
                            </div>
                          );
                        })()}

                        {/* SAH Management Section - Only show for SAH diagnosis */}
                        {(telestrokeNote.diagnosisCategory === 'sah' || (telestrokeNote.diagnosis || '').toLowerCase().includes('sah') || (telestrokeNote.diagnosis || '').toLowerCase().includes('subarachnoid')) && (
                          <div id="sah-management-section" className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                <i data-lucide="zap" className="w-5 h-5"></i>
                                SAH Management (2023 AHA/ASA)
                              </h3>
                            </div>

                            <div className="space-y-3">
                              {/* SAH Grade */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Grading Scale</label>
                                  <select
                                    value={telestrokeNote.sahGradeScale || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, sahGradeScale: e.target.value})}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                  >
                                    <option value="">-- Select --</option>
                                    <option value="huntHess">Hunt & Hess</option>
                                    <option value="wfns">WFNS</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
                                  <select
                                    value={telestrokeNote.sahGrade || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, sahGrade: e.target.value})}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                  >
                                    <option value="">-- Select --</option>
                                    {telestrokeNote.sahGradeScale === 'huntHess' ? (
                                      <>
                                        <option value="1">Grade 1 - Asymptomatic or mild headache</option>
                                        <option value="2">Grade 2 - Moderate to severe headache, nuchal rigidity</option>
                                        <option value="3">Grade 3 - Drowsy, confused, mild focal deficit</option>
                                        <option value="4">Grade 4 - Stupor, moderate to severe hemiparesis</option>
                                        <option value="5">Grade 5 - Deep coma, decerebrate posturing</option>
                                      </>
                                    ) : telestrokeNote.sahGradeScale === 'wfns' ? (
                                      <>
                                        <option value="1">Grade I - GCS 15, no motor deficit</option>
                                        <option value="2">Grade II - GCS 13-14, no motor deficit</option>
                                        <option value="3">Grade III - GCS 13-14, with motor deficit</option>
                                        <option value="4">Grade IV - GCS 7-12</option>
                                        <option value="5">Grade V - GCS 3-6</option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                      </>
                                    )}
                                  </select>
                                </div>
                              </div>

                              {/* SAH Grade Warning */}
                              {parseInt(telestrokeNote.sahGrade) >= 4 && (
                                <div className="bg-red-50 border border-red-300 rounded-lg p-2 text-sm text-red-800">
                                  <strong>Poor-grade SAH (Grade {telestrokeNote.sahGrade}):</strong> Consider EVD placement, ICU admission, and early goals-of-care discussion. Avoid premature limitations of care.
                                </div>
                              )}

                              {/* SAH Management Checklist */}
                              <div className="bg-purple-50 rounded-lg p-3">
                                <div className="text-sm font-semibold text-purple-800 mb-2">SAH ICU Bundle</div>
                                <div className="space-y-2">
                                  {[
                                    { key: 'sahBPManaged', label: 'BP managed (SBP <160 pre-securing)', detail: 'Nicardipine or labetalol IV' },
                                    { key: 'sahNimodipine', label: 'Nimodipine started (60 mg q4h x 21d)', detail: 'Class I, LOE A for DCI prevention' },
                                    { key: 'sahEVDPlaced', label: 'EVD placed (if hydrocephalus/poor-grade)', detail: 'For acute hydrocephalus or HH 3-5' },
                                    { key: 'sahNeurosurgeryConsulted', label: 'Neurosurgery consulted', detail: 'For aneurysm securing strategy' },
                                    { key: 'sahAneurysmSecured', label: 'Aneurysm securing plan documented', detail: 'Clip vs coil within 24h' },
                                    { key: 'sahSeizureProphylaxis', label: 'Seizure prophylaxis addressed', detail: 'Short-term (3-7d) levetiracetam if indicated' }
                                  ].map(item => (
                                    <label key={item.key} className="flex items-start gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={!!telestrokeNote[item.key]}
                                        onChange={(e) => setTelestrokeNote({...telestrokeNote, [item.key]: e.target.checked})}
                                        className="mt-0.5 rounded border-purple-300 text-purple-600"
                                      />
                                      <div>
                                        <span className="text-sm font-medium text-gray-800">{item.label}</span>
                                        <span className="block text-xs text-gray-500">{item.detail}</span>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CVT Management Section - Only show for CVT diagnosis */}
                        {(telestrokeNote.diagnosisCategory === 'cvt' || (telestrokeNote.diagnosis || '').toLowerCase().includes('cvt') || (telestrokeNote.diagnosis || '').toLowerCase().includes('venous thrombosis') || (telestrokeNote.diagnosis || '').toLowerCase().includes('cerebral venous')) && (
                          <div id="cvt-management-section" className="bg-white border-2 border-indigo-300 rounded-lg p-4 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                <i data-lucide="git-branch" className="w-5 h-5"></i>
                                CVT Management (2024 AHA)
                              </h3>
                            </div>

                            <div className="space-y-3">
                              {/* CVT Anticoagulation */}
                              <div className="bg-indigo-50 rounded-lg p-3">
                                <div className="text-sm font-semibold text-indigo-800 mb-2">CVT Treatment Checklist</div>
                                <div className="space-y-2">
                                  <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!telestrokeNote.cvtAnticoagStarted}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, cvtAnticoagStarted: e.target.checked})}
                                      className="mt-0.5 rounded border-indigo-300 text-indigo-600"
                                    />
                                    <div>
                                      <span className="text-sm font-medium text-gray-800">Anticoagulation initiated</span>
                                      <span className="block text-xs text-gray-500">LMWH or UFH, even with hemorrhagic infarction (Class I)</span>
                                    </div>
                                  </label>

                                  {telestrokeNote.cvtAnticoagStarted && (
                                    <div className="ml-6">
                                      <select
                                        value={telestrokeNote.cvtAnticoagType || ''}
                                        onChange={(e) => setTelestrokeNote({...telestrokeNote, cvtAnticoagType: e.target.value})}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                      >
                                        <option value="">-- Select agent --</option>
                                        <option value="enoxaparin">Enoxaparin 1 mg/kg SC q12h</option>
                                        <option value="ufh">UFH weight-based (aPTT 60-80s)</option>
                                        <option value="other">Other</option>
                                      </select>
                                    </div>
                                  )}

                                  <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!telestrokeNote.cvtIcpManaged}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, cvtIcpManaged: e.target.checked})}
                                      className="mt-0.5 rounded border-indigo-300 text-indigo-600"
                                    />
                                    <div>
                                      <span className="text-sm font-medium text-gray-800">ICP assessment/management</span>
                                      <span className="block text-xs text-gray-500">HOB 30°, acetazolamide if needed, LP drainage for visual impairment</span>
                                    </div>
                                  </label>

                                  <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!telestrokeNote.cvtSeizureManaged}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, cvtSeizureManaged: e.target.checked})}
                                      className="mt-0.5 rounded border-indigo-300 text-indigo-600"
                                    />
                                    <div>
                                      <span className="text-sm font-medium text-gray-800">Seizure management addressed</span>
                                      <span className="block text-xs text-gray-500">Prophylaxis for supratentorial lesions; levetiracetam preferred</span>
                                    </div>
                                  </label>

                                  <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!telestrokeNote.cvtHematologyConsulted}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, cvtHematologyConsulted: e.target.checked})}
                                      className="mt-0.5 rounded border-indigo-300 text-indigo-600"
                                    />
                                    <div>
                                      <span className="text-sm font-medium text-gray-800">Hematology consult / thrombophilia workup</span>
                                      <span className="block text-xs text-gray-500">Factor V Leiden, prothrombin mutation, protein C/S, APLA</span>
                                    </div>
                                  </label>
                                </div>
                              </div>

                              {/* CVT Long-term Plan Note */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
                                <strong>Long-term plan:</strong> Transition to VKA (INR 2-3) for 3-12 months. DOAC may be considered for mild provoked CVT per ACTION-CVT data. Indefinite anticoagulation if recurrent VTE or severe thrombophilia.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ========== TIA WORKUP CHECKLIST ========== */}
                        {getPathwayForDiagnosis(telestrokeNote.diagnosis) === 'tia' && (
                          <div className="bg-white border-2 border-orange-300 rounded-lg p-4 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                                <i data-lucide="clipboard-check" className="w-5 h-5"></i>
                                TIA Rapid Workup Checklist
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-orange-600 font-medium">
                                  {Object.values(telestrokeNote.tiaWorkup || {}).filter(Boolean).length}/{Object.keys(telestrokeNote.tiaWorkup || {}).length} complete
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setTelestrokeNote({...telestrokeNote, tiaWorkupReviewed: !telestrokeNote.tiaWorkupReviewed})}
                                  className={`text-xs px-2 py-1 rounded-lg font-medium ${telestrokeNote.tiaWorkupReviewed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                  {telestrokeNote.tiaWorkupReviewed ? 'Reviewed' : 'Mark Reviewed'}
                                </button>
                              </div>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 text-sm text-orange-800">
                              <strong>Admit ALL TIAs</strong> for urgent inpatient workup (Class I, LOE B-NR). Do not use ABCD2 score for disposition decisions.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                              {[
                                { key: 'mriDwi', label: 'MRI Brain with DWI', category: 'Imaging' },
                                { key: 'ctaHeadNeck', label: 'CTA Head & Neck (or MRA)', category: 'Imaging' },
                                { key: 'ecg12Lead', label: '12-Lead ECG', category: 'Cardiac' },
                                { key: 'telemetry', label: 'Continuous telemetry monitoring', category: 'Cardiac' },
                                { key: 'echo', label: 'Echocardiography (TTE +/- bubble)', category: 'Cardiac' },
                                { key: 'labsCbc', label: 'CBC with differential', category: 'Labs' },
                                { key: 'labsBmp', label: 'BMP + glucose', category: 'Labs' },
                                { key: 'labsA1c', label: 'HbA1c', category: 'Labs' },
                                { key: 'labsLipids', label: 'Fasting lipid panel', category: 'Labs' },
                                { key: 'labsTsh', label: 'TSH', category: 'Labs' }
                              ].map(item => (
                                <label key={item.key} className="flex items-center gap-2 py-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!(telestrokeNote.tiaWorkup || {})[item.key]}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      tiaWorkup: { ...(telestrokeNote.tiaWorkup || {}), [item.key]: e.target.checked }
                                    })}
                                    className="rounded border-orange-300 text-orange-600"
                                  />
                                  <span className="text-sm text-gray-700">{item.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ========== TOAST CLASSIFICATION ========== */}
                        {(getPathwayForDiagnosis(telestrokeNote.diagnosis) === 'ischemic' || getPathwayForDiagnosis(telestrokeNote.diagnosis) === 'tia') && (
                          <div className="bg-white border-2 border-violet-300 rounded-lg p-4 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-violet-900 flex items-center gap-2">
                                <i data-lucide="layers" className="w-5 h-5"></i>
                                TOAST Etiologic Classification
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { value: 'large-artery', label: 'Large Artery Atherosclerosis', desc: 'Carotid/intracranial stenosis >=50%, or plaque with ulceration' },
                                { value: 'cardioembolism', label: 'Cardioembolism', desc: 'AF, PFO, valvular disease, LV thrombus, endocarditis' },
                                { value: 'small-vessel', label: 'Small Vessel Occlusion (Lacunar)', desc: 'Subcortical infarct <15mm, classic lacunar syndrome' },
                                { value: 'other-determined', label: 'Other Determined Etiology', desc: 'Dissection, vasculitis, hypercoagulable, sickle cell, etc.' },
                                { value: 'cryptogenic', label: 'Cryptogenic / ESUS', desc: 'No cause found despite complete evaluation, or >1 competing cause' }
                              ].map(item => (
                                <label key={item.value} className={`flex items-start gap-2 p-2 rounded cursor-pointer border transition ${telestrokeNote.toastClassification === item.value ? 'bg-violet-100 border-violet-400' : 'hover:bg-violet-50 border-gray-200'}`}>
                                  <input
                                    type="radio"
                                    name="toastClassification"
                                    value={item.value}
                                    checked={telestrokeNote.toastClassification === item.value}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, toastClassification: e.target.value})}
                                    className="mt-1 text-violet-600"
                                  />
                                  <div>
                                    <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                                    <p className="text-xs text-gray-500">{item.desc}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ========== CARDIAC WORKUP DECISION TREE ========== */}
                        {(getPathwayForDiagnosis(telestrokeNote.diagnosis) === 'ischemic' || getPathwayForDiagnosis(telestrokeNote.diagnosis) === 'tia' || telestrokeNote.toastClassification === 'cardioembolism' || telestrokeNote.toastClassification === 'cryptogenic') && telestrokeNote.diagnosis && (
                          <div className="bg-white border-2 border-pink-300 rounded-lg p-4 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-pink-900 flex items-center gap-2">
                                <i data-lucide="heart" className="w-5 h-5"></i>
                                Cardiac Workup
                              </h3>
                            </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 p-2 bg-pink-50 rounded border border-pink-200">
                                  <input type="checkbox" checked={!!(telestrokeNote.cardiacWorkup || {}).ecgComplete}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, cardiacWorkup: {...(telestrokeNote.cardiacWorkup || {}), ecgComplete: e.target.checked}})}
                                    className="text-pink-600" />
                                  <span className="text-sm">12-Lead ECG</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-pink-50 rounded border border-pink-200">
                                  <input type="checkbox" checked={!!(telestrokeNote.cardiacWorkup || {}).telemetryOrdered}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, cardiacWorkup: {...(telestrokeNote.cardiacWorkup || {}), telemetryOrdered: e.target.checked}})}
                                    className="text-pink-600" />
                                  <span className="text-sm">Inpatient Telemetry</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-pink-50 rounded border border-pink-200">
                                  <input type="checkbox" checked={!!(telestrokeNote.cardiacWorkup || {}).echoOrdered}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, cardiacWorkup: {...(telestrokeNote.cardiacWorkup || {}), echoOrdered: e.target.checked}})}
                                    className="text-pink-600" />
                                  <span className="text-sm">Echo (TTE +/- Bubble)</span>
                                </label>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Extended Cardiac Monitoring (post-discharge)</label>
                                <select
                                  value={(telestrokeNote.cardiacWorkup || {}).extendedMonitoringType || ''}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, cardiacWorkup: {...(telestrokeNote.cardiacWorkup || {}), extendedMonitoringType: e.target.value, extendedMonitoring: e.target.value ? 'ordered' : ''}})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
                                >
                                  <option value="">-- Select monitoring plan --</option>
                                  <option value="30-day-monitor">30-Day Ambulatory Monitor (Preferred)</option>
                                  <option value="14-day-patch">14-Day Continuous Patch (if 30-day unavailable)</option>
                                  <option value="ilr">Implantable Loop Recorder (select cases)</option>
                                  <option value="none-af-known">Not needed — AF already documented</option>
                                  <option value="none-other">Not indicated (clear etiology identified)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Hierarchy: 30-day monitor preferred; 14-day patch if unavailable; ILR in select cases with high suspicion and negative ambulatory monitoring.</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PFO Evaluation</label>
                                <select
                                  value={(telestrokeNote.cardiacWorkup || {}).pfoEvaluation || ''}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, cardiacWorkup: {...(telestrokeNote.cardiacWorkup || {}), pfoEvaluation: e.target.value}})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
                                >
                                  <option value="">-- Select PFO status --</option>
                                  <option value="no-pfo">No PFO detected</option>
                                  <option value="pfo-no-closure">PFO present — closure not indicated</option>
                                  <option value="pfo-closure-candidate">PFO present — closure candidate (PASCAL: probable/definite)</option>
                                  <option value="pfo-further-eval">PFO present — needs further evaluation</option>
                                </select>
                              </div>
                              {(telestrokeNote.cardiacWorkup || {}).pfoEvaluation === 'pfo-closure-candidate' && (
                                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                                  <h4 className="font-semibold text-pink-800 mb-2">PASCAL Classification for PFO Closure</h4>
                                  <select
                                    value={(telestrokeNote.cardiacWorkup || {}).pascalClassification || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, cardiacWorkup: {...(telestrokeNote.cardiacWorkup || {}), pascalClassification: e.target.value}})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
                                  >
                                    <option value="">-- Select PASCAL grade --</option>
                                    <option value="definite">Definite — High probability PFO-attributable stroke (closure recommended)</option>
                                    <option value="probable">Probable — Moderate probability (closure reasonable)</option>
                                    <option value="possible">Possible — Low probability (closure uncertain benefit)</option>
                                    <option value="unlikely">Unlikely — Very low probability (closure not recommended)</option>
                                  </select>
                                  <p className="text-xs text-gray-500 mt-1">PASCAL integrates: PFO anatomy (shunt size, ASA), age, clot/DVT source, Alternative etiologies, Lacunar vs cortical pattern. Closure recommended for definite/probable in patients age 18-60.</p>
                                </div>
                              )}
                              {(telestrokeNote.toastClassification === 'cryptogenic' || telestrokeNote.toastClassification === 'cardioembolism') && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                                  <h4 className="font-semibold text-blue-800 mb-1">sICAS Management (AAN 2022)</h4>
                                  <ul className="space-y-1 ml-4 text-blue-700">
                                    <li>• Severe symptomatic intracranial stenosis (70-99%): DAPT x 90 days, then ASA 325 mg</li>
                                    <li>• High-intensity statin with LDL target &lt;70 mg/dL</li>
                                    <li>• SBP target &lt;140/90 (ideally &lt;130/80)</li>
                                    <li>• Do NOT offer intracranial stenting as initial treatment (Class III)</li>
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ========== CERVICAL ARTERY DISSECTION PATHWAY ========== */}
                        {getPathwayForDiagnosis(telestrokeNote.diagnosis) === 'dissection' && (
                          <div className="bg-white border-2 border-rose-300 rounded-lg p-4 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                                <i data-lucide="git-branch" className="w-5 h-5"></i>
                                Cervical Artery Dissection Pathway
                              </h3>
                            </div>
                            <div className="space-y-3">
                              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800">
                                <strong>Key:</strong> Cervical dissection is NOT a contraindication to IV TNK if within treatment window. Antithrombotic therapy (antiplatelet or anticoagulation) is indicated; neither is proven superior (CADISS).
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Antithrombotic Selection</label>
                                <select
                                  value={(telestrokeNote.dissectionPathway || {}).antithromboticType || ''}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, dissectionPathway: {...(telestrokeNote.dissectionPathway || {}), antithromboticType: e.target.value, antithromboticStarted: !!e.target.value}})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                                >
                                  <option value="">-- Select antithrombotic --</option>
                                  <option value="antiplatelet-asa">Antiplatelet: ASA 81-325 mg daily</option>
                                  <option value="antiplatelet-dapt">Antiplatelet: DAPT (ASA + clopidogrel)</option>
                                  <option value="anticoag-heparin">Anticoagulation: Heparin bridge to warfarin</option>
                                  <option value="anticoag-doac">Anticoagulation: DOAC (off-label)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vascular Imaging Follow-Up Plan</label>
                                <select
                                  value={(telestrokeNote.dissectionPathway || {}).imagingFollowUp || ''}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, dissectionPathway: {...(telestrokeNote.dissectionPathway || {}), imagingFollowUp: e.target.value}})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                                >
                                  <option value="">-- Select follow-up plan --</option>
                                  <option value="3-month">Repeat CTA/MRA at 3 months</option>
                                  <option value="6-month">Repeat CTA/MRA at 6 months</option>
                                  <option value="3-and-6-month">Repeat at 3 and 6 months</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Most dissections heal in 3-6 months. If recanalized, consider switching anticoagulation to antiplatelet. Persistent pseudoaneurysm may warrant continued treatment.</p>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                                <h4 className="font-semibold text-amber-800 mb-1">Dissection Counseling Points</h4>
                                <ul className="space-y-1 ml-4 text-amber-700">
                                  <li>• Avoid cervical manipulation (chiropractic) during healing</li>
                                  <li>• Avoid heavy lifting/straining for 4-6 weeks</li>
                                  <li>• Report any new headache, neck pain, or neurological symptoms immediately</li>
                                  <li>• Duration of antithrombotic therapy: typically 3-6 months, reassess with imaging</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ========== SCREENING TOOLS ========== */}
                        {telestrokeNote.diagnosis && getPathwayForDiagnosis(telestrokeNote.diagnosis) !== 'mimic' && (
                          <details className="bg-white border-2 border-teal-300 rounded-lg shadow-md">
                            <summary className="cursor-pointer p-4 font-semibold text-teal-900 hover:bg-teal-50 rounded-lg flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <i data-lucide="scan" className="w-5 h-5 text-teal-600"></i>
                                Post-Stroke Screening Tools
                              </span>
                              <span className="text-xs text-teal-500 font-normal">PHQ-2, MoCA, STOP-BANG, Seizure Risk</span>
                            </summary>
                            <div className="p-4 pt-0 space-y-4">
                              {/* PHQ-2 Depression Screening */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <h4 className="font-semibold text-blue-800 mb-2">PHQ-2 Depression Screening</h4>
                                <p className="text-xs text-gray-600 mb-2">Over the past 2 weeks, how often has the patient been bothered by:</p>
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-sm text-gray-700">1. Little interest or pleasure in doing things?</label>
                                    <select
                                      value={(telestrokeNote.screeningTools || {}).phq2_q1 || ''}
                                      onChange={(e) => {
                                        const st = {...(telestrokeNote.screeningTools || {}), phq2_q1: e.target.value};
                                        const score = (parseInt(st.phq2_q1) || 0) + (parseInt(st.phq2_q2) || 0);
                                        st.phq2Score = score.toString();
                                        st.phq2Positive = score >= 3;
                                        setTelestrokeNote({...telestrokeNote, screeningTools: st});
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                                    >
                                      <option value="">Select</option>
                                      <option value="0">Not at all (0)</option>
                                      <option value="1">Several days (1)</option>
                                      <option value="2">More than half the days (2)</option>
                                      <option value="3">Nearly every day (3)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-sm text-gray-700">2. Feeling down, depressed, or hopeless?</label>
                                    <select
                                      value={(telestrokeNote.screeningTools || {}).phq2_q2 || ''}
                                      onChange={(e) => {
                                        const st = {...(telestrokeNote.screeningTools || {}), phq2_q2: e.target.value};
                                        const score = (parseInt(st.phq2_q1) || 0) + (parseInt(st.phq2_q2) || 0);
                                        st.phq2Score = score.toString();
                                        st.phq2Positive = score >= 3;
                                        setTelestrokeNote({...telestrokeNote, screeningTools: st});
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                                    >
                                      <option value="">Select</option>
                                      <option value="0">Not at all (0)</option>
                                      <option value="1">Several days (1)</option>
                                      <option value="2">More than half the days (2)</option>
                                      <option value="3">Nearly every day (3)</option>
                                    </select>
                                  </div>
                                </div>
                                {(telestrokeNote.screeningTools || {}).phq2Score && (
                                  <div className={`mt-2 p-2 rounded text-sm font-medium ${(telestrokeNote.screeningTools || {}).phq2Positive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    PHQ-2 Score: {(telestrokeNote.screeningTools || {}).phq2Score}/6
                                    {(telestrokeNote.screeningTools || {}).phq2Positive ? ' — POSITIVE: Consider full PHQ-9, psychiatry/psychology referral' : ' — Negative screen'}
                                  </div>
                                )}
                              </div>

                              {/* MoCA Reference */}
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <h4 className="font-semibold text-purple-800 mb-2">MoCA Cognitive Screening</h4>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <label className="text-sm text-gray-700">MoCA Score (0-30):</label>
                                    <input
                                      type="number"
                                      min="0" max="30"
                                      value={(telestrokeNote.screeningTools || {}).mocaScore || ''}
                                      onChange={(e) => {
                                        const st = {...(telestrokeNote.screeningTools || {}), mocaScore: e.target.value};
                                        setTelestrokeNote({...telestrokeNote, screeningTools: st});
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                                      placeholder="Enter score"
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 mt-4">
                                    <input type="checkbox"
                                      checked={!!(telestrokeNote.screeningTools || {}).mocaReferral}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, screeningTools: {...(telestrokeNote.screeningTools || {}), mocaReferral: e.target.checked}})}
                                      className="text-purple-600" />
                                    <span className="text-sm">Neuropsych referral</span>
                                  </label>
                                </div>
                                {parseInt((telestrokeNote.screeningTools || {}).mocaScore) > 0 && (
                                  <div className={`mt-2 p-2 rounded text-sm ${parseInt((telestrokeNote.screeningTools || {}).mocaScore) >= 26 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {parseInt((telestrokeNote.screeningTools || {}).mocaScore) >= 26 ? 'Normal cognition (>=26)' : `Below normal (${(telestrokeNote.screeningTools || {}).mocaScore}/30) — consider neuropsych referral`}
                                  </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Administer MoCA at follow-up (not acute phase). Add 1 point if education &le;12 years. <a href="https://mocatest.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">mocatest.org</a></p>
                              </div>

                              {/* STOP-BANG OSA Screening */}
                              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                                <h4 className="font-semibold text-cyan-800 mb-2">STOP-BANG OSA Screening</h4>
                                <div className="grid grid-cols-2 gap-1">
                                  {[
                                    { key: 'sb_snoring', label: 'Snoring (loud)' },
                                    { key: 'sb_tired', label: 'Tired/sleepy during day' },
                                    { key: 'sb_observed', label: 'Observed apneas' },
                                    { key: 'sb_pressure', label: 'Treated for high BP' },
                                    { key: 'sb_bmi', label: 'BMI > 35' },
                                    { key: 'sb_age', label: 'Age > 50' },
                                    { key: 'sb_neck', label: 'Neck circumference > 40cm' },
                                    { key: 'sb_gender', label: 'Male gender' }
                                  ].map(item => (
                                    <label key={item.key} className="flex items-center gap-2 py-0.5">
                                      <input type="checkbox"
                                        checked={!!(telestrokeNote.screeningTools || {})[item.key]}
                                        onChange={(e) => {
                                          const st = {...(telestrokeNote.screeningTools || {}), [item.key]: e.target.checked};
                                          const score = ['sb_snoring','sb_tired','sb_observed','sb_pressure','sb_bmi','sb_age','sb_neck','sb_gender'].filter(k => st[k]).length;
                                          st.stopBangScore = score.toString();
                                          st.stopBangPositive = score >= 3;
                                          setTelestrokeNote({...telestrokeNote, screeningTools: st});
                                        }}
                                        className="text-cyan-600" />
                                      <span className="text-xs text-gray-700">{item.label}</span>
                                    </label>
                                  ))}
                                </div>
                                {(telestrokeNote.screeningTools || {}).stopBangScore && (
                                  <div className={`mt-2 p-2 rounded text-sm font-medium ${parseInt((telestrokeNote.screeningTools || {}).stopBangScore) >= 5 ? 'bg-red-100 text-red-800' : parseInt((telestrokeNote.screeningTools || {}).stopBangScore) >= 3 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                    STOP-BANG: {(telestrokeNote.screeningTools || {}).stopBangScore}/8
                                    {parseInt((telestrokeNote.screeningTools || {}).stopBangScore) >= 5 ? ' — HIGH risk OSA: order sleep study' : parseInt((telestrokeNote.screeningTools || {}).stopBangScore) >= 3 ? ' — INTERMEDIATE risk: consider sleep study' : ' — Low risk'}
                                  </div>
                                )}
                              </div>

                              {/* Post-Stroke Seizure Risk */}
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <h4 className="font-semibold text-amber-800 mb-2">Post-Stroke Seizure Management</h4>
                                <select
                                  value={(telestrokeNote.screeningTools || {}).seizureRisk || ''}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, screeningTools: {...(telestrokeNote.screeningTools || {}), seizureRisk: e.target.value}})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">-- Seizure status --</option>
                                  <option value="no-seizure">No seizure activity</option>
                                  <option value="acute-seizure">Acute symptomatic seizure (within 7 days)</option>
                                  <option value="late-seizure">Late seizure (after 7 days)</option>
                                  <option value="status-epilepticus">Status epilepticus</option>
                                </select>
                                <div className="text-xs text-gray-600 mt-2 space-y-1">
                                  <p>• <strong>Acute symptomatic seizure:</strong> Short-term ASM (7 days for ICH; case-by-case for ischemic). No routine prophylaxis.</p>
                                  <p>• <strong>Late seizure (&gt;7 days):</strong> Start ASM; risk of recurrence is high (~70%). Levetiracetam or lacosamide preferred.</p>
                                  <p>• <strong>Routine prophylactic ASM:</strong> NOT recommended (Class III) for ischemic stroke. May consider 7-day prophylaxis for lobar ICH (Class IIb).</p>
                                </div>
                              </div>
                            </div>
                          </details>
                        )}

                        {/* ========== SECONDARY PREVENTION DASHBOARD ========== */}
                        {telestrokeNote.diagnosis && getPathwayForDiagnosis(telestrokeNote.diagnosis) !== 'mimic' && (
                          <details className="bg-white border-2 border-green-300 rounded-lg shadow-md">
                            <summary className="cursor-pointer p-4 font-semibold text-green-900 hover:bg-green-50 rounded-lg flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <i data-lucide="shield" className="w-5 h-5 text-green-600"></i>
                                Secondary Prevention Dashboard
                              </span>
                              <span className="text-xs text-green-500 font-normal">BP, LDL, Diabetes, Smoking, Exercise, Diet</span>
                            </summary>
                            <div className="p-4 pt-0 space-y-4">
                              {/* BP Management */}
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <h4 className="font-semibold text-red-800 mb-2">Blood Pressure Target: &lt;130/80 mmHg</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-gray-600">Current BP Meds</label>
                                    <input type="text" value={(telestrokeNote.secondaryPrevention || {}).bpMeds || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), bpMeds: e.target.value}})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="e.g., lisinopril 10mg, amlodipine 5mg" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">Target</label>
                                    <select value={(telestrokeNote.secondaryPrevention || {}).bpTarget || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), bpTarget: e.target.value}})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                      <option value="">Select</option>
                                      <option value="<130/80">&lt;130/80 (standard)</option>
                                      <option value="<140/90">&lt;140/90 (if tolerability concern)</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* LDL Ladder */}
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <h4 className="font-semibold text-yellow-800 mb-2">LDL Target: &lt;70 mg/dL (Class I, LOE A)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-xs text-gray-600">Current LDL</label>
                                    <input type="text" value={(telestrokeNote.secondaryPrevention || {}).ldlCurrent || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), ldlCurrent: e.target.value}})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="mg/dL" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">Statin</label>
                                    <select value={(telestrokeNote.secondaryPrevention || {}).statinDose || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), statinDose: e.target.value}})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                      <option value="">Select statin</option>
                                      <option value="atorvastatin-80">Atorvastatin 80mg</option>
                                      <option value="atorvastatin-40">Atorvastatin 40mg</option>
                                      <option value="rosuvastatin-20">Rosuvastatin 20mg</option>
                                      <option value="rosuvastatin-40">Rosuvastatin 40mg</option>
                                    </select>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="flex items-center gap-1 text-xs">
                                      <input type="checkbox" checked={!!(telestrokeNote.secondaryPrevention || {}).ezetimibeAdded}
                                        onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), ezetimibeAdded: e.target.checked}})} />
                                      + Ezetimibe 10mg
                                    </label>
                                    <label className="flex items-center gap-1 text-xs">
                                      <input type="checkbox" checked={!!(telestrokeNote.secondaryPrevention || {}).pcsk9Added}
                                        onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), pcsk9Added: e.target.checked}})} />
                                      + PCSK9 inhibitor
                                    </label>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Ladder: High-intensity statin first. If LDL not at goal, add ezetimibe. If still not at goal, add PCSK9 inhibitor.</p>
                              </div>

                              {/* Antiplatelet Selection */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <h4 className="font-semibold text-green-800 mb-2">Antiplatelet / Antithrombotic Selection</h4>
                                <select value={(telestrokeNote.secondaryPrevention || {}).antiplateletRegimen || ''}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), antiplateletRegimen: e.target.value}})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                  <option value="">-- Select regimen --</option>
                                  <option value="dapt-21">DAPT x 21 days (minor stroke/TIA, NIHSS &le;3)</option>
                                  <option value="asa-mono">ASA 81-325 mg monotherapy</option>
                                  <option value="clopidogrel-mono">Clopidogrel 75 mg monotherapy</option>
                                  <option value="asa-er-dipyridamole">ASA/ER-Dipyridamole (Aggrenox)</option>
                                  <option value="doac-af">DOAC for AF (per CATALYST timing)</option>
                                  <option value="anticoag-other">Anticoagulation (other indication)</option>
                                </select>
                              </div>

                              {/* Diabetes, Smoking, Exercise, Diet */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                  <h4 className="font-semibold text-orange-800 mb-2 text-sm">Diabetes</h4>
                                  <select value={(telestrokeNote.secondaryPrevention || {}).diabetesManagement || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), diabetesManagement: e.target.value}})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                    <option value="">Select</option>
                                    <option value="no-diabetes">No diabetes</option>
                                    <option value="well-controlled">Diabetes — well controlled (A1c &lt;7%)</option>
                                    <option value="needs-optimization">Diabetes — needs optimization</option>
                                    <option value="new-diagnosis">New diabetes diagnosis</option>
                                  </select>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <h4 className="font-semibold text-blue-800 mb-2 text-sm">Smoking</h4>
                                  <select value={(telestrokeNote.secondaryPrevention || {}).smokingStatus || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), smokingStatus: e.target.value}})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                    <option value="">Select</option>
                                    <option value="never">Never smoker</option>
                                    <option value="former">Former smoker</option>
                                    <option value="current">Current smoker — cessation counseled</option>
                                    <option value="current-rx">Current smoker — pharmacotherapy started</option>
                                  </select>
                                </div>
                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                                  <h4 className="font-semibold text-teal-800 mb-2 text-sm">Exercise</h4>
                                  <select value={(telestrokeNote.secondaryPrevention || {}).exercisePlan || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), exercisePlan: e.target.value}})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                    <option value="">Select</option>
                                    <option value="active">Already physically active (&ge;150 min/wk)</option>
                                    <option value="counseled">Exercise counseling provided (target 150 min/wk)</option>
                                    <option value="limited">Limited by disability — PT/OT referral</option>
                                  </select>
                                </div>
                                <div className="bg-lime-50 border border-lime-200 rounded-lg p-3">
                                  <h4 className="font-semibold text-lime-800 mb-2 text-sm">Diet</h4>
                                  <select value={(telestrokeNote.secondaryPrevention || {}).dietPlan || ''}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), dietPlan: e.target.value}})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                    <option value="">Select</option>
                                    <option value="mediterranean">Mediterranean diet counseled</option>
                                    <option value="dash">DASH diet counseled</option>
                                    <option value="sodium-restriction">Sodium restriction counseled (&lt;2.3g/day)</option>
                                    <option value="dietitian">Dietitian referral placed</option>
                                  </select>
                                </div>
                              </div>

                              {/* Follow-Up Timeline */}
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <h4 className="font-semibold text-gray-800 mb-2">Follow-Up Timeline</h4>
                                <select value={(telestrokeNote.secondaryPrevention || {}).followUpTimeline || ''}
                                  onChange={(e) => setTelestrokeNote({...telestrokeNote, secondaryPrevention: {...(telestrokeNote.secondaryPrevention || {}), followUpTimeline: e.target.value}})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                  <option value="">-- Select follow-up plan --</option>
                                  <option value="1-2wk">1-2 weeks (high risk, post-TNK, carotid surgery)</option>
                                  <option value="3mo">3 months (standard)</option>
                                  <option value="6mo">6 months</option>
                                  <option value="12mo">12 months</option>
                                  <option value="custom">Custom (specify in notes)</option>
                                </select>
                                <div className="text-xs text-gray-500 mt-1">
                                  Recommended schedule: 1-2 wk post-discharge, then 3 mo, 6 mo, 12 mo. Adjust based on severity and risk factors.
                                </div>
                              </div>
                            </div>
                          </details>
                        )}

                        {/* ========== SPECIAL POPULATIONS ========== */}
                        {telestrokeNote.diagnosis && getPathwayForDiagnosis(telestrokeNote.diagnosis) !== 'mimic' && (
                          <details className="bg-white border-2 border-amber-300 rounded-lg shadow-md">
                            <summary className="cursor-pointer p-4 font-semibold text-amber-900 hover:bg-amber-50 rounded-lg flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <i data-lucide="users" className="w-5 h-5 text-amber-600"></i>
                                Special Populations &amp; Rehab
                              </span>
                              <span className="text-xs text-amber-500 font-normal">Pregnancy, Craniectomy, Rehab Referral</span>
                            </summary>
                            <div className="p-4 pt-0 space-y-4">
                              {/* Stroke in Pregnancy */}
                              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                                <h4 className="font-semibold text-pink-800 mb-2">Stroke in Pregnancy (AHA 2026)</h4>
                                <label className="flex items-center gap-2 mb-2">
                                  <input type="checkbox" checked={!!telestrokeNote.pregnancyStroke}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, pregnancyStroke: e.target.checked})}
                                    className="text-pink-600" />
                                  <span className="text-sm font-medium">Patient is pregnant or postpartum</span>
                                </label>
                                {telestrokeNote.pregnancyStroke && (
                                  <div className="text-xs text-pink-700 space-y-1 ml-6">
                                    <p>• TNK is a <strong>relative</strong> contraindication — weigh benefit vs risk, consult OB/GYN</p>
                                    <p>• EVT is preferred for LVO (no systemic thrombolytic exposure)</p>
                                    <p>• ASA 81 mg is safe in pregnancy</p>
                                    <p>• Avoid warfarin in first trimester; LMWH preferred</p>
                                    <p>• Consider preeclampsia/eclampsia, RCVS, and CVT in differential</p>
                                  </div>
                                )}
                              </div>

                              {/* Decompressive Craniectomy */}
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <h4 className="font-semibold text-red-800 mb-2">Decompressive Craniectomy Decision Support</h4>
                                <label className="flex items-center gap-2 mb-2">
                                  <input type="checkbox" checked={!!(telestrokeNote.decompressiveCraniectomy || {}).considered}
                                    onChange={(e) => setTelestrokeNote({...telestrokeNote, decompressiveCraniectomy: {...(telestrokeNote.decompressiveCraniectomy || {}), considered: e.target.checked}})}
                                    className="text-red-600" />
                                  <span className="text-sm font-medium">Malignant MCA infarction — craniectomy being considered</span>
                                </label>
                                {(telestrokeNote.decompressiveCraniectomy || {}).considered && (
                                  <div className="space-y-2 ml-6">
                                    <div className="text-xs text-red-700 space-y-1">
                                      <p><strong>DECIMAL/DESTINY/HAMLET criteria:</strong></p>
                                      <p>• Age 18-60: strong benefit (NNT ~2 for survival, ~4 for mRS 0-3)</p>
                                      <p>• Age &gt;60 (DESTINY II): survival benefit but higher rate of severe disability</p>
                                      <p>• NIHSS &gt;15, infarct &gt;50% MCA territory on imaging</p>
                                      <p>• Surgery within 48 hours of symptom onset (ideally &lt;24h)</p>
                                      <p>• <strong>Goals-of-care discussion is critical</strong> — discuss functional outcomes</p>
                                    </div>
                                    <select
                                      value={(telestrokeNote.decompressiveCraniectomy || {}).timing || ''}
                                      onChange={(e) => setTelestrokeNote({...telestrokeNote, decompressiveCraniectomy: {...(telestrokeNote.decompressiveCraniectomy || {}), timing: e.target.value}})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                      <option value="">-- Decision --</option>
                                      <option value="proceeding">Proceeding with craniectomy</option>
                                      <option value="monitoring">Close monitoring — may proceed if deterioration</option>
                                      <option value="not-candidate">Not a candidate (age, goals-of-care, timing)</option>
                                    </select>
                                  </div>
                                )}
                              </div>

                              {/* Rehab Referral Checklist */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <h4 className="font-semibold text-green-800 mb-2">Rehabilitation Referral Checklist</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {[
                                    { key: 'pt', label: 'Physical Therapy (PT)' },
                                    { key: 'ot', label: 'Occupational Therapy (OT)' },
                                    { key: 'slp', label: 'Speech-Language Pathology (SLP)' },
                                    { key: 'neuropsych', label: 'Neuropsychology' },
                                    { key: 'socialWork', label: 'Social Work / Case Mgmt' },
                                    { key: 'vocationalRehab', label: 'Vocational Rehabilitation' }
                                  ].map(item => (
                                    <label key={item.key} className="flex items-center gap-2">
                                      <input type="checkbox"
                                        checked={!!(telestrokeNote.rehabReferral || {})[item.key]}
                                        onChange={(e) => setTelestrokeNote({...telestrokeNote, rehabReferral: {...(telestrokeNote.rehabReferral || {}), [item.key]: e.target.checked}})}
                                        className="text-green-600" />
                                      <span className="text-xs text-gray-700">{item.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </details>
                        )}

                        {/* Discharge Checklist - Show when recommendations or disposition is being addressed */}
                        {telestrokeNote.diagnosis && (
                          <div id="discharge-checklist-section" className="bg-white border-2 border-emerald-300 rounded-lg p-4 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                                <i data-lucide="clipboard-list" className="w-5 h-5"></i>
                                Discharge Checklist
                              </h3>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const dc = telestrokeNote.dischargeChecklist || {};
                                  const total = Object.keys(dc).length;
                                  const checked = Object.values(dc).filter(Boolean).length;
                                  return (
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${checked === total ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {checked}/{total}
                                    </span>
                                  );
                                })()}
                                <button
                                  type="button"
                                  onClick={() => setTelestrokeNote({...telestrokeNote, dischargeChecklistReviewed: !telestrokeNote.dischargeChecklistReviewed})}
                                  className={`text-xs px-2 py-1 rounded-lg font-medium ${telestrokeNote.dischargeChecklistReviewed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                  {telestrokeNote.dischargeChecklistReviewed ? 'Reviewed' : 'Mark Reviewed'}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                              {[
                                { key: 'antiplateletOrAnticoag', label: 'Antiplatelet or anticoagulation prescribed', category: 'Medications' },
                                { key: 'statinPrescribed', label: 'High-intensity statin prescribed', category: 'Medications' },
                                { key: 'bpMedOptimized', label: 'BP medications optimized (target <130/80)', category: 'Medications' },
                                { key: 'diabetesManaged', label: 'Diabetes management addressed', category: 'Risk Factors' },
                                { key: 'smokingCessation', label: 'Smoking cessation counseled', category: 'Risk Factors' },
                                { key: 'dietCounseling', label: 'Diet counseling (Mediterranean/DASH)', category: 'Lifestyle' },
                                { key: 'exerciseCounseling', label: 'Exercise counseling (150 min/wk)', category: 'Lifestyle' },
                                { key: 'followUpNeurology', label: 'Neurology follow-up scheduled', category: 'Follow-up' },
                                { key: 'followUpPCP', label: 'PCP follow-up scheduled', category: 'Follow-up' },
                                { key: 'rehabilitationOrdered', label: 'Rehabilitation services ordered', category: 'Rehab' },
                                { key: 'patientEducation', label: 'Stroke education provided', category: 'Education' },
                                { key: 'drivingRestrictions', label: 'Driving restrictions discussed', category: 'Education' }
                              ].map(item => (
                                <label key={item.key} className="flex items-center gap-2 py-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!(telestrokeNote.dischargeChecklist || {})[item.key]}
                                    onChange={(e) => setTelestrokeNote({
                                      ...telestrokeNote,
                                      dischargeChecklist: {
                                        ...(telestrokeNote.dischargeChecklist || {}),
                                        [item.key]: e.target.checked
                                      }
                                    })}
                                    className="rounded border-emerald-300 text-emerald-600"
                                  />
                                  <span className="text-sm text-gray-700">{item.label}</span>
                                </label>
                              ))}
                            </div>

                            <div className="mt-2 text-xs text-gray-500 italic">
                              Based on AHA/ASA Secondary Stroke Prevention 2021 guidelines (Kleindorfer DO et al. Stroke. 2021;52:e364-e467)
                            </div>
                          </div>
                        )}

                        {/* Section 7: Recommendations */}
                        <div id="recommendations-section" className="bg-white border-2 border-teal-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-teal-900">7. Recommendations</h3>
                            <i data-lucide="clipboard-check" className="w-5 h-5 text-teal-600"></i>
                          </div>

                          {/* Auto-Note Generation Button */}
                          <div className="mb-3">
                            <button
                              type="button"
                              onClick={() => {
                                const recs = getContextualRecommendations();
                                const pathwayType = getPathwayForDiagnosis(telestrokeNote.diagnosis);
                                const age = telestrokeNote.age || '[Age]';
                                const sex = telestrokeNote.sex === 'M' ? 'male' : telestrokeNote.sex === 'F' ? 'female' : '[sex]';
                                const dx = telestrokeNote.diagnosis || '[Diagnosis]';
                                const nihss = telestrokeNote.nihss || nihssScore || '';
                                const bp = telestrokeNote.presentingBP || '';
                                const ct = telestrokeNote.ctResults || '';
                                const cta = telestrokeNote.ctaResults || '';

                                let note = '';

                                // Header
                                note += `TELESTROKE CONSULTATION NOTE\n`;
                                note += `Date: ${new Date().toLocaleDateString()}\n\n`;

                                // HPI
                                note += `HPI: ${age} year old ${sex}`;
                                if (telestrokeNote.pmh) note += ` with PMH of ${telestrokeNote.pmh}`;
                                note += ` presenting with ${telestrokeNote.symptoms || '[symptoms]'}.\n`;
                                if (lkwTime) {
                                  note += `Last known well: ${lkwTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} on ${lkwTime.toLocaleDateString()}.\n`;
                                }
                                note += '\n';

                                // Exam
                                note += `EXAMINATION:\n`;
                                if (nihss) note += `NIHSS: ${nihss}`;
                                if (telestrokeNote.nihssDetails) note += ` (${telestrokeNote.nihssDetails})`;
                                if (nihss) note += '\n';
                                if (bp) note += `Presenting BP: ${bp}\n`;
                                note += '\n';

                                // Imaging
                                note += `IMAGING:\n`;
                                if (ct) note += `Head CT: ${ct}\n`;
                                if (cta) note += `CTA Head/Neck: ${cta}\n`;
                                if (telestrokeNote.ctpResults) note += `CTP: ${telestrokeNote.ctpResults}\n`;
                                if (aspectsScore) note += `ASPECTS: ${aspectsScore}\n`;
                                note += '\n';

                                // Assessment
                                note += `ASSESSMENT: ${dx}\n\n`;

                                // Pathway-specific summary
                                if (pathwayType === 'ischemic') {
                                  note += `PLAN:\n`;
                                  if (telestrokeNote.tnkRecommended) {
                                    note += `- TNK 0.25 mg/kg IV bolus (max 25 mg) recommended and administered`;
                                    if (telestrokeNote.tnkAdminTime) note += ` at ${telestrokeNote.tnkAdminTime}`;
                                    note += `.\n`;
                                  } else {
                                    note += `- IV TNK: Not recommended.\n`;
                                  }
                                  if (telestrokeNote.evtRecommended) {
                                    note += `- EVT: Recommended. Transfer to EVT-capable center.\n`;
                                  }
                                } else if (pathwayType === 'ich') {
                                  note += `PLAN:\n`;
                                  if (telestrokeNote.ichBPManaged) note += `- BP management initiated (target SBP 130-150).\n`;
                                  if (telestrokeNote.ichReversalOrdered) note += `- Anticoagulation reversal ordered.\n`;
                                  if (telestrokeNote.ichNeurosurgeryConsulted) note += `- Neurosurgery consulted.\n`;
                                } else if (pathwayType === 'sah') {
                                  note += `PLAN:\n`;
                                  if (telestrokeNote.sahGrade) note += `- SAH Grade: ${telestrokeNote.sahGrade} (${telestrokeNote.sahGradeScale === 'huntHess' ? 'Hunt & Hess' : telestrokeNote.sahGradeScale === 'wfns' ? 'WFNS' : 'scale not specified'})\n`;
                                  if (telestrokeNote.sahBPManaged) note += `- BP management initiated (target SBP <160 pre-securing).\n`;
                                  if (telestrokeNote.sahNimodipine) note += `- Nimodipine 60 mg q4h started for DCI prevention.\n`;
                                  if (telestrokeNote.sahEVDPlaced) note += `- EVD placed for hydrocephalus management.\n`;
                                  if (telestrokeNote.sahNeurosurgeryConsulted) note += `- Neurosurgery consulted for aneurysm securing.\n`;
                                  if (telestrokeNote.sahAneurysmSecured) note += `- Aneurysm securing plan documented.\n`;
                                } else if (pathwayType === 'cvt') {
                                  note += `PLAN:\n`;
                                  if (telestrokeNote.cvtAnticoagStarted) note += `- Anticoagulation initiated (${telestrokeNote.cvtAnticoagType || 'agent selected'}).\n`;
                                  if (telestrokeNote.cvtIcpManaged) note += `- ICP management addressed.\n`;
                                  if (telestrokeNote.cvtSeizureManaged) note += `- Seizure management addressed.\n`;
                                  if (telestrokeNote.cvtHematologyConsulted) note += `- Hematology consulted for thrombophilia workup.\n`;
                                } else if (pathwayType === 'tia') {
                                  note += `PLAN:\n`;
                                  note += `- Admit for urgent inpatient TIA workup (Class I, LOE B-NR).\n`;
                                  const tiaW = telestrokeNote.tiaWorkup || {};
                                  const tiaComplete = Object.values(tiaW).filter(Boolean).length;
                                  const tiaTotal = Object.keys(tiaW).length;
                                  note += `- TIA workup: ${tiaComplete}/${tiaTotal} items completed.\n`;
                                  if (tiaW.mriDwi) note += `- MRI DWI obtained.\n`;
                                  if (tiaW.ctaHeadNeck) note += `- CTA Head/Neck obtained.\n`;
                                } else if (pathwayType === 'dissection') {
                                  note += `PLAN:\n`;
                                  const diss = telestrokeNote.dissectionPathway || {};
                                  if (diss.antithromboticType) note += `- Antithrombotic therapy: ${diss.antithromboticType.replace(/-/g, ' ')}.\n`;
                                  if (diss.imagingFollowUp) note += `- Vascular imaging follow-up: ${diss.imagingFollowUp}.\n`;
                                  note += `- Cervical manipulation avoidance counseled.\n`;
                                }

                                // TOAST Classification
                                if (telestrokeNote.toastClassification) {
                                  const toastLabels = { 'large-artery': 'Large Artery Atherosclerosis', 'cardioembolism': 'Cardioembolism', 'small-vessel': 'Small Vessel Occlusion (Lacunar)', 'other-determined': 'Other Determined Etiology', 'cryptogenic': 'Cryptogenic / ESUS' };
                                  note += `\nETIOLOGIC CLASSIFICATION (TOAST): ${toastLabels[telestrokeNote.toastClassification] || telestrokeNote.toastClassification}\n`;
                                }

                                // Cardiac Workup
                                const cw = telestrokeNote.cardiacWorkup || {};
                                if (cw.ecgComplete || cw.telemetryOrdered || cw.echoOrdered || cw.extendedMonitoringType) {
                                  note += `\nCARDIAC WORKUP:\n`;
                                  if (cw.ecgComplete) note += `- 12-Lead ECG completed.\n`;
                                  if (cw.telemetryOrdered) note += `- Inpatient telemetry ordered.\n`;
                                  if (cw.echoOrdered) note += `- Echo ordered.\n`;
                                  if (cw.extendedMonitoringType) {
                                    const monLabels = { '30-day-monitor': '30-day ambulatory monitor', '14-day-patch': '14-day continuous patch', 'ilr': 'Implantable loop recorder', 'none-af-known': 'Not needed (AF known)', 'none-other': 'Not indicated' };
                                    note += `- Extended monitoring: ${monLabels[cw.extendedMonitoringType] || cw.extendedMonitoringType}.\n`;
                                  }
                                  if (cw.pfoEvaluation) note += `- PFO evaluation: ${cw.pfoEvaluation.replace(/-/g, ' ')}.\n`;
                                  if (cw.pascalClassification) note += `- PASCAL classification: ${cw.pascalClassification}.\n`;
                                }

                                // Screening Tools
                                const st = telestrokeNote.screeningTools || {};
                                if (st.phq2Score || st.mocaScore || st.stopBangScore || st.seizureRisk) {
                                  note += `\nSCREENING:\n`;
                                  if (st.phq2Score) note += `- PHQ-2: ${st.phq2Score}/6 (${st.phq2Positive ? 'POSITIVE' : 'negative'}).\n`;
                                  if (st.mocaScore) note += `- MoCA: ${st.mocaScore}/30${st.mocaReferral ? ' — neuropsych referral placed' : ''}.\n`;
                                  if (st.stopBangScore) note += `- STOP-BANG: ${st.stopBangScore}/8 (${parseInt(st.stopBangScore) >= 5 ? 'HIGH risk' : parseInt(st.stopBangScore) >= 3 ? 'INTERMEDIATE risk' : 'low risk'} OSA).\n`;
                                  if (st.seizureRisk) note += `- Seizure status: ${st.seizureRisk.replace(/-/g, ' ')}.\n`;
                                }

                                // Secondary Prevention
                                const sp = telestrokeNote.secondaryPrevention || {};
                                if (sp.statinDose || sp.antiplateletRegimen || sp.bpTarget) {
                                  note += `\nSECONDARY PREVENTION:\n`;
                                  if (sp.antiplateletRegimen) note += `- Antithrombotic: ${sp.antiplateletRegimen.replace(/-/g, ' ')}.\n`;
                                  if (sp.statinDose) note += `- Statin: ${sp.statinDose.replace(/-/g, ' ')}${sp.ezetimibeAdded ? ' + ezetimibe' : ''}${sp.pcsk9Added ? ' + PCSK9i' : ''}.\n`;
                                  if (sp.bpTarget) note += `- BP target: ${sp.bpTarget}.\n`;
                                  if (sp.diabetesManagement) note += `- Diabetes: ${sp.diabetesManagement.replace(/-/g, ' ')}.\n`;
                                  if (sp.smokingStatus) note += `- Smoking: ${sp.smokingStatus}.\n`;
                                  if (sp.followUpTimeline) note += `- Follow-up: ${sp.followUpTimeline}.\n`;
                                }

                                // Special Populations
                                if (telestrokeNote.pregnancyStroke) note += `\nSPECIAL: Pregnant/postpartum patient — see pregnancy-specific management above.\n`;
                                if ((telestrokeNote.decompressiveCraniectomy || {}).considered) note += `DECOMPRESSIVE CRANIECTOMY: ${(telestrokeNote.decompressiveCraniectomy || {}).timing || 'being considered'}.\n`;
                                const rehab = telestrokeNote.rehabReferral || {};
                                const rehabItems = Object.entries(rehab).filter(([k, v]) => v);
                                if (rehabItems.length > 0) {
                                  note += `\nREHAB REFERRALS: ${rehabItems.map(([k]) => k.replace(/([A-Z])/g, ' $1').trim()).join(', ')}.\n`;
                                }

                                // Guideline-based recommendations
                                if (recs.length > 0) {
                                  note += `\nGUIDELINE-BASED RECOMMENDATIONS:\n`;
                                  recs.forEach(rec => {
                                    note += `- ${rec.title}: ${rec.recommendation} [Class ${rec.classOfRec}, LOE ${rec.levelOfEvidence}] (${rec.guideline})\n`;
                                  });
                                }

                                // Disposition
                                if (telestrokeNote.disposition) {
                                  note += `\nDISPOSITION: ${telestrokeNote.disposition}\n`;
                                }
                                if (telestrokeNote.admitLocation) {
                                  note += `Admit to: ${telestrokeNote.admitLocation}\n`;
                                }

                                // Discharge checklist summary
                                const dc = telestrokeNote.dischargeChecklist || {};
                                const dcChecked = Object.entries(dc).filter(([k, v]) => v);
                                if (dcChecked.length > 0) {
                                  note += `\nDISCHARGE CHECKLIST ITEMS COMPLETED:\n`;
                                  const dcLabels = {
                                    antiplateletOrAnticoag: 'Antiplatelet/anticoagulation prescribed',
                                    statinPrescribed: 'High-intensity statin prescribed',
                                    bpMedOptimized: 'BP medications optimized',
                                    diabetesManaged: 'Diabetes management addressed',
                                    smokingCessation: 'Smoking cessation counseled',
                                    dietCounseling: 'Diet counseling provided',
                                    exerciseCounseling: 'Exercise counseling provided',
                                    followUpNeurology: 'Neurology follow-up scheduled',
                                    followUpPCP: 'PCP follow-up scheduled',
                                    rehabilitationOrdered: 'Rehabilitation ordered',
                                    patientEducation: 'Stroke education provided',
                                    drivingRestrictions: 'Driving restrictions discussed'
                                  };
                                  dcChecked.forEach(([key]) => {
                                    note += `- ${dcLabels[key] || key}\n`;
                                  });
                                }

                                setTelestrokeNote({...telestrokeNote, recommendationsText: note});
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                            >
                              <i data-lucide="file-text" className="w-4 h-4"></i>
                              Generate Auto-Note
                            </button>
                            <span className="text-xs text-gray-500 ml-2">Populates note from patient data + guideline citations</span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Recommendation Summary</span>
                            </div>
                            <textarea
                              value={telestrokeNote.recommendationsText}
                              onChange={(e) => setTelestrokeNote({...telestrokeNote, recommendationsText: e.target.value})}
                              placeholder=""
                              rows="6"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Pulsara Summary */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-indigo-800 text-sm">Pulsara Summary</span>
                            <button
                              onClick={() => {
                                const age = telestrokeNote.age || "[Age]";
                                const sexRaw = telestrokeNote.sex;
                                const sex = sexRaw === 'M' ? 'male' : sexRaw === 'F' ? 'female' : '[sex]';
                                const pmh = telestrokeNote.pmh || "no PMH";
                                const symptoms = telestrokeNote.symptoms || "[symptoms]";
                                const lkw = lkwTime ? lkwTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "[time]";
                                const lkwDate = lkwTime ? lkwTime.toLocaleDateString('en-US') : "[date]";
                                const nihss = telestrokeNote.nihss || nihssScore || "[score]";
                                const nihssDeficits = telestrokeNote.nihssDetails ? ` (${telestrokeNote.nihssDetails})` : "";
                                const ctResults = telestrokeNote.ctResults || "[CT findings]";
                                const ctaResults = telestrokeNote.ctaResults || "[CTA findings]";
                                const ctpResults = telestrokeNote.ctpResults || "N/A";
                                const aspectsStr = aspectsScore ? ` ASPECTS: ${aspectsScore}.` : "";
                                const tnkStatus = telestrokeNote.tnkRecommended ? "Recommended" : "Not Recommended";
                                const evtStatus = telestrokeNote.evtRecommended ? "Recommended" : "Not Recommended";
                                const rationale = telestrokeNote.rationale || "[rationale]";

                                const summary = `${age} year old ${sex} with ${pmh} who presents with ${symptoms}. Last known well is ${lkw} ${lkwDate}. NIHSS score: ${nihss}${nihssDeficits}. Head CT: ${ctResults}.${aspectsStr} CTA Head/Neck: ${ctaResults}. CTP: ${ctpResults}. TNK Treatment: ${tnkStatus}. EVT: ${evtStatus}. Rationale for Treatment Recommendation: ${rationale}.`;
                                navigator.clipboard.writeText(summary);
                                setCopiedText('tel-pulsara');
                                setTimeout(() => setCopiedText(''), 2000);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              <i data-lucide={copiedText === 'tel-pulsara' ? 'check' : 'copy'} className="w-4 h-4"></i>
                              {copiedText === 'tel-pulsara' ? 'Copied!' : 'Copy Pulsara'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">
                            {(() => {
                              const age = telestrokeNote.age || "[Age]";
                              const sexRaw = telestrokeNote.sex;
                              const sex = sexRaw === 'M' ? 'male' : sexRaw === 'F' ? 'female' : '[sex]';
                              const pmh = telestrokeNote.pmh || "no PMH";
                              const symptoms = telestrokeNote.symptoms || "[symptoms]";
                              const lkw = lkwTime ? lkwTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "[time]";
                              const lkwDate = lkwTime ? lkwTime.toLocaleDateString('en-US') : "[date]";
                              const nihss = telestrokeNote.nihss || nihssScore || "[score]";
                              const nihssDeficits = telestrokeNote.nihssDetails ? ` (${telestrokeNote.nihssDetails})` : "";
                              const ctResults = telestrokeNote.ctResults || "[CT findings]";
                              const ctaResults = telestrokeNote.ctaResults || "[CTA findings]";
                              const ctpResults = telestrokeNote.ctpResults || "N/A";
                              const aspectsStr = aspectsScore ? ` ASPECTS: ${aspectsScore}.` : "";
                              const tnkStatus = telestrokeNote.tnkRecommended ? "Recommended" : "Not Recommended";
                              const evtStatus = telestrokeNote.evtRecommended ? "Recommended" : "Not Recommended";
                              const rationale = telestrokeNote.rationale || "[rationale]";
                              return `${age} year old ${sex} with ${pmh} who presents with ${symptoms}. Last known well is ${lkw} ${lkwDate}. NIHSS score: ${nihss}${nihssDeficits}. Head CT: ${ctResults}.${aspectsStr} CTA Head/Neck: ${ctaResults}. CTP: ${ctpResults}. TNK Treatment: ${tnkStatus}. EVT: ${evtStatus}. Rationale: ${rationale}.`;
                            })()}
                          </p>
                        </div>

                        {/* Telestroke Section */}
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Telestroke</h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* OSH Transfer */}
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-gray-700 mb-2">Transfer</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Transport mode</label>
                                  <select
                                    value={telestrokeNote.transportMode || ''}
                                    onChange={(e) => setTelestrokeNote({ ...telestrokeNote, transportMode: e.target.value })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">-- Select --</option>
                                    <option value="Ground">Ground</option>
                                    <option value="Air">Air</option>
                                    <option value="Private">Private</option>
                                    <option value="Pending">Pending</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">ETA (time)</label>
                                  <input
                                    type="datetime-local"
                                    value={telestrokeNote.transportEta || ''}
                                    onChange={(e) => setTelestrokeNote({ ...telestrokeNote, transportEta: e.target.value })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Transport notes</label>
                                <textarea
                                  value={telestrokeNote.transportNotes || ''}
                                  onChange={(e) => setTelestrokeNote({ ...telestrokeNote, transportNotes: e.target.value })}
                                  rows="2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="Air/ground contact, staging, or special considerations"
                                />
                              </div>
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Transfer decision note</label>
                                <textarea
                                  value={telestrokeNote.transferRationale || ''}
                                  onChange={(e) => setTelestrokeNote({ ...telestrokeNote, transferRationale: e.target.value })}
                                  rows="3"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="Auto-generate or type the transfer decision note..."
                                />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt('Reason for accepting transfer (optional)');
                                    const note = buildTransferDecisionText('accept', reason || '');
                                    setTelestrokeNote({ ...telestrokeNote, transferAccepted: true, transferRationale: note });
                                    navigator.clipboard.writeText(note);
                                    setCopiedText('transfer-accept');
                                    setTimeout(() => setCopiedText(''), 2000);
                                  }}
                                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                                >
                                  {copiedText === 'transfer-accept' ? 'Copied!' : 'Accept + copy'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt('Reason for declining transfer');
                                    if (!reason) return;
                                    const note = buildTransferDecisionText('decline', reason);
                                    setTelestrokeNote({ ...telestrokeNote, transferAccepted: false, transferRationale: note });
                                    navigator.clipboard.writeText(note);
                                    setCopiedText('transfer-decline');
                                    setTimeout(() => setCopiedText(''), 2000);
                                  }}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                                >
                                  {copiedText === 'transfer-decline' ? 'Copied!' : 'Decline + copy'}
                                </button>
                              </div>
                            </div>

                            {/* TNK risk/benefit discussion documentation */}
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-gray-700 mb-2">TNK risk/benefit discussion documentation:</h4>
                              <p className="text-sm">After ensuring that there were no evident contraindications, TNK administration was recommended. Potential benefits, potential risks (including a potential risk of sx ICH of up to 4%), and alternatives to treatment were discussed with the OSH provider and patient/family prior to initiating treatment.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Post-IV TNK/tPA recommendations */}
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-gray-700 mb-2">Post-IV TNK/tPA recommendations:</h4>
                              <ul className="text-sm space-y-1">
                                <li>• Admit to ICU</li>
                                <li>• q1hour neurochecks and VS monitoring</li>
                                <li>• NO antithrombotics/anticoagulants for 24 hour after IV-tPA</li>
                                <li>• Maintain BP&lt;180/105 for 24 hours after IV-tPA</li>
                                <li>• HCT 24 hours post-tPA administration</li>
                                <li>• MRI Brain with diffusion weighted imaging</li>
                                <li>• EKG/telemetry</li>
                                <li>• Transthoracic echocardiogram</li>
                                <li>• Fasting lipid panel, HgA1c</li>
                                <li>• PT/OT/SLP evaluations</li>
                                <li>• SCDs for DVT ppx</li>
                                <li>• Inpatient neurology consultation for further diagnostic evaluation and management</li>
                              </ul>
                            </div>

                            {/* MT risk/benefit discussion */}
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-gray-700 mb-2">MT risk/benefit discussion:</h4>
                              <p className="text-sm">Given the presence of a large vascular occlusion, disabling neurological symptoms, and no evident contraindications - the patient will be transferred to HMC for mechanical thrombectomy consideration. Potential benefits, potential risks, and alternatives to treatment were discussed with the OSH provider and patient/family; the neuro-IR team at HMC will obtain informed consent from the patient/family.</p>
                            </div>
                          </div>
                        </div>

                        {/* Telestroke Note - Epic */}
                        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 shadow-md mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2">
                              <i data-lucide="file-text" className="w-5 h-5"></i>
                              Telestroke Note - Epic
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  const note = generateTelestrokeNote();
                                  navigator.clipboard.writeText(note);
                                  setCopiedText('encounter-note');
                                  setTimeout(() => setCopiedText(''), 2000);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <i data-lucide={copiedText === 'encounter-note' ? 'check' : 'copy'} className="w-4 h-4"></i>
                                {copiedText === 'encounter-note' ? 'Copied!' : 'Copy Note'}
                              </button>
                            </div>
                          </div>


                          <div className="bg-white p-3 rounded border border-gray-200 max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono">
                              {generateTelestrokeNote()}
                            </pre>
                          </div>
                        </div>

                      </div>

                      {/* RIGHT COLUMN - Live Preview & Tools (1/3 width on desktop, full width on mobile) */}
                      <div className={`lg:col-span-1 space-y-4`}>

                        {/* Treatment Window Countdown - Enhanced with Elapsed Timer & Audible Alerts */}
                        {(() => {
                          const timeFromLKW = calculateTimeFromLKW();
                          if (!timeFromLKW) return null;

                          const totalHours = timeFromLKW.total;
                          const totalMinutes = totalHours * 60;
                          const tnkRemaining = 4.5 - totalHours;
                          const tnkRemainingMinutes = tnkRemaining * 60;
                          const evtEarlyRemaining = 6 - totalHours;
                          const evtLateRemaining = 24 - totalHours;

                          // Calculate elapsed time with seconds precision
                          const elapsedHours = Math.floor(elapsedSeconds / 3600);
                          const elapsedMins = Math.floor((elapsedSeconds % 3600) / 60);
                          const elapsedSecs = elapsedSeconds % 60;

                          // Determine color based on elapsed time
                          const getElapsedColor = () => {
                            if (totalHours < 3) return 'from-green-500 to-green-600';
                            if (totalHours < 4) return 'from-yellow-500 to-yellow-600';
                            if (totalHours < 4.5) return 'from-orange-500 to-orange-600';
                            return 'from-red-600 to-red-700';
                          };

                          const getTextColor = () => {
                            if (totalHours < 3) return 'text-green-100';
                            if (totalHours < 4) return 'text-yellow-100';
                            if (totalHours < 4.5) return 'text-orange-100';
                            return 'text-red-100';
                          };

                          return (
                            <div className={`bg-white rounded-lg shadow-lg border-2 ${
                              alertFlashing ? 'border-red-500 alert-flash' : 'border-blue-400'
                            } lg:sticky lg:top-40 z-30 transition-all duration-300 ${
                              timerSidebarCollapsed ? 'p-2' : 'p-4'
                            }`}>

                              {/* Header with Collapse Toggle and Mute Toggle */}
                              <div className={`flex items-center justify-between ${timerSidebarCollapsed ? '' : 'mb-3'}`}>
                                <button
                                  onClick={() => setTimerSidebarCollapsed(!timerSidebarCollapsed)}
                                  className="font-bold text-lg text-blue-900 flex items-center gap-2 hover:text-blue-700 transition-colors"
                                  title={timerSidebarCollapsed ? 'Expand timer' : 'Collapse timer'}
                                >
                                  <i data-lucide={timerSidebarCollapsed ? 'chevron-right' : 'chevron-down'} className="w-4 h-4"></i>
                                  <i data-lucide="clock" className="w-5 h-5"></i>
                                  {timerSidebarCollapsed ? (
                                    <span className="text-sm font-mono">
                                      {elapsedHours}h {elapsedMins.toString().padStart(2, '0')}m
                                    </span>
                                  ) : (
                                    <span>Treatment Windows</span>
                                  )}
                                </button>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={toggleAlertMute}
                                    className={`p-2 rounded-full transition-colors ${
                                      alertsMuted
                                        ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                    }`}
                                    title={alertsMuted ? 'Unmute alerts' : 'Mute alerts'}
                                  >
                                    {alertsMuted ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m11 5-6 6h-4v6h4l6 6v-18z"></path>
                                        <line x1="23" y1="9" x2="17" y2="15"></line>
                                        <line x1="17" y1="9" x2="23" y2="15"></line>
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Collapsible Content */}
                              {!timerSidebarCollapsed && (
                                <>
                              {/* ============================================ */}
                              {/* PROMINENT ELAPSED TIMER FROM LKW             */}
                              {/* ============================================ */}
                              <div className={`bg-gradient-to-r ${getElapsedColor()} rounded-xl p-4 mb-4 text-white shadow-md ${
                                totalHours >= 4 && totalHours < 4.5 ? 'urgent-pulse' : ''
                              }`}>
                                <div className="text-center">
                                  {(() => {
                                    const onsetLabel = timeFromLKW?.label || 'LKW';
                                    const discoveryTime = getDiscoveryDateTime();
                                    const onsetTimeDisplay = telestrokeNote.lkwUnknown
                                      ? (discoveryTime ? discoveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--')
                                      : (lkwTime ? new Date(lkwTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--');
                                    return (
                                      <>
                                        <p className={`text-xs font-medium ${getTextColor()} opacity-90 uppercase tracking-wide`}>
                                          Time Elapsed from {onsetLabel}
                                        </p>
                                        <div className="text-4xl font-mono font-bold mt-1 tracking-tight">
                                          {elapsedHours}h {elapsedMins.toString().padStart(2, '0')}m {elapsedSecs.toString().padStart(2, '0')}s
                                        </div>
                                        <p className={`text-xs mt-1 ${getTextColor()} opacity-75`}>
                                          {onsetLabel}: {onsetTimeDisplay}
                                        </p>
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Countdown to TNK window closure */}
                                {tnkRemaining > 0 && (
                                  <div className={`mt-3 pt-3 border-t border-white/30 text-center ${
                                    tnkRemainingMinutes <= 30 ? 'urgent-pulse' : ''
                                  }`}>
                                    <p className="text-xs opacity-80 uppercase tracking-wide">TNK Window Closes In</p>
                                    <div className={`text-2xl font-bold ${
                                      tnkRemainingMinutes <= 15 ? 'text-yellow-200' : 'text-white'
                                    }`}>
                                      {Math.floor(tnkRemainingMinutes / 60)}h {Math.floor(tnkRemainingMinutes % 60)}m
                                    </div>
                                    {tnkRemainingMinutes <= 30 && (
                                      <p className="text-xs text-yellow-200 font-semibold mt-1 animate-pulse">
                                        {tnkRemainingMinutes <= 15 ? 'CRITICAL - Less than 15 min remaining!' : 'Less than 30 min remaining'}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Window closed message */}
                                {tnkRemaining <= 0 && (
                                  <div className="mt-3 pt-3 border-t border-white/30 text-center">
                                    <p className="text-lg font-bold text-white/90">TNK Window Closed</p>
                                    <p className="text-xs text-white/70">
                                      {Math.abs(Math.floor(tnkRemainingMinutes / 60))}h {Math.abs(Math.floor(tnkRemainingMinutes % 60))}m ago
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                {/* TNK Window */}
                                <div className={`p-3 rounded-lg border-2 ${
                                  tnkRemaining > 1 ? 'bg-green-50 border-green-500' :
                                  tnkRemaining > 0 ? 'bg-yellow-50 border-yellow-500' :
                                  'bg-gray-50 border-gray-400'
                                } ${tnkRemaining > 0 && tnkRemaining < 0.5 ? 'animate-pulse' : ''}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm">
                                        {tnkRemaining > 0 ? 'TNK (Thrombolysis)' : 'TNK Closed'}
                                      </span>
                                    </div>
                                    {tnkRemaining > 0 && (
                                      <span className={`font-bold text-lg ${
                                        tnkRemaining < 0.5 ? 'text-red-600' : tnkRemaining < 1 ? 'text-yellow-600' : 'text-green-600'
                                      }`}>
                                        {Math.floor(tnkRemaining)}h {Math.floor((tnkRemaining % 1) * 60)}m left
                                      </span>
                                    )}
                                    {tnkRemaining <= 0 && (
                                      <span className="text-gray-600 text-xs font-semibold">
                                        -{Math.floor(Math.abs(tnkRemaining))}h {Math.floor((Math.abs(tnkRemaining) % 1) * 60)}m
                                      </span>
                                    )}
                                  </div>
                                  {/* Progress Bar */}
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        tnkRemaining > 1 ? 'bg-green-500' :
                                        tnkRemaining > 0 ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                      }`}
                                      style={{ width: `${Math.max(0, Math.min(100, (totalHours / 4.5) * 100))}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs mt-1 text-gray-600">0-4.5h from LKW</p>
                                </div>

                                {/* Early EVT Window (0-6h) */}
                                <div className={`p-3 rounded-lg border-2 ${
                                  evtEarlyRemaining > 1 ? 'bg-blue-50 border-blue-500' :
                                  evtEarlyRemaining > 0 ? 'bg-yellow-50 border-yellow-500' :
                                  'bg-gray-50 border-gray-400'
                                } ${evtEarlyRemaining > 0 && evtEarlyRemaining < 0.5 ? 'animate-pulse' : ''}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm">
                                        {evtEarlyRemaining > 0 ? 'EVT (Early Window)' : 'Early EVT Closed'}
                                      </span>
                                    </div>
                                    {evtEarlyRemaining > 0 && (
                                      <span className={`font-bold text-lg ${
                                        evtEarlyRemaining < 0.5 ? 'text-red-600' : evtEarlyRemaining < 1 ? 'text-yellow-600' : 'text-blue-600'
                                      }`}>
                                        {Math.floor(evtEarlyRemaining)}h {Math.floor((evtEarlyRemaining % 1) * 60)}m left
                                      </span>
                                    )}
                                    {evtEarlyRemaining <= 0 && (
                                      <span className="text-gray-600 text-xs font-semibold">
                                        -{Math.floor(Math.abs(evtEarlyRemaining))}h {Math.floor((Math.abs(evtEarlyRemaining) % 1) * 60)}m
                                      </span>
                                    )}
                                  </div>
                                  {/* Progress Bar */}
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        evtEarlyRemaining > 1 ? 'bg-blue-500' :
                                        evtEarlyRemaining > 0 ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                      }`}
                                      style={{ width: `${Math.max(0, Math.min(100, (totalHours / 6) * 100))}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs mt-1 text-gray-600">0-6h from LKW</p>
                                </div>

                                {/* Late EVT Window (6-24h) */}
                                {totalHours >= 6 && (
                                  <div className={`p-3 rounded-lg border-2 ${
                                    evtLateRemaining > 0 ? 'bg-purple-50 border-purple-500' : 'bg-gray-50 border-gray-400'
                                  }`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">
                                          {evtLateRemaining > 0 ? 'EVT (Extended Window)' : 'All Windows Closed'}
                                        </span>
                                      </div>
                                      {evtLateRemaining > 0 && (
                                        <span className="font-bold text-lg text-purple-600">
                                          {Math.floor(evtLateRemaining)}h {Math.floor((evtLateRemaining % 1) * 60)}m left
                                        </span>
                                      )}
                                      {evtLateRemaining <= 0 && (
                                        <span className="text-gray-600 text-xs font-semibold">All closed</span>
                                      )}
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-2 rounded-full transition-all ${
                                          evtLateRemaining > 0 ? 'bg-purple-500' : 'bg-gray-400'
                                        }`}
                                        style={{ width: `${Math.max(0, Math.min(100, (totalHours / 24) * 100))}%` }}
                                      ></div>
                                    </div>
                                    <p className="text-xs mt-1 text-gray-600">6-24h (perfusion imaging required)</p>
                                  </div>
                                )}
                              </div>

                              {/* Alert status indicator */}
                              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                                <span>
                                  Alerts: {alertsMuted ? 'Muted' : 'Active'}
                                  {!alertsMuted && tnkRemaining > 0 && tnkRemaining < 0.5 && ' (30m, 15m, 0m)'}
                                </span>
                                {lastAlertPlayed && (
                                  <span className="text-orange-600 font-medium">
                                    Last: {lastAlertPlayed === 'warning-30' ? '30m warning' :
                                           lastAlertPlayed === 'warning-15' ? '15m warning' :
                                           'Window closed'}
                                  </span>
                                )}
                              </div>
                                </>
                              )}
                            </div>
                          );
                        })()}

                        {/* ============================================ */}
                        {/* DETAILED CLINICAL TRIAL INFORMATION         */}
                        {/* Expanded descriptions for Video Telestroke  */}
                        {/* ============================================ */}
                        {consultationType === 'videoTelestroke' && telestrokeNote.diagnosisCategory && (
                          <details className="bg-white border-2 border-indigo-200 rounded-lg shadow-md overflow-hidden">
                            <summary className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 cursor-pointer hover:from-indigo-600 hover:to-purple-600 transition-colors">
                              <span className="font-bold text-sm flex items-center gap-2">
                                🔬 Clinical Trial Details
                                <span className="text-xs opacity-75">(click to expand full descriptions)</span>
                              </span>
                            </summary>

                            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                              {telestrokeNote.diagnosisCategory === 'ischemic' && (
                                <div className="space-y-3">
                                  <h4 className="font-bold text-indigo-800 border-b pb-2">Active Ischemic Stroke Trials</h4>

                                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="font-semibold text-blue-800">SISTER Trial (NCT05948566)</p>
                                    <p className="text-sm text-gray-700">TS23 (monoclonal antibody to α2-antiplasmin) for late thrombolysis in acute ischemic stroke patients presenting 4.5-24 hours from last known well. Anterior circulation, NIHSS ≥4, favorable perfusion imaging (mismatch ratio &gt;1.2, core &lt;70cc). No IV thrombolysis or EVT with clot engagement.</p>
                                  </div>

                                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="font-semibold text-blue-800">STEP-EVT Trial (NCT06289985)</p>
                                    <p className="text-sm text-gray-700">NIH StrokeNet adaptive platform trial optimizing endovascular therapy for mild stroke (NIHSS 0-5 with LVO) and medium/distal vessel occlusions (M2, M3, A1-A3, P1-P3). Within 24 hours, pre-stroke mRS ≤2.</p>
                                  </div>

                                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="font-semibold text-blue-800">PICASSO Trial (NCT05611242)</p>
                                    <p className="text-sm text-gray-700">Mechanical thrombectomy with vs without acute carotid stenting for tandem lesions. Age 18-79, tandem lesion (carotid stenosis 70-100% + intracranial LVO), within 16 hours, NIHSS ≥4, ASPECTS ≥7.</p>
                                  </div>

                                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="font-semibold text-blue-800">TESTED Trial (NCT05911568)</p>
                                    <p className="text-sm text-gray-700">EVT vs medical therapy in LVO patients with pre-existing disability (mRS 3-4 for ≥3 months). Within 24 hours, NIHSS ≥6, ASPECTS ≥3. Includes ICA terminus, M1, dominant M2.</p>
                                  </div>

                                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="font-semibold text-green-800">VERIFY Study (NCT05338697) - Observational</p>
                                    <p className="text-sm text-gray-700">Early TMS/MRI/clinical measures to predict upper extremity motor recovery. Acute ischemic stroke within 7 days with upper extremity weakness. Pre-stroke mRS ≤2. Inpatient enrollment opportunity.</p>
                                  </div>

                                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="font-semibold text-green-800">DISCOVERY Study (NCT04916210) - Observational</p>
                                    <p className="text-sm text-gray-700">Cognitive trajectories and biomarkers after stroke (includes AIS/ICH/SAH). Baseline visit within 6 weeks, fluent in English/Spanish, needs study partner with regular contact.</p>
                                  </div>

                                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    <p className="font-semibold text-purple-800">ESUS Imaging Study (NCT03820375) - Observational</p>
                                    <p className="text-sm text-gray-700">Cardiac and intracranial vessel wall MRI to reclassify ESUS. Within 30 days of index stroke, age ≥18, ESUS diagnosis. Helps identify occult cardioembolic or atherosclerotic sources.</p>
                                  </div>

                                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    <p className="font-semibold text-purple-800">MOCHA Imaging (PMC8821414) - Observational</p>
                                    <p className="text-sm text-gray-700">Automated intracranial vessel-wall analysis for non-stenotic ICAD detection. Patients with atherosclerotic risk factors (age &gt;50/60, HTN, DM, hyperlipidemia, obesity, smoking). High-resolution MRI vessel wall imaging required.</p>
                                  </div>
                                </div>
                              )}

                              {telestrokeNote.diagnosisCategory === 'ich' && (
                                <div className="space-y-3">
                                  <h4 className="font-bold text-red-800 border-b pb-2">Active ICH Trials</h4>

                                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                    <p className="font-semibold text-red-800">FASTEST Trial (NCT03496883)</p>
                                    <p className="text-sm text-gray-700">Recombinant Factor VIIa (rFVIIa) for acute ICH within 2 HOURS of symptom onset to prevent hematoma expansion. Age 18-80, hematoma volume 2-60 mL, IVH score ≤7, GCS ≥8, not on anticoagulation. Very narrow time window.</p>
                                  </div>

                                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                    <p className="font-semibold text-red-800">SATURN Trial (NCT03936361)</p>
                                    <p className="text-sm text-gray-700">Statin continuation vs discontinuation after LOBAR ICH. Age ≥50, must already be on statin therapy at ICH onset. Randomization within 7 days. Excludes deep/basal ganglia ICH, recent MI.</p>
                                  </div>

                                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                    <p className="font-semibold text-red-800">ASPIRE Trial (NCT03907046)</p>
                                    <p className="text-sm text-gray-700">Apixaban vs aspirin for stroke prevention after ICH in patients with atrial fibrillation. Randomization 14-180 days post-ICH, CHA2DS2-VASc ≥2, mRS ≤4. Excludes mechanical valves, recent DVT/PE.</p>
                                  </div>

                                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                    <p className="font-semibold text-orange-800">cAPPricorn-1 Trial (NCT06393712)</p>
                                    <p className="text-sm text-gray-700">Intrathecal ALN-APP (mivelsiran) for cerebral amyloid angiopathy. Sporadic CAA (age ≥50, Boston Criteria v2.0) or Dutch-type hereditary CAA (age ≥30, E693Q APP variant). Prior symptomatic lobar ICH ≥90 days ago. Requires lumbar punctures.</p>
                                  </div>

                                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="font-semibold text-green-800">MIRROR Registry (NCT04494295) - Observational</p>
                                    <p className="text-sm text-gray-700">Minimally invasive endoscopic ICH evacuation using Aurora Surgiscope System. Spontaneous supratentorial ICH ≥20mL, surgery within 24 hours, NIHSS &gt;5, baseline mRS ≤2, GCS ≥5.</p>
                                  </div>

                                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="font-semibold text-green-800">DISCOVERY Study - ICH Cohort (NCT04916210) - Observational</p>
                                    <p className="text-sm text-gray-700">Cognitive trajectories and biomarkers after ICH. Baseline visit within 6 weeks, fluent in English/Spanish, needs study partner with regular contact. Expected survival ≥1 year.</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="bg-indigo-50 p-2 text-center border-t border-indigo-200">
                              <p className="text-xs text-indigo-700">For full eligibility criteria, visit the Trials tab or ClinicalTrials.gov</p>
                            </div>
                          </details>
                        )}


                        {/* ============================================ */}
                        {/* SMART PHRASE LIBRARY                        */}
                        {/* Quick-copy documentation templates          */}
                        {/* Only visible when scrolled to Part 6        */}
                        {/* ============================================ */}

                      </div>


                    </div>
                    </>
                    )}
                    <div id="handoff-section" className="bg-white border-2 border-slate-200 rounded-lg p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Handoff Summary</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const summary = buildHandoffSummary();
                            navigator.clipboard.writeText(summary);
                            setCopiedText('handoff-summary');
                            setTimeout(() => setCopiedText(''), 2000);
                          }}
                          className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                        >
                          {copiedText === 'handoff-summary' ? 'Copied!' : 'Copy handoff'}
                        </button>
                      </div>
                      {(() => {
                        const fields = getHandoffSummaryFields();
                        const cards = [
                          { label: 'Dx', value: fields.diagnosis },
                          { label: 'Age/Sex', value: `${fields.age} ${fields.sex}`.trim() },
                          { label: fields.onsetLabel, value: `${fields.onsetTime}${fields.elapsed && fields.elapsed !== 'Unknown' ? ` (${fields.elapsed})` : ''}` },
                          { label: 'NIHSS', value: `${fields.nihss}${fields.nihssDetails ? ` (${fields.nihssDetails})` : ''}` },
                          { label: 'Imaging', value: fields.imagingSummary },
                          { label: 'Plan', value: `${fields.tnkStatus}; ${fields.evtStatus}` }
                        ];
                        if (fields.disposition) {
                          cards.push({ label: 'Disposition', value: fields.disposition });
                        }
                        if (fields.transferStatus || fields.transportDetails) {
                          const transferValue = [
                            fields.transferStatus,
                            fields.transportDetails ? `Transport: ${fields.transportDetails}` : ''
                          ].filter(Boolean).join(' | ');
                          cards.push({ label: 'Transfer', value: transferValue });
                        }
                        if (fields.imagingShare) {
                          cards.push({ label: 'Imaging share', value: fields.imagingShare });
                        }
                        return (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {cards.map((card) => (
                                <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{card.label}</p>
                                  <p className="text-sm font-semibold text-slate-900">{card.value || '--'}</p>
                                </div>
                              ))}
                            </div>
                            <details className="mt-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700">Full handoff text</summary>
                              <div className="px-3 pb-3">
                                <pre className="whitespace-pre-wrap text-xs text-slate-700">{buildHandoffSummary()}</pre>
                              </div>
                            </details>
                          </>
                        );
                      })()}
                    </div>

                    <details id="safety-section" className="bg-white border border-slate-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between">
                        <span>Safety checks</span>
                        <span className="text-xs text-slate-500">{safetyChecksCompleted}/{safetyChecks.length} complete</span>
                      </summary>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {safetyChecks.map((check) => (
                            <div key={check.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                              check.complete ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                              <span className="text-xs font-bold">{check.complete ? '✓' : '!'}</span>
                              <span className="text-sm">{check.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>

                    {(showAdvanced || telestrokeNote.diagnosisCategory === 'mimic') && (
                      <details className="bg-white border border-slate-200 rounded-lg">
                        <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between">
                          <span>Stroke mimic FAQ</span>
                          <span className="text-xs text-slate-500">Quick differentiators</span>
                        </summary>
                        <div className="p-4 space-y-3 text-sm text-slate-700">
                          {[
                            { q: 'When should I suspect a mimic?', a: 'Rapidly resolving deficits, inconsistent exam, or normal imaging despite severe symptoms.' },
                            { q: 'Seizure vs stroke?', a: 'Consider Todd paralysis if witnessed seizure, postictal confusion, or EEG support.' },
                            { q: 'Migraine vs stroke?', a: 'Positive visual/aura symptoms and headache history favor migraine; deficits often march.' },
                            { q: 'Metabolic causes?', a: 'Check glucose, electrolytes, and intoxication if symptoms are diffuse or fluctuating.' },
                            { q: 'Functional symptoms?', a: 'Look for incongruent weakness patterns, Hoover sign, or variability with distraction.' }
                          ].map((item) => (
                            <div key={item.q} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                              <p className="font-semibold text-slate-800">{item.q}</p>
                              <p className="mt-1">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                  </div>
                )}
                {/* Workflow */}


                {/* Management Combined Tab (Ischemic, ICH, Calculators, References) */}
                {activeTab === 'management' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-wrap gap-2">
                      {[
                        { id: 'ich', label: 'ICH', icon: 'alert-triangle' },
                        { id: 'ischemic', label: 'Ischemic Stroke', icon: 'activity' },
                        { id: 'calculators', label: 'Calculators', icon: 'calculator' },
                        { id: 'references', label: 'References', icon: 'book-open' }
                      ].map((tab) => {
                        const isActive = managementSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setManagementSubTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <i data-lucide={tab.icon} className="w-4 h-4"></i>
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* ICH Content */}
                    {managementSubTab === 'ich' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h2 className="text-xl font-semibold text-red-800 mb-4">ICH Management</h2>

                      {/* Minimally Invasive Evacuation */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Minimally Invasive Evacuation (MIE)</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white p-3 rounded border">
                            <h4 className="font-semibold text-green-600 mb-2">ENRICH Trial Inclusion (NCT02880878)</h4>
                            <ul className="text-sm space-y-1">
                              <li>• Spontaneous supratentorial lobar or basal ganglia ICH</li>
                              <li>• ICH onset ≤24 hours</li>
                              <li>• Age 18-80 years</li>
                              <li>• GCS 5-14 and NIHSS ≥6</li>
                              <li>• ICH volume 30-80 cc</li>
                              <li>• Pre-morbid mRS 0-1</li>
                            </ul>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <h4 className="font-semibold text-red-600 mb-2">ENRICH Trial Exclusion</h4>
                            <ul className="text-sm space-y-1">
                              <li>• Coagulopathy</li>
                              <li>• IVH &gt;50% either lateral ventricle</li>
                              <li>• Thalamic/infratentorial ICH</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-gray-100 p-3 rounded">
                          <p className="text-sm font-semibold mb-2">ICH Volume Calculation:</p>
                          <p className="text-sm"><strong>ABC/2 Method:</strong></p>
                          <ul className="text-sm ml-4">
                            <li>A = largest ICH diameter (cm)</li>
                            <li>B = largest diameter 90 degrees to A on same slice (cm)</li>
                            <li>C = (# CT slices with ICH) x (slice thickness)</li>
                          </ul>
                          <p className="text-sm mt-2 font-semibold">Volume = A x B x C / 2</p>
                        </div>
                      </div>

                      {/* Anticoagulation Reversal */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-red-700 mb-4">Anticoagulation Reversal</h3>
                        
                        {/* Warfarin */}
                        <div className="bg-white p-4 rounded border mb-4">
                          <h4 className="font-semibold text-blue-700 mb-3">Warfarin</h4>
                          <ul className="text-sm space-y-1">
                            <li>• <strong>Vitamin K:</strong> 10 mg IV over 20 min</li>
                            <li>• <strong>PCC (KCentra):</strong> 2000 U IV</li>
                          </ul>
                        </div>

                        {/* Direct Oral Anticoagulants (DOACs) */}
                        <div className="bg-white p-4 rounded border mb-4">
                          <h4 className="font-semibold text-purple-700 mb-3">Direct Oral Anticoagulants (DOACs)</h4>
                          
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-gray-700">Direct Factor Xa Inhibitors:</p>
                            <p className="text-sm text-gray-600 mb-2">Apixaban, Rivaroxaban</p>
                            <ul className="text-sm space-y-1">
                              <li>• <strong>PCC (KCentra):</strong> 50 IU/kg (max 5000 IU)</li>
                            </ul>
                          </div>
                          
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Direct Thrombin Inhibitor:</p>
                            <p className="text-sm text-gray-600 mb-2">Dabigatran</p>
                            <ul className="text-sm space-y-1">
                              <li>• <strong>Idarucizumab (Praxbind):</strong> 5g IV (2 x 2.5g)</li>
                              <li>• <strong>If unavailable:</strong> PCC (KCentra)</li>
                            </ul>
                          </div>
                        </div>

                        {/* Relative Contraindications */}
                        <div className="bg-white p-4 rounded border mb-4">
                          <h4 className="font-semibold text-gray-700 mb-3">Relative contraindications to PCC/FFP:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• History of major thrombosis/thromboembolism ≤6 weeks</li>
                            <li>• Major surgery ≤6 weeks</li>
                            <li>• Known prothrombotic disorder</li>
                            <li>• IPH not considered survivable</li>
                          </ul>
                        </div>
                      </div>

                      {/* Hematoma Expansion Prevention */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-red-700 mb-4">Hematoma Expansion Prevention</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold text-red-600 mb-2">Blood Pressure Target</h4>
                            <ul className="text-sm space-y-1">
                              <li>• <strong>Target SBP 130-150 mmHg</strong> within 2 hours</li>
                              <li>• Avoid SBP &lt;130 (renal AKI risk)</li>
                              <li>• Nicardipine infusion preferred (reliable titration)</li>
                              <li>• Maintain target for at least 24 hours</li>
                              <li className="text-gray-500 italic text-xs mt-1">Class I, LOE A — AHA/ASA ICH 2022</li>
                            </ul>
                          </div>
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold text-red-600 mb-2">Expansion Risk Factors</h4>
                            <ul className="text-sm space-y-1">
                              <li>• Spot sign on CTA</li>
                              <li>• Anticoagulant use</li>
                              <li>• Time from onset &lt;3 hours</li>
                              <li>• Large initial volume (&gt;30 mL)</li>
                              <li>• Irregular hematoma shape</li>
                              <li>• Blend sign on NCCT</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* IVH and Hydrocephalus */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-red-700 mb-4">IVH &amp; Hydrocephalus Management</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold text-orange-600 mb-2">EVD Indications</h4>
                            <ul className="text-sm space-y-1">
                              <li>• GCS &le;8 with IVH and hydrocephalus</li>
                              <li>• Obstructive hydrocephalus from IVH</li>
                              <li>• Cerebellar ICH with 4th ventricle compression</li>
                              <li>• Used for ICP monitoring and CSF drainage</li>
                            </ul>
                          </div>
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold text-orange-600 mb-2">IVH-Specific Management</h4>
                            <ul className="text-sm space-y-1">
                              <li>• Intraventricular alteplase may be considered (CLEAR III)</li>
                              <li>• Dose: alteplase 1 mg q8h via EVD</li>
                              <li>• Goal: accelerate clot resolution, reduce shunt dependency</li>
                              <li className="text-gray-500 italic text-xs mt-1">Class IIb, LOE B-R — AHA/ASA ICH 2022</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* ICH Disposition & Goals of Care */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-red-700 mb-4">ICH Disposition &amp; Goals of Care</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold text-teal-600 mb-2">Surgical Indications</h4>
                            <ul className="text-sm space-y-1">
                              <li>• <strong>Cerebellar ICH &gt;15 mL:</strong> urgent surgical evacuation</li>
                              <li>• Lobar ICH 30-80 mL: consider MIE (ENRICH criteria)</li>
                              <li>• GCS deterioration by &ge;2 points</li>
                              <li>• New pupil asymmetry or brainstem signs</li>
                              <li>• Obstructive hydrocephalus unresponsive to EVD</li>
                              <li className="text-gray-500 italic text-xs mt-1">Class I, LOE B-NR — AHA/ASA ICH 2022</li>
                            </ul>
                          </div>
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold text-teal-600 mb-2">Goals-of-Care Triggers</h4>
                            <ul className="text-sm space-y-1">
                              <li>• <strong>ICH Score &ge;3:</strong> initiate GOC discussion</li>
                              <li>• Avoid early DNR orders limiting aggressive care</li>
                              <li>• Full care recommended for minimum 24-48h</li>
                              <li>• Self-fulfilling prophecy of withdrawal is well-documented</li>
                              <li>• Palliative care consult for symptom management</li>
                              <li className="text-gray-500 italic text-xs mt-1">Class I, LOE C-LD — AHA/ASA ICH 2022 + AHA Palliative 2024</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Seizure Management in ICH */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-red-700 mb-4">Seizure Management in ICH</h3>
                        <div className="bg-white p-4 rounded border">
                          <ul className="text-sm space-y-1">
                            <li>• Treat clinical seizures with antiseizure medication (ASM)</li>
                            <li>• <strong>7-day prophylactic ASM</strong> may be considered for lobar ICH</li>
                            <li>• <strong>No routine long-term seizure prophylaxis</strong> (Class III)</li>
                            <li>• Continuous EEG monitoring for unexplained decrease in consciousness</li>
                            <li>• Preferred agents: levetiracetam 500-1000 mg IV/PO BID or lacosamide 200 mg IV/PO BID</li>
                            <li className="text-gray-500 italic text-xs mt-1">Class IIb (7-day prophylaxis), Class III (routine long-term) — AHA/ASA ICH 2022</li>
                          </ul>
                        </div>
                      </div>

                      {/* Supportive Care Bundle */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-red-700 mb-4">ICH Supportive Care Bundle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold text-gray-700 mb-2">Standard Orders</h4>
                            <ul className="text-sm space-y-1">
                              <li>• NPO until dysphagia screen passed</li>
                              <li>• IPC on admission for VTE prophylaxis</li>
                              <li>• Pharmacologic VTE ppx after 24-48h (stable hematoma)</li>
                              <li>• Glucose target 140-180 (no intensive insulin)</li>
                              <li>• Acetaminophen for temp &gt;38°C</li>
                              <li>• HOB 30 degrees</li>
                            </ul>
                          </div>
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold text-gray-700 mb-2">Monitoring</h4>
                            <ul className="text-sm space-y-1">
                              <li>• Neuro checks q1h x 24h, then q2h</li>
                              <li>• Continuous telemetry</li>
                              <li>• Repeat CT at 6h or with any neurological change</li>
                              <li>• Daily CBC, BMP, coags if on reversal</li>
                              <li>• Early PT/OT/SLP once medically stable</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                    </div>
                    )}
                    {/* End of ICH Content */}

                    {/* Ischemic Stroke Management Content */}
                    {managementSubTab === 'ischemic' && (
                      <div className="space-y-6">
                        {/* Blood Pressure Management */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-blue-800 mb-3">Blood Pressure Management</h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-green-700 mb-2">BP Goals</h4>
                              <ul className="text-sm space-y-1">
                                <li><strong>Ischemic stroke:</strong> SBP &lt;220, DBP &lt;120</li>
                                <li><strong>Before lytics:</strong> SBP &lt;185, DBP &lt;110</li>
                                <li><strong>After lytics:</strong> SBP &lt;180, DBP &lt;105</li>
                                <li><strong>After thrombectomy:</strong> SBP &lt;180, DBP &lt;105</li>
                                <li><strong>ICH:</strong> SBP &lt;160, DBP &lt;105</li>
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-blue-700 mb-2">Acute Treatment</h4>
                              <ul className="text-sm space-y-1">
                                <li><strong>Labetalol:</strong> 10 mg IV q15min</li>
                                <li>Increase to 20mg, then 40mg, then 60mg</li>
                                <li>Max total dose: 300mg in 2 hours</li>
                                <li><strong>Alternative:</strong> Nicardipine 5 mg/hr IV</li>
                                <li>Titrate by 2.5 mg/hr q15min</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Post-Lytic Complications */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-red-800 mb-3">Post-Lytic ICH Protocol</h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold mb-2">Immediate Actions</h4>
                              <ol className="text-sm space-y-1 list-decimal list-inside">
                                <li>STAT non-contrast CT head</li>
                                <li>Emergency hemorrhage panel</li>
                                <li>Type & cross</li>
                                <li>Notify patient's family</li>
                              </ol>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold mb-2">Reversal</h4>
                              <ul className="text-sm space-y-1">
                                <li><strong>Cryoprecipitate:</strong> 10 units IV</li>
                                <li><strong>Platelets:</strong> 6 units IV</li>
                                <li><strong>TXA:</strong> 1g IV over 10 min</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Orolingual Angioedema Protocol */}
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Orolingual Angioedema Protocol</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-yellow-700 mb-2">Risk Factors</h4>
                              <ul className="text-sm space-y-1">
                                <li>• ACE inhibitor use</li>
                                <li>• Insular cortex involvement</li>
                                <li>• Frontal operculum stroke</li>
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-yellow-700 mb-2">Treatment</h4>
                              <ul className="text-sm space-y-1">
                                <li><strong>Stop thrombolytic infusion</strong> if running</li>
                                <li><strong>Methylprednisolone:</strong> 125 mg IV</li>
                                <li><strong>Diphenhydramine:</strong> 50 mg IV</li>
                                <li><strong>Ranitidine:</strong> 50 mg IV</li>
                                <li><strong>Epinephrine:</strong> 0.1% if severe</li>
                                <li><strong>Consider Berinert:</strong> 20 IU/kg (C1 esterase inhibitor)</li>
                                <li><strong>Supportive Care</strong></li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Antiplatelet Loading Protocol */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-green-800 mb-3">Antiplatelet Loading Protocol</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-green-700 mb-2">Minor Stroke / TIA (NIHSS &le; 3)</h4>
                              <ul className="text-sm space-y-1">
                                <li><strong>DAPT x 21 days:</strong></li>
                                <li>• ASA 325 mg load → 81 mg daily</li>
                                <li>• Clopidogrel 300 mg load → 75 mg daily</li>
                                <li>• Then single antiplatelet after 21 days</li>
                                <li className="text-gray-500 italic text-xs mt-1">Class I, LOE A (CHANCE/POINT) — AHA/ASA 2021</li>
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-green-700 mb-2">Moderate-Severe Stroke (no lysis)</h4>
                              <ul className="text-sm space-y-1">
                                <li><strong>Single antiplatelet:</strong></li>
                                <li>• ASA 325 mg within 24-48h of onset</li>
                                <li>• If post-TNK: delay ASA 24 hours</li>
                                <li>• If AF: transition to DOAC per CATALYST timing</li>
                                <li className="text-gray-500 italic text-xs mt-1">Class I, LOE A — AHA/ASA 2021</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* DOAC Timing in AF-Stroke (CATALYST) */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-purple-800 mb-3">DOAC Initiation in AF-Stroke (CATALYST Meta-Analysis)</h3>
                          <div className="bg-white p-3 rounded border mb-3">
                            <p className="text-sm text-gray-700 mb-2">Based on the CATALYST meta-analysis (pooled data from ELAN, OPTIMAS, TIMING, START), early DOAC initiation is safe and non-inferior to delayed initiation.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                              <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                                <p className="text-xs font-bold text-green-700 uppercase">Minor Stroke</p>
                                <p className="text-xs text-gray-500">NIHSS &lt;8, small infarct</p>
                                <p className="text-lg font-bold text-green-800 mt-1">Within 48h</p>
                              </div>
                              <div className="bg-amber-50 p-2 rounded border border-amber-200 text-center">
                                <p className="text-xs font-bold text-amber-700 uppercase">Moderate Stroke</p>
                                <p className="text-xs text-gray-500">NIHSS 8-15</p>
                                <p className="text-lg font-bold text-amber-800 mt-1">Day 3-5</p>
                              </div>
                              <div className="bg-red-50 p-2 rounded border border-red-200 text-center">
                                <p className="text-xs font-bold text-red-700 uppercase">Severe Stroke</p>
                                <p className="text-xs text-gray-500">NIHSS &gt;15 or large infarct</p>
                                <p className="text-lg font-bold text-red-800 mt-1">Day 6-14</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 italic">Fischer U et al. Lancet Neurol. 2025. CATALYST Collaboration. Reassess imaging before DOAC start if concern for hemorrhagic transformation.</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <h4 className="font-semibold text-purple-700 mb-2">Preferred DOACs</h4>
                            <ul className="text-sm space-y-1">
                              <li>• <strong>Apixaban</strong> 5 mg BID (2.5 mg if age &ge;80, weight &le;60 kg, or Cr &ge;1.5)</li>
                              <li>• <strong>Rivaroxaban</strong> 20 mg daily (15 mg if CrCl 15-50)</li>
                              <li>• <strong>Dabigatran</strong> 150 mg BID (110 mg if age &ge;80)</li>
                              <li className="text-gray-500 italic text-xs mt-1">DOAC preferred over warfarin (Class I, LOE A) — AHA/ASA 2021</li>
                            </ul>
                          </div>
                        </div>

                        {/* Statin Initiation */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-indigo-800 mb-3">Statin Initiation</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-indigo-700 mb-2">High-Intensity Statin (LDL &lt;70)</h4>
                              <ul className="text-sm space-y-1">
                                <li>• <strong>Atorvastatin 80 mg</strong> daily (preferred)</li>
                                <li>• <strong>Rosuvastatin 20-40 mg</strong> daily</li>
                                <li>• Start during hospitalization</li>
                                <li>• Add ezetimibe 10 mg if LDL not at goal</li>
                                <li>• Consider PCSK9i if still above target</li>
                                <li className="text-gray-500 italic text-xs mt-1">Class I, LOE A — AHA/ASA 2021</li>
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-amber-700 mb-2">Special Considerations</h4>
                              <ul className="text-sm space-y-1">
                                <li>• sICAS (70-99%): high-intensity + LDL &lt;70 (Class I)</li>
                                <li>• Lobar ICH: caution — SATURN trial pending</li>
                                <li>• Check LFTs at baseline, recheck 4-12 weeks</li>
                                <li>• Do not discontinue statin for mild transaminase elevation (&lt;3x ULN)</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Post-EVT Management */}
                        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-violet-800 mb-3">Post-EVT Management</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-violet-700 mb-2">Blood Pressure</h4>
                              <ul className="text-sm space-y-1">
                                <li>• SBP &lt;180/105 (standard target)</li>
                                <li className="text-red-700 font-semibold">• Do NOT target SBP &lt;140 (Class III: Harm)</li>
                                <li>• Based on ENCHANTED2/MT + OPTIMAL-BP</li>
                                <li>• Monitor q15 min x 2h, then q30 min x 6h</li>
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-semibold text-violet-700 mb-2">Post-Procedure Care</h4>
                              <ul className="text-sm space-y-1">
                                <li>• Groin check q15 min x 4, q30 min x 4, then q1h</li>
                                <li>• Bed rest per protocol (typically 2-6h)</li>
                                <li>• Follow-up imaging: CT/CTA at 24h or if neuro change</li>
                                <li>• Antiplatelet: ASA 325 mg within 24h if no hemorrhagic conversion</li>
                                <li>• Neuro checks q1h x 24h minimum</li>
                              </ul>
                            </div>
                          </div>
                        </div>


                      </div>
                    )}
                    {/* End of Ischemic Stroke Management Content */}

                    {/* Calculators Content */}
                    {managementSubTab === 'calculators' && (
                  <div className="space-y-4">
                    {/* ============================================ */}
                    {/* CALCULATOR TRIAL PROMPTS                     */}
                    {/* Shows trial relevance after scoring          */}
                    {/* ============================================ */}
                    {(nihssScore || telestrokeNote.age) && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4 shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                            🔬 Score → Trial Implications
                          </h2>
                          {telestrokeNote.age && (
                            <span className="text-sm text-purple-700">
                              Current: {telestrokeNote.age}{telestrokeNote.sex || '?'} | NIHSS {nihssScore || '?'}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {/* NIHSS-based prompts */}
                          {nihssScore !== null && nihssScore !== undefined && (
                            <div className="bg-white rounded p-3 border">
                              <h3 className="font-semibold text-purple-800 mb-2">NIHSS = {nihssScore}</h3>
                              <ul className="space-y-1 text-xs text-gray-700">
                                {nihssScore >= 6 && (
                                  <li className="text-green-700">
                                    🟢 <strong>SISTER eligible</strong>: NIHSS ≥6 threshold met
                                  </li>
                                )}
                                {nihssScore <= 5 && (
                                  <li className="text-yellow-700">
                                    🟡 <strong>STEP mild arm</strong>: Check for LVO (ICA/M1/basilar)
                                  </li>
                                )}
                                {nihssScore > 8 && (
                                  <li className="text-blue-700">
                                    🔵 <strong>STEP MeVO arm</strong>: Check for M2/M3 occlusion
                                  </li>
                                )}
                                {nihssScore < 6 && (
                                  <li className="text-gray-600">
                                    ⚪ SISTER: NIHSS ≥6 required (current: {nihssScore})
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          {/* GCS-based prompts */}
                          {(() => {
                            const gcs = calculateGCS(gcsItems);
                            if (gcs === 0) return null;
                            return (
                              <div className="bg-white rounded p-3 border">
                                <h3 className="font-semibold text-purple-800 mb-2">GCS = {gcs}</h3>
                                <ul className="space-y-1 text-xs text-gray-700">
                                  {gcs >= 5 && gcs <= 14 && (
                                    <li className="text-blue-700">
                                      🔵 <strong>ENRICH range</strong>: GCS 5-14 for MIE consideration
                                    </li>
                                  )}
                                  {gcs > 14 && (
                                    <li className="text-gray-600">
                                      ⚪ ENRICH: GCS 5-14 required (current: {gcs})
                                    </li>
                                  )}
                                  {gcs < 5 && (
                                    <li className="text-gray-600">
                                      ⚪ GCS too low for most trial eligibility
                                    </li>
                                  )}
                                </ul>
                              </div>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-purple-600 mt-2 italic">
                          💡 These are quick prompts only. Full eligibility requires complete patient assessment.
                        </p>
                      </div>
                    )}

                    {/* Glasgow Coma Scale */}
                    <details className="bg-gray-50 border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-gray-800 hover:bg-gray-100 rounded-lg flex items-center justify-between">
                        <span>Glasgow Coma Scale (GCS)</span>
                        <span className="text-sm font-normal text-gray-600">Score: {calculateGCS(gcsItems)}</span>
                      </summary>
                      <div className="p-4">
                        <div className="flex justify-end items-center gap-2 mb-3">
                        <div className="text-right">
                          <span className="text-xl font-bold text-gray-600">Score: {calculateGCS(gcsItems)}</span>
                          <div className="text-xs text-gray-500">Range: 3-15</div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`GCS: ${calculateGCS(gcsItems)}`, 'GCS Score')}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          aria-label="Copy GCS score to clipboard"
                          title="Copy to clipboard"
                        >
                          <i data-lucide="copy" className="w-4 h-4 text-gray-600"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Eye Opening</h4>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_eye"
                              value="4"
                              className="text-gray-600"
                              checked={gcsItems.eye === '4'}
                              onChange={(e) => setGcsItems({...gcsItems, eye: e.target.value})}
                            />
                            <span className="text-sm">4 - Spontaneous</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_eye"
                              value="3"
                              className="text-gray-600"
                              checked={gcsItems.eye === '3'}
                              onChange={(e) => setGcsItems({...gcsItems, eye: e.target.value})}
                            />
                            <span className="text-sm">3 - To sound</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_eye"
                              value="2"
                              className="text-gray-600"
                              checked={gcsItems.eye === '2'}
                              onChange={(e) => setGcsItems({...gcsItems, eye: e.target.value})}
                            />
                            <span className="text-sm">2 - To pain</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_eye"
                              value="1"
                              className="text-gray-600"
                              checked={gcsItems.eye === '1'}
                              onChange={(e) => setGcsItems({...gcsItems, eye: e.target.value})}
                            />
                            <span className="text-sm">1 - None</span>
                          </label>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold">Verbal Response</h4>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_verbal"
                              value="5"
                              className="text-gray-600"
                              checked={gcsItems.verbal === '5'}
                              onChange={(e) => setGcsItems({...gcsItems, verbal: e.target.value})}
                            />
                            <span className="text-sm">5 - Oriented</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_verbal"
                              value="4"
                              className="text-gray-600"
                              checked={gcsItems.verbal === '4'}
                              onChange={(e) => setGcsItems({...gcsItems, verbal: e.target.value})}
                            />
                            <span className="text-sm">4 - Confused</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_verbal"
                              value="3"
                              className="text-gray-600"
                              checked={gcsItems.verbal === '3'}
                              onChange={(e) => setGcsItems({...gcsItems, verbal: e.target.value})}
                            />
                            <span className="text-sm">3 - Inappropriate</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_verbal"
                              value="2"
                              className="text-gray-600"
                              checked={gcsItems.verbal === '2'}
                              onChange={(e) => setGcsItems({...gcsItems, verbal: e.target.value})}
                            />
                            <span className="text-sm">2 - Incomprehensible</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_verbal"
                              value="1"
                              className="text-gray-600"
                              checked={gcsItems.verbal === '1'}
                              onChange={(e) => setGcsItems({...gcsItems, verbal: e.target.value})}
                            />
                            <span className="text-sm">1 - None</span>
                          </label>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold">Motor Response</h4>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_motor"
                              value="6"
                              className="text-gray-600"
                              checked={gcsItems.motor === '6'}
                              onChange={(e) => setGcsItems({...gcsItems, motor: e.target.value})}
                            />
                            <span className="text-sm">6 - Obeying</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_motor"
                              value="5"
                              className="text-gray-600"
                              checked={gcsItems.motor === '5'}
                              onChange={(e) => setGcsItems({...gcsItems, motor: e.target.value})}
                            />
                            <span className="text-sm">5 - Localizing</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_motor"
                              value="4"
                              className="text-gray-600"
                              checked={gcsItems.motor === '4'}
                              onChange={(e) => setGcsItems({...gcsItems, motor: e.target.value})}
                            />
                            <span className="text-sm">4 - Flexing</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_motor"
                              value="3"
                              className="text-gray-600"
                              checked={gcsItems.motor === '3'}
                              onChange={(e) => setGcsItems({...gcsItems, motor: e.target.value})}
                            />
                            <span className="text-sm">3 - Abnormal flexion</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_motor"
                              value="2"
                              className="text-gray-600"
                              checked={gcsItems.motor === '2'}
                              onChange={(e) => setGcsItems({...gcsItems, motor: e.target.value})}
                            />
                            <span className="text-sm">2 - Extending</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="gcs_motor"
                              value="1"
                              className="text-gray-600"
                              checked={gcsItems.motor === '1'}
                              onChange={(e) => setGcsItems({...gcsItems, motor: e.target.value})}
                            />
                            <span className="text-sm">1 - None</span>
                          </label>
                        </div>
                      </div>
                      </div>
                    </details>

                    {/* ICH Score */}
                    <details className="bg-red-50 border border-red-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-red-800 hover:bg-red-100 rounded-lg flex items-center justify-between">
                        <span>ICH Score</span>
                        <span className="text-sm font-normal text-red-600">Score: {calculateICHScore(ichScoreItems)}</span>
                      </summary>
                      <div className="p-4">
                        <div className="flex justify-end items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-red-600">Score: {calculateICHScore(ichScoreItems)}</span>
                        <button
                          onClick={() => copyToClipboard(`ICH Score: ${calculateICHScore(ichScoreItems)}`, 'ICH Score')}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors"
                          aria-label="Copy ICH score to clipboard"
                          title="Copy to clipboard"
                        >
                          <i data-lucide="copy" className="w-4 h-4 text-red-600"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm mb-2">Glasgow Coma Scale:</p>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ich_gcs"
                              className="text-red-600"
                              checked={ichScoreItems.gcs === 'gcs34'}
                              onChange={() => setIchScoreItems({...ichScoreItems, gcs: 'gcs34'})}
                            />
                            <span className="text-sm">GCS 3-4 (+2 points)</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ich_gcs"
                              className="text-red-600"
                              checked={ichScoreItems.gcs === 'gcs512'}
                              onChange={() => setIchScoreItems({...ichScoreItems, gcs: 'gcs512'})}
                            />
                            <span className="text-sm">GCS 5-12 (+1 point)</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ich_gcs"
                              className="text-red-600"
                              checked={ichScoreItems.gcs === ''}
                              onChange={() => setIchScoreItems({...ichScoreItems, gcs: ''})}
                            />
                            <span className="text-sm">GCS 13-15 (0 points)</span>
                          </label>
                          <hr className="my-3" />
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-red-600"
                              checked={ichScoreItems.age80}
                              onChange={(e) => setIchScoreItems({...ichScoreItems, age80: e.target.checked})}
                            />
                            <span className="text-sm">Age ≥80 (+1)</span>
                          </label>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4A2.5 2.5 0 0 1 9.5 2Z" />
                                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-4A2.5 2.5 0 0 0 14.5 2Z" />
                                </svg>
                             </div>
                            <div className="mb-4 relative z-10">
                              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                  <rect width="16" height="20" x="4" y="2" rx="2" />
                                  <line x1="8" x2="16" y1="6" y2="6" />
                                  <path d="M16 14v4" />
                                  <path d="M16 10h.01" />
                                  <path d="M12 10h.01" />
                                  <path d="M8 10h.01" />
                                  <path d="M12 14h.01" />
                                  <path d="M8 14h.01" />
                                  <path d="M12 18h.01" />
                                  <path d="M8 18h.01" />
                                </svg>
                                ICH Volume Calculator (ABC/2)
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">Calculate hematoma volume from CT measurements.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">A: Length</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    placeholder="0.0"
                                    value={ichVolumeParams.a}
                                    onChange={(e) => setIchVolumeParams({...ichVolumeParams, a: e.target.value})}
                                  />
                                  <span className="absolute right-3 top-2 text-xs text-gray-400 font-medium">cm</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">B: Width</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    placeholder="0.0"
                                    value={ichVolumeParams.b}
                                    onChange={(e) => setIchVolumeParams({...ichVolumeParams, b: e.target.value})}
                                  />
                                  <span className="absolute right-3 top-2 text-xs text-gray-400 font-medium">cm</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Slice Thickness</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    placeholder="e.g. 5"
                                    value={ichVolumeParams.thicknessMm}
                                    onChange={(e) => setIchVolumeParams({...ichVolumeParams, thicknessMm: e.target.value})}
                                  />
                                  <span className="absolute right-3 top-2 text-xs text-gray-400 font-medium">mm</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider"># Slices</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    placeholder="0"
                                    value={ichVolumeParams.numSlices}
                                    onChange={(e) => setIchVolumeParams({...ichVolumeParams, numSlices: e.target.value})}
                                  />
                                  <span className="absolute right-3 top-2 text-xs text-gray-400 font-medium">#</span>
                                </div>
                              </div>
                            </div>

                            <div className={`mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center transition-all duration-300 ${ichVolumeParams.a && ichVolumeParams.b && ichVolumeParams.thicknessMm && ichVolumeParams.numSlices ? 'opacity-100' : 'opacity-50'}`}>
                                <span className="text-xs font-medium text-gray-500">Calculated Volume</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-blue-600">
                                    {ichVolumeParams.a && ichVolumeParams.b && ichVolumeParams.thicknessMm && ichVolumeParams.numSlices 
                                      ? ((parseFloat(ichVolumeParams.a) * parseFloat(ichVolumeParams.b) * (parseFloat(ichVolumeParams.thicknessMm) / 10 * parseFloat(ichVolumeParams.numSlices))) / 2).toFixed(1)
                                      : '0.0'}
                                  </span>
                                  <span className="text-sm font-medium text-blue-400">cc</span>
                                </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3 pl-1">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ichScoreItems.volume30 ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300 group-hover:border-red-400'}`}>
                                {ichScoreItems.volume30 && (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <input 
                                type="checkbox" 
                                className="sr-only"
                                checked={ichScoreItems.volume30}
                                onChange={(e) => setIchScoreItems({...ichScoreItems, volume30: e.target.checked})}
                              />
                              <span className={`text-sm ${ichScoreItems.volume30 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>ICH volume ≥30 cc (+1)</span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ichScoreItems.ivh ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300 group-hover:border-red-400'}`}>
                                {ichScoreItems.ivh && (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <input 
                                type="checkbox" 
                                className="sr-only"
                                checked={ichScoreItems.ivh}
                                onChange={(e) => setIchScoreItems({...ichScoreItems, ivh: e.target.checked})}
                              />
                              <span className={`text-sm ${ichScoreItems.ivh ? 'font-medium text-gray-900' : 'text-gray-600'}`}>Intraventricular hemorrhage (+1)</span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ichScoreItems.infratentorial ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300 group-hover:border-red-400'}`}>
                                {ichScoreItems.infratentorial && (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <input 
                                type="checkbox" 
                                className="sr-only"
                                checked={ichScoreItems.infratentorial}
                                onChange={(e) => setIchScoreItems({...ichScoreItems, infratentorial: e.target.checked})}
                              />
                              <span className={`text-sm ${ichScoreItems.infratentorial ? 'font-medium text-gray-900' : 'text-gray-600'}`}>Infratentorial origin (+1)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      </div>
                    </details>

                    {/* Modified Rankin Scale (mRS) */}
                    <details className="bg-gray-50 border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-gray-800 hover:bg-gray-100 rounded-lg flex items-center justify-between">
                        <span>Modified Rankin Scale (mRS)</span>
                        <span className="text-sm font-normal text-gray-600">Score: {mrsScore || 'Not Selected'}</span>
                      </summary>
                      <div className="p-4">
                        <div className="flex justify-end items-center gap-2 mb-3">
                          <div className="text-right">
                            <span className="text-xl font-bold text-gray-600">
                              Score: {mrsScore || 'Not Selected'}
                            </span>
                          <div className="text-xs text-gray-500">Range: 0-6</div>
                        </div>
                        {mrsScore && (
                          <button
                            onClick={() => copyToClipboard(`mRS: ${mrsScore}`, 'mRS Score')}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            aria-label="Copy mRS score to clipboard"
                            title="Copy to clipboard"
                          >
                            <i data-lucide="copy" className="w-4 h-4 text-gray-600"></i>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="mrs"
                            value="0"
                            checked={mrsScore === '0'}
                            onChange={(e) => setMrsScore(e.target.value)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">0 - No symptoms</div>
                            <div className="text-sm text-gray-600">Completely recovered; no residual symptoms</div>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="mrs"
                            value="1"
                            checked={mrsScore === '1'}
                            onChange={(e) => setMrsScore(e.target.value)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">1 - No significant disability</div>
                            <div className="text-sm text-gray-600">Able to carry out all usual duties and activities despite some symptoms</div>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="mrs"
                            value="2"
                            checked={mrsScore === '2'}
                            onChange={(e) => setMrsScore(e.target.value)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">2 - Slight disability</div>
                            <div className="text-sm text-gray-600">Unable to carry out all previous activities but able to look after own affairs without assistance</div>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="mrs"
                            value="3"
                            checked={mrsScore === '3'}
                            onChange={(e) => setMrsScore(e.target.value)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">3 - Moderate disability</div>
                            <div className="text-sm text-gray-600">Requires some help, but able to walk without assistance</div>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="mrs"
                            value="4"
                            checked={mrsScore === '4'}
                            onChange={(e) => setMrsScore(e.target.value)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">4 - Moderately severe disability</div>
                            <div className="text-sm text-gray-600">Unable to walk without assistance and unable to attend to own bodily needs without assistance</div>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="mrs"
                            value="5"
                            checked={mrsScore === '5'}
                            onChange={(e) => setMrsScore(e.target.value)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">5 - Severe disability</div>
                            <div className="text-sm text-gray-600">Bedridden, incontinent, and requires constant nursing care and attention</div>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="mrs"
                            value="6"
                            checked={mrsScore === '6'}
                            onChange={(e) => setMrsScore(e.target.value)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">6 - Dead</div>
                          </div>
                        </label>
                      </div>

                      {mrsScore && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Clinical Interpretation:</p>
                          <p className="text-sm text-blue-800">
                            {mrsScore === '0' && 'Excellent outcome - Complete recovery with no residual deficits'}
                            {mrsScore === '1' && 'Good outcome - Minor symptoms that do not interfere with lifestyle'}
                            {mrsScore === '2' && 'Fair outcome - Some restriction in lifestyle but retains capacity for independent living'}
                            {mrsScore === '3' && 'Moderate outcome - Significant lifestyle restriction; requires some assistance'}
                            {mrsScore === '4' && 'Moderately severe outcome - Clearly dependent; requires assistance with basic activities'}
                            {mrsScore === '5' && 'Severe outcome - Totally dependent; requires constant care'}
                            {mrsScore === '6' && 'Death'}
                          </p>
                        </div>
                      )}
                      </div>
                    </details>

                    {/* ABCD2 */}
                    <details className="bg-orange-50 border border-orange-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-orange-800 hover:bg-orange-100 rounded-lg flex items-center justify-between">
                        <span>ABCD² Score</span>
                        <span className="text-sm font-normal text-orange-600">Score: {calculateABCD2Score(abcd2Items)}</span>
                      </summary>
                      <div className="p-4">
                        <div className="flex justify-end items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-orange-600">Score: {calculateABCD2Score(abcd2Items)}</span>
                        <button
                          onClick={() => copyToClipboard(`ABCD² Score: ${calculateABCD2Score(abcd2Items)}`, 'ABCD² Score')}
                          className="p-1.5 hover:bg-orange-100 rounded transition-colors"
                          aria-label="Copy ABCD² score to clipboard"
                          title="Copy to clipboard"
                        >
                          <i data-lucide="copy" className="w-4 h-4 text-orange-600"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-orange-600"
                              checked={abcd2Items.age60}
                              onChange={(e) => setAbcd2Items({...abcd2Items, age60: e.target.checked})}
                            />
                            <span className="text-sm">Age ≥60 (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-orange-600"
                              checked={abcd2Items.bp}
                              onChange={(e) => setAbcd2Items({...abcd2Items, bp: e.target.checked})}
                            />
                            <span className="text-sm">BP: SBP≥140 or DBP≥90 (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-orange-600"
                              checked={abcd2Items.unilateralWeakness}
                              onChange={(e) => setAbcd2Items({...abcd2Items, unilateralWeakness: e.target.checked})}
                            />
                            <span className="text-sm">Unilateral weakness (+2)</span>
                          </label>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="text-orange-600"
                              checked={abcd2Items.speechDisturbance}
                              onChange={(e) => setAbcd2Items({...abcd2Items, speechDisturbance: e.target.checked})}
                            />
                            <span className="text-sm">Speech disturbance w/o weakness (+1)</span>
                          </label>
                          <p className="font-semibold text-sm mt-3 mb-2">Symptom Duration:</p>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="abcd2_duration"
                              className="text-orange-600"
                              checked={abcd2Items.duration === 'duration60'}
                              onChange={() => setAbcd2Items({...abcd2Items, duration: 'duration60'})}
                            />
                            <span className="text-sm">≥60 minutes (+2 points)</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="abcd2_duration"
                              className="text-orange-600"
                              checked={abcd2Items.duration === 'duration10'}
                              onChange={() => setAbcd2Items({...abcd2Items, duration: 'duration10'})}
                            />
                            <span className="text-sm">10-59 minutes (+1 point)</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="abcd2_duration"
                              className="text-orange-600"
                              checked={abcd2Items.duration === ''}
                              onChange={() => setAbcd2Items({...abcd2Items, duration: ''})}
                            />
                            <span className="text-sm">&lt;10 minutes (0 points)</span>
                          </label>
                          <hr className="my-3" />
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="text-orange-600"
                              checked={abcd2Items.diabetes}
                              onChange={(e) => setAbcd2Items({...abcd2Items, diabetes: e.target.checked})}
                            />
                            <span className="text-sm">Diabetes mellitus (+1)</span>
                          </label>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-semibold mb-2">2-Day, 7-Day, and 90-Day Stroke Risk</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p><strong>0-3:</strong></p>
                            <p>2-day: 1%</p>
                            <p>7-day: 1.2%</p>
                            <p>90-day: 3.1%</p>
                          </div>
                          <div>
                            <p><strong>4-5:</strong></p>
                            <p>2-day: 4.1%</p>
                            <p>7-day: 5.9%</p>
                            <p>90-day: 9.8%</p>
                          </div>
                          <div>
                            <p><strong>6-7:</strong></p>
                            <p>2-day: 8.1%</p>
                            <p>7-day: 11.7%</p>
                            <p>90-day: 17.8%</p>
                          </div>
                        </div>
                      </div>
                      </div>
                    </details>

                    {/* CHADS2-VASC */}
                    <details className="bg-purple-50 border border-purple-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-purple-800 hover:bg-purple-100 rounded-lg flex items-center justify-between">
                        <span>CHA₂DS₂-VASc Score</span>
                        <span className="text-sm font-normal text-purple-600">Score: {calculateCHADS2VascScore(chads2vascItems)}</span>
                      </summary>
                      <div className="p-4">
                        <div className="flex justify-end items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-purple-600">Score: {calculateCHADS2VascScore(chads2vascItems)}</span>
                        <button
                          onClick={() => copyToClipboard(`CHADS₂-VASc: ${calculateCHADS2VascScore(chads2vascItems)}`, 'CHADS₂-VASc Score')}
                          className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                          aria-label="Copy CHADS₂-VASc score to clipboard"
                          title="Copy to clipboard"
                        >
                          <i data-lucide="copy" className="w-4 h-4 text-purple-600"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="text-purple-600"
                            checked={chads2vascItems.age65}
                            onChange={(e) => setChads2vascItems({...chads2vascItems, age65: e.target.checked})}
                          />
                          <span className="text-sm">Age 65-74 (+1)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="text-purple-600"
                            checked={chads2vascItems.age75}
                            onChange={(e) => setChads2vascItems({...chads2vascItems, age75: e.target.checked})}
                          />
                          <span className="text-sm">Age ≥75 (+2)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="text-purple-600"
                            checked={chads2vascItems.chf}
                            onChange={(e) => setChads2vascItems({...chads2vascItems, chf: e.target.checked})}
                          />
                          <span className="text-sm">CHF (+1)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="text-purple-600"
                            checked={chads2vascItems.hypertension}
                            onChange={(e) => setChads2vascItems({...chads2vascItems, hypertension: e.target.checked})}
                          />
                          <span className="text-sm">Hypertension (+1)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="text-purple-600"
                            checked={chads2vascItems.diabetes}
                            onChange={(e) => setChads2vascItems({...chads2vascItems, diabetes: e.target.checked})}
                          />
                          <span className="text-sm">Diabetes (+1)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="text-purple-600"
                            checked={chads2vascItems.strokeTia}
                            onChange={(e) => setChads2vascItems({...chads2vascItems, strokeTia: e.target.checked})}
                          />
                          <span className="text-sm">Stroke/TIA (+2)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="text-purple-600"
                            checked={chads2vascItems.vascular}
                            onChange={(e) => setChads2vascItems({...chads2vascItems, vascular: e.target.checked})}
                          />
                          <span className="text-sm">Vascular disease (+1)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="text-purple-600"
                            checked={chads2vascItems.female}
                            onChange={(e) => setChads2vascItems({...chads2vascItems, female: e.target.checked})}
                          />
                          <span className="text-sm">Female sex (+1)</span>
                        </label>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-semibold mb-2">Annual Stroke and Thromboembolism Risk</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p><strong>Score 0:</strong> 0.8%</p>
                            <p><strong>Score 1:</strong> 2.0%</p>
                            <p><strong>Score 2:</strong> 3.7%</p>
                          </div>
                          <div>
                            <p><strong>Score 3:</strong> 5.9%</p>
                            <p><strong>Score 4:</strong> 9.3%</p>
                            <p><strong>Score 5:</strong> 15.3%</p>
                          </div>
                          <div>
                            <p><strong>Score 6:</strong> 19.7%</p>
                            <p><strong>Score 7:</strong> 21.5%</p>
                            <p><strong>Score 8:</strong> 22.4%</p>
                            <p><strong>Score 9:</strong> 23.6%</p>
                          </div>
                        </div>
                      </div>
                      </div>
                    </details>

                    {/* HAS-BLED Score */}
                    <details className="bg-pink-50 border border-pink-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-pink-800 hover:bg-pink-100 rounded-lg flex items-center justify-between">
                        <span>HAS-BLED Score</span>
                        <span className="text-sm font-normal text-pink-600">Score: {calculateHASBLEDScore(hasbledItems)}</span>
                      </summary>
                      <div className="p-4">
                        <div className="flex justify-end items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-pink-600">Score: {calculateHASBLEDScore(hasbledItems)}</span>
                          <button
                            onClick={() => copyToClipboard(`HAS-BLED: ${calculateHASBLEDScore(hasbledItems)}`, 'HAS-BLED Score')}
                            className="p-1.5 hover:bg-pink-100 rounded transition-colors"
                            aria-label="Copy HAS-BLED score to clipboard"
                            title="Copy to clipboard"
                          >
                            <i data-lucide="copy" className="w-4 h-4 text-pink-600"></i>
                          </button>
                        </div>

                        <div className="space-y-2 mb-4">
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.hypertension}
                              onChange={(e) => setHasbledItems({...hasbledItems, hypertension: e.target.checked})}
                            />
                            <span className="text-sm"><strong>H</strong>ypertension (uncontrolled SBP &gt;160) (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.renalDisease}
                              onChange={(e) => setHasbledItems({...hasbledItems, renalDisease: e.target.checked})}
                            />
                            <span className="text-sm"><strong>A</strong>bnormal renal function (dialysis, transplant, Cr &gt;2.6) (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.liverDisease}
                              onChange={(e) => setHasbledItems({...hasbledItems, liverDisease: e.target.checked})}
                            />
                            <span className="text-sm"><strong>A</strong>bnormal liver function (cirrhosis, bilirubin &gt;2x, AST/ALT &gt;3x) (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.stroke}
                              onChange={(e) => setHasbledItems({...hasbledItems, stroke: e.target.checked})}
                            />
                            <span className="text-sm"><strong>S</strong>troke history (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.bleeding}
                              onChange={(e) => setHasbledItems({...hasbledItems, bleeding: e.target.checked})}
                            />
                            <span className="text-sm"><strong>B</strong>leeding history or predisposition (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.labileINR}
                              onChange={(e) => setHasbledItems({...hasbledItems, labileINR: e.target.checked})}
                            />
                            <span className="text-sm"><strong>L</strong>abile INR (TTR &lt;60%) (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.elderly}
                              onChange={(e) => setHasbledItems({...hasbledItems, elderly: e.target.checked})}
                            />
                            <span className="text-sm"><strong>E</strong>lderly (age &gt;65) (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.drugs}
                              onChange={(e) => setHasbledItems({...hasbledItems, drugs: e.target.checked})}
                            />
                            <span className="text-sm"><strong>D</strong>rugs (antiplatelet agents, NSAIDs) (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-pink-600"
                              checked={hasbledItems.alcohol}
                              onChange={(e) => setHasbledItems({...hasbledItems, alcohol: e.target.checked})}
                            />
                            <span className="text-sm"><strong>D</strong> (cont.) Alcohol use (≥8 drinks/week) (+1)</span>
                          </label>
                        </div>

                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-pink-700 mb-2">Annual Bleeding Risk</h4>
                          <div className="text-sm space-y-1">
                            <p className={calculateHASBLEDScore(hasbledItems) === 0 ? "font-bold text-pink-600" : ""}><strong>Score 0:</strong> 1.13% per year</p>
                            <p className={calculateHASBLEDScore(hasbledItems) === 1 ? "font-bold text-pink-600" : ""}><strong>Score 1:</strong> 1.02% per year</p>
                            <p className={calculateHASBLEDScore(hasbledItems) === 2 ? "font-bold text-pink-600" : ""}><strong>Score 2:</strong> 1.88% per year</p>
                            <p className={calculateHASBLEDScore(hasbledItems) >= 3 ? "font-bold text-pink-600" : ""}><strong>Score ≥3:</strong> 3.74% per year (high risk)</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 italic">High risk (≥3) indicates need for more frequent monitoring and caution with anticoagulation, but should not automatically exclude from treatment.</p>
                        </div>
                      </div>
                    </details>

                    {/* ROPE Score */}
                    <details className="bg-teal-50 border border-teal-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-teal-800 hover:bg-teal-100 rounded-lg flex items-center justify-between">
                        <span>ROPE Score and PASCAL Classification</span>
                        <span className="text-sm font-normal text-teal-600">Score: {calculateROPEScore(ropeItems)}</span>
                      </summary>
                      <div className="p-4">
                        <div className="flex justify-end items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-teal-600">Score: {calculateROPEScore(ropeItems)}</span>
                        <button
                          onClick={() => copyToClipboard(`ROPE Score: ${calculateROPEScore(ropeItems)}`, 'ROPE Score')}
                          className="p-1.5 hover:bg-teal-100 rounded transition-colors"
                          aria-label="Copy ROPE score to clipboard"
                          title="Copy to clipboard"
                        >
                          <i data-lucide="copy" className="w-4 h-4 text-teal-600"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-teal-600"
                              checked={ropeItems.noHypertension}
                              onChange={(e) => setRopeItems({...ropeItems, noHypertension: e.target.checked})}
                            />
                            <span className="text-sm">No history of hypertension (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-teal-600"
                              checked={ropeItems.noDiabetes}
                              onChange={(e) => setRopeItems({...ropeItems, noDiabetes: e.target.checked})}
                            />
                            <span className="text-sm">No history of diabetes (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-teal-600"
                              checked={ropeItems.noStrokeTia}
                              onChange={(e) => setRopeItems({...ropeItems, noStrokeTia: e.target.checked})}
                            />
                            <span className="text-sm">No history of stroke or TIA (+1)</span>
                          </label>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-teal-600"
                              checked={ropeItems.nonsmoker}
                              onChange={(e) => setRopeItems({...ropeItems, nonsmoker: e.target.checked})}
                            />
                            <span className="text-sm">Nonsmoker (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="text-teal-600"
                              checked={ropeItems.cortical}
                              onChange={(e) => setRopeItems({...ropeItems, cortical: e.target.checked})}
                            />
                            <span className="text-sm">Cortical infarct (+1)</span>
                          </label>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                            <input 
                              type="number"
                              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                              value={ropeItems.age}
                              onChange={(e) => setRopeItems({...ropeItems, age: e.target.value})}
                              placeholder="Enter age"
                              min="18"
                              max="100"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              18-29: +5, 30-39: +4, 40-49: +3, 50-59: +2, 60-69: +1, ≥70: 0
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold mb-2">PFO-attributable fraction</h4>
                          <div className="text-sm">
                            <p className={calculateROPEScore(ropeItems) <= 3 ? "font-bold text-teal-600" : ""}><strong>Score 0-3:</strong> 0-23%</p>
                            <p className={calculateROPEScore(ropeItems) === 4 ? "font-bold text-teal-600" : ""}><strong>Score 4:</strong> 38%</p>
                            <p className={calculateROPEScore(ropeItems) === 5 ? "font-bold text-teal-600" : ""}><strong>Score 5:</strong> 34%</p>
                            <p className={calculateROPEScore(ropeItems) === 6 ? "font-bold text-teal-600" : ""}><strong>Score 6:</strong> 62%</p>
                            <p className={calculateROPEScore(ropeItems) === 7 ? "font-bold text-teal-600" : ""}><strong>Score 7:</strong> 72%</p>
                            <p className={calculateROPEScore(ropeItems) === 8 ? "font-bold text-teal-600" : ""}><strong>Score 8:</strong> 84%</p>
                            <p className={calculateROPEScore(ropeItems) >= 9 ? "font-bold text-teal-600" : ""}><strong>Score 9-10:</strong> 88%</p>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold mb-2">2-Year Recurrent Stroke/TIA Risk</h4>
                          <div className="text-sm">
                            <p className={calculateROPEScore(ropeItems) <= 3 ? "font-bold text-teal-600" : ""}><strong>Score 0-3:</strong> 20%</p>
                            <p className={calculateROPEScore(ropeItems) === 4 ? "font-bold text-teal-600" : ""}><strong>Score 4:</strong> 12%</p>
                            <p className={calculateROPEScore(ropeItems) === 5 ? "font-bold text-teal-600" : ""}><strong>Score 5:</strong> 15%</p>
                            <p className={calculateROPEScore(ropeItems) === 6 ? "font-bold text-teal-600" : ""}><strong>Score 6:</strong> 8%</p>
                            <p className={calculateROPEScore(ropeItems) === 7 ? "font-bold text-teal-600" : ""}><strong>Score 7:</strong> 6%</p>
                            <p className={calculateROPEScore(ropeItems) === 8 ? "font-bold text-teal-600" : ""}><strong>Score 8:</strong> 6%</p>
                            <p className={calculateROPEScore(ropeItems) >= 9 ? "font-bold text-teal-600" : ""}><strong>Score 9-10:</strong> 2%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PASCAL Classification */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-3">PASCAL Classification</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-green-700 mb-2">Probable PFO-related stroke:</h4>
                          <p className="text-sm">RoPE ≥7 + high-grade shunt / ASA</p>
                        </div>
                        
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-amber-700 mb-2">Possible PFO-related stroke:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• RoPE &lt;7 + high-grade shunt / ASA</li>
                            <li>• RoPE ≥7 but no high-grade shunt / ASA</li>
                          </ul>
                        </div>
                        
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-red-700 mb-2">Unlikely PFO-related stroke:</h4>
                          <p className="text-sm">RoPE &lt;7, no high-grade shunt / ASA</p>
                        </div>
                      </div>
                      </div>
                    </details>


                    {/* RCVS2 Score */}
                    <details className="bg-cyan-50 border border-cyan-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-cyan-800 hover:bg-cyan-100 rounded-lg flex items-center justify-between">
                        <span>RCVS² Score</span>
                        <span className="text-sm font-normal text-cyan-600">Score: {calculateRCVS2Score(rcvs2Items)}</span>
                      </summary>
                      <div className="p-4">
                        <div className="flex justify-end items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-cyan-600">Score: {calculateRCVS2Score(rcvs2Items)}</span>
                          <button
                            onClick={() => copyToClipboard(`RCVS² Score: ${calculateRCVS2Score(rcvs2Items)}`, 'RCVS² Score')}
                            className="p-1.5 hover:bg-cyan-100 rounded transition-colors"
                            aria-label="Copy RCVS² score to clipboard"
                            title="Copy to clipboard"
                          >
                            <i data-lucide="copy" className="w-4 h-4 text-cyan-600"></i>
                          </button>
                        </div>

                        <div className="space-y-2 mb-4">
                          <label className="flex items-center space-x-2 p-2 hover:bg-cyan-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-cyan-600"
                              checked={rcvs2Items.recurrentTCH}
                              onChange={(e) => setRcvs2Items({...rcvs2Items, recurrentTCH: e.target.checked})}
                            />
                            <span className="text-sm">Recurrent thunderclap headaches (+5)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-cyan-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-cyan-600"
                              checked={rcvs2Items.carotidInvolvement}
                              onChange={(e) => setRcvs2Items({...rcvs2Items, carotidInvolvement: e.target.checked})}
                            />
                            <span className="text-sm">Intracranial carotid artery involvement (+3)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-cyan-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-cyan-600"
                              checked={rcvs2Items.vasoconstrictiveTrigger}
                              onChange={(e) => setRcvs2Items({...rcvs2Items, vasoconstrictiveTrigger: e.target.checked})}
                            />
                            <span className="text-sm">Vasoconstrictive trigger exposure (+2)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-cyan-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-cyan-600"
                              checked={rcvs2Items.female}
                              onChange={(e) => setRcvs2Items({...rcvs2Items, female: e.target.checked})}
                            />
                            <span className="text-sm">Female sex (+1)</span>
                          </label>
                          <label className="flex items-center space-x-2 p-2 hover:bg-cyan-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-cyan-600"
                              checked={rcvs2Items.sah}
                              onChange={(e) => setRcvs2Items({...rcvs2Items, sah: e.target.checked})}
                            />
                            <span className="text-sm">Subarachnoid hemorrhage on imaging (-2)</span>
                          </label>
                        </div>

                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-cyan-700 mb-2">RCVS Probability</h4>
                          <div className="text-sm space-y-1">
                            <p className={calculateRCVS2Score(rcvs2Items) < 2 ? "font-bold text-cyan-600" : ""}><strong>Score &lt;2:</strong> Low probability of RCVS</p>
                            <p className={calculateRCVS2Score(rcvs2Items) >= 2 && calculateRCVS2Score(rcvs2Items) <= 4 ? "font-bold text-cyan-600" : ""}><strong>Score 2-4:</strong> Intermediate probability</p>
                            <p className={calculateRCVS2Score(rcvs2Items) >= 5 ? "font-bold text-cyan-600" : ""}><strong>Score ≥5:</strong> High probability of RCVS</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 italic">RCVS² score helps distinguish RCVS from other causes of thunderclap headache. Consider vascular imaging and repeat imaging in 2-4 weeks if high suspicion.</p>
                        </div>
                      </div>
                    </details>

                    {/* Hunt and Hess Scale / WFNS Scale */}
                    <details className="bg-amber-50 border border-amber-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-amber-800 hover:bg-amber-100 rounded-lg flex items-center justify-between">
                        <span>Hunt and Hess / WFNS Scale (SAH Grading)</span>
                        <span className="text-sm font-normal text-amber-600">H&H: {huntHessGrade || 'Not Selected'} | WFNS: {wfnsGrade || 'Not Selected'}</span>
                      </summary>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Hunt and Hess Scale */}
                          <div className="space-y-3">
                            <h4 className="text-base font-semibold text-amber-800 mb-2">Hunt and Hess Scale</h4>
                            <div className="space-y-2">
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="huntHess"
                                  value="1"
                                  checked={huntHessGrade === '1'}
                                  onChange={(e) => setHuntHessGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 1</div>
                                  <div className="text-sm text-gray-600">Asymptomatic or mild headache</div>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="huntHess"
                                  value="2"
                                  checked={huntHessGrade === '2'}
                                  onChange={(e) => setHuntHessGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 2</div>
                                  <div className="text-sm text-gray-600">Moderate-severe headache, nuchal rigidity, no deficit (except CN palsy)</div>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="huntHess"
                                  value="3"
                                  checked={huntHessGrade === '3'}
                                  onChange={(e) => setHuntHessGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 3</div>
                                  <div className="text-sm text-gray-600">Drowsiness, confusion, or mild focal deficit</div>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="huntHess"
                                  value="4"
                                  checked={huntHessGrade === '4'}
                                  onChange={(e) => setHuntHessGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 4</div>
                                  <div className="text-sm text-gray-600">Stupor, moderate-severe hemiparesis</div>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="huntHess"
                                  value="5"
                                  checked={huntHessGrade === '5'}
                                  onChange={(e) => setHuntHessGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 5</div>
                                  <div className="text-sm text-gray-600">Deep coma, decerebrate rigidity, moribund</div>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* WFNS Scale */}
                          <div className="space-y-3">
                            <h4 className="text-base font-semibold text-amber-800 mb-2">WFNS Scale</h4>
                            <div className="space-y-2">
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="wfns"
                                  value="1"
                                  checked={wfnsGrade === '1'}
                                  onChange={(e) => setWfnsGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 1</div>
                                  <div className="text-sm text-gray-600">GCS 15, no motor deficit</div>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="wfns"
                                  value="2"
                                  checked={wfnsGrade === '2'}
                                  onChange={(e) => setWfnsGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 2</div>
                                  <div className="text-sm text-gray-600">GCS 13-14, no motor deficit</div>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="wfns"
                                  value="3"
                                  checked={wfnsGrade === '3'}
                                  onChange={(e) => setWfnsGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 3</div>
                                  <div className="text-sm text-gray-600">GCS 13-14, with motor deficit</div>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="wfns"
                                  value="4"
                                  checked={wfnsGrade === '4'}
                                  onChange={(e) => setWfnsGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 4</div>
                                  <div className="text-sm text-gray-600">GCS 7-12, with or without motor deficit</div>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="wfns"
                                  value="5"
                                  checked={wfnsGrade === '5'}
                                  onChange={(e) => setWfnsGrade(e.target.value)}
                                  className="mt-1 text-amber-600"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Grade 5</div>
                                  <div className="text-sm text-gray-600">GCS 3-6, with or without motor deficit</div>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* PREVENT 10-year ASCVD Risk */}
                    <details className="bg-rose-50 border border-rose-200 rounded-lg">
                      <summary className="cursor-pointer p-3 font-semibold text-rose-800 hover:bg-rose-100 rounded-lg">
                        PREVENT 10-year ASCVD Risk Estimate
                      </summary>
                      <div className="p-4">
                        <div className="bg-white p-4 rounded border">
                        <a 
                          href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm font-medium"
                        >
                          Open PREVENT Calculator →
                        </a>
                        </div>
                      </div>
                    </details>

                  </div>
                    )}

                    {/* References & Evidence Content */}
                    {managementSubTab === 'references' && (
                  <div className="space-y-6">

                    {/* Evidence Filter */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter evidence documents..."
                          value={evidenceFilter}
                          onChange={(e) => setEvidenceFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Filter evidence documents"
                        />
                        <i data-lucide="search" className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"></i>
                        {evidenceFilter && (
                          <button
                            onClick={() => setEvidenceFilter('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            aria-label="Clear filter"
                          >
                            <i data-lucide="x" className="w-5 h-5"></i>
                          </button>
                        )}
                      </div>
                      {evidenceFilter && (
                        <p className="text-sm text-gray-600 mt-2">
                          Filtering by: <span className="font-semibold">{evidenceFilter}</span>
                        </p>
                      )}
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2">
                        <a
                          href="https://www.openevidence.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 font-medium"
                        >
                          <i data-lucide="external-link" className="w-5 h-5"></i>
                          <span>OpenEvidence</span>
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href="https://www.uptodate.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 font-medium"
                        >
                          <i data-lucide="external-link" className="w-5 h-5"></i>
                          <span>UpToDate</span>
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href="https://asta.allen.ai/chat"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 font-medium"
                        >
                          <i data-lucide="external-link" className="w-5 h-5"></i>
                          <span>Asta (Ai2)</span>
                        </a>
                      </div>
                    </div>

                    {/* Aneurysms & Vascular Malformations Section */}
                    {evidenceSectionMatches('Aneurysms & Vascular Malformations', ['Unruptured Cerebral Aneurysms']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Aneurysms & Vascular Malformations</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-3 p-4 pt-0">
                        {/* Document 1 - Unruptured Cerebral Aneurysms */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Unruptured Cerebral Aneurysms</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/aneurysms/Unruptured Cerebral Aneurysms.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/aneurysms/Unruptured Cerebral Aneurysms.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Unruptured Cerebral Aneurysms', 'documents/aneurysms/Unruptured Cerebral Aneurysms.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                    {/* Antiplatelet Therapy Section */}
                    {evidenceSectionMatches('Antiplatelet Therapy', ['DAPT Minor Stroke-TIA Trials', 'DAPT After Ischemic Stroke-TIA']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Antiplatelet Therapy</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-3 p-4 pt-0">
                        {/* Document 1 - DAPT Minor Stroke-TIA Trials */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">DAPT Minor Stroke-TIA Trials</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/antiplatelet/DAPT Minor Stroke-TIA Trials.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/antiplatelet/DAPT Minor Stroke-TIA Trials.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('DAPT Minor Stroke-TIA Trials', 'documents/antiplatelet/DAPT Minor Stroke-TIA Trials.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                        {/* Document 2 - DAPT After Ischemic Stroke-TIA */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="image" className="w-6 h-6 text-green-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">DAPT After Ischemic Stroke-TIA</h4>
                              <p className="text-xs text-gray-500">Infographic - Match Patient to Trial</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/antiplatelet/DAPT After Ischemic Stroke-TIA.jpeg"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/antiplatelet/DAPT After Ischemic Stroke-TIA.jpeg"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('DAPT After Ischemic Stroke-TIA', 'documents/antiplatelet/DAPT After Ischemic Stroke-TIA.jpeg')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                    {/* Cerebral Small Vessel Disease Section */}
                    {evidenceSectionMatches('Cerebral Small Vessel Disease', ['Lacunar Stroke']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Cerebral Small Vessel Disease</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-3 p-4 pt-0">
                        {/* Document 1 - Lacunar Stroke */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Lacunar Stroke</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/csvd/Lacunar Stroke 7.13.22.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/csvd/Lacunar Stroke 7.13.22.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Lacunar Stroke', 'documents/csvd/Lacunar Stroke 7.13.22.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                    {/* EBM Section */}
                    {evidenceSectionMatches('EBM', ['Interpretation of Clinical Trials', 'CEBM Oxford Resources']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Critical Appraisal</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-3 p-4 pt-0">
                        {/* Document 1 - Interpretation of Clinical Trials */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Interpretation of Clinical Trials</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/ebm/Interpretation of Clinical Trials.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/ebm/Interpretation of Clinical Trials.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Interpretation of Clinical Trials', 'documents/ebm/Interpretation of Clinical Trials.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                        {/* External Link - CEBM Oxford Resources */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="external-link" className="w-6 h-6 text-blue-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">CEBM Oxford Resources</h4>
                              <p className="text-xs text-gray-500">Centre for Evidence-Based Medicine - University of Oxford</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="https://www.cebm.ox.ac.uk/resources"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="external-link" className="w-4 h-4"></i>
                              Visit
                            </a>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                    {/* EVT Section */}
                    {evidenceSectionMatches('EVT', ['Large Core Anterior Circulation LVO EVT Trials', 'Basilar Artery Occlusion EVT Trials', 'MeVO & Distal Vessel Occlusion EVT Trials']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Endovascular Therapy</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-3 p-4 pt-0">
                        {/* Document 1 - Large Core Anterior Circulation LVO EVT Trials */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Large Core Anterior Circulation LVO EVT Trials</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/evt/Large Core Anterior Circulation LVO EVT Trials.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/evt/Large Core Anterior Circulation LVO EVT Trials.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Large Core Anterior Circulation LVO EVT Trials', 'documents/evt/Large Core Anterior Circulation LVO EVT Trials.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>

                        {/* Document 2 - Basilar Artery Occlusion EVT Trials */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Basilar Artery Occlusion EVT Trials</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/evt/Basilar Artery Occlusion EVT Trials.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/evt/Basilar Artery Occlusion EVT Trials.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Basilar Artery Occlusion EVT Trials', 'documents/evt/Basilar Artery Occlusion EVT Trials.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>

                        {/* Document 3 - MeVO & Distal Vessel Occlusion EVT Trials */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">MeVO & Distal Vessel Occlusion EVT Trials</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/evt/MeVO & Distal Vessel Occlusion EVT Trials.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/evt/MeVO & Distal Vessel Occlusion EVT Trials.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('MeVO & Distal Vessel Occlusion EVT Trials', 'documents/evt/MeVO & Distal Vessel Occlusion EVT Trials.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                    {/* Risk Factors Section */}
                    {evidenceSectionMatches('Risk Factors', ['Timing of Anticoagulation after AF-Related Stroke', 'Atrial Fibrillation & Secondary Stroke Prevention', 'AFib Stroke EPI519', 'Diabetes and stroke', 'Lipids and Cerebrovascular Disease']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Risk Factors</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-4 p-4 pt-0">

                        {/* Atrial Fibrillation Subsection */}
                        <div className="border-l-4 border-purple-500 pl-4">
                          <h4 className="text-base font-semibold text-purple-800 mb-3">Atrial Fibrillation</h4>
                          <div className="space-y-3">
                            {/* Document 1 - Timing of Anticoagulation after AF-Related Stroke */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-900">Timing of Anticoagulation after AF-Related Stroke</h5>
                                  <p className="text-xs text-gray-500">PDF Document</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href="documents/afib/AC timing after AF-related Stroke.pdf"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                                >
                                  <i data-lucide="eye" className="w-4 h-4"></i>
                                  View
                                </a>
                                <a
                                  href="documents/afib/AC timing after AF-related Stroke.pdf"
                                  download
                                  className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                                >
                                  <i data-lucide="download" className="w-4 h-4"></i>
                                  Download
                                </a>
                                <button
                                  onClick={() => emailDocument('AC timing after AF-related Stroke', 'documents/afib/AC timing after AF-related Stroke.pdf')}
                                  className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                                  title="Email this document"
                                >
                                  <i data-lucide="mail" className="w-4 h-4"></i>
                                  Email
                                </button>
                              </div>
                            </div>

                            {/* Document 2 - Atrial Fibrillation & Secondary Stroke Prevention */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-900">Atrial Fibrillation & Secondary Stroke Prevention</h5>
                                  <p className="text-xs text-gray-500">PDF Document</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href="documents/afib/AF & secondary stroke prevention July 2024.pdf"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                                >
                                  <i data-lucide="eye" className="w-4 h-4"></i>
                                  View
                                </a>
                                <a
                                  href="documents/afib/AF & secondary stroke prevention July 2024.pdf"
                                  download
                                  className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                                >
                                  <i data-lucide="download" className="w-4 h-4"></i>
                                  Download
                                </a>
                                <button
                                  onClick={() => emailDocument('AF & secondary stroke prevention July 2024', 'documents/afib/AF & secondary stroke prevention July 2024.pdf')}
                                  className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                                  title="Email this document"
                                >
                                  <i data-lucide="mail" className="w-4 h-4"></i>
                                  Email
                                </button>
                              </div>
                            </div>

                            {/* Document 3 - 2023 AHA AFib Guidelines */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <i data-lucide="external-link" className="w-6 h-6 text-purple-600"></i>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-900">2023 AHA AFib Guidelines</h5>
                                  <p className="text-xs text-gray-500">External Link - AHA Journals</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href="https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
                                >
                                  <i data-lucide="external-link" className="w-4 h-4"></i>
                                  Open Link
                                </a>
                              </div>
                            </div>

                            {/* Document 4 - 2024 ESC AFib Guidelines */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <i data-lucide="external-link" className="w-6 h-6 text-purple-600"></i>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-900">2024 ESC AFib Guidelines</h5>
                                  <p className="text-xs text-gray-500">External Link - European Heart Journal</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href="https://academic.oup.com/eurheartj/article/45/36/3314/7738779"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
                                >
                                  <i data-lucide="external-link" className="w-4 h-4"></i>
                                  Open Link
                                </a>
                              </div>
                            </div>

                            {/* Document 5 - AFib Stroke EPI519 */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-900">AFib Stroke EPI519</h5>
                                  <p className="text-xs text-gray-500">PDF Document</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href="documents/afib/AFib Stroke EPI519.pdf"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                                >
                                  <i data-lucide="eye" className="w-4 h-4"></i>
                                  View
                                </a>
                                <a
                                  href="documents/afib/AFib Stroke EPI519.pdf"
                                  download
                                  className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                                >
                                  <i data-lucide="download" className="w-4 h-4"></i>
                                  Download
                                </a>
                                <button
                                  onClick={() => emailDocument('AFib Stroke EPI519', 'documents/afib/AFib Stroke EPI519.pdf')}
                                  className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                                  title="Email this document"
                                >
                                  <i data-lucide="mail" className="w-4 h-4"></i>
                                  Email
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Diabetes and stroke */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Diabetes and stroke</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/epidemiology/Diabetes and stroke.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/epidemiology/Diabetes and stroke.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Diabetes and stroke', 'documents/epidemiology/Diabetes and stroke.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>

                        {/* Lipids and Cerebrovascular Disease */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Lipids and Cerebrovascular Disease</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/epidemiology/Lipids and Cerebrovascular Disease.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/epidemiology/Lipids and Cerebrovascular Disease.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Lipids and Cerebrovascular Disease', 'documents/epidemiology/Lipids and Cerebrovascular Disease.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                    {/* Thrombolytic Therapy Section */}
                    {evidenceSectionMatches('Thrombolytic Therapy', ['Thrombolytic Therapy 4.5-24h RCTs', 'WAKE-UP Trial']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Thrombolytic Therapy</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-3 p-4 pt-0">
                        {/* Document 1 - Thrombolytic Therapy 4.5-24h RCTs */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Thrombolytic Therapy 4.5-24h RCTs</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/thrombolytic/Thrombolytic Therapy 4.5-24h RCTs.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/thrombolytic/Thrombolytic Therapy 4.5-24h RCTs.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Thrombolytic Therapy 4.5-24h RCTs', 'documents/thrombolytic/Thrombolytic Therapy 4.5-24h RCTs.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>

                        {/* Document 2 - WAKE-UP Trial */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="external-link" className="w-6 h-6 text-blue-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">WAKE-UP Trial</h4>
                              <p className="text-xs text-gray-500">External Link - New England Journal of Medicine</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="https://www.nejm.org/doi/full/10.1056/NEJMoa1804355"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="external-link" className="w-4 h-4"></i>
                              Open Link
                            </a>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                    {/* Exam Section */}
                    {evidenceSectionMatches('Exam', ['Differentiating Acute Confusional State (Delirium) from Aphasia', 'Coma Exam']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Exam</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-3 p-4 pt-0">
                        {/* Document 1 - Differentiating Delirium from Aphasia */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Differentiating Acute Confusional State (Delirium) from Aphasia</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/exam/Differentiating Acute Confusional State (Delirium) from Aphasia.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/exam/Differentiating Acute Confusional State (Delirium) from Aphasia.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Differentiating Acute Confusional State (Delirium) from Aphasia', 'documents/exam/Differentiating Acute Confusional State (Delirium) from Aphasia.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>

                        {/* Document 2 - Coma Exam */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Coma Exam</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/exam/coma exam.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/exam/coma exam.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('coma exam', 'documents/exam/coma exam.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                    {/* Large Artery Disease Section */}
                    {evidenceSectionMatches('Large Artery Disease', ['Symptomatic Cervical Carotid Artery Stenosis', 'CREST-2 Trial']) && (
                    <details className="bg-white border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-between text-lg">
                        <span>Large Artery Disease</span>
                        <i data-lucide="chevron-down" className="w-5 h-5"></i>
                      </summary>
                      <div className="space-y-3 p-4 pt-0">
                        {/* Document 1 - Symptomatic Cervical Carotid Artery Stenosis */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Symptomatic Cervical Carotid Artery Stenosis</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/lad/Symptomatic Cervical Carotid Artery Stenosis.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/lad/Symptomatic Cervical Carotid Artery Stenosis.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('Symptomatic Cervical Carotid Artery Stenosis', 'documents/lad/Symptomatic Cervical Carotid Artery Stenosis.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                        {/* Document 2 - CREST-2 Trial */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <i data-lucide="file-text" className="w-6 h-6 text-red-600"></i>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">CREST-2 Trial (December 2025)</h4>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="documents/lad/CREST-2 Trial - Dec 2025.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="eye" className="w-4 h-4"></i>
                              View
                            </a>
                            <a
                              href="documents/lad/CREST-2 Trial - Dec 2025.pdf"
                              download
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <i data-lucide="download" className="w-4 h-4"></i>
                              Download
                            </a>
                            <button
                              onClick={() => emailDocument('CREST-2 Trial (December 2025)', 'documents/lad/CREST-2 Trial - Dec 2025.pdf')}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                              title="Email this document"
                            >
                              <i data-lucide="mail" className="w-4 h-4"></i>
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </details>
                    )}

                  </div>
                )}
                {/* End of References/Evidence Content */}

                  </div>
                )}
                {/* End of Combined Management Tab (Ischemic, ICH, Calculators, References) */}

                {/* ============================================ */}
                {/* CLINICAL TRIALS TAB                          */}
                {/* Uses trialsData object and TrialCard component */}
                {/* ============================================ */}
                {activeTab === 'trials' && (
                  <div className="space-y-6">
                    {/* Header Section with Patient Summary */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <h1 className="text-3xl font-bold flex items-center gap-3">
                            🔬 Clinical Trials
                          </h1>
                          <p className="text-blue-100 mt-1">Reference for active clinical trials</p>
                        </div>

                      </div>

                    </div>

                    {/* Diagnosis-based recommendation banner */}
                    {telestrokeNote.diagnosisCategory && (telestrokeNote.diagnosisCategory === 'ischemic' || telestrokeNote.diagnosisCategory === 'ich') && (
                      <div className={`mb-4 p-4 rounded-lg border-2 flex items-center gap-3 ${
                        telestrokeNote.diagnosisCategory === 'ischemic'
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-red-50 border-red-300 text-red-800'
                      }`}>
                        <i data-lucide="target" className="w-5 h-5"></i>
                        <div>
                          <span className="font-semibold">
                            Patient Diagnosis: {telestrokeNote.diagnosisCategory === 'ischemic' ? 'Suspected Ischemic Stroke' : 'ICH'}
                          </span>
                          <span className="ml-2 text-sm opacity-75">
                            — Showing {telestrokeNote.diagnosisCategory === 'ischemic' ? 'ischemic stroke' : 'ICH'} trials by default
                          </span>
                        </div>
                        {trialsCategory !== telestrokeNote.diagnosisCategory && (
                          <button
                            onClick={() => setTrialsCategory(telestrokeNote.diagnosisCategory)}
                            className={`ml-auto px-3 py-1 rounded text-sm font-medium ${
                              telestrokeNote.diagnosisCategory === 'ischemic'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            Show Recommended Trials
                          </button>
                        )}
                      </div>
                    )}

                    {/* Trial Category Filter Buttons */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {Object.keys(trialsData).map(category => {
                        const categoryData = trialsData[category];
                        const trialCount = categoryData.hasSubsections
                          ? Object.values(categoryData.subsections).reduce((acc, sub) => acc + sub.trials.length, 0)
                          : categoryData.trials.length;

                        const getCategoryColor = (cat) => {
                          switch(cat) {
                            case 'ischemic': return 'bg-blue-600 hover:bg-blue-700';
                            case 'ich': return 'bg-red-600 hover:bg-red-700';
                            case 'rehab': return 'bg-green-600 hover:bg-green-700';
                            case 'cadasil': return 'bg-purple-600 hover:bg-purple-700';
                            default: return 'bg-gray-600 hover:bg-gray-700';
                          }
                        };

                        const getCategoryName = (cat) => {
                          switch(cat) {
                            case 'ischemic': return 'Ischemic Stroke';
                            case 'ich': return 'Intracerebral Hemorrhage';
                            case 'rehab': return 'Rehabilitation';
                            case 'cadasil': return 'CADASIL';
                            default: return categoryData.title;
                          }
                        };

                        // Check if this category matches patient diagnosis
                        const isRecommended = telestrokeNote.diagnosisCategory === category;

                        return (
                          <button
                            key={category}
                            onClick={() => setTrialsCategory(category)}
                            className={`relative px-4 py-2 rounded-full font-medium transition-all ${
                              trialsCategory === category
                                ? `${getCategoryColor(category)} text-white shadow-lg`
                                : isRecommended
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 ring-2 ring-offset-1 ring-yellow-400'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {isRecommended && (
                              <span className="absolute -top-2 -right-1 text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">
                                ★
                              </span>
                            )}
                            {getCategoryName(category)} ({trialCount})
                          </button>
                        );
                      })}
                    </div>

                    {/* Trial Cards - Uses trialsData and TrialCard component */}
                    <div className="space-y-4">
                      {(() => {
                        const categoryData = trialsData[trialsCategory];
                        return (
                          <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2">
                              {categoryData.title}
                            </h2>
                            {categoryData.hasSubsections ? (
                              Object.entries(categoryData.subsections).map(([subKey, subsection]) => (
                                <div key={subKey} className="space-y-4">
                                  <h3 className="text-xl font-semibold text-gray-700 ml-4">
                                    {subsection.title}
                                  </h3>
                                  {subsection.trials.map((trial, index) => (
                                    <TrialCard key={index} trial={trial} category={trialsCategory} />
                                  ))}
                                </div>
                              ))
                            ) : (
                              categoryData.trials.map((trial, index) => (
                                <TrialCard key={index} trial={trial} category={trialsCategory} />
                              ))
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                {/* End Clinical Trials Tab */}

              </div>

            </div>

            {/* Emergency Contacts FAB - Floating Action Button */}
            <div className="fixed right-4 fab-offset fab-layer">
              {/* Expanded Contact Panel */}
              {fabExpanded && (
                <div className="absolute bottom-16 right-0 w-72 bg-white rounded-lg shadow-2xl border-2 border-red-300 overflow-hidden animate-fadeIn">
                  <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white px-4 py-2 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <i data-lucide="phone-call" className="w-4 h-4"></i>
                      Quick Contacts
                    </span>
                    <button
                      onClick={() => setFabExpanded(false)}
                      className="hover:bg-red-700 rounded p-1 transition-colors"
                      aria-label="Close contacts"
                    >
                      <i data-lucide="x" className="w-4 h-4"></i>
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {quickContacts.map((contact) => {
                      const rawPhone = contact.phone || '';
                      const digits = rawPhone.replace(/[^\d+]/g, '');
                      const telHref = digits ? `tel:${digits.startsWith('+') ? digits : `+1${digits}`}` : '#';
                      return (
                        <a
                          key={contact.id || contact.label}
                          href={telHref}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors"
                          onClick={() => setFabExpanded(false)}
                        >
                          <div className="bg-red-100 rounded-full p-2">
                            <i data-lucide="phone" className="w-5 h-5 text-red-600"></i>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{contact.label || 'Contact'}</div>
                            <div className="text-xs text-gray-500">
                              {contact.phone || 'Add phone'}
                              {contact.note ? ` (${contact.note})` : ''}
                            </div>
                          </div>
                          <i data-lucide="external-link" className="w-4 h-4 text-gray-400 ml-auto"></i>
                        </a>
                      );
                    })}
                  </div>
                  <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center">
                    Tap number to call directly
                  </div>
                </div>
              )}

              {/* FAB Button */}
              <button
                onClick={() => setFabExpanded(!fabExpanded)}
                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 animate-pulse"
                aria-label="Toggle emergency contacts"
                aria-expanded={fabExpanded}
                title="Emergency Contacts"
              >
                <i data-lucide="phone" className="w-6 h-6 text-white"></i>
              </button>

              {/* Tooltip when collapsed */}
              {!fabExpanded && (
                <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 hover:opacity-100 pointer-events-none transition-opacity hidden md:block">
                  Quick Contacts
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation - Only visible on small screens - 3 Tabs */}
            <div id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg z-50 pb-safe">
              <div className="flex flex-nowrap items-center gap-2 px-2 py-2 overflow-x-auto no-scrollbar">
                {mobilePrimaryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigateTo(tab.id);
                    }}
                    className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600'
                    }`}
                  >
                    <i data-lucide={tab.icon} className="w-6 h-6 mb-1"></i>
                    <span className="text-xs font-medium">{tab.name}</span>
                  </button>
                ))}
                {mobileMoreTabs.length > 0 && (
                  <button
                    onClick={() => setMobileMoreOpen(true)}
                    className="flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all flex-shrink-0 text-gray-600"
                  >
                    <i data-lucide="more-horizontal" className="w-6 h-6 mb-1"></i>
                    <span className="text-xs font-medium">More</span>
                  </button>
                )}
              </div>
            </div>

            {mobileMoreOpen && mobileMoreTabs.length > 0 && (
              <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-40" onClick={() => setMobileMoreOpen(false)}>
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">More</h3>
                    <button onClick={() => setMobileMoreOpen(false)} className="text-gray-500">
                      <i data-lucide="x" className="w-5 h-5"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {mobileMoreTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          navigateTo(tab.id);
                          setMobileMoreOpen(false);
                        }}
                        className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all ${
                          activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                        }`}
                      >
                        <i data-lucide={tab.icon} className="w-6 h-6 mb-1"></i>
                        <span className="text-xs font-medium">{tab.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
          );
        };

        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<StrokeClinicalTool />);

        // Initialize Lucide icons
        lucide.createIcons();
