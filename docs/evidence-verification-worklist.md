# Maintained evidence verification

The broad trial/guideline/teaching verification backlog is retired at `archive/pre-encounter-first-20261001-4f8e99d`. It is not a current maintenance obligation or public API.

Current obligations are the retained records in `src/evidence`, selected `src/guidelines` projections, canonical clinical claims, historic tool source identities and protected protocol exceptions. See `CONTRIBUTING-content.md`, `docs/maintained-source-projections.json` and `docs/source-limits.md` for exact dependencies and unresolved access/correction limitations. Missing clinical review dates remain explicit.

Before changing a retained claim, verify its primary publication/label, population, endpoints, recommendation context, units and exclusions, then reconcile every mapped consumer. Identifier/schema validation alone cannot establish clinical correctness. Do not clear source limitations or advance lastReviewed because a build, metadata lookup, retirement or test ran.

Run maintained citation/PMID/content/evidence/clinical-trace guards and all affected arithmetic/state/browser tests. Protected clinical conflicts require the protected review process before publication; preserve the independent protocol/map baselines during engineering refactors.
