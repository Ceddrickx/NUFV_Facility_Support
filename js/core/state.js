/* Store: one source of truth, persisted to localStorage (prefix nuf_). Views subscribe and re-render on change.
   Safety: every storage call is wrapped in try/catch; a missing/different nuf_version or corrupt JSON reseeds instead of crashing.
   Never stored: file contents (blob/base64) and the demo Password field. */
(function () {
  const App = (window.App = window.App || {});
  // The data comes from the database workbook (database/NU_Facility_Support_DB.xlsx, built into js/data by
  // tools/build-data.py). The saved copy in the browser is only valid for the build it was seeded from, so the
  // version includes that build's stamp: every time the workbook is rebuilt the browser reseeds from it.
  const VERSION = '9.0-' + ((App.db && App.db.meta && App.db.meta.generatedAt) || 'dev');
  const PREFIX = 'nuf_';
  const KEYS = [
    'role',
    'user',
    'tickets',
    'notifications',
    'schedules',
    'theme',
    'settings',
    'auditLog',
    'users',
    'locations',
    'counters',
    'clock',
  ];

  const subs = new Set();
  let queued = false;
  const store = { state: null, session: {} };

  function lsGet(k) {
    try {
      const v = localStorage.getItem(PREFIX + k);
      return v === null ? null : JSON.parse(v);
    } catch (e) {
      return undefined;
    }
  }
  function lsSet(k, v) {
    try {
      localStorage.setItem(PREFIX + k, JSON.stringify(v));
      return true;
    } catch (e) {
      return false;
    }
  }
  function lsRaw() {
    try {
      return localStorage.getItem(PREFIX + 'version');
    } catch (e) {
      return null;
    }
  }

  function defaultSettings() {
    return {
      recurringThreshold: (App.db && App.db.config.recurringThreshold) || 5,
      notify: { email: true, inApp: true },
      prefs: {},
    };
  }

  function seedAll() {
    const tickets = App.seed.tickets();
    return {
      role: App.db.config.defaultRole,
      user: App.db.config.defaultUserId,
      theme: 'system',
      users: App.seed.users(),
      locations: App.seed.locations(),
      tickets,
      schedules: App.seed.schedules(tickets),
      notifications: App.seed.notifications(tickets),
      auditLog: App.seed.auditLog(tickets),
      counters: App.seed.counters(tickets),
      settings: defaultSettings(),
      clock: { advance: 0 },
    };
  }

  function load() {
    let s = null;
    if (lsRaw() === VERSION) {
      s = {};
      for (const k of KEYS) {
        const v = lsGet(k);
        if (v === null || v === undefined) {
          s = null;
          break;
        }
        s[k] = v;
      }
    }
    if (!s) {
      s = seedAll();
      store.state = s;
      saveAll();
    } else {
      store.state = s;
    }
    store.state.settings = Object.assign(defaultSettings(), store.state.settings);
    lsSet('settings', store.state.settings);
    return store.state;
  }

  function saveAll() {
    try {
      localStorage.setItem(PREFIX + 'version', VERSION);
    } catch (e) {
      /* ignore */
    }
    KEYS.forEach((k) => lsSet(k, store.state[k]));
  }

  // Persist the named keys then notify subscribers (batched per tick).
  function commit(keys) {
    (keys || KEYS).forEach((k) => lsSet(k, store.state[k]));
    if (queued) return;
    queued = true;
    Promise.resolve().then(() => {
      queued = false;
      subs.forEach((fn) => {
        try {
          fn();
        } catch (e) {
          App.reportError && App.reportError(e);
        }
      });
    });
  }
  function subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }
  function reset() {
    const keep = store.state ? { role: store.state.role, user: store.state.user } : null; // a demo-data reset must not sign anyone out or change their role
    store.state = seedAll();
    if (keep && keep.user) {
      store.state.role = keep.role;
      store.state.user = keep.user;
    }
    App.clock.setAdvance(0);
    saveAll();
    store.session = {};
    commit();
  }

  Object.assign(store, { load, commit, subscribe, reset, KEYS });
  App.store = store;
})();
