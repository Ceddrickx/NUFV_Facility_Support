/* Metric definitions (spec 7.3). Every number in the UI is computed here from the store, never hard-coded. */
(function () {
  const App = (window.App = window.App || {});
  const H = 3600000;
  const S = () => App.store.state;

  const isActive = (t) => t.status !== 'Closed / Verified';
  const age = (t) => App.clock.now() - t.createdAt;
  // Unresolved = still needs work (Resolved tickets are waiting for the reporter to verify; Closed / Verified are done).
  const isOpen = (t) => t.status !== 'Resolved' && t.status !== 'Closed / Verified';
  const isResolvedish = (t) => t.status === 'Resolved' || t.status === 'Closed / Verified';

  const user = (id) => S().users.find((u) => u.id === id);
  const loc = (id) => S().locations.find((l) => l.id === id);
  // Routes still pass the public number, while integrations may pass the
  // internal numeric TicketId. Resolve either without exposing the database key.
  const ticket = (id) =>
    S().tickets.find(
      (t) => t.id === id || t.ticketNo === id || (t.ticketId != null && String(t.ticketId) === String(id)),
    );
  // Locations offered for NEW selections. Retired ones stay in the data so old tickets still show their name (loc / locName).
  const activeLocations = () => S().locations.filter((l) => !l.retired);
  const locName = (id) => (loc(id) ? loc(id).name : id);
  const userName = (id) => (id === 'system' ? 'System (automation)' : user(id) ? user(id).name : 'Unassigned');
  const fullName = (id) => (user(id) ? user(id).fullName : 'Unassigned');
  const currentUser = () => user(S().user);
  // The person's own label ('Faculty' for professors, 'IT Technician', ...), falling back to the generic role label.
  const roleLabel = (u) => (u && u.roleLabel) || (u && App.C.ROLES[u.role] ? App.C.ROLES[u.role].label : '');

  function counts(list) {
    const c = {
      total: list.length,
      active: 0,
      open: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      reopened: 0,
      assigned: 0,
    };
    list.forEach((t) => {
      if (isActive(t)) c.active += 1;
      if (isOpen(t)) c.open += 1;
      if (t.status === 'Pending') c.pending += 1;
      if (t.status === 'Assigned') c.assigned += 1;
      if (t.status === 'In Progress') c.inProgress += 1;
      if (t.status === 'Reopened') c.reopened += 1;
      if (isResolvedish(t)) c.resolved += 1;
      if (t.status === 'Closed / Verified') c.closed += 1;
    });
    return c;
  }

  function groupCount(list, keyFn) {
    const m = {};
    list.forEach((t) => {
      const k = keyFn(t);
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m)
      .map(([k, v]) => ({ key: k, n: v }))
      .sort((a, b) => b.n - a.n);
  }

  // Recurring issue: same category + same location, N or more tickets created in the last 90 days.
  function recurring(threshold) {
    const n = threshold || S().settings.recurringThreshold || 5;
    const since = App.clock.now() - 90 * 24 * H;
    const map = {};
    S()
      .tickets.filter((t) => t.createdAt >= since && t.category) // tickets without a category are not grouped
      .forEach((t) => {
        const k = `${t.category}|${t.locationId}`;
        map[k] = map[k] || { category: t.category, locationId: t.locationId, count: 0, last: 0, ids: [] };
        map[k].count += 1;
        map[k].ids.push(t.id);
        map[k].last = Math.max(map[k].last, t.createdAt);
      });
    return Object.values(map)
      .filter((r) => r.count >= n)
      .sort((a, b) => b.count - a.count);
  }
  const recurringCount = (cat, locId) => {
    if (!cat) return 0;
    const since = App.clock.now() - 90 * 24 * H;
    return S().tickets.filter((t) => t.category === cat && t.locationId === locId && t.createdAt >= since).length;
  };

  function avgResolution(list) {
    const done = list.filter((t) => t.resolvedAt && isResolvedish(t));
    if (!done.length) return 0;
    return done.reduce((a, t) => a + (t.resolvedAt - t.createdAt), 0) / done.length;
  }

  function workload() {
    return S()
      .users.filter((u) => u.role === 'fmo' || u.role === 'it')
      .map((u) => {
        const mine = S().tickets.filter((t) => t.assigneeId === u.id);
        return {
          user: u,
          active: mine.filter(isActive).length,
          inProgress: mine.filter((t) => t.status === 'In Progress').length,
          resolved: mine.filter(isResolvedish).length,
          assigned: mine.length,
        };
      });
  }

  App.metrics = {
    isActive,
    isOpen,
    isResolvedish,
    counts,
    groupCount,
    recurring,
    recurringCount,
    avgResolution,
    workload,
    user,
    loc,
    activeLocations,
    ticket,
    locName,
    userName,
    fullName,
    currentUser,
    roleLabel,
  };
})();
