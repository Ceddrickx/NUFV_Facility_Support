/* My Tickets (every role): list/card toggle, search, filters, sorting. Also holds the shared list-page builder. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};

  // Shared by the My Tickets, Tickets and IT Tickets pages.
  App.listPage = function (cfg) {
    return {
      title: cfg.title,
      render(ctx) {
        const f = App.filters.stateFor(cfg.key(ctx), cfg.init && cfg.init(ctx));
        if (!ctx._q) {
          // apply query-string filters once per visit (for example from Recurring Issues or the global search)
          ctx._q = true;
          // coming from a dashboard box (fresh=1): start from an empty filter so an old search cannot hide tickets
          if (ctx.query.fresh) Object.assign(f, App.filters.blank(), { sort: f.sort });
          ['q', 'category', 'location', 'status', 'group'].forEach((k) => {
            if (ctx.query[k] !== undefined) f[k] = ctx.query[k];
          });
          if (ctx.query.assigned === 'me') f.mine = true;
        }
        const all = cfg.items(ctx);
        const filteredCount = App.filters.apply(all, f).length;
        const hasFilters = App.filters.chips(f).length > 0;
        const countLabel = hasFilters
          ? `Showing ${filteredCount} of ${all.length} ${all.length === 1 ? 'ticket' : 'tickets'}`
          : `${all.length} ${all.length === 1 ? 'ticket' : 'tickets'}`;
        const view = App.store.session.ticketView || 'table';
        const opts = cfg.opts(ctx, view);
        return `${App.ui.pageHead(cfg.heading(ctx), cfg.actions ? cfg.actions(ctx) : '', cfg.sub ? cfg.sub(ctx) : '')}
          ${cfg.before ? cfg.before(ctx, f) : ''}
          <div class="card${cfg.viewToggle ? ' my-tickets-panel' : ''}" data-tl>
            <div class="row between mb-3"><span class="muted small" data-ticket-count>${countLabel}</span>
              ${cfg.viewToggle ? `<div class="seg" role="group" aria-label="View"><button type="button" data-view="table" aria-pressed="${view === 'table'}">${App.icon('list')} List</button><button type="button" data-view="cards" aria-pressed="${view === 'cards'}" data-testid="view-cards">${App.icon('grid')} Cards</button></div>` : ''}</div>
            ${App.ticketList.filterBar(f, opts)}
            <div data-results>${App.ticketList.results(all, f, opts)}</div>
          </div>`;
      },
      mount(el, ctx) {
        const f = App.filters.stateFor(cfg.key(ctx), cfg.init && cfg.init(ctx));
        const cleanup = App.ticketList.bind(
          el,
          f,
          () => cfg.items(ctx),
          () => cfg.opts(ctx, App.store.session.ticketView || 'table'),
        );
        el._ticketListCleanup = cleanup;
        el.addEventListener('click', (e) => {
          const v = e.target.closest('[data-view]');
          if (v) {
            App.store.session.ticketView = v.dataset.view;
            ctx.refresh();
          }
        });
        cfg.mount && cfg.mount(el, ctx, f);
      },
      unmount(el) {
        if (el && el._ticketListCleanup) el._ticketListCleanup();
      },
    };
  };

  App.pages.myTickets = App.listPage({
    key: () => 'my',
    title: () => 'My Tickets',
    heading: () => 'My Tickets',
    viewToggle: true,
    sub: () => 'Every report you have submitted.',
    actions: () => `<a class="btn" href="#/report" data-testid="new-report">${App.icon('plus')}Report an Issue</a>`,
    items: () => App.store.state.tickets.filter((t) => t.reporterId === App.store.state.user),
    opts: (ctx, view) => ({
      view,
      hide: ['group'],
      hideCols: ['Assigned To'].filter(() => false),
      caption: 'My tickets',
      tableClass: 'tbl-mine',
    }),
  });
})();
