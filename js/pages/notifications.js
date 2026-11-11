/* Notification center page: filters All / Unread / Tickets / Schedule, mark read per item. Notifications are in-app only (simulated email). */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const S = () => App.store.state;
  const FILTERS = [
    ['all', 'All'],
    ['unread', 'Unread'],
    ['tickets', 'Tickets'],
    ['schedule', 'Schedule'],
  ];

  App.pages.notifications = {
    title: () => 'Notifications',
    render() {
      const f = App.store.session.notifFilter || 'all';
      const mine = App.topbar.myNotifs();
      const list = mine.filter(
        (n) =>
          f === 'all' ||
          (f === 'unread' && !n.read) ||
          (f === 'tickets' && n.ticketId) ||
          (f === 'schedule' && n.scheduleId),
      );
      return `${App.ui.pageHead('Notifications', `<button type="button" class="btn secondary" data-act="read-all-page" data-testid="page-mark-all">Mark all read</button>`)}
        <div class="card"><div class="seg mb-3" role="group" aria-label="Filter notifications">${FILTERS.map(([k, l]) => `<button type="button" data-nf="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
        ${list.length ? `<div class="notification-list" data-testid="notif-list">${list.map((n) => `<div class="notification-row">${App.notificationItem(n)}<div class="notification-actions">${n.read ? '' : `<button type="button" class="btn sm secondary" data-read="${n.id}" aria-label="Mark as read">Mark read</button>`}<button type="button" class="btn sm ghost" data-dismiss="${n.id}" aria-label="Dismiss notification">Dismiss</button></div></div>`).join('')}</div>` : App.ui.empty('bell', 'Nothing here. You are all caught up.')}</div>`;
    },
    mount(el, ctx) {
      el.addEventListener('click', (e) => {
        const f = e.target.closest('[data-nf]');
        if (f) {
          App.store.session.notifFilter = f.dataset.nf;
          ctx.refresh();
          return;
        }
        const r = e.target.closest('[data-read]');
        if (r) {
          App.actions.markNotificationRead(r.dataset.read);
          return;
        }
        const d = e.target.closest('[data-dismiss]');
        if (d) {
          const res = App.actions.dismissNotification(d.dataset.dismiss);
          if (res && res.ok) {
            App.toast.show(res.msg, 'info', { label: 'Undo', onClick: () => {
              S().notifications.splice(Math.min(res.index, S().notifications.length), 0, res.notification);
              App.store.commit(['notifications']);
              ctx.refresh();
            }});
            ctx.refresh();
          }
          return;
        }
        if (e.target.closest('[data-act="read-all-page"]')) {
          e.stopPropagation();
          App.toast.fromResult(App.actions.markAllRead());
          return;
        }
        const n = e.target.closest('[data-nid]');
        if (n) App.actions.markNotificationRead(n.dataset.nid);
      });
    },
  };
})();
