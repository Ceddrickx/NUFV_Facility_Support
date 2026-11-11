/* Hash router (History API is unreliable on file://). Role guard: opening another role's page sends you back to your own dashboard with a notice.
   On every route change: update document.title, scroll to top, move focus to the page heading, announce via a polite live region. */
(function () {
  const App = (window.App = window.App || {});
  const S = () => App.store.state;
  let cur = null; // { page, el, ctx }
  let token = 0;

  function parseHash() {
    const raw = location.hash.replace(/^#/, '');
    const [path, qs] = raw.split('?');
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => {
      query[k] = v;
    });
    return { path: path || '', query };
  }
  const go = (p) => {
    location.hash = p;
  };
  const replace = (p) => {
    location.replace(`#${p}`);
  };

  /* ---------- Back trail ----------
     The pages the user drilled through, newest last: { path (no query), y (scroll) }. Choosing a nav item (sidebar, brand, bottom nav, More sheet)
     starts a new trail, so "Back to ..." only ever shows after drilling in. Going back pops the trail (so ticket -> room -> ticket loops do not
     ping-pong) and restores the scroll position. Filters and search live in App.store.session, so a plain link to the list brings them back. */
  const trail = [];
  let topNav = false,
    backNav = false,
    pendingY = 0;
  document.addEventListener(
    'click',
    (e) => {
      const t = e.target.closest ? e.target : null;
      if (!t) return;
      if (t.closest('.back-link')) backNav = true;
      else if (t.closest('#sidebar a[href], #bottom-nav a[href], .top-brand, .sheet-links a, #dd-side-settings a'))
        topNav = true;
    },
    true,
  );
  const pathOnly = (h) =>
    String(h || '')
      .replace(/^#/, '')
      .split('?')[0];
  const isDetail = (p) => /^\/(tickets|users)\/[^/]+$/.test(p);

  function track(P) {
    const top = trail[trail.length - 1];
    if (top) top.y = window.scrollY;
    const prev = trail[trail.length - 2];
    const reset = () => {
      trail.length = 0;
      trail.push({ path: P, y: 0 });
    };
    pendingY = 0;
    if (!top) reset();
    else if (topNav && !backNav) reset();
    else if (top.path === P) {
      /* same page: filters or query changed */
    } else if (prev && prev.path === P) {
      trail.pop();
      pendingY = prev.y || 0;
    } else if (backNav || P === '/dashboard' || P === '/login') reset();
    else {
      if (top.path === '/report' && isDetail(P)) trail.pop(); // after submitting a report, back from its ticket skips the finished wizard
      trail.push({ path: P, y: 0 });
      if (trail.length > 30) trail.shift();
    }
    topNav = false;
    backNav = false;
  }

  const FALLBACK = {
    tickets: { student: '/my-tickets', fmo: '/fmo-tickets', it: '/it-tickets', admin: '/tickets' },
    users: { student: '/dashboard', fmo: '/dashboard', it: '/dashboard', admin: '/users' },
  };
  function labelFor(path, role) {
    const item = App.routes.nav[role].find((i) => i.path === path);
    if (item) return item.label;
    const m = App.routes.match(path);
    return m ? m.route.title : 'previous page';
  }
  const canOpen = (path, role) => {
    const m = App.routes.match(path);
    return !!m && m.route.roles.includes(role);
  };

  // Where "Back" goes for the page being drawn, or null when the page is a top-level destination reached from the sidebar.
  function backTarget(route, P) {
    const role = S().role;
    if (route.public || P === '/dashboard') return null;
    const prev = trail[trail.length - 2];
    if (prev && prev.path !== P && canOpen(prev.path, role))
      return { path: prev.path, label: labelFor(prev.path, role) };
    const inNav = App.routes.nav[role].some((i) => i.path === route.path);
    if (!isDetail(P) && inNav) return null;
    const fb = isDetail(P) ? (FALLBACK[P.split('/')[1]] || {})[role] : '/dashboard';
    const to = fb && canOpen(fb, role) && fb !== P ? fb : '/dashboard';
    return { path: to, label: labelFor(to, role) };
  }
  function backBar(route, P) {
    const t = backTarget(route, P);
    if (!t) return null;
    const d = document.createElement('div');
    d.className = 'back-wrap no-print';
    d.dataset.page = route.page; // shares the page's max-width rules so the link lines up with the title
    d.innerHTML = App.ui.backLink(t);
    return d;
  }

  function announce(title) {
    const l = document.getElementById('live');
    if (l) l.textContent = `${title} page loaded`;
  }

  function viewEl() {
    return document.getElementById('view');
  }

  // While the loading placeholder is shown the page would shrink, pulling the footer up above the bottom nav (a flicker on phones).
  // Hold the current height until the next page is drawn, and start the new page at the top.
  function lockHeight() {
    const v = viewEl();
    if (v && !v.style.minHeight) v.style.minHeight = `${v.offsetHeight}px`;
  }
  function unlockHeight() {
    const v = viewEl();
    if (v) v.style.minHeight = '';
  }

  function draw(m, query) {
    const route = m.route;
    const page = App.pages[route.page];
    const ctx = {
      params: m.params,
      query,
      route,
      path: route.path,
      get role() {
        return S().role;
      },
      get user() {
        return S().user;
      },
      refresh: () => refresh(true),
    };
    const el = document.createElement('div');
    el.className = 'page';
    el.dataset.page = route.page;
    let title = route.title;
    try {
      el.innerHTML = page.render(ctx);
      if (page.title) title = page.title(ctx) || title;
    } catch (e) {
      el.innerHTML = App.ui.errorState('Unable to process the request.');
      el.addEventListener('click', (ev) => {
        if (ev.target.closest('[data-act="retry"]')) resolve();
      });
      App.reportError(e, true);
      cur = { page: { static: true }, el, ctx };
      viewEl().replaceChildren(el);
      unlockHeight();
      return finish('Error');
    }
    if (cur && cur.page.unmount) {
      try {
        cur.page.unmount(cur.el, cur.ctx);
      } catch (e) {
        /* ignore */
      }
    }
    const bar = backBar(route, pathOnly(location.hash));
    if (bar) viewEl().replaceChildren(bar, el);
    else viewEl().replaceChildren(el);
    unlockHeight();
    cur = { page, el, ctx };
    try {
      page.mount && page.mount(el, ctx);
      page.after && page.after(el, ctx);
    } catch (e) {
      App.reportError(e);
    }
    finish(title);
    function finish(t) {
      shownHash = location.hash.replace(/^#/, '');
      document.title = `${t} | NU Fairview Maintenance`;
      App.shell.updateTitle(t, route);
      const y = pendingY;
      pendingY = 0;
      window.scrollTo(0, y);
      if (y) requestAnimationFrame(() => window.scrollTo(0, y)); // charts and the calendar settle after mount
      announce(t);
      const h = el.querySelector('h1,[data-page-heading]');
      if (h) {
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      }
    }
  }

  let shownHash = '';
  let reverting = false;
  function resolve() {
    const ses = App.auth.session();
    const signed = !!ses;
    // The role and user always come from the signed-in account, so a tampered saved role is corrected before any page is checked.
    if (ses && (S().role !== ses.role || S().user !== ses.userId)) App.actions.setUser(ses.userId);
    let { path, query } = parseHash();
    if (reverting) {
      reverting = false;
      return;
    } // we just put the old hash back after a cancelled navigation
    // Pages may veto leaving (the report wizard asks "Discard this report?").
    if (signed && cur && cur.page.canLeave && shownHash && location.hash.replace(/^#/, '') !== shownHash) {
      if (!cur.page.canLeave(cur.ctx, location.hash.replace(/^#/, ''))) {
        reverting = true;
        location.replace(`#${shownHash}`);
        return;
      }
    }
    if (!path || path === '/') {
      replace(signed ? '/dashboard' : '/login');
      return;
    }
    const m = App.routes.match(path);
    if (!signed && !(m && m.route.public)) {
      App.store.session.returnTo = path;
      replace('/login');
      return;
    }
    if (signed && path === '/login') {
      replace('/dashboard');
      return;
    }
    if (signed && m && m.route.redirect) {
      App.store.session.settingsTab = m.route.tab;
      replace(m.route.redirect);
      return;
    }
    App.dropdown.close();
    if (signed && m && !m.route.public && m.route.roles.includes(S().role)) track(path);
    const token0 = ++token;
    if (!m) {
      App.shell.ensure(signed, path);
      unlockHeight();
      const v = viewEl();
      v.innerHTML = `<div class="card not-avail"><div class="empty">${App.icon('search')}</div><h1 class="page-title" id="page-h1" tabindex="-1">Page not found</h1><p class="muted">We could not find "${App.fmt.esc(path)}".</p><a class="btn" href="#/dashboard">Go to dashboard</a></div>`;
      cur = null;
      document.title = 'Page not found | NU Fairview Maintenance';
      App.shell.updateTitle('Page not found');
      return;
    }
    if (!m.route.public && !m.route.roles.includes(S().role)) {
      // another role's page: back to your own dashboard
      App.toast.show('That page is not available for your account.', 'error');
      replace('/dashboard');
      return;
    }
    App.shell.ensure(signed, path);
    // Short loading state for page transitions (spec 18.6).
    const delay = m.route.public ? 0 : 70;
    if (delay) {
      lockHeight();
      viewEl().innerHTML = App.ui.skeleton(5);
      if (!pendingY) window.scrollTo(0, 0); // a back-navigation keeps its scroll so it can be restored
    }
    setTimeout(() => {
      if (token0 === token) draw(m, query);
    }, delay);
  }

  // Re-render the active page after store changes, keeping scroll position and focus. Pages marked static (e.g. the wizard) are never re-rendered.
  function refresh(force) {
    if (!cur || (cur.page.static && !force)) return;
    const ae = document.activeElement;
    const key = ae && ae.dataset && ae.dataset.focusKey;
    const id = ae && ae.id;
    const y = window.scrollY;
    try {
      cur.el.innerHTML = cur.page.render(cur.ctx);
      cur.page.after && cur.page.after(cur.el, cur.ctx);
    } catch (e) {
      App.reportError(e);
      return;
    }
    window.scrollTo(0, y);
    const again = (key && cur.el.querySelector(`[data-focus-key="${key}"]`)) || (id && document.getElementById(id));
    if (again && again.focus) {
      again.focus({ preventScroll: true });
      try {
        if (typeof again.value === 'string' && again.setSelectionRange && /^(text|search)$/.test(again.type))
          again.setSelectionRange(again.value.length, again.value.length);
      } catch (e) {
        /* not all inputs support selection */
      }
    }
  }

  function start() {
    window.addEventListener('hashchange', resolve);
    App.store.subscribe(() => {
      App.shell.onStore();
      refresh();
    });
    App.viewport.onChange(() => {
      if (cur && cur.page.onBreakpoint) refresh(true);
    });
    setInterval(() => {
      const ae = document.activeElement;
      if (App.modal.isOpen() || !App.auth.isIn() || (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))) return;
      App.actions.runAutomation();
      App.shell.onStore();
      refresh();
    }, 60000);
    resolve();
  }

  App.router = { start, go, replace, resolve, refresh, parseHash, current: () => cur };
})();
