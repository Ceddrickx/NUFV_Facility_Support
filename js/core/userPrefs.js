/* Per-user preferences (Preferences, Notification Settings, Privacy and Security). Saved inside the existing "settings" store key under settings.prefs[userId]. */
(function () {
  const App = (window.App = window.App || {});

  const DEFAULTS = {
    dateStyle: 'mdy',
    hour12: true,
    channels: { inApp: true, email: true },
    topics: { assigned: true, status: true, schedule: true, digest: false },
    digestWeek: '', // last week (Monday date) a weekly summary was created for this user
  };

  const S = () => App.store.state;
  const mineOf = (id) => (S().settings.prefs || {})[id] || {};
  // channels falls back to the old global settings.notify (saved by earlier builds) until the user changes them.
  const getFor = (id) => {
    const m = mineOf(id);
    return Object.assign({}, DEFAULTS, m, {
      channels: Object.assign({}, DEFAULTS.channels, S().settings.notify, m.channels),
      topics: Object.assign({}, DEFAULTS.topics, m.topics),
    });
  };
  const get = () => getFor(S().user);

  function setFor(id, patch) {
    const prefs = Object.assign({}, S().settings.prefs || {});
    const next = Object.assign({}, mineOf(id), patch);
    Object.keys(next).forEach((k) => {
      if (!(k in DEFAULTS)) delete next[k];
    }); // also drops retired keys saved by earlier builds (e.g. language)
    prefs[id] = next;
    S().settings.prefs = prefs;
    App.store.commit(['settings']);
    if (id === S().user) apply();
  }
  const set = (patch) => setFor(S().user, patch);

  // Drop keys saved by earlier builds for options that no longer exist (every account, once).
  function purgeRetired() {
    const prefs = S().settings.prefs;
    if (!prefs) return;
    let changed = false;
    Object.values(prefs).forEach((u) =>
      Object.keys(u).forEach((k) => {
        if (!(k in DEFAULTS)) {
          delete u[k];
          changed = true;
        }
      }),
    );
    if (changed) App.store.commit(['settings']);
  }

  // Push the saved choices into the date/time formatter.
  function apply() {
    if (!App.store.state) return;
    purgeRetired();
    const p = get();
    App.fmt.setFormat({ dateStyle: p.dateStyle, hour12: p.hour12 });
  }

  App.userPrefs = { DEFAULTS, get, getFor, set, setFor, apply };
})();
