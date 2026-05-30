# Clinical Intelligence — What's New source

`briefing-latest.md` is the committed copy of Dr. Kalani's **Stroke & Clinical
Neurology Surveillance Report** ("Clinical Intelligence Morning Briefing"),
generated weekly by a Gemini agent and stored in Google Drive
(`Stroke_and_Neurology_Daily_Compact_Briefing.docx`). It contains ~50 high-impact
publications from the past month, each with journal/date, a DOI link, a clinical
bottom line, PICO, methodology, and primary results.

## Pipeline (weekly, Monday ~08:00)
1. Refresh `briefing-latest.md` from the latest Drive master doc (agent/manual).
2. **Verify (online, once, with PubMed access):** resolve each study's DOI→PMID
   (or exact title→PMID when the briefing URL has no DOI — most don't), then
   confirm the resolved PMID's title matches the briefing study. Freeze the
   results into `verified-pmids.json` (keyed by study `id`). VERIFIED = a real
   PMID whose title matches; QUARANTINE = no PMID resolved or title mismatch
   (preprint / protocol / review / different topic / conference late-breaker).
3. **Generate (offline, deterministic):** `scripts/generate-whats-new.mjs` parses
   the 50 briefing blocks, joins `verified-pmids.json`, and emits `whats-new.json`
   (repo root) containing ONLY verified studies. Quarantined studies are excluded
   and listed in `whats-new-quarantine.md`, never displayed.
4. Build runs `validate:whats-new` (offline gate) and deploys.

### Files
- `briefing-latest.md` — source (exactly 50 study blocks).
- `verified-pmids.json` — committed PubMed verification cache (`byId` map of
  `{ pmid, doi, journal, verifiedTitle, status }`). Makes every build offline +
  deterministic. Re-run verification only when the briefing is refreshed.
- `../../whats-new.json` — generated feed (verified-only).
- `../../whats-new-quarantine.md` — generated list of excluded studies + reasons.

Source of truth for clinical content: this briefing (Dr. Kalani's curated intelligence).
Verification layer: PubMed PMID/DOI resolution (working source links + clinical safety).
Cache key: the briefing study `id` (kebab of acronym, else a title slug), because
briefing URLs almost never carry a DOI.
