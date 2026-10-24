# Design, performance, accessibility, search and PWA review — 2026-10-21 (unit: design)

Branch `worktree-agent-a827a565923edbbaf`, based on `af21b07` (7.8.0). Port 4380 (servers 4381–4389).
Headless Chromium only (Playwright, CDP throttling); axe-core 4.14.0 from a scratch install (not a
dependency). No clinical content, data, Protocols file or locked export was changed.

## 1. Scope inventory

| Area | Files | Changed? |
|---|---|---|
| Tokens, fonts | `src/design/tokens.css` | yes: 8 of 15 font faces kept; icon masks; `--update-notice-h` |
| Shell CSS | `src/design/shell.css` | yes: weight fixes, root `:has()` removed, scroll padding, Evidence, Calculators, contraindication tiers, offline and update cues, NIHSS narrow phones |
| Tailwind | `tailwind.config.js`, `src/styles.css` | config only: ramp safelist removed |
| Shell / navigation / More / search trigger | `src/app.jsx` | yes |
| Shortcut guard | `src/design/shortcuts.js` | new |
| Search | `src/components/QuickSearch.jsx`, `src/quick-search-index.js` | QuickSearch only (index verified, unchanged) |
| Evidence presentation and search | `src/Reference.jsx`, `src/reference-search.js` | yes (no data) |
| Service worker | `service-worker.js` | `CORE_ASSETS` font list only |
| Shell HTML, offline page, manifest | `index.html`, `offline.html`, `manifest.json` | yes (pre-paint theme colour, offline copy, launch colour) |
| Lint | `scripts/lint-touch-targets.mjs` | yes (Evidence route, WCAG inline exception) |
| Not changed | `src/design/theme.js`, `src/design/sw-controller.js`, `src/components/InstallAppButton.jsx`, `src/components/use-dialog-chrome.js`, `scripts/check-asset-budget.mjs` (no measurement bug found), all other JSX | — |

No markup changes were needed outside the scoped files (the Trials target fix is CSS only).

Audit coverage: 25 app states (Encounter empty, filled, ICH, validation, details open; Protocols ischemic,
ICH, expanded, ICH expanded, drug modal; Trials screener, results, tables, database, modal; Evidence
list, expanded, search; Calculators list, expanded, deep link; search open, results; More open;
retired link) × phone 390×844, tablet 820×1180, desktop 1366×900 × light and dark; screenshots also
at 1440×900 and in the system theme. Before/after screenshots (142 files):
`/tmp/claude-0/-home-user-stroke/b38f5497-67b7-50a1-b77a-d8242ff4dfbf/scratchpad/design-shots/`
(`before-*` and `after-*`, named `<viewport>-<theme>-<state>.png`; viewports phone 390, tablet 820,
desktop 1366, wide 1440). Key pairs: Evidence `*-evidence-list.png` and `*-evidence-list-full.png`
(light at all four widths, dark at 390/820/1366, system-dark at 390); Calculators `*-tools-list-full.png`, `*-tools-expanded.png`;
contraindication tiers `before-safety-desktop-{light,dark}.png` / `after-safety-desktop-{light,dark}.png`;
Encounter `*-encounter-filled.png`, `*-encounter-validation.png`; search `*-search-results.png`; More
`*-more-open.png`. No horizontal page overflow at any width.

## 2. Findings

