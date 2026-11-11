# The database

`NU_Facility_Support_DB.xlsx` is the database of the NU Facility Support Portal. Everything the site shows
(people, accounts, rooms, categories, tickets, schedules, notifications) is a row in this workbook.
The site itself keeps no data of its own: the files in `js/data` are **generated** from it.

```
NU_Facility_Support_DB.xlsx  --(tools/build-data.py)-->  js/data/*.js and ACCOUNTS.txt  -->  the website
```

The backend (Power Automate) is not built yet. The workbook is laid out so it can read it later: every sheet
holds one Excel table with the same name as the sheet, and the first column of every table is a unique `id`.

## Changing the data
1. Edit the rows in the workbook (keep the sheet names, table names and column headers as they are) and save it.
2. Run `python tools/build-data.py` from the project folder (needs Python and `pip install openpyxl`).
   It checks the workbook first and refuses to continue if any link between sheets is broken, listing the problems.
3. Reload the site. Every rebuild makes browsers start fresh from the workbook, so anything saved in a browser
   while testing (new tickets, changed settings) is replaced.

`python tools/validate-db.py` runs the checks on their own.

## Before a demo: refresh the dates
Dates are real timestamps stored in the workbook, so they age. Run `python tools/build-data.py --reanchor`
and every date in the workbook moves forward as one block (newest activity becomes "now"). Text that spells
out a date inside a message, such as "scheduled ... on Oct 20, 2026", is not changed.

## Rules the checker enforces
- Every `id` is unique within its sheet.
- Every `*_id` column points at a row that exists (for example `Ticket.reporter_id` must be a `User.id`).
- Each ticket's team matches its category, its number (`IT-2026-00012`) matches its team, year and sequence,
  its status equals its last timeline entry, and an assigned technician belongs to the ticket's team.
- The ticket counters match the tickets.
- Moments in time are ISO text in UTC, for example `2026-10-17T09:08:25.279Z`. Yes/no columns hold TRUE or FALSE.

## Sheets
| Sheet / table | Holds | Columns |
|---|---|---|
| `Config` | Single settings the site needs (default sign-in, thresholds, shared messages). | `id`, `value`, `description` |
| `Role` | The four sign-in roles. | `id`, `label`, `short_label`, `sort_order` |
| `Team` | Teams that tickets are routed to. | `id`, `description`, `sort_order` |
| `Status` | Ticket statuses. display_order = list order, workflow_order = order of progress. | `id`, `display_order`, `workflow_order` |
| `LocationType` | Room types, each mapped to a picker group (kind). | `id`, `kind_id`, `sort_order` |
| `LocationKind` | Groups shown in the location type picker. | `id`, `label`, `field_label`, `sort_order` |
| `BuildingFloor` | Floors listed for each building, in picker order. | `id`, `building`, `floor`, `sort_order` |
| `Category` | Ticket categories. requires_no_password marks account-related categories. | `id`, `label`, `team_id`, `icon`, `requires_no_password`, `sort_order` |
| `ProblemType` | Problem choices for each category. | `id`, `category_id`, `label`, `title`, `is_safety`, `sort_order` |
| `Location` | Every room and area that can be reported. | `id`, `building`, `floor`, `room`, `name`, `type`, `status`, `qr_payload`, `is_retired` |
| `LocationAlias` | Old location codes and the location that replaces each one. | `id`, `location_id` |
| `User` | People in the system. | `id`, `first_name`, `last_name`, `full_name`, `display_name`, `welcome_name`, `role`, `role_label`, `department`, `email`, `status`, `last_activity_at`, `usual_location_id` |
| `Account` | Sign-in accounts. Each points to a person in User. | `id`, `email`, `password`, `role`, `role_label`, `user_id`, `mfa_secret` |
| `Ticket` | Support tickets. id is the public ticket number. | `id`, `internal_id`, `year`, `sequence`, `group_code`, `title`, `description`, `category_id`, `problem_type`, `team_id`, `status_id`, `location_id`, `reporter_id`, `assignee_id`, `assigned_team`, `created_at`, `updated_at`, `resolved_at`, `closed_at`, `resolution_note`, `feedback`, `reopen_count`, `legacy_ticket_no`, `legacy_fixed_id` |
| `TicketTimeline` | Status changes of each ticket, in order. | `id`, `ticket_id`, `sequence`, `status_id`, `at`, `by_user_id` |
| `TicketAttachment` | Photos and files attached to tickets. | `id`, `ticket_id`, `kind`, `name`, `size_bytes`, `mime`, `added_by_id`, `added_at` |
| `TicketNote` | Notes written on tickets. | `id`, `ticket_id`, `author_id`, `text`, `visibility`, `created_at` |
| `Schedule` | Weekly class slots (kind=class) and dated ticket visits (kind=ticket). | `id`, `kind`, `location_id`, `title`, `course_code`, `weekday`, `start_time`, `end_time`, `ticket_id`, `scheduled_date` |
| `Notification` | Messages shown in the notification list. | `id`, `user_id`, `type`, `message`, `is_read`, `created_at`, `ticket_id`, `schedule_id` |
| `AuditLog` | Who did what, and when. | `id`, `at`, `actor_id`, `action`, `ticket_id`, `details` |
| `Counter` | Next-number counters for ticket numbers. | `id`, `value` |
