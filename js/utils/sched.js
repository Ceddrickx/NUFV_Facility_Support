/* Schedule helpers shared by dashboards, the calendar and room availability. Class schedule data is mock (Future Enhancement Preview). */
(function () {
  const App = (window.App = window.App || {});
  const S = () => App.store.state;
  const mins = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const hhmm = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

  // A scheduled ticket reads its title, assignee, status and description from the ticket itself, so they never go out of date.
  function hydrate(s) {
    if (s.kind !== 'ticket') return s;
    const t = S().tickets.find((x) => x.id === s.ticketId);
    return Object.assign({}, s, {
      title: t ? App.fmt.ticketTitle(t) : 'Ticket',
      assigneeId: t ? t.assigneeId : null,
      reporterId: t ? t.reporterId : null,
      status: t ? t.status : '',
      group: t ? t.group : '',
      description: t ? t.description : '',
    });
  }
  const isOpen = (s) => s.status !== 'Resolved' && s.status !== 'Closed / Verified';

  // Everything happening in one room (or all rooms) on a date: weekly classes plus dated scheduled tickets.
  function itemsOn(dateStr, locationId) {
    const wd = App.fmt.weekdayOf(dateStr);
    return S()
      .schedules.filter(
        (s) =>
          (!locationId || s.locationId === locationId) && (s.kind === 'class' ? s.weekday === wd : s.date === dateStr),
      )
      .map(hydrate)
      .sort((a, b) => mins(a.start) - mins(b.start));
  }
  const live = () => true;

  // Scheduled tickets within the next N days (today included) for the given locations, nearest first. Finished tickets are left out.
  function upcoming(locationIds, days, includeAll) {
    const today = App.fmt.ymd(App.clock.now());
    const last = App.fmt.addDays(today, days);
    const now = App.clock.now();
    return S()
      .schedules.filter(
        (s) =>
          s.kind === 'ticket' &&
          (includeAll || locationIds.includes(s.locationId)) &&
          s.date >= today &&
          s.date <= last &&
          App.fmt.at(s.date, s.end) > now,
      )
      .map(hydrate)
      .filter(isOpen)
      .sort((a, b) => a.date.localeCompare(b.date) || mins(a.start) - mins(b.start));
  }

  // Free periods in a room between 7:00 AM and 9:00 PM (evening classes run until 9:00 PM).
  function freeSlots(locationId, dateStr) {
    const busy = itemsOn(dateStr, locationId)
      .filter(live)
      .map((s) => [mins(s.start), mins(s.end)])
      .sort((a, b) => a[0] - b[0]);
    const out = [];
    let cur = 7 * 60;
    busy.forEach(([a, b]) => {
      if (a > cur) out.push([cur, a]);
      cur = Math.max(cur, b);
    });
    if (cur < 21 * 60) out.push([cur, 21 * 60]);
    return out.map(([a, b]) => ({ start: hhmm(a), end: hhmm(b) }));
  }
  // First free period of at least minMins minutes in the next `days` days (today's periods must still be ahead of the clock).
  function nextFree(locationId, minMins, days) {
    const today = App.fmt.ymd(App.clock.now());
    const p = App.fmt.parts(App.clock.now()),
      mNow = p.h * 60 + p.min;
    for (let i = 0; i < days; i++) {
      const d = App.fmt.addDays(today, i);
      const slot = freeSlots(locationId, d).find(
        (f) => mins(f.end) - mins(f.start) >= minMins && (i > 0 || mins(f.start) > mNow),
      );
      if (slot) return { date: d, slot };
    }
    return null;
  }
  const describe = (s) => `${s.title}${s.courseCode ? ' (' + s.courseCode + ')' : ''}`;
  const range = (s) => `${App.fmt.hhmm(s.start)} to ${App.fmt.hhmm(s.end)}`;

  App.sched = { itemsOn, upcoming, hydrate, isOpen, freeSlots, nextFree, mins, hhmm, live, describe, range };
})();
