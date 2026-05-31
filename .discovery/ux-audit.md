# Stroke PWA — Visual & UX Audit (v6.0 design tokens)

**URL audited:** https://rkalani1.github.io/stroke
**Date:** 2026-05-02
**Viewports:** Phone 390×844, Tablet 1024×1366, Laptop 1440×900
**Audience:** Senior vascular neurology faculty, neurohospitalists, neurointensivists at UW/Harborview
**Console errors observed:** 0 (clean across all three viewports — site loads without runtime errors)
**Page architecture:** Hash-routed React+Tailwind PWA. Top-level routes `/encounter`, `/protocols/{ischemic|ich|sah|tia|cvt|calculators|references}`, `/trials`. Header has Search box (⌘K), Resources dropdown, New Case, More (Settings). On laptop/tablet the three top-level sections appear as a centered horizontal pill-style tablist; on phone they collapse into a fixed bottom tab bar with icons.

---

## 1. Per-viewport summary

### Laptop — 1440×900

- **Navigation pattern:** Centered horizontal pill `Encounter / Management / Trials`, with a sub-tab strip on Management (`ICH / Ischemic / SAH / TIA / CVT / Calculators / References`). Header has search + ⌘K palette, Resources dropdown, New Case, More.
- **Information density:** Low. The Encounter form, Management protocols, and Trials list all render in a single content column constrained to ~1214 px. On a 1440 px display this leaves ~110 px gutters; on a clinician's 27" attending workstation (1920 px+) the wasted horizontal space becomes severe — there is no two-column or side-rail layout.
- **Typography:** Mixed. Display headings use a serif (likely a Tailwind `font-display` / Spectral or similar), body uses a sans-serif. Heading hierarchy is generally clear.
- **Touch-target adequacy:** Not applicable on laptop, but mouse hit areas are fine.
- **Broken/empty states:** Encounter renders inline guidance ("Incomplete: Age, LKW, NIHSS…" warning, "Safety-critical: BP, Glucose, Platelets" alert) — good. Management shows "No diagnosis set. Set a working diagnosis…" — good empty-state pattern.
- **Console errors:** None. Page loads quickly and feels snappy.
- **Performance feel:** Fast. Hydration appears within ~300 ms; no observable layout shift.
- **Files:** `laptop/01b-home-viewport.png`, `laptop/02-management.png`, `laptop/05b-protocol-ischemic-viewport.png`, `laptop/06-trials.png`, `laptop/14-encounter-bottom.png`.

### Tablet — 1024×1366 (iPad Pro 11)

- **Navigation pattern:** Same horizontal pill nav as laptop. Sub-tabs on Management remain a single horizontal row at this width.
- **Information density:** Same as laptop — single column. The Patient Info & History grid drops Weight + kg/lbs toggle to two stacked rows, leaving the Sex column with empty space below it (uneven row heights).
- **Typography:** Same as laptop. Reads well on iPad.
- **Touch-target adequacy:** Buttons in the Encounter form (e.g., the vessel-occlusion ICA/M1/M2/M3 chips, "+ Aspirin" quick-adds) are 36 px tall — below the 44 px Apple Human Interface Guideline minimum. Same critique as phone.
- **Broken/empty states:** The Patient Info & History grid breaks asymmetrically (see screenshot `tablet/01-home.png`) — Sex column is short, Weight column is tall, leaving a visible gap.
- **Console errors:** None.
- **Performance feel:** Fast.
- **Files:** `tablet/01-home.png`, `tablet/02-management-ischemic.png`, `tablet/03-calculators.png`, `tablet/04-trials.png`, `tablet/05-sah.png`, `tablet/06-references.png`.

### Phone — 390×844 (iPhone 15-class)

