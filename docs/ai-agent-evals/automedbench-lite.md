# AutoMedBench-Lite Gate for AI-Assisted Stroke Updates

Use this gate before accepting AI-generated changes to evidence, protocol cards, trial matching, calculators, or public-demo clinical text.

This gate evaluates workflow discipline. It does not make the app clinically validated, institutionally approved, or safe for patient care.

## Safety Boundary

- Use public, synthetic, or de-identified material only.
- Do not paste PHI, patient identifiers, MRN fragments, ward census data, real encounter details, learner records, credentials, or confidential institutional information.
- Do not convert evidence summaries into operational protocol recommendations without human clinical review.
- Preserve all public-demo and no-PHI caveats.

## S1 Plan

Before editing, the agent must state:

- Target module, page, or data file.
- Exact user-facing claim or behavior being changed.
- Source(s) supporting the change.
- In-scope and out-of-scope work.
- Stop conditions, including unavailable source text, uncertain trial status, conflicting evidence, or missing validation.

## S2 Setup

The agent must identify:

- Current files that define the behavior or text.
- Relevant source docs, citations, PMIDs, DOIs, NCT IDs, or trial records.
- Applicable repo checks.
- Whether the change touches evidence content, eligibility logic, UI copy, calculator logic, or generated docs.

## S3 Validate

The agent must complete concrete checks before finalizing:

- Source fidelity: each claim maps to a source row, citation, or approved public source.
- Citation integrity: IDs, URLs, years, PMID/DOI/NCT formats, and title text are exact.
- Contradiction check: new language does not conflict with existing evidence notes or safety language.
- Privacy check: no PHI, identifiers, private institutional workflow details, or realistic fake patient data.
- Behavior check: affected calculator, matcher, or UI paths are tested when logic changes.
- Format check: generated docs, citation tables, and JSON/data files remain valid.

Minimum commands for evidence or clinical-content updates:

```bash
npm run validate:automedbench-lite
npm run evidence:refresh
npm run qa
```

Use narrower commands for isolated text-only changes only when the final note explains why broader checks were not needed.

## S4 Execute

The agent may edit only after S1-S3 are complete. Keep changes scoped and preserve existing data boundaries, disclaimers, and citations.

## S5 Submit

The final response or PR description must include:

- Changed files.
- Source(s) used.
- Validation commands and outcomes.
- Any residual uncertainty or human clinical review needed.
- Confirmation that no PHI, credentials, or restricted institutional data were introduced.

## One-Shot Prompt

```text
Apply the stroke repo AutoMedBench-Lite gate to this change. Write S1 Plan, S2 Setup, and S3 Validate before editing. Then make the scoped change as S4 Execute and provide S5 Submit with changed files, source trace, validation commands, residual risk, and no-PHI confirmation. Stop if source fidelity, privacy, or format validation cannot be completed.
```
