"""Checks the database workbook for broken links between sheets.

Usage:  python tools/validate-db.py [path to workbook]
Prints every problem found and exits with code 1 when there is any. build-data.py runs the same checks first.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dbio  # noqa: E402

DEFAULT_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'database', 'NU_Facility_Support_DB.xlsx')
PREFIX = {'IT': 'IT', 'Facility': 'FM', 'Triage': 'TR'}
ROLE_OF_TEAM = {'IT': 'it', 'Facility': 'fmo'}

# (sheet, column, target sheet, target column, may be blank)
LINKS = [
    ('Category', 'team_id', 'Team', 'id', False),
    ('ProblemType', 'category_id', 'Category', 'id', False),
    ('LocationType', 'kind_id', 'LocationKind', 'id', False),
    ('Location', 'type', 'LocationType', 'id', False),
    ('Location', 'building', 'BuildingFloor', 'building', False),
    ('LocationAlias', 'location_id', 'Location', 'id', False),
    ('User', 'role', 'Role', 'id', False),
    ('User', 'usual_location_id', 'Location', 'id', True),
    ('Account', 'role', 'Role', 'id', False),
    ('Account', 'user_id', 'User', 'id', False),
    ('Ticket', 'category_id', 'Category', 'id', False),
    ('Ticket', 'team_id', 'Team', 'id', False),
    ('Ticket', 'status_id', 'Status', 'id', False),
    ('Ticket', 'location_id', 'Location', 'id', False),
    ('Ticket', 'reporter_id', 'User', 'id', False),
    ('Ticket', 'assignee_id', 'User', 'id', True),
    ('TicketTimeline', 'ticket_id', 'Ticket', 'id', False),
    ('TicketTimeline', 'status_id', 'Status', 'id', False),
    ('TicketTimeline', 'by_user_id', 'User', 'id', False),
    ('TicketAttachment', 'ticket_id', 'Ticket', 'id', False),
    ('TicketAttachment', 'added_by_id', 'User', 'id', False),
    ('TicketNote', 'ticket_id', 'Ticket', 'id', False),
    ('TicketNote', 'author_id', 'User', 'id', False),
    ('Schedule', 'location_id', 'Location', 'id', False),
    ('Schedule', 'ticket_id', 'Ticket', 'id', True),
    ('Notification', 'user_id', 'User', 'id', False),
    ('Notification', 'ticket_id', 'Ticket', 'id', True),
    ('Notification', 'schedule_id', 'Schedule', 'id', True),
    ('AuditLog', 'ticket_id', 'Ticket', 'id', False),
]


def check(data):
    errs = []
    ids = {}
    for sheet, rows in data.items():
        seen = set()
        for r in rows:
            k = r['id']
            if k is None or k == '':
                errs.append(f'{sheet}: a row has no id')
            elif k in seen:
                errs.append(f'{sheet}: duplicate id {k!r}')
            seen.add(k)
        ids[sheet] = seen
    for sheet, col, tsheet, tcol, blank_ok in LINKS:
        have = ids[tsheet] if tcol == 'id' else {r[tcol] for r in data[tsheet]}
        for r in data[sheet]:
            v = r[col]
            if v is None:
                if not blank_ok:
                    errs.append(f'{sheet} {r["id"]}: {col} is empty')
            elif v not in have:
                errs.append(f'{sheet} {r["id"]}: {col}={v!r} does not exist in {tsheet}')
    cfg = {r['id']: r['value'] for r in data['Config']}
    if cfg.get('default_user_id') not in ids['User']:
        errs.append(f"Config default_user_id={cfg.get('default_user_id')!r} is not a User")
    if cfg.get('default_role') not in ids['Role']:
        errs.append(f"Config default_role={cfg.get('default_role')!r} is not a Role")
    if cfg.get('microsoft_signin_email') not in {a['email'] for a in data['Account']}:
        errs.append(f"Config microsoft_signin_email={cfg.get('microsoft_signin_email')!r} is not an Account email")
    if cfg.get('default_location_id') not in ids['Location']:
        errs.append(f"Config default_location_id={cfg.get('default_location_id')!r} is not a Location")
    emails = [a['email'].lower() for a in data['Account']]
    if len(emails) != len(set(emails)):
        errs.append('Account: two accounts share an email')
    # problem type must belong to the ticket's category
    ptypes = {}
    for p in data['ProblemType']:
        ptypes.setdefault(p['category_id'], set()).add(p['label'])
    cat_team = {c['id']: c['team_id'] for c in data['Category']}
    users = {u['id']: u for u in data['User']}
    tl = {}
    for e in data['TicketTimeline']:
        tl.setdefault(e['ticket_id'], []).append(e)
    for t in data['Ticket']:
        tid = t['id']
        if t['problem_type'] not in ptypes.get(t['category_id'], set()):
            errs.append(f'Ticket {tid}: problem_type {t["problem_type"]!r} is not a problem of {t["category_id"]}')
        if cat_team.get(t['category_id']) != t['team_id']:
            errs.append(f'Ticket {tid}: team {t["team_id"]} does not match category {t["category_id"]}')
        if t['group_code'] != PREFIX.get(t['team_id']):
            errs.append(f'Ticket {tid}: group_code {t["group_code"]} does not match team {t["team_id"]}')
        m = re.fullmatch(r'([A-Z]+)-(\d{4})-(\d{5})', tid)
        if not m or m.group(1) != t['group_code'] or int(m.group(2)) != t['year'] or int(m.group(3)) != t['sequence']:
            errs.append(f'Ticket {tid}: id does not match group_code/year/sequence')
        evs = sorted(tl.get(tid, []), key=lambda e: e['sequence'])
        if not evs:
            errs.append(f'Ticket {tid}: has no timeline')
            continue
        if [e['sequence'] for e in evs] != list(range(1, len(evs) + 1)):
            errs.append(f'Ticket {tid}: timeline sequence is not 1..n')
        if any(evs[i]['at'] > evs[i + 1]['at'] for i in range(len(evs) - 1)):
            errs.append(f'Ticket {tid}: timeline is not in time order')
        if evs[0]['status_id'] != 'Pending' or evs[0]['by_user_id'] != t['reporter_id'] or evs[0]['at'] != t['created_at']:
            errs.append(f'Ticket {tid}: first timeline entry must be Pending, by the reporter, at created_at')
        if evs[-1]['status_id'] != t['status_id']:
            errs.append(f'Ticket {tid}: status {t["status_id"]} differs from last timeline status {evs[-1]["status_id"]}')
        if t['assignee_id'] and t['team_id'] in ROLE_OF_TEAM and users[t['assignee_id']]['role'] != ROLE_OF_TEAM[t['team_id']]:
            errs.append(f'Ticket {tid}: assignee {t["assignee_id"]} is not a {ROLE_OF_TEAM[t["team_id"]]} technician')
    # counters
    ctr = {c['id']: c['value'] for c in data['Counter']}
    if ctr.get('nextTicketId') != max([t['internal_id'] for t in data['Ticket']] + [0]) + 1:
        errs.append('Counter nextTicketId is not highest internal_id + 1')
    top = {}
    for t in data['Ticket']:
        k = f"{t['group_code']}-{t['year']}"
        top[k] = max(top.get(k, 0), t['sequence'])
    for k, v in top.items():
        if ctr.get(k) != v:
            errs.append(f'Counter {k} is {ctr.get(k)} but the highest ticket sequence is {v}')
    return errs


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB
    data = dbio.read_workbook(path)
    errs = check(data)
    for e in errs:
        print('PROBLEM:', e)
    print(f'{len(errs)} problem(s) found in {os.path.basename(path)}.' if errs else 'Database is consistent: every link resolves.')
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
