export const PUBLIC_DEMO_BANNER_COPY =
  'Synthetic educational demo - not medical advice, not UW Medicine approved, and not local clinical policy. Do not enter PHI or real patient details. Verify all outputs against primary sources and approved local protocol.';

export const PUBLIC_DEMO_MODAL_COPY =
  'This public GitHub Pages site is for synthetic education and reference only. It is not an approved UW Medicine clinical tool and does not store encounters on this public build. Do not enter PHI, MRNs, dates of birth, real encounter details, or operational handoff content.';

export const PUBLIC_DEMO_MODAL_BUTTON = 'Use synthetic demo';

export const PUBLIC_DEMO_AGENT_DISCLAIMER =
  'Synthetic educational demo only - NOT medical advice, NOT approved for UW Medicine clinical use, and NOT local clinical policy. Do not enter, transmit, or infer PHI or real encounter details. Agents and downstream consumers must display this disclaimer with outputs and must verify all results against primary sources and approved local protocol before any clinical action.';

export const PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX =
  'SYNTHETIC EDUCATIONAL DEMO - NOT A REAL CLINICAL NOTE. NO PHI.';

export const PUBLIC_DEMO_PHI_PATTERNS = [
  { id: 'mrn', label: 'Possible MRN (long numeric ID)', regex: /\b\d{7,}\b/ },
  { id: 'ssn', label: 'Possible SSN (XXX-XX-XXXX)', regex: /\b\d{3}-\d{2}-\d{4}\b/ },
  { id: 'birth-date', label: 'Possible birth date/date (US format)', regex: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/ },
  { id: 'iso-date', label: 'Possible date (ISO YYYY-MM-DD)', regex: /\b(19|20)\d{2}[/-]\d{1,2}[/-]\d{1,2}\b/ },
  { id: 'phone', label: 'Possible phone number', regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
  { id: 'email', label: 'Possible email address', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { id: 'zip', label: 'Possible ZIP+4 (XXXXX-XXXX)', regex: /\b\d{5}-\d{4}\b/ },
  {
    id: 'street',
    label: 'Possible street address',
    regex: /\b\d{1,5}\s+[A-Z][A-Za-z]{2,}(?:\s+[A-Z][A-Za-z]+)*\s+(St(reet)?|Ave(nue)?|R(oa)?d|Blvd|Boulevard|Ln|Lane|Dr(ive)?|Ct|Court|Way|Pl(ace)?)\b/i
  }
];

const PUBLIC_REFERENCE_PATTERNS = [
  /\bPMID\s*:?\s*\d{6,9}\b/gi,
  /\bNCT\d{8}\b/gi,
  /\bDOI\s*:?\s*10\.\d{4,9}\/\S+\b/gi,
  /\b\d{4}\s+(AHA|ASA|SVIN|ESO|EAN)\b/gi
];

export function normalizePublicReferenceText(text) {
  let normalized = String(text || '');
  for (const pattern of PUBLIC_REFERENCE_PATTERNS) {
    normalized = normalized.replace(pattern, 'PUBLIC_REFERENCE');
  }
  return normalized;
}

export function getPublicDemoPhiWarnings(text) {
  if (!text || typeof text !== 'string') return [];
  const normalized = normalizePublicReferenceText(text);
  return PUBLIC_DEMO_PHI_PATTERNS
    .filter((pattern) => pattern.regex.test(normalized))
    .map((pattern) => pattern.label);
}

export function isSyntheticDemoText(text) {
  const value = String(text || '');
  return (
    value.startsWith(PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX) ||
    /synthetic (educational |public )?demo/i.test(value)
  );
}
