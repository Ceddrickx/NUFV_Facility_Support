/* Schedule pages. Variants by route: staff (FMO/IT: tickets scheduled for me, toggle to see all,
   and Room Availability so a technician can see when a room is free to start a repair), admin (all rooms + Schedule Ticket with conflict detection).
   Everything is a ticket: a schedule entry is a ticket plus the date and time the work will be done.
   Students and Faculty have no schedule screen. Class schedule and room availability are Future Enhancement Previews (mock data). */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;
  const today = () => App.fmt.ymd(App.clock.now());
  const vOf = (ctx) => ctx.route.variant;

  function st(ctx) {
    const all = (App.store.session.sched = App.store.session.sched || {});
    const k = vOf(ctx);
    if (!all[k]) {
      const u = App.metrics.currentUser();
      all[k] = {
        tab: k === 'staff' ? 'list' : 'calendar',
        view: App.calendar.defaultView(),
        date: today(),
        loc: '',
        userView: false,
        mineOnly: App.mineToggle.DEFAULT,
        roomLoc: u.usualLocationId || App.db.config.defaultLocationId,
        roomDate: today(),
      };
    }
    const s = all[k];
    if (!s.userView) s.view = App.calendar.defaultView(); // follows the live viewport until the user chooses
    return s;
  }
  const calState = (ctx, s) => ({
    view: s.view,
    date: s.date,
    loc: s.loc,
    kinds: vOf(ctx) === 'staff' ? ['ticket'] : ['class', 'ticket'],
    assignee: vOf(ctx) === 'staff' && s.mineOnly ? S().user : '',
  });

  /* ---------- Room availability ---------- */
  function rooms(ctx, s) {
    const loc = App.metrics.loc(s.roomLoc);
    const date = s.roomDate;
    const items = App.sched.itemsOn(date, s.roomLoc).filter(App.sched.live);
    const free = App.sched.freeSlots(s.roomLoc, date);
    const nowMin = App.fmt.parts(App.clock.now());
    const mNow = nowMin.h * 60 + nowMin.min;
    const inUse =
      date === today() && items.find((i) => App.sched.mins(i.start) <= mNow && App.sched.mins(i.end) > mNow);
    const status =
      loc && loc.status !== 'Active'
        ? ['ev-unavail', 'x', 'Unavailable: closed for repairs']
        : date === today()
          ? inUse
            ? ['ev-unavail', 'x', `In use now: ${App.sched.describe(inUse)}`]
            : ['ev-avail', 'check', 'Available now']
          : ['ev-avail', 'check', 'See free periods below'];
    const nf = App.sched.nextFree(s.roomLoc, 60, 5); // suggested repair window (future enhancement preview): first free period of 1 h or more in the next 5 days
    const repair = nf
      ? `<div class="banner info mt-3">${App.icon('sparkle')}<div class="grow"><b>Suggested repair window:</b> ${esc(App.fmt.dayLabel(nf.date))}, ${esc(App.fmt.hhmm(nf.slot.start))} to ${esc(App.fmt.hhmm(nf.slot.end))} ${App.badges.futureTag()}</div></div>`
      : '';
    return `<div class="card"><div class="form-grid"><div class="field"><label for="rm-loc">Room</label><select class="select" id="rm-loc" data-rm="roomLoc" data-testid="room-select">${App.ui.locOptions(s.roomLoc, null)}</select></div>
        <div class="field"><label for="rm-date">Date</label><input class="input" type="date" id="rm-date" data-rm="roomDate" value="${esc(date)}"></div></div>
      <p><span class="ev ${status[0]}" style="display:inline-block;width:auto">${App.icon(status[1] === 'x' ? 'alert' : 'check')} ${esc(status[2])}</span> ${App.badges.futureTag()}</p>
      <h3>Free periods on ${esc(App.fmt.dateStrLabel(date))}</h3><div class="room-free">${free.length ? free.map((f) => `<span class="ev ev-avail">${App.icon('check')} ${esc(App.fmt.hhmm(f.start))} to ${esc(App.fmt.hhmm(f.end))}</span>`).join('') : '<span class="muted">Fully booked.</span>'}</div>
      <h3>Scheduled that day</h3>${items.length ? `<ul class="feed">${items.map((i) => `<li><b>${esc(App.fmt.hhmm(i.start))} to ${esc(App.fmt.hhmm(i.end))}</b> ${esc(App.sched.describe(i))} <span class="muted small">(${i.kind === 'class' ? 'class' : 'ticket'})</span></li>`).join('')}</ul>` : '<p class="muted">Nothing scheduled.</p>'}
      ${repair}
    </div>`;
  }

  /* ---------- Scheduled tickets list (FMO / IT) ---------- */
  function ticketTable(ctx, s) {
    let list = S()
      .schedules.filter((x) => x.kind === 'ticket')
      .map(App.sched.hydrate);
    list = App.mineToggle.filter(list, s.mineOnly);
    list = list.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
    const cols = [
      { h: 'Ticket', f: (b) => `<a href="#/tickets/${esc(b.ticketId)}" data-testid="scheduled-ticket-link">#${esc(b.ticketId)}</a>: ${esc(b.title)}` },
      { h: 'Location', f: (b) => esc(App.metrics.locName(b.locationId)) },
      { h: 'Assigned To', f: (b) => esc(App.metrics.userName(b.assigneeId)) },
      { h: 'Status', f: (b) => App.badges.statusBadge(b.status) },
      {
        h: 'Date',
        f: (b) => `${esc(App.fmt.dayLabel(b.date))}<br><span class="small muted">${esc(App.sched.range(b))}</span>`,
      },
      {
        h: 'Actions',
        cls: 'actions',
        f: (b) => `<a class="btn sm secondary" href="#/tickets/${esc(b.ticketId)}" data-testid="sched-view">View</a>`,
      },
    ];
    return list.length
      ? App.ui.table(cols, list, { caption: 'Scheduled tickets', testid: 'maint-table' })
      : App.ui.empty('calendar', s.mineOnly ? 'No tickets are scheduled for you.' : 'No tickets are scheduled.');
  }

  /* ---------- Schedule Ticket modal (Administrator) ---------- */
  function openSchedule(prefill) {
    prefill = prefill || {};
    const open = S()
      .tickets.filter(App.sched.isOpen)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    const body = `<div class="form-grid">
      ${App.ui.field(
        'sm-ticket',
        'Ticket',
        `<select class="select" id="sm-ticket" data-testid="sm-ticket">${App.ui.options(
          open.map((t) => ({ value: t.id, label: `#${t.id}: ${App.fmt.ticketTitle(t)} (${App.metrics.locName(t.locationId)})` })),
          prefill.ticketId || '',
          'Select ticket',
        )}</select>`,
        { required: true, help: 'Only open tickets can be scheduled.' },
      )}
      ${App.ui.field('sm-date', 'Date', `<input class="input" type="date" id="sm-date" min="${today()}" data-testid="sm-date">`, { required: true })}
      ${App.ui.field('sm-start', 'Start Time', '<input class="input" type="time" id="sm-start" data-testid="sm-start">', { required: true })}
      ${App.ui.field('sm-end', 'End Time', '<input class="input" type="time" id="sm-end" data-testid="sm-end">', { required: true })}</div>
      <p class="muted small" id="sm-info" aria-live="polite"></p>
      <div id="sm-warn"></div>`;
    const read = (h) => {
      const q = (i) => h.el.querySelector(i).value;
      return { ticketId: q('#sm-ticket'), date: q('#sm-date'), start: q('#sm-start'), end: q('#sm-end') };
    };
    const map = { ticketId: 'sm-ticket', date: 'sm-date', start: 'sm-start', end: 'sm-end' };
    const done = (r, f) => {
      App.toast.fromResult(r);
      const s = App.store.session.sched && App.store.session.sched.admin;
      if (s) {
        s.date = f.date;
        s.loc = r.block.locationId;
        s.tab = 'calendar';
        s.userView = true;
        s.view = 'day';
      }
    };
    const normal = (h) => [
      { label: 'Cancel', cls: 'secondary' },
      {
        label: 'Save',
        testid: 'sm-save',
        onClick: () => {
          const f = read(h),
            r = App.actions.scheduleTicket(f);
          if (r.needsConfirm) {
            warn(h, f, r.conflicts);
            return false;
          }
          if (!r.ok) {
            App.ui.showErrors(h.el, r.errors || {}, map);
            if (!r.errors) App.toast.fromResult(r);
            return false;
          }
          done(r, f);
        },
      },
    ];
    function warn(h, f, conflicts) {
      h.el.querySelector('#sm-warn').innerHTML =
        `<div class="banner warn" role="alert" data-testid="conflict-warning">${App.icon('alert')}<div class="grow"><b>Schedule conflict.</b> This time overlaps:<ul>${conflicts.map((c) => `<li>${esc(App.sched.describe(c))} (${c.kind}, ${esc(App.sched.range(c))})</li>`).join('')}</ul></div></div>`;
      h.setFooter([
        {
          label: 'Pick another time',
          cls: 'secondary',
          testid: 'sm-pick',
          onClick: () => {
            h.el.querySelector('#sm-warn').innerHTML = '';
            h.setFooter(normal(h));
            h.el.querySelector('#sm-start').focus();
            return false;
          },
        },
        {
          label: 'Schedule anyway',
          cls: 'accent',
          testid: 'sm-anyway',
          onClick: () => {
            const r = App.actions.scheduleTicket(f, true);
            if (!r.ok) {
              App.toast.fromResult(r);
              return false;
            }
            done(r, f);
          },
        },
      ]);
    }
    App.modal.open({
      title: 'Schedule Ticket',
      body,
      wide: true,
      testid: 'schedule-modal',
      onOpen: (h) => {
        if (prefill.date) h.el.querySelector('#sm-date').value = prefill.date;
        const info = () => {
          const t = S().tickets.find((x) => x.id === h.el.querySelector('#sm-ticket').value);
          h.el.querySelector('#sm-info').textContent = t
            ? `Location: ${App.metrics.locName(t.locationId)}. Assigned to: ${t.assigneeId ? App.metrics.userName(t.assigneeId) : 'nobody yet'}.`
            : '';
        };
        h.el.querySelector('#sm-ticket').addEventListener('change', info);
        info();
        h.setFooter(normal(h));
      },
      footer: [{ label: 'Cancel', cls: 'secondary' }],
    });
  }

  /* ---------- page ---------- */
  App.pages.schedule = {
    onBreakpoint: true,
    title: (ctx) => ctx.route.title,
    render(ctx) {
      const s = st(ctx),
        v = vOf(ctx),
        role = S().role;
      if (ctx.query.room && !ctx._room && App.metrics.activeLocations().some((l) => l.id === ctx.query.room)) {
        ctx._room = true;
        s.tab = 'rooms';
        s.roomLoc = ctx.query.room;
        s.roomDate = today();
      } // opened from a ticket's room link
      const tabs =
        v === 'staff'
          ? [
              { id: 'list', label: 'My List' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'rooms', label: 'Room Availability' },
            ]
          : [
              { id: 'calendar', label: 'Calendar' },
              { id: 'rooms', label: 'Room Availability' },
            ];
      let panel = '';
      const roomSel = (all) =>
        `<div class="field" style="max-width:360px"><label for="cal-loc">Room</label><select class="select" id="cal-loc" data-cal-loc data-testid="cal-room">${App.ui.locOptions(s.loc, all ? 'All rooms' : null)}</select></div>`;
      if (s.tab === 'rooms') panel = rooms(ctx, s);
      else if (v === 'staff' && s.tab === 'list')
        panel = `<div class="card">${App.mineToggle.html(s.mineOnly)}${ticketTable(ctx, s)}</div>`;
      else
        panel = `<div class="card">${roomSel(true)}<div data-cal-host>${App.calendar.html(calState(ctx, s))}</div></div>`;
      const badges = s.tab === 'rooms' || v === 'admin' ? App.badges.futureTag() : '';
      return `${App.ui.pageHead(ctx.route.title, `${badges}${role === 'admin' ? `<button type="button" class="btn" data-open-sm data-testid="schedule-ticket">${App.icon('plus')}Schedule Ticket</button>` : ''}`, v === 'staff' ? 'Scheduled tickets and room availability, so you can see when a room is free to start a repair.' : '')}
        ${App.tabs.render(tabs, s.tab, 'sched')}<div role="tabpanel" id="panel-sched">${panel}</div>`;
    },
    mount(el, ctx) {
      const s = () => st(ctx);
      const redrawCal = () => {
        const h = el.querySelector('[data-cal-host]');
        if (h) h.innerHTML = App.calendar.html(calState(ctx, s()));
      };
      App.tabs.bind(el, (key, id) => {
        s().tab = id;
        ctx.refresh();
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-open-sm]')) {
          openSchedule();
          return;
        }
        App.calendar.handle(e, s(), redrawCal);
      });
      el.addEventListener('change', (e) => {
        const t = e.target.closest('[data-cal-loc],[data-rm],[data-mine]');
        if (!t || !el.contains(t)) return;
        if (t.matches('[data-cal-loc]')) {
          s().loc = t.value;
          redrawCal();
        } else if (t.matches('[data-rm]')) {
          s()[t.dataset.rm] = t.value;
          ctx.refresh();
        } else if (t.matches('[data-mine]')) {
          s().mineOnly = t.checked;
          ctx.refresh();
        }
      });
    },
  };
  App.scheduleModal = openSchedule;
})();