- **Navigation pattern:** Top header with logo + ⌘K search + Resources/New Case/More (3 buttons squeezed onto one row). Bottom fixed tab bar (`Encounter / Management / Trials`, height 58 px, full width) replaces the top pills. The desktop horizontal `tablist` is hidden but still present in DOM.
- **Information density:** Reasonable for the form — most fields are single-column. Sub-tab strips on Management wrap into 2 messy rows (4-up then 3-up with justified spacing — see `phone/03-management-ischemic.png`).
- **Typography:** "Stroke" wordmark in the header is huge (~36–40 px serif) and dominates ~15% of the viewport above the fold. Body text is mostly 14 px — readable but tight.
- **Touch-target adequacy:** **Failing.** 18 of 38 buttons on the Encounter screen are under 44×44 — vessel chips, quick-add chips, "Now" button, dose chips are all 36 px tall.
- **Broken/empty states:** Resources dropdown opens and is **clipped offscreen to the LEFT** — only the right edge of "...spitals" and "...ke center coverage map" is visible (`phone/11-resources-menu.png`). Most of the menu is unreachable.
- **Inputs trigger iOS auto-zoom:** 35 of 46 inputs on the Encounter form are 14 px — below the 16 px iOS threshold that prevents Safari from zooming on focus. Every tap on a text/select field will pan/zoom the page.
- **Console errors:** None.
- **Performance feel:** Fast. PWA shell loads instantly on subsequent navigations.
- **Files:** `phone/01-home.png`, `phone/01b-home-fullpage.png`, `phone/02-encounter-scrolled.png`, `phone/02b-scrolled-mid.png`, `phone/03-management-ischemic.png`, `phone/05-calculators.png`, `phone/08-calc-aspects.png`, `phone/09-cmdk.png`, `phone/11-resources-menu.png`, `phone/12-trials.png`, `phone/14-trial-expanded.png`, `phone/15-nihss-calc.png`.

---

## 2. Cross-cutting issues (all viewports)

1. **Resources `<details>` dropdown sticks open across route changes.** Clicking Resources on `/trials`, then navigating to `/protocols/ischemic`, leaves the dropdown visible over the new page (see `laptop/13-dark-toggled-back.png` and `phone/12-trials.png`). The summary/details element is not closed on navigation. The More menu and Resources menu also can both be open simultaneously and overlap (`laptop/10-more-menu.png`).
2. **Dark-mode tokens are partially wired.** Toggling dark mode (`laptop/12-dark-mode.png`): the page background goes dark, but the "Stroke" wordmark, "Resources" label, and parts of the header banner remain light/near-white-on-white (illegible). The More menu dropdown panel itself stays in light mode while the page is dark — clear token-coverage gap. The recently shipped v6.0 design-token repaint has NOT been propagated to these surfaces.
3. **Single-column layout is reused at every breakpoint.** Encounter, Management, References, Trials all render as one column even on 1440 px+ laptops. There is no two-pane layout (e.g., navigation/content), no sticky handoff sidebar, no calculator-list-as-grid. Senior attendings will scroll thousands of pixels on a workstation with ample horizontal real estate.
4. **No sticky header.** When a clinician scrolls into the Encounter form, the top header (search, ⌘K, Resources, New Case, More) disappears entirely. The only persistent control on phone is the bottom tab bar; on laptop nothing is sticky. Search and "Generate Auto-Note" both require scrolling back up.
5. **Color-coded calculator/protocol cards lack a documented legend.** Calculators list (`laptop/03-calculators-list.png`) uses red, blue, green, yellow, purple, orange backgrounds for different categories (ICH-related, ASPECTS, mTICI, antiplatelet, etc.) — but there is a "COR/LOE Reference Legend" link buried at the very bottom and no inline key. Color also doubles as semantic state on the trial pills (Recommended/Reasonable/May be considered/Benefit unclear) — works for sighted users with color vision but doubles up meaning.
6. **Iconography is inconsistent.** Phone Consult uses an outline phone icon, Video Telestroke uses a lightning bolt, the trials tab uses a flask, the calculators sub-tab is text-only, the references list uses mixed glyphs (eye, book, gavel-style "i" badges). No unified stroke-weight or family — a hand-drawn-looking "i" badge sits next to crisp Lucide-style icons.
7. **Color-only state on chips.** Vessel-occlusion chips (ICA/M1/M2/M3/M4/A1/A2/P1/P2/Basilar/None) use background color to indicate selection. Touch chip is also outlined when active. Reasonable, but for color-blind users the contrast between selected (filled) and unselected (outlined) is the only signal — no checkmark.
8. **The "i" / "I" / "II" / "IIa" / "III" Class-of-Recommendation badges use red/green/yellow only.** A red "III" pill ("Do NOT target SBP <140 post-EVT", `tablet/02-management-ischemic.png`) and green "I" pills are differentiated only by hue. WCAG AA pass for hue contrast probably OK but text-on-color readability is borderline; deuteranopia would lose the I-vs-III distinction.
9. **Time pickers and date pickers use the native `<input type=date|time>` rendering.** Result: on laptop they show "mm/dd/yyyy" placeholder; when blurred/empty they sometimes display literal "mm/dd/yyyy, --:--" text inside the field on phone (`phone/02b-scrolled-mid.png`, Anticoag Last Dose). Inconsistent appearance vs. all other styled inputs.
10. **No keyboard shortcuts beyond ⌘K.** Despite the senior-clinician audience, there are no shortcuts for "next required field", "open NIHSS panel", "copy note", "switch to Trials" outside the palette itself. The ⌘K palette exposes commands like `nihss 12`, `wt 80`, `lkw now`, but these are typed strings not bindings.
11. **The active sub-tab in Management uses a black pill (`Calculators`) while the parent tab uses bright blue.** Two different selection visual languages within 30 px of each other (`laptop/03-calculators-list.png`). Inconsistent.
12. **Recommendations textarea has no character/word counter and the "Generate Auto-Note" button has no loading state visible** (would only be observable while clicked). Worth verifying — on slow networks the user may double-click.

