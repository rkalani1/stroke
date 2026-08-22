# Site improvement review — 2026-08-22

**Scope:** measured assessment of the deployed app (v6.22.0) across performance,
correctness, clinical provenance, bedside UX, repository health, and reach.
Every number below was measured on this commit (`4a26b9e`), not estimated.

**Method:** production assets served locally, driven with headless Chromium
(`playwright`), `axe-core` 4.x for accessibility, `esbuild --metafile` for bundle
composition, CPU throttling at 1×/4×/6× to approximate desktop / mid-tier phone /
low-end phone.

**No code was changed.** Each item below carries the specific fix, so a reviewed
sprint can pick them up in priority order.

---

## What is already strong

These were verified, not assumed, and should be protected by any change below.

| Axis | Result |
|---|---|
| Accessibility | **0 axe violations** (WCAG 2.1 A/AA + best-practice) across 6 routes × light/dark × mobile/desktop |
| Touch targets | 1 sub-40px interactive element site-wide — the 1×1 skip link, which is correct |
| Offline | Reload with the network cut renders the full shell (509 nodes) and the offline banner |
| Tests | 1,656 passing. The 2 failures are environment-gated (Playwright browser download; network for `--check-identifiers`), not code defects |
| Content pipeline | Schema validation, citation registry, currency worklist, protocol snapshot lock, leak guard — all real gates, all in CI |

---

## P0 — Two shipped bugs, both small fixes

### 1. Every first-time visitor is told the app has an update

**Reproduced** on a clean browser profile (no service worker, no caches): the
page shows the banner *"A new version of Stroke is ready — Reload to update"*
plus a toast, on a first-ever load.

`service-worker.js:120` broadcasts `sw-update-ready` from the `activate` handler,
which fires on the **first install** as well as on upgrades:

```js
const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
for (const c of clientsList) c.postMessage({ type: 'sw-update-ready', version: APP_VERSION });
```

This is a trust cost specifically for a clinical tool: the update banner is the
one mechanism that tells a clinician the evidence they are reading has changed.
Firing it on a page the user just opened trains them to dismiss it.

**Fix.** Distinguish first install from upgrade using the cache keys already read
two lines above:

```js
const keys = await caches.keys();
const hadPrevious = keys.some(k => k !== CACHE_NAME && k.startsWith('stroke-cache-'));
await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
if (hadPrevious) { /* broadcast sw-update-ready */ }
```

### 2. "System" theme is unreachable on the public deployment

`src/design/theme.js` — `setThemePref('auto')` **deletes** the preference key,
but on `*.github.io` `getThemePref()` treats a missing key as `'light'`. Selecting
System therefore reverts to Light immediately, and the OS dark-mode preference is
never honored on the live site.

Reproduced against a simulated `rkalani1.github.io` host with OS = dark:

```
fresh public visitor, OS=dark  -> pref: light | effective: light
after choosing Dark            -> pref: dark  | stored: dark
after choosing System (auto)   -> pref: light | stored: (key deleted)
```

For a tool used on night shifts and in darkened reading rooms, dark mode is a
usability feature, not a preference.

**Fix.** Persist `'auto'` explicitly instead of deleting the key
(`safeSet(PREF_KEY, 'auto')`), and mirror that in the `index.html` pre-paint
bootstrap so there is no flash. The "unset public default = light" behavior is
preserved, because unset and explicitly-auto become different states.

---

## P1 — Performance: the largest lever, and it is regressing

### Where the app stands

| Metric | Measured | Note |
|---|---|---|
| `app.js` | 3,794,804 B raw · **888 KB gzip** | was 2.5 MB / 691 KB in the 2026-05-29 assessment — **+52% raw in ~3 months** |
| Cold load, mid-tier phone (4× CPU) | 1,300 ms to first render | 2,074 ms at 6× |
| **Guidelines route render** | **1,861 ms @4× · 3,751 ms @6×** | the slowest surface in the app |
| Guidelines route DOM | **24,961 nodes** | Lighthouse flags >1,400 |
| JS heap on that route | 91 MB @6× | |
| Search keystroke round-trip there | ~1.5 s for a 5-character burst | |
| Service worker precache | **9.26 MB across 80 entries** | paid on first visit |

### 3. 97% of the Guidelines DOM is invisible — lazy-mount the accordions

