/* Search, filter and sort for tickets. Filters combine with AND; sorting is stable. */
(function () {
  const App = (window.App = window.App || {});
  const C = App.C;

  const blank = () => ({
    q: '',
    status: '',
    category: '',
    location: '',
    group: '',
    from: '',
    to: '',
    sort: 'newest',
    mine: false,
  });

  // Grouped choices behind the dashboard boxes. They live in the normal status / category filters,
  // so they show as selected in the dropdown and as a removable chip.
  const ACCOUNT_CATEGORIES = App.C.ACCOUNT_CATEGORIES;
  const GROUP_LABEL = {
    '@active': 'Active (unresolved)',
    '@resolved': 'Resolved or closed',
    '@notclosed': 'Not closed',
    '@account': 'Account issues',
  };
  const STATUS_CHOICES = [
    { value: '@active', label: GROUP_LABEL['@active'] },
    { value: '@resolved', label: GROUP_LABEL['@resolved'] },
    { value: '@notclosed', label: GROUP_LABEL['@notclosed'] },
  ];
  const CATEGORY_CHOICES = [{ value: '@account', label: GROUP_LABEL['@account'] }];
  const statusOk = (t, s) => {
    if (s === '@active') return App.metrics.isOpen(t);
    if (s === '@resolved') return App.metrics.isResolvedish(t);
    if (s === '@notclosed') return App.metrics.isActive(t);
    return t.status === s;
  };
  const categoryOk = (t, c) => (c === '@account' ? ACCOUNT_CATEGORIES.includes(t.category) : t.category === c);

  function haystack(t) {
    const M = App.metrics;
    return [
      t.id,
      t.title,
      t.description,
      t.category,
      t.problemType,
      M.locName(t.locationId),
      M.userName(t.reporterId),
      t.assigneeId ? M.userName(t.assigneeId) : 'unassigned',
    ]
      .join(' ')
      .toLowerCase();
  }

  // Default ticket order is newest created date first, then highest public
  // sequence for tickets created on the same date.
  function ticketSequence(t) {
    const parsed = App.ids.sequenceFromTicketNo(t.ticketNo || t.id) || {};
    return {
      createdAt: Number(t.createdAt) || 0,
      year: Number(t.ticketYear) || parsed.year || 0,
      number: Number(t.ticketSeq) || parsed.sequence || 0,
      internalId: Number(t.ticketIdInternal || t.ticketId) || 0,
      label: String(t.ticketNo || t.id || ''),
    };
  }

  function newestTicketFirst(a, b) {
    const left = ticketSequence(a);
    const right = ticketSequence(b);
    return (
      right.createdAt - left.createdAt ||
      right.year - left.year ||
      right.number - left.number ||
      right.internalId - left.internalId ||
      right.label.localeCompare(left.label)
    );
  }

  function apply(list, f) {
    const q = (f.q || '').trim().toLowerCase();
    const from = f.from ? App.fmt.at(f.from, '00:00') : null;
    const to = f.to ? App.fmt.at(f.to, '23:59') : null;
    let out = list.filter(
      (t) =>
        (!q || haystack(t).includes(q)) &&
        (!f.status || statusOk(t, f.status)) &&
        (!f.category || categoryOk(t, f.category)) &&
        (!f.location || t.locationId === f.location) &&
        (!f.group || t.group === f.group) &&
        (!from || t.createdAt >= from) &&
        (!to || t.createdAt <= to) &&
        (!f.mine || t.assigneeId === App.store.state.user),
    );
    const idx = new Map(out.map((t, i) => [t, i]));
    const cmp =
      {
        newest: (a, b) => newestTicketFirst(a, b),
        oldest: (a, b) => newestTicketFirst(b, a),
        status: (a, b) =>
          C.STATUS_ORDER.indexOf(a.status) - C.STATUS_ORDER.indexOf(b.status) || b.createdAt - a.createdAt,
        location: (a, b) => App.metrics.locName(a.locationId).localeCompare(App.metrics.locName(b.locationId)),
      }[f.sort] || ((a, b) => b.createdAt - a.createdAt);
    // Preserve the original order only when all configured sort keys tie.
    out = out.sort((a, b) => cmp(a, b) || idx.get(a) - idx.get(b));
    return out;
  }

  function chips(f) {
    const M = App.metrics,
      c = [];
    if (f.q) c.push(['q', `Search: ${f.q}`]);
    if (f.status) c.push(['status', `Status: ${GROUP_LABEL[f.status] || f.status}`]);
    if (f.category) c.push(['category', `Category: ${GROUP_LABEL[f.category] || f.category}`]);
    if (f.location) c.push(['location', `Location: ${M.locName(f.location)}`]);
    if (f.group) c.push(['group', `Group: ${f.group}`]);
    if (f.from) c.push(['from', `From: ${App.fmt.dateStrLabel(f.from)}`]);
    if (f.to) c.push(['to', `To: ${App.fmt.dateStrLabel(f.to)}`]);
    if (f.mine) c.push(['mine', 'Assigned to me']);
    return c;
  }

  // Per-page filter state, kept for the current session (survives re-renders and resizes).
  function stateFor(key, init) {
    const s = App.store.session;
    s.filters = s.filters || {};
    if (!s.filters[key]) s.filters[key] = Object.assign(blank(), init || {});
    return s.filters[key];
  }

  App.filters = {
    blank,
    apply,
    newestTicketFirst,
    chips,
    stateFor,
    ACCOUNT_CATEGORIES,
    STATUS_CHOICES,
    CATEGORY_CHOICES,
  };
})();
