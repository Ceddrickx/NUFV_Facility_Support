# Improved prompt — NU Fairview UI pass (9 phases)

## Context
Mr. Shelby is polishing the NU Fairview facility-ticketing web app (`C:\Users\offic\Documents\nu-fairview-maintenance`, vanilla HTML/CSS/JS, classic `<script defer>` files on one `window.App` namespace). This pass fixes layout, mobile, icons, interaction colours, motion, and the Report Issue flow from his screenshots. Nothing in PLAN.md defers any of this work. On approval, save this prompt as `UI-PASS-2026-10-11-PROMPT.md` in the project folder and run it as the charter.

## The rewritten prompt

> I'm working on the NU Fairview Facility Support Portal for National University Fairview. Staff and students use it to report and track campus issues on desktop and phone, so every screen has to look balanced and respond clearly to touch and click. Work through the nine phases below in order. Before each phase, open its screenshot(s) and find the code that draws that screen. Use the existing CSS tokens and components, and don't add new frameworks.
>
> **Phase 1: Desktop login spacing.** Screenshot: `Pictures\Screenshots\Screenshot 2026-10-11 111423.png`. Add space between the "Facility Support Portal" title and the edge of the login form, and between the title and the "Campus" label, so the block looks balanced. Lock the "National University" wordmark and logo to the same rendered size on every screen and aspect ratio. Use fixed or clamped sizing so the wordmark doesn't scale with the viewport.
>
> **Phase 2: Mobile login.** Screenshot: `Pictures\InfoSec Webinar Proof\download.jpg`. Space out the cramped elements so the layout uses the full height and width of a phone. Then carry the desktop "Facility Support Portal" title treatment over to the mobile layout.
>
> **Phase 3: Icons.** Find every place the "In Progress" icon appears and replace it with `Downloads\milestone (1).png`. Replace the "Resolved" icon with `Downloads\check-circle.png` only in the area shown in `Screenshot 2026-10-11 113835.png`. Don't change the icons on the status pills. Bring both icons into the project's existing icon pipeline and colour them to match the current icon set.
>
> **Phase 4: Hover and press colours.** Check every button and interactive control inside the screens, then give each one hover and pressed states that match what it does. Destructive or cancel actions use red, forward or confirm actions use green, and neutral controls change their background and text colour instead of only their border. Add the new colours as tokens. Leave the sidebar navigation alone. Write the audit as a short table in the session log.
>
> **Phase 5: Loading transition after login or signup.** After a successful login or signup, show a short branded loading animation of about 1.2–1.8 s, then reveal the dashboard with a staggered entrance. Respect `prefers-reduced-motion`.
>
> **Phase 6: Ticket progress line.** Screenshot: `Screenshot 2026-10-11 122216.png`. Colour each progress circle with its status pill colour, taken from the same token source the pills use.
>
> **Phase 7: Mobile chatbot input.** Screenshots: `InfoSec Webinar Proof\25641fad-….jpg` and `c5133821-….jpg`. On mobile, the chat input disappears behind the keyboard while the user types. Find the root cause first, for example `100vh` versus the visual viewport, or fixed positioning. Then fix it so the input stays visible above the keyboard.
>
> **Phase 8: Report Issue, category step.** Screenshot: `Screenshot 2026-10-11 123133.png`. Remove the "(Routes to IT / Facility / triage)" hints so each category shows its plain name. At the top of the step, add three option boxes styled like the Step 1 location boxes: IT, Facility, and Something Else. Choosing IT or Facility filters the issue list below to that group's categories, and the user stays in the same step. Choosing Something Else skips straight to Step 3 (Details) and routes the ticket to triage. Keep the existing routing and ticket-migration logic.
>
> **Phase 9: Report Issue, QR and Back placement.** Screenshot: `Screenshot 2026-10-11 123510.png`. Reference: `Screenshot 2026-10-11 124502.png`. Move the "Scan QR code" control and the Back button to the positions shown in the reference, and use that placement on every step of the Report Issue flow.
>
> After each phase, run the app and check the changed screens at desktop (1440×900) and phone (390×844) sizes with Playwright. Check the whole screen, not only the controls you changed. Then commit with a checkpoint message.
>
> Guardrails: never spend money without my explicit yes. Verify each phase with a fresh-context subagent against that phase's spec. Audit progress claims against tool results; unverified = say so. Pause only for destructive actions, scope changes, or input only I can provide. Before ending a turn, check your last paragraph — plan/question/promise = do that work now.

## Decisions I made (stated, not asked)
- Phase 8's third box is labelled "Something Else". The raw prompt says both "Triage" and "Something Else", and the second describes what it does.
- Phase 2: "Faculty Support Portal" is read as the desktop "Facility Support Portal" title treatment.

## Verification
Use Playwright screenshots at 1440×900 and 390×844 for every phase, plus a fresh-context subagent check against each phase's spec. For Phase 7, emulate a mobile viewport and focus the input. For Phase 8, click each of the three boxes.