---

## 3. Phone-specific issues (≥8)

1. **Resources dropdown is clipped offscreen.** `phone/11-resources-menu.png`. Items render to the LEFT of the trigger, off the viewport — half the menu is unreachable. Critical bug.
2. **35 of 46 form inputs are 14 px font-size,** triggering iOS Safari auto-zoom on every focus. Encounter consult on an iPhone becomes a constant pinch/zoom dance.
3. **18 of 38 buttons on Encounter are under 44×44.** "Now", "Dose now", ">48h ago", "Unknown", "+ Aspirin", "+ Clopidogrel", "+ Warfarin", "+ Apixaban", "ICA", "M1", "M2", "M3" — all 36 px tall. Fails Apple HIG and WCAG 2.5.5 (AAA).
4. **Header consumes ~30% of viewport before any content.** Logo + giant "Stroke" wordmark + search + 3 button row = ~210 px on a 844 px screen. The "Phone Consult" tab strip starts ~250 px down (`phone/01-home.png`). On a 5.4" iPhone in landscape mode this will be unusable.
5. **No sticky header.** Once the user scrolls down to the NIHSS section they cannot search, switch tabs (other than the bottom bar's three top-level), open Resources, generate a note, or copy. The "Copy Note" / "Generate Auto-Note" buttons live ~3500 px down the page.
6. **Sub-tab strip on Management wraps into 2 rows of 4+3 with justified spacing,** producing visually jagged whitespace (`phone/03-management-ischemic.png`). The active tab indicator (black pill on `Ischemic`) looks like a different design system from the bottom-bar blue active state.
7. **Bottom tab bar buttons are 125×58 px** — meet the touch-target floor — but the icons (waveform / library bars / flask) are a) ambiguous (a flask = trials? library bars = management?), and b) not labeled until you look closely. New users will mis-tap.
8. **Patient Info & History grid breaks** — Sex column is short (~80 px) while Weight column is ~160 px because the kg/lbs toggle wraps above its input. The Estimated checkbox floats below Weight in white space. Visually disorganized (`phone/02b-scrolled-mid.png`).
9. **`mm/dd/yyyy, --:--` literal text appears in the Anticoag Last Dose field on phone** (`phone/02b-scrolled-mid.png`). Comma+placeholder text is being rendered as plain visible characters — an iOS Safari rendering quirk that needs an explicit `text-indent` or styled custom datepicker.
10. **One-thumb reachability:** the Settings/More button is in the upper-right corner of a 390 px-wide screen — outside the natural thumb arc on iPhone Pro / Pro Max in right-handed grip. New Case (also top-right) is the most-used "reset" action. Bottom-bar is reachable but has only 3 of the ~12 most-frequent actions.
11. **Bottom tab bar content overlap on first paint:** without a content padding-bottom equal to the tab bar height, the lower 60 px of the document hides the last few characters of long fields (e.g., "Last Known Well" date on `phone/01-home.png` shows "mm/dd/yyyy" cut at the baseline). The container does have `pb-20 sm:pb-8` per evaluated DOM, but it appears the padding may not always be enough on shorter forms.
12. **Cmd+K palette anchored to the search input,** producing a long vertical menu that occupies ~80% of the viewport with the bottom of the list cut off (`phone/09-cmdk.png`). Modal pattern should be a centered overlay on phone.
13. **Header search is 14 px and only ~120 px wide on phone,** showing only "Search trials, t..." truncated. Either move to icon-only on phone or expand.
14. **"Light mode" toggle label is paradoxical when light mode is active.** On phone, opening the More menu in light mode shows "Light mode" with the toggle ON (`phone/10-more-menu.png`) — should say "Dark mode" with toggle OFF, or be a clearer "Theme" radio.
15. **Trial card inline expand drawer ⌃ button collides with bottom of card.** When SISTER expands (`phone/14-trial-expanded.png`) the bullet markers (▸) in Key Takeaways render as floating orphan glyphs at top of each row — text starts on a new line, leaving the marker stranded.
16. **No swipe gestures** between Encounter/Management/Trials — phone users expect horizontal swipe between bottom-tab sections; here the only entry is taps.

