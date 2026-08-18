const fs = require('fs');

let content = fs.readFileSync('src/app.jsx', 'utf8');

const replacement = `                    {/* ===== v7 PATIENT STRIP (mobile) — sticky chip row above v6 strip during transition.
                         Phase 5 IA overhaul will remove the v6 strip below and promote Incomplete /
                         Safety-critical banners into PatientStrip as chip-links. ============== */}
                    <MobilePatientStrip
                      telestrokeNote={telestrokeNote}
                      nihssScore={nihssScore}
                      windowStatus={windowStatus}
                      lkwElapsed={lkwElapsed}
                      aspectsScore={aspectsScore}
                    />`;

const targetBlock = `                    {/* ===== v7 PATIENT STRIP (mobile) — sticky chip row above v6 strip during transition.
                         Phase 5 IA overhaul will remove the v6 strip below and promote Incomplete /
                         Safety-critical banners into PatientStrip as chip-links. ============== */}
                    {(telestrokeNote.age || nihssScore > 0 || telestrokeNote.diagnosis) ? (() => {
                      const lkwIsoForStrip = (() => {
                        const d = telestrokeNote.lkwDate, t = telestrokeNote.lkwTime;
                        if (!d || !t) return null;
                        try { return new Date(\`\${d}T\${t}:00\`).toISOString(); } catch (_) { return null; }
                      })();
                      const elapsedMinForStrip = lkwIsoForStrip
                        ? Math.max(0, Math.floor((Date.now() - new Date(lkwIsoForStrip).getTime()) / 60000))
                        : 0;
                      const elapsedStatusForStrip = windowStatus?.color === 'red'
                        ? 'crit'
                        : windowStatus?.color === 'amber'
                          ? 'warn'
                          : 'none';
                      const v7Patient = {
                        age: telestrokeNote.age || '—',
                        sex: telestrokeNote.sex || '—',
                        lkw: telestrokeNote.lkwTime || '—',
                        elapsed: lkwElapsed || '—',
                        elapsedStatus: elapsedStatusForStrip,
                        elapsedMin: elapsedMinForStrip,
                        nihss: telestrokeNote.nihss || (nihssScore > 0 ? nihssScore : '—'),
                        aspects: Number.isFinite(aspectsScore) ? aspectsScore : '—',
                        anticoag: (telestrokeNote.anticoagBridging || {}).doacType || 'None',
                        lkwUnknown: false
                      };
                      return (
                        <V7PatientStripMobile
                          patient={v7Patient}
                          completion={undefined /* Phase 5 promotes Incomplete + Safety-critical banners here */}
                          onJump={undefined}
                        />
                      );
                    })() : null}`;

content = content.replace(targetBlock, replacement);

const extractFn = `
// Extracted helper for LKW ISO formatting
function getLkwIsoForStrip(d, t) {
  if (!d || !t) return null;
  try { return new Date(\`\${d}T\${t}:00\`).toISOString(); } catch (_) { return null; }
}

// Extracted component for rendering the v7 mobile patient strip
function MobilePatientStrip({ telestrokeNote, nihssScore, windowStatus, lkwElapsed, aspectsScore }) {
  if (!telestrokeNote.age && nihssScore <= 0 && !telestrokeNote.diagnosis) return null;

  const lkwIsoForStrip = getLkwIsoForStrip(telestrokeNote.lkwDate, telestrokeNote.lkwTime);

  const elapsedMinForStrip = lkwIsoForStrip
    ? Math.max(0, Math.floor((Date.now() - new Date(lkwIsoForStrip).getTime()) / 60000))
    : 0;

  const elapsedStatusForStrip = windowStatus?.color === 'red'
    ? 'crit'
    : windowStatus?.color === 'amber'
      ? 'warn'
      : 'none';

  const v7Patient = {
    age: telestrokeNote.age || '—',
    sex: telestrokeNote.sex || '—',
    lkw: telestrokeNote.lkwTime || '—',
    elapsed: lkwElapsed || '—',
    elapsedStatus: elapsedStatusForStrip,
    elapsedMin: elapsedMinForStrip,
    nihss: telestrokeNote.nihss || (nihssScore > 0 ? nihssScore : '—'),
    aspects: Number.isFinite(aspectsScore) ? aspectsScore : '—',
    anticoag: (telestrokeNote.anticoagBridging || {}).doacType || 'None',
    lkwUnknown: false
  };

  return (
    <V7PatientStripMobile
      patient={v7Patient}
      completion={undefined /* Phase 5 promotes Incomplete + Safety-critical banners here */}
      onJump={undefined}
    />
  );
}

export default function App`;

content = content.replace('export default function App', extractFn);

fs.writeFileSync('src/app.jsx', content);
