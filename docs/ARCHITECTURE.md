# NU Fairview Facility Support Portal: how the project is laid out

Plain HTML, CSS and JavaScript. No build step, no server needed: double-click `index.html`.

## Folder map

```
index.html            The only page. Loads every stylesheet and script below.
Open-Portal.cmd       Double-click shortcut that opens index.html.
run-responsive-tests.cmd   Runs the layout and content-freeze checks.
ACCOUNTS.txt          Demo sign-in accounts (written by tools/build-data.py).
README.md             Demo guide.
database/             The Excel database (NU_Facility_Support_DB.xlsx) and how to edit it.

css/                  Styling (see "Styles")
js/
  core/               App startup, routing, shared state
  icons/              Icon helpers
  data/               Demo data, GENERATED from database/NU_Facility_Support_DB.xlsx. Do not edit by hand.
  utils/              Small helpers (formatting, validation, filters, camera, one-time codes)
  components/         Reusable pieces (modal, sidebar, QR scanner, chatbot, ticket table ...)
  pages/              One file per screen
assets/               Images, the Inter font, and vendor libraries (Chart.js, QR code, jsQR)
  icon-sources/       Original icon files. NOT loaded by the site (their pictures are
                      embedded in js/icons/icon-images.js). Kept for editing later.
docs/                 This file, DESIGN.md, RESPONSIVE_RULES.md, and the saved prompts
tests/responsive/     Layout + content-freeze checks (Node + Chromium)
tools/                build-data.py (workbook -> js/data), validate-db.py (checks the workbook),
                      dbio.py (workbook layout), serve-login.py (optional login server, needs a backend
                      folder that is not in this project; the site works without it)
```

## How the scripts connect

There are no imports. Every script is a classic `<script defer>` that adds itself to one shared
object, `window.App` (for example `App.router`, `App.store`, `App.icon`, `App.modal`).
Because of that, **the order of the `<script>` lines in `index.html` matters**: a file may only use
parts of `App` that were loaded above it. Do not reorder them.

Load order, roughly (the exact order is the list in `index.html`):

1. `assets/vendor/*` (charts, QR code, QR reader), then `js/utils/*` helpers
2. `js/icons/*`
3. `js/data/*` (constants, accounts, seed data)
4. `js/core/state.js` (`App.store`), `metrics.js`, `actions.js`, `userPrefs.js`
5. `js/components/*`
6. `js/pages/*`
7. `js/core/routes.js`, `router.js`, then `main.js` (starts everything)

## How a screen appears

`routes.js` is the route table: each address (such as `#/report`) names a page file and which roles
may open it. `router.js` watches the address, checks the signed-in role, and calls the matching
page in `js/pages/`. Pages are built from `js/components/` and read or change data through
`App.store` (`state.js`) and `App.actions` (`actions.js`). `main.js` builds the shell (top bar,
sidebar, bottom nav), the sign-in/sign-out flow and the theme.

## Styles

Loaded in this order (later files win when rules tie):

| File | Holds |
|---|---|
| `variables.css` | Colours, spacing, font sizes, animation timings (the design tokens) |
| `base.css` | Page defaults |
| `layout.css` | Top bar, sidebar, bottom nav, page grids |
| `components.css` | Buttons, cards, forms, wizard, tables, hover/press colours |
| `pages.css` | Rules for individual screens |
| `responsive.css` | Phone and tablet adjustments |
| `print.css` | Printing |
| `mobile-audit.css` | Phone fixes and chatbot layout; loaded last on purpose |

## Running the tests

Double-click `run-responsive-tests.cmd`, or in a terminal: `cd tests\responsive` then `node run.mjs`.
Both lines at the end must say PASS. Test pictures go to `tests/responsive/shots/` and can be
deleted at any time; the saved text copy used for the content check is
`tests/responsive/baseline/content.json`.

For interactive behavior, run `node functional.mjs` from `tests\responsive` (or
`npm run test:functional`). It signs in with each supported role, opens every configured route,
and smoke-tests login, report cancellation/discard, QR generation, schedule cancellation,
notification actions, filters, chatbot submission, and page-error handling.
