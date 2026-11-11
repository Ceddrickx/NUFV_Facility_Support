# Improved prompt: NU_G1_FACILITY report-wizard polish

## Context
I'm working on the NU Fairview Facility Support Portal (`C:\Users\offic\Downloads\NU_G1_FACILITY`) for Mr. Shelby's group project. The Report an Issue wizard should feel calmer and more polished. Next shouldn't flash green when pressed, the manual-location link should sit where its twin sits, Step 2 should follow the reference layout, and step changes should animate.

## Improved prompt (charter)
> Modify the Report an Issue wizard in `C:\Users\offic\Downloads\NU_G1_FACILITY` in six phases. Keep the site's existing tokens, icons and code style.
>
> **Phase 1: Next button press colour.** Next currently turns green when pressed. `css/components.css:2639` groups `.btn[data-nav='next']` with `.btn.success`/`.btn.go` under `--success-press`. Remove Next from that rule so it uses the darker blue `--primary-900` press, which is already the default `.btn:active` at line 2618. Submit Report and Confirm Location keep their green.
>
> **Phase 2: Move "Can't scan? Choose location manually".** In scan mode the link sits under the Confirm/Scan Again row (`js/components/qrScanner.js:42-44`, rendered via `<div class="mt-2">${swap}</div>`). Move it to the step title row, the same slot that "Scan QR code instead" uses in manual mode. Do this by making `swapHtml(st)` (qrScanner.js:98) return the manual link when `st.mode === 'scan'`, and drop `swap` from `html()`. `reportIssue.js:182` already renders `swapHtml` into `[data-scan-tools]`, and the existing `.step-head` CSS handles placement.
>
> **Phase 3: Step 2 category layout.** `drawCats()` (`js/pages/reportIssue.js:190`) currently stacks the three group boxes over a sub-grid. Change it as follows:
> - With nothing chosen, or with Something Else chosen: show the three equal boxes only. Something Else shows as selected and the wizard stays on Step 2. Remove the auto-jump `show(3, true)` at reportIssue.js:336, and the user presses Next.
> - With IT or Facility chosen: switch to a three-column layout. On the left is the chosen group box. In the middle is an "IT type" / "Facility type" heading over that group's existing categories as icon + label buttons. On the right is an "Other categories" heading over the two remaining groups, stacked. Add a "× Clear selection" text button at the right of the Step 2 title, and the hint "Click a selected option again to unselect it." under the layout. Clicking a selected subcategory unselects it. Clicking an "Other categories" group switches to that group.
> - Animate the switch between layouts: the chosen box settles to the left and the columns fade and slide in, staggered, at about 250–350ms. Respect `prefers-reduced-motion`. On mobile, the columns stack.
> - Keep all existing `data-testid`s (`cat-group-*`, `cat-*`).
>
> **Phase 4: Step transition animation.** `show(n)` (reportIssue.js:249) toggles `hidden` instantly. Give it a directional transition: Next slides the outgoing step left and fades it out while the incoming step slides in from the right, and Back does the reverse. Keep it to about 250ms with CSS classes. Make sure focus and `hidden` end up correct, and that rapid double-clicks don't leave two steps visible. Skip the animation under `prefers-reduced-motion` and on the first render.
>
> **Phase 5: Mobile "More" sheet highlight.** On mobile, tapping or hovering an item in the More sheet (for example Notifications) shows a red/pink highlight. The items are `.sheet-links a`, defined at `css/layout.css:545` and rendered by `js/components/sidebar.js:109`. Find the rule that applies the red; it is likely an inherited danger/hover/active rule. Override it so hover, focus and active use the site's blue: `--primary-100` background, `--primary-900` text and `--primary` border. Only Sign out may stay red.
>
> **Phase 6: Mobile stat-card labels.** On phones, the dashboard stat cards break "Pending", "In Progress" and "Resolved" mid-word ("Pendin/g", "Progre/ss"). The cause is the mobile `.stat` grid at `css/responsive.css:155`, `42px minmax(0,1fr) auto`, where the icon and arrow columns squeeze the label, plus an `overflow-wrap: anywhere`. Fix it so each label sits whole on one line, or wraps only between words. The ways to do that are: give the label column room (smaller icon, or tuck the arrow into a corner), set `.stat-label { overflow-wrap: normal; word-break: normal; }`, and reduce the font size slightly if needed. The card height and the two-column card grid stay the same. Check at 360px and 390px widths.
>
> **Verify:** serve the folder (`python -m http.server 8765 --bind 127.0.0.1`), then drive it with Playwright in a fresh context at desktop and 390px widths, and screenshot each phase. Check that Next presses dark blue, the manual link sits in the title row, and both Step 2 states match the references. Check that Something Else stays on Step 2, and that Next/Back animate without flicker. Run the existing responsive tests (`run-responsive-tests.cmd`). Then re-copy the site to the Cloudflare staging folder so the live link shows the changes.
>
> Guardrails: never spend money without my explicit yes. Verify each phase with a fresh-context subagent against that phase's spec. Audit progress claims against tool results; unverified = say so. Pause only for destructive actions, scope changes, or input only I can provide. Before ending a turn, check your last paragraph — plan/question/promise = do that work now.

## Decisions taken
- The subcategory buttons use the site's existing categories (Computer/Hardware, Wi-Fi/Network…), not the reference's Hardware/Software/Printer labels. Changing the data would break the chatbot and analytics.
- The reference screenshots are dark-mode mockups. Only the layout is copied, in the site's own light theme.

## Critical files
- `css/components.css` (press rules ~2618–2663, wizard ~2691+)
- `js/components/qrScanner.js` (`html`, `swapHtml`)
- `js/pages/reportIssue.js` (`drawCats`, group click handler ~326, `show`)

## Afterwards
Save this prompt next to the work as `NU_G1_FACILITY/WIZARD-POLISH-2026-10-11-PROMPT.md`, then checkpoint with commit-vault.
