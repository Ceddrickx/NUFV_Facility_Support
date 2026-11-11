# NU Fairview Facility and IT Maintenance Ticketing System
**Report. Track. Resolve.** A frontend UI/UX prototype (HTML, CSS, vanilla JavaScript). No backend: the mock data lives in the Excel database `database/NU_Facility_Support_DB.xlsx` (see `database/README.md`), is built into `js/data` by `tools/build-data.py`, and is kept in the browser's `localStorage` while you use the site.

Project layout and how the files connect: `docs/ARCHITECTURE.md`.

## Ticket numbering model

New tickets follow the numbering guide in `TICKET-NUMBERING (1).md`:

- `ticketId` is an immutable numeric identity used for internal relations.
- `ticketNo` is the public label shown to users, such as `NFV-2026-00001` (older sample tickets keep their `IT-`, `FM-` or `TR-` numbers); `ticket.id` remains a compatibility alias for existing routes.
- Counters are independent by team and Manila calendar year. `Other`/triage uses its own `TR` prefix, and five-digit padding expands safely beyond `99999`.
- Notifications, audit entries, and schedules retain their current public route field and also store `ticketInternalId` so a SQL migration can use a real foreign key.
- The browser prototype stages allocation and related writes together and restores the counter if an in-memory write fails. Production SQL Server must still enforce the transaction, row lock, `UNIQUE (GroupCode, TicketYear, TicketSeq)`, and identity primary key described in the guide.

## How to run
Double-click `index.html`, or double-click `Open-Portal.cmd`. It works offline from a `file://` address (no server, no build step, no internet needed). The command file only opens the local page and does not depend on a Python installation or a machine-specific folder.
If the browser shows `127.0.0.1:4175` with `ERR_CONNECTION_REFUSED`, close that old server URL and open `index.html` again. That address is only valid while the optional authentication server is running. Each groupmate should open their own copy of `index.html` or `Open-Portal.cmd`; sharing the folder does not share your localhost server or your browser's localStorage.
Tested in Microsoft Edge (Chromium).

## Sign in
Only the 9 accounts in the Account sheet of the database workbook (built into `js/data/accounts.js` and listed in `ACCOUNTS.txt`) can sign in (email + password; one of them also needs a Google Authenticator code, described below). **Continue with Microsoft** is a demo shortcut and checks nothing (see below). The full email must match exactly (case does not matter) and so must the password; anything else shows "Invalid email or password". Students use `@students.nu-fairview.edu.ph`, faculty `@faculty...`, technicians `@technicians...` and the admin `@admins...`. The Campus list on the sign-in page is for show, as in the reference design.

| Account | Email | Role on screen |
|---|---|---|
| Student (2) | `constantinopgo@` (Gian Constantino), `literatojes@` (Emman Literato) `students.nu-fairview.edu.ph` | Student, Student screens |
| Faculty (1) | `bajarlcc@faculty.nu-fairview.edu.ph` (Lance Christopher Bajar) | Faculty, the same Student screens |
| IT technician (2) | `villarkcc@` (Kim Cedrick Villar), `isaacrf@` (Raphael Isaac) `technicians.nu-fairview.edu.ph` | IT Technician, IT screens |
| FMO technician (2) | `legaspijbd@` (John Benedict Legaspi), `garciaayg@` (Ares Yael Garcia) `technicians.nu-fairview.edu.ph` | FMO Technician, FMO screens |
| Admin (1) | `sacriztade@admins.nu-fairview.edu.ph` (Tiffany Ann Sacriz) | Admin, Admin screens |

Passwords are in the Account sheet of the database workbook (plain text, because this prototype has no backend) and in `ACCOUNTS.txt`; every person has their own. Each person lands on the screens for their role and cannot open another role's screens by typing the address: they are sent back to their own dashboard. The greeting card and ticket assignments show the first name only; Settings > Account and the account menus show the full name. "Assigned to me" and ticket ownership use the signed-in person.
To change account, use **Log out** (sidebar footer) and sign in again.

**Sign-in limits.** Eight wrong passwords for the same email within 5 minutes block that email for the rest of the 5 minutes ("Too many attempts"). A signed-in session ends after 30 minutes with no click or key press, and the sign-in page says "Your session expired". Both are kept in this browser only (`nuf_login_fails`, `nuf_session`), so anyone with developer tools can clear them; real enforcement needs a server.

## Continue with Microsoft (demo, no authentication)
The button does **not** contact Microsoft and asks for no password or code. One click signs in as the Admin `sacriztade@admins.nu-fairview.edu.ph` (Tiffany Ann Sacriz) and opens the admin dashboard (the account is set by `microsoft_signin_email` in the Config sheet). Real Microsoft sign-in would need an Entra app registration and the site served from `localhost` or `https://`.

