---
name: NU Fairview Facility and IT Maintenance Ticketing
description: Report. Track. Resolve. A calm, institutional operations UI for campus facility and IT requests.
colors:
  primary: "#35408e"
  primary-deep: "#2a3373"
  primary-darkest: "#1f2657"
  primary-tint: "#dde1f3"
  primary-wash: "#eef0f9"
  accent-gold: "#ffd41c"
  accent-gold-deep: "#e6bd00"
  on-accent: "#1b1b1b"
  app-background: "#fcfcfc"
  surface: "#ffffff"
  surface-alt: "#f3f4fa"
  text: "#1f2233"
  text-muted: "#5a5f73"
  border: "#dcdeea"
  field-border: "#7b8098"
  success: "#3d7352"
  error: "#b94a48"
  warning: "#c9823a"
  status-pending: "#64748b"
  status-assigned: "#2563eb"
  status-in-progress: "#1e40af"
  status-reopened: "#d89807"
  status-resolved: "#15803d"
  status-closed: "#145a32"
typography:
  body:
    fontFamily: "Inter, Arial, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, Arial, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  headline:
    fontFamily: "Inter, Arial, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.25rem + 1vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  xs: "0.25rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  modal: "0.875rem"
spacing:
  s1: "0.25rem"
  s2: "0.5rem"
  s3: "0.75rem"
  s4: "1rem"
  s5: "1.5rem"
  s6: "2rem"
  s7: "3rem"
  s8: "4rem"
---

# Design System: NU Fairview Facility and IT Maintenance Ticketing

> Status: scan of the existing code. The Creative North Star below is a **proposed draft** and has not been confirmed with the team. Layout and responsive rules are verified against the code and the test suite in `tests/responsive/`.

## Overview

**Creative North Star (draft): "The Campus Operations Desk"**

A calm, trustworthy desk for people who have to get a broken projector or a locked account sorted quickly. The look is institutional but not cold: a deep NU navy header with a thin gold rule, white cards on a near-white page, and gold reserved for the main action. Status is always shown with an icon **and** a word, never colour alone.

The system is light only. Density is moderate: dashboards use tidy stat tiles and charts, queues use tables that become stacked cards on phones. It is built to be read on a laptop, a wide monitor, a phone and a school TV.

**Key Characteristics:**
- Navy (`#35408e`) header and primary actions, gold (`#ffd41c`) accent line and key buttons.
- Status pills with white text on solid colours, always icon plus label.
- One typeface (Inter, bundled in `assets/fonts`), no web-font dependency.
- Everything sized in `rem` so the whole page scales together on big screens.

## Colors

Restrained navy-and-gold with a neutral cool-grey page. Red, green and orange appear only to carry status meaning.

### Primary
- **NU Navy** (`#35408e`): header bar, primary buttons, links, active navigation, chart bars.
- **Deep Navy** (`#2a3373`) and **Midnight** (`#1f2657`): hover states, dark surfaces, shadows tinted toward navy.

### Accent
- **Gold** (`#ffd41c`): the line under the header, highlighted actions, the Pending stat tile. Text on gold is near-black (`#1b1b1b`).

### Neutral
- **Page** (`#fcfcfc`), **Surface** (`#ffffff`), **Cool wash** (`#f3f4fa`), **Border** (`#dcdeea`), **Text** (`#1f2233`), **Muted text** (`#5a5f73`).

### Named Rules
**The Never-Colour-Alone Rule.** Every status uses an icon and a text label as well as its colour.

**The One Pill Source Rule.** Pill and chart colours come only from the `--pill-*` tokens in `variables.css`.

## Typography

**Display, Body and Label Font:** Inter (bundled), with Arial and system-ui fallbacks.

**Character:** neutral, highly legible, slightly dense for tables; uppercase tracked labels for pills and table headers.

### Hierarchy
- **Page title** (700, clamp 24 to 30px at the base size, line-height 1.2).
- **Body** (400, 1rem, line-height 1.5; the base size grows with the screen, see Layout).
- **Label / pill** (700, 0.75rem, uppercase, 0.06em tracking).

## Layout

Mobile-first. A fixed top bar with a gold bottom rule; below 1024px a slide-out drawer and a bottom navigation bar; from 1024px a 64px icon rail that expands on hover or focus.

**Breakpoints (the only allowed values):** 360, 480, 640, 768, 1024, 1200, 1920, 2560. Max-width queries use the number minus 1px.

**Fluid scale.** The root font size is 16px up to about 1700px wide and then grows with the smaller of screen width and 16:9-equivalent height (`clamp(100%, min(0.9375vw, 1.6667vh), 3rem)`): about 18px at 1080p, 24px on a 3440x1440 ultrawide, 36px on a 4K screen. Spacing, radius, shell sizes and grid minimums are `rem`, so layouts scale as one piece.

**Content width.** Content is centred with `--content-max` (150rem). Card grids use `auto-fit` columns; from 2560px the two-column dashboard grids gain columns instead of stretching.

**TV safe margin.** From 1920px wide, `--safe-x` (2.5vw) keeps the header, rail and content off the screen edges.

**Tables.** Wide tables sit in `.table-wrap` and scroll inside their card; at 1200 to 1919px the ticket table rebalances its Status and Actions columns so buttons are never clipped. On phones tables become stacked label/value cards.

## Elevation & Depth

Mostly flat with soft navy-tinted shadows (`0 2px 8px` to `0 10px 40px` at 10 to 32% navy). The header and drawer sit above content with a shared scrim. Depth appears on interaction (hover, open drawers, modals), not at rest.

## Shapes

Gently rounded: 4 to 8px for controls and cards, 12 to 14px for modals; pills are fully rounded (999px).

## Components

### Buttons
- **Primary:** navy fill, white text, 44px minimum height, 8px radius; hover deepens to `#2a3373`.
- **Secondary:** white with navy border; **accent:** gold fill with near-black text; **danger:** error red fill.
- On touch-size screens small buttons are raised to 44px.

### Status pills
White text on solid status colours, 12px uppercase, icon then label, fully rounded.

### Stat tiles
Rounded card with a coloured top edge, an icon tile, a label and a large number; the whole tile is a link when it filters a list.

### Navigation
Sidebar rail with icons that expands to labelled items; active item has a navy tint and a 3px accent edge. On phones a bottom bar with up to five items plus "More".

## Do's and Don'ts

### Do:
- **Do** use the spacing, radius and type tokens (`rem`) and the breakpoint list above.
- **Do** keep touch controls at least 44px tall.
- **Do** pair every colour signal with an icon and text.
- **Do** run `run-responsive-tests.cmd` before sharing changes.

### Don't:
- **Don't** hard-code `px` widths for pages or cards, or use `100vw` for sizing.
- **Don't** load fonts from the internet; use the bundled Inter.
- **Don't** add new media-query numbers outside the list.
- **Don't** rely on hover for anything the TV or a phone user needs.

## Custom icons (Tickets, Pending, In Progress, Assignment, Active, Audit Activity)
These six use PNG icons embedded as data URIs in `js/icons/icon-images.js` and drawn as CSS masks (`span.icon.icon-img.ic-<name>`), so they take the surrounding text colour (white on the dark bottom nav, accent colour in stat cards). Names: `ticket`, `clock` (Pending), `progress` (In Progress), `assignment`, `active`, `audit`. `App.icon(name)` in `js/icons/icons.js` returns the span for these names and the stroke SVG for every other name. To change one, replace its PNG (128px, black on transparent) and regenerate the data URI in `icons/icon-images.js`.