The route renders **397 `<details>` elements, every one of them closed**,
collectively holding **46,726 nested nodes**. `#research-tabpanel-guidelines`
alone is 24,811 nodes. A closed `<details>` still builds and retains all its
children, so all 862 recommendations are constructed on every visit to render a
list of ~89 collapsed headers.

**Fix.** Gate the accordion body on open state — render the summary always, mount
the body on first expand and keep it mounted:

```jsx
const [opened, setOpened] = useState(false);
<details onToggle={e => e.currentTarget.open && setOpened(true)}>
  <summary>…</summary>
  {opened && <RecommendationList …/>}
</details>
```

Search already auto-expands matching sections, so it keeps working; hits mount on
demand. This is contained to the Guideline Library render, touches no clinical
wording, and is outside the snapshot-locked `#/protocols/*` zone.

**Expected:** ~25,000 → a few hundred nodes; ~3.7 s → well under 500 ms on a
low-end phone; heap down proportionally.

### 4. Split the bundle by route — 96% of it is first-party

`esbuild --metafile`, 3.62 MB minified:

| Input | Size | Share | Needed at boot? |
|---|---|---|---|
| `src/app.jsx` | 1,486 KB | 40.1% | partly |
| `src/education.jsx` | 798 KB | 21.5% | no — `#/education` only |
| `src/evidence/*` | 414 KB | 11.2% | no — `#/trials` only |
| `src/guidelines/*.json` | 389 KB | 10.5% | no — `#/research` only |
| `content/bundle.json` | 172 KB | 4.6% | partly |
| `react-dom` | 127 KB | 3.4% | yes |
| `src/simulators/*` | 93 KB | 2.5% | no — opened explicitly |

`node_modules` is only **138 KB (3.7%)** of the payload. There is no vendor bloat
to trim; the entire win is in deferring first-party route code. Roughly **1.7 MB
(47%)** is reachable only from a route the user has not opened yet.

**Fix.** `React.lazy` + dynamic `import()` at the four route boundaries
(education, evidence/trials, guideline datasets, simulators), build with
`--splitting --format=esm`, and add the emitted chunks to `CORE_ASSETS` so
offline coverage is unchanged. The offline regression test already exists as a
gate. This is the "monolith split" the May assessment deferred — but scoped to
four import sites rather than a rewrite of `app.jsx`.

### 5. The 9.26 MB precache carries ~4.5 MB nobody reads

| Group | Size | Assessment |
|---|---|---|
| `app.js` | 3.7 MB | addressed by #4 |
| Infographic PNGs (8 files) | ~3.6 MB | 2400×1800 PNG, displayed ≤430 px wide |
| `data/*.json` | 929 KB | **the app never reads these** |
| Fonts | 441 KB | fine |

- **`data/` is dead weight in the cache.** It is the machine-readable API for
  agents and `llms.txt` consumers, generated by `scripts/generate-agent-assets.mjs`.
  Nothing under `src/` fetches it — the only runtime fetch in the whole app is
  `config.example.json` (`src/app.jsx:16518`). The guideline JSON is *also*
  compiled into `app.js`, so first-time visitors download the same guideline
  content twice. Drop these 28 entries from `CORE_ASSETS`; agents fetch the URLs
  directly and never go through the service worker.
- **6.6 MB of PNGs, none of them responsive.** Converting to WebP at ~1600 px and
  serving with `<picture>` fallback cuts roughly 5 MB with no visible change.
  `loading="lazy"` is already correctly applied at runtime — the cost is entirely
  in the precache. Consider moving infographics to a runtime cache-on-first-view
  tier so install stays lean while offline still works after a module is opened.

**Expected first-visit transfer:** ~9.3 MB → ~2.5 MB.

### 6. CI has no performance gate, which is why this regressed

`.github/workflows/lighthouse.yml` gates Accessibility ≥90 and Best Practices ≥90
as hard failures, and writes **Performance as advisory**. Between the May
assessment and today the bundle grew 52% with nothing to catch it.

**Fix.** Add a byte budget to CI — it is cheap, deterministic, and CDN-independent
in a way a Lighthouse score is not:

```
app.js gzip ≤ 1,000,000 B      (today: 909,337 — passes, blocks further drift)
precache total ≤ 4 MB          (today: 9.26 MB — set after #5 lands)
```

Fail the build on breach. Advisory Lighthouse can stay as-is.

