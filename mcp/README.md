# Stroke Encounter MCP client

The local stdio server wraps the same retained pure helpers as the synthetic
Encounter workspace. It does not start an AI runtime or contact remote sources.
Run `npm ci --prefix mcp`, `npm run agent:assets`, then `npm --prefix mcp run smoke`.
Configure the MCP client to execute `node` with the absolute `mcp/server.mjs` path.

Synthetic educational demo only: no real encounter details or PHI. Every output
includes the public-demo disclaimer, which downstream clients must display.
Arithmetic does not establish treatment eligibility or administration.

| Retained tool | Scope |
|---|---|
| `calc_tnk_dose` | Explicit guideline or US FDA-label authority; kg input; no eligibility inference |
| `calc_alteplase_dose` | Strict adult AIS arithmetic, 0.9 mg/kg maximum 90 mg, 10% bolus and 90% infusion |
| `calc_crcl` | Adult Cockcroft–Gault, raw threshold value and rounded display; stable creatinine and weight convention require review |
| `calc_dawn_eligibility` | Partial historical screen; never complete EVT eligibility |
| `calc_defuse3_eligibility` | Partial historical screen; `penumbraMl` is legacy total hypoperfused volume including core |
| `list_calculators` | 23 workspace tool contracts and reveal routes |
| `get_sources` | Bounded source/claim records, original review scopes and unresolved correction limitations |
| `search_reference` | Local Evidence topics and completed primary-study summaries, with source-access notes and card limitations |

`search_reference` reads the generated `data/clinical-reference.json` endpoint
without fetching external sources. `query` is a string of at most 200 characters
(default empty); `type` is `all`, `topic`, or `study`; `setting` is `all`,
`on-call`, `hospital`, or `clinic`; and `limit` is an integer from 1 to 25
(default 10). All query words must match. Results include `count`,
`totalMatched`, `truncated`, full source-bound `records`, and endpoint metadata.
An empty query browses the filtered records. Example arguments:
`{"query":"ELAN","type":"study","setting":"hospital","limit":5}`.
The server rejects a missing, malformed or app-version-mismatched reference
endpoint at startup. Run the asset generator after updating canonical records.

Reference `checkedAt` dates record source access and scope checks, not full
clinical certification. Preserve each source's `access` note and each topic's
`caution` or study's `limits`. Completed studies are historical outcome evidence,
not enrollment data or treatment gates. This bounded endpoint does not restore
the archived full trial or guideline corpus.

Inputs use strict finite numbers and explicit units. DAWN/DEFUSE-3 preserve their
legacy tool names but return `eligible: null` when the partial screen is met,
`partialScreenMet: true`, `actionable: false`, and the omitted clinical domains.
Failure does not exclude EVT under newer evidence.

Schema 2 deliberately retires `search_trials`, `get_trial`, `list_guidelines`,
`get_guideline`, `calc_enoxaparin_dose`, `calc_doac_start_timing`, `calc_pcc_dose`,
`calc_andexanet_dose`, and `generic_bp_protocols`. They are absent from tool
advertising and produce the MCP unavailable-tool error when called. Retained
names and input contracts remain available; alteplase now rejects malformed or
out-of-range input and uses the exact formula split before display rounding.
Protected institutional instructions are not promoted into universal agent doses.

Old static atlas/trial/guideline JSON URLs return explicit retirement envelopes
with `data: null`, `_meta.status: "retired"`, replacement `/data/sources.json`,
and archive `archive/pre-encounter-first-20261001-4f8e99d`. Pages may still use HTTP
200 for these static files: inspect the status. Full historical content is at the
archival Git ref, not a current API. Missing review dates remain missing; builds
and metadata checks never imply clinical validation.
