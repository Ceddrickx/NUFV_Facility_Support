/* System clock: real time. DEMO_NOW is the moment the page loaded; seed data is built relative to it, so a data reset always looks current. */
(function () {
  const App = (window.App = window.App || {});
  const DEMO_NOW = Date.now();

  App.clock = {
    DEMO_NOW,
    now() {
      return Date.now();
    },
    setAdvance() {
      /* no-op: the clock is real time */
    },
    getAdvance() {
      return 0;
    },
  };
})();