---

## P2 — Clinical provenance: the biggest content gap

### 7. 862 recommendations carry no review date, and none is shown

`npm run content:currency` reports *"nothing stale — all guideline/trial/education
entries are current"* — but that gate covers the 11 guidelines in `/content`,
plus trials and education. It then warns:

```
⚠ 89/89 datasets lack a lastReviewed (or equivalent) field
```

Those 89 datasets hold **862 recommendations** — the largest content surface in
the app and the one clinicians read as authoritative. Scanning the rendered
Guidelines route for review language returns **zero matches**: no "last reviewed",
no "verified", no "updated". A clinician reading `Secondary Prevention 2021` has
no way to tell whether it was checked against the source last month or three years
ago.

This is the highest-value content change available, and it is metadata, not
clinical wording:

1. Add `lastReviewed` + `sourceCheckedUrl` to each `src/guidelines/*.json` header
   (they already carry `doi`, `publisherUrl`, `pdfUrl`, `pmid`).
2. Render it in the Guideline Library header — *"AIS 2026 · 195 recs · source
   verified 2026-07-14"*.
3. Promote the currency check on these datasets from a warning to the same
   18-month gate the `/content` layer already enforces.

### 8. Recommendations have no stable ids

A recommendation object is:

```json
{ "section": "…", "classOfRec": "I", "classNote": null,
  "levelOfEvidence": "B-R", "text": "…", "page": 10 }
```

No `id`. Consequences: no deep link to a single recommendation (you can link to a
guideline, not to the TNK 0.25 mg/kg statement), no durable cross-reference from
the "Why this recommendation?" drawer, and no way for a validator to assert that
a given claim still resolves to the rec it was written against. Adding a stable
`id` (e.g. `ais-2026-thrombolytic-choice-01`) unlocks all three and is a
mechanical, testable migration.

---

## P3 — Bedside UX

### 9. Less than half the phone screen is content

Measured at 390×844 on `#/trials`: `#main` begins at **y = 385**, the fixed bottom
tab bar occupies y = 771–844. Usable content window: **386 px of 844 — 46%.**

The chrome above the fold, on every route, is: brand header (152 px) → search →
a 94 px row of four external-site links (Telestroke Map, OpenEvidence, UpToDate,
Asta) → New Case → subtab bar. On `#/education` the sequence ends with a title
card that spends ~120 px rendering the words "Educational Resources" over two
lines directly beneath a tab already labelled "Educational Resources".

Suggestions, in order of payoff:

1. Move the four external links into the existing **More** menu. They are
   destinations *away* from the app and do not deserve permanent above-fold space
   on a bedside tool. (~94 px back on every route.)
2. Collapse the brand header on scroll, or merge the logo row into the search row.
3. Drop the redundant page-title cards where the active tab already names the page.

### 10. Every route has the same `<title>`

`document.title` is `"Stroke CDS Educational Demo"` on `#/encounter`,
`#/protocols/ich`, `#/research/guidelines`, `#/trials`, and
`#/education/toast-classification` alike, and `<h1>` is the brand word "Stroke"
on all of them. Three tabs open during a consult are indistinguishable; browser
history is a wall of identical entries; a shared link previews as the generic app
name rather than the card being shared.

**Fix.** Set `document.title` from the route (`Guideline Library · Stroke CDS`,
`TOAST Classification · Stroke CDS`) and promote the page heading to `<h1>` with
the brand as a `role="banner"` label.

Related: per-module deep links **do work** — `#/education/toast-classification`
resolves correctly — but they are not documented in the README's "Deep links"
section. For a teaching tool, "send the resident the MeVO card" is a headline
feature that is currently undiscoverable.

### 11. Filtering does not update the count

Typing `tenecteplase` into the Guideline Library search correctly auto-expands the
matching sections, but the header still reads **"862 recommendations"** and each
dataset still shows its unfiltered count ("AIS 2026 — 195 recs"). There is no way
to tell how many matches exist without scrolling the whole list. Show
`N matching · 862 total`, and hide datasets with zero hits.

---

## P4 — Repository and documentation health

### 12. 92% of the repository is not the app

| Path | Tracked size |
|---|---|
| `docs/perfection/screenshots/` | **143.7 MB** (120 PNGs from one 2026-05-30 audit) |
| `documents/` | **68.5 MB** (28 PDFs; largest single file 12.8 MB) |
| Everything else | ~20 MB |
| **Total tracked** | **232 MB** (`.git` is 210 MB) |

