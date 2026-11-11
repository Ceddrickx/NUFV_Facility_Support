/* Sidebar (desktop and slide-out on tablets/phones) and bottom navigation (phones). */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  const same = (itemPath, cur) =>
    itemPath === cur ||
    (itemPath !== '/dashboard' && cur.startsWith(itemPath + '/')) ||
    (itemPath === '/my-tickets' && cur.startsWith('/tickets/') && App.store.state.role === 'student') ||
    (itemPath === '/it-tickets' && cur.startsWith('/tickets/') && App.store.state.role === 'it') ||
    (itemPath === '/fmo-tickets' && cur.startsWith('/tickets/') && App.store.state.role === 'fmo');

  // The nav item that should look active for the current path (uses the route's parent for detail pages).
  function activePath(cur) {
    const m = App.routes.match(cur);
    const base =
      m && m.route.parent && !App.routes.nav[App.store.state.role].some((x) => x.path === cur) ? m.route.parent : cur;
    const items = App.routes.nav[App.store.state.role];
    const hit = items.find((x) => same(x.path, base)) || items.find((x) => base.startsWith(x.path));
    return hit ? hit.path : null;
  }

  function unreadCount() {
    const s = App.store.state;
    return s.notifications.filter(
      (x) => x.userId === s.user && !x.read && (!x.channels || x.channels.includes('inApp')),
    ).length;
  }

  function sidebar(cur) {
    const s = App.store.state,
      role = s.role,
      me = App.metrics.currentUser();
    const act = activePath(cur);
    const unread = unreadCount();
    const all = App.routes.nav[role];
    const link = (i) => `
      <li><a href="#${i.path === '/report' ? '/report?new=1' : i.path}" ${i.path === act ? 'aria-current="page"' : ''} data-tip="${esc(i.label)}" data-testid="nav-${i.path.slice(1)}">${App.icon(i.icon)}<span class="lbl">${esc(i.label)}</span>${i.path === '/notifications' && unread ? `<span class="count" aria-label="${unread} unread">${unread}</span>` : ''}</a></li>`;
    const groups = App.routes.GROUP_ORDER.map((g) => {
      const list = all.filter((i) => i.group === g);
      if (!list.length) return '';
      return `<div class="nav-group"><p class="nav-label">${esc(g)}</p><ul class="nav">${list.map(link).join('')}</ul></div>`;
    }).join('');
    return `
      <form class="side-search" role="search" data-act="gsearch"><label class="sr-only" for="gsearch">Search tickets</label>
        ${App.icon('search')}<input id="gsearch" class="input" type="search" placeholder="Search tickets" data-testid="global-search"></form>
      <nav aria-label="Main navigation">${groups}</nav>
      <div class="side-foot">
        <div class="side-user">
          ${App.ui.avatar()}
          <div class="who"><b>${esc(me.fullName)}</b><small>${esc(App.metrics.roleLabel(me))}</small></div>
          <button type="button" class="signout-action" data-act="logout" data-testid="logout" aria-label="Log out">${App.icon('logout')}</button>
          <button type="button" class="rail-only rail-user-btn" data-dd="side-user" aria-haspopup="true" aria-expanded="false" aria-label="Account menu for ${esc(me.fullName)}" data-tip="${esc(me.fullName)}" data-testid="rail-user"></button>
        </div>
      </div>`;
  }

  // Flyouts for the collapsed rail. The panels live in #side-pop (outside #sidebar, which is rebuilt on every store change and clips overflow).
  function placeFlyout(id) {
    return (p) => {
      const b = document.querySelector(`[data-dd="${id}"]`);
      if (!b) return;
      const r = b.getBoundingClientRect();
      p.style.left = `${Math.round(r.right + 10)}px`;
      p.style.top = '0px';
      requestAnimationFrame(() => {
        p.style.top = `${Math.max(8, Math.min(Math.round(r.top), window.innerHeight - p.offsetHeight - 8))}px`;
      });
    };
  }
  function registerFlyouts() {
    App.dropdown.register(
      'side-user',
      () => {
        const me = App.metrics.currentUser();
        return `<div class="dd-who"><b>${esc(me.fullName)}</b><small>${esc(App.metrics.roleLabel(me))}</small></div><div class="dd-sep"></div>
        <button type="button" class="dd-item danger signout-action" data-act="logout" data-dd-close>${App.icon('logout')}Log out</button>`;
      },
      placeFlyout('side-user'),
    );
  }

  function bottomNav(cur) {
    const role = App.store.state.role;
    const act = activePath(cur);
    const items = App.routes.nav[role];
    const main = App.routes.bottom[role]
      .map((entry) => {
        const config = typeof entry === 'string' ? { path: entry } : entry;
        const item = items.find((i) => i.path === config.path);
        return item ? Object.assign({}, item, config) : null;
      })
      .filter(Boolean);
    const links = main
      .map(
        (i) => {
          const href = i.bottomHref || (i.path === '/report' ? '/report?new=1' : i.path);
          const key = i.bottomKey || i.path.slice(1);
          const label = i.bottomLabel || App.routes.short[i.path] || i.label;
          const icon = i.bottomIcon || i.icon;
          const klass = i.bottomClass ? ` class="${esc(i.bottomClass)}"` : '';
          return `<a href="#${href}"${klass} ${i.path === act ? 'aria-current="page"' : ''} data-bottom-key="${esc(key)}" data-testid="bnav-${esc(key)}">${App.icon(icon)}<span>${esc(label)}</span></a>`;
        },
      )
      .join('');
    const moreActive = act && !main.some((m) => m.path === act);
    return `${links}<button type="button" data-act="more" data-testid="bnav-more" ${moreActive ? 'aria-current="page"' : ''} aria-haspopup="dialog">${App.icon('more')}<span>More</span></button>`;
  }

  function moreItems() {
    const role = App.store.state.role;
    const main = new Set(App.routes.bottom[role].map((entry) => (typeof entry === 'string' ? entry : entry.path)));
    const extra = App.routes.nav[role].filter((i) => !main.has(i.path));
    // Notifications are reachable from the header on every role, but list them in the sheet too.
    const more = [...extra];
    if (!more.some((m) => m.path === '/notifications'))
      more.push({ path: '/notifications', label: 'Notifications', icon: 'bell' });
    return more;
  }

  function openMore() {
    const html = `<nav aria-label="More pages"><div class="sheet-links">${moreItems()
      .map((i) => `<a href="#${i.path}" data-close>${App.icon(i.icon)}<span>${esc(i.label)}</span></a>`)
      .join('')}</div></nav>`;
    App.modal.open({ title: 'More', body: html, testid: 'more-sheet' });
  }

  App.nav = { sidebar, bottomNav, openMore, unreadCount, activePath, registerFlyouts };
})();
