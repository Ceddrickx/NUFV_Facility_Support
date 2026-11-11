/* Ticket History (FMO, IT): Closed / Verified tickets, searchable by location or ticket. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;
  const st = () => (App.store.session.histF = App.store.session.histF || { q: '', mine: App.mineToggle.DEFAULT });

  function entries() {
    const f = st(),
      role = S().role;
    const group = role === 'fmo' ? 'Facility' : 'IT';
    const out = [];
    S()
      .tickets.filter((t) => {
        const triage = t.group === 'Triage' || /^TR-/.test(String(t.ticketNo || t.id)); // Triage (TR) tickets are always listed
        return App.actions.canSee(t) && t.status === 'Closed / Verified' && (t.group === group || triage);
      })
      .filter((t) => App.mineToggle.filter([t], f.mine).length)
      .forEach((t) =>
        out.push({
          at: t.closedAt || t.updatedAt,
          createdAt: t.createdAt,
          loc: t.locationId,
          ticketId: t.id,
          ticketNo: t.ticketNo,
          ticketYear: t.ticketYear,
          ticketSeq: t.ticketSeq,
          ticketIdInternal: t.ticketId,
          title: App.fmt.ticketTitle(t),
          what: `#${t.id}: ${App.fmt.ticketTitle(t)}`,
          link: `#/tickets/${t.id}`,
          who: t.assigneeId,
          summary: t.resolutionNote || 'Verified by reporter.',
          hay: `${t.id} ${App.fmt.ticketTitle(t)} ${t.description || ''}`,
        }),
      );
    const q = f.q.trim().toLowerCase();
    return out
      .filter((e) => !q || `${App.metrics.locName(e.loc)} ${e.loc} ${e.hay} ${e.what}`.toLowerCase().includes(q))
      .sort((a, b) => b.at - a.at || App.filters.newestTicketFirst(a, b));
  }

  App.pages.history = {
    title: () => 'Ticket History',
    render() {
      const f = st(),
        list = entries();
      const cols = [
        { h: 'Ticket', f: (e) => `<a href="${esc(e.link)}" data-testid="history-ticket-link">#${esc(e.ticketId)}</a>: ${esc(e.title)}` },
        { h: 'Location', f: (e) => esc(App.metrics.locName(e.loc)) },
        { h: 'Technician', f: (e) => esc(App.metrics.userName(e.who)) },
        { h: 'Resolution summary', f: (e) => esc(e.summary) },
        { h: 'Date', f: (e) => esc(App.fmt.date(e.at)), cls: 'nowrap' },
        {
          h: 'Actions',
          cls: 'actions',
          f: (e) => `<a class="btn sm secondary" href="${esc(e.link)}" data-testid="history-view">View</a>`,
        },
      ];
      return `${App.ui.pageHead('Ticket History', '', 'Completed tickets, searchable by location or ticket.')}
        <div class="card"><div class="filter-bar" role="search"><div class="search"><label class="sr-only" for="hs-q">Search history</label><input class="input" id="hs-q" type="search" data-focus-key="hs-q" data-hf="q" value="${esc(f.q)}" placeholder="Search by location or ticket (for example Computer Laboratory 3)" data-testid="history-search"></div></div>
          ${App.mineToggle.html(f.mine)}
          <p class="result-count" role="status">${list.length} ${list.length === 1 ? 'ticket' : 'tickets'}</p>${list.length ? App.ui.table(cols, list.slice(0, 150), { caption: 'Ticket history', testid: 'history-table' }) : App.ui.empty('history', f.mine ? 'No completed tickets assigned to you match.' : 'No history matches your search.')}</div>`;
    },
    mount(el, ctx) {
      let t;
      el.addEventListener('input', (e) => {
        const i = e.target.closest('[data-hf="q"]');
        if (i) {
          clearTimeout(t);
          t = setTimeout(() => {
            st().q = i.value;
            ctx.refresh();
          }, 150);
        }
      });
      el.addEventListener('change', (e) => {
        const mine = e.target.closest('[data-mine]');
        if (mine && el.contains(mine)) {
          st().mine = mine.checked;
          ctx.refresh();
        }
      });
    },
  };
})();