GitHub Pages serves the repository root, so all of it is published — ~23% of the
1 GB published-site limit is one audit's screenshots that no user will ever open.

Additionally, `app.js` (3.79 MB minified) and `tailwind.css` are committed build
artifacts: 56 committed revisions of `app.js` account for ~195 MB of blob content
before packing. Every content edit costs roughly a megabyte of permanent history.

**Fix, in increasing order of effort:**

1. Delete `docs/perfection/screenshots/` (a point-in-time audit record; the
   findings are already written up in `docs/perfection/final-report-2026-05-30.md`).
   Attach them to a release or an issue if they need to survive. **−144 MB.**
2. Compress the PDFs. Several are 6–13 MB Keynote exports; a linearized
   re-export typically lands 3–5× smaller, which is felt directly by anyone who
   taps one on cellular.
3. Build in CI and publish with `actions/deploy-pages` instead of committing
   `app.js`/`tailwind.css`. Stops the history growth at source.

### 13. Documentation has drifted from the code

- **README overstates the content layer.** It says updating "a guideline, trial,
  educational resource, calculator, or reference is a **data edit, not a code
  change**." True for guidelines, trials, and references. Not true for education:
  `content/education/*.md` carries metadata only and says so in its own
  frontmatter (`provenance: src/education.jsx`); the teaching content is
  **798 KB of hand-written JSX** in `src/education.jsx`, 21.5% of the bundle.
  Either say so plainly, or make the markdown body the render source.
- **`REMAINING-WORK.md`'s "clinical review queue" is stale.** It lists six
  contradictions "not applied by the refactor"; at least four are already fixed in
  the code — osmolar-gap is consistently `>20`, THALES reads 30 days, TREAT-CAD
  reads "did NOT meet non-inferiority", ICH score 4 reads 97%. A future contributor
  will either re-fix resolved issues or lose trust in the list. Re-verify and prune.
- **Deep links are under-documented** (see #10).

### 14. Two tests fail for environment reasons without saying so

`tests/adversarial-tier5-hardening.test.js` shells out to
`snapshot-example-protocols.mjs`, which needs a downloaded Playwright browser;
`tier2-boundary-corners.test.js` runs `validate-citations --check-identifiers`,
which needs outbound network. Both surface as ordinary red failures. Guard them
with a capability check (`it.skipIf(!hasBrowser)` / `it.skipIf(!hasNetwork)`) so a
contributor can tell an environment gap from a real break.

---

## P5 — Reach (strategic, optional)

### 15. Only one URL on the site is indexable

The app is hash-routed, so search engines see a single page. `sitemap.xml` lists
the root plus 14 JSON endpoints — no content pages. 862 recommendations, 130
trials, and 40 teaching modules are invisible to anyone who does not already know
the site exists.

If reach matters, a build step could emit static pages per education module and
per guideline (`/education/toast-classification/index.html`) carrying the real
content, a real `<title>`, real OG tags, and a link into the app. That is the same
generator that already produces `data/` and `llms-full.txt`, pointed at HTML. It
also fixes #10 for shared links as a side effect.

If reach is *not* a goal — a defensible position for a tool framed as a synthetic
demo — then this item should be closed explicitly rather than left open.

---

## Suggested sequence

| Order | Item | Effort | Payoff |
|---|---|---|---|
| 1 | #1 first-visit banner, #2 System theme | hours | two user-visible bugs |
| 2 | #3 lazy-mount accordions | ~half a day | 25k → hundreds of DOM nodes; slowest route becomes fast |
| 3 | #5 precache trim + WebP | ~a day | 9.3 MB → ~2.5 MB first visit |
| 4 | #6 byte budget in CI | hours | stops the next regression |
| 5 | #12.1 delete screenshots | minutes | −144 MB repo |
| 6 | #7 guideline review dates | ~a day (+ clinical sign-off) | the app's central trust signal |
| 7 | #4 route code splitting | ~a sprint, gated by the offline test | ~1.7 MB deferred |
| 8 | #9/#10/#11 UX | ~a sprint | reclaims 46% → ~65% of the phone viewport |

Items 1–5 are contained, individually revertible, and none touches clinical
wording or the snapshot-locked `#/protocols/*` zone.
