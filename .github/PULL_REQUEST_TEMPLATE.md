## Summary

<!-- One paragraph: what changes, why. -->

## Changes

<!-- Bullet list of file-level changes. -->

## Validation

- [ ] `npm run test:unit` — 427/427 (or specify the new total)
- [ ] `npm run evidence:validate` — clean
- [ ] `npm run build` — succeeds

## Clinical-correctness checklist (only if clinical content changed)

- [ ] Primary sources cited in commit message or PR body
- [ ] Identifier patterns valid (PMID `^\d{7,9}$`, DOI, NCT `^NCT\d{8}$`)
- [ ] No PHI in tests / fixtures / commit messages
- [ ] Tri-state criterion semantics preserved (unknown ≠ not_met)
- [ ] Class I recommendations have supporting claims

## Type of change

- [ ] Bug fix
- [ ] New feature / clinical content
- [ ] Refactor (no behavior change)
- [ ] Docs only
- [ ] CI / tooling
- [ ] Security fix

## Routes to inspect (if UI changed)

<!-- e.g., #/encounter, #/management/ich, #/trials → Atlas sub-tab -->
