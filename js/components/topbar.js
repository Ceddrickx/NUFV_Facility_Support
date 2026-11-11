/* Header: menu button, NU Fairview brand, notifications, greeting and account menu. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;

  function notifLink(n) {
    if (n.ticketId) return `#/tickets/${n.ticketId}`;
    if (n.scheduleId)
      return `#${{ student: '/notifications', fmo: '/scheduled', it: '/scheduled', admin: '/schedules' }[S().role]}`;
    return '#/notifications';
  }
  const NOTE_ICON = { info: 'info', success: 'check', warning: 'alert', error: 'alert' };
  function notifItem(n, tag) {
    const open = tag === 'a';
    return `<${open ? `a href="${esc(notifLink(n))}"` : 'div'} class="notif ${n.type} ${n.read ? '' : 'unread'}" data-nid="${esc(n.id)}" ${n.read ? '' : 'aria-label="Unread: ' + esc(n.message) + '"'}>
      <span class="${{ info: 'dev-maintenance', success: 'dev-online', warning: 'dev-warning', error: 'dev-offline' }[n.type]}">${App.icon(NOTE_ICON[n.type] || 'info')}</span>
      <span><span>${esc(n.message)}</span><br><span class="when">${esc(App.fmt.ago(n.createdAt))}</span></span></${open ? 'a' : 'div'}>`;
  }
  const myNotifs = () =>
    S()
      .notifications.filter((n) => n.userId === S().user && (!n.channels || n.channels.includes('inApp')))
      .sort((a, b) => b.createdAt - a.createdAt);

  function bellPanel() {
    const list = myNotifs().slice(0, 5);
    return `<div class="row between" style="padding:6px 10px"><b>Notifications</b><button type="button" class="btn sm secondary" data-act="read-all" data-testid="mark-all-read">Mark all read</button></div>
      ${list.length ? list.map((n) => notifItem(n, 'a')).join('') : '<p class="muted" style="padding:10px">You are all caught up.</p>'}
      <div class="dd-sep"></div><a class="dd-item" href="#/notifications" data-testid="view-all-notifs">View all notifications</a>`;
  }

  function userPanel() {
    return `<a class="dd-item" href="#/account">${App.icon('settings')}Account settings</a><div class="dd-sep"></div>
      <button type="button" class="dd-item danger signout-action" data-act="logout">${App.icon('logout')}Log out</button>`;
  }

  function render() {
    const me = App.metrics.currentUser();
    // Keep the account's preferred given-name string. Some users have a
    // compound first name, such as "Kim Cedrick", and truncating it to one
    // word makes the header disagree with the greeting card.
    const first = String(me.name || '').trim() || 'there';
    return `
      <div class="top-left">
        <button type="button" class="icon-btn menu-btn" data-act="menu" aria-label="Toggle navigation menu" aria-expanded="false" data-testid="menu-btn" aria-controls="sidebar">${App.dotsIcon()}</button>
        <a class="top-brand" href="#/dashboard" aria-label="NU Fairview home"><img src="assets/nu-shield.png" alt="" width="36" height="36"><span>NU FAIRVIEW</span></a>
      </div>
      <div class="tools">
        <div class="dropdown"><button type="button" class="icon-btn" data-dd="notif" aria-haspopup="true" aria-expanded="false" aria-label="Notifications" data-testid="bell"><img class="bell-img" src="assets/bell.png" alt="" width="18" height="18"><span class="badge-dot" id="bell-badge" hidden></span></button>
          <div class="dd-panel sheet" id="dd-notif" hidden></div></div>
        <span class="hi" data-testid="greeting">${esc(first)}</span>
        <div class="dropdown"><button type="button" class="icon-btn avatar-btn" data-dd="user" aria-haspopup="true" aria-expanded="false" aria-label="Account menu for ${esc(me.fullName)}" data-testid="user-menu">${App.ui.avatar()}</button>
          <div class="dd-panel" id="dd-user" hidden></div></div>
      </div>`;
  }

  function updateBadge() {
    const b = document.getElementById('bell-badge');
    if (!b) return;
    const n = App.nav.unreadCount();
    b.hidden = n === 0;
    b.textContent = n > 99 ? '99+' : String(n);
    const btn = document.querySelector('[data-dd="notif"]');
    if (btn) btn.setAttribute('aria-label', `Notifications, ${n} unread`);
  }

  function registerDropdowns() {
    App.dropdown.register('notif', bellPanel);
    App.dropdown.register('user', userPanel);
  }

  App.topbar = { render, updateBadge, registerDropdowns, notifItem, notifLink, myNotifs };
})();
