/* Bootstrap: auth flag, shell (sidebar / topbar / bottom nav), global error handler, role switching. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const S = () => App.store.state;

  /* ---------- auth ----------
     Only the email is kept (nuf_session). The password is never stored. The name, role and role label are always read back from the
     accounts list, so editing localStorage cannot change who you are or what you may open. */
  let memSession = null; // fallback when localStorage is unavailable
  const IDLE_MS = 30 * 60 * 1000; // signed out after 30 minutes without a click or key press
  const save = (s) => {
    memSession = s;
    try {
      localStorage.setItem('nuf_session', JSON.stringify(s));
    } catch (e) {
      /* ignore */
    }
  };
  App.auth = {
    expired: false,
    session() {
      let raw = memSession;
      try {
        const v = localStorage.getItem('nuf_session');
        raw = v ? JSON.parse(v) : null;
      } catch (e) {
        /* use the in-memory copy */
      }
      if (raw && !raw.at) {
        raw.at = Date.now(); // saved before expiry existed: start the clock now, do not sign out
        save(raw);
      }
      if (raw && Date.now() - raw.at > IDLE_MS) {
        App.auth.signOut();
        App.auth.expired = true;
        return null;
      }
      // Faculty domain was renamed: keep a saved faculty session signed in.
      if (raw && raw.email) raw.email = raw.email.replace('@professors.nu-fairview.edu.ph', '@faculty.nu-fairview.edu.ph');
      if (raw) memSession = raw; // keep a copy so touch() works after a page reload
      const acc = raw && App.accounts.byEmail(raw.email);
      return acc
        ? { email: acc.email, name: acc.name, role: acc.role, roleLabel: acc.roleLabel, userId: acc.userId }
        : null;
    },
    isIn() {
      return !!App.auth.session();
    },
    // acc comes from App.accounts.find(), so it has already passed the email and password check.
    signIn(acc) {
      App.auth.expired = false;
      save({ email: acc.email, at: Date.now() });
      try {
        localStorage.removeItem('nuf_auth');
      } catch (e) {
        /* ignore */
      }
      App.actions.setUser(acc.userId);
    },
    // Called on clicks and key presses; refreshes the idle clock at most once a minute.
    touch() {
      if (!memSession || Date.now() - memSession.at < 60000) return;
      save({ email: memSession.email, at: Date.now() });
    },
    signOut() {
      memSession = null;
      try {
        localStorage.removeItem('nuf_session');
        localStorage.removeItem('nuf_auth');
      } catch (e) {
        /* ignore */
      }
    },
  };

  /* ---------- theme: the system is light-only (NU palette); there is no theme choice ---------- */
  App.theme = {
    apply() {
      document.documentElement.dataset.theme = 'light';
      if (App.userPrefs) App.userPrefs.apply();
      document.dispatchEvent(new CustomEvent('nuf-theme'));
    },
  };

  /* ---------- errors: never break the page ---------- */
  let lastErr = 0;
  App.reportError = function (e, silent) {
    if (window.console && console.debug) console.debug('[nuf]', e);
    if (silent) return;
    if (Date.now() - lastErr > 2000) {
      lastErr = Date.now();
      App.toast.show('Unable to process the request.', 'error');
    }
  };
  window.addEventListener('error', (ev) => App.reportError(ev.error || ev.message));
  window.addEventListener('unhandledrejection', (ev) => App.reportError(ev.reason));

  /* ---------- shell ---------- */
  const shell = { mode: '' };
  const rootEl = () => document.getElementById('root');

  function shellHtml() {
    return `
      <div class="app" id="app-shell">
        <a class="skip-link" href="#main" data-act="skip">Skip to content</a>
        <header class="topbar" id="topbar"></header>
        <aside class="sidebar" id="sidebar" aria-label="Sidebar"></aside>
        <div class="sidebar-scrim" id="scrim" aria-hidden="true"></div>
        <div class="main-wrap">
          <main class="main" id="main" tabindex="-1"><div id="view"></div></main>
          <footer class="app-footer">NU Fairview Facility &amp; IT Maintenance Ticketing System &middot; Report. Track. Resolve.</footer>
        </div>
        <nav class="bottom-nav" id="bottom-nav" aria-label="Quick navigation"></nav>
        <div id="side-pop"><div class="dd-panel side-fly" id="dd-side-settings" role="menu" aria-label="Settings" hidden></div><div class="dd-panel side-fly" id="dd-side-user" role="menu" aria-label="Account" hidden></div></div>
        <div class="rail-tip" id="rail-tip" role="presentation" aria-hidden="true"></div>
      </div>`;
  }

  shell.ensure = function (signed, path) {
    const want = signed ? 'app' : 'plain';
    if (shell.mode !== want) {
      shell.mode = want;
      if (signed) {
        rootEl().innerHTML = shellHtml();
        document.body.classList.add('has-bottom-nav');
        App.topbar.registerDropdowns();
        App.nav.registerFlyouts();
        shell.renderAll(path);
        const bn = document.getElementById('bottom-nav');
        if (bn && window.ResizeObserver)
          new ResizeObserver(() => {
            const h = bn.offsetHeight;
            document.documentElement.style.setProperty('--bottom-nav-h', h ? `${h}px` : '');
          }).observe(bn);
        bind();
      } else {
        rootEl().innerHTML =
          '<main class="main" id="main" tabindex="-1" style="max-width:none;padding:0"><div id="view"></div></main>';
        document.body.classList.remove('has-bottom-nav');
      }
    } else if (signed) {
      shell.renderNav(path);
    }
    if (App.chatbot) App.chatbot.sync(); // floating assistant button: Student / Faculty only
  };

  shell.renderNav = function (path) {
    path = path || App.router.parseHash().path;
    const sb = document.getElementById('sidebar');
    if (sb) sb.innerHTML = App.nav.sidebar(path);
    const bn = document.getElementById('bottom-nav');
    if (bn) {
      bn.dataset.role = App.store.state.role;
      bn.innerHTML = App.nav.bottomNav(path);
    }
  };
  shell.renderAll = function (path) {
    if (App.userPrefs) App.userPrefs.apply();
    document.getElementById('topbar').innerHTML = App.topbar.render();
    shell.renderNav(path);
    App.topbar.updateBadge();
  };
  shell.updateTitle = function (title, route) {
    const t = document.getElementById('top-title');
    if (t) t.textContent = title;
    const c = document.getElementById('crumb');
    if (c) c.textContent = route && route.parent ? App.routes.routes.find((r) => r.path === route.parent).title : '';
    shell.renderNav();
    closeSidebar();
    if (App.chatbot) App.chatbot.sync();
  };
  shell.onStore = function () {
    if (shell.mode !== 'app') return;
    App.topbar.updateBadge();
    App.dropdown.refresh();
    if (App.chatbot) App.chatbot.sync();
    const sb = document.getElementById('sidebar');
    if (sb) sb.innerHTML = App.nav.sidebar(App.router.parseHash().path);
  };

  /* Sidebar drawer (all screen sizes). One class on #app-shell drives the slide-in, the dimmed/blurred scrim and the main-content scale-down. */
  const sidebarOpen = () => {
    const a = document.getElementById('app-shell');
    return !!a && a.classList.contains('sidebar-open');
  };
  function setSidebar(open, returnFocus) {
    const app = document.getElementById('app-shell'),
      sb = document.getElementById('sidebar'),
      mw = document.querySelector('.main-wrap');
    const mb = document.querySelector('[data-act="menu"]');
    if (!app || !sb) return;
    if (open === sidebarOpen()) return;
    app.classList.toggle('sidebar-open', open);
    sb.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    if (mw) {
      if (open) mw.setAttribute('inert', '');
      else mw.removeAttribute('inert');
    }
    if (mb) {
      mb.setAttribute('aria-expanded', String(open));
      mb.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    }
    if (open) {
      const f = sb.querySelector('a');
      f && f.focus({ preventScroll: true });
    } else if (returnFocus && mb) mb.focus({ preventScroll: true });
  }
  const closeSidebar = (returnFocus) => setSidebar(false, returnFocus === true);
  const openSidebar = () => setSidebar(true);

  /* Desktop rail (>= 1024px). The state is one class on #app-shell (side-expanded), which survives the sidebar's own re-renders.
     Hover-intent: expand only after the pointer has stayed for --side-open-delay; collapse --side-close-delay after it leaves.
     Both delays are real timers read from CSS (variables.css), so they still apply under prefers-reduced-motion. */
  const railMq = window.matchMedia('(min-width: 1024px)');
  const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');
  const shellEl = () => document.getElementById('app-shell');
  const railMode = () => railMq.matches;
  const isExpanded = () => {
    const a = shellEl();
    return !!a && a.classList.contains('side-expanded');
  };
  const cssMs = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseFloat(v);
    if (isNaN(n)) return fallback;
    return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n;
  };
  let openT = 0,
    closeT = 0,
    animT = 0,
    flipT = 0,
    flipMain = null,
    hoverIn = false,
    suppressOpen = false,
    manualExpanded = false;
  const focusWithin = () => {
    const f = document.activeElement;
    return !!(f && f.closest && f.closest('#sidebar') && f.matches(':focus-visible'));
  };

  function hideTip() {
    const t = document.getElementById('rail-tip');
    if (t) t.classList.remove('on');
  }
  function showTip(el) {
    const tip = document.getElementById('rail-tip'),
      host = el && el.closest ? el.closest('#sidebar [data-tip]') : null;
    if (!tip) return;
    if (!host || !railMode() || isExpanded()) {
      hideTip();
      return;
    }
    const r = host.getBoundingClientRect();
    tip.textContent = host.dataset.tip;
    tip.style.left = `${Math.round(r.right + 10)}px`;
    tip.style.top = `${Math.round(r.top + r.height / 2)}px`;
    tip.classList.add('on');
  }

  function clearRailFlip() {
    clearTimeout(flipT);
    if (flipMain) {
      flipMain.style.transition = '';
      flipMain.style.transform = '';
      flipMain.style.willChange = '';
      flipMain = null;
    }
  }

  function settleRail() {
    const app = shellEl();
    if (app) app.classList.remove('side-anim');
    clearRailFlip();
    window.dispatchEvent(new Event('resize'));
    try {
      if (window.Chart && Chart.instances) Object.values(Chart.instances).forEach((c) => c && c.resize && c.resize());
    } catch (e) {
      /* charts redraw on their own */
    }
  }
  function setExpanded(open) {
    const app = shellEl();
    if (!app || !railMode() || open === isExpanded()) return;
    clearTimeout(openT);
    clearTimeout(closeT);
    const ae = document.activeElement;
    const railOnly = ae && ae.closest ? ae.closest('.rail-only') : null;
    if (open) App.dropdown.close();
    hideTip();
    const main = document.querySelector('.main-wrap');
    const ticketPage = !!(main && main.querySelector('table[data-testid="ticket-table"]'));
    clearRailFlip();
    const beforeLeft = ticketPage ? main.getBoundingClientRect().left : 0;
    app.classList.add('side-anim');
    app.classList.toggle('side-expanded', open);
    if (ticketPage) {
      // The layout changes once, then the table is animated as a layer. This
      // avoids a full table reflow on every sidebar animation frame.
      const delta = beforeLeft - main.getBoundingClientRect().left;
      if (Math.abs(delta) > 1) {
        const duration = cssMs('--side-dur', 280);
        flipMain = main;
        main.style.willChange = 'transform';
        main.style.transition = 'none';
        main.style.transform = `translateX(${Math.round(delta)}px)`;
        requestAnimationFrame(() => {
          if (flipMain !== main) return;
          main.style.transition = `transform ${duration}ms var(--side-ease)`;
          main.style.transform = 'translateX(0)';
        });
        flipT = setTimeout(clearRailFlip, duration + 80);
      }
    }
    const mb = document.querySelector('[data-act="menu"]');
    if (mb) {
      mb.setAttribute('aria-expanded', String(open));
      mb.setAttribute('aria-label', open ? 'Collapse navigation' : 'Expand navigation');
    }
    if (open && railOnly) {
      // the rail-only buttons are replaced by the full links; keep keyboard focus inside the sidebar
      const next = railOnly.closest('.settings-group')
        ? document.querySelector('#sidebar .settings-group a')
        : document.querySelector('#sidebar [data-act="logout"]');
      if (next) next.focus({ preventScroll: true });
    }
    clearTimeout(animT);
    animT = setTimeout(settleRail, cssMs('--side-dur', 280) + 60);
  }
  function hoverEnter() {
    hoverIn = true;
    clearTimeout(closeT);
    if (!railMode() || isExpanded() || suppressOpen || !hoverMq.matches) return;
    clearTimeout(openT);
    openT = setTimeout(
      () => {
        if (hoverIn && !suppressOpen && !App.dropdown.isOpen()) setExpanded(true);
      },
      cssMs('--side-open-delay', 600),
    );
  }
  function hoverLeave() {
    hoverIn = false;
    suppressOpen = false;
    clearTimeout(openT);
    if (!isExpanded() || manualExpanded) return;
    clearTimeout(closeT);
    closeT = setTimeout(
      () => {
        if (!hoverIn && !focusWithin()) setExpanded(false);
      },
      cssMs('--side-close-delay', 300),
    );
  }
  const inSide = (n) => !!(n && n.closest && n.closest('#sidebar, #side-pop'));

  function logout() {
    const finish = () => {
      clearTimeout(openT);
      clearTimeout(closeT);
      hoverIn = false;
      App.auth.signOut();
      App.dropdown.close();
      closeSidebar();
      shell.mode = '';
      App.router.go('/login');
      if (location.hash === '#/login') App.router.resolve();
    };
    if (location.hash.replace(/^#/, '').split('?')[0] === '/report' && App.pages.reportIssue && !App.pages.reportIssue.requestLeave(finish)) return;
    finish();
  }

  // Where the sidebar and top-bar search send each role: its own ticket list.
  const searchRoute = () => (S().role === 'student' ? '/my-tickets' : S().role === 'it' ? '/it-tickets' : S().role === 'fmo' ? '/fmo-tickets' : '/tickets');

  let bound = false;
  function bind() {
    if (bound) {
      /* listeners live on #root, which persists */ return;
    }
    bound = true;
    rootEl().addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      const nid = e.target.closest('[data-nid]');
      if (nid) App.actions.markNotificationRead(nid.dataset.nid);
      if (railMode()) {
        // Clicking a rail icon means the user is already at their target: never expand on top of the click.
        if (e.target.closest('#sidebar a, #sidebar button')) {
          suppressOpen = true;
          clearTimeout(openT);
          hideTip();
        }
        // Touch has no hover: a tap on a link or outside the sidebar folds it back up.
        if (
          !hoverMq.matches &&
          isExpanded() &&
          (e.target.closest('#sidebar a[href]') || !e.target.closest('#sidebar, #side-pop, [data-act="menu"]'))
        )
          setExpanded(false);
      }
      if (!a) {
        if (e.target.id === 'scrim') closeSidebar(true);
        else if (e.target.closest('#sidebar a[href]')) closeSidebar(); // choosing a nav item closes the drawer, even when it is the current page
        return;
      }
      const act = a.dataset.act;
      if (act === 'skip') {
        e.preventDefault();
        const m = document.getElementById('main');
        if (m) {
          m.focus({ preventScroll: true });
          m.scrollIntoView();
        }
      } else if (act === 'menu') {
        if (railMode()) {
          // A click creates a persistent desktop state. Hover may still open
          // the rail temporarily, but it must not close a click-opened rail.
          manualExpanded = !isExpanded();
          clearTimeout(closeT);
          setExpanded(manualExpanded);
        }
        else sidebarOpen() ? closeSidebar(true) : openSidebar();
      } else if (act === 'more') App.nav.openMore();
      else if (act === 'logout') logout();
      else if (act === 'reset') {
        closeSidebar();
        App.dropdown.close();
        App.modal.confirm({
          title: 'Reset demo data?',
          body: '<p>All tickets, notifications and settings return to the original data. You stay signed in.</p>',
          okLabel: 'Reset',
          danger: true,
          onOk: () => {
            App.toast.fromResult(App.actions.resetDemoData());
            App.theme.apply();
            shell.renderAll();
            App.router.go('/dashboard');
            App.router.resolve();
          },
        });
      } else if (act === 'read-all') App.toast.fromResult(App.actions.markAllRead());
      else if (act === 'search') {
        const r = searchRoute();
        App.router.go(r);
        setTimeout(() => {
          const i = document.querySelector('[data-testid="ticket-search"]');
          i && i.focus();
        }, 200);
      }
    });
    rootEl().addEventListener('submit', (e) => {
      if (e.target.dataset.act === 'gsearch') {
        e.preventDefault();
        const q = e.target.querySelector('input').value.trim();
        const r = searchRoute();
        App.store.session.filters = App.store.session.filters || {};
        delete App.store.session.filters[
          r === '/my-tickets' ? 'my' : `${r === '/it-tickets' ? 'it' : r === '/fmo-tickets' ? 'fmo' : 'all'}-${S().role}`
        ];
        App.router.go(`${r}?q=${encodeURIComponent(q)}`);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideTip();
      if (e.key === 'Escape' && !App.modal.isOpen() && sidebarOpen()) closeSidebar(true);
    });
    // Rail: hover-intent, keyboard expand, tooltips. Delegated on #root so they survive the sidebar's re-renders.
    rootEl().addEventListener('mouseover', (e) => {
      // Compare against where the pointer is now, not only mouseout events: the sidebar re-renders on navigation and a removed node never fires mouseout.
      const now = inSide(e.target);
      if (now && !hoverIn) hoverEnter();
      else if (!now && hoverIn) hoverLeave();
      if (e.target.closest && e.target.closest('#sidebar')) showTip(e.target);
      else hideTip();
    });
    rootEl().addEventListener('mouseout', (e) => {
      if (!inSide(e.target)) return;
      if (!inSide(e.relatedTarget)) hoverLeave();
      if (!(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#sidebar [data-tip]'))) hideTip();
    });
    rootEl().addEventListener('focusin', (e) => {
      if (!railMode() || !(e.target.closest && e.target.closest('#sidebar'))) return;
      if (e.target.matches(':focus-visible')) {
        clearTimeout(openT);
        clearTimeout(closeT);
        setExpanded(true);
      }
      showTip(e.target);
    });
    rootEl().addEventListener('focusout', (e) => {
      if (!(e.target.closest && e.target.closest('#sidebar'))) return;
      hideTip();
      if (inSide(e.relatedTarget) || !isExpanded() || hoverIn) return;
      clearTimeout(closeT);
      closeT = setTimeout(
        () => {
          if (!hoverIn && !focusWithin()) setExpanded(false);
        },
        cssMs('--side-close-delay', 300),
      );
    });
    const onRailChange = () => {
      clearTimeout(openT);
      clearTimeout(closeT);
      clearTimeout(animT);
      hoverIn = false;
      suppressOpen = false;
      manualExpanded = false;
      const app = shellEl();
      if (app) app.classList.remove('side-expanded', 'side-anim');
      if (railMq.matches) closeSidebar();
      App.dropdown.close();
      hideTip();
    };
    if (railMq.addEventListener) railMq.addEventListener('change', onRailChange);
    else railMq.addListener(onRailChange);
    // The sidebar drawer traps focus while open. Delegated, so it survives shell rebuilds.
    rootEl().addEventListener('keydown', (e) => {
      const sb = e.target.closest('#sidebar');
      if (!sb || e.key !== 'Tab' || !sb.classList.contains('open')) return;
      const f = [...sb.querySelectorAll('a,button,input')].filter((x) => x.offsetParent !== null);
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
        e.preventDefault();
        f[0].focus();
      }
    });
  }

  App.shell = shell;

  function init() {
    // Keep mobile overscroll from exposing blank bands or introducing sideways page drift.
    document.documentElement.style.overflowX = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflowX = 'hidden';
    const compactFooter = window.matchMedia && window.matchMedia('(max-width: 479px)');
    const syncCompactFooter = () => {
      const footer = document.querySelector('.app-footer');
      if (footer) footer.hidden = !!compactFooter.matches || document.body.classList.contains('has-bottom-nav');
      const tabWrap = document.querySelector('[data-settings-tabs]');
      const sectionSelect = document.querySelector('.settings-mobile-section');
      if (tabWrap) tabWrap.hidden = true;
      if (sectionSelect) sectionSelect.hidden = false;
    };
    syncCompactFooter();
    compactFooter && compactFooter.addEventListener && compactFooter.addEventListener('change', syncCompactFooter);
    new MutationObserver(syncCompactFooter).observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    App.store.load();
    App.theme.apply();
    App.viewport.init();
    App.dropdown.init();
    App.actions.runAutomation();
    App.chatbot && App.chatbot.init && App.chatbot.init();
    App.router.start();
    setTimeout(syncCompactFooter, 0);
    // Idle sign-out: activity keeps the session alive; a timer and tab focus catch an expired one.
    ['pointerdown', 'keydown'].forEach((t) => rootEl().addEventListener(t, () => App.auth.touch(), true));
    const checkIdle = () => {
      if (shell.mode === 'app' && !App.auth.session()) logout();
    };
    setInterval(checkIdle, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) checkIdle();
    });
  }
  init();
})();
