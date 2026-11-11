/* Assignments (Administrator): Pending and Reopened queue with the auto-routed suggestion, plus a workload panel. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;

  App.pages.assignments = {
    title: () => 'Assignments',
    render() {
      const M = App.metrics;
      const queue = S()
        .tickets.filter((t) => t.status === 'Pending' || t.status === 'Reopened')
        .sort(
          (a, b) =>
            (b.status === 'Reopened') - (a.status === 'Reopened') ||
            App.filters.newestTicketFirst(a, b),
        );
      const wl = M.workload();
      const max = Math.max(1, ...wl.map((w) => w.active));
      const cols = [
        {
          h: 'Ticket',
          f: (t) => `<a href="#/tickets/${esc(t.id)}">#${esc(t.id)}</a><br><span class="small">${esc(App.fmt.ticketTitle(t))}</span>`,
        },
        { h: 'Status', f: (t) => App.badges.statusBadge(t.status) },
        { h: 'Location', f: (t) => esc(M.locName(t.locationId)) },
        {
          h: 'Auto-routed suggestion',
          f: (t) => {
            const s = App.ticketActions.suggestion(t);
            return `${esc(t.group === 'Triage' ? 'Administrator triage' : t.group)}: <b>${s ? esc(s.u.name) : 'n/a'}</b> ${App.badges.simTag('UI Simulation')}`;
          },
        },
        {
          h: 'Actions',
          cls: 'actions',
          f: (t) =>
            `<button type="button" class="btn sm accent" data-tact="assign" data-id="${esc(t.id)}" data-testid="assign-${esc(t.id)}">${t.assigneeId ? 'Reassign' : 'Assign'}</button>`,
        },
      ];
      return `${App.ui.pageHead('Assignments', '', 'Pending and reopened tickets. Reopened tickets appear first.')}
        <div class="detail-grid main-side"><section class="card minw-0" aria-labelledby="q"><h2 id="q">Queue (${queue.length})</h2>${queue.length ? App.ui.table(cols, queue, { caption: 'Assignment queue', testid: 'assign-queue' }) : App.ui.empty('check', 'The queue is empty. Every ticket has an owner.')}</section>
        <section class="card" aria-labelledby="w"><h2 id="w">Workload</h2>${wl.map((w) => { const workerName = w.user.fullName || w.user.name; const workerRole = App.metrics.roleLabel(w.user); return `<div class="bar-row"><span><a href="#/users/${encodeURIComponent(w.user.id)}">${esc(workerName)}</a>${workerRole ? ` <span class="small muted workload-role" aria-label="${esc(workerRole)}">&middot; ${esc(workerRole)}</span>` : ''}</span><div class="bar" role="img" aria-label="${w.active} active tickets"><i style="width:${(w.active / max) * 100}%"></i></div><b>${w.active}</b></div>`; }).join('')}
        <p class="help">Active tickets per person.</p></section></div>`;
    },
    mount(el) {
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-tact]');
        if (a) App.ticketActions.run(a.dataset.tact, a.dataset.id);
      });
    },
  };
})();
