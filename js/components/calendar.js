/* Calendar component: Month / Week / Day views, prev / next / today, legend. Pure renderer; the page owns the state.
   Small screens default to the Day agenda; the month grid collapses to compact dots (CSS). All schedule data is mock. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  const F = () => App.fmt;

  const addMonths = (d, n) => {
    const [y, m] = d.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1 + n, 1));
    return `${t.getUTCFullYear()}-${F().pad(t.getUTCMonth() + 1)}-01`;
  };
  const monthStart = (d) => d.slice(0, 8) + '01';
  const weekStart = (d) => F().addDays(d, -((F().weekdayOf(d) + 6) % 7)); // Monday first

  function step(st, dir) {
    if (st.view === 'month') st.date = addMonths(st.date, dir);
    else if (st.view === 'week') st.date = F().addDays(st.date, 7 * dir);
    else st.date = F().addDays(st.date, dir);
  }
  function title(st) {
    const f = F();
    if (st.view === 'month') {
      const [y, m] = st.date.split('-').map(Number);
      return `${f.MONTHS[m - 1]} ${y}`;
    }
    if (st.view === 'week') {
      const a = weekStart(st.date);
      return `${f.dateStrLabel(a)} to ${f.dateStrLabel(f.addDays(a, 6))}`;
    }
    return f.longDate(f.at(st.date, '12:00'));
  }

  // Visible items for a date, with conflict detection for scheduled tickets (overlaps a class or another ticket in the same room).
  function itemsFor(st, date) {
    return App.sched
      .itemsOn(date, st.loc || undefined)
      .filter((s) => App.sched.live(s) && st.kinds.includes(s.kind) && (!st.assignee || s.assigneeId === st.assignee))
      .map((s) => ({
        s,
        conflict:
          s.kind === 'ticket' &&
          (s.conflict || App.actions.findConflicts(s.locationId, s.date, s.start, s.end, s.id).length > 0),
      }));
  }
  function ev(it, showRoom) {
    const s = it.s;
    const cls = s.kind === 'class' ? 'ev-class' : it.conflict ? 'ev-conflict' : 'ev-maint';
    const icon = s.kind === 'class' ? 'calendar' : it.conflict ? 'alert' : 'wrench';
    const kind = s.kind === 'class' ? 'Class' : it.conflict ? 'Ticket conflict' : 'Scheduled ticket';
    return `<button type="button" class="ev ${cls}" data-ev="${esc(s.id)}" data-date="${esc(s.date || '')}" aria-label="${kind}: ${esc(App.sched.describe(s))}, ${esc(App.sched.range(s))}${showRoom ? ', ' + esc(App.metrics.locName(s.locationId)) : ''}">
      <b>${App.icon(icon)} ${esc(App.fmt.hhmm(s.start))}</b>${esc(s.courseCode || s.title)}${s.kind === 'class' && s.title ? `<span class="ev-sub">${esc(s.title)}</span>` : ''}${showRoom ? `<br><small>${esc(App.metrics.locName(s.locationId))}</small>` : ''}</button>`;
  }
  const dots = (items) =>
    `<span class="cal-dots" aria-hidden="true">${items
      .slice(0, 6)
      .map(
        (i) =>
          `<i style="background:${i.s.kind === 'class' ? 'var(--nu-blue)' : i.conflict ? 'var(--warning)' : 'var(--nu-navy)'}"></i>`,
      )
      .join('')}</span>`;

  function legend() {
    return `<div class="legend" aria-label="Legend"><span><i style="background:var(--nu-blue)"></i>${App.icon('calendar')} Class</span><span><i style="background:var(--success)"></i>${App.icon('check')} Available</span><span><i class="swatch-maint"></i>${App.icon('wrench')} Scheduled ticket</span><span><i style="background:var(--warning)"></i>${App.icon('alert')} Conflict</span></div>`;
  }

  function month(st) {
    const first = monthStart(st.date),
      today = F().ymd(App.clock.now());
    const lead = (F().weekdayOf(first) + 6) % 7;
    const start = F().addDays(first, -lead);
    let h = `<div class="cal-row" role="row">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<div class="cal-cell head" role="columnheader">${d}</div>`).join('')}</div>`;
    for (let i = 0; i < 42; i++) {
      const d = F().addDays(start, i);
      if (i >= 35 && d.slice(0, 7) !== first.slice(0, 7)) break;
      const items = itemsFor(st, d);
      const other = d.slice(0, 7) !== first.slice(0, 7);
      if (i % 7 === 0) h += '<div class="cal-row" role="row">';
      h += `<div class="cal-cell ${other ? 'other' : ''} ${d === today ? 'today' : ''}" role="gridcell"><button type="button" class="dn" data-day="${d}" aria-label="${esc(F().dateStrLabel(d))}, ${items.length} item${items.length === 1 ? '' : 's'}">${Number(d.slice(8))}${d === today ? ' <small>(today)</small>' : ''}</button>${items
        .slice(0, 3)
        .map((x) => ev(x, !st.loc))
        .join(
          '',
        )}${items.length > 3 ? `<button type="button" class="dn" data-day="${d}"><small>+${items.length - 3} more</small></button>` : ''}${dots(items)}</div>`;
      if (i % 7 === 6) h += '</div>';
    }
    return `<div class="cal-scroll"><div class="cal-grid month" role="grid" aria-label="${esc(title(st))}">${h}</div></div>`;
  }
  function week(st) {
    const a = weekStart(st.date),
      today = F().ymd(App.clock.now());
    let h = '<div class="cal-row" role="row">';
    for (let i = 0; i < 7; i++) {
      const d = F().addDays(a, i);
      h += `<div class="cal-cell head ${d === today ? 'today' : ''}" role="columnheader">${F().DAYS[F().weekdayOf(d)].slice(0, 3)} ${Number(d.slice(8))}</div>`;
    }
    h += '</div><div class="cal-row" role="row">';
    for (let i = 0; i < 7; i++) {
      const d = F().addDays(a, i),
        items = itemsFor(st, d);
      h += `<div class="cal-cell ${d === today ? 'today' : ''}" role="gridcell" style="min-height:160px"><button type="button" class="dn" data-day="${d}"><small>Open day</small></button>${items.length ? items.map((x) => ev(x, !st.loc)).join('') : '<small class="muted">Nothing scheduled</small>'}</div>`;
    }
    h += '</div>';
    return `<div class="cal-scroll"><div class="cal-grid week" role="grid" aria-label="${esc(title(st))}">${h}</div></div>`;
  }
  function day(st) {
    const items = itemsFor(st, st.date);
    const rows = items.map((i) => ({ start: i.s.start, html: ev(i, !st.loc) }));
    if (st.loc && st.kinds.includes('class')) {
      App.sched.freeSlots(st.loc, st.date).forEach((f) => {
        if (App.sched.mins(f.end) - App.sched.mins(f.start) >= 30)
          rows.push({
            start: f.start,
            html: `<div class="ev ev-avail"><b>${App.icon('check')} ${esc(F().hhmm(f.start))}</b>Available until ${esc(F().hhmm(f.end))}</div>`,
          });
      });
    }
    rows.sort((a, b) => App.sched.mins(a.start) - App.sched.mins(b.start));
    return `<div class="agenda" role="list" aria-label="${esc(title(st))}">${rows.length ? rows.map((r) => `<div class="slot" role="listitem"><div class="time">${esc(F().hhmm(r.start))}</div><div>${r.html}</div></div>`).join('') : App.ui.empty('calendar', 'Nothing is scheduled for this day.')}</div>`;
  }

  function html(st) {
    const views = ['month', 'week', 'day'];
    return `<div class="cal-toolbar"><div class="row"><button type="button" class="btn sm secondary" data-cal="prev" aria-label="Previous ${st.view}">${App.icon('chevl')}</button><button type="button" class="btn sm secondary" data-cal="today">Today</button><button type="button" class="btn sm secondary" data-cal="next" aria-label="Next ${st.view}">${App.icon('chevr')}</button><span class="cal-title" aria-live="polite">${esc(title(st))}</span></div>
      <div class="seg" role="group" aria-label="Calendar view">${views.map((v) => `<button type="button" data-cal-view="${v}" aria-pressed="${st.view === v}" data-testid="cal-${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div></div>
      ${legend()}${{ month, week, day }[st.view](st)}`;
  }

  // Detail modal for a class or scheduled ticket.
  function detail(id, date) {
    const raw = App.store.state.schedules.find((x) => x.id === id);
    if (!raw) return;
    const s = App.sched.hydrate(raw);
    const conflicts = s.kind === 'ticket' ? App.actions.findConflicts(s.locationId, s.date, s.start, s.end, s.id) : [];
    App.modal.open({
      title: s.kind === 'class' ? `${s.courseCode}: ${s.title}` : s.title,
      testid: 'event-modal',
      body: `<dl class="kv"><dt>Location</dt><dd>${esc(App.metrics.locName(s.locationId))}</dd><dt>When</dt><dd>${s.kind === 'class' ? `${esc(F().DAYS[s.weekday])}s, ${esc(App.sched.range(s))} (weekly)` : `${esc(F().dateStrLabel(s.date))}, ${esc(App.sched.range(s))}`}</dd>
        ${s.kind === 'ticket' ? `<dt>Ticket</dt><dd>#${esc(s.ticketId)}</dd><dt>Status</dt><dd>${esc(s.status)}</dd><dt>Assigned to</dt><dd>${esc(s.assigneeId ? App.metrics.userName(s.assigneeId) : 'Unassigned')}</dd><dt>Description</dt><dd>${esc(s.description || '')}</dd>` : '<dt>Source</dt><dd>Class schedule</dd>'}</dl>
        ${conflicts.length ? `<div class="banner warn mt-3">${App.icon('alert')}<div class="grow"><b>Conflict:</b> overlaps ${conflicts.map((c) => esc(App.sched.describe(c))).join(', ')}.</div></div>` : ''}`,
      footer: [{ label: 'Close', cls: 'secondary' }],
    });
  }

  // Shared click handling. st = page calendar state; redraw() re-renders the calendar area.
  function handle(e, st, redraw) {
    const c = e.target.closest('[data-cal]');
    if (c) {
      if (c.dataset.cal === 'today') st.date = F().ymd(App.clock.now());
      else step(st, c.dataset.cal === 'next' ? 1 : -1);
      redraw();
      return true;
    }
    const v = e.target.closest('[data-cal-view]');
    if (v) {
      st.view = v.dataset.calView;
      st.userView = true;
      redraw();
      return true;
    }
    const d = e.target.closest('[data-day]');
    if (d) {
      st.date = d.dataset.day;
      st.view = 'day';
      st.userView = true;
      redraw();
      return true;
    }
    const x = e.target.closest('[data-ev]');
    if (x) {
      detail(x.dataset.ev, x.dataset.date);
      return true;
    }
    return false;
  }
  // Default view follows the live viewport width unless the user picked one.
  function defaultView() {
    const bp = App.viewport.bp();
    return bp === 'sm' ? 'day' : bp === 'md' ? 'week' : 'month';
  }

  App.calendar = { html, handle, defaultView, detail, title, weekStart };
})();
