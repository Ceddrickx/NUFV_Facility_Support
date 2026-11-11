/* TicketTimeline: Submitted > Assigned > In Progress > Resolved > Verified. Done = green check, current = gold dot, todo = empty circle. */
(function () {
  const App = (window.App = window.App || {});
  const STEPS = [
    ['Pending', 'Submitted'],
    ['Assigned', 'Assigned'],
    ['In Progress', 'In Progress'],
    ['Resolved', 'Resolved'],
    ['Closed / Verified', 'Verified'],
  ];

  // Each step takes the colour of its status pill (variables.css --pill-*).
  const ST = { Pending: 'pending', Assigned: 'assigned', 'In Progress': 'inprogress', Resolved: 'resolved', 'Closed / Verified': 'closed' };

  function html(t) {
    const hit = (s) => [...t.timeline].reverse().find((e) => e.status === s);
    const idx = { Pending: 0, Assigned: 1, 'In Progress': 2, Resolved: 3, 'Closed / Verified': 4, Reopened: 1 }[
      t.status
    ];
    const steps = STEPS.map(([k, label], i) => {
      const e = hit(k);
      let cls = 'todo',
        icon = 'circle';
      if (t.status === 'Closed / Verified' || i < idx) {
        cls = 'done';
        icon = 'check';
      } else if (i === idx) {
        cls = t.status === 'Resolved' ? 'done' : 'current';
        icon = cls === 'done' ? 'check' : 'dot';
      }
      if (t.status === 'Closed / Verified' && i === 4) {
        cls = 'done';
        icon = 'check';
      }
      const state = cls === 'done' ? 'completed' : cls === 'current' ? 'current step' : 'not yet';
      return `<li class="tl-step ${cls}" data-st="${ST[k]}" ${cls === 'current' ? 'aria-current="step"' : ''}><span class="dot">${App.icon(icon)}</span><span>${label}<span class="sr-only"> (${state})</span>${e ? `<small>${App.fmt.dateTime(e.at)}</small>` : ''}</span></li>`;
    });
    if (t.status === 'Reopened') {
      const e = hit('Reopened');
      steps.splice(
        2,
        0,
        `<li class="tl-step reopen"><span class="dot">${App.icon('rotate')}</span><span>Reopened<small>${e ? App.fmt.dateTime(e.at) : ''}</small></span></li>`,
      );
    }
    return `<div style="container-type:inline-size"><ol class="timeline h" aria-label="Ticket progress">${steps.join('')}</ol></div>`;
  }
  App.timeline = { html };
})();
