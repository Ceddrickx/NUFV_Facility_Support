/* Analytics (Administrator): filtered visual insights with Print and CSV export. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;
  const st = () => {
    const session = App.store.session;
    return (session.anFilters = session.anFilters || {
      range: session.anRange || '90',
      category: '',
      location: '',
    });
  };

  function ticketRows(f) {
    const now = App.clock.now();
    const from = f.range === 'all' ? 0 : now - Number(f.range) * 86400000;
    return S().tickets.filter(
      (t) =>
        t.createdAt >= from &&
        (!f.category || t.category === f.category) &&
        (!f.location || t.locationId === f.location),
    );
  }

  const csvCell = (value) => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
  const fullDetails = (t) => String((t && (t.title || t.description)) || '').replace(/\s+/g, ' ').trim();

  function downloadCsv(f) {
    const rows = ticketRows(f).sort(App.filters.newestTicketFirst);
    const data = [
      ['ID', 'Location', 'Category', 'Details', 'Status', 'Created'],
      ...rows.map((t) => [
        t.id,
        App.metrics.locName(t.locationId),
        t.category || '',
        fullDetails(t),
        t.status,
        App.fmt.date(t.createdAt),
      ]),
    ];
    const csv = data.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `nufairview-analytics-${App.fmt.ymd(App.clock.now())}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  App.pages.analytics = {
    title: () => 'Analytics',
    render() {
      const f = st();
      const now = App.clock.now();
      const list = ticketRows(f);
      const p = App.fmt.parts(now);
      const monthStart = App.fmt.at(`${p.y}-${App.fmt.pad(p.m)}-01`, '00:00');
      const thisMonth = list.filter((t) => t.createdAt >= monthStart).length;
      const avg = App.metrics.avgResolution(list);
      const ch = App.chart;
      const cats = ch.top(list.filter((t) => t.category), (t) => t.category, 8);
      const locs = ch.top(list, (t) => App.metrics.locName(t.locationId), 8);
      const fac = list.filter((t) => t.group === 'Facility').length;
      const it = list.filter((t) => t.group === 'IT').length;
      const tri = list.filter((t) => t.group === 'Triage').length;
      const rec = App.metrics
        .recurring()
        .filter((r) => (!f.category || r.category === f.category) && (!f.location || r.locationId === f.location));
      const actions = `<button type="button" class="btn secondary no-print" data-an-print data-testid="analytics-print">${App.icon('printer')}Print</button><button type="button" class="btn no-print" data-an-dl data-testid="analytics-csv">${App.icon('download')}Download CSV</button>`;
      const filter = `<div class="filter-bar no-print" role="group" aria-label="Analytics filters">
        <div><label class="sr-only" for="an-r">Date range</label><select class="select" id="an-r" data-an="range" data-testid="analytics-range">${App.ui.options(
          [
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
            { value: 'all', label: 'All time' },
          ],
          f.range,
        )}</select></div>
        <div><label class="sr-only" for="an-c">Category</label><select class="select" id="an-c" data-an="category" data-testid="analytics-category">${App.ui.options(
          App.C.CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
          f.category,
          'All categories',
        )}</select></div>
        <div><label class="sr-only" for="an-l">Location</label><select class="select" id="an-l" data-an="location" data-testid="analytics-location">${App.ui.options(
          App.metrics.activeLocations().map((l) => ({ value: l.id, label: l.name })),
          f.location,
          'All locations',
        )}</select></div>
      </div>`;
      return `${App.ui.pageHead('Analytics', actions, 'Analyze filtered ticket activity with visual summaries.')}
        <section class="card no-print mb-4" data-testid="analytics-filters">${filter}</section>
        <div class="grid cards kpi" data-testid="analytics-kpis">${App.ui.stat('Tickets This Month', thisMonth, 'calendar', '')}${App.ui.stat('Tickets in range', list.length, 'ticket', '')}${App.ui.stat('Avg Resolution Time', avg ? App.fmt.duration(avg) : 'n/a', 'clock', '')}${App.ui.stat('Recurring Issues', rec.length, 'repeat', rec.length ? 'bad' : 'good', '/recurring')}</div>
        <div class="grid cols-2 mt-4">
          ${ch.card({ id: 'an-cat', title: 'Most Reported Categories', type: 'bar', horizontal: true, labelAlign: 'right', labels: cats.map((x) => x.key), values: cats.map((x) => x.n), summary: cats[0] ? `${cats[0].key} leads with ${cats[0].n} tickets.` : 'No tickets in this filter.', tall: true, dataTable: false })}
          ${ch.card({ id: 'an-loc', title: 'Most Problematic Locations', type: 'bar', horizontal: true, labels: locs.map((x) => x.key), values: locs.map((x) => x.n), summary: locs[0] ? `${locs[0].key} leads with ${locs[0].n} tickets.` : 'No tickets in this filter.', tall: true, dataTable: false })}
          ${ch.card({ id: 'an-grp', title: 'Facility vs IT Issues', type: 'doughnut', labels: ['IT', 'Facility', 'Triage'], values: [it, fac, tri], colors: [ch.PAL.blue, ch.PAL.gold, ch.STATUS_COL.Reopened], summary: `IT: ${it}, Facility: ${fac}, Triage: ${tri}.`, dataTable: false })}
          ${ch.card({ id: 'an-time', title: 'Tickets Over Time (weekly)', type: 'line', tableDesc: true, labels: ch.overTime(list, 12).labels, values: ch.overTime(list, 12).values, summary: 'Tickets created per week over the selected range.', dataTable: false })}
        </div>
        <section class="card mt-4"><div class="card-head"><h2>Recurring Issues</h2><a href="#/recurring">View details</a></div>${rec.length ? rec.map((r) => `<div class="workload-row"><span>${esc(r.category)} <span class="muted">at ${esc(App.metrics.locName(r.locationId))}</span></span><b>${r.count}</b></div>`).join('') : '<p class="muted">None in this filter.</p>'}</section>`;
    },
    mount(el, ctx) {
      el.addEventListener('change', (e) => {
        const filter = e.target.closest('[data-an]');
        if (filter && el.contains(filter)) {
          st()[filter.dataset.an] = filter.value;
          App.store.session.anRange = st().range;
          ctx.refresh();
        }
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-an-print]')) window.print();
        if (e.target.closest('[data-an-dl]')) {
          downloadCsv(st());
          App.toast.show('Analytics CSV downloaded.', 'success');
        }
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