---

## 4. Tablet-specific issues (≥5)

1. **Sub-tab strip uses tablet width inefficiently.** `tablet/02-management-ischemic.png` — `ICH / Ischemic / SAH / TIA / CVT / Calculators / References` fits on one row but the row is left-aligned in a wide container with empty whitespace; could host an action area (e.g., "Set diagnosis", "Search this protocol") on the right.
2. **Patient Info & History grid breaks on tablet too.** `tablet/01-home.png` — Sex column ends short, Estimated checkbox floats below Weight; same root issue as phone but with more breathing room making it look more deliberate / sloppy.
3. **References list is single-column when it should be 2- or 3-column on iPad.** `tablet/06-references.png` shows 16 guideline cards each spanning the full 950 px content width. Each card holds only a title + count. Trivially gridable.
4. **Trial cards waste horizontal space.** `tablet/04-trials.png` — Each trial card holds title + 2-line description + one badge + a "View on ClinicalTrials.gov" button on the right. The right pane is ~200 px and the left pane is ~700 px; could be a 2-column tile grid.
5. **No iPad-specific affordances.** Apple Pencil scribble support, Stage Manager / Slide Over compatibility, hover pen states on the calculator chips — none observable. Standard web fare.
6. **Touch targets on Encounter are 36 px** — same issue as phone; iPads also use touch primarily.
7. **Bottom tab bar is hidden on tablet** (the desktop top pills are shown instead), losing the always-visible nav anchor. A clinician scrolling the SAH protocol on a tablet has no persistent nav.

---

## 5. Laptop-specific issues (≥5)

1. **Severe under-utilization of horizontal space.** Content is locked to `max-w-7xl` (~1280 px) and there's no two-column workstation layout. A 1440 px laptop has 160 px margins on each side; a 1920 px monitor has 320 px margins. The Encounter form would benefit from a sticky right rail showing handoff summary while user fills the form.
2. **No keyboard navigation between top tabs.** Pressing Tab focuses individual fields; arrow keys don't cycle between Encounter/Management/Trials (standard ARIA tablist behavior expects ←/→). Senior attendings expect arrow nav inside a tablist.
3. **Cmd+K palette is anchored to the header search input,** not centered as a modal. On a 1440 px display the palette is in the upper-right corner — visually disconnected from the user's reading focus. Modern command palettes (Linear, Slack, GitHub) center.
4. **No visible keyboard shortcut hints.** The header shows ⌘K but does not show shortcuts for actions inside the palette (e.g., Enter, ↑/↓, Esc). Power users won't know they can jump to "next required" without trying.
5. **Encounter form has no in-page TOC / scrollspy.** Each section (Patient Info, NIHSS, Vitals, Imaging, Diagnosis, Recommendations, Note, Handoff) is just a heading — on a 1440 px screen that's 5+ screenfuls. The Management page has a "Jump to Section" pill rail; Encounter does not.
6. **No Generate Auto-Note progress / loading affordance** visible. With internet round-trip or LLM call, a clinician will wonder if the click registered.
7. **Settings/More menu does not align with Resources dropdown when both open** (`laptop/10-more-menu.png`). Both panels render at slightly different y-positions, overlapping awkwardly.
8. **The fixed-pixel banner above Management ("No diagnosis set…") is ~80 px tall** and persists until a diagnosis is chosen — eating prime above-the-fold real estate even after the user has navigated to Calculators or References (where the banner is less actionable).

