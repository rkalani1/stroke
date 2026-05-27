# Security Policy

## Reporting a vulnerability

Stroke CDS is published on GitHub Pages as an educational/synthetic demo.
The public deployment is not an official system and must not be
used to store or process real patient identifiers, PHI, ward census data, or
operational handoff content. Security issues that could affect app integrity,
incorrect calculator output, matcher misclassification, privacy warnings, or
the public-demo boundary are taken seriously.

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

- The web app served at ` /stroke/` as a synthetic
  public demo.
- Public-demo safeguards that disable ward census, patient-context URL
  prefill, and clinical-data persistence.
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

Do not enter PHI, patient identifiers, MRN fragments, names, dates of birth,
real ward census data, or real encounter content into the public GitHub Pages
deployment. Real clinical use requires an approved any organization deployment,
approved storage, access control, and governance outside this public site. If a
report involves observed PHI in any artifact (screenshot, log, repro case),
please redact before sending.

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
