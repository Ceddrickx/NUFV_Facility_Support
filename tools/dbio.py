"""Reads and writes the NU Facility Support database workbook.

The workbook (database/NU_Facility_Support_DB.xlsx) is the system's database. Every sheet holds one
Excel table with the same name as the sheet, so Power Automate's Excel connector can read it later.

Conventions
  - Sheet and table names: PascalCase, singular (Ticket, TicketTimeline).
  - Column names: snake_case. The first column of every sheet is `id`.
  - Foreign keys are named <entity>_id and hold the id of a row in another sheet.
  - Moments in time are ISO-8601 text in UTC, for example 2026-10-17T09:08:25.279Z.
  - Yes/no columns hold TRUE or FALSE.

Needs openpyxl:  pip install openpyxl
"""
import calendar
import datetime as dt
import os

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

# sheet name -> (description, columns). Order here is the order of the tabs.
SHEETS = {
    'Config': ('Single settings the site needs (default sign-in, thresholds, shared messages).',
               ['id', 'value', 'description']),
    'Role': ('The four sign-in roles.', ['id', 'label', 'short_label', 'sort_order']),
    'Team': ('Teams that tickets are routed to.', ['id', 'description', 'sort_order']),
    'Status': ('Ticket statuses. display_order = list order, workflow_order = order of progress.',
               ['id', 'display_order', 'workflow_order']),
    'LocationType': ('Room types, each mapped to a picker group (kind).', ['id', 'kind_id', 'sort_order']),
    'LocationKind': ('Groups shown in the location type picker.', ['id', 'label', 'field_label', 'sort_order']),
    'BuildingFloor': ('Floors listed for each building, in picker order.', ['id', 'building', 'floor', 'sort_order']),
    'Category': ('Ticket categories. requires_no_password marks account-related categories.',
                 ['id', 'label', 'team_id', 'icon', 'requires_no_password', 'sort_order']),
    'ProblemType': ('Problem choices for each category.',
                    ['id', 'category_id', 'label', 'title', 'is_safety', 'sort_order']),
    'Location': ('Every room and area that can be reported.',
                 ['id', 'building', 'floor', 'room', 'name', 'type', 'status', 'qr_payload', 'is_retired']),
    'LocationAlias': ('Old location codes and the location that replaces each one.', ['id', 'location_id']),
    'User': ('People in the system.',
             ['id', 'first_name', 'last_name', 'full_name', 'display_name', 'welcome_name', 'role', 'role_label', 'department',
              'email', 'status', 'last_activity_at', 'usual_location_id']),
    'Account': ('Sign-in accounts. Each points to a person in User.',
                ['id', 'email', 'password', 'role', 'role_label', 'user_id', 'mfa_secret']),
    'Ticket': ('Support tickets. id is the public ticket number.',
               ['id', 'internal_id', 'year', 'sequence', 'group_code', 'title', 'description', 'category_id',
                'problem_type', 'team_id', 'status_id', 'location_id', 'reporter_id', 'assignee_id',
                'assigned_team', 'created_at', 'updated_at', 'resolved_at', 'closed_at', 'resolution_note',
                'feedback', 'reopen_count', 'legacy_ticket_no', 'legacy_fixed_id']),
    'TicketTimeline': ('Status changes of each ticket, in order.',
                       ['id', 'ticket_id', 'sequence', 'status_id', 'at', 'by_user_id']),
    'TicketAttachment': ('Photos and files attached to tickets.',
                         ['id', 'ticket_id', 'kind', 'name', 'size_bytes', 'mime', 'added_by_id', 'added_at']),
    'TicketNote': ('Notes written on tickets.',
                   ['id', 'ticket_id', 'author_id', 'text', 'visibility', 'created_at']),
    'Schedule': ('Weekly class slots (kind=class) and dated ticket visits (kind=ticket).',
                 ['id', 'kind', 'location_id', 'title', 'course_code', 'weekday', 'start_time', 'end_time',
                  'ticket_id', 'scheduled_date']),
    'Notification': ('Messages shown in the notification list.',
                     ['id', 'user_id', 'type', 'message', 'is_read', 'created_at', 'ticket_id', 'schedule_id']),
    'AuditLog': ('Who did what, and when.', ['id', 'at', 'actor_id', 'action', 'ticket_id', 'details']),
    'Counter': ('Next-number counters for ticket numbers.', ['id', 'value']),
}
WRAP = {'description', 'message', 'text', 'details', 'resolution_note', 'feedback', 'action', 'title', 'value'}
HEAD_FILL = PatternFill('solid', fgColor='35408F')