---

## 6. Screen-by-screen findings

### Encounter — laptop (`laptop/01b-home-viewport.png`, `laptop/14-encounter-bottom.png`)
- The "Phone Consult / Video Telestroke" sub-tabs duplicate the top tab pattern visually, creating a nested-tab impression. Phone Consult is filled blue, Video Telestroke ghost — selection state is clear.
- The "Step 01 · Capture · Telephone Consult" header with serif "Telephone Consult" is editorially nice but visually competes with the page H1.
- The "Last Known Well" yellow card and "Anticoagulation Status" yellow card use the same warning hue as the form completeness warning — overloads "yellow = caution".
- Quick-action chips (`+ Aspirin`, `+ Clopidogrel`, `+ Warfarin`, `+ Apixaban`) are useful but only 4 — what about commonly recurring meds (statins, clopidogrel, aspirin+clopidogrel, etc.)?
- The "Generate Auto-Note" CTA is positioned far from the consult-note textarea, requiring scroll/eye traverse. Could be a sticky FAB.
- "Incomplete: …" and "Safety-critical: …" warnings are inline yellow/red banners — clear but they live just above the note, which means the user has scrolled past every empty field before seeing the warning.

### Encounter — phone (`phone/01-home.png`, `phone/02b-scrolled-mid.png`)
- "Stroke" wordmark + logo eats top 90 px before the search bar.
- Phone Consult / Video Telestroke side-by-side at full width; selection is clear.
- "Calling Site" select with placeholder "-- Select Site --" is the only one with a soft yellow hover-like background — visually noisy.
- "Last Known Well" yellow card with `Now` button (only 44×36) — the Now button is the most-used action; should be a primary button, not an outlined small chip.
- Med chips wrap awkwardly: `+ Aspirin / + Clopidogrel / + Warfarin` on row 1, `+ Apixaban` alone on row 2 spanning full width.

### Management → Ischemic protocol — all viewports (`laptop/05-protocol-ischemic.png`, `tablet/02-management-ischemic.png`, `phone/04-management-evt.png`)
- "Jump to Section" pill rail is a nice anchor TOC, but the pills lose context — no current-section indicator while scrolling.
- "KEY PRINCIPLES" with green I / red III badges is effective.
- "EVT Eligibility — Quick Reference" card is well-organized: time-window → ASPECTS+mRS → recommendation strength chip.
- The recommendation chips use background tint: green = Recommended, light-green = Reasonable, light-yellow = May be considered, gray-outline = Benefit unclear / Individualized — but `Very select cases` (yellow) and `May be considered` (yellow) collide.
- Headings inside each EVT subsection (LVO, Basilar Artery, Carotid, etc.) use thin colored left rules — creates a vertical rhythm but on phone the rules sometimes appear on the wrong row due to wrap.

### Management → Calculators (`laptop/03-calculators-list.png`, `laptop/04-calculator-aspects-open.png`, `phone/05-calculators.png` → `phone/08-calc-aspects.png`)
- Top-of-list "Late-Window EVT Eligibility (DAWN-DEFUSE-3)" inline form with Age/NIHSS/Core/Penumbra/LKW is the best single feature — power-user-grade.
- Calculator filter chips (NIHSS / ICH / TIA / Dosing / CrCl / SAH) are uncolored; pinning to the filter mechanism would be clearer.
- ASPECTS interactive grid (10 brain regions clickable) is well-implemented; on phone it goes 2-column. The `Score: 10/10` and `Favorable for EVT` results render in green with good prominence.
- Many calculators are color-tinted by category (red = ICH-related, blue = ASPECTS family, green = mTICI, yellow = thrombolysis risk, purple = DRAGON, etc.) — but no inline legend.

