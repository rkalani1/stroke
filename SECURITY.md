# Security Policy

## Reporting a vulnerability

Stroke CDS is a clinical decision-support tool used in real patient care.
Security issues — particularly anything that could affect patient
data confidentiality, app integrity (incorrect calculator output,
matcher misclassification, PHI exposure), or availability of urgent
clinical workflows — are taken seriously.

### How to report

Please report vulnerabilities **privately** via one of:

- GitHub's "Report a vulnerability" advisory feature on the repo
  Security tab (preferred — keeps a confidential record).
- Email to the repo maintainer (see `git log` author entries) with
  subject prefixed `[SECURITY]`.

Please do **not** open a public issue for security-sensitive reports.

### What to include

- A description of the vulnerability and its impact on clinical use.
- Steps to reproduce, or a minimal proof-of-concept.
- The version (`package.json` → `version`) where you observed it.
- Any browser / OS / install-mode (PWA / Capacitor wrapper) details.

### What to expect

- Acknowledgement within ~7 days.
- Triage and fix-target timeline communicated within ~14 days.
- Coordinated disclosure once a patch is shipped to `main` and the
  GitHub Pages deployment.

## Scope

The following are in-scope for security reports:

- The web app served at `https://rkalani1.github.io/stroke/` and any
  Capacitor-wrapped distribution.
- Local data persistence (IndexedDB ward census, localStorage forms).
- Service worker caching and update behavior.
- Any matcher logic, calculator output, or trial-eligibility
  determination that incorrectly classifies a patient case.
- Bundled evidence/trial data (`src/evidence/**`).

The following are **out of scope**:

- Browser- or OS-level vulnerabilities not specific to this app.
- Third-party services the user is directed to via external links.
- Issues requiring physical access to an unlocked device with the app
  open (this app is local-storage-only and does not authenticate).

## PHI policy

This app stores no PHI on any server (entirely client-side, no
backend). Local data auto-expires after 12 hours of inactivity. If a
report involves observed PHI in any artifact (screenshot, log, repro
case), please redact before sending.

## Known classes of finding handled differently

- **Evidence-content correctness** (e.g., a citation's PMID is wrong,
  a trial's eligibility criterion misrepresents the published
  protocol): not a security vulnerability — please file as a regular
  issue or PR with the corrected source. The `unverified-source-limited`
  / `todo-verify` flag system in `src/evidence/` is the structured
  channel for this.
- **Matcher false-positive eligibility** (a trial shows "Eligible" when
  the actual trial would exclude): this IS in-scope as a clinical-safety
  bug. Please report privately so a fix can ship before the snapshot
  test suite locks the wrong behavior.
