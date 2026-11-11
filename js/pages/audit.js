/* Audit Activity (Administrator): filter by actor, action type and date. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;
  const st = () =>
    (App.store.session.audit = App.store.session.audit || { actor: '', type: '', from: '', to: '', limit: 60 });

  function filtered() {
    const f = st();
    const from = f.from ? App.fmt.at(f.from, '00:00') : null,
      to = f.to ? App.fmt.at(f.to, '23:59') : null;
    return S().auditLog.filter(
      (a) =>
        (!f.actor || a.actorId === f.actor) &&
        (!f.type || App.auditTimeline.typeOf(a) === f.type) &&
        (!from || a.at >= from) &&
        (!to || a.at <= to),
    );
  }

  App.pages.audit = {
    title: () => 'Audit Activity',
    render() {
      const f = st(),
        list = filtered();
      return `${App.ui.pageHead('Audit Activity', '', 'Every change is recorded. Automatic actions are shown as System (automation).')}
        <div class="card"><div class="filter-bar" role="search" aria-label="Filter audit log">
          <div><label class="sr-only" for="au-actor">Actor</label><select class="select" id="au-actor" data-au="actor">${App.ui.options([{ value: 'system', label: 'System (automation)' }, ...S().users.map((u) => ({ value: u.id, label: u.name }))], f.actor, 'All actors')}</select></div>
          <div><label class="sr-only" for="au-type">Action type</label><select class="select" id="au-type" data-au="type">${App.ui.options(
            App.auditTimeline.TYPES.map(([v, l]) => ({ value: v, label: l })),
            f.type,
            'All action types',
          )}</select></div>
          <div><label class="sr-only" for="au-from">From date</label><input class="input" type="date" id="au-from" data-au="from" value="${esc(f.from)}"></div>
          <div><label class="sr-only" for="au-to">To date</label><input class="input" type="date" id="au-to" data-au="to" value="${esc(f.to)}"></div>
          <div><button type="button" class="btn ghost" data-au-clear>Clear all</button></div></div>
          <p class="result-count" role="status">${list.length} entries</p>
          ${App.auditTimeline.html(list.slice(0, f.limit))}
          ${list.length > f.limit ? `<button type="button" class="btn secondary" data-more>Show more</button>` : ''}</div>`;
    },
    mount(el, ctx) {
      el.addEventListener('change', (e) => {
        const t = e.target.closest('[data-au]');
        if (t) {
          st()[t.dataset.au] = t.value;
          st().limit = 60;
          ctx.refresh();
        }
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-more]')) {
          st().limit += 60;
          ctx.refresh();
        }
        if (e.target.closest('[data-au-clear]')) {
          Object.assign(st(), { actor: '', type: '', from: '', to: '', limit: 60 });
          ctx.refresh();
        }
      });
    },
  };
})();
