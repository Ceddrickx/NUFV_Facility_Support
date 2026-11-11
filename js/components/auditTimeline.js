/* AuditTimeline: time, actor, action, linked ticket. Automatic actions use the actor "System (automation)". */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);

  const TYPES = [
    ['submitted', 'Ticket submitted'],
    ['assigned', 'Assignment'],
    ['status', 'Status change'],
    ['resolution', 'Resolution'],
    ['confirmed', 'Verification'],
    ['reopened', 'Reopened'],
    ['schedule', 'Scheduling'],
    ['note', 'Notes and files'],
    ['routed', 'Auto-routing'],
  ];
  function typeOf(a) {
    const t = a.action.toLowerCase();
    if (t.includes('auto-routed')) return 'routed';
    if (t.includes('submitted')) return 'submitted';
    if (t.includes('reassigned') || t.includes('assigned') || t.includes('accepted') || t.includes('re-accepted'))
      return 'assigned';
    if (t.includes('scheduled')) return 'schedule';
    if (t.includes('in progress')) return 'status';
    if (t.includes('resolution')) return 'resolution';
    if (t.includes('confirmed')) return 'confirmed';
    if (t.includes('reopened')) return 'reopened';
    if (t.includes('note') || t.includes('attachment')) return 'note';
    return 'status';
  }

  function html(entries) {
    if (!entries.length) return App.ui.empty('audit', 'No activity matches the filters.');
    return `<ul class="feed" data-testid="audit-feed">${entries
      .map(
        (a) => `<li class="${a.actorId === 'system' ? 'sys' : ''}">
      <div>${esc(a.action)}${a.ticketId && !a.action.includes(a.ticketId) ? ` <a href="#/tickets/${esc(a.ticketId)}">#${esc(a.ticketId)}</a>` : ''}</div>
      <div class="when">${esc(App.fmt.dateTime(a.at))} &middot; ${esc(App.metrics.userName(a.actorId))}${a.details ? ' &middot; ' + esc(a.details) : ''}</div></li>`,
      )
      .join('')}</ul>`;
  }
  App.auditTimeline = { html, typeOf, TYPES };
})();
