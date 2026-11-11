/* Role dashboards: Student/Faculty, FMO Technician, IT Personnel, Administrator. All numbers are computed from the store. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;
  const M = () => App.metrics;

  // The same greeting card for every role; the name and role label come from the signed-in account.
  const welcome = () => {
    const me = M().currentUser();
    return App.greetingCard({ name: me.welcomeName || me.name, roleLabel: M().roleLabel(me) });
  };

  function maintList(blocks, emptyMsg) {
    if (!blocks.length) return App.ui.empty('calendar', emptyMsg || 'No scheduled tickets in the next 7 days.');
    const me = M().currentUser();
    const canOpen = (b) => !b.ticketId || me.role === 'admin' || b.reporterId === me.id || b.assigneeId === me.id;
    return `<ul class="feed" data-testid="upcoming-maintenance">${blocks
      .map(
        (b) => `<li><div><b>${esc(M().locName(b.locationId))}</b>, ${b.ticketId && canOpen(b) ? `<a href="#/tickets/${esc(b.ticketId)}">${esc(b.title)}</a>` : esc(b.title)}</div>
      <div class="when"><b>${esc(App.fmt.dayLabel(b.date))}</b>, ${esc(App.sched.range(b))} ${b.status === 'In Progress' ? App.badges.statusBadge('In Progress') : ''}${b.assigneeId ? ' &middot; ' + esc(M().userName(b.assigneeId)) : ''}</div></li>`,
      )
      .join('')}</ul>`;
  }

  /* ---------- Student / Faculty ---------- */
  function student() {
    const me = M().currentUser();
    const mine = S().tickets.filter((t) => t.reporterId === me.id);
    const c = M().counts(mine);
    const locs = new Set(
      [me.usualLocationId, ...mine.filter((t) => M().isActive(t)).map((t) => t.locationId)].filter(Boolean),
    );
    const upcoming = App.sched.upcoming([...locs], 7).filter((b) => !b.ticketId || b.reporterId === me.id);
    const awaiting = mine.filter((t) => t.status === 'Resolved');
    const recent = [...mine].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 2);
    return `${welcome()}
      <div class="row dashboard-actions my-4"><a class="btn" href="#/report?new=1" data-testid="report-issue-btn">${App.icon('plus')}Report an Issue</a><a class="btn secondary" href="#/my-tickets">${App.icon('ticket')}My Tickets</a></div>
      ${awaiting.length ? `<div class="mb-4">${App.ui.banner('gold', 'check', `<b>Is your issue resolved?</b> ${awaiting.length === 1 ? 'A ticket is' : awaiting.length + ' tickets are'} waiting for your verification: ${awaiting.map((t) => `<a href="#/tickets/${esc(t.id)}">#${esc(t.id)}</a>`).join(', ')}.`)}</div>` : ''}
      <div class="grid cards kpi">${App.ui.stat('Active Tickets', c.open, 'active', 'blue', '/my-tickets?status=@active&fresh=1')}${App.ui.stat('Pending', c.pending, 'clock', 'gold', '/my-tickets?status=Pending&fresh=1')}${App.ui.stat('In Progress', c.inProgress, 'milestone', 'indigo', '/my-tickets?status=In%20Progress&fresh=1')}${App.ui.stat('Resolved', c.resolved, 'checkcircle', 'good', '/my-tickets?status=@resolved&fresh=1')}</div>
      <div class="grid two mt-4">
        <section class="card" aria-labelledby="rt"><div class="card-head"><h2 id="rt">Recent tickets</h2><a href="#/my-tickets">View all</a></div>${recent.length ? App.ticketCard.list(recent) : App.ui.empty('ticket', 'You have not reported any issues yet.', '<a class="btn" href="#/report?new=1">Report an Issue</a>')}</section>
        <section class="card" aria-labelledby="um"><div class="card-head"><h2 id="um">Upcoming Scheduled Tickets</h2>${App.badges.futureTag()}</div>
          <p class="muted small">Next 7 days at your usual location and where you have open tickets.</p>${maintList(upcoming)}</section>
      </div>`;
  }

  /* ---------- Technician rows (FMO and IT) ---------- */
  function techTable(list) {
    if (!list.length) return App.ui.empty('check', 'Nothing is assigned to you right now.');
    const A = App.actions;
    const cols = [
      {
        h: 'Ticket',
        f: (t) => `<a href="#/tickets/${esc(t.id)}">#${esc(t.id)}</a><br><span class="small">${esc(App.fmt.ticketTitle(t))}</span>`,
      },
      { h: 'Location', f: (t) => esc(M().locName(t.locationId)) },
      { h: 'Status', f: (t) => App.badges.statusBadge(t.status) },
      {
        h: 'Actions',
        cls: 'actions',
        f: (t) => {
          const a = (act, label, cls, arg) =>
            `<button type="button" class="btn sm ${cls || ''}" data-tact="${act}" data-id="${esc(t.id)}" ${arg ? `data-arg="${esc(arg)}"` : ''}>${label}</button>`;
          let primary = '';
          if (A.can('start', t)) primary += a('start', 'Update: Start Work');
          if (A.can('reaccept', t)) primary += a('reaccept', 'Re-accept');
          if (A.can('resolve', t)) primary += a('resolve', 'Mark Resolved', 'success');
          return (
            `<span class="act-grid"><a class="btn sm secondary" href="#/tickets/${esc(t.id)}">View</a>` +
            `<span class="act-primary">${primary}</span>` +
            a('note', 'Add Note', 'quiet') +
            a('upload', 'Upload Photo', 'quiet', 'repair-photo') +
            a('upload', 'Upload Video', 'quiet', 'repair-video') +
            '</span>'
          );
        },
      },
    ];
    return App.ui.table(cols, list, { caption: 'Tickets assigned to me', testid: 'assigned-table' });
  }
  const mineActive = () =>
    S()
      .tickets.filter((t) => t.assigneeId === S().user && M().isActive(t))
      .sort(App.filters.newestTicketFirst);

  function fmo() {
    const mine = S().tickets.filter((t) => t.assigneeId === S().user);
    const c = M().counts(mine);
    const open = S().tickets.filter((t) => t.group === 'Facility' && t.status === 'Pending');
    const upc = App.sched.upcoming([], 7, true).filter((b) => b.assigneeId === S().user);
    return `${welcome()}<div class="grid cards kpi mt-4">${App.ui.stat('Assigned Tickets', c.active, 'assignment', 'blue', '/fmo-tickets?assigned=me&status=@notclosed&fresh=1')}${App.ui.stat('In Progress', c.inProgress, 'milestone', 'indigo', '/fmo-tickets?assigned=me&status=In%20Progress&fresh=1')}</div>
      <section class="card mt-4" aria-labelledby="at"><div class="card-head"><h2 id="at">My assigned tickets</h2></div>${techTable(mineActive())}</section>
      <div class="grid two mt-4">
        <section class="card"><div class="card-head"><h2>FMO Tickets</h2><a href="#/fmo-tickets">View all tickets</a></div>${open.length ? App.ticketCard.list(open.slice(0, 4), { reporter: true }) : App.ui.empty('check', 'No facility tickets are waiting.')}</section>
        <section class="card"><div class="card-head"><h2>My upcoming tasks</h2><a class="btn sm secondary" href="#/scheduled">Scheduled tickets</a></div>${maintList(upc, 'No tickets are scheduled for you this week.')}</section></div>`;
  }

  function it() {
    const itAll = S().tickets.filter((t) => t.group === 'IT');
    const act = itAll.filter(M().isActive);
    const mine = act.filter((t) => t.assigneeId === S().user).length;
    const acct = act.filter((t) => App.filters.ACCOUNT_CATEGORIES.includes(t.category)).length;
    const waiting = itAll.filter((t) => t.status === 'Pending');
    const upc = App.sched.upcoming([], 7, true).filter((b) => b.assigneeId === S().user);
    return `${welcome()}<div class="grid cards kpi mt-4">${App.ui.stat('IT Tickets', act.length, 'ticket', 'blue', '/it-tickets?status=@notclosed&fresh=1')}${App.ui.stat('Assigned to Me', mine, 'assignment', 'blue', '/it-tickets?assigned=me&status=@notclosed&fresh=1')}${App.ui.stat('Account Issues', acct, 'key', 'indigo', '/it-tickets?category=@account&status=@notclosed&fresh=1')}</div>
      <section class="card mt-4" aria-labelledby="at"><div class="card-head"><h2 id="at">My assigned tickets</h2></div>${techTable(mineActive())}</section>
      <div class="grid two mt-4">
        <section class="card" data-testid="pending-it"><div class="card-head"><h2>IT Tickets</h2><a href="#/it-tickets">View all tickets</a></div>${waiting.length ? App.ticketCard.list(waiting.slice(0, 4), { reporter: true }) : App.ui.empty('check', 'No IT tickets are waiting.')}</section>
        <section class="card"><div class="card-head"><h2>My upcoming tasks</h2><a class="btn sm secondary" href="#/scheduled">Scheduled tickets</a></div>${maintList(upc, 'No tickets are scheduled for you this week.')}</section></div>`;
  }

  /* ---------- Administrator ---------- */
  function admin() {
    const all = S().tickets;
    const c = M().counts(all);
    const rec = M().recurring().slice(0, 4);
    const wl = M().workload();
    const rep = App.chart.top(S().tickets, (t) => t.reporterId, 5);
    const ch = App.chart,
      top = ch.top;
    const cats = top(all.filter((t) => t.category), (t) => t.category, 7),
      locs = top(all, (t) => M().locName(t.locationId), 7);
    const ot = ch.overTime(all, 12);
    const st = App.C.STATUS_ORDER.map((s) => [s, all.filter((t) => t.status === s).length]);
    return `${welcome()}
      <div class="grid cards kpi mt-4">${App.ui.stat('Total Tickets', c.total, 'ticket', 'blue', '/tickets?fresh=1')}${App.ui.stat('Active', c.open, 'active', 'blue', '/tickets?status=@active&fresh=1')}${App.ui.stat('Pending', c.pending, 'clock', 'gold', '/tickets?status=Pending&fresh=1')}${App.ui.stat('In Progress', c.inProgress, 'milestone', 'indigo', '/tickets?status=In%20Progress&fresh=1')}${App.ui.stat('Resolved', c.resolved, 'checkcircle', 'good', '/tickets?status=@resolved&fresh=1')}</div>
      <div class="grid cols-2 mt-4">
        ${ch.card({ id: 'a-cat', title: 'Tickets by Category', type: 'bar', horizontal: true, labelAlign: 'right', labels: cats.map((x) => x.key), values: cats.map((x) => x.n), summary: cats[0] ? `Most reported: ${cats[0].key} (${cats[0].n} tickets).` : '' })}
        ${ch.card({ id: 'a-status', title: 'Tickets by Status', type: 'doughnut', labels: st.map((x) => x[0]), values: st.map((x) => x[1]), colors: st.map((x) => ch.STATUS_COL[x[0]]), summary: `${c.open} active, ${c.resolved - c.closed} resolved and ${c.closed} closed of ${c.total} tickets.` })}
        ${ch.card({ id: 'a-loc', title: 'Tickets by Location', type: 'bar', horizontal: true, labels: locs.map((x) => x.key), values: locs.map((x) => x.n), summary: locs[0] ? `Most problematic: ${locs[0].key} (${locs[0].n} tickets).` : '' })}
        ${ch.card({ id: 'a-time', title: 'Tickets Over Time (weekly)', type: 'line', tableDesc: true, labels: ot.labels, values: ot.values, summary: `${ot.values.reduce((a, b) => a + b, 0)} tickets created in the last 12 weeks.` })}
      </div>
      <div class="grid cols-2 mt-4">
        <section class="card" aria-labelledby="rc"><div class="card-head"><h2 id="rc">Recurring Issues</h2><a href="#/recurring">View all</a></div>${rec.length ? rec.map((r) => `<div class="workload-row"><span>${esc(r.category)}<br><span class="small muted">${esc(M().locName(r.locationId))}</span></span><b>${r.count} reports</b></div>`).join('') : App.ui.empty('repeat', 'No recurring issues.')}</section>
        <section class="card" aria-labelledby="wl"><div class="card-head"><h2 id="wl">Workload (active tickets)</h2><a href="#/assignments">Assignments</a></div>${wl.map((w) => { const workerName = w.user.fullName || w.user.name; const workerRole = App.metrics.roleLabel(w.user); return `<div class="workload-row"><span><a href="#/users/${encodeURIComponent(w.user.id)}">${esc(workerName)}</a>${workerRole ? ` <span class="small muted workload-role" aria-label="${esc(workerRole)}">&middot; ${esc(workerRole)}</span>` : ''}</span><b>${w.active}</b></div>`; }).join('')}</section>
        <section class="card" aria-labelledby="tr"><div class="card-head"><h2 id="tr">Top Reporters</h2><a href="#/users">Users</a></div>${rep.length ? rep.map((r) => { const reporter = S().users.find((u) => u.id === r.key); const reporterName = reporter && reporter.fullName ? reporter.fullName : M().userName(r.key); const reporterRole = reporter ? App.metrics.roleLabel(reporter) : ''; const reporterLink = reporter ? `<a href="#/users/${encodeURIComponent(reporter.id)}">${esc(reporterName)}</a>` : esc(reporterName); return `<div class="workload-row"><span>${reporterLink}${reporterRole ? ` <span class="small muted reporter-role" aria-label="${esc(reporterRole)}">&middot; ${esc(reporterRole)}</span>` : ''}</span><b>${r.n}</b></div>`; }).join('') : App.ui.empty('file', 'No reports yet.')}</section>
      </div>`;
  }

  App.pages.dashboard = {
    title: () => 'Dashboard',
    render() {
      return { student, fmo, it, admin }[S().role]();
    },
    mount(el) {
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-tact]');
        if (a) App.ticketActions.run(a.dataset.tact, a.dataset.id, a.dataset.arg);
      });
    },
    after(el) {
      App.chart.mount(el);
    },
    unmount() {
      App.chart.destroyAll();
    },
  };
})();