| # | Finding (measured) | Severity | Criterion / area | Status |
|---|---|---|---|---|
| F1 | Keyboard focus landed entirely under the sticky case bar and section nav: 31 of 3,561 focus stops (Encounter desktop 14, tablet 9; Protocols desktop 8) | High | WCAG 2.4.11 (AA) | fixed: 0 of 19,047 stops |
| F2 | With the "new version" notice showing, focus landed entirely under it: phone 79 of 257 stops, tablet 2, desktop 0 | High | WCAG 2.4.11 | fixed: 0 / 0 / 0 |
| F3 | Once Calculators had been opened, every Encounter keystroke restyled the whole document (`:root:has(.case-bar)`): median keystroke 240 ms (max 328) at 4× CPU | Medium | responsiveness | fixed: 120 ms (max 152) |
| F4 | 7 of 15 font faces (224,508 B) were precached on every install although no text used them; rules asked for weights that do not ship | Medium | install size | fixed |
| F5 | Tailwind ramp safelist emitted ~23 KB; 191 classes were used nowhere | Medium | CSS budget (97%) | fixed: −12.7 KB |
| F6 | "Later" dropped a waiting update until the next 30-min/hourly re-check, so old clinical content could stay on screen without a cue | Medium | stale content | fixed: More keeps an Update marker and action |
| F7 | The update notice's live region was inserted together with its text (often not announced) | Medium | WCAG 4.1.3 robustness | fixed |
| F8 | The search dialog's late native `close` event shut a search reopened straight after Esc (2 of 8 runs on the baseline, 2 of 6 on this branch before the fix) | Low | search | fixed: 0 of 12, twice |
| F9 | A reopened search could keep the previous query in front of the first typed key (reset ran in an effect, after `showModal` focused the field) | Low | search | fixed (deterministic test) |
| F10 | Search announced nothing when results appeared; only "No matches" had a status role, on an element inserted with its text | Low | WCAG 4.1.3 | fixed: always-rendered count region |
| F11 | Targets: NIHSS score tiles 32–42 px wide at 320/375 px (48), Trials "STEP" button 42 px (3). The lint also failed 102 inline links in running text, which WCAG exempts; `lint:touch-targets` failed on the baseline (153) | Low (AA 24 px met; project rule 44 px) | WCAG 2.5.8 / project lint | fixed; lint clean |
| F12 | First Protocols visit: the quick reference arrived after the protocols and pushed them down (CLS 0.080) | Low | layout stability | fixed: CLS 0 (trade-off below) |
| F13 | Evidence: a collapsed topic showed only its title; 9 sections with no index | Medium | design | added bottom line, contents, section index |
| F14 | Calculators: each calculator a separate floating card, no grouping cue; Encounter-tool links had no direction cue | Low | design | grouped lists, arrows |
| F15 | Contraindication review: 42 selects in four tiers with no visual tiering; answered and unanswered selects looked alike | Medium | dense form | tier rules, answered emphasis (colour repeats text) |
| F16 | No in-app cue that external links need internet; `offline.html` omitted Evidence and Calculators | Low | PWA | fixed |
| F17 | Browser chrome flashed the manifest teal until app.js synced the theme; manifest launch colour was the retired warm paper | Low | PWA polish | fixed |
| F18 | axe: 2 `target-size` nodes (tablet, Encounter details open): a date-time input partly under the sticky bars at the audit's scroll position; same before and after | Info | — | not a defect at rest |
| F19 | axe "needs review" contrast (161 before, 218 after with more states): aria-hidden glyphs and kbd, elements under an open dialog or the More panel, and the Protocols gradient header | Info | WCAG 1.4.3 | triaged; gradient header pixel-checked ≥ 13.60:1, "v2" chip ≥ 6.56:1 |
| F20 | Found by the final walk, in this unit's own Evidence index: below 1024 px the index scrolls sideways, and Chrome left a focused button with 8 px in view (8 stops at 820 px) | Medium | WCAG 2.4.11 / 2.4.7 | fixed: keyboard focus scrolls the button fully into view; 0 stops |

Not fixed (outside scope or locked): see §6, §7 and "For the lead" below.

## 3. What changed and why

Commits, in order (each can be reviewed alone):

1. `unit(design): ship only the fonts and CSS the app renders` — tokens.css keeps the faces some text
   requests (display 700, mono 400/600, sans 400–700, sans italic 400); `CORE_ASSETS` precaches exactly
   that set. Rules that asked for a missing weight now name a shipped one (kbd and Esc 400, section
   numbers 600, case-bar flag 700, the empty case-bar dash in Public Sans 500). A rendered audit of every
   state found the old faces requested only by: Bricolage 500 (the empty dash, 8 nodes), Plex Mono 500
   (kbd and section numbers), Public Sans 800 (the flag, which had no face). Tailwind's ramp safelist is
   gone (no class is built at runtime; a test now fails if one is). The two `:root:has(.case-bar)`
   fallbacks are gone: CaseBar already publishes `--case-bar-h` before first paint, and the root `:has()`
   made Chrome restyle all ≈3,500 elements on each keystroke once Calculators had been opened.