### Trials — all viewports (`laptop/06-trials.png`, `laptop/07-trial-expanded.png`, `phone/12b-trials-clean.png`, `phone/14-trial-expanded.png`)
- Best-designed surface in the app. Cards are clear, expand drawer with Inclusion: 13 / Exclusion: 33 chips + "Show remaining…" is excellent.
- "Recruiting only" checkbox + "Expand Visible" / "Collapse Visible" are useful power-user controls.
- Color-coded left bar on each trial card maps to phase or category (blue, purple, gray, green) — but the mapping isn't documented.
- Phone version stacks the condition-filter buttons unevenly: Ischemic (full width) → ICH (full width) → Rehab+CADASIL (half each). Looks unintentional.

### References (`laptop/11-references.png`, `tablet/06-references.png`)
- Long single-column list; each row is a guideline name + recommendation count (e.g., "AIS 2026 — 191 recs"). The actual recommendations are presumably one click away (not exercised in this audit).
- Quick-tag pills along the top (Major Stroke Trials, Guideline Recommendations, HINTS Exam, CVT, Prognosis, Imaging F/U, Mimics DDx, Chameleons, Spinal Cord, CTP Guide, Admission Orders, Guidelines) — the active filter is unclear from the screenshot.
- 16 guideline rows each take a full row; on tablet/laptop a multi-column grid would halve scroll length.

### Cmd+K palette (`laptop/08-cmdk-search.png`, `phone/09-cmdk.png`)
- Categorized into NAVIGATION / DATA ENTRY / COPY / EXPORT — well-structured.
- Power-user commands like `dx ischemic`, `nihss 12`, `wt 80`, `lkw now`, `copy pulsara` — extremely strong feature.
- Keyboard hint shows the command-name in monospace blue, which is good.
- Anchored to the search box (not centered modal) — reads as autocomplete rather than command launcher; on phone the panel is awkward.

### Resources & More menus (`laptop/09-resources-dropdown.png`, `laptop/10-more-menu.png`, `phone/10-more-menu.png`, `phone/11-resources-menu.png`)
- Resources: ChatGPT, OpenEvidence, UpToDate, Asta (Ai2), Regional Hospitals — sensible curated external links.
- More menu: Export to PDF, Export as JSON, Share, Light/Dark mode toggle, Clear all data — useful PWA-grade controls.
- The two menus can be open simultaneously (overlap bug).
- On phone the Resources menu clips to the left edge.

### Dark mode (`laptop/12-dark-mode.png`)
- Page bg → `slate-900`-ish, content cards → near-black, text → near-white. Generally readable.
- BUT: header banner at the top retains a light strip / the "Stroke" wordmark is dark on dark, "Resources" label is invisible. The More menu dropdown panel itself is in light mode (light-bg dark-text) inside a dark page — token mismatch.
- Encounter "Step 01 · Capture · Telephone Consult" yellow accent line is very faint in dark mode; the yellow on yellow card disappears.

---

## 7. Aesthetic critique

### Color
- Primary blue (~`indigo-600` / `blue-600`) for active selections, primary CTA. Reasonable.
- Secondary palette is heavy on tinted backgrounds: pale red (ICH), pale blue (ASPECTS), pale green (mTICI), pale yellow (warning), pale purple (DRAGON, Atherosclerotic), pale orange (Antiplatelet). On laptop it produces a "rainbow" feel reminiscent of MDCalc / UpToDate — not unprofessional but visually busy at the calculators-list level.
- WCAG concerns: red `III` badge text on red-100 ground may be borderline AA. Yellow "May be considered" pill on light-yellow ground is similar.
- Dark mode tokens cover bg + text but miss header chrome and dropdown menus — the v6.0 repaint did not reach those surfaces.

