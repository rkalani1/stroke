# Contributing to Stroke

The public workspace is a synthetic demo, not an approved clinical system. Use synthetic fixtures only. Never put PHI, real encounters, credentials, private contacts or confidential institutional content in this repository.

## Development

```sh
git clone https://github.com/rkalani1/stroke.git
cd stroke
npm ci
npm run build:prod
npm run publish:stage
npm run test:unit
npm test
npm run test:mcp
npm run test:protocol-snapshot
```

Read [content maintenance](CONTRIBUTING-content.md), [clinical trace](docs/clinical-claim-maintenance.md), [source limits](docs/source-limits.md), [regressions](docs/regression-checklist.md), and [PWA behavior](docs/pwa-and-app.md). Broad portal seed/generator/matcher workflows are retired; historic implementation/reports remain in Git history and the archival ref.

## Required checks and boundaries

- Preserve exact protected ICH/ischemic protocol and Telestroke-map locks. Do not regenerate their baselines for a navigation/refactor change. New clinical-source conflicts require owner adjudication before release.
- Verify changed arithmetic independently against authoritative applicable primary sources. Preserve units, input validation, exact caps, rounding and total/bolus/infusion consistency. Recommendation logic additionally requires population, missing-data, safety and correction review; tests do not certify clinical validity.
- Keep unknown, invalid, negative, positive and reviewed states distinct. Context changes invalidate incompatible outputs while retaining entered values for reconciliation. Explicit decisions, consent, administration and procedure timestamps cannot attest one another.
- Keep explicit telephone Pulsara/video Epic templates with source-change invalidation and guarded explicit copy. No clinical persistence, context-bearing URL handoff, logs/telemetry, automatic clipboard writes, AI runtime or external core dependency.
- Run production/unit/controller/MCP/snapshot, source/citation/evidence/content/retirement/leak and asset guards. Browser tests exercise actual published candidates offline, privacy, routes, viewports/themes and opt-in update recovery. Clinical review dates change only after actual clinical review.
- Review `_config.yml` and `output/site` together: Pages currently publishes branch-root via Jekyll. New source/download roots must remain excluded; all generated modules count toward payload/offline budgets.
- Do not track node_modules, output, native build trees or generated native embedded web assets. Existing native source remains supported; `.github/workflows/main-pathguard.yml` enforces generated-output exclusions.
- Use a feature branch and ordinary PR/CI release. Never bypass the private leak-guard secret, source gate, required review or protected clinical adjudication. The 7.0 ICH drug-removal correction has explicit owner authorization recorded in docs/source-limits.md; new protected-source conflicts still require adjudication.

The exact rollback ref is `archive/pre-encounter-first-20261001-4f8e99d`. Restore through a reviewed forward commit and a new coherent app/cache version; do not force-push or reuse an old service-worker identity.