2. `unit(design): focus clear of sticky bars; search, offline and update cues` — `<html data-surface>`
   (set by the shell) lets shell.css pad each surface's scrollport past its sticky bars: Chrome reveals a
   focused text field from the root scroll padding and ignores its `scroll-margin`. Margins were
   rebalanced so reveal targets land where they did (verified: quick-reference cards +8 px, protocol
   targets +104 px, as before). One tested shortcut guard (`src/design/shortcuts.js`): Ctrl/⌘K from
   anywhere except Control+K in a macOS text field; "/" never in a form control; never during IME
   composition or for a key another handler consumed. Search ignores the old dialog's late `close`
   event; the result count is announced from an always-rendered region. Offline: a status line ("Offline
   · the workspace still works; external and source links need internet"), an arrow-out marker on links
   that leave the app (outside Protocols), and `offline.html` copy that lists Evidence and Calculators
   and names the internet-only links. Updates: "Later" leaves an Update badge on More (its accessible
   name becomes "More utilities, update ready") and an "Update now · reloads and clears this session"
   action; nothing reloads unasked. Targets: Trials buttons 44 px wide; NIHSS tiles keep 44 px down to
   360 px and wrap three per line below that. The touch lint covers Evidence and applies the WCAG 2.5.8
   inline exception. `index.html` pre-paints `theme-color` in the theme's surface colour (the same
   value app.js syncs); the manifest launches on the canvas colour.
3. `unit(design): no layout shift on the first Protocols visit` — one outer Suspense boundary reveals
   the quick reference, the linked line and the protocols together (both chunks still load in parallel).