def iso(ms):
    """Milliseconds since 1970 -> ISO text in UTC."""
    ms = int(round(ms))
    t = dt.datetime.fromtimestamp(ms // 1000, dt.timezone.utc)
    return t.strftime('%Y-%m-%dT%H:%M:%S.') + '%03dZ' % (ms % 1000)


def parse_iso(text):
    """ISO text in UTC -> milliseconds since 1970 (integer)."""
    if text is None or text == '':
        return None
    head, _, frac = str(text).rstrip('Z').partition('.')
    secs = calendar.timegm(dt.datetime.strptime(head, '%Y-%m-%dT%H:%M:%S').timetuple())
    return secs * 1000 + int((frac + '000')[:3] or 0)


def write_workbook(path, data):
    """data: {sheet name: [row dict, ...]}. Overwrites the file."""
    wb = Workbook()
    ws = wb.active
    ws.title = 'README'
    lines = [
        'NU Facility Support - database',
        '',
        'This workbook is the database of the system. Edit the rows here, then run tools/build-data.py to update the site.',
        'Each sheet holds one Excel table with the same name as the sheet (ready for the Power Automate Excel connector).',
        'Do not rename sheets, tables or column headers. Keep the first column (id) unique on every sheet.',
        'Moments in time are ISO text in UTC (2026-10-17T09:08:25.279Z). Yes/no columns hold TRUE or FALSE.',
        '',
        'Sheet / table  ->  what it holds  (rows)',
    ]
    for i, text in enumerate(lines, 1):
        ws.cell(row=i, column=1, value=text)
    ws['A1'].font = Font(bold=True, size=14)
    ws['A8'].font = Font(bold=True)
    for name, (desc, cols) in SHEETS.items():
        ws.append([f"{name}  ->  {desc}  ({len(data.get(name, []))} rows)"])
    ws.column_dimensions['A'].width = 120
    for name, (desc, cols) in SHEETS.items():
        rows = data.get(name, [])
        sh = wb.create_sheet(name)
        sh.append(cols)
        for r in rows:
            vals = []
            for c in cols:
                v = r.get(c)
                if isinstance(v, str) and v.startswith('='):
                    raise ValueError(f'{name}.{c}: text may not start with "=": {v[:40]}')
                vals.append(v)
            sh.append(vals)
        for cell in sh[1]:
            cell.font = Font(bold=True, color='FFFFFF')
            cell.fill = HEAD_FILL
        sh.freeze_panes = 'A2'
        for i, c in enumerate(cols, 1):
            longest = max([len(c)] + [len(str(r.get(c, '') or '')) for r in rows[:300]])
            sh.column_dimensions[get_column_letter(i)].width = min(max(10, longest + 2), 70 if c in WRAP else 45)
            if c in WRAP:
                for row in sh.iter_rows(min_row=2, min_col=i, max_col=i):
                    row[0].alignment = Alignment(wrap_text=True, vertical='top')
        if rows:
            tab = Table(displayName=name, ref=f'A1:{get_column_letter(len(cols))}{len(rows) + 1}')
            tab.tableStyleInfo = TableStyleInfo(name='TableStyleMedium2', showRowStripes=True)
            sh.add_table(tab)
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    wb.save(path)


def read_workbook(path):
    """Returns {sheet name: [row dict, ...]}. Checks every header against SHEETS."""
    wb = load_workbook(path, data_only=True)
    out = {}
    for name, (desc, cols) in SHEETS.items():
        if name not in wb.sheetnames:
            raise ValueError(f'Sheet "{name}" is missing from {path}')
        rows = list(wb[name].iter_rows(values_only=True))
        head = [h for h in rows[0] if h is not None]
        if head != cols:
            raise ValueError(f'Sheet "{name}" has columns {head} but {cols} were expected')
        recs = []
        for r in rows[1:]:
            if all(v is None or v == '' for v in r):
                continue
            recs.append({c: (None if v == '' else v) for c, v in zip(cols, r)})
        out[name] = recs
    return out