### Contrast
- Body text (slate-700-ish on white) is fine.
- Subtitle / placeholder text (`slate-400`-ish) like "Reference for active clinical trials" or section captions may be borderline 4.5:1.
- "MANAGEMENT > CALCULATORS" breadcrumb in upper-case tracking-wide gray-on-tan is faint and easy to miss.
- "i" / "I" / "II" / "IIa" / "III" recommendation badges: white text on saturated color backgrounds — passes contrast but the tiny font size (~10 px) hurts legibility.

### Typography hierarchy
- Strong: Section H4 ("Patient Info & History", "NIHSS Examination") in deep navy bold, distinct from body.
- Inconsistent: page titles use serif display ("Telephone Consult", "Clinical Trials"), card titles use sans-serif bold, sub-section eyebrows ("STEP 01 · CAPTURE", "MANAGEMENT > CALCULATORS") use uppercase tracking-wide. Three competing voices on one screen.
- The serif "Stroke" wordmark in the header is a brand element but its outsized rendering at 36–40 px on phone is excessive.

### Iconography consistency
- Mix of Lucide-like outline icons (square box with arrow for external link, gear for settings, calendar for date) and what look like custom emoji or small graphics for the bottom tab bar (waveform/library/flask). Stroke weights differ.
- Recommendation badges ("i" "I" "II" "III") look hand-set, not aligned with any icon family.
- The "Stroke" logo (small blue square with a pulse waveform inside) is fine but the pulse is decorative, not branded.

### White-space rhythm
- Vertical rhythm between cards is generous (~24–32 px gaps) — comfortable reading on laptop.
- On phone the rhythm collapses; cards have ~16 px gaps but the giant header eats the gain.
- Inside cards: padding is consistent (~24 px) but the form field gaps inside Patient Info shrink to ~8 px and feel cramped vs the outer card padding.

### Button styling consistency
- Primary CTA: filled blue (e.g., "New Case", "Set diagnosis", "Generate Auto-Note", "Copy Note", "View Full Details on ClinicalTrials.gov") — consistent.
- Secondary: outlined ghost with blue text ("Resources", "More", "Expand Visible", "Collapse Visible", "Copy handoff") — mostly consistent, but "Copy handoff" is solid black-on-white where others are blue text.
- Tertiary chips: rounded pill, light-bg color text — used for med quick-add, vessel chips, sub-tab nav, jump-to-section. The visual treatment varies (filled vs outlined vs tinted).
- Tab pills: top tab is filled blue when active; sub-tab is filled black when active; bottom tab is text+icon with blue active color. Three different active treatments for three different navigation primitives.

### Where the v6.0 design tokens are vs aren't applied
- **Applied:** Body backgrounds, card surfaces, primary CTA, body text, base type ramp.
- **Not applied:** Header chrome (`Stroke` wordmark, "Resources" / "More" labels — break in dark mode), Resources dropdown panel (dark mode), More menu panel (dark mode), some calculator color tints (raw HSL values rather than token references), recommendation badges (raw red/green/yellow), trial card left rule colors (raw indigo/purple/gray), bottom tab bar icons (custom not tokenized).

---

## 8. Recommendations