4. `unit(design): Evidence bottom lines and section index; grouped calculators` — a collapsed topic shows
   its bottom line (the summary's first sentence, verbatim; never split at decimals, abbreviations,
   initials or inside brackets; clamped to 2 lines, 3 on phones) and its contents ("N guideline
   recommendations · N study summaries"); the preview hides when the topic opens. A section index
   (buttons with counts; one sideways row below 1024 px) moves focus to each section heading (lands at
   8 px from the top, uncovered, at all four widths). Calculators read as grouped lists; contraindication
   tiers get a left rule (absolute = critical, relative = caution, correctable = accent) and recorded
   "Yes" answers stand out; the select's word carries the meaning.
5. `unit(design): update notice keeps focus clear and is announced; search reopens empty` — while the
   notice shows, the shell publishes its measured height (`--update-notice-h`, ResizeObserver) and
   shell.css pads the scrollport past it; its message is announced from an always-rendered status
   region; QuickSearch resets its query while rendering the opening, so the field is empty before
   `showModal` focuses it.
6. `unit(design): tests for the 2026-10-21 design review`.
7. `unit(design): keyboard focus brings Evidence index buttons fully into view` — in Chrome, Tab left a
   section button that was already partly in view where it was, so one with an 8 px sliver in view
   stayed clipped by the sideways index. A keyboard focus (`:focus-visible`) now scrolls the button into
   view (`nearest`), with `scroll-padding-inline` leaving room for the focus ring; a mouse click does not
   scroll, so a chip never moves under the pointer.

### Measurements (before = `af21b07` build; after = final build of this branch)

Asset budget (`npm run check:asset-budget:json`, bytes):

| Budget | Before | After | Delta | % of budget |
|---|---|---|---|---|
| Initial module graph, gzip | 127,374 | 127,816 | +442 | 97.2 → 97.5 |
| Initial module graph, raw | 375,274 | 376,838 | +1,564 | 97.5 → 97.9 |
| All offline JS, gzip | 254,900 | 255,921 | +1,021 | 97.2 → 97.6 |
| All offline JS, raw | 852,513 | 855,677 | +3,164 | 97.3 → 97.6 |
| tailwind.css | 119,694 | 106,990 | −12,704 | 97.4 → 87.1 |
| Service-worker precache | 2,335,485 (58 entries) | 2,102,366 (51 entries) | −233,119 | 96.8 → 87.2 |

The JavaScript growth (+442 B gzip on first load) is the shortcut guard, the offline line, the deferred
update marker and the notice measurement; the Evidence and search changes sit in lazy chunks. Headroom
now: stylesheet 15,890 B (was 3,186), precache 309,359 B (was 76,240).

First load and interaction script (`perf.mjs`; service workers blocked, so a first visit; baseline and
final builds run alternately, 5 runs each; median, with the run range where it matters). Profiles:
desktop 1366×900 unthrottled; phone 390×844 with 4× CPU and slow 4G (150 ms RTT, 1.6 Mbps down);
phone-cpu 390×844 with 4× CPU only.

| Metric | desktop | phone | phone-cpu |
|---|---|---|---|
| Requests | 22 → 21 | 22 → 21 | 22 → 21 |
| Transferred | 387.9 → 350.2 KB | 387.9 → 350.2 KB | 387.9 → 350.2 KB |
| FCP (= LCP) | 240 → 252 ms (216–248 / 236–292) | 1,804 → 1,920 ms (1,764–2,024 / 1,788–2,060) | 816 → 772 ms (648–936 / 724–860) |
| Total blocking time | 5 → 0 ms | 656 → 722 ms (508–708 / 674–919) | 647 → 578 ms (465–702 / 500–660) |
| Route back to Encounter | 74 → 70 ms | 469 → 250 ms (443–641 / 214–335) | 473 → 323 ms (410–721 / 279–387) |
| Layout shift after the interaction script | 0.064 → 0.064 | 0.135 → 0.084 | 0.134 → 0.083 |
| Slowest Encounter input event | 64 → 64 ms | 272 → 248 ms | 296 → 264 ms |

FCP, LCP, blocking time, script and style time moved in both directions between profiles and between
three measurement windows (13:19/13:22, 14:58/15:03 and this interleaved run), inside the run ranges,
so no first-paint speedup or slowdown is claimed. Consistent in every window: one request and 37.7 KB
fewer, a faster route back to Encounter on phones (−140 to −230 ms) and less layout shift after
interactions. The removed shift is the Protocols one (0.051 in this script); the remaining 0.084 on
phones is a ≈0.014 shift of `#workspace-main` on each scripted route switch, present before and after
(the script changes the hash without a tap, so none is excused as user-initiated; after a real tap,
shifts within 500 ms are excused). Not investigated further.

Encounter keystrokes (glucose field; Event Timing duration; phone 390×844 at 4× CPU; median of 3
sessions; baseline and final run back to back):

| Session | Before | After |
|---|---|---|
| Fresh encounter | 112 ms (max 152) | 112 ms (max 152) |
| After opening Calculators | 240 ms (max 328) | 120 ms (max 152) |
| After opening every tab | 312 ms (max 392) | 144 ms (max 168) |

A trace of 6 keystrokes after opening Calculators (4× CPU, measured after commit 1): style
recalculation 1,462 → 530 ms; whole-document recalculations 9 → 3 (the 3 left come from CaseBar, §7).

First Protocols visit (phone, slow 4G + 4× CPU, a real tap, median of 7): layout shift 0.080 → 0;
protocols panel visible 992 → 921 ms; the quick reference, which used to appear first at 646 ms, now
appears with the panel at 921 ms.

Keyboard and accessibility:

| Check | Before | After |
|---|---|---|
| Focus entirely hidden (2.4.11), Tab/Shift+Tab walk | 31 of 3,561 stops (5 states × 3 viewports) | 0 of 19,047 stops (10 states × 3 viewports, 320 steps each way) |
| Focus partly hidden (2.4.12, AAA, not required) | 124 (3.5%) | 587 (3.1%) |
| Focus without a visible indicator (2.4.7) | 0 | 0 |
| Focus entirely hidden under the update notice (phone / tablet / desktop) | 79 / 2 / 0 of 257 | 0 / 0 / 0 |
| axe WCAG 2.2 AA violations (nodes) | 2 in 138 runs (both F18) | 2 in 150 runs (the same F18 pair; 25 states × 3 viewports × 2 themes; 0 state errors) |
| `lint:touch-targets` | fail, 153 targets | clean, 24 route × viewport combos (Evidence added) |
| `lint:contrast` / `lint:tokens` | 78 pairs pass / clean | 78 pairs pass / clean |

PWA (in-process server under `/stroke/` that can be taken fully down, since Playwright's offline
emulation does not cover service-worker fetches): worker scope `/stroke/`; precache holds shell, data
and the 8 fonts; every surface by deep link opens offline, both as a fresh navigation and on reload
(11 routes × 2); a stale path (`/stroke/some/old/path`, `/stroke/encounter`) opens the app; external
links open their own tab; the shell says links need internet — 30/30 checks (baseline: 29/30, the
offline line did not exist). Update flow against a second deployment (same build, new `CACHE_NAME`): a
new version is announced without reloading, the entry stays, Later keeps the marker, Update now reloads
once into the new version and the old cache is deleted — 9/9 checks.

System theme (`system-theme.mjs`): at 390, 820, 1366 and 1440 px on Encounter, Evidence, Calculators
and Protocols, the app follows the OS scheme at load and on a live flip, the browser chrome colour
follows it (rgb(23, 39, 49) dark, white light) and nothing overflows sideways — 16/16 (screenshots
`after-<viewport>-system-{dark,light}-<surface>.png`).

## 4. Evidence ledger

No clinical claim was added, changed or removed. Rows cover the accessibility and platform behaviour this
unit relied on. w3.org, react.dev and MDN were unreachable from the container; their wording was confirmed
through secondary pages found by web search, so every W3C row is "secondary" scope.

| claim / feature | location | status (verified/corrected/added/flagged/unresolved) | source title — URL or DOI/PMID/NCT — publication date | accessed 2026-10-21, scope | supporting passage (short quote) | limitations / resolution |
|---|---|---|---|---|---|---|
| Keyboard focus must not be entirely hidden by sticky chrome | `src/design/shell.css` (scroll padding per `data-surface`, update notice), `src/app.jsx` | corrected | WCAG 2.2, SC 2.4.11 Focus Not Obscured (Minimum) — https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum — W3C Recommendation 2023-10-05 | accessed 2026-10-21; secondary (W3C unreachable; text via DAISY KB, Deque, AllAccessible summaries) | "the component is not entirely hidden due to author-created content" | Measured with an elementFromPoint walker in headless Chromium only; partly hidden focus (AAA 2.4.12) remains at ≈3% of stops |
| Scroll padding is a recognised way to keep focused content clear of fixed content | `src/design/shell.css` | verified | WCAG 2.2 Technique C43, "Using CSS scroll-padding to un-obscure content" — https://www.w3.org/WAI/WCAG22/Techniques/css/C43 — n.d. | accessed 2026-10-21; secondary (search summary) | title: "Using CSS scroll-padding to un-obscure content" | Techniques are informative; Chrome ignores `scroll-margin` when revealing a focused text field (measured), hence root padding per surface |
| Inline links in running text are exempt from the target-size minimum | `scripts/lint-touch-targets.mjs` | corrected | WCAG 2.2, SC 2.5.8 Target Size (Minimum) — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — 2023-10-05 | accessed 2026-10-21; secondary (search summary) | "Inline: The target is in a sentence or its size is otherwise constrained by the line-height of non-target text." | The project keeps its stricter 44 px rule for every other target; lead to confirm the lint policy |
| Status messages must reach assistive technology without focus | `src/components/QuickSearch.jsx`, `src/app.jsx` (`#app-update-status`, `.workspace-offline`) | corrected | WCAG 2.2, SC 4.1.3 Status Messages — https://www.w3.org/TR/WCAG22/#status-messages — 2023-10-05 | accessed 2026-10-21; secondary (search summary confirmed the normative wording) | "status messages can be programmatically determined through role or properties" | Announcement not tested with a real screen reader |
| A live region should exist, empty, before its content changes | same as above | verified | MDN, "ARIA live regions" — https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions — living document | accessed 2026-10-21; secondary (search summary of the MDN page) | "start with an empty live region, then – in a separate step – change the content" | MDN notes `role="alert"` is special-cased; `role="status"` is not |
| Contraindication tiers and answered states must not rely on colour alone | `src/design/shell.css` (`.safety-group`, answered selects) | verified | WCAG 2.2, SC 1.4.1 Use of Color — https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html — 2023-10-05 | accessed 2026-10-21; secondary (search summary) | "Color is not used as the only visual means of conveying information" | Tier legends and the select's own word (Yes / No / Not assessed) carry the meaning; colour repeats it |
| The dialog `close` event is queued, so it can arrive after a reopen | `src/components/QuickSearch.jsx` | verified (measured) | Chromium code review 2355743005 (dialog close event queued); earlier HTML draft: "Queue a task to fire a simple event named close" — https://codereview.chromium.org/2355743005 — 2016 | accessed 2026-10-21; secondary (search) plus own trace: close event 14–34 ms after `close()` | "Queue a task to fire a simple event named close" | Current WHATWG text not retrieved; the fix (ignore `close` while open) holds either way |
| Reset state while rendering the prop change, not in an effect | `src/components/QuickSearch.jsx` | verified | React docs, "You Might Not Need an Effect" (adjusting state when a prop changes) — https://react.dev/learn/you-might-not-need-an-effect — living document | accessed 2026-10-21; secondary (react.dev unreachable; search summaries) | (paraphrase) an effect that resets state renders once with the stale value first | Deterministic test reproduces the stale value without the change |
| A missing weight falls back to the nearest shipped face | `src/design/tokens.css`, `src/design/shell.css` | verified | CSS Fonts Module Level 4, §5.2 font matching — https://drafts.csswg.org/css-fonts-4/#font-style-matching — editor's draft; WPT `css/css-fonts/matching/font-weight-search-direction.html` | accessed 2026-10-21; secondary (WPT metadata via search) | (paraphrase) above 500, heavier weights are tried first, then lighter | Rendered audit: after the change no text requests a removed face; Protocols' one 900 request renders with 700, as before |

## 5. Tests added and results

`tests/design-2026-10-21.test.jsx` (27 tests). Expected values come from the stated rules, not from
the implementation: the precache list must equal the `@font-face` set; display/mono rules may ask only
for shipped weights; no root `:has()`; no colour class assembled at runtime (the regex is checked against
positive and negative samples); scroll padding ≥ the sticky bars' heights (61 px Encounter nav;
36 + 62 px Protocols bars) with reveal landings unchanged (8 + 96 px); the shortcut contract (Ctrl/⌘K,
macOS Control+K left to text fields, "/" never in controls, IME and consumed keys ignored); the search
index covers navigation, protocol sections, calculators, Evidence topics and studies, trials and
external links; `bottomLine()` against hand-written cases and every shipped topic; offline copy;
pre-paint and manifest colours equal the token values. In Chromium (bundle built from source, current
shell CSS appended so the committed stylesheet need not be regenerated): `data-surface` per route; "/"
typed into a field stays text; Ctrl+K and "/" open search; arrow keys move `aria-activedescendant`;
Enter opens; Esc then Ctrl+K inside one task reopens an empty, open dialog; collapsed topics show their
bottom line and contents; the index jump focuses the section heading near the top; at 820 px, Tab
through the sideways index leaves every focused button wholly inside the scroller; the offline line
appears and clears; with the update notice showing, the scroll padding covers the band from the notice
to the screen bottom, a 150-stop Tab walk at 390 px never lands under it, the message is in the
always-rendered status region, and Later clears the padding and leaves the More marker.

