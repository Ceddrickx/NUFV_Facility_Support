/* Staff ticket lists. One page module, three variants chosen by the route: all (Admin Tickets), fmo (FMO Tickets) and it (IT Tickets).
   FMO and IT technicians get an "Assigned to me" filter; it replaces the old separate Assigned Tickets screen. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const S = () => App.store.state;
  const variant = (ctx) => ctx.route.variant;
  const tech = () => S().role === 'fmo' || S().role === 'it';

  App.pages.allTickets = App.listPage({
    key: (ctx) => `${variant(ctx)}-${S().role}`,
    init: () => ({}),
    title: (ctx) => ctx.route.title,
    heading: (ctx) => ctx.route.title,
    sub: (ctx) =>
      ({
        all:
          S().role === 'admin'
            ? 'Every ticket in the system.'
            : 'Every ticket in the system.',
        fmo: 'Tickets routed to Facility. Use "Assigned to me" to see only your tickets.',
        it: 'Tickets routed to IT. Use "Assigned to me" to see only your tickets.',
      })[variant(ctx)],
    items(ctx) {
      const list = S().tickets.filter((t) => App.actions.canSee(t));
      if (variant(ctx) === 'it') return list.filter((t) => t.group === 'IT');
      if (variant(ctx) === 'fmo') return list.filter((t) => t.group === 'Facility');
      return list;
    },
    opts: (ctx) => ({
      view: 'table',
      hide: variant(ctx) === 'it' || variant(ctx) === 'fmo' ? ['group'] : [],
      showReporter: true,
      caption: ctx.route.title,
      mine: tech(),
    }),
  });
})();
