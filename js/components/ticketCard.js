/* TicketCard: compact ticket preview that adapts to its own container width (container queries in components.css). */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);

  function card(t, o) {
    o = o || {};
    const M = App.metrics;
    return `<a class="ticket-card" href="#/tickets/${esc(t.id)}" data-testid="ticket-card" aria-label="Ticket ${esc(t.id)}: ${esc(App.fmt.ticketTitle(t))}">
      <div class="tid">#${esc(t.id)}</div>
      <div class="ttl">${esc(App.fmt.ticketTitle(t))}</div>
      <div class="loc">${App.icon('pin')} ${esc(M.locName(t.locationId))}</div>
      <div class="badges">${App.badges.statusBadge(t.status)}</div>
      <div class="meta">${t.category ? `<span>${App.icon(App.badges.catIcon(t.category))} ${esc(t.category)}</span>` : ''}${o.reporter ? `<span>By ${esc(M.userName(t.reporterId))}</span>` : ''}<span>${t.assigneeId ? 'Assigned to ' + esc(M.userName(t.assigneeId)) : 'Unassigned'}</span><span>Updated ${esc(App.fmt.ago(t.updatedAt))}</span></div>
    </a>`;
  }
  const list = (tickets, o) => `<div class="card-list">${tickets.map((t) => card(t, o)).join('')}</div>`;

  App.ticketCard = { card, list };
})();