Negative controls (run, then restored): without the `close` guard the reopen test fails ("expected 0
to be 1"); without the render-time reset the field still holds "alteplase"; without the notice CSS the
padding check fails (76 < 229 px); without the index focus handler the "Stroke mechanisms" button is
left partly outside the scroller.

| Command | Result |
|---|---|
| `npx vitest run` (via `npm run test:unit`) | 113 files, 2,023 passed, 3 skipped, 0 failed (baseline 112 / 1,996 / 3) |
| `node --test tests/sw-controller.test.mjs` | 9 passed, 0 failed |
| `npm run test:protocol-source` | PASS |
| `npm run build && STROKE_PROTOCOL_LOCK_PORT=4380 npm run test:protocol-tab` | PASS, 46 fixture/sub-tab captures, on the final sources; also passed on the builds after commits 1–4 and 1–5 |
| `npm run lint:contrast` | 78 pairs pass |
| `npm run lint:tokens` | clean |
| `LINT_URL=http://127.0.0.1:4384/stroke/ npm run lint:touch-targets` | clean, 24 combos |
| `npm run check:asset-budget` | all six budgets pass (table above) |

Scratch harnesses (not committed) in `/tmp/claude-0/-home-user-stroke/b38f5497-67b7-50a1-b77a-d8242ff4dfbf/scratchpad/design/`:
`perf.mjs`, `perf-ab.mjs`, `keystroke-visited.mjs`, `trace-keystroke.mjs`, `protocols-first-visit.mjs`,
`axe-audit.mjs`, `keyboard-audit.mjs`, `fonts-audit.mjs`, `pwa-offline.mjs`, `update-flow.mjs`,
`update-banner-focus.mjs`, `search-reopen.mjs`, `search-stale-query.mjs`, `pixel-contrast.mjs`,
`index-jump-obscured.mjs`, `index-scroller-focus.mjs`, `system-theme.mjs`, with their JSON and log
outputs (for example `perf-ab-before.json` / `perf-ab-after.json`, `axe-final.json`, `kbd-final.json`).

## 6. Protocols observations (report only)

Nothing in the Protocols tab was changed; the tab lock passes unchanged. Observations for the owner:

- Reduced motion: `src/ProtectedProtocols.jsx` scrolls with `behavior: 'smooth'` on sub-tab switch
  (line 19), section jumps (line 90) and reveals (line 141). A script-requested smooth scroll ignores
  the CSS `prefers-reduced-motion` handling, so these still animate for users who asked for reduced
  motion (WCAG 2.3.3 is AAA; it is a user preference). Suggested: pick `'auto'` when
  `matchMedia('(prefers-reduced-motion: reduce)').matches`.
- One `strong` ("ICH") asks for weight 900; no 900 face ships (before or after), so it renders with the
  700 face. Cosmetic.
- The "IVT card held" banner (rendered by the shell inside the Protocols panel and recorded by the lock)
  is inserted together with its `role="status"`, the pattern fixed elsewhere in this unit. Left as is
  because it is part of the frozen panel.
- Citation links in Protocols prose are 12 px tall at 320 px. They sit in running text, so the WCAG
  2.5.8 inline exception applies; no change suggested.
- No clinical observations from this unit.

## 7. Unresolved uncertainties

- Only headless Chromium was tested. Safari and Firefox handling of focus reveal with `scroll-padding`
  and of the negative `scroll-margin` on quick-reference cards is unverified; iOS Safari matters most.
- No real screen reader was used; the live-region changes follow the MDN pattern.
- Performance numbers come from a container with CDP CPU and network throttling, 5 runs per profile;
  first-paint and blocking-time changes were within run-to-run spread, so no speedup is claimed for
  them.
- The Protocols first-visit change trades an earlier quick reference (646 ms) for no layout shift (the
  whole surface appears at 921 ms; median of 7 on a throttled phone). Reversible on its own (commit 3).
- CaseBar's own `--case-bar-h` writes on `<html>` still cause about 3 whole-document style
  recalculations per 6 Encounter keystrokes (trace after commit 1: 9 → 3; style time 1,462 → 530 ms).
  CaseBar re-publishes the height from a ResizeObserver; whether the height really changes on those
  keystrokes was not established. Skipping unchanged writes, or setting the property below the root,
  belongs in `src/components/CaseBar.jsx`, outside this unit's files.

## For the lead

1. `CACHE_NAME` must change with this release (the precache list changed); the 7.9.0 version bump does
   that.
2. Regenerate outputs (`tailwind.css`, `app.js`, chunks, `service-worker.js` generated sections).
3. Decide whether to delete the seven unreferenced font files in `assets/fonts/` (224,508 B: bricolage
   400/500/600/800, ibmplexmono 500, publicsans italic 500/600). They are no longer precached or loaded,
   but `publish:stage` still deploys them.
4. Decide on commit 3 (Protocols first-visit trade-off).
5. `404.html` still links "Tools & sources" (the surface is "Calculators"); outside this unit's files.
6. Precache still carries 368 KB of splash images; worth a look if precache headroom is needed.
7. `lint:touch-targets` now applies WCAG's inline exception; confirm that policy.
8. Tooling: the full vitest suite runs `npm run build:prod` in the working tree
   (`tests/adversarial-m4-challenger.test.js`), which leaves `.br`/`.gz` files; a later `npm run build`
   then fails `check:retirement` on stale chunk `.br`/`.gz` ("Stale generated module"). `git clean -fX
   chunks` clears it.
9. Harness note: a navigation started at the instant a service worker reports `activated` can still
   be uncontrolled in Playwright (same on the baseline); upgrade scripts should wait or open a new tab.
