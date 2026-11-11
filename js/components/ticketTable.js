/* TicketTable + FilterBar + SearchBar. Search is instant (debounced ~150 ms); filters combine with AND; the results area
   re-renders on its own so typing never loses focus and filter state survives page re-renders and window resizes. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  const monthName = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return `${App.fmt.MONTHS[m - 1]} ${y}`;
  };
  const addMonth = (ym, n) => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return `${d.getUTCFullYear()}-${App.fmt.pad(d.getUTCMonth() + 1)}`;
  };
  const calendarGrid = (ym, selected) => {
    const today = App.fmt.ymd(App.clock.now());
    const first = `${ym}-01`;
    const lead = App.fmt.weekdayOf(first);
    const days = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5)) - 1 + 1, 0)).getUTCDate();
    return Array.from({ length: lead + days }, (_, i) => {
      if (i < lead) return '<i aria-hidden="true"></i>';
      const d = `${ym}-${App.fmt.pad(i - lead + 1)}`;
      const classes = [d === selected ? 'selected' : '', d === today ? 'today' : ''].filter(Boolean).join(' ');
      return `<button type="button" data-date-day="${d}" class="${classes}" aria-label="${esc(App.fmt.dateStrLabel(d))}">${i - lead + 1}</button>`;
    }).join('');
  };
  const dateField = (key, value) => `<div class="affix date-filter-field">
    <label>${key === 'from' ? 'From' : 'To'}</label>
    <button type="button" class="date-filter-trigger" data-date-open="${key}" aria-expanded="false" aria-haspopup="dialog">
      <span data-date-label="${key}">${esc(value ? App.fmt.dateStrLabel(value) : 'dd/mm/yyyy')}</span>${App.icon('calendar')}
    </button>
  </div>`;
  const datePopover = () => `<div class="date-filter-popover" data-date-popover role="dialog" aria-label="Choose a date" hidden>
    <div class="date-filter-head"><button type="button" class="date-filter-nav" data-date-month="-1" aria-label="Previous month">${App.icon('chevl')}</button><strong data-date-title></strong><button type="button" class="date-filter-nav" data-date-month="1" aria-label="Next month">${App.icon('chevr')}</button></div>
    <div class="date-filter-week">${['Su','Mo','Tu','We','Th','Fr','Sa'].map((x) => `<span>${x}</span>`).join('')}</div>
    <div class="date-filter-grid" data-date-grid></div>
    <div class="date-filter-foot"><button type="button" data-date-today>Today</button><button type="button" data-date-clear>Clear</button></div>
  </div>`;

  function rowActions(t) {
    const A = App.actions;
    let h = `<a class="btn sm secondary" href="#/tickets/${esc(t.id)}" aria-label="View ticket ${esc(t.id)}">View</a>`;
    if (A.can('accept', t) && App.store.state.role !== 'admin')
      h += ` <button type="button" class="btn sm" data-tact="accept" data-id="${esc(t.id)}" aria-label="Accept ticket ${esc(t.id)}">Accept</button>`;
    if (A.can('assign', t) || A.can('reassign', t))
      h += ` <button type="button" class="btn sm accent" data-tact="assign" data-id="${esc(t.id)}" aria-label="${t.assigneeId ? 'Reassign' : 'Assign'} ticket ${esc(t.id)}">${t.assigneeId ? 'Reassign' : 'Assign'}</button>`;
    if (A.can('reaccept', t) && App.store.state.role !== 'admin')
      h += ` <button type="button" class="btn sm" data-tact="reaccept" data-id="${esc(t.id)}">Re-accept</button>`;
    return h;
  }

  // Keep the shared ticket tables compact while preserving the full description on the ticket detail page.
  function detailsPreview(t) {
    const raw = String((t && t.description) || App.fmt.ticketTitle(t) || '').replace(/\s+/g, ' ').trim();
    if (raw.length <= 80) return raw;
    const head = raw.slice(0, 79);
    const boundary = head.lastIndexOf(' ');
    const clipped = (boundary >= 40 ? head.slice(0, boundary) : head).replace(/[\s,;:.!?-]+$/, '');
    return `${clipped}…`;
  }

  function table(tickets, o) {
    o = o || {};
    const M = App.metrics;
    const cols = [
      { h: 'Ticket ID', f: (t) => `<a href="#/tickets/${esc(t.id)}">#${esc(t.id)}</a>`, cls: 'ticket-id' },
      { h: 'Location', f: (t) => esc(M.locName(t.locationId)) },
      { h: 'Category', f: (t) => (t.category ? `${App.icon(App.badges.catIcon(t.category))} ${esc(t.category)}` : '') },
      { h: 'Details', f: (t) => esc(detailsPreview(t)), cls: 'ticket-details' },
      { h: 'Status', f: (t) => App.badges.statusBadge(t.status) },
      {
        h: 'Assigned To',
        f: (t) => (t.assigneeId ? esc(M.userName(t.assigneeId)) : '<span class="muted">Unassigned</span>'),
      },
      { h: 'Date', f: (t) => esc(App.fmt.date(t.createdAt)), cls: 'nowrap' },
      { h: 'Actions', f: rowActions, cls: 'actions' },
    ].filter((c) => !(o.hideCols || []).includes(c.h));
    return App.ui.table(cols, tickets, { caption: o.caption || 'Tickets', testid: 'ticket-table', tableClass: o.tableClass });
  }

  // Filter bar markup. hide: names of controls to leave out.
  function filterBar(f, o) {
    o = o || {};
    const hide = o.hide || [];
    const S = App.store.state;
    const sel = (name, label, opts, ph) =>
      hide.includes(name)
        ? ''
        : `<div><label class="sr-only" for="f-${name}">${label}</label><select class="select" id="f-${name}" data-f="${name}" data-testid="filter-${name}">${App.ui.options(opts, f[name], ph)}</select></div>`;
    const nAct =
      ['status', 'category', 'location', 'group', 'from', 'to'].filter((k) => !hide.includes(k) && f[k])
        .length;
    return `<div class="filter-bar" role="search" aria-label="Filter tickets">
      <div class="search"><label class="sr-only" for="f-q">Search tickets</label><input class="input" id="f-q" type="search" data-f="q" data-focus-key="f-q" value="${esc(f.q)}" placeholder="Search by ID, issue, location, category, reporter or assignee" data-testid="ticket-search"></div>
      ${o.mine ? `<button type="button" class="btn sm secondary mine-toggle" data-mine aria-pressed="${f.mine ? 'true' : 'false'}" data-testid="filter-mine">${App.icon('assignment')}Assigned to me</button>` : ''}
      <button type="button" class="btn sm secondary filter-toggle" data-filters-toggle aria-expanded="false" aria-controls="f-more">${App.icon('filter')}Filters${nAct ? ` <span class="badge-n">${nAct}</span>` : ''}</button>
      <div class="filter-more" id="f-more">
      ${sel('status', 'Status', [...App.filters.STATUS_CHOICES, ...App.C.STATUS], 'All statuses')}
      ${sel(
        'category',
        'Category',
        [...App.filters.CATEGORY_CHOICES, ...App.C.CATEGORIES.map((c) => c.id)],
        'All categories',
      )}
      ${sel(
        'location',
        'Location',
        App.metrics.activeLocations().map((l) => ({ value: l.id, label: l.name })),
        'All locations',
      )}
      ${hide.includes('group') ? '' : sel('group', 'Group', App.C.GROUPS, 'All groups')}
      ${hide.includes('date') ? '' : `${dateField('from', f.from)}${dateField('to', f.to)}<div class="date-filter-host" data-date-host>${datePopover()}</div>`}
      <div><label class="sr-only" for="f-sort">Sort by</label><select class="select" id="f-sort" data-f="sort" data-testid="sort">${App.ui.options(
        [
          ['newest', 'Newest'],
          ['oldest', 'Oldest'],
          ['status', 'Status'],
          ['location', 'Location'],
        ].map((x) => ({ value: x[0], label: `Sort: ${x[1]}` })),
        f.sort,
      )}</select></div>
      </div>
    </div>`;
  }

  function results(all, f, o) {
    const list = App.filters.apply(all, f);
    const chips = App.filters.chips(f);
    const chipHtml = chips.length
      ? `<div class="chips" aria-label="Active filters">${chips.map(([k, l]) => `<span class="chip">${esc(l)}<button type="button" data-clear="${k}" aria-label="Remove filter ${esc(l)}">${App.icon('x')}</button></span>`).join('')}<button type="button" class="btn sm ghost" data-clear="all" data-testid="clear-filters">Clear all</button></div>`
      : '';
    let body;
    if (!list.length)
      body = App.ui.empty(
        'search',
        'No tickets match your search or filters.',
        chips.length ? '<button type="button" class="btn secondary" data-clear="all">Clear all filters</button>' : '',
      );
    else if (o.view === 'cards') body = App.ticketCard.list(list, { reporter: o.showReporter });
    else body = table(list, o);
    return `${chipHtml}<p class="result-count" role="status">${list.length} ${list.length === 1 ? 'ticket' : 'tickets'} found</p>${body}`;
  }

  // Attach handlers once to a page element. getAll() returns the base list (so it is always fresh).
  function bind(el, f, getAll, getOpts) {
    let timer;
    const dateState = { key: '', ym: '' };
    const host = () => el.querySelector('[data-date-host]');
    const popover = () => el.querySelector('[data-date-popover]');
    const syncDateLabels = () => el.querySelectorAll('[data-date-label]').forEach((label) => {
      const value = f[label.dataset.dateLabel];
      label.textContent = value ? App.fmt.dateStrLabel(value) : 'dd/mm/yyyy';
    });
    const closeDatePicker = () => {
      const p = popover();
      if (!p) return;
      p.hidden = true;
      el.querySelectorAll('[data-date-open]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
      dateState.key = '';
    };
    const positionDatePicker = (button) => {
      const p = popover();
      if (!p) return;
      const rect = button.getBoundingClientRect();
      const width = Math.min(300, window.innerWidth - 24);
      let left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      let top = rect.bottom + 8;
      p.style.width = `${width}px`;
      p.style.left = `${left}px`;
      p.style.top = `${top}px`;
      p.style.position = 'fixed';
      if (top + p.offsetHeight > window.innerHeight - 12) p.style.top = `${Math.max(12, rect.top - p.offsetHeight - 8)}px`;
    };
    const renderDatePicker = () => {
      const p = popover();
      if (!p || !dateState.key) return;
      const value = f[dateState.key] || '';
      p.querySelector('[data-date-title]').textContent = monthName(dateState.ym);
      p.querySelector('[data-date-grid]').innerHTML = calendarGrid(dateState.ym, value);
      // Assign (rather than add) handlers because the month header remains in
      // the DOM while only the day grid is redrawn. Re-adding listeners here
      // would make later clicks advance more than one month at a time.
      p.querySelectorAll('[data-date-month]').forEach((button) => { button.onclick = (event) => {
        event.stopPropagation();
        dateState.ym = addMonth(dateState.ym, Number(button.dataset.dateMonth));
        renderDatePicker();
        positionDatePicker(el.querySelector(`[data-date-open="${dateState.key}"]`));
      }; });
      p.querySelectorAll('[data-date-day]').forEach((button) => { button.onclick = (event) => {
        event.stopPropagation();
        f[dateState.key] = button.dataset.dateDay;
        if (dateState.key === 'from' && f.to && f.from > f.to) f.to = f.from;
        syncDateLabels();
        closeDatePicker();
        redraw();
      }; });
      p.querySelector('[data-date-today]').onclick = (event) => {
        event.stopPropagation();
        f[dateState.key] = App.fmt.ymd(App.clock.now());
        if (dateState.key === 'from' && f.to && f.from > f.to) f.to = f.from;
        syncDateLabels();
        closeDatePicker();
        redraw();
      };
      p.querySelector('[data-date-clear]').onclick = (event) => {
        event.stopPropagation();
        f[dateState.key] = '';
        syncDateLabels();
        closeDatePicker();
        redraw();
      };
    };
    const openDatePicker = (button) => {
      const key = button.dataset.dateOpen;
      const today = App.fmt.ymd(App.clock.now());
      dateState.key = key;
      dateState.ym = (f[key] || today).slice(0, 7);
      const p = popover();
      const h = host();
      if (!p || !h) return;
      p.hidden = false;
      renderDatePicker();
      positionDatePicker(button);
      el.querySelectorAll('[data-date-open]').forEach((b) => b.setAttribute('aria-expanded', String(b === button)));
    };
    const redraw = () => {
      const all = getAll();
      const r = el.querySelector('[data-results]');
      if (r) r.innerHTML = results(all, f, getOpts());
      const count = el.querySelector('[data-ticket-count]');
      if (count) {
        const filtered = App.filters.apply(all, f).length;
        const hasFilters = App.filters.chips(f).length > 0;
        count.textContent = hasFilters
          ? `Showing ${filtered} of ${all.length} ${all.length === 1 ? 'ticket' : 'tickets'}`
          : `${all.length} ${all.length === 1 ? 'ticket' : 'tickets'}`;
      }
    };
    const onInput = (e) => {
      const t = e.target.closest('[data-f]');
      if (!t) return;
      if (t.dataset.f === 'q') {
        clearTimeout(timer);
        timer = setTimeout(() => {
          f.q = t.value;
          redraw();
        }, 150);
      }
    };
    const onChange = (e) => {
      if (dateState.key) closeDatePicker();
      const t = e.target.closest('[data-f]');
      if (!t || t.dataset.f === 'q') return;
      f[t.dataset.f] = t.value;
      redraw();
    };
    const onClick = (e) => {
      const ft = e.target.closest('[data-filters-toggle]');
      if (ft) {
        const bar = ft.closest('.filter-bar');
        const on = bar.classList.toggle('open');
        ft.setAttribute('aria-expanded', String(on));
        return;
      }
      if (!e.target.closest('[data-date-open]') && !e.target.closest('[data-date-popover]')) closeDatePicker();
      const dateButton = e.target.closest('[data-date-open]');
      if (dateButton) { if (dateState.key === dateButton.dataset.dateOpen && !popover().hidden) closeDatePicker(); else openDatePicker(dateButton); return; }
      const mine = e.target.closest('[data-mine]');
      if (mine) {
        f.mine = !f.mine;
        mine.setAttribute('aria-pressed', String(f.mine));
        redraw();
        return;
      }
      const c = e.target.closest('[data-clear]');
      if (c) {
        if (c.dataset.clear === 'all') Object.assign(f, App.filters.blank(), { sort: f.sort });
        else f[c.dataset.clear] = c.dataset.clear === 'mine' ? false : '';
        const mt = el.querySelector('[data-mine]');
        if (mt) mt.setAttribute('aria-pressed', String(!!f.mine));
        // sync visible controls with the state
        el.querySelectorAll('[data-f]').forEach((i) => { i.value = f[i.dataset.f] || ''; });
        syncDateLabels();
        closeDatePicker();
        redraw();
        return;
      }
      const a = e.target.closest('[data-tact]');
      if (a) App.ticketActions.run(a.dataset.tact, a.dataset.id);
    };
    const onKeydown = (e) => { if (e.key === 'Escape') closeDatePicker(); };
    const onDocumentClick = (e) => { if (!el.contains(e.target)) closeDatePicker(); };
    // Custom filter selects stop click propagation, so use capture phase to
    // guarantee that opening any select closes an active date popover first.
    const onFilterCapture = (e) => { if (e.target.closest && e.target.closest('.app-select')) closeDatePicker(); };
    const onResize = () => { if (dateState.key && popover() && !popover().hidden) positionDatePicker(el.querySelector(`[data-date-open="${dateState.key}"]`)); };
    el.addEventListener('input', onInput);
    el.addEventListener('change', onChange);
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('click', onFilterCapture, true);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      closeDatePicker();
      el.removeEventListener('input', onInput);
      el.removeEventListener('change', onChange);
      el.removeEventListener('click', onClick);
      el.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('click', onFilterCapture, true);
      window.removeEventListener('resize', onResize);
    };
  }

  App.ticketList = { table, filterBar, results, bind, rowActions };
})();