## Two-step sign-in (one account)
Only `z4nvern07@gmail.com` (password `2025-1034600`, opens Kim Cedrick Villar's IT technician account) uses the Google Authenticator code, and it is **always** required for that account. Every other account signs in with email + password alone. There is no setting to turn it on or off.

For the shared ZIP demonstration, add the account to the presenter’s Google Authenticator app once: tap **+**, choose **Enter a setup key**, and use the key stored as `mfa_secret` on that account in the Account sheet (it is also printed in `ACCOUNTS.txt`). Groupmates do not need to register the account on their own phones. They open their own extracted copy, sign in with the demo email and password, then enter the current six-digit code read from the presenter’s phone. The code refreshes about every 30 seconds, so share it only when they reach the verification screen. A code works once per local browser copy, and five wrong codes trigger a short five-second demo lockout. This works from `index.html` opened by double-click, and the phone only needs a correct clock. When the optional authentication server is available over HTTP, that account uses the server verification flow instead.

**Limits (demo, no backend).** The key is plain text in `js/data/accounts.js`, so anyone with the folder or a zip copy can make valid codes. The used-code record and the five-second demo lockout are kept in this browser (`nuf_mfa`). That shows the whole flow working, but it is not real security; a production version needs a server to hold the secrets.

## Reset demo data
Open **Settings** in the sidebar -> the **Demo data** tab -> **Reset demo data** (every role; a confirmation appears first). This restores the data as it was last built from the database workbook, with its team/year ticket counters. Resetting keeps you signed in.
The system clock is real time. The dates are fixed in the workbook, so before a demo run `python tools/build-data.py --reanchor` once to move every date forward to today (see `database/README.md`).

## Settings and menu
On laptops and desktops (1024px and up) the sidebar is a 64px icon rail under the full-width top bar, which keeps the NU logo. Hover and stay (about 0.6 s), or Tab into it, and it expands to show labels while the page shifts over to make room; move away and it folds back. Every rail icon has a tooltip, and the account menu opens as a small flyout. Delays and speed are the `--side-*` variables in `css/variables.css`. On tablets and phones the 3x3 dot button opens a slide-in sidebar with a dimmed, blurred focus effect (click outside, press Esc or pick an item to close). Pages you drill into (a ticket, a device, a user, Report an Issue from a shortcut) show a "Back to ..." link at the top that returns to the page you came from. Every role has one **Settings** item in the menu. Its page has tabs for Account, Preferences, Notifications, Privacy and Security, Help and Support and Demo data; the Administrator also has a System tab (recurring-issue threshold). The old URLs (`#/account`, `#/preferences`, `#/security`, ...) still open the matching tab.

## Demo script (spec Section 23)
1. Student: Report an Issue -> Scan QR Code -> **Start Scan** with the camera (or type the location code `NUF-LOC:LAB-04-402L`) -> Confirm Location.
2. Details: title "Internet connection keeps disconnecting." and a short description.
3. Photo (required, images only): **Browse Files** or **Take photo** -> Review -> **Submit Report** -> a new `NFV-` ticket number (Pending, sent to the Administrator for assignment).
4. Log out and sign in as an IT technician (for example `villarkcc@technicians.nu-fairview.edu.ph`): open the ticket -> **Accept** -> **Start Work** -> Add Note -> Upload Photo -> **Mark Resolved** (note required).
5. Log out and sign in as the same student again: **"Is your issue resolved?"** -> **YES, ISSUE RESOLVED** -> Closed / Verified. Wi-Fi at Room 402L now shows **8** reports.
6. Student extras: open the chatbot, type "My computer has no display.". Students and Faculty have no Schedule screen.
7. IT or FMO technician: **All Tickets** / **IT Tickets** -> **Assigned to me**; open a ticket -> **Room schedule** shows what is booked in that room and when you may start the repair.
8. Administrator: Dashboard, Analytics, Recurring Issues, Schedules -> **Schedule Ticket** (pick an open ticket, then a date and time; pick a time that overlaps a class in Room 402L to see the conflict warning), Locations (Generate QR), Audit Activity.
9. Drag the window from wide to phone width and back, and open the menu with the dot button in the header.

## Pages per role
| Role | Pages |
|---|---|
| Student / Faculty | Dashboard, Report Issue, My Tickets, Ticket Detail, Notifications, Chatbot, Settings (no Manage section, no Schedule) |
| FMO Technician | Dashboard, All Tickets (Facility filter on by default, plus **Assigned to me**), Ticket Detail with Room schedule, Scheduled Tickets (with Room Availability), Ticket History, Notifications |
| IT Technician | Dashboard, IT Tickets (with **Assigned to me**), Ticket Detail with Room schedule, Scheduled Tickets (with Room Availability), Ticket History, Notifications |
| Admin | Dashboard, Tickets, Assignments, Users, Locations (QR), Schedules, Analytics, Recurring Issues, Audit Activity, Settings |

The system handles submitted problem tickets. It does not monitor school assets or devices: the Assets, Device Monitoring and Network / Computer Issues screens and the separate Assigned Tickets screens were removed.

## Honesty labels
**Future Enhancement Preview**: chatbot, class schedule / room availability. **UI Simulation**: auto-routing, weekly summary. Access-related categories show: "Do not enter any password...". No real integrations exist.

## Known limitations
- Attachments (photos) live in the browser session only; after a reload only file names and sizes remain (placeholder thumbnails).
- The QR step and **Take photo** use the device camera (getUserMedia), which browsers allow only on https or localhost. QR codes are decoded with the bundled jsQR (`assets/vendor/jsQR.js`). **Enter location code** is the fallback when no camera is available.
- Class schedule data is a static mock; no real class-scheduling integration.
- Tested on Edge (Chromium) with scripted checks. Firefox, Safari, real phones, Lighthouse and axe were **not** run.
