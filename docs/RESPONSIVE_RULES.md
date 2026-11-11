# Responsive rules for NU_G1_FACILITY

For the two of us who edit the UI. Goal: the layout looks right on a laptop, an ultrawide monitor, a tablet, a phone and the school TV, and one person's fix never breaks the other's screen.

## 1. Before you send files (do this every time)

1. Close the browser tab you were testing in, then double-click `run-responsive-tests.cmd` (project root).
   - Or in a terminal: `cd tests\responsive` then `node run.mjs`
   - First run installs the test tool once (needs internet, free). Needs Node 18 or newer.
2. Wait for the final box. You need **both** lines to say PASS:
   - `Content freeze : PASS` means no text, label, number, icon or button changed.
   - `Layout checks  : PASS` means no sideways scrolling, no clipped table buttons, no wasted space on wide screens.
3. If it says FAIL, open `tests\responsive\out\current\REPORT.md` and the pictures in `tests\responsive\shots\current\`. Fix it, run again.
4. Only then send the files.

Bigger runs when you changed shared CSS (variables, layout, base): `node run.mjs --full` (16 screen sizes) or `node run.mjs --all` (adds Firefox and Safari engine).

If you **meant** to change text or content, update the baseline afterwards with `node content.mjs baseline` (both of you agree first).

## 2. The rules

**Never hard-code these:**
- Widths, heights or margins for a whole page or card in `px` (use `%`, `rem`, `min()`, `max()`, `clamp()`, grid `fr`/`minmax`).
- `100vh` alone: write `min-height: 100vh; min-height: 100dvh;` (the second line wins on phones with toolbars).
- `100vw` for sizes: it includes the scrollbar and causes sideways scrolling on Windows. Use `100%`.
- A font that is not in `assets/fonts` (the page uses Inter via `var(--font)`). Fonts loaded from the internet disappear on a school network.
- A new `@media` number. Use only the breakpoints below.
- Hover-only behaviour. The TV and touch screens have no hover.

**Always:**
- Put `min-width: 0` on grid or flex children that hold long text or tables.
- Wrap wide tables in `.table-wrap` so they scroll inside their card, never the page.
- Use the spacing tokens (`--s1` ... `--s8`), radius tokens (`--r-*`) and type tokens (`--fs-*`). They are `rem`, so they grow together on big screens.
- Keep touch controls at least 44px tall (`var(--tap-min)`).

## 3. Where things live (single source of truth)

`css/variables.css` holds the tokens:
- **Breakpoints** (only these may appear in a media query): 360, 480, 640, 768, 1024, 1200, 1920, 2560. A `max-width` query uses the number minus 1 (`max-width: 767px`). Container queries (`@container`) are separate and based on the component's own width.
- `--content-max` (150rem): widest the page content grows. Wider screens get more columns, not stretched cards.
- `--safe-x`: TV-safe side margin (0 below 1920px, 2.5vw at 1920px and up).
- `--tap-min` (44px), `--sidebar-w`, `--rail-w`, `--topbar-h`, `--w-narrow`, `--w-detail` (all `rem`).

`css/base.css` sets the fluid root size: 16px on laptops, scaling up from about 1700px wide (18px at 1080p, about 24px on a 3440x1440 ultrawide, about 36px on a 4K screen at 100%). Because everything is `rem`, the whole page scales together.

Put new responsive rules in `css/responsive.css` (the "Responsive foundations" block at the bottom) unless they belong to one component.

## 4. "It still looks broken on his screen": ask these first

1. Screen resolution (Windows Settings > System > Display).
2. Windows scaling percentage (100%, 125%, 150%). A 1920x1080 screen at 125% behaves like 1536x864.
3. Browser and exact version (Edge/Chrome/Firefox: three-dot menu > About).
4. Browser zoom (Ctrl+0 resets it to 100%).
5. Window size: maximised, or fullscreen (F11)?
6. Does `run-responsive-tests.cmd` pass on his machine, and does `Content freeze` say PASS? The numbers should match yours. If they do and it still looks wrong, send a screenshot of the full browser window.

## 5. Stop overwriting each other (git)

This folder is **not** a git repo yet. Recommended (one person sets it up, 5 minutes):
1. `git init`, then one commit named `baseline` with the current state.
2. Each person works on their own branch: `git switch -c shelby-ui` and `git switch -c friend-ui`.
3. Commit small and often with a short message (`git commit -am "fix tickets table padding"`).
4. Before merging into `main`: run `run-responsive-tests.cmd` on your branch. Both lines must say PASS.
5. Merge one branch at a time. If both of you changed the same CSS file, Git will mark the conflict; do not delete the other person's lines, ask first.
6. Do not edit `css/variables.css` or `css/base.css` on both branches at once: agree who owns it that day.

Until then: send the **whole folder** (zip), never single files, and name the zip with the date.

## 6. Presentation-day checklist (school TV)

The night before: copy the whole folder to a USB stick **and** to cloud storage. Do not rely on school Wi-Fi.

On the presenting computer, before the audience arrives:
1. Connect to the TV and set Windows display to the TV's native resolution (usually 3840x2160 or 1920x1080). Note it: Settings > System > Display.
2. Set Windows scaling to 100% for a 1080p TV. For a 4K TV, 150% to 200% usually reads best from a distance; try it.
3. Open `index.html` in Edge or Chrome, press **F11** (fullscreen), then **Ctrl+0** (zoom 100%).
4. If text is too small from the back of the room, press **Ctrl +** one or two times (125% or 150%). The layout is tested to hold at 125% and 150%.
5. If the TV crops the edges (you cannot see the top bar's right side), switch the TV's picture mode to **PC / Game / Just Scan** (this turns off overscan).
6. Run `run-responsive-tests.cmd` once on this computer. Expect two PASS lines.
7. Sign in as each role you will demo (accounts in `ACCOUNTS.txt`) and open each screen once.
8. Close notifications and other apps. Plug in the charger.

## 7. Known limitations (honest list)

- The TV and a 1080p desktop monitor have the same screen size, so body text is 18px at 1080p, which is a little under the 24px you would want from far away. Use Ctrl+ (step 4 above) rather than making every desktop user's text bigger.
- Chart axis and legend text is set in JavaScript pixel sizes and does not grow with the page; it can look small on the TV.
- Very small captions and badges stay 12-14px.
- Inline text links inside sentences and native checkboxes are smaller than 44px on touch screens.
- The date-filter popup width still uses `100vw` (a few px of sideways room on classic Windows scrollbars).
- Tested engines: Chromium (full matrix, with Windows-style 15px scrollbars), Firefox and WebKit (6 screen sizes, overlay scrollbars). Real Safari, real TV overscan and real Windows display scaling were emulated, not run on the devices.

## Sign-in screen rules
- The sign-in screen never scrolls the page: on desktop from 520px tall up, and on phones (320-414 wide) from 520px tall up. No blank scrollbar strip (`html:has(.lg-shell){scrollbar-gutter:auto}`).
- Height tiers on desktop (`pages.css`, later rules win): <=900 (shorter wordmark), <=800 (mid tier, covers laptops at 125% display scaling, ~1534x730), <=720, <=640, <=580. Add a new tier here before adding one-off fixes.
- The "National University" wordmark sits in the card column, directly above the card, right-aligned and centred over it. It must never overlap the card.
- "Facility Support Portal" is one line on desktop (`white-space: nowrap`, gold accent word, centred underline). On tall windows (>=801px) the card gets extra top padding and the wordmark a larger gap.
- Phones and portrait tablets: mascot and wordmark are one compact header row above the card at its natural height.
- Known limit: landscape phones about 390px tall (e.g. 844x390) still scroll, because they are below the 520px guarantee.