### Quick Win (≤1 day each)
- **QW1 — Bump form input font-size to 16 px on phone** to stop iOS auto-zoom. `[type=text],[type=number],select,textarea { font-size: max(16px, var(--input-fs)); }` (or just hard-code `text-base`). Affects ~35 inputs. Files: `phone/02b-scrolled-mid.png`.
- **QW2 — Add `min-h-[44px] min-w-[44px]` to all form chips** (vessel buttons, dose chips, quick-add chips, "Now"). Affects ~18 buttons. Reference: WCAG 2.5.5 / Apple HIG.
- **QW3 — Close `<details>` dropdowns on route change.** Hook into the router's `useEffect` or `popstate` and run `document.querySelectorAll('details[open]').forEach(d => d.open = false)`. Fixes Resources-sticks-open bug.
- **QW4 — Constrain Resources dropdown menu to viewport on phone.** Add `right-0 md:right-auto md:left-0` (or use a popover lib like Radix that handles flipping). Fixes `phone/11-resources-menu.png`.
- **QW5 — Sticky header on laptop and tablet.** `position: sticky; top: 0; z-index: 40; background: var(--surface-1); backdrop-filter: blur(8px);` on the `<banner>` element. Phone keeps the bottom tab bar.
- **QW6 — Center the Cmd+K palette.** Move it from anchor-to-search to a centered modal at 600 px wide on laptop, full-width sheet on phone. Add Esc-to-close, Enter-to-execute, ↑/↓ navigation hints in the empty state.
- **QW7 — Fix dark-mode header chrome.** Add `dark:text-white dark:bg-slate-900` to the banner, "Stroke" wordmark, Resources/More buttons. Apply tokens to dropdown panels (`dark:bg-slate-800 dark:border-slate-700`).
- **QW8 — Fix "Light mode" toggle copy.** Use a single `Theme: Light | Dark | System` segmented control or label the toggle with the *target* state ("Switch to Dark mode") not the current.
- **QW9 — Document the calculator color legend inline** (chip strip at top of Calculators tab: red dot = ICH, blue = ASPECTS, green = post-EVT, yellow = thrombolysis risk, purple = DRAGON, etc.).
- **QW10 — Reduce header height on phone.** Drop "Stroke" wordmark to 22–24 px, move Resources/New Case/More into a single overflow `…` icon button. Saves ~80 px above the fold.
- **QW11 — Add `pb-32` to phone main scroller** so the last form field is never hidden under the bottom tab bar.
- **QW12 — Add ARIA arrow-key navigation to the top tablist.** Standard ARIA pattern; small effort, big keyboard-power-user win.

### Redesign (sprint-sized)
- **RD1 — Two-pane Encounter on laptop/tablet ≥1024 px.** Left ~720 px form column, right ~360 px sticky panel showing live Handoff Summary + Generate Auto-Note + Copy Note + Incomplete/Safety alerts. Removes ~1500 px of scroll on the most-used surface.
- **RD2 — In-page TOC / scrollspy on Encounter (mirrors Management's "Jump to Section").** Sticky left rail showing Patient Info → NIHSS → Vitals → Imaging → Diagnosis → Recommendations → Note, with active highlight as user scrolls.
- **RD3 — References as a multi-column tile grid on tablet/laptop.** 2 cols at 1024 px, 3 at 1440 px. Each tile shows the guideline + count + first 1-2 high-yield bullets.
- **RD4 — Phone bottom tab bar with labels always visible** + add a 4th "Search" / "Cmd-K equivalent" pill so search is reachable at the bottom (one-thumb).
- **RD5 — Responsive trial list:** on laptop/tablet, switch from full-width cards to a 2-column tile grid; the expand drawer becomes an inline modal (not a card extension), preserving column rhythm.
- **RD6 — Replace the duplicate "Phone Consult / Video Telestroke" tab with a small toggle near the top** of the Encounter form (or a context selector) — frees a layer of nesting.
- **RD7 — Standardize tab/sub-tab/bottom-tab active states.** One token (e.g., `--accent-active-bg`, `--accent-active-fg`) used in all three, varying only in shape.
- **RD8 — Replace bottom-tab icons with universally recognized ones** (e.g., clipboard for Encounter, list-checks for Management, microscope/beaker is OK for Trials but pair with stronger labels).

### Defer
- **DEF1 — Add Apple Pencil / Stage Manager support on iPad** (low ROI for primary phone-call use case).
- **DEF2 — Custom date/time picker** to replace native `<input type=date>` quirks. Native is acceptable; only fix the `mm/dd/yyyy, --:--` literal-text bug if it persists.
- **DEF3 — Swipe gestures between phone tabs.** Nice-to-have.
- **DEF4 — Server-side rendering for SEO.** PWA target audience is bookmarked clinicians; SSR is not the bottleneck.
- **DEF5 — Animated state transitions on calculator cards.** Decorative; defer.

---

## Issue count summary

- Cross-cutting issues: 12
- Phone-specific issues: 16
- Tablet-specific issues: 7
- Laptop-specific issues: 8
- Per-screen findings: 20+ specific observations across 7 screen groups

**Total distinct issues catalogued: ~50+**, comfortably above the 30 target.
